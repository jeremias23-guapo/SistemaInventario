// src/api/axios.js
import axios from 'axios';

// Tomamos la URL del backend desde las variables de entorno
const baseURL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:3001/api'; // fallback por si falta la variable

const API = axios.create({ baseURL });

export default API;
