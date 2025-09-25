const TransportistaService = require('../services/TransportistaService');

exports.list = async (req, res, next) => {
  try { res.json(await TransportistaService.list()); }
  catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try { res.json(await TransportistaService.get(Number(req.params.id))); }
  catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try { res.status(201).json(await TransportistaService.create(req.body)); }
  catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try { res.json(await TransportistaService.update(Number(req.params.id), req.body)); }
  catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try { await TransportistaService.remove(Number(req.params.id)); res.status(204).end(); }
  catch (e) { next(e); }
};

// --- Reglas ---
exports.listRules = async (req, res, next) => {
  try { res.json(await TransportistaService.listRules(Number(req.params.id))); }
  catch (e) { next(e); }
};

exports.upsertRule = async (req, res, next) => {
  try { res.json(await TransportistaService.upsertRule(Number(req.params.id), req.body)); }
  catch (e) { next(e); }
};

exports.deleteRule = async (req, res, next) => {
  try { await TransportistaService.deleteRule(Number(req.params.rid)); res.status(204).end(); }
  catch (e) { next(e); }
};
