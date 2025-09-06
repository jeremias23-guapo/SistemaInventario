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
static async search({ codigo, fecha }) {
  const conditions = [];
  const params = [];

  if (codigo) {
    // Buscar por prefijo: "OC" -> "OC%"
    conditions.push('oc.codigo LIKE ?');
    params.push(`${codigo}%`);
  }

  if (fecha) {
    // fecha = 'YYYY-MM-DD' del <input type="date">
    const start = new Date(`${fecha}T00:00:00-06:00`);
    const end   = new Date(`${fecha}T24:00:00-06:00`);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    const startUtc = fmt(start); // ej: 2025-09-02 06:00:00
    const endUtc   = fmt(end);   // ej: 2025-09-03 06:00:00

    conditions.push('(oc.fecha >= ? AND oc.fecha < ?)');
    params.push(startUtc, endUtc);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT oc.id, oc.codigo, oc.proveedor_id, p.nombre AS proveedor_nombre,
           oc.fecha, oc.estado, oc.total_orden
    FROM ordenes_compra oc
    JOIN proveedores p ON oc.proveedor_id = p.id
    ${where}
    ORDER BY oc.fecha DESC
    `,
    params
  );
  return rows;
}
  // Obtiene todas las líneas de detalle de una orden
  static async fetchDetalle(connOrPool, ordenId) {
    const executor = connOrPool.query ? connOrPool : pool;
    const [rows] = await executor.query(
      `SELECT id, producto_id, cantidad, cantidad_restante,
              precio_unitario, impuesto, libraje, descuento, subtotal
       FROM detalle_compra
       WHERE orden_compra_id = ?`,
      [ordenId]
    );
    return rows;
  }

  // Elimina todas las líneas de detalle de una orden
  static async deleteDetalle(conn, ordenId) {
    await conn.query(
      `DELETE FROM detalle_compra WHERE orden_compra_id = ?`,
      [ordenId]
    );
  }

  // Inserta una entrada en historial_transacciones
  static async insertHistorial(conn, { id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion }) {
    await conn.query(
      `INSERT INTO historial_transacciones
         (id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion)
       VALUES (?, ?, ?, ?, ?)`,
      [id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion]
    );
  }

  // Elimina el historial de transacciones de compra para una orden
  static async deleteHistorial(conn, ordenId) {
    await conn.query(
      `DELETE FROM historial_transacciones
       WHERE id_compra = ? AND tipo_transaccion = 'compra'`,
      [ordenId]
    );
  }

  // Actualiza el stock de un producto en delta (+/-)
  static async updateStock(conn, productoId, delta) {
    await conn.query(
      `UPDATE productos SET stock = stock + ? WHERE id = ?`,
      [delta, productoId]
    );
  }

  // Actualiza la cabecera de la orden
  static async updateCabecera(conn, id, { codigo, proveedor_id, estado, total }) {
    await conn.query(
      `UPDATE ordenes_compra
         SET codigo = ?, proveedor_id = ?, estado = ?, total_orden = ?
       WHERE id = ?`,
      [codigo, proveedor_id, estado, total, id]
    );
  }

  // Suma la cantidad total de cada producto en una orden
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

  // Elimina la cabecera de la orden
  static async deleteCabecera(conn, ordenId) {
    await conn.query(
      `DELETE FROM ordenes_compra WHERE id = ?`,
      [ordenId]
    );
  }
}

module.exports = OrdenCompraRepo;
