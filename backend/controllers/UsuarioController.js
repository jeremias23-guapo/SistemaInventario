// backend/controllers/UsuarioController.js
const UsuarioService = require('../services/UsuarioService');

exports.login = async (req, res, next) => {
  try {
    const { token, user } = await UsuarioService.authenticate(req.body);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const user = await UsuarioService.register(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const users = await UsuarioService.getAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const user = await UsuarioService.getById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// ← ESTE export debe ir FUERA de getById, al mismo nivel que los anteriores
exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await UsuarioService.update(id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
};
