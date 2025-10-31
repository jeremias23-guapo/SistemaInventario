const pool = require('../config/db');
const EncomendistaRepo = require('../repositories/EncomendistaRepo');

class EncomendistaService {
  // 🔹 Listar
  static async getAll(filtro = '') {
    return await EncomendistaRepo.findAll(filtro);
  }

  // 🔹 Obtener uno
  static async getById(id) {
    return await EncomendistaRepo.findById(id);
  }

  // 🔹 Crear nuevo
  static async create(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const encomId = await EncomendistaRepo.insert(conn, {
        nombre: data.nombre,
        activo: data.activo ?? 1,
      });

      if (data.lugares?.length) {
        for (const l of data.lugares) {
          await EncomendistaRepo.insertLugar(conn, encomId, l);
        }
      }

      await conn.commit();
      return { id: encomId, ...data };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // 🔹 Actualizar
  static async update(id, data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await EncomendistaRepo.update(conn, id, {
        nombre: data.nombre,
        activo: data.activo ?? 1,
      });

      await EncomendistaRepo.deleteLugares(conn, id);
      if (data.lugares?.length) {
        for (const l of data.lugares) {
          await EncomendistaRepo.insertLugar(conn, id, l);
        }
      }

      await conn.commit();
      return { id, ...data };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // 🔹 Eliminar
  static async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await EncomendistaRepo.deleteLugares(conn, id);
      await EncomendistaRepo.delete(conn, id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = EncomendistaService;
