const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ProductoController');

router.get('/', ctrl.getProductos);
router.get('/search', ctrl.searchProductosLight); // NUEVO autocompletar liviano
router.get('/:id', ctrl.getProducto);
router.post('/', ctrl.createProducto);
router.put('/:id', ctrl.updateProducto);
router.delete('/:id', ctrl.deleteProducto);

module.exports = router;
