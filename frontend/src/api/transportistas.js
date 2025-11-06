// frontend/src/api/transportistas.js
import API from './axios';

// === Interceptor específico para Transportistas (opcional extra) ===
API.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // sin token, seguimos sin header
  }
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // descomenta si quieres redirigir aquí
    }
    return Promise.reject(err);
  }
);

// === Transportistas CRUD ===

// Paginado + búsqueda (server-side)
export const fetchTransportistas = ({ page = 1, pageSize = 10, q = '' } = {}) =>
  API.get('/transportistas', { params: { page, pageSize, q } }).then(res => res.data);

// Alias "light" para usar directo en autocompletados
export const searchTransportistasLight = ({ q = '', page = 1, pageSize = 5 } = {}) =>
  fetchTransportistas({ q, page, pageSize });

// Detalle para precargar labels en formularios de edición
export const fetchTransportista = (id) =>
  API.get(`/transportistas/${id}`).then(res => res.data);

export const createTransportista = (data) =>
  API.post('/transportistas', data).then(res => res.data);

export const updateTransportista = (id, data) =>
  API.put(`/transportistas/${id}`, data).then(res => res.data);

export const deleteTransportista = (id) =>
  API.delete(`/transportistas/${id}`);

// === Reglas por transportista ===
export const fetchReglas = (id) =>
  API.get(`/transportistas/${id}/reglas`).then(res => res.data);

export const upsertRegla = (id, data) =>
  API.post(`/transportistas/${id}/reglas`, data).then(res => res.data);

export const deleteRegla = (rid) =>
  API.delete(`/transportistas/reglas/${rid}`);
