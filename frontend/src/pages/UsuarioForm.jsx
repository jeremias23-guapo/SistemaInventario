// src/pages/UsuarioForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  getRoles,
  createUsuario,
  updateUsuario,
  fetchUsuario
} from '../api/usuarios';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function UsuarioForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [form, setForm] = useState({
    nombre: '',
    username: '',
    password: '',
    rol_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false); // spinner local para edición
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  // Al entrar al form: apaga overlay global (la lista lo dejó encendido)
  useEffect(() => { stop(); }, [stop]);

  // Carga roles al montar
  useEffect(() => {
    getRoles()
      .then(res => setRoles(Array.isArray(res?.data) ? res.data : (res ?? [])))
      .catch(() => {
        setError('No se pudieron cargar los roles');
        showToast({ message: 'No se pudieron cargar los roles', severity: 'error' });
      });
  }, [showToast]);

  // Si edito, cargo datos del usuario
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchUsuario(id)
      .then(res => {
        const data = res?.data ?? res ?? {};
        setForm({
          nombre: data.nombre || '',
          username: data.username || '',
          password: '',       // vacío por seguridad
          rol_id: data.rol_id ?? ''
        });
        setDirty(false);
      })
      .catch(() => {
        setError('No se pudo cargar el usuario');
        showToast({ message: 'No se pudo cargar el usuario', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, showToast]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setDirty(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Confirmar sólo en actualización
    if (isEdit) {
      const ok = await confirm({
        title: 'Confirmar cambios',
        content: '¿Estás seguro de realizar los cambios?',
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start(); // overlay durante guardar + navegación
    try {
      if (isEdit) {
        await updateUsuario(id, form);
        showToast({ message: 'Usuario actualizado', severity: 'success' });
      } else {
        await createUsuario(form);
        showToast({ message: 'Usuario creado', severity: 'success' });
      }
      navigate('/usuarios', { replace: true }); // la lista apagará overlay al montar
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error al guardar';
      setError(msg);
      showToast({ message: msg, severity: 'error' });
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
    start();     // overlay durante la navegación
    navigate('/usuarios');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Typography variant="h5" mb={2}>
        {isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          label="Usuario"
          name="username"
          value={form.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />

        {!isEdit && (
          <TextField
            label="Contraseña"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        )}

        <Select
          name="rol_id"
          value={form.rol_id}
          onChange={handleChange}
          displayEmpty
          fullWidth
          required
          sx={{ mt: 2 }}
        >
          <MenuItem value="" disabled>
            Selecciona un rol
          </MenuItem>
          {roles.map(r => (
            <MenuItem key={r.id} value={r.id}>
              {r.nombre}
            </MenuItem>
          ))}
        </Select>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="outlined" fullWidth onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" fullWidth>
            {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
