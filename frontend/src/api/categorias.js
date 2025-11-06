// src/api/categorias.js
import API from './axios';

export const fetchCategorias = (params) => API.get('/categorias', { params });
export const fetchCategoriasPadre = () => API.get('/categorias/padres');
export const searchCategoriasPadre = (params) => API.get('/categorias/padres', { params });
export const searchSubcategorias = (parentId, params) =>
  API.get(`/categorias/${parentId}/subcategorias`, { params });

export const fetchSubcategorias = (categoriaId) =>
  API.get(`/categorias/${categoriaId}/subcategorias`);

export const fetchCategoria = (id) => API.get(`/categorias/${id}`);
export const createCategoria = (data) => API.post('/categorias', data);
export const updateCategoria = (id, data) => API.put(`/categorias/${id}`, data);
export const deleteCategoria = (id) => API.delete(`/categorias/${id}`);
