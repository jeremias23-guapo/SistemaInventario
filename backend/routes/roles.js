// routes/roles.js
const router     = require('express').Router();
const RoleCtrl   = require('../controllers/RoleController');
const authenticate = require('../middlewares/authenticate');
const authorize    = require('../middlewares/authorize');

// Protegemos con JWT y autorizamos todos los roles (o solo admin si quieres)
router.get('/', authenticate, authorize([1]), RoleCtrl.list);

// Si quieres que todos los usuarios autenticados vean los roles:
// router.get('/', authenticate, RoleCtrl.list);

module.exports = router;
