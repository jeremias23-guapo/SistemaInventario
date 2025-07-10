// frontend/src/api/clientes.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/clientes'
});

export const fetchClientes      = ()       => API.get('/').then(res => res.data);
export const fetchCliente       = id       => API.get(`/${id}`).then(res => res.data);
export const createCliente      = data     => API.post('/', data).then(res => res.data);
export const updateCliente      = (id, data)=> API.put(`/${id}`, data).then(res => res.data);
export const deleteCliente      = id       => API.delete(`/${id}`);
