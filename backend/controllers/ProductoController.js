const productoService = require('../services/ProductoService');



exports.getProductos = async (req, res) => {
  try {
    const {
      search = '', categoriaId = '', subcategoriaId = '',
      page = '1', pageSize = '10'
    } = req.query;

    const filters = { search, categoriaId, subcategoriaId };
    const options = {
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 10)),
    };

    const result = await productoService.listarProductos(filters, options);
    res.json(result);
  } catch (err) {
    console.error('Error cargando productos:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getProducto = async (req, res) => {
  try {
    const prod = await productoService.obtenerProducto(req.params.id);
    res.json(prod);
  } catch (err) {
    res.status(err.message === 'Producto no encontrado' ? 404 : 500)
       .json({ error: err.message });
  }
};

exports.createProducto = async (req, res) => {
  try {
    const result = await productoService.crearProducto(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateProducto = async (req, res) => {
  try {
    await productoService.actualizarProducto(req.params.id, req.body);
    res.json({ message: 'Producto actualizado' });
  } catch (err) {
    res.status(err.message === 'Producto no encontrado' ? 404 : 400)
       .json({ error: err.message });
  }
};
// NUEVO: endpoint liviano para autocompletar
exports.searchProductosLight = async (req, res) => {
  try {
    const {
      q = '', page = '1', pageSize = '20' // nombres cortos típicos de autocompletar
    } = req.query;

    const result = await productoService.buscarProductosLight(
      { search: q },
      { page: Math.max(1, parseInt(page, 10) || 1), pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20)) }
    );

    // Respuesta mínima ideal para FE: items + hasMore
    res.json({ items: result.items, hasMore: result.hasMore, page: result.page, pageSize: result.pageSize, total: result.total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.deleteProducto = async (req, res) => {
  try {
    await productoService.eliminarProducto(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(err.message === 'Producto no encontrado' ? 404 : 400)
       .json({ error: err.message });
  }
};
