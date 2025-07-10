// frontend/src/api/proveedores.js
import axios from 'axios';

// Aquí apuntamos al mismo host/puerto y cambiamos solo el path
const API = axios.create({ baseURL: 'http://localhost:3001/api/proveedores' });

export const fetchProveedores = ()     => API.get('/');
export const fetchProveedor  = id     => API.get(`/${id}`);
export const createProveedor = data   => API.post('/', data);
export const updateProveedor = (id, data) => API.put(`/${id}`, data);
export const deleteProveedor = id     => API.delete(`/${id}`);

