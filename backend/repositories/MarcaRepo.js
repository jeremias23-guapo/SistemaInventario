// repositories/MarcaRepo.js
const pool = require('../config/db');

class MarcaRepo {
  async findAll({ page = 1, pageSize = 10, nombre = '' } = {}) {
    const limit  = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

    const where = [];
    const params = [];

    if (nombre?.trim()) {
      where.push('m.nombre LIKE ?');
      params.push(`%${nombre.trim()}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM marcas m ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT m.id, m.nombre
       FROM marcas m
       ${whereSql}
       ORDER BY m.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { rows, total, page: Math.max(Number(page) || 1, 1), pageSize: limit };
  }

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM marcas WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async create({ nombre }) {
    const [result] = await pool.query(
      'INSERT INTO marcas (nombre) VALUES (?)',
      [nombre]
    );
    return { id: result.insertId, nombre };
  }

  async update(id, { nombre }) {
    await pool.query('UPDATE marcas SET nombre = ? WHERE id = ?', [nombre, id]);
    return { id, nombre };
  }

  async delete(id) {
    await pool.query('DELETE FROM marcas WHERE id = ?', [id]);
  }
}

module.exports = new MarcaRepo();
