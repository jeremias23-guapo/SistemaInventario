// frontend/src/api/reports.js
import axios from 'axios';

// Instancia con baseURL y bearer token
const API = axios.create({ baseURL: 'http://localhost:3001/api/reports' });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper para limpiar params (no enviar undefined/empty)
const clean = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));

// --------- Ventas (paginado + CSV) --------- //
export const fetchSalesReport = async ({ page = 1, pageSize = 50, from, to }) => {
  const { data } = await API.get('/sales', { params: clean({ page, pageSize, from, to }) });
  return data;
};

export const downloadSalesCsv = async ({ from, to }) => {
  const res = await API.get('/sales.csv', {
    params: clean({ from, to }),
    responseType: 'blob'
  });
  return res.data; // Blob
};

// --------- KPIs / Agrupados --------- //
export const fetchKpis = async (p) => {
  const { data } = await API.get('/kpis', { params: clean(p) });
  return data;
};

export const fetchSalesByDay = async (p) => {
  const { data } = await API.get('/sales-by-day', { params: clean(p) });
  return data;
};

export const fetchSalesByProduct = async (p) => {
  const { data } = await API.get('/sales-by-product', { params: clean(p) });
  return data;
};

export const fetchSalesByCategory = async (p) => {
  const { data } = await API.get('/sales-by-category', { params: clean(p) });
  return data;
};

export const fetchSalesByClient = async (p) => {
  const { data } = await API.get('/sales-by-client', { params: clean(p) });
  return data;
};

export const fetchSalesByUser = async (p) => {
  const { data } = await API.get('/sales-by-user', { params: clean(p) });
  return data;
};

// --------- Inventario / Bajo stock / Movimientos --------- //
export const fetchInventory = async () => {
  const { data } = await API.get('/inventory');
  return data;
};

export const fetchLowStock = async (p) => {
  const { data } = await API.get('/low-stock', { params: clean(p) });
  return data;
};

export const fetchMovements = async (p) => {
  const { data } = await API.get('/movements', { params: clean(p) });
  return data;
};

// --------- Descargas CSV genéricas --------- //
export const downloadCsvGeneric = async (path, params) => {
  // path: '/sales-by-category.csv', '/inventory.csv', etc.
  const res = await API.get(path, { params: clean(params), responseType: 'blob' });
  return res.data;
};
