// frontend/src/api/reports.js
import API from './axios';

const clean = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  );

// ======================= REPORTES ======================= //

// Ventas
export const fetchSalesReport = async ({
  page = 1,
  pageSize = 50,
  from,
  to,
  estado = 'pagada',
  tz = '-06:00',
}) => {
  const { data } = await API.get('/reports/sales', {
    params: clean({ page, pageSize, from, to, estado, tz }),
  });
  return data;
};

export const downloadSalesCsv = async ({ from, to, estado = 'pagada', tz = '-06:00' }) => {
  const res = await API.get('/reports/sales.csv', {
    params: clean({ from, to, estado, tz }),
    responseType: 'blob',
  });
  return res.data;
};

// KPIs / agrupados
export const fetchKpis = async ({ from, to, estado = 'pagada', tz = '-06:00' }) =>
  (await API.get('/reports/kpis', { params: clean({ from, to, estado, tz }) })).data;

export const fetchSalesByDay = async ({ from, to, estado = 'pagada', tz = '-06:00' }) =>
  (await API.get('/reports/sales-by-day', { params: clean({ from, to, estado, tz }) })).data;

export const fetchSalesByProduct = async (p) =>
  (await API.get('/reports/sales-by-product', { params: clean(p) })).data;

export const fetchSalesByCategory = async (p) =>
  (await API.get('/reports/sales-by-category', { params: clean(p) })).data;

export const fetchSalesByClient = async (p) =>
  (await API.get('/reports/sales-by-client', { params: clean(p) })).data;

export const fetchSalesByUser = async (p) =>
  (await API.get('/reports/sales-by-user', { params: clean(p) })).data;

export const downloadCsvGeneric = async (path, params) =>
  (await API.get(`/reports${path}`, { params: clean(params), responseType: 'blob' })).data;

// Inventario y bajo stock
export const fetchInventory = async ({ page = 1, pageSize = 50 } = {}) =>
  (await API.get('/reports/inventory', { params: clean({ page, pageSize }) })).data;

export const downloadInventoryCsv = async () =>
  (await API.get('/reports/inventory.csv', { responseType: 'blob' })).data;

export const fetchLowStock = async ({ threshold = 2, page = 1, pageSize = 50 } = {}) =>
  (await API.get('/reports/low-stock', { params: clean({ threshold, page, pageSize }) })).data;

export const downloadLowStockCsv = async ({ threshold = 2 } = {}) =>
  (await API.get('/reports/low-stock.csv', { params: clean({ threshold }), responseType: 'blob' })).data;
