// backend/controllers/VentaController.js
const VentaService = require('../services/VentaService');

exports.listAll = async (req, res, next) => {
  try {
    const ventas = await VentaService.listAll();
    res.json(ventas);
  } catch (err) {
    next(err);
  }
};
exports.search = async (req, res, next) => {
  try {
    const { codigo, proveedor_id, fecha } = req.query;
    const resultados = await VentaService.search({ codigo, fecha });
    res.json(resultados);
  } catch (err) {
    next(err);
  }
};
exports.getOne = async (req, res, next) => {
  try {
    const venta = await VentaService.getById(req.params.id);
    res.json(venta);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const newVenta = await VentaService.create(req.body);
    res.status(201).json(newVenta);
  } catch (err) {
    next(err);
  }
};
exports.cancelarVenta = async (req, res, next) => {
  try {
    const { motivo } = req.body;
    const result = await VentaService.cancel(Number(req.params.id), motivo);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
exports.update = async (req, res, next) => {
  try {
    const updatedVenta = await VentaService.update(req.params.id, req.body);
    res.json(updatedVenta);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await VentaService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
