const TransaccionService = require('../services/TransaccionService');

exports.getAll = async (req, res, next) => {
  try {
    const limit  = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
    const cursor = req.query.cursor || null;

    const page = await TransaccionService.listPage({ limit, cursor });
    res.json(page);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const tx = await TransaccionService.getById(req.params.id);
    res.json(tx);
  } catch (err) {
    next(err);
  }
};
exports.create = async (req, res, next) => {
  try {
    const newTx = await TransaccionService.create(req.body);
    res.status(201).json(newTx);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await TransaccionService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await TransaccionService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
