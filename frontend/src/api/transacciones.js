// frontend/src/api/transacciones.js
import API from './axios';

// Página de historial con paginación por cursor
export const fetchHistorialPage = async ({ limit = 50, cursor = null } = {}) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const res = await API.get('/transacciones', { params });
  return res.data; // { items, nextCursor, hasMore }
};

// Lista todo el historial
export const fetchHistorial = () =>
  API.get('/transacciones').then((res) => res.data);

// Obtiene una transacción por ID (detalle)
export const fetchTransaccion = (id) =>
  API.get(`/transacciones/${id}`).then((res) => res.data);

// Obtiene todas las transacciones de una orden
export const fetchByOrdenId = (ordenId) =>
  API.get(`/transacciones/orden/${ordenId}`).then((res) => res.data);
