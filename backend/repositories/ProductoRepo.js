// backend/repositories/ProductoRepo.js
const pool = require('../config/db');

class ProductoRepo {
  // Obtener todos los productos con filtros
 static async findAll(filters = {}) {
  const { search, categoriaId, subcategoriaId } = filters;

  let query = `
    SELECT
      p.id,
      p.nombre,
      p.descripcion,
      p.imagen_url,
      p.precio_compra,
      p.precio_venta,
      p.stock,
      p.presentacion,
      p.activo,
      p.created_at,
      p.modified_at,
      m.nombre AS marca,
      sub.nombre AS subcategoria,
      padre.nombre AS categoria
    FROM productos p
    LEFT JOIN marcas m ON p.marca_id = m.id
    LEFT JOIN categorias sub ON p.categoria_id = sub.id
    LEFT JOIN categorias padre ON sub.parent_id = padre.id
    WHERE p.is_deleted = FALSE`;

  const params = [];

  // Filtro por nombre (búsqueda)
  if (search) {
    query += ' AND p.nombre LIKE ?';
    params.push(`%${search}%`);
  }

  // Filtro por categoría
  if (categoriaId) {
    query += ' AND padre.id = ?';  // Filtrar productos que pertenecen a la categoría padre
    params.push(categoriaId);
  }

  // Filtro por subcategoría
  if (subcategoriaId) {
    query += ' AND sub.id = ?';  // Filtrar productos que pertenecen a la subcategoría
    params.push(subcategoriaId);
  }

  query += ' ORDER BY p.nombre';

  const [rows] = await pool.query(query, params);
  return rows;
}

  // Obtener producto por ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.nombre,
        p.descripcion,
        p.imagen_url,
        p.precio_compra,
        p.precio_venta,
        p.stock,
        p.presentacion,
        p.activo,
        p.created_at,
        p.modified_at,
        p.marca_id,
        p.categoria_id
      FROM productos p
      WHERE p.id = ? AND p.is_deleted = FALSE`,
      [id]
    );
    return rows[0] || null;
  }

  // Crear nuevo producto
  static async create(conn, data) {
    const { nombre, descripcion, imagen_url = null, precio_compra = 0, precio_venta, stock = 0, categoria_id = null, marca_id = null, presentacion = null } = data;
    const [result] = await conn.query(
      `INSERT INTO productos
        (nombre, descripcion, imagen_url, precio_compra, precio_venta, stock, categoria_id, marca_id, presentacion, created_at, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [nombre, descripcion, imagen_url, precio_compra, precio_venta, stock, categoria_id, marca_id, presentacion]
    );
    return result.insertId;
  }

  // Actualizar producto
  static async update(conn, id, data) {
    const fields = [];
    const params = [];
    ['nombre', 'descripcion', 'imagen_url', 'precio_compra', 'precio_venta', 'stock', 'categoria_id', 'marca_id', 'activo']
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
