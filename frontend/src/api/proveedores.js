// frontend/src/api/proveedores.js
import axios from 'axios';

// Igual que en categorias.js: baseURL al recurso
const API = axios.create({
  baseURL: 'http://localhost:3001/api/proveedores'
});

// Listado paginado con búsqueda/orden -> soporta { page, limit, search, sortBy, sortDir }
export const fetchProveedores = (params) => API.get('/', { params });
// Mapea tu API paginada a { items, hasMore }
const fetchPageProveedores = async ({ q, page, limit }) => {
  const res = await fetchProveedores({ page, limit, search: q });
  const payload = res?.data ?? {};
  const data = Array.isArray(payload.data) ? payload.data : [];
  const total = Number(payload.total || 0);
  return {
    items: data.map(p => ({ id: String(p.id), label: p.nombre })), // lo que pinta el autocomplete
    hasMore: page * limit < total
  };
};

// Detalle
export const fetchProveedor = (id) => API.get(`/${id}`);

// Crear
export const createProveedor = (data) => API.post('/', data);

// Actualizar
export const updateProveedor = (id, data) => API.put(`/${id}`, data);

// Eliminar
export const deleteProveedor = (id) => API.delete(`/${id}`);
