const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/TransportistaController');
const authenticate = require('../middlewares/authenticate');

// Igual que /api/ventas: proteger todo con auth
router.use(authenticate); // req.user disponible (rol, sub, etc.)  :contentReference[oaicite:3]{index=3}

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

// Reglas
router.get('/:id/reglas', ctrl.listRules);
router.post('/:id/reglas', ctrl.upsertRule);
router.delete('/reglas/:rid', ctrl.deleteRule);

module.exports = router;
