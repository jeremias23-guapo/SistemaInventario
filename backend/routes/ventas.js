// backend/routes/ventas.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/VentaController');
const authenticate = require('../middlewares/authenticate'); // 👈 importa el middleware

// Aplica auth a todas las rutas de /api/ventas
router.use(authenticate); // 👈 con esto, req.user siempre existe

router.get('/search', ctrl.search);
router.get('/',    ctrl.listAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);          // req.user.sub disponible
router.put('/:id', ctrl.update);          // req.user.sub disponible
router.delete('/:id', ctrl.remove);       // req.user.sub disponible
router.post('/:id/cancelar', ctrl.cancelarVenta);

module.exports = router;
