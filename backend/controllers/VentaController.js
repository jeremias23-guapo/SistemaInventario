// backend/controllers/VentaController.js
const VentaService = require('../services/VentaService');
const pool = require('../config/db'); // IMPORTANTE

// Helper: es admin?
function isAdmin(user) {
  if (!user) return false;
  return user.rol === 'admin' || user.rol_id === 1;
}

exports.listAll = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit ?? '10', 10) || 10));
    const result = await VentaService.listAll({ page, limit });
    res.json(result);
  } catch (err) { next(err); }
};

exports.search = async (req, res, next) => {
  try {
    const { codigo, fecha, estado_envio } = req.query; // <-- NUEVO
    const page  = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit ?? '10', 10) || 10));
    const resultados = await VentaService.search({ codigo, fecha, estado_envio, page, limit }); // <-- NUEVO
    res.json(resultados);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    const venta = await VentaService.getById(req.params.id);
    res.json(venta);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const usuarioId = req.user?.sub;
    const venta = await VentaService.create({ ...req.body, usuario_id: usuarioId });
    res.status(201).json(venta);
  } catch (err) { next(err); }
};

exports.cancelarVenta = async (req, res, next) => {
  try {
    const result = await VentaService.cancel(Number(req.params.id));
    res.json(result);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(`SELECT estado_venta FROM ventas WHERE id = ?`, [id]);
    if (rows.length && String(rows[0].estado_venta).toLowerCase() === 'finalizada' && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo un admin puede editar una venta finalizada' });
    }
    const usuarioId = req.user?.sub;
    const updatedVenta = await VentaService.update(id, { ...req.body, usuario_id: usuarioId });
    res.json(updatedVenta);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(`SELECT estado_venta FROM ventas WHERE id = ?`, [id]);
    if (rows.length && String(rows[0].estado_venta).toLowerCase() === 'finalizada' && !isAdmin(req.user)) {
      return res.status(403).json({ error: 'Solo un admin puede eliminar una venta finalizada' });
    }
    await VentaService.delete(id);
    res.status(204).end();
  } catch (err) { next(err); }
};
