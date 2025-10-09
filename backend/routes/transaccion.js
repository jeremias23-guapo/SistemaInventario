// backend/routes/transacciones.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/TransaccionController');

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/',   ctrl.create);
router.delete('/:id', ctrl.remove); // seguimos sin update por inmutabilidad

module.exports = router;
