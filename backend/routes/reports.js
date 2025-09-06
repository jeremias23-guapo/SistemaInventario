const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authenticate');
const ctrl = require('../controllers/ReporteController');

router.use(auth);

// EXISTENTES
router.get('/sales', ctrl.salesReport);
router.get('/sales.csv', ctrl.salesReportCsv);

// NUEVAS
router.get('/kpis', ctrl.kpis);
router.get('/sales-by-day', ctrl.salesByDay);
router.get('/sales-by-product', ctrl.salesByProduct);
router.get('/sales-by-category', ctrl.salesByCategory);
router.get('/sales-by-client', ctrl.salesByClient);
router.get('/sales-by-user', ctrl.salesByUser);

router.get('/inventory', ctrl.inventory);
router.get('/low-stock', ctrl.lowStock);
router.get('/movements', ctrl.movements);

router.get('/sales-by-product.csv', ctrl.salesByProductCsv);
router.get('/sales-by-category.csv', ctrl.salesByCategoryCsv);
router.get('/sales-by-client.csv', ctrl.salesByClientCsv);
router.get('/sales-by-user.csv', ctrl.salesByUserCsv);
router.get('/inventory.csv', ctrl.inventoryCsv);
router.get('/low-stock.csv', ctrl.lowStockCsv);
router.get('/movements.csv', ctrl.movementsCsv);

module.exports = router;
