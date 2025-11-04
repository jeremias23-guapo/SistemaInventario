// routes/transportistas.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/TransportistaController');
const authenticate = require('../middlewares/authenticate');

// Protege todos los endpoints
router.use(authenticate);

// CRUD transportistas
router.get('/', ctrl.list);          // ?page=&pageSize=&q=
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Reglas del transportista
router.get('/:id/reglas', ctrl.listRules);
router.post('/:id/reglas', ctrl.upsertRule);    // crea/actualiza 1 regla (por metodo_pago)
router.delete('/reglas/:rid', ctrl.deleteRule); // elimina por id de regla

module.exports = router;
