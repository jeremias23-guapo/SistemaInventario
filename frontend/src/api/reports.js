// frontend/src/api/reports.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api/reports' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const clean = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

// Ventas
export const fetchSalesReport = async ({ page=1, pageSize=50, from, to, estado='pagada', tz='-06:00' }) => {
  const { data } = await API.get('/sales', { params: clean({ page, pageSize, from, to, estado, tz }) });
  return data;
};
export const downloadSalesCsv = async ({ from, to, estado='pagada', tz='-06:00' }) => {
  const res = await API.get('/sales.csv', { params: clean({ from, to, estado, tz }), responseType:'blob' });
  return res.data;
};

// KPIs / agrupados
export const fetchKpis = async ({ from, to, estado='pagada', tz='-06:00' }) => {
  const { data } = await API.get('/kpis', { params: clean({ from, to, estado, tz }) });
  return data;
};
export const fetchSalesByDay = async ({ from, to, estado='pagada', tz='-06:00' }) => {
  const { data } = await API.get('/sales-by-day', { params: clean({ from, to, estado, tz }) });
  return data;
};
export const fetchSalesByProduct = async (p) => (await API.get('/sales-by-product', { params: clean(p) })).data;
export const fetchSalesByCategory = async (p) => (await API.get('/sales-by-category', { params: clean(p) })).data;
export const fetchSalesByClient = async (p) => (await API.get('/sales-by-client', { params: clean(p) })).data;
export const fetchSalesByUser = async (p) => (await API.get('/sales-by-user', { params: clean(p) })).data;

// Otros
export const fetchInventory = async () => (await API.get('/inventory')).data;
export const fetchLowStock = async (p) => (await API.get('/low-stock', { params: clean(p) })).data;
export const fetchMovements = async (p) => (await API.get('/movements', { params: clean(p) })).data;

export const downloadCsvGeneric = async (path, params) =>
  (await API.get(path, { params: clean(params), responseType:'blob' })).data;
