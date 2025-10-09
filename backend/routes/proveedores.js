// backend/routes/proveedores.js

const { Router } = require('express');
const ctrl = require('../controllers/ProveedorController');

const router = Router();

// GET /api/proveedores?page=1&limit=10&search=foo&sortBy=nombre&sortDir=asc
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
