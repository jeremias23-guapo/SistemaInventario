// frontend/src/pages/ClienteForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper
} from '@mui/material';
import {
  fetchCliente,
  createCliente,
  updateCliente
} from '../api/clientes';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function ClienteForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [cliente, setCliente] = useState({
    nombre: '',
    contacto: '',
    email: '',
    direccion: ''
  });
  const [dirty, setDirty] = useState(false);

  // Al entrar al form: apaga overlay global que dejó la pantalla anterior
  useEffect(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetchCliente(id);
        const data = r?.data ?? r ?? {};
        setCliente({
          nombre: data.nombre || '',
          contacto: data.contacto || '',
          email: data.email || '',
          direccion: data.direccion || ''
        });
        setDirty(false);
      } catch (err) {
        console.error('Error cargando cliente', err);
        showToast({ message: 'No se pudo cargar el cliente.', severity: 'error' });
      }
    })();
  }, [id, showToast]);

  const handleChange = e => {
    const { name, value } = e.target;
    setCliente(c => ({ ...c, [name]: value }));
    setDirty(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Confirmar cuando se actualiza
    if (id) {
      const ok = await confirm({
        title: 'Actualizar cliente',
        content: '¿Deseas actualizar este cliente?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start();
    try {
      if (id) {
        await updateCliente(id, cliente);
        showToast({ message: 'Cliente actualizado', severity: 'success' });
      } else {
        await createCliente(cliente);
        showToast({ message: 'Cliente creado', severity: 'success' });
      }
      nav('/clientes', { replace: true }); // la lista apagará el overlay al montar
    } catch (err) {
      console.error('Error guardando cliente', err?.response?.data || err);
      showToast({
        message: err?.response?.data?.error || 'Error guardando cliente',
        severity: 'error'
      });
      stop(); // si no navegamos, apagar overlay
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
    nav('/clientes');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              name="nombre"
              value={cliente.nombre}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Contacto"
              name="contacto"
              value={cliente.contacto}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={cliente.email}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Dirección"
              name="direccion"
              value={cliente.direccion}
              onChange={handleChange}
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
