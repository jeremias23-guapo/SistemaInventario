// controllers/ReportsController.js
const ReportsService = require('../services/ReportsService');

// Ventas (paginado)
exports.salesReport = async (req, res, next) => {
  try {
    const { page=1, pageSize=50, from, to, estado='pagada', tz='-06:00' } = req.query;
    const data = await ReportsService.salesReport({ page:+page, pageSize:+pageSize, from, to, estado, tz });
    res.json(data);
  } catch (e) { next(e); }
};
exports.salesReportCsv = async (req, res, next) => {
  try {
    const { from, to, estado='pagada', tz='-06:00' } = req.query;
    const csv = await ReportsService.salesReportCsv({ from, to, estado, tz });
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition','attachment; filename="sales_report.csv"');
    res.send(csv);
  } catch (e) { next(e); }
};

// KPIs / agrupados
exports.kpis = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  res.json(await ReportsService.kpis({ from, to, estado, tz }));
} catch(e){ next(e); }};

exports.salesByDay = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  res.json(await ReportsService.salesByDay({ from, to, estado, tz }));
} catch(e){ next(e); }};

exports.salesByProduct = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00', limit } = req.query;
  res.json(await ReportsService.salesByProduct({ from, to, estado, tz, limit:+limit||20 }));
} catch(e){ next(e); }};
exports.salesByProductCsv = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00', limit } = req.query;
  const csv = await ReportsService.salesByProductCsv({ from, to, estado, tz, limit:+limit||1000 });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="sales_by_product.csv"');
  res.send(csv);
} catch(e){ next(e); }};

exports.salesByCategory = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  res.json(await ReportsService.salesByCategory({ from, to, estado, tz }));
} catch(e){ next(e); }};
exports.salesByCategoryCsv = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  const csv = await ReportsService.salesByCategoryCsv({ from, to, estado, tz });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="sales_by_category.csv"');
  res.send(csv);
} catch(e){ next(e); }};

exports.salesByClient = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00', limit } = req.query;
  res.json(await ReportsService.salesByClient({ from, to, estado, tz, limit:+limit||50 }));
} catch(e){ next(e); }};
exports.salesByClientCsv = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00', limit } = req.query;
  const csv = await ReportsService.salesByClientCsv({ from, to, estado, tz, limit:+limit||2000 });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="sales_by_client.csv"');
  res.send(csv);
} catch(e){ next(e); }};

exports.salesByUser = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  res.json(await ReportsService.salesByUser({ from, to, estado, tz }));
} catch(e){ next(e); }};
exports.salesByUserCsv = async (req,res,next)=>{ try {
  const { from, to, estado='pagada', tz='-06:00' } = req.query;
  const csv = await ReportsService.salesByUserCsv({ from, to, estado, tz });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="sales_by_user.csv"');
  res.send(csv);
} catch(e){ next(e); }};

// Inventario / bajo stock / movimientos
exports.inventory = async (req,res,next)=>{ try { res.json(await ReportsService.inventory()); } catch(e){ next(e); }};
exports.inventoryCsv = async (req,res,next)=>{ try {
  const csv = await ReportsService.inventoryCsv();
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="inventory.csv"');
  res.send(csv);
} catch(e){ next(e); }};

exports.lowStock = async (req,res,next)=>{ try {
  const { threshold } = req.query;
  res.json(await ReportsService.lowStock({ threshold:+threshold||2 }));
} catch(e){ next(e); }};
exports.lowStockCsv = async (req,res,next)=>{ try {
  const { threshold } = req.query;
  const csv = await ReportsService.lowStockCsv({ threshold:+threshold||2 });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="low_stock.csv"');
  res.send(csv);
} catch(e){ next(e); }};

exports.movements = async (req,res,next)=>{ try {
  const { from, to, tipo } = req.query; // compra|venta|cancelacion
  res.json(await ReportsService.movements({ from, to, tipo }));
} catch(e){ next(e); }};
exports.movementsCsv = async (req,res,next)=>{ try {
  const { from, to, tipo } = req.query;
  const csv = await ReportsService.movementsCsv({ from, to, tipo });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.setHeader('Content-Disposition','attachment; filename="movements.csv"');
  res.send(csv);
} catch(e){ next(e); }};
