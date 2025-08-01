// repositories/RoleRepo.js
const pool = require('../config/db');

class RoleRepo {
  static async list() {
    const [rows] = await pool.query(
      'SELECT id, nombre FROM roles'
    );
    return rows;
  }
}

module.exports = RoleRepo;
