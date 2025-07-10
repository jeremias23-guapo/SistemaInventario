// backend/services/CategoriaService.js
const CategoriaRepo = require('../repositories/CategoriaRepo');
const pool = require('../config/db');

class CategoriaService {
  // Listar todas las categorías (padre e hija)
  async listarCategorias() {
    return CategoriaRepo.findAll();  // Asume que aquí ya quitas is_deleted o lo manejas en el repo
  }

  // Obtener solo categorías padre
  async listarCategoriasPadre() {
    // Quitamos is_deleted de la cláusula
    const [rows] = await pool.query(`
      SELECT id, nombre
      FROM categorias
      WHERE parent_id IS NULL
    `);
    return rows;
  }

  // Obtener subcategorías de una categoría seleccionada
  async listarSubcategorias(categoriaId) {
    // Igual, sin is_deleted
    const [rows] = await pool.query(`
      SELECT id, nombre
      FROM categorias
      WHERE parent_id = ?
    `, [categoriaId]);
    return rows;
  }

  // Obtener una categoría por su ID
  async obtenerCategoria(id) {
    const c = await CategoriaRepo.findById(id);
    if (!c) throw new Error('Categoría no encontrada');
    return c;
  }

  // Crear una nueva categoría
  async crearCategoria(data) {
    const { nombre, parent_id } = data;
    if (parent_id != null) {
      if (parent_id === data.id) {
        throw new Error('Validación: parent_id no puede ser igual al id de la categoría');
      }
      const padre = await CategoriaRepo.findById(parent_id);
      if (!padre) throw new Error('Validación: Categoría padre no existe');
    }
    return await CategoriaRepo.create({ nombre, parent_id });
  }

  // Actualizar una categoría
  async actualizarCategoria(id, datos) {
    const { nombre, parent_id } = datos;
    await this.obtenerCategoria(id);
    if (parent_id != null) {
      if (parent_id === id) throw new Error('Validación: parent_id no puede ser igual al id de la categoría');
      const padre = await CategoriaRepo.findById(parent_id);
      if (!padre) throw new Error('Validación: Categoría padre no existe');
    }
    return await CategoriaRepo.update(id, { nombre, parent_id });
  }

  // Eliminar una categoría
  async eliminarCategoria(id) {
    await this.obtenerCategoria(id);
    await CategoriaRepo.delete(id);
  }
}

module.exports = new CategoriaService();
