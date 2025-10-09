// frontend/src/api/clientes.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/clientes'
});

// Lista paginada de clientes
export const fetchClientes = (page = 1, limit = 10) =>
  API.get(`/?page=${page}&limit=${limit}`).then(res => res.data);

// Obtener un cliente por id
export const fetchCliente  = (id)       => API.get(`/${id}`).then(res => res.data);

// CRUD básico (si lo usas en otras pantallas)
export const createCliente = (data)     => API.post('/', data).then(res => res.data);
export const updateCliente = (id, data) => API.put(`/${id}`, data).then(res => res.data);
export const deleteCliente = (id)       => API.delete(`/${id}`);

// Búsqueda ligera paginada para autocomplete
export const searchClientesLight = ({ q = '', page = 1, pageSize = 10 }) =>
  API.get(`/search?q=${encodeURIComponent(q)}&page=${page}&limit=${pageSize}`)
     .then(res => res.data);
