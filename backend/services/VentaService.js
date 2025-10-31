// backend/services/VentaService.js
const pool = require('../config/db');
const VentaRepo = require('../repositories/VentaRepo');
const ProductoRepo = require('../repositories/ProductoRepo');
const { calcularCostoEnvioProveedor } = require('./envioRules');

// Helper: si pago=pagada y envío=recibido => estado_venta=finalizada
async function finalizeIfCompleted(conn, ventaId) {
  const [rows] = await conn.query(
    `SELECT estado_pago, estado_envio, estado_venta FROM ventas WHERE id = ? FOR UPDATE`,
    [ventaId]
  );
  if (!rows.length) return;
  const v = rows[0];
  const pagoPagado   = String(v.estado_pago).toLowerCase() === 'pagada';
  const envioRecib   = String(v.estado_envio).toLowerCase() === 'recibido';
  const yaFinalizada = String(v.estado_venta).toLowerCase() === 'finalizada';
  if (pagoPagado && envioRecib && !yaFinalizada) {
    await conn.query(`UPDATE ventas SET estado_venta = 'finalizada' WHERE id = ?`, [ventaId]);
  }
}

class VentaService {
  // ... (todo lo demás igual)

  static async create(data, conn = null) {
    const ownConn = !conn;
    if (ownConn) conn = await pool.getConnection();
    try {
      if (ownConn) await conn.beginTransaction();

      const codigo = await VentaRepo.generarCodigo(conn, true); // con ceros

     // 1) Totales (BRUTO)
let totalVenta = 0;
const lineas = (data.lineas || []).map(ln => {
  const cantidad = +ln.cantidad || 0;
  const pu       = +ln.precio_unitario || 0;
  const desc     = +ln.descuento || 0; // porcentaje
  const subtotal = cantidad * pu * (1 - (desc / 100)); // ✅ descuento como %
  totalVenta += subtotal;
  return { ...ln, cantidad, pu, desc, subtotal };
});

      // 2) Comisión del transportista (según reglas)
      const comision = await calcularCostoEnvioProveedor({
        transportista_id: data.transportista_id || null,
        metodo_pago: data.metodo_pago || 'transferencia',
        total_venta: totalVenta
      });

      // 3) Cabecera (guardamos BRUTO + COMISIÓN)
      const ventaId = await VentaRepo.insertCabecera(conn, {
        codigo,
        cliente_id:   data.cliente_id,
        fecha:        new Date(),
        total_venta:  +totalVenta.toFixed(2),   // BRUTO
        usuario_id:   data.usuario_id,
        metodo_pago:  data.metodo_pago  || 'transferencia',
        estado_envio: data.estado_envio || 'pendiente_envio',
        estado_pago:  data.estado_pago  || 'pendiente_pago',
        estado_venta: data.estado_venta || 'activa',
        transportista_id: data.transportista_id || null,
        comision_transportista: +Number(comision || 0).toFixed(2)
      });

      // 4) Detalle + historial + stock si pagada
      for (const ln of lineas) {
        let qty = ln.cantidad;
        while (qty > 0) {
          const [rows] = await conn.query(
            `SELECT id, cantidad_restante, precio_unitario AS costo_lote
               FROM detalle_compra
              WHERE producto_id = ? AND cantidad_restante > 0
              ORDER BY orden_compra_id, id
              LIMIT 1`,
            [ln.producto_id]
          );
          if (!rows.length) throw new Error(`Sin stock para producto ${ln.producto_id}`);
          const lote = rows[0];
          const take = Math.min(lote.cantidad_restante, qty);

          await conn.query(
            `UPDATE detalle_compra SET cantidad_restante = cantidad_restante - ? WHERE id = ?`,
            [take, lote.id]
          );
          qty -= take;

          await VentaRepo.insertDetalle(conn, {
            venta_id:        ventaId,
            producto_id:     ln.producto_id,
            cantidad:        take,
            precio_unitario: ln.pu,
            descuento:       ln.descuento || 0,
              subtotal:        take * ln.pu * (1 - (ln.descuento || 0) / 100),
            costo_unitario:  lote.costo_lote,
            origen_lote_id:  lote.id
          });

          await VentaRepo.insertHistorial(conn, {
            id_producto:          ln.producto_id,
            id_venta:             ventaId,
            tipo_transaccion:     'venta',
            precio_transaccion:   ln.pu * take,
            cantidad_transaccion: take
          });

          if ((data.estado_pago || '').toLowerCase() === 'pagada') {
            await ProductoRepo.adjustStock(conn, ln.producto_id, -take);
          }
        }
      }

      await finalizeIfCompleted(conn, ventaId);

      if (ownConn) { await conn.commit(); conn.release(); }

      return {
        id: ventaId,
        codigo,
        cliente_id: data.cliente_id,
        total_venta: +totalVenta.toFixed(2),
        comision_transportista: +Number(comision || 0).toFixed(2)
      };
    } catch (err) {
      if (ownConn) { await conn.rollback(); conn.release(); }
      throw err;
    }
  }

