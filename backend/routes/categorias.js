// backend/routes/categorias.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/CategoriaController');

// Rutas específicas primero
router.get('/padres',                     ctrl.getCategoriasPadre);
router.get('/:categoriaId/subcategorias', ctrl.getSubcategorias);

// Luego las genéricas
router.get('/',                           ctrl.getCategorias);
router.get('/:id',                        ctrl.getCategoria);
router.post('/',                          ctrl.createCategoria);
router.put('/:id',                        ctrl.updateCategoria);
router.delete('/:id',                     ctrl.deleteCategoria);

module.exports = router;

