// src/api/encomendistas.js
import API from './axios';

// Interceptor para añadir el token JWT automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// CRUD básico de Encomendistas

export const fetchEncomendistas = (q = '') =>
  API.get(`/encomendistas`, { params: { q } }).then(res => res.data);

export const fetchEncomendista = (id) =>
  API.get(`/encomendistas/${id}`).then(res => res.data);

export const createEncomendista = (data) =>
  API.post(`/encomendistas`, data).then(res => res.data);

export const updateEncomendista = (id, data) =>
  API.put(`/encomendistas/${id}`, data).then(res => res.data);

export const deleteEncomendista = (id) =>
  API.delete(`/encomendistas/${id}`).then(res => res.data);
