// backend/repositories/ProductoRepo.js
const pool = require('../config/db');

class ProductoRepo {
  // Obtener todos los productos con filtros
static async findAll(filters = {}, options = {}) {
  const { search, categoriaId, subcategoriaId } = filters;
  const { page = 1, pageSize = 10 } = options;

  let base = `
    SELECT p.id, p.nombre, p.descripcion, p.imagen_url,
      CASE WHEN EXISTS (SELECT 1 FROM detalle_compra d1
        WHERE d1.producto_id = p.id AND d1.cantidad_restante > 0)
      THEN (SELECT dc.precio_unitario FROM detalle_compra dc
            JOIN ordenes_compra oc ON oc.id = dc.orden_compra_id
            WHERE dc.producto_id = p.id AND dc.cantidad_restante > 0
            ORDER BY oc.fecha ASC, dc.id ASC LIMIT 1)
      ELSE 0 END AS precio_compra,
      p.precio_venta, p.stock, p.presentacion,
      p.created_at, p.modified_at,
      m.nombre AS marca, sub.nombre AS subcategoria, padre.nombre AS categoria
    FROM productos p
    LEFT JOIN marcas m ON p.marca_id = m.id
    LEFT JOIN categorias sub ON p.categoria_id = sub.id
    LEFT JOIN categorias padre ON sub.parent_id = padre.id
  `;
  const where = ['p.is_deleted = FALSE'];
  const params = [];
  if (search) { where.push('p.nombre LIKE ?'); params.push(`%${search}%`); }
  if (categoriaId) { where.push('padre.id = ?'); params.push(categoriaId); }
  if (subcategoriaId) { where.push('sub.id = ?'); params.push(subcategoriaId); }

  const whereSql = `WHERE ${where.join(' AND ')}`;
  const orderSql = `ORDER BY p.nombre ASC`;
  const offset = (page - 1) * pageSize;

  const dataSql = `${base} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(dataSql, [...params, pageSize, offset]);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM productos p
    LEFT JOIN categorias sub ON p.categoria_id = sub.id
    LEFT JOIN categorias padre ON sub.parent_id = padre.id
    ${whereSql}`;
  const [[{ total }]] = await pool.query(countSql, params);

  return { data: rows, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
  // Obtener producto por ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT
  p.id,
  p.nombre,
  p.descripcion,
  p.imagen_url,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM detalle_compra d1
      WHERE d1.producto_id = p.id
        AND d1.cantidad_restante > 0
    )
    THEN (
      SELECT dc.precio_unitario
      FROM detalle_compra dc
      JOIN ordenes_compra oc ON oc.id = dc.orden_compra_id
      WHERE dc.producto_id = p.id
        AND dc.cantidad_restante > 0
      ORDER BY oc.fecha ASC, dc.id ASC
      LIMIT 1
    )
    ELSE NULL
  END AS precio_compra,
  p.precio_venta,
  p.stock,
  p.presentacion,
  p.created_at,
  p.modified_at,
  p.marca_id,
  p.categoria_id
FROM productos p
WHERE p.id = ? AND p.is_deleted = FALSE;
`,
      [id]
    );
    return rows[0] || null;
  }
// NUEVO: búsqueda liviana para autocompletar
  static async searchLight(filters = {}, options = {}) {
    const { search = '' } = filters;
    const page     = Math.max(1, +options.page || 1);
    const pageSize = Math.max(1, Math.min(100, +options.pageSize || 20));
    const offset   = (page - 1) * pageSize;

    const where = ['p.is_deleted = FALSE'];
    const params = [];
    if (search) { where.push('p.nombre LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    // Total para saber si hay más páginas
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM productos p
         ${whereSql}`,
      params
    );

    // Solo columnas necesarias, sin joins
    const [rows] = await pool.query(
      `SELECT p.id, p.nombre, p.precio_venta
         FROM productos p
         ${whereSql}
         ORDER BY p.nombre ASC
         LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    return {
      items: rows.map(r => ({ id: r.id, label: r.nombre, precio_venta: r.precio_venta })),
      page,
      pageSize,
      total,
      hasMore: offset + rows.length < total,
    };
  }
  // Crear nuevo producto

 static async create(conn, data) {
const { nombre, descripcion, imagen_url = null, precio_venta, categoria_id = null, marca_id = null, presentacion = null } = data;
     const [result] = await conn.query(
       `INSERT INTO productos     
  (nombre, descripcion, imagen_url, precio_compra, precio_venta, stock, categoria_id, marca_id, presentacion, created_at, modified_at)
VALUES (?, ?, ?, 0, ?, 0, ?, ?, ?, NOW(), NOW())`,
[nombre, descripcion, imagen_url, precio_venta, categoria_id, marca_id, presentacion]
     );
     return result.insertId;
   }

  // Actualizar producto
  static async update(conn, id, data) {
    const fields = [];
    const params = [];
    ['nombre', 'descripcion', 'imagen_url', 'precio_venta', 'categoria_id', 'marca_id', 'presentacion']
      .forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          params.push(data[field]);
        }
      });
    if (!fields.length) return;
    params.push(id);

    await conn.query(
      `UPDATE productos SET ${fields.join(', ')}, modified_at = NOW() WHERE id = ?`,
      params
    );
  }

  // Soft delete de un producto
  static async softDelete(conn, id) {
    await conn.query(
      `UPDATE productos SET is_deleted = TRUE, modified_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  // Ajustar stock de un producto
  static async adjustStock(conn, id, delta) {
    await conn.query(
      `UPDATE productos SET stock = stock + ? WHERE id = ?`,
      [delta, id]
    );
  }
}

module.exports = ProductoRepo;
