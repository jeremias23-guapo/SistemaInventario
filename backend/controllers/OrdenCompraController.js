// backend/controllers/OrdenCompraController.js
const OrdenCompraService = require('../services/OrdenCompraService');

exports.listAll = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const result = await OrdenCompraService.listPaginated({ page, pageSize });
    res.json(result);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const orden = await OrdenCompraService.getById(id);
    res.json(orden);
  } catch (err) { next(err); }
};

exports.search = async (req, res, next) => {
  try {
    const { codigo, fecha } = req.query;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const resultados = await OrdenCompraService.searchPaginated({ codigo, fecha }, { page, pageSize });
    res.json(resultados);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await OrdenCompraService.create(req.body);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await OrdenCompraService.update(id, req.body);
    res.json(result);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    await OrdenCompraService.delete(id);
    res.status(204).end();
  } catch (err) { next(err); }
};