  // ... update / getById / delete / cancel: SIN CAMBIOS

  static async listAll({ page = 1, limit = 10 } = {}) {
    return VentaRepo.findAll({ page, limit });
  }

  static async getById(id) {
    const cab = await VentaRepo.fetchCabecera(id);
    if (!cab) { const e = new Error('Venta no encontrada'); e.statusCode = 404; throw e; }
    const lineas = await VentaRepo.fetchLineas(id);
    return { ...cab, lineas };
  }
static async update(id, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 0) Traer cabecera + detalle actual
    const oldCab = await VentaRepo.fetchCabecera(id);
    if (!oldCab) {
      const e = new Error('Venta no encontrada');
      e.statusCode = 404;
      throw e;
    }
    const oldLineas = await VentaRepo.fetchLineas(id);

    // --- Estados correctos (basados en columnas reales) ---
    const estabaPagada = String(oldCab.estado_pago || '').toLowerCase() === 'pagada';

    // Normalizamos entradas nuevas
    const nuevasLineasEntrada = Array.isArray(data.lineas) ? data.lineas : [];
    const nuevoMetodoPago      = data.metodo_pago      ?? oldCab.metodo_pago      ?? 'transferencia';
    const nuevoEstadoEnvio     = data.estado_envio     ?? oldCab.estado_envio     ?? 'pendiente_envio';
    const nuevoEstadoPago      = data.estado_pago      ?? oldCab.estado_pago      ?? 'pendiente_pago';
    const nuevoEstadoVenta     = data.estado_venta     ?? oldCab.estado_venta     ?? 'activa';
    const nuevoTransportistaId = data.transportista_id ?? oldCab.transportista_id ?? null;

    const nuevaPagada = String(nuevoEstadoPago).toLowerCase() === 'pagada';

    // 1) Determinar productos a bloquear (viejos + nuevos)
    const productosLock = [
      ...new Set([
        ...oldLineas.map(l => l.producto_id),
        ...nuevasLineasEntrada.map(l => l.producto_id),
      ])
    ];
    if (productosLock.length) {
      await conn.query(
        `SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`,
        [productosLock]
      );
    }

    // 2) Revertir lotes e inventario de la venta anterior
    // 2a) Reversión por origen_lote_id si existe
    const [rowsDV] = await conn.query(
      `SELECT producto_id, origen_lote_id, cantidad
         FROM detalle_venta
        WHERE venta_id = ?`,
      [id]
    );

    if (rowsDV.length) {
      for (const dv of rowsDV) {
        if (dv.origen_lote_id) {
          await conn.query(
            `UPDATE detalle_compra
                SET cantidad_restante = cantidad_restante + ?
              WHERE id = ?`,
            [dv.cantidad, dv.origen_lote_id]
          );
        }
      }
    } else if (oldLineas.length) {
      // Fallback FIFO inverso si no hay origen_lote_id
      for (const ln of oldLineas) {
        let qty = ln.cantidad;
        while (qty > 0) {
          const [rows] = await conn.query(
            `SELECT id, cantidad_restante, cantidad AS orig
               FROM detalle_compra
              WHERE producto_id = ? AND cantidad_restante < cantidad
              ORDER BY orden_compra_id DESC, id DESC
              LIMIT 1`,
            [ln.producto_id]
          );
          if (!rows.length) break;
          const lote = rows[0];
          const espacioConsumido = lote.orig - lote.cantidad_restante;
          const devolver = Math.min(espacioConsumido, qty);
          await conn.query(
            `UPDATE detalle_compra
                SET cantidad_restante = cantidad_restante + ?
              WHERE id = ?`,
            [devolver, lote.id]
          );
          qty -= devolver;
        }
      }
    }

