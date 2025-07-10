// backend/controllers/ClienteController.js
const ClienteService = require('../services/ClienteService');

exports.listAll = async (req, res, next) => {
  try {
    const clientes = await ClienteService.listAll();
    res.json(clientes);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const cliente = await ClienteService.getById(req.params.id);
    res.json(cliente);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const newCliente = await ClienteService.create(req.body);
    res.status(201).json(newCliente);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updatedCliente = await ClienteService.update(req.params.id, req.body);
    res.json(updatedCliente);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await ClienteService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
