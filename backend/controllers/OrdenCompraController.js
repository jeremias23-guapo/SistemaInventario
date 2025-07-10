// backend/controllers/OrdenCompraController.js
const OrdenCompraService = require('../services/OrdenCompraService');

exports.listAll = async (req, res, next) => {
  try {
    const ordenes = await OrdenCompraService.listAll();
    res.json(ordenes);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const orden = await OrdenCompraService.getById(Number(req.params.id));
    res.json(orden);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const result = await OrdenCompraService.create(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const result = await OrdenCompraService.update(Number(req.params.id), req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await OrdenCompraService.delete(Number(req.params.id));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
