// frontend/src/pages/ProductoForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  Container,
  Stack,
  TextField,
  Typography,
  Toolbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AsyncAutocomplete from '../components/AsyncAutocomplete';
import {
  createProducto,
  fetchProducto,
  updateProducto,
} from '../api/productos';
import { fetchMarcasPage, fetchMarcaOptionById } from '../api/marcas';
import {
  fetchCategoria,
  searchCategoriasPadre,
  searchSubcategorias,
} from '../api/categorias';
import { subirImagen } from '../api/imagenes';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

export default function ProductoForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Estados principales
  const [marcaSel, setMarcaSel] = useState(null);
  const [padreSel, setPadreSel] = useState(null);
  const [subcatSel, setSubcatSel] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio_compra: 0,
    precio_venta: '',
    stock: 0,
    marca_id: '',
    categoria_id: '',
    imagen_url: '',
    presentacion: '',
  });

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  useEffect(() => { stop(); }, [stop]);

  // Cargar producto al editar
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetchProducto(id);
        if (!mountedRef.current) return;
        const data = res.data || {};
        setForm({
          nombre: data.nombre || '',
          descripcion: data.descripcion || '',
          precio_compra: Number(data.precio_compra ?? 0),
          precio_venta: data.precio_venta ?? '',
          stock: Number(data.stock ?? 0),
          marca_id: data.marca_id ? String(data.marca_id) : '',
          categoria_id: data.categoria_id ? String(data.categoria_id) : '',
          imagen_url: data.imagen_url || '',
          presentacion: data.presentacion || '',
        });
        if (data.imagen_url) setPreview(data.imagen_url);

        if (data.marca_id) {
          const mOpt = await fetchMarcaOptionById(data.marca_id);
          if (mountedRef.current) setMarcaSel(mOpt);
        }

        if (data.categoria_id) {
          const subRes = await fetchCategoria(data.categoria_id);
          const sub = subRes?.data;
          if (sub) {
            const subOpt = { id: sub.id, label: sub.nombre, ...sub };
            setSubcatSel(subOpt);
            if (sub.parent_id) {
              const padreRes = await fetchCategoria(sub.parent_id);
              const p = padreRes?.data;
              if (p) setPadreSel({ id: p.id, label: p.nombre, ...p });
            } else setPadreSel(subOpt);
          }
        }

        setDirty(false);
      } catch {
        showToast({ message: 'Error cargando producto', severity: 'error' });
      }
    })();
  }, [id, showToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setDirty(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setDirty(true);
  };

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const mapCategoriaPage = (raw) => {
    const data = raw?.data ?? raw;
    const items = Array.isArray(data?.items) ? data.items : data;
    return { items: items.map((c) => ({ id: c.id, label: c.nombre, ...c })), hasMore: false };
  };

  const fetchPadresPage = async (params) => mapCategoriaPage(await searchCategoriasPadre(params));
  const fetchSubcatsPage = async (params) =>
    padreSel?.id ? mapCategoriaPage(await searchSubcategorias(padreSel.id, params)) : { items: [] };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subcatSel?.id) {
      showToast({ message: 'Selecciona una subcategoría', severity: 'warning' });
      return;
    }

    if (id) {
      const ok = await confirm({
        title: 'Actualizar producto',
        content: '¿Estás seguro?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
      });
      if (!ok) return;
    }

    start();
    try {
      let imagen_url = form.imagen_url || '';
      if (file) {
        const res = await subirImagen(file);
        imagen_url = res?.data?.url ?? res?.url ?? imagen_url;
      }

      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_venta: parseFloat(form.precio_venta) || 0,
        marca_id: marcaSel?.id ? Number(marcaSel.id) : null,
        categoria_id: subcatSel?.id ? Number(subcatSel.id) : null,
        imagen_url,
        presentacion: form.presentacion || '',
      };

      if (id) {
        await updateProducto(id, payload);
        showToast({ message: 'Producto actualizado', severity: 'success' });
      } else {
        await createProducto(payload);
        showToast({ message: 'Producto creado', severity: 'success' });
      }

      nav('/productos', { replace: true });
    } catch {
      showToast({ message: 'Error guardando producto', severity: 'error' });
      stop();
    }
  };

  const handleCancel = async () => {
    if (dirty) {
      const ok = await confirm({
        title: 'Descartar cambios',
        content: '¿Salir sin guardar?',
        confirmText: 'Salir',
        cancelText: 'Seguir editando',
      });
      if (!ok) return;
    }
    start();
    nav('/productos');
  };

  // ===========================================================
  //                   RENDERIZADO VISUAL
  // ===========================================================
  return (
    <Box
      sx={(t) => ({
        position: 'fixed', // 👈 Fijo a la pantalla
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:
          t.palette.mode === 'light'
            ? alpha(t.palette.primary.main, 0.02)
            : alpha(t.palette.primary.main, 0.05),
        zIndex: (theme) => theme.zIndex.drawer + 1,
        overflow: 'hidden',
        pt: `calc(${t.mixins.toolbar.minHeight}px + ${t.spacing(2)})`, // deja espacio si hay AppBar
        pb: 6,
      })}
    >
      <Container maxWidth="md">
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5, textAlign: 'center' }}>
          {id ? 'Editar producto' : 'Nuevo producto'}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, textAlign: 'center' }}
        >
          Completa los datos del producto sin necesidad de desplazarte demasiado.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              p: 3,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 2,
              }}
            >
              {/* COLUMNA IZQUIERDA */}
              <Stack spacing={2}>
                <TextField
                  label="Nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  size="small"
                />
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  multiline
                  minRows={2}
                  size="small"
                />
                <TextField
                  label="Presentación / Tamaño (ej: 30 ml, 60 ml)"
                  name="presentacion"
                  value={form.presentacion || ''}
                  onChange={handleChange}
                  required
                  size="small"
                />
                <TextField
                  label="Precio venta"
                  name="precio_venta"
                  type="number"
                  value={form.precio_venta}
                  onChange={handleChange}
                  required
                  size="small"
                  inputProps={{ min: 0, step: '0.01' }}
                />
                <AsyncAutocomplete
                  label="Marca"
                  value={marcaSel}
                  onChange={(opt) => {
                    setMarcaSel(opt || null);
                    setForm((f) => ({ ...f, marca_id: opt?.id ? String(opt.id) : '' }));
                  }}
                  fetchPage={fetchMarcasPage}
                  placeholder="Buscar marca…"
                />
              </Stack>

              {/* COLUMNA DERECHA */}
              <Stack spacing={2}>
                <AsyncAutocomplete
                  label="Categoría"
                  value={padreSel}
                  onChange={(opt) => {
                    setPadreSel(opt || null);
                    setSubcatSel(null);
                    setForm((f) => ({ ...f, categoria_id: '' }));
                  }}
                  fetchPage={fetchPadresPage}
                  placeholder="Buscar categoría…"
                />

                <AsyncAutocomplete
                  label="Subcategoría"
                  value={subcatSel}
                  onChange={(opt) => {
                    setSubcatSel(opt || null);
                    setForm((f) => ({ ...f, categoria_id: opt?.id ? String(opt.id) : '' }));
                  }}
                  fetchPage={fetchSubcatsPage}
                  placeholder={
                    padreSel ? 'Buscar subcategoría…' : 'Selecciona una categoría primero'
                  }
                  disabled={!padreSel}
                />

                {id && (
                  <>
                    <TextField
                      label="Precio compra (informativo)"
                      name="precio_compra"
                      type="number"
                      value={form.precio_compra}
                      size="small"
                      InputProps={{ readOnly: true }}
                      helperText="Se actualiza automáticamente al registrar compras"
                    />
                    <TextField
                      label="Stock (informativo)"
                      name="stock"
                      type="number"
                      value={form.stock}
                      size="small"
                      InputProps={{ readOnly: true }}
                      helperText="Se actualiza con compras/ventas"
                    />
                  </>
                )}

                {/* IMAGEN */}
               {/* IMAGEN */}
{/* IMAGEN */}
<Stack spacing={1}>
  <Typography variant="subtitle2">Imagen</Typography>

  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.5,
      borderRadius: 2,
      border: '1px solid #ddd',
      backgroundColor: '#fafafa',
      width: 'fit-content',
    }}
  >
    <Button component="label" variant="outlined" size="small">
      Subir imagen
      <input hidden type="file" accept="image/*" onChange={handleFileChange} />
    </Button>

    {preview && (
      <Box
        component="img"
        src={preview}
        alt="preview"
        sx={{
          width: 72,
          height: 72,
          borderRadius: 2,
          objectFit: 'cover',
          border: '1px solid #ccc',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      />
    )}
  </Box>
</Stack>

              </Stack>
            </Box>

            {/* BOTONES */}
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="contained" type="submit">
                {id ? 'Actualizar' : 'Guardar'}
              </Button>
            </Stack>
          </Card>
        </form>
      </Container>
    </Box>
  );
}
