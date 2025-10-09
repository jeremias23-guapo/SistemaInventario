// backend/repositories/VentaRepo.js
const pool = require('../config/db');

class VentaRepo {

  static async generarCodigo(conn, usarCeros = true) {
    const year = new Date().getFullYear();
    const [rows] = await conn.query(
      `SELECT codigo
         FROM ventas
        WHERE codigo LIKE ?
        ORDER BY id DESC
        LIMIT 1`,
      [`VEN-${year}-%`]
    );
    let next = 1;
    if (rows.length) {
      const partes = rows[0].codigo.split('-');
      const numero = parseInt(partes[2], 10);
      if (!isNaN(numero)) next = numero + 1;
    }
    return usarCeros
      ? `VEN-${year}-${String(next).padStart(6, '0')}`
      : `VEN-${year}-${next}`;
  }

  // Insertar cabecera (incluye transportista y comision_transportista)
  static async insertCabecera(conn, {
    codigo,
    cliente_id,
    fecha,
    total_venta,
    usuario_id,
    metodo_pago = 'transferencia',
    estado_envio = 'pendiente_envio',
    estado_pago = 'pendiente_pago',
    estado_venta = 'activa',
    transportista_id = null,
    comision_transportista = 0
  }) {
    const [result] = await conn.query(
      `INSERT INTO ventas
        (codigo, cliente_id, fecha, total_venta, usuario_id,
         metodo_pago, estado_envio, estado_pago, estado_venta,
         transportista_id, comision_transportista)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        codigo, cliente_id, fecha, total_venta, usuario_id,
        metodo_pago, estado_envio, estado_pago, estado_venta,
        transportista_id, comision_transportista
      ]
    );
    return result.insertId;
  }

  // Update cabecera (cuando edites)
  static async updateCabecera(conn, id, {
    codigo, cliente_id, metodo_pago, estado_envio, estado_pago, estado_venta,
    total_venta, transportista_id, comision_transportista
  }) {
    await conn.query(
      `UPDATE ventas
          SET codigo = ?,
              cliente_id = ?,
              metodo_pago = ?,
              estado_envio = ?,
              estado_pago = ?,
              estado_venta = ?,
              total_venta = ?,
              transportista_id = ?,
              comision_transportista = ?
        WHERE id = ?`,
      [
        codigo, cliente_id, metodo_pago, estado_envio, estado_pago, estado_venta,
        total_venta, transportista_id, comision_transportista, id
      ]
    );
  }

  // ---- BÚSQUEDA CON PÁGINA/LÍMITE (muestra comisión guardada y total neto)
 static async search({ codigo, fecha, estado_envio, page = 1, limit = 10 }) {
  const conditions = [];
  const params = [];

  if (codigo) {
    conditions.push('v.codigo LIKE ?');
    params.push(`${codigo}%`);
  }

  if (fecha) {
    const start = new Date(`${fecha}T00:00:00-06:00`);
    const end   = new Date(`${fecha}T24:00:00-06:00`);
    const pad = n => String(n).padStart(2, '0');
    const fmt = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
    const startUtc = fmt(start);
    const endUtc   = fmt(end);
    conditions.push('(v.fecha >= ? AND v.fecha < ?)');
    params.push(startUtc, endUtc);
  }

  if (estado_envio && ['pendiente_envio','enviado','recibido'].includes(String(estado_envio))) {
    conditions.push('v.estado_envio = ?');
    params.push(estado_envio);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [cntRows] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN transportistas t ON t.id = v.transportista_id
       ${where}`,
    params
  );
  const total = Number(cntRows?.[0]?.total || 0);

  const offset = (Math.max(1, +page) - 1) * Math.max(1, +limit);
  const sql = `
    SELECT
      v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
      v.fecha,
      v.metodo_pago, v.estado_envio, v.estado_pago, v.estado_venta,
      v.total_venta,
      v.comision_transportista AS transportista_comision,
      (v.total_venta - v.comision_transportista) AS total_venta_neta,
      u.username AS usuario_nombre,
      v.transportista_id, t.nombre AS transportista_nombre
    FROM ventas v
    JOIN clientes c ON v.cliente_id = c.id
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    LEFT JOIN transportistas t ON t.id = v.transportista_id
    ${where}
    ORDER BY v.fecha DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [...params, Math.max(1, +limit), offset]);

  return { data: rows, pagination: { page: +page || 1, limit: +limit || 10, total } };
}

  // ---- Listado con paginación
  static async findAll({ page = 1, limit = 10 } = {}) {
    const offset = (Math.max(1, +page) - 1) * Math.max(1, +limit);

    const [cntRows] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM ventas v
         JOIN clientes c ON v.cliente_id = c.id
         LEFT JOIN usuarios u ON u.id = v.usuario_id
         LEFT JOIN transportistas t ON t.id = v.transportista_id`
    );
    const total = Number(cntRows?.[0]?.total || 0);

