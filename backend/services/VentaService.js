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
        const desc     = +ln.descuento || 0;
        const subtotal = cantidad * pu - desc;
        totalVenta += subtotal;
        return { ...ln, cantidad, pu, subtotal };
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
            subtotal:        take * ln.pu - (ln.descuento || 0),
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
    const { codigo, fecha, page = 1, limit = 10 } = filters || {};
    return VentaRepo.search({ codigo, fecha, page, limit });
  }
}

module.exports = VentaService;
