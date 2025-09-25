// backend/services/OrdenCompraService.js
const pool = require('../config/db');
const OrdenCompraRepo = require('../repositories/OrdenCompraRepo');

function sortIds(ids) {
  return Array.from(ids).map(id => Number(id)).sort((a, b) => a - b);
}

class OrdenCompraService {
  static _prepararLineas(lineas) {
    let totalOrden = 0;
    const lineasConSub = lineas.map(ln => {
      const cantidad = Number(ln.cantidad);
      const pu = parseFloat(ln.precio_unitario);
      const imp = parseFloat(ln.impuesto) || 0;
      const lib = parseFloat(ln.libraje) || 0;
      const desc = parseFloat(ln.descuento) || 0;
      const subtotal = cantidad * pu + imp + lib - desc;
      totalOrden += subtotal;
      return { ...ln, cantidad, subtotal };
    });
    return { totalOrden, lineasConSub };
  }

  static async search(filters) {
    return OrdenCompraRepo.search(filters); // legacy sin paginar
  }

  // === NUEVO: lista paginada ===
  static async listPaginated({ page = 1, pageSize = 10 }) {
    const offset = (page - 1) * pageSize;
    const [rows] = await pool.query(
      `SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
              oc.fecha, oc.estado, oc.total_orden
         FROM ordenes_compra oc
         JOIN proveedores p ON oc.proveedor_id = p.id
        ORDER BY oc.fecha DESC
        LIMIT ? OFFSET ?`,
      [Number(pageSize), Number(offset)]
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ordenes_compra`
    );

    const total = Number(countRow.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return { data: rows, pagination: { page, pageSize, total, totalPages } };
  }

  // === NUEVO: búsqueda paginada ===
  static async searchPaginated(filters, { page = 1, pageSize = 10 }) {
    const { rows, total } = await OrdenCompraRepo.searchPaginated(filters, { page, pageSize });
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { data: rows, pagination: { page, pageSize, total, totalPages } };
  }

  static async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { totalOrden, lineasConSub } = this._prepararLineas(data.lineas);
      const ordenId = await OrdenCompraRepo.insertCabecera(conn, {
        codigo: data.codigo,
        proveedor_id: data.proveedor_id,
        fecha: new Date(),
        estado: data.estado,
        total: totalOrden
      });

      // Ajuste de stock: procesar en orden ascendente de producto_id
      const newMap = Object.fromEntries(lineasConSub.map(ln => [ln.producto_id, ln.cantidad]));
      const ids = sortIds(Object.keys(newMap));
      if (data.estado === 'recibida') {
        for (const pid of ids) {
          await OrdenCompraRepo.updateStock(conn, pid, newMap[pid]);
        }
      }

      for (const ln of lineasConSub) {
        const restante = data.estado === 'recibida' ? ln.cantidad : 0;
        await OrdenCompraRepo.insertDetalle(conn, { ordenId, ...ln, cantidad_restante: restante });
        if (data.estado === 'recibida') {
          await OrdenCompraRepo.insertHistorial(conn, {
            id_producto: ln.producto_id,
            id_compra: ordenId,
            tipo_transaccion: 'compra',
            precio_transaccion: ln.cantidad * ln.precio_unitario,
            cantidad_transaccion: ln.cantidad
          });
        }
      }

      await conn.commit();
      return { id: ordenId, codigo: data.codigo, proveedor_id: data.proveedor_id, total_orden: totalOrden };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async listAll() {
    const [rows] = await pool.query(
      `SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
              oc.fecha, oc.estado, oc.total_orden
       FROM ordenes_compra oc
       JOIN proveedores p ON oc.proveedor_id = p.id
       ORDER BY oc.fecha DESC`
    );
    return rows;
  }

  static async getById(id) {
    const cab = await OrdenCompraRepo.fetchCabecera(pool, id);
    if (!cab) throw new Error('Orden no encontrada');
    const detalle = await OrdenCompraRepo.fetchDetalle(pool, id);
    return { ...cab, lineas: detalle };
  }

  static async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const cab = await OrdenCompraRepo.fetchCabecera(conn, id);
      if (!cab) throw new Error('Orden no encontrada');
      const estadoOld = cab.estado;
      const estadoNew = data.estado;
      const { totalOrden, lineasConSub } = this._prepararLineas(data.lineas);

      if (estadoNew === 'recibida') {
        const oldMap = estadoOld === 'recibida'
          ? Object.fromEntries(
              (await OrdenCompraRepo.sumCantidadPorProducto(conn, id)).map(r => [r.producto_id, r.total_cant])
            )
          : {};
        const newMap = Object.fromEntries(lineasConSub.map(ln => [ln.producto_id, ln.cantidad]));
        const allIds = Array.from(new Set([...Object.keys(oldMap), ...Object.keys(newMap)])).map(Number).sort((a, b) => a - b);
        for (const pid of allIds) {
          const delta = (newMap[pid] || 0) - (oldMap[pid] || 0);
          if (delta !== 0) {
            await OrdenCompraRepo.updateStock(conn, pid, delta);
          }
        }
      }

      await OrdenCompraRepo.deleteHistorial(conn, id);
      await OrdenCompraRepo.deleteDetalle(conn, id);
      await OrdenCompraRepo.updateCabecera(conn, id, {
        codigo: data.codigo,
        proveedor_id: data.proveedor_id,
        estado: estadoNew,
        total: totalOrden
      });

      for (const ln of lineasConSub) {
        const restante = estadoNew === 'recibida' ? ln.cantidad : 0;
        await OrdenCompraRepo.insertDetalle(conn, { ordenId: id, ...ln, cantidad_restante: restante });
        if (estadoNew === 'recibida') {
          await OrdenCompraRepo.insertHistorial(conn, {
            id_producto: ln.producto_id,
            id_compra: id,
            tipo_transaccion: 'compra',
            precio_transaccion: ln.cantidad * ln.precio_unitario,
            cantidad_transaccion: ln.cantidad
          });
        }
      }

      await conn.commit();
      return { id, codigo: data.codigo, proveedor_id: data.proveedor_id, total_orden: totalOrden };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const cab = await OrdenCompraRepo.fetchCabecera(conn, id);
      if (!cab) throw new Error('Orden no encontrada');
      if (cab.estado === 'recibida') {
        const sums = await OrdenCompraRepo.sumCantidadPorProducto(conn, id);
        for (const { producto_id, total_cant } of sums) {
          await OrdenCompraRepo.updateStock(conn, producto_id, -total_cant);
        }
      }
      await OrdenCompraRepo.deleteHistorial(conn, id);
      await OrdenCompraRepo.deleteDetalle(conn, id);
      await OrdenCompraRepo.deleteCabecera(conn, id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = OrdenCompraService;
