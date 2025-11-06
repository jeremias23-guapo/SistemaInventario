// frontend/src/api/productos.js
import API from './axios';

/* ---------------- Utilidades de normalización ---------------- */
const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items; // { items: [] }
  if (payload && Array.isArray(payload.data)) return payload.data;   // { data: [] }
  if (payload && Array.isArray(payload.rows)) return payload.rows;   // { rows: [] }
  return [];
};

const extractMeta = (payload, fallback = {}) => {
  const p = payload || {};
  return {
    total: p.total ?? p.count ?? extractArray(p).length ?? 0,
    page: p.page ?? fallback.page ?? 1,
    pageSize: p.pageSize ?? p.limit ?? fallback.pageSize ?? extractArray(p).length ?? 0,
  };
};

/* ------------------- Funciones principales ------------------- */
// Obtener productos con búsqueda y/o filtrado por categoría
export const fetchProductos = (filters = {}, paging = {}) => {
  const { search, categoriaId, subcategoriaId } = filters;
  const { page = 1, pageSize = 10 } = paging;

  const q = new URLSearchParams();
  if (search) q.append('search', search);
  if (categoriaId) q.append('categoriaId', categoriaId);
  if (subcategoriaId) q.append('subcategoriaId', subcategoriaId);
  q.append('page', page);
  q.append('pageSize', pageSize);

  return API.get(`/productos?${q.toString()}`).then((r) => r.data);
};

// Obtener un producto por ID
export const fetchProducto = (id) => API.get(`/productos/${id}`);

// Crear un nuevo producto
export const createProducto = (data) => API.post('/productos', data);

// Actualizar un producto existente
export const updateProducto = (id, data) => API.put(`/productos/${id}`, data);

// Eliminar un producto
export const deleteProducto = (id) => API.delete(`/productos/${id}`);

/* ---------------- Helpers seguros para el render ---------------- */
export const fetchProductosList = async (filters = {}, paging = {}) => {
  const { data } = await fetchProductos(filters, paging);
  return extractArray(data);
};

export const fetchProductosListWithMeta = async (filters = {}, paging = {}) => {
  const { data } = await fetchProductos(filters, paging);
  return {
    items: extractArray(data),
    ...extractMeta(data, paging),
  };
};

// Buscar productos livianos para autocompletar
export const searchProductosLight = async ({ q = '', page = 1, pageSize = 20 } = {}) => {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  params.append('page', page);
  params.append('pageSize', pageSize);
  const { data } = await API.get(`/productos/search?${params.toString()}`);
  return data;
};
