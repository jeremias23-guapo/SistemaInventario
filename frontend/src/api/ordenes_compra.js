// frontend/src/api/ordenes_compra.js
import API from './axios';

export const fetchOrdenesCompra = ({ page = 1, pageSize = 10 } = {}) =>
  API.get('/ordenes_compra', { params: { page, pageSize } }).then(res => res.data);

export const fetchOrdenCompra = (id) =>
  API.get(`/ordenes_compra/${id}`).then(res => res.data);

export const createOrdenCompra = (data) =>
  API.post('/ordenes_compra', data).then(res => res.data);

export const updateOrdenCompra = (id, data) =>
  API.put(`/ordenes_compra/${id}`, data).then(res => res.data);

export const deleteOrdenCompra = (id) =>
  API.delete(`/ordenes_compra/${id}`);

export const searchOrdenesCompra = ({ codigo, fecha, page = 1, pageSize = 10 }) =>
  API.get('/ordenes_compra/search', { params: { codigo, fecha, page, pageSize } })
     .then(r => r.data);
