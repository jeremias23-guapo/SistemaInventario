// frontend/src/api/ventas.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/ventas'
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
      // window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- NUEVO: helpers para construir query de paginación
const withPageParams = (url, { page, limit } = {}) => {
  const params = new URLSearchParams();
  if (page)  params.append('page', page);
  if (limit) params.append('limit', limit);
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
};

export const fetchVentas = ({ page = 1, limit = 10 } = {}) =>
  API.get(withPageParams('/', { page, limit })).then(res => res.data);

export const fetchVenta = (id) => API.get(`/${id}`).then(res => res.data);
export const createVenta = (data) => API.post('/', data).then(res => res.data);
export const updateVenta = (id, data) => API.put(`/${id}`, data).then(res => res.data);
export const deleteVenta = (id) => API.delete(`/${id}`);

export const searchVentas = ({ codigo, fecha, estado_envio, page = 1, limit = 10 }) => {
  const params = new URLSearchParams();
  if (codigo) params.append('codigo', codigo);
  if (fecha) params.append('fecha', fecha);
  if (estado_envio) params.append('estado_envio', estado_envio); // <-- NUEVO
  if (page)  params.append('page', page);
  if (limit) params.append('limit', limit);
  return API.get(`/search?${params.toString()}`).then(res => res.data);
};

// --- ✅ NUEVO: quick update usando PATCH /ventas/:id/estado ---
export const quickUpdateVenta = (id, data) =>
  API.patch(`/${id}/estado`, data).then(res => res.data);
