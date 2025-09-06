import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Stack, TextField, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createProveedor, fetchProveedor, updateProveedor } from '../api/proveedores';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function ProveedorForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading(); // 👈
  const [form, setForm] = useState({ nombre: '', contacto: '' });

  // Al entrar al form: apaga overlay global que dejó la lista
  useEffect(() => { stop(); }, [stop]);

  useEffect(() => {
    if (!id) return;
    fetchProveedor(id)
      .then(r => {
        const data = r?.data ?? r ?? {};
        setForm({
          nombre: data.nombre || '',
          contacto: data.contacto ? String(data.contacto).replace(/\D/g, '') : ''
        });
      })
      .catch(err => {
        console.error('Error cargando proveedor', err);
        alert('No se pudo cargar el proveedor.');
      });
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'contacto') {
      // Solo dígitos
      const onlyNums = value.replace(/\D/g, '');
      setForm(prev => ({ ...prev, contacto: onlyNums }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    start(); // overlay durante guardar + navegación
    try {
      if (id) await updateProveedor(id, form);
      else    await createProveedor(form);
      nav('/proveedores'); // la lista apagará overlay al montar
    } catch (err) {
      console.error('Error guardando proveedor', err?.response?.data || err);
      alert('Hubo un error: ' + (err?.response?.data?.error || err.message));
      stop(); // si no navega por error, apaga overlay
    }
  };

  const handleCancel = () => {
    start(); // overlay durante la navegación
    nav('/proveedores');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              fullWidth
            />
            <TextField
              label="Contacto"
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
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
