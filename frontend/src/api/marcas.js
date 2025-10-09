// frontend/src/api/marcas.js
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3001/api/marcas' });

// Endpoints base
export const fetchMarcas   = (params)   => API.get('/', { params });    // { data, pagination }
export const fetchMarca    = (id)       => API.get(`/${id}`).then(r => r.data);
export const createMarca   = (data)     => API.post('/', data).then(r => r.data);
export const updateMarca   = (id, data) => API.put(`/${id}`, data).then(r => r.data);
export const deleteMarca   = (id)       => API.delete(`/${id}`).then(r => r.data);

// ===== Helpers para AsyncAutocomplete =====
const TOP_LIMIT = 5;   // cantidad a mostrar al abrir sin escribir
const PAGE_LIMIT_FALLBACK = 20;

export async function fetchMarcasPage({ q = '', page = 1, limit = PAGE_LIMIT_FALLBACK } = {}) {
  const term = q.trim();

  // Modo "teaser": lista corta al abrir sin escribir
  if (term.length === 0) {
    if (page !== 1) {
      // Evita que el usuario cargue más páginas sin haber escrito (no mostrar todo)
      return { items: [], hasMore: false };
    }
    const res = await fetchMarcas({
      page: 1,
      pageSize: TOP_LIMIT,       // fuerza lista corta inicial
      // si tu backend acepta algún orden (ej. más usados/recientes), podrías enviar:
      // orderBy: 'uso_desc' || 'created_at_desc'
    });

    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      items: rows.map(m => ({ id: m.id, label: m.nombre })),
      hasMore: false,            // 👈 bloquea infinite scroll en modo teaser
    };
  }

  // Modo búsqueda normal con paginado real
  const res = await fetchMarcas({ page, pageSize: limit, nombre: term });
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  const pag  = res.data?.pagination ?? { total: rows.length, page, pageSize: limit };
  const hasMore = pag.page * pag.pageSize < pag.total;

  return {
    items: rows.map(m => ({ id: m.id, label: m.nombre })),
    hasMore,
  };
}

// Para precargar el valor al editar
export async function fetchMarcaOptionById(id) {
  if (!id) return null;
  const m = await fetchMarca(id);
  return m ? { id: m.id, label: m.nombre } : null;
}
