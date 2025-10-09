// routes/reports.js
const express = require('express');
const ctl = require('../controllers/ReporteController');
const router = express.Router();

// Ventas
router.get('/sales', ctl.salesReport);
router.get('/sales.csv', ctl.salesReportCsv);

// KPIs / agrupados
router.get('/kpis', ctl.kpis);
router.get('/sales-by-day', ctl.salesByDay);
router.get('/sales-by-product', ctl.salesByProduct);
router.get('/sales-by-product.csv', ctl.salesByProductCsv);
router.get('/sales-by-category', ctl.salesByCategory);
router.get('/sales-by-category.csv', ctl.salesByCategoryCsv);
router.get('/sales-by-client', ctl.salesByClient);
router.get('/sales-by-client.csv', ctl.salesByClientCsv);
router.get('/sales-by-user', ctl.salesByUser);
router.get('/sales-by-user.csv', ctl.salesByUserCsv);

// Inventario / bajo stock
router.get('/inventory', ctl.inventory);
router.get('/inventory.csv', ctl.inventoryCsv);
router.get('/low-stock', ctl.lowStock);
router.get('/low-stock.csv', ctl.lowStockCsv);

// ❌ Nada de movements
module.exports = router;
