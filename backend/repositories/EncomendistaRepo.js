const pool = require('../config/db');

class EncomendistaRepo {
  // 🔹 Listar todos (con búsqueda opcional)
  static async findAll(filtro = '') {
    const [rows] = await pool.query(
      `
      SELECT e.id, e.nombre, e.activo,
             l.lugar, l.dias_horarios
      FROM encomendistas e
      LEFT JOIN encomendista_lugares l ON e.id = l.encomendista_id
      WHERE e.nombre LIKE ? OR l.lugar LIKE ?
      ORDER BY e.nombre, l.lugar
      `,
      [`%${filtro}%`, `%${filtro}%`]
    );

    // Agrupar resultados por encomendista
    const map = new Map();

    for (const r of rows) {
      if (!map.has(r.id)) {
        map.set(r.id, {
          id: r.id,
          nombre: r.nombre,
          activo: r.activo,
          lugares: [],
        });
      }

      if (r.lugar) {
        map.get(r.id).lugares.push({
          lugar: r.lugar,
          dias_horarios: r.dias_horarios,
        });
      }
    }

    // Convertir a array y agregar campos de resumen
    const result = Array.from(map.values()).map((e) => ({
      ...e,
      lugares_texto: e.lugares.map((l) => l.lugar).join(', '),
      num_lugares: e.lugares.length,
    }));

    return result;
  }
  // 🔹 Obtener uno con sus lugares
  static async findById(id) {
    const [rowsE] = await pool.query(
      `SELECT * FROM encomendistas WHERE id = ?`,
      [id]
    );
    if (!rowsE.length) return null;

    const [rowsL] = await pool.query(
      `SELECT id, lugar, dias_horarios FROM encomendista_lugares WHERE encomendista_id = ? ORDER BY lugar`,
      [id]
    );

    return { ...rowsE[0], lugares: rowsL };
  }

  // 🔹 Insertar nuevo encomendista
  static async insert(conn, { nombre, activo = 1 }) {
    const [res] = await conn.query(
      `INSERT INTO encomendistas (nombre, activo) VALUES (?, ?)`,
      [nombre, activo]
    );
    return res.insertId;
  }

  // 🔹 Insertar un lugar asociado
  static async insertLugar(conn, encomId, { lugar, dias_horarios }) {
    await conn.query(
      `INSERT INTO encomendista_lugares (encomendista_id, lugar, dias_horarios)
       VALUES (?, ?, ?)`,
      [encomId, lugar, dias_horarios || null]
    );
  }

  // 🔹 Actualizar encomendista
  static async update(conn, id, { nombre, activo }) {
    await conn.query(
      `UPDATE encomendistas SET nombre = ?, activo = ? WHERE id = ?`,
      [nombre, activo, id]
    );
  }

  // 🔹 Eliminar todos los lugares de un encomendista
  static async deleteLugares(conn, encomId) {
    await conn.query(
      `DELETE FROM encomendista_lugares WHERE encomendista_id = ?`,
      [encomId]
    );
  }

  // 🔹 Eliminar el encomendista
  static async delete(conn, id) {
    await conn.query(`DELETE FROM encomendistas WHERE id = ?`, [id]);
  }
}

module.exports = EncomendistaRepo;
