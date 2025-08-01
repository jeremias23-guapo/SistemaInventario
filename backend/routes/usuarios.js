// backend/routes/usuarios.js
const router      = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const authorize   = require('../middlewares/authorize');
const UsuarioCtrl = require('../controllers/UsuarioController');

router.use(authenticate);

router.get('/',      authorize([1]), UsuarioCtrl.list);
router.get('/:id',   authorize([1]), UsuarioCtrl.getById);
router.post('/',     authorize([1]), UsuarioCtrl.register);

// **AÑADIR ESTA LÍNEA** para que exista PUT /api/usuarios/:id
router.put('/:id',   authorize([1]), UsuarioCtrl.update);

module.exports = router;
