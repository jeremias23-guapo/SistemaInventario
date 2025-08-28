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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  createCategoria,
  fetchCategoria,
  updateCategoria,
  fetchCategoriasPadre,
} from '../api/categorias';
import { useNavigate, useParams } from 'react-router-dom';

export default function CategoriaForm() {
  const { id } = useParams();
  const nav = useNavigate();

  const [form, setForm] = useState({ nombre: '', parent_id: '' });
  const [parentOptions, setParentOptions] = useState([]);
  const [esPadre, setEsPadre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [esPadreEditable, setEsPadreEditable] = useState(true);

  // Mostrar checkbox:
  // - crear => editable
  // - editar padre => visible pero deshabilitado
  // - editar hija => oculto
  const showEsPadreCheckbox = !id || esPadre;

  const loadCategoriasPadre = async () => {
    const res = await fetchCategoriasPadre();
    setParentOptions(res.data || []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCategoriasPadre();

      if (id) {
        const r = await fetchCategoria(id);
        const { nombre, parent_id } = r.data;
        setForm({
          nombre,
          parent_id: parent_id != null ? String(parent_id) : '',
        });
        const isRoot = parent_id == null;
        setEsPadre(isRoot);
        // si es padre (root), el checkbox no se puede desactivar
        setEsPadreEditable(!isRoot);
      } else {
        // creando => por defecto padre editable
        setEsPadre(true);
        setForm({ nombre: '', parent_id: '' });
        setEsPadreEditable(true);
      }

      setLoading(false);
    };

    init();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nombre: form.nombre.trim(),
      parent_id: esPadre ? null : (form.parent_id ? Number(form.parent_id) : null),
    };

    if (id) {
      await updateCategoria(id, payload);
    } else {
      await createCategoria(payload);
    }

    nav('/categorias');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography>Cargando…</Typography>
        </Paper>
      </Container>
    );
  }

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
              inputProps={{ maxLength: 100 }}
            />

            {/* Checkbox: Es categoría padre */}
            {showEsPadreCheckbox && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={esPadre}
                    disabled={!esPadreEditable} // deshabilitado si es padre en edición
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEsPadre(checked);
                      if (checked) {
                        setForm((prev) => ({ ...prev, parent_id: '' }));
                      }
                    }}
                  />
                }
                label="Es categoría padre (no tiene padre)"
              />
            )}

            {/* Select de Categoría Padre */}
            <FormControl fullWidth disabled={esPadre}>
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
                {parentOptions
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
