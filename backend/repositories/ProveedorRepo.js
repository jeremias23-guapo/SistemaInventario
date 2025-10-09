// backend/repositories/ProveedorRepo.js
const pool = require('../config/db');

class ProveedorRepo {
  static async findPage({ page = 1, limit = 10, search = '', sortBy = 'id', sortDir = 'asc' }) {
    const safePage  = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
    const offset = (safePage - 1) * safeLimit;

    // Whitelist para ORDER BY
    const allowedSort = new Set(['id', 'nombre', 'contacto']);
    const by  = allowedSort.has(sortBy) ? sortBy : 'id';
    const dir = String(sortDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const hasSearch = Boolean(search && String(search).trim());
    const where = hasSearch ? 'WHERE nombre LIKE ? OR contacto LIKE ?' : '';
    const whereParams = hasSearch ? [`%${search}%`, `%${search}%`] : [];

    // Datos paginados
    const [rows] = await pool.query(
      `
      SELECT id, nombre, contacto
      FROM proveedores
      ${where}
      ORDER BY ${by} ${dir}
      LIMIT ? OFFSET ?
      `,
      [...whereParams, safeLimit, offset]
    );

    // Total para paginador
    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM proveedores
      ${where}
      `,
      whereParams
    );

    const total = countRows[0]?.total ?? 0;
    return {
      data: rows,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit))
    };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, contacto FROM proveedores WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ nombre, contacto }) {
    const [res] = await pool.query(
      `INSERT INTO proveedores (nombre, contacto) VALUES (?, ?)`,
      [nombre, contacto]
    );
    return { id: res.insertId, nombre, contacto };
  }

  static async update(id, { nombre, contacto }) {
    await pool.query(
      `UPDATE proveedores SET nombre = ?, contacto = ? WHERE id = ?`,
      [nombre, contacto, id]
    );
    return this.findById(id);
  }

  static async remove(id) {
    await pool.query(`DELETE FROM proveedores WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = ProveedorRepo;
