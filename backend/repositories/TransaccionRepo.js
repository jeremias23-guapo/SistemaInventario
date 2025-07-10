// backend/repositories/TransaccionRepo.js
const pool = require('../config/db');

class TransaccionRepo {
  // Crear registro de transacción
  static async create(conn, data) {
    const {
      id_producto,
      orden_compra_id,
      tipo_transaccion,
      precio_transaccion,
      cantidad_transaccion
    } = data;
    const [result] = await conn.query(
      `INSERT INTO historial_transacciones
         (id_producto, id_compra, tipo_transaccion, precio_transaccion, cantidad_transaccion, fecha_transaccion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_producto, orden_compra_id, tipo_transaccion, precio_transaccion, cantidad_transaccion]
    );
    return { id_transaccion: result.insertId, ...data };
  }

  // Listar todas las transacciones con detalles
  static async findAll() {
  const [rows] = await pool.query(`
    SELECT
      ht.id_transaccion,
      ht.id_producto,
      p.nombre     AS producto_nombre,
      ht.id_compra,
      ht.id_venta,
      COALESCE(oc.codigo, v.codigo) AS orden_codigo,
      ht.tipo_transaccion,
      ht.precio_transaccion,
      ht.cantidad_transaccion,
      ht.fecha_transaccion
    FROM historial_transacciones ht
    JOIN productos p
      ON ht.id_producto = p.id
    LEFT JOIN ordenes_compra oc
      ON ht.id_compra = oc.id
    LEFT JOIN ventas v
      ON ht.id_venta = v.id
    ORDER BY ht.fecha_transaccion DESC
  `);
  return rows;
}


  // Obtener transacción por ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT ht.id_transaccion,
              ht.id_producto,
              p.nombre AS producto_nombre,
              ht.id_compra AS orden_compra_id,
              oc.codigo AS orden_codigo,
              ht.tipo_transaccion,
              ht.precio_transaccion,
              ht.cantidad_transaccion,
              ht.fecha_transaccion
       FROM historial_transacciones ht
       JOIN productos p ON ht.id_producto = p.id
       LEFT JOIN ordenes_compra oc ON ht.id_compra = oc.id
       WHERE ht.id_transaccion = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Listar transacciones de una orden específica
  static async findByOrdenId(ordenId) {
    const [rows] = await pool.query(
      `SELECT ht.id_transaccion,
              ht.id_producto,
              p.nombre AS producto_nombre,
              ht.tipo_transaccion,
              ht.precio_transaccion,
              ht.cantidad_transaccion,
              ht.fecha_transaccion
       FROM historial_transacciones ht
       JOIN productos p ON ht.id_producto = p.id
       WHERE ht.id_compra = ?
       ORDER BY ht.fecha_transaccion DESC`,
      [ordenId]
    );
    return rows;
  }

  // Eliminar transacción por ID
  static async delete(conn, id) {
    await conn.query(
      'DELETE FROM historial_transacciones WHERE id_transaccion = ?',
      [id]
    );
  }
}

module.exports = TransaccionRepo;