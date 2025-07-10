// frontend/src/api/ventas.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/ventas'
});

export const fetchVentas       = ()        => API.get('/').then(res => res.data);
export const fetchVenta        = (id)      => API.get(`/${id}`).then(res => res.data);
export const createVenta       = (data)    => API.post('/', data).then(res => res.data);
export const updateVenta       = (id, data)=> API.put(`/${id}`, data).then(res => res.data);
export const deleteVenta       = (id)      => API.delete(`/${id}`);
export const searchVentas = ({ codigo, proveedor_id, fecha }) => {
  const params = new URLSearchParams();
  if (codigo) params.append('codigo', codigo);
  if (fecha) params.append('fecha', fecha);
  return API.get(`/search?${params.toString()}`).then(res => res.data);
}