// backend/services/VentaService.js
const pool = require('../config/db');
const VentaRepo = require('../repositories/VentaRepo');
const ProductoRepo = require('../repositories/ProductoRepo');

class VentaService {
  static async create(data, conn = null) {
  const ownConn = !conn;
  if (ownConn) conn = await pool.getConnection();
  try {
    if (ownConn) await conn.beginTransaction();

    // 1) Calcular totales generales
    let totalVenta = 0;
    const lineas = data.lineas.map(ln => {
      const cantidad = +ln.cantidad || 0;
      const pu       = +ln.precio_unitario || 0;
      const desc     = +ln.descuento || 0;
      const subtotal = cantidad * pu - desc;
      totalVenta += subtotal;
      return { ...ln, cantidad, pu, subtotal };
    });

    // 2) Insertar cabecera
    const ventaId = await VentaRepo.insertCabecera(conn, {
      codigo:      data.codigo,
      cliente_id:  data.cliente_id,
      fecha:       new Date(),
      estado:      data.estado || 'pendiente',
      total_venta: totalVenta,
      usuario_id:  data.usuario_id
    });

    // 3) Procesar cada línea con lotes por separado
    for (const ln of lineas) {
      let qty = ln.cantidad;

      while (qty > 0) {
        // a) Buscar el lote más antiguo con stock
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

        // b) Actualizar stock del lote
        await conn.query(
          `UPDATE detalle_compra
             SET cantidad_restante = cantidad_restante - ?
           WHERE id = ?`,
          [take, lote.id]
        );

        qty -= take;

        // c) Insertar línea individual de detalle_venta con costo real
        await VentaRepo.insertDetalle(conn, {
          venta_id:        ventaId,
          producto_id:     ln.producto_id,
          cantidad:        take,
          precio_unitario: ln.pu,
          descuento:       ln.descuento || 0,
          subtotal:        take * ln.pu - (ln.descuento || 0),
          costo_unitario:  lote.costo_lote,
          origen_lote_id:  lote.id
        });

        // d) Registrar en historial de transacciones
        await VentaRepo.insertHistorial(conn, {
          id_producto:          ln.producto_id,
          id_venta:             ventaId,
          tipo_transaccion:     'venta',
          precio_transaccion:   ln.pu * take,
          cantidad_transaccion: take
        });

        // e) Ajustar stock global si es pagada
        if (data.estado === 'pagada') {
          await ProductoRepo.adjustStock(conn, ln.producto_id, -take);
        }
      }
    }

    if (ownConn) {
      await conn.commit();
      conn.release();
    }

    return {
      id: ventaId,
      codigo: data.codigo,
      cliente_id: data.cliente_id,
      total_venta: totalVenta
    };
  } catch (err) {
    if (ownConn) {
      await conn.rollback();
      conn.release();
    }
    throw err;
  }
}

  static async listAll() {
    return VentaRepo.findAll();
  }

  static async getById(id) {
    const cab = await VentaRepo.fetchCabecera(id);
    if (!cab) {
      const e = new Error('Venta no encontrada'); e.statusCode = 404;
      throw e;
    }
    const lineas = await VentaRepo.fetchLineas(id);
    return { ...cab, lineas };
  }

  // backend/services/VentaService.js
static async update(id, data) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Cargar venta antigua y bloquear lotes
    const oldCab    = await VentaRepo.fetchCabecera(id);
    const oldLineas = await VentaRepo.fetchLineas(id);
    const productos = [...new Set(oldLineas.map(l => l.producto_id))];
    if (productos.length) {
      await conn.query(
        `SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`,
        [productos]
      );
    }

