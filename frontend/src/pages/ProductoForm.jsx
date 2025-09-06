// src/pages/ProductoForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  createProducto,
  fetchProducto,
  updateProducto,
} from '../api/productos';
import { fetchMarcas } from '../api/marcas';
import { fetchCategorias } from '../api/categorias';
import { subirImagen } from '../api/imagenes';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function ProductoForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();

  // Listas para selects
  const [marcas, setMarcas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [padreSel, setPadreSel] = useState('');

  // Gestión de imagen
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio_compra: '',
    precio_venta: '',
    stock: '',
    activo: true,
    marca_id: '',
    categoria_id: '',
    imagen_url: '',
    presentacion: '',
  });

  // Evitar updates tras desmontar
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // 🔻 Al montar el form, apaga el overlay que quedó encendido desde la lista
  useEffect(() => { stop(); }, [stop]);

  // Carga de marcas y categorías
  useEffect(() => {
    (async () => {
      try {
        const [mRes, cRes] = await Promise.all([fetchMarcas(), fetchCategorias()]);
        if (!mountedRef.current) return;
        setMarcas(Array.isArray(mRes.data) ? mRes.data : []);
        setCategorias(Array.isArray(cRes.data) ? cRes.data : []);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      }
    })();
  }, []);

  // Carga producto en edición
  useEffect(() => {
    if (!id || !marcas.length || !categorias.length) return;
    (async () => {
      try {
        const res = await fetchProducto(id);
        if (!mountedRef.current) return;
        const data = res.data || {};
        setForm({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio_compra: data.precio_compra ?? '',
          precio_venta: data.precio_venta ?? '',
          stock: data.stock ?? '',
          activo: !!data.activo,
          marca_id: data.marca_id ? String(data.marca_id) : '',
          categoria_id: data.categoria_id ? String(data.categoria_id) : '',
          imagen_url: data.imagen_url || '',
          presentacion: data.presentacion || '',
        });
        if (data.imagen_url) setPreview(data.imagen_url);

        const sub = categorias.find(c => c.id === data.categoria_id);
        if (sub) setPadreSel(String(sub.parent_id || ''));
      } catch (err) {
        console.error('Error cargando producto:', err);
      }
    })();
  }, [id, marcas, categorias]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Libera URL de preview cuando cambie/termine
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleSubmit = async e => {
    e.preventDefault();
    // 🔻 Encendemos overlay para cubrir submit + navegación
    start();
    try {
      let imagen_url = form.imagen_url;
      if (file) {
        const res = await subirImagen(file);
        imagen_url = res.data.url;
      }

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_compra: parseFloat(form.precio_compra) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
        stock: parseInt(form.stock, 10) || 0,
        activo: form.activo,
        marca_id: form.marca_id ? Number(form.marca_id) : null,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
        imagen_url,
        presentacion: form.presentacion || '',
      };

      if (id) await updateProducto(id, payload);
      else await createProducto(payload);

      // La pantalla de lista apagará el overlay al montar
      nav('/productos');
    } catch (err) {
      console.error('Error guardando producto:', err);
      // Si no navegamos por error, apaga el overlay
      stop();
    }
  };

  const handleCancel = () => {
    // 🔻 Overlay mientras navega de vuelta
    start();
    nav('/productos');
  };

  // Filtrar jerarquía
  const padres = categorias.filter(c => c.parent_id == null);
  const subcats = categorias.filter(c => String(c.parent_id) === padreSel);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
            <TextField label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} multiline rows={3} />
            <TextField label="Precio Compra" name="precio_compra" type="number" value={form.precio_compra} onChange={handleChange} />
            <TextField label="Precio Venta" name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} required />
            <TextField label="Stock" name="stock" type="number" value={form.stock} onChange={handleChange} />

            <TextField
              label="Presentación/Tamaño (ej: 30 ml, 60 ml)"
              name="presentacion"
              value={form.presentacion || ''}
              onChange={handleChange}
              required
            />

            <FormControlLabel control={<Switch checked={form.activo} onChange={handleChange} name="activo" />} label="Activo" />

            <FormControl fullWidth>
              <InputLabel id="marca-label">Marca</InputLabel>
              <Select labelId="marca-label" label="Marca" name="marca_id" value={form.marca_id} onChange={handleChange}>
                <MenuItem value=""><em>— Selecciona una marca —</em></MenuItem>
                {marcas.map(m => (
                  <MenuItem key={m.id} value={String(m.id)}>{m.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="padre-label">Categoría</InputLabel>
              <Select
                labelId="padre-label"
                label="Categoría"
                value={padreSel}
                onChange={e => { setPadreSel(e.target.value); setForm(f => ({ ...f, categoria_id: '' })); }}
                required
              >
                <MenuItem value=""><em>— Elige una categoría —</em></MenuItem>
                {padres.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!padreSel}>
              <InputLabel id="sub-label">Subcategoría</InputLabel>
              <Select
                labelId="sub-label"
                label="Subcategoría"
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                required
              >
                <MenuItem value=""><em>— Elige una subcategoría —</em></MenuItem>
                {subcats.map(c => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Imagen */}
            <div>
              <Typography variant="subtitle2">Imagen del producto</Typography>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview && (
                <Box component="img" src={preview} alt="preview" sx={{ width: 120, mt: 1, borderRadius: 1 }} />
              )}
            </div>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit" variant="contained">{id ? 'Actualizar' : 'Guardar'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
