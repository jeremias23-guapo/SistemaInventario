
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api'   // apunta a tu servidor Express
});

export const subirImagen = file => {
  const form = new FormData();
  form.append('file', file);
  return API.post('/imagenes', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
