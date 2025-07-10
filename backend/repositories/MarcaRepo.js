const pool = require('../config/db');

class MarcaRepo {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM marcas'
    );
    return rows;
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
    await pool.query(
      'UPDATE marcas SET nombre = ? WHERE id = ?',
      [nombre, id]
    );
    return { id, nombre };
  }

  async delete(id) {
    await pool.query(
      'DELETE FROM marcas WHERE id = ?',
      [id]
    );
  }
}

module.exports = new MarcaRepo();
