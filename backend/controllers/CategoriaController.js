// backend/controllers/CategoriaController.js
const CategoriaService = require('../services/CategoriaService');

exports.getCategorias = async (req, res) => {
  try {
    const { page, limit, q } = req.query;

    if (!page && !limit && !q) {
      const lista = await CategoriaService.listarCategorias();
      return res.json(lista);
    }

    const { items, totalParents } = await CategoriaService.listarCategoriasPaginadas(page, limit, q);
    res.set('X-Total-Count', String(totalParents));
    return res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getCategoria = async (req, res) => {
  try {
    const c = await CategoriaService.obtenerCategoria(req.params.id);
    res.json(c);
  } catch (e) {
    res.status(e.message === 'Categoría no encontrada' ? 404 : 500)
       .json({ error: e.message });
  }
};

exports.createCategoria = async (req, res) => {
  console.log('?? Body recibido:', req.body);
  try {
    const result = await CategoriaService.crearCategoria(req.body);
    res.status(201).json(result);
  } catch (e) {
    console.error('? Error al crear categoría:', e);
    if (e.message.startsWith('Validación:')) {
      return res.status(400).json({ error: e.message });
    }
    res.status(500).json({ error: e.message });
  }
};

exports.updateCategoria = async (req, res) => {
  try {
    const result = await CategoriaService.actualizarCategoria(req.params.id, req.body);
    res.json(result);
  } catch (e) {
    const status = e.message === 'Categoría no encontrada' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    await CategoriaService.eliminarCategoria(req.params.id);
    res.json({ message: 'Categoría eliminada' });
  } catch (e) {
    const status = e.message === 'Categoría no encontrada' ? 404 : 400;
    res.status(status).json({ error: e.message });
  }
};

// === NUEVO: padres con paginado/búsqueda para Autocomplete ===
exports.getCategoriasPadre = async (req, res) => {
  try {
    const { page, limit, q } = req.query;

    if (!page && !limit && !q) {
      const lista = await CategoriaService.listarCategoriasPadre();
      return res.json(lista);
    }

    const { items, total } = await CategoriaService.listarSoloPadres({ page, limit, q });
    res.set('X-Total-Count', String(total));
    return res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSubcategorias = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const subcategorias = await CategoriaService.listarSubcategorias(categoriaId);
    res.json(subcategorias);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
