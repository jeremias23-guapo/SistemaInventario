import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/marcas' });

export const fetchMarcas     = ()   => API.get('/');
export const fetchMarca      = id   => API.get(`/${id}`);
export const createMarca     = data => API.post('/', data);
export const updateMarca     = (id, data) => API.put(`/${id}`, data);
export const deleteMarca     = id   => API.delete(`/${id}`);
