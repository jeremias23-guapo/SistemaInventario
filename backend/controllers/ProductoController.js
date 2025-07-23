const productoService = require('../services/ProductoService');



exports.getProductos = async (req, res) => {
  try {
    // Ahora extraemos subcategoriaId además de search y categoriaId
    const {
      search = '',
      categoriaId = '',
      subcategoriaId = ''
    } = req.query;

    const filters = {
      search,
      categoriaId,
      subcategoriaId
    };

    const lista = await productoService.listarProductos(filters);
    res.json(lista);
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

exports.deleteProducto = async (req, res) => {
  try {
    await productoService.eliminarProducto(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(err.message === 'Producto no encontrado' ? 404 : 400)
       .json({ error: err.message });
  }
};
