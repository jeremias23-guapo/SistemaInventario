// routes/auth.js
const router = require('express').Router();
const { login } = require('../controllers/UsuarioController');

// Debe ser EXACTAMENTE así:
router.post('/', login);

module.exports = router;

