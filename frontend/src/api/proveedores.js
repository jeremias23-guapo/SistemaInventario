// frontend/src/api/proveedores.js
import API from './axios';

// Listado paginado con búsqueda/orden -> soporta { page, limit, search, sortBy, sortDir }
export const fetchProveedores = (params) => API.get('/proveedores', { params });

// Mapea tu API paginada a { items, hasMore }
export const fetchPageProveedores = async ({ q, page, limit }) => {
  const res = await fetchProveedores({ page, limit, search: q });
  const payload = res?.data ?? {};
  const data = Array.isArray(payload.data) ? payload.data : [];
  const total = Number(payload.total || 0);

  return {
    items: data.map((p) => ({ id: String(p.id), label: p.nombre })), // usado por autocomplete
    hasMore: page * limit < total,
  };
};

// Detalle
export const fetchProveedor = (id) => API.get(`/proveedores/${id}`);

// Crear
export const createProveedor = (data) => API.post('/proveedores', data);

// Actualizar
export const updateProveedor = (id, data) => API.put(`/proveedores/${id}`, data);

// Eliminar
export const deleteProveedor = (id) => API.delete(`/proveedores/${id}`);
