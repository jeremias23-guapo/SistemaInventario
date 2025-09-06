// backend/routes/ordenes_compra.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/OrdenCompraController');
router.get('/search', ctrl.search);
router.get('/',    ctrl.listAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
