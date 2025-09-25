// backend/services/CategoriaService.js
const CategoriaRepo = require('../repositories/CategoriaRepo');
const pool = require('../config/db');

class CategoriaService {
  // ===== legacy / CRUD =====
  async listarCategorias() {
    return CategoriaRepo.findAll();
  }

  async listarCategoriasPadre() {
    const [rows] = await pool.query(`
      SELECT id, nombre
      FROM categorias
      WHERE parent_id IS NULL
    `);
    return rows;
  }

  async listarSubcategorias(categoriaId) {
    const [rows] = await pool.query(
      `SELECT id, nombre FROM categorias WHERE parent_id = ?`,
      [categoriaId]
    );
    return rows;
  }

  async obtenerCategoria(id) {
    const c = await CategoriaRepo.findById(id);
    if (!c) throw new Error('Categoría no encontrada');
    return c;
  }

  async crearCategoria(data) {
    const { nombre, parent_id } = data;
    if (parent_id != null) {
      if (parent_id === data.id) throw new Error('Validación: parent_id no puede ser igual al id de la categoría');
      const padre = await CategoriaRepo.findById(parent_id);
      if (!padre) throw new Error('Validación: Categoría padre no existe');
    }
    return await CategoriaRepo.create({ nombre, parent_id });
  }

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

  async eliminarCategoria(id) {
    await this.obtenerCategoria(id);
    await CategoriaRepo.delete(id);
  }

  // ===== categorías con paginación/búsqueda (listado) =====
  async listarCategoriasPaginadas(page = 1, limit = 10, q = '') {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const offset = (p - 1) * l;
    const hasQ = typeof q === 'string' && q.trim().length > 0;

    if (!hasQ) {
      const totalParents = await CategoriaRepo.countParents();
      const parents = await CategoriaRepo.findParentsPaginated(l, offset);
      const children = await CategoriaRepo.findChildrenForParents(parents.map(r => r.id));
      return { items: [...parents, ...children], totalParents };
    }

    const qval = q.trim();
    const totalParents = await CategoriaRepo.countParentsFiltered(qval);
    const parentIds = await CategoriaRepo.findParentIdsPaginatedFiltered(qval, l, offset);
    const parents = await CategoriaRepo.findParentsByIds(parentIds);
    const children = await CategoriaRepo.findChildrenForParentsFiltered(parentIds, qval);
    return { items: [...parents, ...children], totalParents };
  }

  // ===== SOLO PADRES para Autocomplete asíncrono =====
  async listarSoloPadres({ page = 1, limit = 10, q = '' }) {
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const offset = (p - 1) * l;

    const total = await CategoriaRepo.countParentsByName(q?.trim?.() || '');
    const items = await CategoriaRepo.findParentsByNamePaginated({
      q: q?.trim?.() || '',
      limit: l,
      offset,
    });
    return { items, total };
  }
}

module.exports = new CategoriaService();
