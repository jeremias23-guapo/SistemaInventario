// frontend/src/pages/CategoriaForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  createCategoria,
  fetchCategoria,
  updateCategoria,
  fetchCategorias,
} from '../api/categorias';
import { useNavigate, useParams } from 'react-router-dom';

export default function CategoriaForm() {
  const { id } = useParams();
  const nav = useNavigate();

  // Guardamos parent_id como string para que MUI Select lo maneje bien
  const [form, setForm] = useState({ nombre: '', parent_id: '' });
  const [allCats, setAllCats] = useState([]);

  // Carga todas las categorías para el dropdown
  const loadCategorias = async () => {
    const res = await fetchCategorias();
    setAllCats(res.data);
  };

  useEffect(() => {
    loadCategorias();

    if (id) {
      // Si estamos editando, cargamos los datos
      fetchCategoria(id).then((r) => {
        const { nombre, parent_id } = r.data;
        setForm({
          nombre,
          // Convertimos null -> '' para que Select muestre el placeholder
          parent_id: parent_id != null ? String(parent_id) : '',
        });
      });
    }
  }, [id]);

  // Manejador unificado para TextField y Select
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Preparamos payload, convirtiendo parent_id a número o null
    const payload = {
      nombre: form.nombre,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    };

    if (id) {
      await updateCategoria(id, payload);
    } else {
      await createCategoria(payload);
    }

    nav('/categorias');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Categoría' : 'Nueva Categoría'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* Nombre */}
            <TextField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />

            {/* Select de Categoría Padre */}
            <FormControl fullWidth>
              <InputLabel id="parent-label">Categoría Padre</InputLabel>
              <Select
                labelId="parent-label"
                label="Categoría Padre"
                name="parent_id"
                value={form.parent_id}
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>— Ninguna —</em>
                </MenuItem>
                {allCats
                  .filter((c) => !id || c.id !== Number(id))
                  .map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* Botones */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => nav('/categorias')}>
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
