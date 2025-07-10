import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/categorias' });

export const fetchCategorias      = ()   => API.get('/');
export const fetchCategoria      = id   => API.get(`/${id}`);
export const createCategoria      = data => API.post('/', data);
export const updateCategoria    = (id, data) => API.put(`/${id}`, data);
export const deleteCategoria     = id   => API.delete(`/${id}`);
export const fetchCategoriasPadre = ()   => API.get('/padres');
