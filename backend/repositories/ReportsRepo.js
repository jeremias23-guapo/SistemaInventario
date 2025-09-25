// repositories/ReportsRepo.js
const pool = require('../config/db');

/* =========================
 *  Utilidades de zona horaria
 * ========================= */
function sanitizeTz(tz) {
  return (/^[+-]\d{2}:\d{2}$/).test(tz) ? tz : '+00:00';
}
const tzDateExpr = "DATE(CONVERT_TZ(v.fecha, '+00:00', ?))";
function pushDateFilter(whereArr, paramsArr, op, tzSafe, value) {
  whereArr.push(`${tzDateExpr} ${op} ?`);
  paramsArr.push(tzSafe, value);
}

/* =========================
 *  Ventas: paginado + conteo
 * ========================= */
exports.findSales = async ({ limit, offset, from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = ['v.estado_pago = ?'];          // << usamos estado de pago
  const params = [estado];
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);

  const sql = `
    SELECT v.id, v.codigo, ${tzDateExpr} AS fecha,
           v.total_venta,
           c.nombre AS cliente,
           u.username AS usuario,
           v.metodo_pago, v.estado_envio, v.estado_pago, v.estado_venta
    FROM ventas v
    JOIN clientes c ON c.id = v.cliente_id
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    WHERE ${where.join(' AND ')}
    ORDER BY v.fecha DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [tzSafe, ...params, Number(limit)||50, Number(offset)||0]);
  return rows;
};

exports.countSales = async ({ from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = ['v.estado_pago = ?'];
  const params = [estado];
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const sql = `SELECT COUNT(*) AS total FROM ventas v WHERE ${where.join(' AND ')}`;
  const [[{ total }]] = await pool.query(sql, params);
  return total;
};

/* =========================
 *  KPIs y agrupados
 * ========================= */
exports.findKpis = async ({ from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT
      COUNT(*) AS tickets,
      SUM(v.total_venta) AS total_ventas,
      ROUND(SUM(v.total_venta)/NULLIF(COUNT(*),0),2) AS ticket_promedio,
      COUNT(DISTINCT v.cliente_id) AS clientes_unicos,
      COUNT(DISTINCT v.usuario_id) AS usuarios_vendedores
    FROM ventas v
    ${whereSql}
  `;
  const [[row]] = await pool.query(sql, params);
  return row;
};

exports.findSalesByDay = async ({ from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT ${tzDateExpr} AS dia, SUM(v.total_venta) AS total
    FROM ventas v
    ${whereSql}
    GROUP BY dia
    ORDER BY dia
  `;
  const [rows] = await pool.query(sql, [tzSafe, ...params]);
  return rows;
};

// detalle_venta: usar subtotal por línea
exports.findSalesByProduct = async ({ from, to, estado, tz, limit = 20 }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT dv.producto_id, p.nombre,
           SUM(dv.cantidad) AS unidades,
           SUM(dv.subtotal) AS ingreso
    FROM detalle_venta dv
    JOIN ventas v ON v.id = dv.venta_id
    JOIN productos p ON p.id = dv.producto_id
    ${whereSql}
    GROUP BY dv.producto_id, p.nombre
    ORDER BY ingreso DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [...params, Number(limit)||20]);
  return rows;
};

exports.findSalesByCategory = async ({ from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT c.id AS categoria_id, c.nombre AS categoria,
           SUM(dv.cantidad) AS unidades,
           SUM(dv.subtotal) AS ingreso
    FROM detalle_venta dv
    JOIN ventas v     ON v.id = dv.venta_id
    JOIN productos p  ON p.id = dv.producto_id
    LEFT JOIN categorias c ON c.id = p.categoria_id
    ${whereSql}
    GROUP BY c.id, c.nombre
    ORDER BY ingreso DESC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.findSalesByClient = async ({ from, to, estado, tz, limit = 50 }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT v.cliente_id, c.nombre AS cliente,
           COUNT(*) AS tickets,
           SUM(v.total_venta) AS ingreso
    FROM ventas v
    JOIN clientes c ON c.id = v.cliente_id
    ${whereSql}
    GROUP BY v.cliente_id, c.nombre
    ORDER BY ingreso DESC
    LIMIT ?
  `;
  const [rows] = await pool.query(sql, [...params, Number(limit)||50]);
  return rows;
};

exports.findSalesByUser = async ({ from, to, estado, tz }) => {
  const tzSafe = sanitizeTz(tz);
  const where = [];
  const params = [];
  if (estado && estado !== 'todas') { where.push('v.estado_pago = ?'); params.push(estado); }
  if (from) pushDateFilter(where, params, '>=', tzSafe, from);
  if (to)   pushDateFilter(where, params, '<=', tzSafe, to);
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const sql = `
    SELECT u.id AS usuario_id, u.username AS usuario,
           COUNT(*) AS tickets,
           SUM(v.total_venta) AS ingreso
    FROM ventas v
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    ${whereSql}
    GROUP BY u.id, u.username
    ORDER BY ingreso DESC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
};

/* =========================
 *  Inventario y movimientos
 * ========================= */
exports.findInventory = async () => {
  const sql = `
    SELECT p.id, p.nombre, p.stock, p.precio_venta,
           ROUND((
             SELECT SUM(dc.cantidad*dc.precio_unitario)/NULLIF(SUM(dc.cantidad),0)
             FROM detalle_compra dc WHERE dc.producto_id = p.id
           ),2) AS costo_promedio,
           ROUND(p.stock * (
             SELECT SUM(dc.cantidad*dc.precio_unitario)/NULLIF(SUM(dc.cantidad),0)
             FROM detalle_compra dc WHERE dc.producto_id = p.id
           ),2) AS valuacion
    FROM productos p
    WHERE p.is_deleted = 0
    ORDER BY valuacion DESC
  `;
  const [rows] = await pool.query(sql);
  return rows;
};

exports.findLowStock = async ({ threshold = 2 }) => {
  const [rows] = await pool.query(
    `SELECT id, nombre, stock
     FROM productos
     WHERE is_deleted=0 AND stock <= ?
     ORDER BY stock ASC`,
    [Number(threshold)||2]
  );
  return rows;
};

exports.findMovements = async ({ from, to, tipo }) => {
  const where = ['1=1'];
  const params = [];
  if (tipo) { where.push('h.tipo_transaccion = ?'); params.push(tipo); }
  if (from) { where.push('DATE(h.fecha_transaccion) >= ?'); params.push(from); }
  if (to)   { where.push('DATE(h.fecha_transaccion) <= ?'); params.push(to); }

  const sql = `
    SELECT h.id_transaccion, h.id_producto, p.nombre,
           h.tipo_transaccion, h.fecha_transaccion,
           h.precio_transaccion, h.cantidad_transaccion
    FROM historial_transacciones h
    JOIN productos p ON p.id = h.id_producto
    WHERE ${where.join(' AND ')}
    ORDER BY h.fecha_transaccion DESC
  `;
  const [rows] = await pool.query(sql, params);
  return rows;
};
