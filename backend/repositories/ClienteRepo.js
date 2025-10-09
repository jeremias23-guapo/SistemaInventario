// backend/repositories/ClienteRepo.js
const pool = require('../config/db');

class ClienteRepo {
  // 1.a) Listar todos los clientes
  static async findAll({ limit = 10, offset = 0 }) {
    const [rows] = await pool.query(
      `SELECT id, nombre, contacto, email, direccion, created_at, modified_at
       FROM clientes
       ORDER BY nombre
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // también contar total para frontend
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM clientes'
    );

    return { data: rows, total };
  }

  // 1.b) Obtener un cliente por ID
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, nombre, contacto, email, direccion FROM clientes WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // 1.c) Crear un cliente nuevo
  static async create({ nombre, contacto, email, direccion }) {
    const [result] = await pool.query(
      `INSERT INTO clientes 
         (nombre, contacto, email, direccion) 
       VALUES (?, ?, ?, ?)`,
      [nombre, contacto || null, email || null, direccion || null]
    );
    return { id: result.insertId, nombre, contacto, email, direccion };
  }

  // 1.d) Actualizar un cliente existente
  static async update(id, { nombre, contacto, email, direccion }) {
    const fields = [];
    const params = [];
    if (nombre !== undefined) {
      fields.push('nombre = ?');
      params.push(nombre);
    }
    if (contacto !== undefined) {
      fields.push('contacto = ?');
      params.push(contacto);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }
    if (direccion !== undefined) {
      fields.push('direccion = ?');
      params.push(direccion);
    }
    if (fields.length === 0) {
      // Nada que actualizar
      return this.findById(id);
    }
    params.push(id);
    await pool.query(
      `UPDATE clientes SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return this.findById(id);
  }

  // 1.e) Eliminar un cliente
  static async delete(id) {
    await pool.query('DELETE FROM clientes WHERE id = ?', [id]);
  }

  // 1.f) Búsqueda ligera paginada (para autocompletar)
  static async searchLight({ q = '', page = 1, limit = 10 }) {
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * pageSize;

    const hasQuery = (q ?? '').trim().length > 0;
    const like = `%${(q || '').toLowerCase()}%`;

    // TOTAL
    const [countRows] = await pool.query(
      hasQuery
        ? 'SELECT COUNT(*) AS total FROM clientes WHERE LOWER(nombre) LIKE ?'
        : 'SELECT COUNT(*) AS total FROM clientes',
      hasQuery ? [like] : []
    );
    const total = Number(countRows?.[0]?.total ?? 0);

    // ITEMS (solo los campos necesarios para el autocomplete)
    const [rows] = await pool.query(
      `
        SELECT id, nombre
        FROM clientes
        ${hasQuery ? 'WHERE LOWER(nombre) LIKE ?' : ''}
        ORDER BY nombre ASC, id ASC
        LIMIT ? OFFSET ?
      `,
      hasQuery ? [like, pageSize, offset] : [pageSize, offset]
    );

    const items = Array.isArray(rows) ? rows : (rows ? [rows] : []);
    const hasMore = pageNum * pageSize < total;
    return { items, total, hasMore };
  }
}

module.exports = ClienteRepo;
