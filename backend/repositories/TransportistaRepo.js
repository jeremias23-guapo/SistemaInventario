const pool = require('../config/db');

class TransportistaRepo {
  // --- Transportistas ---

  static async findAllPaged({ page, pageSize, q }) {
    const offset = (page - 1) * pageSize;
    const like = `%${q}%`;

    const where = q ? 'WHERE nombre LIKE ?' : '';
    const params = q ? [like] : [];

    // total
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM transportistas ${where}`,
      params
    );
    const total = countRows[0].total || 0;

    // items
    const [rows] = await pool.query(
      `SELECT id, nombre, activo, precio_envio
         FROM transportistas
         ${where}
        ORDER BY nombre
        LIMIT ? OFFSET ?`,
      q ? [like, pageSize, offset] : [pageSize, offset]
    );

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return { items: rows, total, page, pageSize, totalPages };
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, activo, precio_envio
         FROM transportistas
        WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ nombre, activo = 1, precio_envio = 0 }) {
    const [r] = await pool.query(
      `INSERT INTO transportistas (nombre, activo, precio_envio) VALUES (?, ?, ?)`,
      [nombre, activo ? 1 : 0, precio_envio]
    );
    return r.insertId;
  }

  static async update(id, { nombre, activo = 1, precio_envio = 0 }) {
    await pool.query(
      `UPDATE transportistas SET nombre=?, activo=?, precio_envio=? WHERE id=?`,
      [nombre, activo ? 1 : 0, precio_envio, id]
    );
  }

  static async remove(id) {
    await pool.query(`DELETE FROM transportistas WHERE id=?`, [id]);
  }

  // --- Reglas ---
  static async listRules(transportistaId) {
    const [rows] = await pool.query(
      `SELECT id, metodo_pago, porcentaje, fijo_usd, umbral_monto, aplica_si_menor_que
         FROM transportista_reglas
        WHERE transportista_id = ?`,
      [transportistaId]
    );
    return rows;
  }

  static async upsertRule(
    transportistaId,
    { metodo_pago, porcentaje = 0, fijo_usd = 0, umbral_monto = null, aplica_si_menor_que = 0 }
  ) {
    await pool.query(
      `INSERT INTO transportista_reglas
         (transportista_id, metodo_pago, porcentaje, fijo_usd, umbral_monto, aplica_si_menor_que)
       VALUES (?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         porcentaje=VALUES(porcentaje),
         fijo_usd=VALUES(fijo_usd),
         umbral_monto=VALUES(umbral_monto),
         aplica_si_menor_que=VALUES(aplica_si_menor_que)`,
      [transportistaId, metodo_pago, porcentaje, fijo_usd, umbral_monto, aplica_si_menor_que ? 1 : 0]
    );
  }

  static async deleteRule(ruleId) {
    await pool.query(`DELETE FROM transportista_reglas WHERE id=?`, [ruleId]);
  }
}

module.exports = TransportistaRepo;
