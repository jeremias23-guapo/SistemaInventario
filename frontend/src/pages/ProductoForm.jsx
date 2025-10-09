// frontend/src/pages/ProductoForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Box,
} from '@mui/material';

import AsyncAutocomplete from '../components/AsyncAutocomplete';

import { createProducto, fetchProducto, updateProducto } from '../api/productos';
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

  // Marca (Autocomplete)
  const [marcaSel, setMarcaSel] = useState(null); // { id, label }

  // Categoría y subcategoría (Autocompletes)
  const [padreSel, setPadreSel] = useState(null);   // { id, label, ... }
  const [subcatSel, setSubcatSel] = useState(null); // { id, label, ... }

  // Gestión de imagen
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    // Informativos
    precio_compra: 0,
    precio_venta: '',
    stock: 0,
    // NOTA: mantenemos estos por compatibilidad, pero los valores reales vienen de *Sel
    marca_id: '',
    categoria_id: '',
    imagen_url: '',
    presentacion: '',
  });

  // Flag de cambios sin guardar
  const [dirty, setDirty] = useState(false);

  // Evitar updates tras desmontar
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Apaga overlay que quedó encendido desde la lista
  useEffect(() => { stop(); }, [stop]);

  // Carga producto en edición
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

        // Precargar Marca como opción del autocomplete
        if (data.marca_id) {
          try {
            const mOpt = await fetchMarcaOptionById(data.marca_id);
            if (mountedRef.current) setMarcaSel(mOpt);
          } catch (_) { /* el usuario podrá buscarla manualmente */ }
        }

        // Resolver etiquetas para autocompletes de categorías
        if (data.categoria_id) {
          try {
            const subRes = await fetchCategoria(data.categoria_id);
            const sub = subRes?.data;
            if (sub) {
              const subOpt = { id: sub.id, label: sub.nombre, ...sub };
              setSubcatSel(subOpt);
              if (sub.parent_id) {
                const padreRes = await fetchCategoria(sub.parent_id);
                const p = padreRes?.data;
                if (p) setPadreSel({ id: p.id, label: p.nombre, ...p });
              } else {
                setPadreSel(subOpt);
              }
            }
          } catch (_) { /* permitir que el usuario busque manualmente */ }
        }

        setDirty(false);
      } catch (err) {
        console.error('Error cargando producto:', err);
        showToast({ message: 'Error cargando producto', severity: 'error' });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

  // Libera URL de preview cuando cambie/termine
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // -------- Autocomplete helpers (categorías) --------
  const mapCategoriaPage = (raw) => {
    const data = raw?.data ?? raw;
    if (Array.isArray(data)) {
      return {
        items: data.map((c) => ({ id: c.id, label: c.nombre, ...c })),
        hasMore: false,
      };
    }
    const items = Array.isArray(data?.items) ? data.items : [];
    const page = Number(data?.page ?? 1);
    const pages = Number(data?.pages ?? 1);
    return {
      items: items.map((c) => ({ id: c.id, label: c.nombre, ...c })),
      hasMore: page < pages,
    };
  };

  const fetchPadresPage = async ({ q, page, limit }) => {
    const res = await searchCategoriasPadre({ q, page, limit });
    return mapCategoriaPage(res);
  };

  const fetchSubcatsPage = async ({ q, page, limit }) => {
    if (!padreSel?.id) return { items: [], hasMore: false };
    const res = await searchSubcategorias(padreSel.id, { q, page, limit });
    return mapCategoriaPage(res);
  };
  // ---------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Confirmar solo si estás editando
    if (id) {
      const ok = await confirm({
        title: 'Actualizar producto',
        content: '¿Estás seguro de actualizar este producto?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    // Validaciones mínimas
    if (!subcatSel?.id) {
      showToast({ message: 'Selecciona una subcategoría', severity: 'warning' });
      return;
    }

    start(); // overlay mientras procesa
    try {
      let imagen_url = form.imagen_url || '';
      if (file) {
        const res = await subirImagen(file);
        imagen_url = res?.data?.url ?? res?.url ?? imagen_url;
      }

      // Construir payload final
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio_venta: parseFloat(form.precio_venta) || 0,
        marca_id: marcaSel?.id ? Number(marcaSel.id) : null,          // 👈 de autocomplete
        categoria_id: subcatSel?.id ? Number(subcatSel.id) : null,    // 👈 de autocomplete
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
    } catch (err) {
      console.error('Error guardando producto:', err);
      showToast({ message: 'Error guardando producto', severity: 'error' });
      stop(); // si no navegamos, apagar overlay
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
    start();
    nav('/productos');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Producto' : 'Nuevo Producto'}
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
              label="Descripción"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
            />

            {/* Informativos (no editables) */}
            <TextField
              label="Precio Compra (informativo)"
              name="precio_compra"
              type="number"
              value={form.precio_compra}
              InputProps={{ readOnly: true }}
              helperText="Se actualiza automáticamente al registrar compras"
            />
            <TextField
              label="Stock (informativo)"
              name="stock"
              type="number"
              value={form.stock}
              InputProps={{ readOnly: true }}
              helperText="Se actualiza con compras/ventas"
            />

            <TextField
              label="Precio Venta"
              name="precio_venta"
              type="number"
              value={form.precio_venta}
              onChange={handleChange}
              required
              inputProps={{ min: 0, step: '0.01' }}
            />

            <TextField
              label="Presentación / Tamaño (ej: 30 ml, 60 ml)"
              name="presentacion"
              value={form.presentacion || ''}
              onChange={handleChange}
              required
            />

            {/* Marca (AsyncAutocomplete) */}
            <AsyncAutocomplete
              label="Marca"
              value={marcaSel}
              onChange={(opt) => {
                setMarcaSel(opt || null);
                setForm((f) => ({ ...f, marca_id: opt?.id ? String(opt.id) : '' })); // opcional, por compat
                setDirty(true);
              }}
              fetchPage={fetchMarcasPage}
              placeholder="Escribe al menos 2 letras…"
              noOptionsText="Sin resultados"
              loadingText="Buscando…"
              isOptionEqualToValue={(a, b) => String(a?.id ?? '') === String(b?.id ?? '')}
              getOptionLabel={(opt) => opt?.label ?? ''}
            />

            {/* Categoría padre */}
            <AsyncAutocomplete
              label="Categoría"
              value={padreSel}
              onChange={(opt) => {
                setPadreSel(opt || null);
                setSubcatSel(null);
                setForm((f) => ({ ...f, categoria_id: '' }));
                setDirty(true);
              }}
              fetchPage={fetchPadresPage}
              placeholder="Buscar categoría…"
              noOptionsText="Sin resultados"
              loadingText="Buscando…"
              isOptionEqualToValue={(a, b) => String(a?.id ?? '') === String(b?.id ?? '')}
              getOptionLabel={(opt) => opt?.label ?? ''}
            />

            {/* Subcategoría */}
            <AsyncAutocomplete
              label="Subcategoría"
              value={subcatSel}
              onChange={(opt) => {
                setSubcatSel(opt || null);
                setForm((f) => ({ ...f, categoria_id: opt?.id ? String(opt.id) : '' }));
                setDirty(true);
              }}
              fetchPage={fetchSubcatsPage}
              placeholder={padreSel ? 'Buscar subcategoría…' : 'Selecciona una categoría primero'}
              noOptionsText={padreSel ? 'Sin resultados' : 'Primero elige una categoría'}
              loadingText="Buscando…"
              disabled={!padreSel}
            />

            {/* Imagen */}
            <div>
              <Typography variant="subtitle2">Imagen del producto</Typography>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview && (
                <Box
                  component="img"
                  src={preview}
                  alt="preview"
                  sx={{ width: 120, mt: 1, borderRadius: 1 }}
                />
              )}
            </div>

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
