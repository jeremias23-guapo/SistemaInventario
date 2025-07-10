import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/compras' });

export const fetchCompras      = ()   => API.get('/');
export const fetchCompra       = id   => API.get(`/${id}`);
export const createCompra      = data => API.post('/', data);
export const updateCompra      = (id, data) => API.put(`/${id}`, data);
export const deleteCompra      = id   => API.delete(`/${id}`);
