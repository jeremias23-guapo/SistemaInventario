// backend/services/TransaccionService.js
const pool = require('../config/db');
const TransaccionRepo = require('../repositories/TransaccionRepo');

class TransaccionService {
  // Listar todas las transacciones
  async listAll() {
    return TransaccionRepo.findAll();
  }

  // Obtener transacción por ID
  async getById(id) {
    const tx = await TransaccionRepo.findById(id);
    if (!tx) {
      const err = new Error('Transacción no encontrada');
      err.statusCode = 404;
      throw err;
    }
    return tx;
  }

  // Crear una transacción (compra o venta)
  async create(data) {
    // Aquí podrías validar stock para ventas:
    if (data.tipo_transaccion === 'venta') {
      // validar existencia y stock suficiente
      const producto = await require('../repositories/ProductoRepo').findById(data.id_producto);
      if (!producto) {
        const err = new Error('Producto no encontrado'); err.statusCode = 404; throw err;
      }
      if (producto.stock < data.cantidad_transaccion) {
        const err = new Error('Stock insuficiente'); err.statusCode = 400; throw err;
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx = await TransaccionRepo.create(conn, data);

      // Ajuste de stock según tipo
      const ProductoRepo = require('../repositories/ProductoRepo');
      const delta = data.tipo_transaccion === 'compra'
        ? data.cantidad_transaccion
        : -data.cantidad_transaccion;
      await ProductoRepo.adjustStock(conn, data.id_producto, delta);

      await conn.commit();
      return tx;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // No implementamos update; historial transaccional debería ser inmutable

  // Eliminar transacción específica
  async remove(id) {
    // podrías validar fecha o seguridad antes de permitir borrado
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await TransaccionRepo.delete(conn, id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new TransaccionService();
