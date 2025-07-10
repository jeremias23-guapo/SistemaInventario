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

export default function MarcaForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (id) {
      fetchMarca(id).then(r => setNombre(r.data.nombre));
    }
  }, [id]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (id) await updateMarca(id, { nombre });
    else    await createMarca({ nombre });
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
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => nav('/marcas')}>
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
