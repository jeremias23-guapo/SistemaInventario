// frontend/src/api/clientes.js
import API from './axios';

// Lista paginada de clientes
export const fetchClientes = (page = 1, limit = 10) =>
  API.get(`/clientes?page=${page}&limit=${limit}`).then(res => res.data);

// Obtener un cliente por id
export const fetchCliente = (id) =>
  API.get(`/clientes/${id}`).then(res => res.data);

// CRUD básico
export const createCliente = (data) =>
  API.post('/clientes', data).then(res => res.data);

export const updateCliente = (id, data) =>
  API.put(`/clientes/${id}`, data).then(res => res.data);

export const deleteCliente = (id) =>
  API.delete(`/clientes/${id}`).then(res => res.data);

// Búsqueda ligera paginada para autocomplete
export const searchClientesLight = ({ q = '', page = 1, pageSize = 10 }) =>
  API.get(
    `/clientes/search?q=${encodeURIComponent(q)}&page=${page}&limit=${pageSize}`
  ).then(res => res.data);
