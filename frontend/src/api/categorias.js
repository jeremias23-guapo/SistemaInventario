import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/categorias' });

// Obtener todas las categorías
export const fetchCategorias        = ()    => API.get('/');

// Obtener solo categorías padre
export const fetchCategoriasPadre   = ()    => API.get('/padres');

// Obtener subcategorías de una categoría
export const fetchSubcategorias     = categoriaId =>
  API.get(`/${categoriaId}/subcategorias`);

// Obtener una categoría por ID
export const fetchCategoria         = id    => API.get(`/${id}`);

// CRUD básico
export const createCategoria        = data  => API.post('/', data);
export const updateCategoria        = (id, data) => API.put(`/${id}`, data);
export const deleteCategoria        = id    => API.delete(`/${id}`);

