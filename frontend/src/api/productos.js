import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api/productos'  // URL base sin "/productos"
});

// Obtener productos con búsqueda y/o filtrado por categoría
export const fetchProductos = (filters = {}) => {
  const { search, categoriaId, subcategoriaId } = filters;
  const queryParams = new URLSearchParams();

  if (search) queryParams.append('search', search);
  if (categoriaId) queryParams.append('categoriaId', categoriaId);
  if (subcategoriaId) queryParams.append('subcategoriaId', subcategoriaId);

  // Aquí no es necesario agregar "/productos" ya que está incluido en baseURL
  return API.get(`?${queryParams.toString()}`);  // Correcto: la URL será http://localhost:3001/api/productos?search=...
};

// Obtener un producto por ID
export const fetchProducto = (id) => API.get(`/${id}`);

// Crear un nuevo producto
export const createProducto = (data) => API.post('/', data);

// Actualizar un producto existente
export const updateProducto = (id, data) => API.put(`/${id}`, data);

// Eliminar un producto
export const deleteProducto = (id) => API.delete(`/${id}`);
