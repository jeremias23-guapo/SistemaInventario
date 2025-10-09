// frontend/src/api/categorias.js
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/categorias' });

// Listado (padres paginados + hijos), soporta { page, limit, q }
export const fetchCategorias        = (params) => API.get('/', { params });

// Solo padres (legacy: todos)
export const fetchCategoriasPadre   = ()    => API.get('/padres');

// Solo padres (nuevo: búsqueda + paginado) -> para Autocomplete
export const searchCategoriasPadre  = (params) => API.get('/padres', { params });
// Subcategorías de un padre, paginadas con búsqueda
export const searchSubcategorias = (parentId, params) =>
  API.get(`/${parentId}/subcategorias`, { params });

export const fetchSubcategorias     = (categoriaId) => API.get(`/${categoriaId}/subcategorias`);
export const fetchCategoria         = (id)  => API.get(`/${id}`);
export const createCategoria        = (data)=> API.post('/', data);
export const updateCategoria        = (id, data) => API.put(`/${id}`, data);
export const deleteCategoria        = (id)  => API.delete(`/${id}`);
