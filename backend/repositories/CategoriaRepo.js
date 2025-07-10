const pool = require('../config/db');

class CategoriaRepo {
  // Obtener todas las categorías
  async findAll() {
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id FROM categorias`
    );
    return rows;
  }

  // Obtener una categoría por ID
  async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, nombre, parent_id FROM categorias WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Crear una nueva categoría
  async create({ nombre, parent_id }) {
    const [result] = await pool.query(
      `INSERT INTO categorias (nombre, parent_id) VALUES (?, ?)`,
      [nombre, parent_id || null]
    );
    return { id: result.insertId, nombre, parent_id };
  }

  // Actualizar una categoría existente
  async update(id, { nombre, parent_id }) {
    await pool.query(
      `UPDATE categorias SET nombre = ?, parent_id = ? WHERE id = ?`,
      [nombre, parent_id || null, id]
    );
    return { id, nombre, parent_id };
  }

  // Eliminar una categoría (borrado físico)
  async delete(id) {
    await pool.query(
      `DELETE FROM categorias WHERE id = ?`,
      [id]
    );
  }
}

module.exports = new CategoriaRepo();

