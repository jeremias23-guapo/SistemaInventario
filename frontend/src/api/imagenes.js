// src/api/imagenes.js
import API from './axios';

export const subirImagen = (file) => {
  const form = new FormData();
  form.append('file', file);
  return API.post('/imagenes', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
