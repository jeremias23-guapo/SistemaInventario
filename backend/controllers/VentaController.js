// backend/controllers/VentaController.js
const VentaService = require('../services/VentaService');
const authenticate = require('../middlewares/authenticate'); // si no lo tenías aquí
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
      // usuario que registra la venta viene del token
   const usuarioId = req.user?.sub; // payload: { sub, username, rol, ... }
  const venta = await VentaService.create({ ...req.body, usuario_id: usuarioId });
    res.status(201).json(venta);
    console.log('JWT user payload en create venta:', req.user);

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
    const id = req.params.id;          // 👈 aquí obtienes el id de la URL
    const usuarioId = req.user?.sub;   // id del usuario que actualiza (del token)

    const updatedVenta = await VentaService.update(id, {
      ...req.body,
      usuario_id: usuarioId
    });

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
