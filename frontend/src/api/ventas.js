// src/api/ventas.js
import API from './axios';

// === Interceptor para añadir el token a cada request ===
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // sin token, seguimos sin header
  }
  return config;
});

// (Opcional) Interceptor de respuesta para manejar 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- Helper para construir query de paginación ---
const withPageParams = (url, { page, limit } = {}) => {
  const params = new URLSearchParams();
  if (page)  params.append('page', page);
  if (limit) params.append('limit', limit);
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
};

// --- CRUD de Ventas ---
export const fetchVentas = ({ page = 1, limit = 10 } = {}) =>
  API.get(withPageParams('/ventas', { page, limit })).then(res => res.data);

export const fetchVenta = (id) =>
  API.get(`/ventas/${id}`).then(res => res.data);

export const createVenta = (data) =>
  API.post('/ventas', data).then(res => res.data);

export const updateVenta = (id, data) =>
  API.put(`/ventas/${id}`, data).then(res => res.data);

export const deleteVenta = (id) =>
  API.delete(`/ventas/${id}`);

// --- Búsqueda de Ventas ---
export const searchVentas = ({ codigo, fecha, estado_envio, page = 1, limit = 10 }) => {
  const params = new URLSearchParams();
  if (codigo) params.append('codigo', codigo);
  if (fecha) params.append('fecha', fecha);
  if (estado_envio) params.append('estado_envio', estado_envio);
  if (page)  params.append('page', page);
  if (limit) params.append('limit', limit);
  return API.get(`/ventas/search?${params.toString()}`).then(res => res.data);
};

// --- Actualización rápida (PATCH /ventas/:id/estado) ---
export const quickUpdateVenta = (id, data) =>
  API.patch(`/ventas/${id}/estado`, data).then(res => res.data);
