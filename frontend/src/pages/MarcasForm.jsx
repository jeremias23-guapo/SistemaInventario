// frontend/src/pages/MarcasForm.jsx  (o 'MarcaForm.jsx' según tu ruta)
import React, { useEffect, useState } from 'react';
import { Container, TextField, Button, Stack, Typography, Paper } from '@mui/material';
import { createMarca, fetchMarca, updateMarca } from '../api/marcas';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function MarcaForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [nombre, setNombre] = useState('');
  const [dirty, setDirty] = useState(false);

  // Al entrar al form: apaga overlay global que dejó la pantalla anterior
  useEffect(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetchMarca(id);
        setNombre(r?.nombre ?? '');
        setDirty(false);
      } catch (err) {
        console.error('Error cargando marca', err);
        showToast({ message: 'No se pudo cargar la marca', severity: 'error' });
      }
    })();
  }, [id, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = { nombre: (nombre || '').trim() };
    if (!payload.nombre) {
      showToast({ message: 'El nombre es obligatorio', severity: 'warning' });
      return;
    }

    // Confirmar solo en actualización
    if (id) {
      const ok = await confirm({
        title: 'Actualizar marca',
        content: '¿Deseas actualizar esta marca?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start(); // overlay durante guardar + navegación
    try {
      if (id) {
        await updateMarca(id, payload);
        showToast({ message: 'Marca actualizada', severity: 'success' });
      } else {
        await createMarca(payload);
        showToast({ message: 'Marca creada', severity: 'success' });
      }
      nav('/marcas', { replace: true }); // la lista apagará el overlay al montar
    } catch (err) {
      console.error('Error guardando marca', err?.response?.data || err);
      showToast({
        message: err?.response?.data?.error || 'Error guardando marca',
        severity: 'error',
      });
      stop(); // si no navega por error, apaga overlay
    }
  };

  const handleCancel = async () => {
    if (dirty) {
      const ok = await confirm({
        title: 'Descartar cambios',
        content: 'Tienes cambios sin guardar. ¿Salir sin guardar?',
        confirmText: 'Salir sin guardar',
        cancelText: 'Seguir editando',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }
    start();
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
              onChange={(e) => {
                setNombre(e.target.value);
                setDirty(true);
              }}
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
