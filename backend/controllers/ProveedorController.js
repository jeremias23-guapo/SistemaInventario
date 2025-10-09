// backend/controllers/ProveedorController.js
const ProveedorService = require('../services/ProveedorService');

exports.list = async (req, res, next) => {
  try {
    const page    = Number(req.query.page  ?? 1);
    const limit   = Number(req.query.limit ?? 10);
    const search  = String(req.query.search ?? '');
    const sortBy  = String(req.query.sortBy ?? 'id');
    const sortDir = String(req.query.sortDir ?? 'asc');

    const result = await ProveedorService.getAll({ page, limit, search, sortBy, sortDir });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const item = await ProveedorService.getOne(req.params.id);
    if (!item) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const item = await ProveedorService.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const item = await ProveedorService.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ message: 'Proveedor no encontrado' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await ProveedorService.remove(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