    // 2b) Devolver stock global solo si la venta anterior estaba pagada
    if (estabaPagada) {
      for (const ln of oldLineas) {
        await ProductoRepo.adjustStock(conn, ln.producto_id, ln.cantidad);
      }
    }

    // 3) Limpiar detalle e historial anteriores
    await VentaRepo.deleteHistorial(conn, id);
    await VentaRepo.deleteDetalle(conn, id);

   // 4) Calcular nuevas líneas y total
let totalVenta = 0;
const nuevasLineas = nuevasLineasEntrada.map(ln => {
  const cantidad = +ln.cantidad || 0;
  const pu       = +ln.precio_unitario || 0;
  const desc     = +ln.descuento || 0;  // porcentaje
  const subtotal = cantidad * pu * (1 - (desc / 100)); // ✅ aplica descuento %
  totalVenta    += subtotal;
  return {
    producto_id: ln.producto_id,
    cantidad,
    pu,
    descuento: desc,
    subtotal
  };
});
totalVenta = +Number(totalVenta).toFixed(2);

    // 4.b) Recalcular comisión del transportista con los valores NUEVOS
    const comision = await calcularCostoEnvioProveedor({
      transportista_id: nuevoTransportistaId,
      metodo_pago: nuevoMetodoPago,
      total_venta: totalVenta
    });
    const comisionRedondeada = +Number(comision || 0).toFixed(2);

    // 5) Actualizar cabecera de la venta (incluye transportista y comisión)
    await conn.query(
      `UPDATE ventas
          SET codigo                 = ?,
              cliente_id             = ?,
              metodo_pago            = ?,
              estado_envio           = ?,
              estado_pago            = ?,
              estado_venta           = ?,
              total_venta            = ?,
              transportista_id       = ?,
              comision_transportista = ?
        WHERE id = ?`,
      [
        data.codigo ?? oldCab.codigo,
        data.cliente_id ?? oldCab.cliente_id,
        nuevoMetodoPago,
        nuevoEstadoEnvio,
        nuevoEstadoPago,
        nuevoEstadoVenta,
        totalVenta,
        nuevoTransportistaId,
        comisionRedondeada,
        id
      ]
    );

    // 6) Insertar nuevo detalle por lotes (FIFO), historial y ajustar stock si nueva venta queda pagada
    for (const ln of nuevasLineas) {
      let qtyPend = ln.cantidad;

      while (qtyPend > 0) {
        const [rows] = await conn.query(
          `SELECT id, cantidad_restante, precio_unitario AS costo_lote
             FROM detalle_compra
            WHERE producto_id = ? AND cantidad_restante > 0
            ORDER BY orden_compra_id, id
            LIMIT 1`,
          [ln.producto_id]
        );

        if (!rows.length) {
          throw new Error(`Sin stock para producto ${ln.producto_id}`);
        }

        const lote = rows[0];
        const take = Math.min(lote.cantidad_restante, qtyPend);

        // Consumir del lote
        await conn.query(
          `UPDATE detalle_compra
              SET cantidad_restante = cantidad_restante - ?
            WHERE id = ?`,
          [take, lote.id]
        );

        // Guardar línea por lote (con origen_lote_id)
        const subtotalParcial = take * ln.pu * (1 - (ln.descuento || 0) / 100);

await VentaRepo.insertDetalle(conn, {
  venta_id:        id,
  producto_id:     ln.producto_id,
  cantidad:        take,
  precio_unitario: ln.pu,
  descuento:       ln.descuento || 0, // ✅ guarda el porcentaje real
  subtotal:        subtotalParcial,
  costo_unitario:  lote.costo_lote,
  origen_lote_id:  lote.id
});


        // Historial
        await VentaRepo.insertHistorial(conn, {
          id_producto:          ln.producto_id,
          id_venta:             id,
          tipo_transaccion:     'venta',
          precio_transaccion:   subtotalParcial,
          cantidad_transaccion: take
        });

        // Ajustar inventario si la nueva venta queda pagada
        if (nuevaPagada) {
          await ProductoRepo.adjustStock(conn, ln.producto_id, -take);
        }

        qtyPend -= take;
      }
    }

    // 7) Intentar finalizar automáticamente si corresponde
    await finalizeIfCompleted(conn, id);

    await conn.commit();
    conn.release();

