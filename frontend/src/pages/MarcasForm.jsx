import React, { useEffect, useState } from 'react';
import {
  Container, TextField, Button,
  Stack, Typography, Paper
} from '@mui/material';
import {
  createMarca,
  fetchMarca,
  updateMarca
} from '../api/marcas';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function MarcaForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading(); // 👈
  const [nombre, setNombre] = useState('');

  // Al entrar al form: apaga overlay global que dejó la pantalla anterior
  useEffect(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (!id) return;
    fetchMarca(id)
      .then(r => setNombre(r?.data?.nombre ?? ''))
      .catch(err => {
        console.error('Error cargando marca', err);
        alert('No se pudo cargar la marca.');
      });
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    start(); // 👈 overlay durante guardar + navegación
    try {
      if (id) await updateMarca(id, { nombre });
      else    await createMarca({ nombre });
      nav('/marcas'); // la lista apagará el overlay al montar
    } catch (err) {
      console.error('Error guardando marca', err?.response?.data || err);
      alert('Hubo un error: ' + (err?.response?.data?.error || err.message));
      stop(); // 👈 si no navega por error, apaga overlay
    }
  };

  const handleCancel = () => {
    start();        // 👈 overlay durante la navegación
    nav('/marcas');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Marca' : 'Nueva Marca'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              fullWidth
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained">
                {id ? 'Actualizar' : 'Guardar'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
