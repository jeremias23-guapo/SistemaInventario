// frontend/src/api/transacciones.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/transacciones'
});

// Lista todo el historial
export const fetchHistorial    = ()      => API.get('/').then(res => res.data);

// Obtiene una transacción por ID (opcional, si necesitas ver detalle)
export const fetchTransaccion  = id      => API.get(`/${id}`).then(res => res.data);

// Obtiene todas las transacciones de una orden (si lo usas en detalle de orden)
export const fetchByOrdenId    = ordenId => API.get(`/orden/${ordenId}`).then(res => res.data);

// (Ya no exportamos createTransaccion, updateTransaccion ni deleteTransaccion)
