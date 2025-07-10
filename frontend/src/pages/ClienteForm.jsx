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

export default function ClienteForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [cliente, setCliente] = useState({
    nombre: '',
    contacto: '',
    email: '',
    direccion: ''
  });

  useEffect(() => {
    if (id) {
      fetchCliente(id)
        .then(r => setCliente(r))
        .catch(console.error);
    }
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setCliente(c => ({ ...c, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (id) {
        await updateCliente(id, cliente);
      } else {
        await createCliente(cliente);
      }
      nav('/clientes');
    } catch (err) {
      console.error('Error guardando cliente', err.response?.data || err);
      alert('Hubo un error: ' + (err.response?.data?.error || err.message));
    }
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
              <Button variant="outlined" onClick={() => nav('/clientes')}>
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
