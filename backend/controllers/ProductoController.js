const productoService = require('../services/ProductoService');

exports.getProductos = async (req, res) => {
  try {
    const { search, categoriaId } = req.query;  // Obtener los filtros de la query string
    const filters = {
      search: search || '',
      categoriaId: categoriaId || ''
    };
    const lista = await productoService.listarProductos(filters);  // Pasar los filtros al servicio
    res.json(lista);
  } catch (err) {
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

exports.deleteProducto = async (req, res) => {
  try {
    await productoService.eliminarProducto(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(err.message === 'Producto no encontrado' ? 404 : 400)
       .json({ error: err.message });
  }
};
