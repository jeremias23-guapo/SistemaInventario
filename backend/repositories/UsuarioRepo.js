// repositories/UsuarioRepo.js
const pool = require('../config/db');

class UsuarioRepo {
  static async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, nombre, username, password, rol_id FROM usuarios WHERE username = ?',
      [username]
    );
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, username, rol_id FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async create({ nombre, username, password, rol_id }) {
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, username, password, rol_id)
       VALUES (?, ?, ?, ?)`,
      [nombre, username, password, rol_id]
    );
    return { id: result.insertId, nombre, username, rol_id };
  }

  static async list() {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre, u.username, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON u.rol_id = r.id`
    );
    return rows;
  }
   static async updateById(id, { nombre, username, password, rol_id }) {
    const fields = ['nombre = ?', 'username = ?', 'rol_id = ?'];
    const values = [nombre, username, rol_id];

    // Si incluyen password, lo añadimos al UPDATE
    if (password) {
      fields.push('password = ?');
      values.push(password);
    }

    // Finalmente el WHERE
    values.push(id);

    const sql = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, values);
    return result.affectedRows;
  }
}

 

module.exports = UsuarioRepo;
