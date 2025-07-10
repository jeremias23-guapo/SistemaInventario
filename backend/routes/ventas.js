// backend/routes/ventas.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/VentaController');
router.get('/search', ctrl.search);
router.get('/',    ctrl.listAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/cancelar', ctrl.cancelarVenta);  // ← ruta dedicada
module.exports = router;
