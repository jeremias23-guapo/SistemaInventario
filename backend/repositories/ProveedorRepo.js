// backend/repositories/ProveedorRepo.js
const pool = require('../config/db');

class ProveedorRepo {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM proveedores');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM proveedores WHERE id = ?', [id]);
    return rows[0];
  }

  static async create({ nombre, contacto }) {
    const [result] = await pool.query(
      'INSERT INTO proveedores (nombre, contacto) VALUES (?, ?)',
      [nombre, contacto]
    );
    return { id: result.insertId, nombre, contacto };
  }

  static async update(id, { nombre, contacto }) {
    await pool.query(
      'UPDATE proveedores SET nombre = ?, contacto = ? WHERE id = ?',
      [nombre, contacto, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM proveedores WHERE id = ?', [id]);
    return;
  }
}

module.exports = ProveedorRepo;
