// backend/controllers/ClienteController.js
const ClienteService = require('../services/ClienteService');

exports.listAll = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const clientes = await ClienteService.listAll({ limit, offset });
    res.json({
      data: clientes.data,
      total: clientes.total,
      page,
      pages: Math.ceil(clientes.total / limit)
    });
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

// GET /api/clientes/search?q=texto&page=1&limit=10
exports.searchLight = async (req, res, next) => {
  try {
    const q     = String(req.query.q ?? '');
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { items, total, hasMore } = await ClienteService.searchLight({ q, page, limit });
    res.json({ items, total, hasMore, page, limit });
  } catch (err) {
    next(err);
  }
};
