// backend/repositories/OrdenCompraRepo.js
const pool = require('../config/db');

class OrdenCompraRepo {
  // Inserta la cabecera de la orden y devuelve el insertId
  static async insertCabecera(conn, { codigo, proveedor_id, fecha, estado, total }) {
    const [result] = await conn.query(
      `INSERT INTO ordenes_compra (codigo, proveedor_id, fecha, estado, total_orden)
       VALUES (?, ?, ?, ?, ?)`,
      [codigo, proveedor_id, fecha, estado, total]
    );
    return result.insertId;
  }

  // Inserta una línea de detalle
  static async insertDetalle(conn, { ordenId, producto_id, cantidad, cantidad_restante, precio_unitario, impuesto, libraje, descuento, subtotal }) {
    await conn.query(
      `INSERT INTO detalle_compra
         (orden_compra_id, producto_id, cantidad, cantidad_restante,
          precio_unitario, impuesto, libraje, descuento, subtotal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ordenId, producto_id, cantidad, cantidad_restante, precio_unitario, impuesto, libraje, descuento, subtotal]
    );
  }

  // Obtiene la cabecera de una orden por ID
  static async fetchCabecera(connOrPool, id) {
    const executor = connOrPool.query ? connOrPool : pool;
    const [rows] = await executor.query(
      `SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
              oc.fecha, oc.estado, oc.total_orden
       FROM ordenes_compra oc
       JOIN proveedores p ON oc.proveedor_id = p.id
       WHERE oc.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Búsqueda sin paginar (compatibilidad)
  static async search({ codigo, fecha }) {
    const conditions = [];
    const params = [];

    if (codigo) {
      conditions.push('oc.codigo LIKE ?');
      params.push(`${codigo}%`);
    }

    if (fecha) {
      // Convertir fecha local (America/El_Salvador −06:00) a rango UTC
      const start = new Date(`${fecha}T00:00:00-06:00`);
      const end   = new Date(`${fecha}T24:00:00-06:00`);
      const pad = n => String(n).padStart(2, '0');
      const fmt = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      const startUtc = fmt(start);
      const endUtc   = fmt(end);

      conditions.push('(oc.fecha >= ? AND oc.fecha < ?)');
      params.push(startUtc, endUtc);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
              oc.fecha, oc.estado, oc.total_orden
       FROM ordenes_compra oc
       JOIN proveedores p ON oc.proveedor_id = p.id
       ${where}
       ORDER BY oc.fecha DESC`,
      params
    );
    return rows;
  }

  // === NUEVO: búsqueda + conteo con paginación ===
  static async searchPaginated({ codigo, fecha }, { page, pageSize }) {
    const conditions = [];
    const params = [];

    if (codigo) {
      conditions.push('oc.codigo LIKE ?');
      params.push(`${codigo}%`);
    }

    if (fecha) {
      const start = new Date(`${fecha}T00:00:00-06:00`);
      const end   = new Date(`${fecha}T24:00:00-06:00`);
      const pad = n => String(n).padStart(2, '0');
      const fmt = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
      const startUtc = fmt(start);
      const endUtc   = fmt(end);

      conditions.push('(oc.fecha >= ? AND oc.fecha < ?)');
      params.push(startUtc, endUtc);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [rows] = await pool.query(
      `SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
              oc.fecha, oc.estado, oc.total_orden
       FROM ordenes_compra oc
       JOIN proveedores p ON oc.proveedor_id = p.id
       ${where}
       ORDER BY oc.fecha DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), Number(offset)]
    );

    const [[countRow]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM ordenes_compra oc
         JOIN proveedores p ON oc.proveedor_id = p.id
         ${where}`,
      params
    );

    return { rows, total: Number(countRow.total || 0) };
  }

  // Obtiene líneas de detalle
  static async fetchDetalle(connOrPool, ordenId) {
    const executor = connOrPool.query ? connOrPool : pool;
    const [rows] = await executor.query(
       `SELECT
       dc.id,
       dc.producto_id,
       p.nombre      AS producto_nombre,
      p.imagen_url  AS producto_imagen_url,
       dc.cantidad,
       dc.cantidad_restante,
       dc.precio_unitario,
       dc.impuesto,
       dc.libraje,
       dc.descuento,
       dc.subtotal
     FROM detalle_compra dc
    JOIN productos p ON p.id = dc.producto_id
     WHERE dc.orden_compra_id = ?`,
+    [ordenId]
    );
    return rows;
  }

  // Elimina detalles
  static async deleteDetalle(conn, ordenId) {
    await conn.query(
      `DELETE FROM detalle_compra WHERE orden_compra_id = ?`,
      [ordenId]
    );
  }

  // Historial transacciones
  static async insertHistorial(conn, { id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion }) {
    await conn.query(
      `INSERT INTO historial_transacciones
         (id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion)
       VALUES (?, ?, ?, ?, ?)`,
      [id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion]
    );
  }

  static async deleteHistorial(conn, ordenId) {
    await conn.query(
      `DELETE FROM historial_transacciones
       WHERE id_compra = ? AND tipo_transaccion = 'compra'`,
      [ordenId]
    );
  }

  // Stock
  static async updateStock(conn, productoId, delta) {
    await conn.query(
      `UPDATE productos SET stock = stock + ? WHERE id = ?`,
      [delta, productoId]
    );
  }

  // Cabecera
  static async updateCabecera(conn, id, { codigo, proveedor_id, estado, total }) {
    await conn.query(
      `UPDATE ordenes_compra
         SET codigo = ?, proveedor_id = ?, estado = ?, total_orden = ?
       WHERE id = ?`,
      [codigo, proveedor_id, estado, total, id]
    );
  }

  static async sumCantidadPorProducto(conn, ordenId) {
    const [rows] = await conn.query(
      `SELECT producto_id, SUM(cantidad) AS total_cant
         FROM detalle_compra
        WHERE orden_compra_id = ?
        GROUP BY producto_id`,
      [ordenId]
    );
    return rows;
  }

  static async deleteCabecera(conn, ordenId) {
    await conn.query(
      `DELETE FROM ordenes_compra WHERE id = ?`,
      [ordenId]
    );
  }
}

module.exports = OrdenCompraRepo;