    const [rows] = await pool.query(
      `SELECT
         v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
         v.fecha,
         v.metodo_pago, v.estado_envio, v.estado_pago, v.estado_venta,
         v.total_venta,
         v.comision_transportista AS transportista_comision,
         (v.total_venta - v.comision_transportista) AS total_venta_neta,
         u.username AS usuario_nombre,
         v.transportista_id, t.nombre AS transportista_nombre
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON u.id = v.usuario_id
       LEFT JOIN transportistas t ON t.id = v.transportista_id
       ORDER BY v.fecha DESC
       LIMIT ? OFFSET ?`,
      [Math.max(1, +limit), offset]
    );

    return { data: rows, pagination: { page: +page || 1, limit: +limit || 10, total } };
  }

  // Cabecera por ID
  static async fetchCabecera(id) {
    const [rows] = await pool.query(
      `SELECT
         v.id, v.codigo, v.cliente_id, c.nombre AS cliente_nombre,
         v.fecha,
         v.metodo_pago, v.estado_envio, v.estado_pago, v.estado_venta,
         v.total_venta,
         v.comision_transportista AS transportista_comision,
         (v.total_venta - v.comision_transportista) AS total_venta_neta,
         v.transportista_id, t.nombre AS transportista_nombre
       FROM ventas v
       JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN transportistas t ON t.id = v.transportista_id
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  // Detalle por venta
  static async fetchLineas(id) {
    const [rows] = await pool.query(
      `SELECT
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
       WHERE dv.venta_id = ?`,
      [id]
    );
    return rows;
  }

  // Insertar línea detalle
  static async insertDetalle(conn, {
    venta_id,
    producto_id,
    cantidad,
    precio_unitario,
    descuento,
    subtotal,
    costo_unitario = null,
    origen_lote_id  = null
  }) {
    const cols = ['venta_id','producto_id','cantidad','precio_unitario','descuento','subtotal'];
    const vals = [venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal];

    if (costo_unitario !== null) { cols.push('costo_unitario'); vals.push(costo_unitario); }
    if (origen_lote_id  !== null) { cols.push('origen_lote_id');  vals.push(origen_lote_id);  }

    await conn.query(
      `INSERT INTO detalle_venta (${cols.join(',')})
       VALUES (${cols.map(_ => '?').join(',')})`,
      vals
    );
  }

  // Insertar historial
  static async insertHistorial(conn, { id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion }) {
    await conn.query(
      `INSERT INTO historial_transacciones
         (id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion, fecha_transaccion)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [id_producto, id_venta, tipo_transaccion, precio_transaccion, cantidad_transaccion]
    );
  }

  // Borrar detalle
  static async deleteDetalle(conn, ventaId) {
    await conn.query(`DELETE FROM detalle_venta WHERE venta_id = ?`, [ventaId]);
  }

  // Borrar historial de tipo venta
  static async deleteHistorial(conn, ventaId) {
    await conn.query(
      `DELETE FROM historial_transacciones WHERE id_venta = ? AND tipo_transaccion = 'venta'`,
      [ventaId]
    );
  }

  // Borrar cabecera
  static async deleteCabecera(conn, ventaId) {
    await conn.query(`DELETE FROM ventas WHERE id = ?`, [ventaId]);
  }
}

module.exports = VentaRepo;
