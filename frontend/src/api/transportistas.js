// frontend/src/api/transportistas.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/transportistas'
});

// === Interceptor para añadir el token a cada request ===
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

// (Opcional) Interceptor de respuesta para manejar 401
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
  API.get('/', { params: { page, pageSize, q } }).then(res => res.data);

// Alias "light" para usar directo en autocompletados
export const searchTransportistasLight = ({ q = '', page = 1, pageSize = 5 } = {}) =>
  fetchTransportistas({ q, page, pageSize });

// Detalle para precargar labels en formularios de edición
export const fetchTransportista = (id) =>
  API.get(`/${id}`).then(res => res.data);

export const createTransportista = (data) =>
  API.post('/', data).then(res => res.data);

export const updateTransportista = (id, data) =>
  API.put(`/${id}`, data).then(res => res.data);

export const deleteTransportista = (id) =>
  API.delete(`/${id}`);

// === Reglas por transportista ===
export const fetchReglas = (id) =>
  API.get(`/${id}/reglas`).then(res => res.data);

export const upsertRegla = (id, data) =>
  API.post(`/${id}/reglas`, data).then(res => res.data);

export const deleteRegla = (rid) =>
  API.delete(`/reglas/${rid}`);
