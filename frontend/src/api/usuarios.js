// src/api/usuarios.js
import API from './axios';

// 1️⃣ Interceptor para inyectar el token JWT en cada petición
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2️⃣ Auth
export const login = ({ username, password }) =>
  API.post('/login', { username, password }).then(res => res.data);

// 3️⃣ Roles
export const getRoles = () =>
  API.get('/roles').then(res => res.data);

// 4️⃣ CRUD de Usuarios
export const listUsuarios  = ()           => API.get('/usuarios').then(res => res.data);
export const fetchUsuario  = id           => API.get(`/usuarios/${id}`).then(res => res.data);
export const createUsuario = data         => API.post('/usuarios', data).then(res => res.data);
export const updateUsuario = (id, data)   => API.put(`/usuarios/${id}`, data).then(res => res.data);
export const deleteUsuario = id           => API.delete(`/usuarios/${id}`).then(res => res.data);
