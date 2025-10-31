const EncomendistaService = require('../services/EncomendistaService');

exports.getAll = async (req, res, next) => {
  try {
    const filtro = req.query.q || '';
    const data = await EncomendistaService.getAll(filtro);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const data = await EncomendistaService.getById(req.params.id);
    if (!data) return res.status(404).json({ message: 'No encontrado' });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const newItem = await EncomendistaService.create(req.body);
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await EncomendistaService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await EncomendistaService.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
