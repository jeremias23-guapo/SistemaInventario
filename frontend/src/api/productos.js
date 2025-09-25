import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/productos' // URL base sin "/productos"
});

/* ---------------- Utilidades de normalización (nuevas) ---------------- */
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

/* ------------------- Tus funciones actuales (sin cambios) ------------------- */
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

  // ✅ Ahora devolvemos SIEMPRE el cuerpo (data), no el AxiosResponse
  return API.get(`?${q.toString()}`).then(r => r.data);
};
// Obtener un producto por ID
export const fetchProducto = (id) => API.get(`/${id}`);

// Crear un nuevo producto
export const createProducto = (data) => API.post('/', data);

// Actualizar un producto existente
export const updateProducto = (id, data) => API.put(`/${id}`, data);

// Eliminar un producto
export const deleteProducto = (id) => API.delete(`/${id}`);

/* ---------------- Helpers nuevos, seguros para el render ---------------- */
// Devuelve SIEMPRE un array de productos (para evitar "map is not a function")
export const fetchProductosList = async (filters = {}, paging = {}) => {
  const { data } = await fetchProductos(filters, paging);
  return extractArray(data);
};

// Devuelve { items:[], total, page, pageSize } por si usas paginación en UI
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
  const { data } = await API.get(`/search?${params.toString()}`);
  // Esperamos { items:[{id,label,precio_venta}], hasMore, page, pageSize, total }
  return data;
};