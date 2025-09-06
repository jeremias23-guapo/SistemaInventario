const repo = require('../repositories/ReportsRepo');

// EXISTENTES
exports.salesReport = async ({ page = 1, pageSize = 50, from, to, estado = 'pagada', tz = '-06:00' }) => {
  const limit  = +pageSize || 50;
  const offset = (Math.max(+page, 1) - 1) * limit;

  const rows  = await repo.findSales({ limit, offset, from, to, estado, tz });
  const total = await repo.countSales({ from, to, estado, tz });

  return { page: +page || 1, pageSize: limit, total, rows };
};

exports.salesReportCsv = async ({ from, to, estado = 'pagada', tz = '-06:00' }) => {
  const { rows } = await this.salesReport({ page: 1, pageSize: 100000, from, to, estado, tz });
  const header = ['id','codigo','fecha','total_venta','cliente','usuario'].join(',');
  const body = rows.map(r => {
    const cliente = `"${String(r.cliente ?? '').replace(/"/g, '""')}"`;
    const usuario = (r.usuario ?? '');
    return [r.id, r.codigo, r.fecha, r.total_venta, cliente, usuario].join(',');
  }).join('\n');
  return `${header}\n${body}\n`;
};

// NUEVOS
exports.kpis = async ({ from, to, estado, tz }) =>
  await repo.findKpis({ from, to, estado, tz });

exports.salesByDay = async ({ from, to, estado, tz }) =>
  await repo.findSalesByDay({ from, to, estado, tz });

exports.salesByProduct = async ({ from, to, estado, tz, limit }) =>
  await repo.findSalesByProduct({ from, to, estado, tz, limit });
exports.salesByProductCsv = async (args) => {
  const rows = await repo.findSalesByProduct(args);
  const header = ['producto_id','nombre','unidades','ingreso'].join(',');
  const body = rows.map(r => [r.producto_id, `"${String(r.nombre).replace(/"/g,'""')}"`, r.unidades, r.ingreso].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.salesByCategory = async ({ from, to, estado, tz }) =>
  await repo.findSalesByCategory({ from, to, estado, tz });
exports.salesByCategoryCsv = async (args) => {
  const rows = await repo.findSalesByCategory(args);
  const header = ['categoria_id','categoria','unidades','ingreso'].join(',');
  const body = rows.map(r => [r.categoria_id ?? '', `"${String(r.categoria ?? 'Sin categoría').replace(/"/g,'""')}"`, r.unidades ?? 0, r.ingreso ?? 0].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.salesByClient = async ({ from, to, estado, tz, limit }) =>
  await repo.findSalesByClient({ from, to, estado, tz, limit });
exports.salesByClientCsv = async (args) => {
  const rows = await repo.findSalesByClient(args);
  const header = ['cliente_id','cliente','tickets','ingreso'].join(',');
  const body = rows.map(r => [r.cliente_id, `"${String(r.cliente).replace(/"/g,'""')}"`, r.tickets, r.ingreso].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.salesByUser = async ({ from, to, estado, tz }) =>
  await repo.findSalesByUser({ from, to, estado, tz });
exports.salesByUserCsv = async (args) => {
  const rows = await repo.findSalesByUser(args);
  const header = ['usuario_id','usuario','tickets','ingreso'].join(',');
  const body = rows.map(r => [r.usuario_id ?? '', r.usuario ?? '', r.tickets ?? 0, r.ingreso ?? 0].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.inventory = async () => await repo.findInventory();
exports.inventoryCsv = async () => {
  const rows = await repo.findInventory();
  const header = ['id','nombre','stock','precio_venta','costo_promedio','valuacion'].join(',');
  const body = rows.map(r => [r.id, `"${String(r.nombre).replace(/"/g,'""')}"`, r.stock ?? 0, r.precio_venta ?? 0, r.costo_promedio ?? 0, r.valuacion ?? 0].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.lowStock = async ({ threshold }) => await repo.findLowStock({ threshold });
exports.lowStockCsv = async ({ threshold }) => {
  const rows = await repo.findLowStock({ threshold });
  const header = ['id','nombre','stock'].join(',');
  const body = rows.map(r => [r.id, `"${String(r.nombre).replace(/"/g,'""')}"`, r.stock ?? 0].join(',')).join('\n');
  return `${header}\n${body}\n`;
};

exports.movements = async ({ from, to, tipo }) => await repo.findMovements({ from, to, tipo });
exports.movementsCsv = async ({ from, to, tipo }) => {
  const rows = await repo.findMovements({ from, to, tipo });
  const header = ['id_transaccion','id_producto','producto','tipo','fecha','precio','cantidad'].join(',');
  const body = rows.map(r => [r.id_transaccion, r.id_producto, `"${String(r.nombre).replace(/"/g,'""')}"`, r.tipo_transaccion, r.fecha_transaccion, r.precio_transaccion, r.cantidad_transaccion].join(',')).join('\n');
  return `${header}\n${body}\n`;
};