    return {
      id,
      codigo: data.codigo ?? oldCab.codigo,
      cliente_id: data.cliente_id ?? oldCab.cliente_id,
      metodo_pago: nuevoMetodoPago,
      estado_envio: nuevoEstadoEnvio,
      estado_pago: nuevoEstadoPago,
      estado_venta: nuevoEstadoVenta,
      total_venta: totalVenta,
      transportista_id: nuevoTransportistaId,
      comision_transportista: comisionRedondeada
    };

  } catch (err) {
    try { await conn.rollback(); } catch {}
    try { conn.release(); } catch {}
    throw err;
  }
}



  static async delete(id) {
    // (sin cambios)
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cab = await VentaRepo.fetchCabecera(id);
      if (!cab) throw new Error('Venta no encontrada');

      const lineas = await VentaRepo.fetchLineas(id);
      const productos = [...new Set(lineas.map(l => l.producto_id))];
      if (productos.length) {
        await conn.query(`SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`, [productos]);
      }

      for (const ln of lineas) {
        let qty = ln.cantidad;
        while (qty > 0) {
          const [rows] = await conn.query(
            `SELECT id, cantidad_restante, cantidad AS orig
               FROM detalle_compra
              WHERE producto_id = ? AND cantidad_restante < cantidad
              ORDER BY orden_compra_id DESC, id DESC
              LIMIT 1`,
            [ln.producto_id]
          );
          if (!rows.length) break;
          const lote = rows[0];
          const espacio = lote.orig - lote.cantidad_restante;
          const dev = Math.min(espacio, qty);
          await conn.query(`UPDATE detalle_compra SET cantidad_restante = cantidad_restante + ? WHERE id = ?`, [dev, lote.id]);
          qty -= dev;
        }
        if ((cab.estado_pago || '').toLowerCase() === 'pagada') {
          await ProductoRepo.adjustStock(conn, ln.producto_id, ln.cantidad);
        }
      }

      await VentaRepo.deleteHistorial(conn, id);
      await VentaRepo.deleteDetalle(conn, id);
      await VentaRepo.deleteCabecera(conn, id);

      await conn.commit();
      conn.release();
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  static async cancel(id) {
    // (sin cambios)
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cab = await VentaRepo.fetchCabecera(id);
      if (!cab) throw new Error('Venta no encontrada');
      if ((cab.estado_venta || '').toLowerCase() === 'cancelada') {
        throw new Error('La venta ya está cancelada');
      }

      const lineas = await VentaRepo.fetchLineas(id);
      const productos = [...new Set(lineas.map(l => l.producto_id))];
      if (productos.length) {
        await conn.query(`SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`, [productos]);
      }

      if ((cab.estado_pago || '').toLowerCase() === 'pagada') {
        for (const ln of lineas) {
          let qty = ln.cantidad;
          while (qty > 0) {
            const [rows] = await conn.query(
              `SELECT id, cantidad_restante, cantidad AS orig
                 FROM detalle_compra
                WHERE producto_id = ? AND cantidad_restante < cantidad
                ORDER BY orden_compra_id DESC, id DESC
                LIMIT 1`,
              [ln.producto_id]
            );
            if (!rows.length) break;
            const lote = rows[0];
            const espacio = lote.orig - lote.cantidad_restante;
            const dev = Math.min(espacio, qty);
            await conn.query(`UPDATE detalle_compra SET cantidad_restante = cantidad_restante + ? WHERE id = ?`, [dev, lote.id]);
            qty -= dev;
          }
          await ProductoRepo.adjustStock(conn, ln.producto_id, ln.cantidad);

          await VentaRepo.insertHistorial(conn, {
            id_producto:          ln.producto_id,
            id_venta:             id,
            tipo_transaccion:     'cancelacion',
            precio_transaccion:   0,
            cantidad_transaccion: ln.cantidad
          });
        }
      }

      await conn.query(`UPDATE ventas SET estado_venta = 'cancelada' WHERE id = ?`, [id]);

      await conn.commit();
      conn.release();
      return { id, estado_venta: 'cancelada' };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

 static async search(filters) {
  const { codigo, fecha, estado_envio, page = 1, limit = 10 } = filters || {};
  return VentaRepo.search({ codigo, fecha, estado_envio, page, limit }); // <-- pasa estado_envio
}
}
VentaService.finalizeIfCompleted = finalizeIfCompleted;
module.exports = VentaService;
