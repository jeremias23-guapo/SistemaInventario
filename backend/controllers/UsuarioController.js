// controllers/UsuarioCtrl.js
const UsuarioService = require('../services/UsuarioService');

exports.login = async (req, res, next) => {
  try {
    const { token, user } = await UsuarioService.authenticate(req.body);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};
