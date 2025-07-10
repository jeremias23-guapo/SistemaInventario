// frontend/src/api/ordenes_compra.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/ordenes_compra'
});

export const fetchOrdenesCompra = () => API.get('/').then(res => res.data);
export const fetchOrdenCompra   = id => API.get(`/${id}`).then(res => res.data);
export const createOrdenCompra  = data => API.post('/', data).then(res => res.data);
export const updateOrdenCompra  = (id, data) => API.put(`/${id}`, data).then(res => res.data);
export const deleteOrdenCompra  = id => API.delete(`/${id}`);
