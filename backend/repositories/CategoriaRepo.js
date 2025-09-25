// backend/repositories/CategoriaRepo.js
const pool = require('../config/db');

class CategoriaRepo {
  // ===== CRUD / legacy =====
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id FROM categorias`
    );
    return rows;
  }

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id FROM categorias WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  async create({ nombre, parent_id }) {
    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, parent_id) VALUES (?, ?)`,
      [nombre, parent_id || null]
    );
    return { id: result.insertId, nombre, parent_id };
  }

  async update(id, { nombre, parent_id }) {
    await pool.query(
      `UPDATE categorias SET nombre = ?, parent_id = ? WHERE id = ?`,
      [nombre, parent_id || null, id]
    );
    return { id, nombre, parent_id };
  }

  async delete(id) {
    await pool.query(`DELETE FROM categorias WHERE id = ?`, [id]);
  }

  // ===== Paginación (lista con padres + hijos) =====
  async countParents() {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total FROM categorias WHERE parent_id IS NULL`
    );
    return rows[0]?.total ?? 0;
  }

  async findParentsPaginated(limit, offset) {
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id
       FROM categorias
       WHERE parent_id IS NULL
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );
    return rows;
  }

  async findChildrenForParents(parentIds = []) {
    if (!parentIds.length) return [];
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id
       FROM categorias
       WHERE parent_id IN (${parentIds.map(() => '?').join(',')})
       ORDER BY id ASC`,
      parentIds
    );
    return rows;
  }

  // ===== Paginación + búsqueda (lista con padres + hijos que matchean) =====
  async countParentsFiltered(q) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) AS total
       FROM categorias p
       LEFT JOIN categorias c ON c.parent_id = p.id
       WHERE p.parent_id IS NULL
         AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(c.nombre) LIKE LOWER(?))`,
      [like, like]
    );
    return rows[0]?.total ?? 0;
  }

  async findParentIdsPaginatedFiltered(q, limit, offset) {
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT DISTINCT p.id
       FROM categorias p
       LEFT JOIN categorias c ON c.parent_id = p.id
       WHERE p.parent_id IS NULL
         AND (LOWER(p.nombre) LIKE LOWER(?) OR LOWER(c.nombre) LIKE LOWER(?))
       ORDER BY p.id ASC
       LIMIT ? OFFSET ?`,
      [like, like, Number(limit), Number(offset)]
    );
    return rows.map(r => r.id);
  }

  async findParentsByIds(ids = []) {
    if (!ids.length) return [];
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id
       FROM categorias
       WHERE id IN (${ids.map(() => '?').join(',')})
         AND parent_id IS NULL`,
      ids
    );
    const order = new Map(ids.map((id, i) => [id, i]));
    rows.sort((a, b) => order.get(a.id) - order.get(b.id));
    return rows;
  }

  async findChildrenForParentsFiltered(parentIds = [], q) {
    if (!parentIds.length) return [];
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id
       FROM categorias
       WHERE parent_id IN (${parentIds.map(() => '?').join(',')})
         AND LOWER(nombre) LIKE LOWER(?)
       ORDER BY id ASC`,
      [...parentIds, like]
    );
    return rows;
  }

  // ===== SOLO PADRES para Autocomplete asíncrono =====
  async countParentsByName(q) {
    if (!q) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total FROM categorias WHERE parent_id IS NULL`
      );
      return rows[0]?.total ?? 0;
    }
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM categorias
       WHERE parent_id IS NULL AND LOWER(nombre) LIKE LOWER(?)`,
      [like]
    );
    return rows[0]?.total ?? 0;
  }

  async findParentsByNamePaginated({ q = '', limit = 10, offset = 0 }) {
    if (!q) {
      const [rows] = await pool.query(
        `SELECT id, nombre
         FROM categorias
         WHERE parent_id IS NULL
         ORDER BY id ASC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      );
      return rows;
    }
    const like = `%${q}%`;
    const [rows] = await pool.query(
      `SELECT id, nombre
       FROM categorias
       WHERE parent_id IS NULL AND LOWER(nombre) LIKE LOWER(?)
       ORDER BY id ASC
       LIMIT ? OFFSET ?`,
      [like, Number(limit), Number(offset)]
    );
    return rows;
  }
}

module.exports = new CategoriaRepo();