    // 2) Revertir FIFO inverso + stock global
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
        const espacio = lote.orig - lote.cantidad_restante;
        const dev = Math.min(espacio, qty);
        await conn.query(
          `UPDATE detalle_compra
             SET cantidad_restante = cantidad_restante + ?
           WHERE id = ?`,
          [dev, lote.id]
        );
        qty -= dev;
      }
      if (oldCab.estado === 'pagada') {
        await ProductoRepo.adjustStock(conn, ln.producto_id, ln.cantidad);
      }
    }

    // 3) Borrar detalle e historial antiguos
    await VentaRepo.deleteHistorial(conn, id);
    await VentaRepo.deleteDetalle(conn, id);

    // 4) Recalcular totales y actualizar cabecera
    let totalVenta = 0;
    const nuevas = data.lineas.map(ln => {
      const cantidad = +ln.cantidad || 0;
      const pu       = +ln.precio_unitario || 0;
      const desc     = +ln.descuento || 0;
      const subtotal = cantidad * pu - desc;
      totalVenta   += subtotal;
      return { ...ln, cantidad, pu, subtotal };
    });

    await conn.query(
      `UPDATE ventas
         SET codigo      = ?,
             cliente_id  = ?,
             estado      = ?,
             total_venta = ?
       WHERE id = ?`,
      [data.codigo, data.cliente_id, data.estado || 'pendiente', totalVenta, id]
    );

    // 5) Reinsertar nuevas líneas con FIFO directo + historial + stock
    for (const ln of nuevas) {
      let qty = ln.cantidad, costoAcum = 0, unidades = 0;
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
          `UPDATE detalle_compra
             SET cantidad_restante = cantidad_restante - ?
           WHERE id = ?`,
          [take, lote.id]
        );
        costoAcum += take * lote.costo_lote;
        unidades  += take;
        qty       -= take;
      }
      const costoUnitario = unidades ? +(costoAcum/unidades).toFixed(2) : 0;

      // usa el mismo id
      await VentaRepo.insertDetalle(conn, {
        venta_id:        id,
        producto_id:     ln.producto_id,
        cantidad:        ln.cantidad,
        precio_unitario: ln.pu,
        descuento:       ln.descuento || 0,
        subtotal:        ln.subtotal,
        costo_unitario:  costoUnitario
      });

      await VentaRepo.insertHistorial(conn, {
        id_producto:         ln.producto_id,
        id_venta:            id,
        tipo_transaccion:    'venta',
        precio_transaccion:  ln.pu * ln.cantidad,
        cantidad_transaccion: ln.cantidad
      });

      if (data.estado === 'pagada') {
        await ProductoRepo.adjustStock(conn, ln.producto_id, -ln.cantidad);
      }
    }

    await conn.commit();
    conn.release();
    return { id, codigo: data.codigo, cliente_id: data.cliente_id, total_venta: totalVenta };
  } catch (err) {
    await conn.rollback();
    conn.release();
    throw err;
  }
}


  static async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cab    = await VentaRepo.fetchCabecera(id);
      const lineas = await VentaRepo.fetchLineas(id);
      const productos = [...new Set(lineas.map(l => l.producto_id))];
      if (productos.length) {
        await conn.query(
          `SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`,
          [productos]
        );
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
          await conn.query(
            `UPDATE detalle_compra
               SET cantidad_restante = cantidad_restante + ?
             WHERE id = ?`,
            [dev, lote.id]
          );
          qty -= dev;
        }
        if (cab.estado === 'pagada') {
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
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const cab = await VentaRepo.fetchCabecera(id);
      if (!cab) throw new Error('Venta no encontrada');
      if (cab.estado !== 'pagada') throw new Error('Sólo se pueden cancelar ventas pagadas');

      const lineas = await VentaRepo.fetchLineas(id);
      const productos = [...new Set(lineas.map(l => l.producto_id))];
      if (productos.length) {
        await conn.query(
          `SELECT id FROM detalle_compra WHERE producto_id IN (?) FOR UPDATE`,
          [productos]
        );
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
          await conn.query(
            `UPDATE detalle_compra
               SET cantidad_restante = cantidad_restante + ?
             WHERE id = ?`,
            [dev, lote.id]
          );
          qty -= dev;
        }
        await ProductoRepo.adjustStock(conn, ln.producto_id, ln.cantidad);

        await VentaRepo.insertHistorial(conn, {
          id_producto:         ln.producto_id,
          id_venta:            id,
          tipo_transaccion:    'cancelacion',
          precio_transaccion:  0,
          cantidad_transaccion: ln.cantidad
        });
      }

      // Solo actualizamos el estado
      await conn.query(
        `UPDATE ventas
           SET estado = 'cancelada'
         WHERE id = ?`,
        [id]
      );

      await conn.commit();
      conn.release();
      return { id, estado: 'cancelada' };
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }
 
static async search(filters) {
  // filters: { codigo, fecha }
  return VentaRepo.search(filters);
}

}

module.exports = VentaService;
