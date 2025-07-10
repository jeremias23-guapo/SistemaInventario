const pool = require('../config/db');
const ProductoRepo = require('../repositories/ProductoRepo');

class ProductoService {
  // Listar productos con filtros
  async listarProductos(filters = {}) {
    return ProductoRepo.findAll(filters);
  }

  // Obtener producto por ID
  async obtenerProducto(id) {
    const prod = await ProductoRepo.findById(id);
    if (!prod) {
      const err = new Error('Producto no encontrado');
      err.statusCode = 404;
      throw err;
    }
    return prod;
  }

  // Crear producto
  async crearProducto(data) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const insertId = await ProductoRepo.create(conn, data);
      await conn.commit();
      return { id: insertId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Actualizar producto
  async actualizarProducto(id, data) {
    await this.obtenerProducto(id);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await ProductoRepo.update(conn, id, data);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Eliminar producto (soft delete)
  async eliminarProducto(id) {
    await this.obtenerProducto(id);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await ProductoRepo.softDelete(conn, id);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Ajustar stock
  async ajustarStock(id, delta) {
    const prod = await this.obtenerProducto(id);
    if (prod.stock + delta < 0) {
      const err = new Error('Stock insuficiente');
      err.statusCode = 400;
      throw err;
    }
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await ProductoRepo.adjustStock(conn, id, delta);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new ProductoService();
