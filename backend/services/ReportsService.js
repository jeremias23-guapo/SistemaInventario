// services/ReportsService.js
const Repo = require('../repositories/ReportsRepo');

function toCsv(rows, headers) {
  const head = headers.join(',');
  const body = rows.map(r =>
    headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(',')
  ).join('\n');
  return `${head}\n${body}`;
}

exports.salesReport = async ({ page=1, pageSize=50, from, to, estado='pagada', tz }) => {
  const offset = (page-1)*pageSize;
  const [rows, total] = await Promise.all([
    Repo.findSales({ limit: pageSize, offset, from, to, estado, tz }),
    Repo.countSales({ from, to, estado, tz }),
  ]);
  return { rows, total, page, pageSize };
};

exports.salesReportCsv = async ({ from, to, estado='pagada', tz }) => {
  const rows = await Repo.findSales({ limit: 200000, offset: 0, from, to, estado, tz });
  const headers = ['id','codigo','fecha','total_venta','cliente','usuario','metodo_pago','estado_envio','estado_pago','estado_venta'];
  return toCsv(rows, headers);
};

exports.kpis = (p) => Repo.findKpis(p);
exports.salesByDay = (p) => Repo.findSalesByDay(p);
exports.salesByProduct = (p) => Repo.findSalesByProduct(p);
exports.salesByCategory = (p) => Repo.findSalesByCategory(p);
exports.salesByClient = (p) => Repo.findSalesByClient(p);
exports.salesByUser = (p) => Repo.findSalesByUser(p);

exports.salesByProductCsv = async (p) => {
  const rows = await Repo.findSalesByProduct(p);
  return toCsv(rows, ['producto_id','nombre','unidades','ingreso']);
};
exports.salesByCategoryCsv = async (p) => {
  const rows = await Repo.findSalesByCategory(p);
  return toCsv(rows, ['categoria_id','categoria','unidades','ingreso']);
};
exports.salesByClientCsv = async (p) => {
  const rows = await Repo.findSalesByClient(p);
  return toCsv(rows, ['cliente_id','cliente','tickets','ingreso']);
};
exports.salesByUserCsv = async (p) => {
  const rows = await Repo.findSalesByUser(p);
  return toCsv(rows, ['usuario_id','usuario','tickets','ingreso']);
};

exports.inventory = () => Repo.findInventory();
exports.inventoryCsv = async () => {
  const rows = await Repo.findInventory();
  return toCsv(rows, ['id','nombre','stock','precio_venta','costo_promedio','valuacion']);
};
exports.lowStock = ({ threshold=2 }) => Repo.findLowStock({ threshold });
exports.lowStockCsv = async ({ threshold=2 }) => {
  const rows = await Repo.findLowStock({ threshold });
  return toCsv(rows, ['id','nombre','stock']);
};
exports.movements = (p) => Repo.findMovements(p);
exports.movementsCsv = async (p) => {
  const rows = await Repo.findMovements(p);
  return toCsv(rows, ['id_transaccion','id_producto','nombre','tipo_transaccion','fecha_transaccion','precio_transaccion','cantidad_transaccion']);
};
