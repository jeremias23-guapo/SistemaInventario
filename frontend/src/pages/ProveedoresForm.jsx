// frontend/src/pages/ProveedorForm.jsx
import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Stack, TextField, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createProveedor, fetchProveedor, updateProveedor } from '../api/proveedores';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function ProveedorForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [form, setForm] = useState({ nombre: '', contacto: '' });
  const [dirty, setDirty] = useState(false);

  // Al entrar al form: apaga overlay global que dejó la lista
  useEffect(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const r = await fetchProveedor(id);
        const data = r?.data ?? r ?? {};
        setForm({
          nombre: data.nombre || '',
          contacto: data.contacto ? String(data.contacto).replace(/\D/g, '') : '',
        });
        setDirty(false);
      } catch (err) {
        console.error('Error cargando proveedor', err);
        showToast({ message: 'No se pudo cargar el proveedor', severity: 'error' });
      }
    })();
  }, [id, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Solo dígitos para contacto
    if (name === 'contacto') {
      const onlyNums = value.replace(/\D/g, '');
      setForm((prev) => ({ ...prev, contacto: onlyNums }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple
    if (!form.nombre.trim()) {
      showToast({ message: 'El nombre es obligatorio', severity: 'warning' });
      return;
    }

    // Confirmar en actualización
    if (id) {
      const ok = await confirm({
        title: 'Actualizar proveedor',
        content: '¿Deseas actualizar este proveedor?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start(); // overlay durante guardar + navegación
    try {
      const payload = {
        nombre: form.nombre.trim(),
        contacto: form.contacto?.trim() || '',
      };

      if (id) {
        await updateProveedor(id, payload);
        showToast({ message: 'Proveedor actualizado', severity: 'success' });
      } else {
        await createProveedor(payload);
        showToast({ message: 'Proveedor creado', severity: 'success' });
      }
      nav('/proveedores', { replace: true }); // la lista apagará overlay al montar
    } catch (err) {
      console.error('Error guardando proveedor', err?.response?.data || err);
      showToast({
        message: err?.response?.data?.error || 'Error guardando proveedor',
        severity: 'error',
      });
      stop(); // si no navegamos, apaga overlay
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
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              label="Contacto"
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 20 }}
              fullWidth
              helperText="Solo números"
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
