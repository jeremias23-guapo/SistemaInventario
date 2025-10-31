// src/api/encomendistas.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001/api/encomendistas' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// CRUD
export const fetchEncomendistas = (q = '') =>
  API.get('/', { params: { q } }).then(res => res.data);

export const fetchEncomendista = (id) =>
  API.get(`/${id}`).then(res => res.data);

export const createEncomendista = (data) =>
  API.post('/', data).then(res => res.data);

export const updateEncomendista = (id, data) =>
  API.put(`/${id}`, data).then(res => res.data);

export const deleteEncomendista = (id) =>
  API.delete(`/${id}`).then(res => res.data);
