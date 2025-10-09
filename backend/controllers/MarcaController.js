// controllers/MarcaController.js
const MarcaService = require('../services/MarcaService');

exports.getMarcas = async (req, res) => {
  try {
    const page     = Number.parseInt(req.query.page, 10)     || 1;
    const pageSize = Number.parseInt(req.query.pageSize, 10) || 10;
    const nombre   = (req.query.nombre || '').trim();

    const { rows, total, page: p, pageSize: ps } =
      await MarcaService.listarMarcas({ page, pageSize, nombre });

    res.json({
      data: rows,
      pagination: { total, page: p, pageSize: ps },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getMarca = async (req, res) => {
  try {
    const m = await MarcaService.obtenerMarca(req.params.id);
    res.json(m);
  } catch (e) {
    const code = e.message === 'Marca no encontrada' ? 404 : 500;
    res.status(code).json({ error: e.message });
  }
};

exports.createMarca = async (req, res) => {
  try {
    const m = await MarcaService.crearMarca(req.body);
    res.status(201).json(m);
  } catch (e) {
    const code = e.message.startsWith('Validación:') ? 400 : 500;
    res.status(code).json({ error: e.message });
  }
};

exports.updateMarca = async (req, res) => {
  try {
    const m = await MarcaService.actualizarMarca(req.params.id, req.body);
    res.json(m);
  } catch (e) {
    const code = e.message === 'Marca no encontrada' ? 404 : 400;
    res.status(code).json({ error: e.message });
  }
};

exports.deleteMarca = async (req, res) => {
  try {
    await MarcaService.eliminarMarca(req.params.id);
    res.json({ message: 'Marca eliminada' });
  } catch (e) {
    const code = e.message === 'Marca no encontrada' ? 404 : 400;
    res.status(code).json({ error: e.message });
  }
};
