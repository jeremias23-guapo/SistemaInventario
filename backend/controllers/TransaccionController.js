const TransaccionService = require('../services/TransaccionService');

exports.getAll = async (req, res, next) => {
  try {
    const txs = await TransaccionService.listAll();
    res.json(txs);
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
