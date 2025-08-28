const pool = require('../config/db');

class VentaRepo {
  // 1) Insertar cabecera de venta, devuelve insertId
  static async insertCabecera(conn, { codigo, cliente_id, fecha, estado, total_venta }) {
    const [result] = await conn.query(
      `INSERT INTO ventas (codigo, cliente_id, fecha, estado, total_venta,usuario_id)
       VALUES (?, ?, ?, ?, ?,?)`,
      [codigo, cliente_id, fecha, estado, total_venta,usuario_id]
    );
    return result.insertId;
  }

//buscar venta
static async search({ codigo, fecha }) {
  const conditions = [];
  const params = [];

  if (codigo) {
    conditions.push('v.codigo = ?');
    params.push(codigo);
  }
 
  if (fecha) {
    conditions.push('DATE(v.fecha) = ?');
    params.push(fecha);
  }

  const where = conditions.length
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  const sql = `
    SELECT v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
           v.fecha, v.estado, v.total_venta
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    ${where}
    ORDER BY v.fecha DESC
  `;

  const [rows] = await pool.query(sql, params);
  return rows;
}
  // 2) Insertar línea de detalle venta, ahora con origen_lote_id opcional
  static async insertDetalle(conn, {
    venta_id,
    producto_id,
    cantidad,
    precio_unitario,
    descuento,
    subtotal,
    costo_unitario = null,
    origen_lote_id  = null        // <-- nuevo campo
  }) {
    const cols = ['venta_id','producto_id','cantidad','precio_unitario','descuento','subtotal'];
    const vals = [venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal];

    if (costo_unitario !== null) {
      cols.push('costo_unitario');
      vals.push(costo_unitario);
    }
    if (origen_lote_id !== null) {
      cols.push('origen_lote_id');
      vals.push(origen_lote_id);
    }

    await conn.query(
      `INSERT INTO detalle_venta (${cols.join(',')})
       VALUES (${cols.map(_ => '?').join(',')})`,
      vals
    );
  }

  // 3) Insertar historial de transacción (venta, cancelación, etc.)
  static async insertHistorial(conn, { id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion }) {
    await conn.query(
      `INSERT INTO historial_transacciones
         (id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion, fecha_transaccion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion]
    );
  }

  // 4) Listar todas las ventas (cabecera)
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
              v.fecha, v.estado, v.total_venta, u.username AS usuario_nombre
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       ORDER BY v.fecha DESC`
    );
    return rows;
  }

  // 5) Obtener cabecera de una venta por ID
  static async fetchCabecera(id) {
    const [rows] = await pool.query(
      `SELECT v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
              v.fecha, v.estado, v.total_venta
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // 6) Obtener líneas de detalle de una venta
  static async fetchLineas(id) {
    const [rows] = await pool.query(
      `
SELECT
  dv.id AS detalle_id,
  dv.producto_id,
  p.nombre AS producto_nombre,
  p.imagen_url,
  p.presentacion,
  dv.cantidad,
  dv.precio_unitario,
  dv.descuento,
  dv.subtotal,
  dv.costo_unitario
FROM detalle_venta dv
JOIN productos p ON dv.producto_id = p.id
WHERE dv.venta_id = ?
`,
      [id]
    );
    return rows;
  }

  // 7) Borrar todas las líneas de detalle de una venta
  static async deleteDetalle(conn, ventaId) {
    await conn.query(`DELETE FROM detalle_venta WHERE venta_id = ?`, [ventaId]);
  }

  // 8) Borrar historial de tipo 'venta' asociado a una venta
  static async deleteHistorial(conn, ventaId) {
    await conn.query(
      `DELETE FROM historial_transacciones WHERE id_venta = ? AND tipo_transaccion = 'venta'`,
      [ventaId]
    );
  }

  // 9) Borrar la cabecera de la venta
  static async deleteCabecera(conn, ventaId) {
    await conn.query(`DELETE FROM ventas WHERE id = ?`, [ventaId]);
  }
}

module.exports = VentaRepo;
