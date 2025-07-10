import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography,
  Stack, TextField, Button
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProveedor,
  fetchProveedor,
  updateProveedor
} from '../api/proveedores';

export default function ProveedorForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState({ nombre: '', contacto: '' });

  useEffect(() => {
    if (id) {
      fetchProveedor(id).then(r =>
        setForm({
          nombre: r.data.nombre,
          contacto: r.data.contacto || ''
        })
      );
    }
  }, [id]);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'contacto') {
      // Filtra para dejar solo dígitos
      const onlyNums = value.replace(/\D/g, '');
      setForm({ ...form, contacto: onlyNums });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (id) await updateProveedor(id, form);
    else    await createProveedor(form);
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
            />
            <TextField
              label="Contacto"
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              // Sugiere teclado numérico y patrón de dígitos
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => nav('/proveedores')}>
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
