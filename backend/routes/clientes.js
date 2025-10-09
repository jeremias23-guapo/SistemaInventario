// backend/routes/clientes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ClienteController');

// Importante: /search ANTES de /:id
router.get('/',        ctrl.listAll);
router.get('/search',  ctrl.searchLight);
router.get('/:id',     ctrl.getOne);
router.post('/',       ctrl.create);
router.put('/:id',     ctrl.update);
router.delete('/:id',  ctrl.remove);

module.exports = router;
