const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/EncomendistaController');

// GET /api/encomendistas?q=busqueda
router.get('/', ctrl.getAll);

// GET /api/encomendistas/:id
router.get('/:id', ctrl.getOne);

// POST /api/encomendistas
router.post('/', ctrl.create);

// PUT /api/encomendistas/:id
router.put('/:id', ctrl.update);

// DELETE /api/encomendistas/:id
router.delete('/:id', ctrl.remove);

module.exports = router;
