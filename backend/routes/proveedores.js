// backend/routes/proveedores.js
const express = require('express');
const ctrl = require('../controllers/ProveedorController');
const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
