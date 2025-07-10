// backend/controllers/CategoriaController.js
const CategoriaService = require('../services/CategoriaService');

exports.getCategorias = async (req, res) => {
  try {
    const lista = await CategoriaService.listarCategorias();
    res.json(lista);
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
  console.log('📝 Body recibido:', req.body);
  try {
    const result = await CategoriaService.crearCategoria(req.body);
    res.status(201).json(result);
  } catch (e) {
    console.error('❌ Error al crear categoría:', e);
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

exports.getCategoriasPadre = async (req, res) => {
  try {
    const lista = await CategoriaService.listarCategoriasPadre();  // Solo categorías padres
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getSubcategorias = async (req, res) => {
  const { categoriaId } = req.params;
  try {
    const subcategorias = await CategoriaService.listarSubcategorias(categoriaId);
    res.json(subcategorias);  // Devuelve subcategorías de la categoría seleccionada
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
// backend/controllers/CategoriaController.js
exports.getCategoriasPadre = async (req, res) => {
  try {
    const lista = await CategoriaService.listarCategoriasPadre();
    res.json(lista);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
