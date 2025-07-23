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
}

module.exports = UsuarioRepo;

