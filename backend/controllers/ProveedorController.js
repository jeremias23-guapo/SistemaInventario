// backend/controllers/ProveedorCtrl.js
const ProveedorService = require('../services/ProveedorService');

exports.list = async (req, res, next) => {
  try {
    const proveedores = await ProveedorService.getAll();
    res.json(proveedores);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const proveedor = await ProveedorService.getOne(req.params.id);
    if (!proveedor) return res.status(404).json({ message: 'No encontrado' });
    res.json(proveedor);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const nuevo = await ProveedorService.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const actualizado = await ProveedorService.update(req.params.id, req.body);
    res.json(actualizado);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await ProveedorService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
