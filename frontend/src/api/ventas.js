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
      // por ejemplo, limpiar sesión y mandar al login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // descomenta si quieres redirigir aquí
    }
    return Promise.reject(err);
  }
);

export const fetchVentas = () => API.get('/').then(res => res.data);
export const fetchVenta = (id) => API.get(`/${id}`).then(res => res.data);
export const createVenta = (data) => API.post('/', data).then(res => res.data);
// NOTA: no envíes usuario_id desde el front; el backend lo toma del token.
export const updateVenta = (id, data) => API.put(`/${id}`, data).then(res => res.data);
export const deleteVenta = (id) => API.delete(`/${id}`);

export const searchVentas = ({ codigo, proveedor_id, fecha }) => {
  const params = new URLSearchParams();
  if (codigo) params.append('codigo', codigo);
  if (fecha) params.append('fecha', fecha);
  return API.get(`/search?${params.toString()}`).then(res => res.data);
};
