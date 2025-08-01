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
  Alert
} from '@mui/material';
import {
  getRoles,
  createUsuario,
  updateUsuario,
  fetchUsuario
} from '../api/usuarios';

export default function UsuarioForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    username: '',
    password: '',
    rol_id: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carga roles al montar
  useEffect(() => {
    getRoles()
      .then(data => setRoles(data))
      .catch(() => setError('No se pudieron cargar los roles'));
  }, []);

  // Si edito, cargo datos del usuario
  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetchUsuario(id)
      .then(data => {
        setForm({
          nombre: data.nombre,
          username: data.username,
          password: '',       // dejamos vacío para seguridad
          rol_id: data.rol_id
        });
      })
      .catch(() => setError('No se pudo cargar el usuario'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      if (isEdit) {
        await updateUsuario(id, form);
      } else {
        await createUsuario(form);
      }
      navigate('/usuarios');
    } catch (err) {
      setError(err.message || 'Error al guardar');
    }
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

        <Button
          type="submit"
          variant="contained"
          fullWidth
          sx={{ mt: 3 }}
        >
          {isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        </Button>
      </Box>
    </Container>
  );
}
