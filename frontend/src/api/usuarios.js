import axios from 'axios';

// 1) Cliente Axios apuntando a /api
export const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : 'http://localhost:3001/api',
  // aquí podrías agregar timeout, headers comunes, etc.
});

// 2) Interceptor para inyectar el token JWT en cada petición
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3) Auth
export const login = ({ username, password }) =>
  API.post('/login', { username, password }).then(res => res.data);

// 4) Roles
export const getRoles = () =>
  API.get('/roles').then(res => res.data);

// 5) CRUD de Usuarios
export const listUsuarios  = ()           => API.get('/usuarios').then(res => res.data);
export const fetchUsuario  = id           => API.get(`/usuarios/${id}`).then(res => res.data);
export const createUsuario = data         => API.post('/usuarios', data).then(res => res.data);
export const updateUsuario = (id, data)   => API.put(`/usuarios/${id}`, data).then(res => res.data);
export const deleteUsuario = id           => API.delete(`/usuarios/${id}`).then(res => res.data);
