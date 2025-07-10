const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/MarcaController.js');

router.get('/',    ctrl.getMarcas);
router.get('/:id', ctrl.getMarca);
router.post('/',   ctrl.createMarca);
router.put('/:id', ctrl.updateMarca);
router.delete('/:id', ctrl.deleteMarca);

module.exports = router;

