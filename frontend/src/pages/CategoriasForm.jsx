// frontend/src/pages/CategoriaForm.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import debounce from 'lodash.debounce';

import {
  createCategoria,
  fetchCategoria,
  updateCategoria,
  fetchCategoriasPadre,     // legacy (para editar/cargar valor actual sin búsqueda)
  searchCategoriasPadre,    // nuevo (paginado + q)
} from '../api/categorias';

import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function CategoriaForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [form, setForm] = useState({ nombre: '', parent_id: '' });
  const [esPadre, setEsPadre] = useState(false);
  const [loading, setLoading] = useState(true);
  const [esPadreEditable, setEsPadreEditable] = useState(true);
  const [dirty, setDirty] = useState(false);

  // === Autocomplete (padres) ===
  const [parentOptions, setParentOptions] = useState([]);
  const [parentLoading, setParentLoading] = useState(false);
  const [parentPage, setParentPage] = useState(0);       // 0-based
  const [parentHasMore, setParentHasMore] = useState(true);
  const [parentQuery, setParentQuery] = useState('');
  const parentPageSize = 10;
  const listboxRef = useRef(null);

  const showEsPadreCheckbox = !id || esPadre;

  // Cargar padres (server-side paginado + q)
  const loadParents = async (page = 0, q = parentQuery, append = false) => {
    setParentLoading(true);
    try {
      const res = await searchCategoriasPadre({
        page: page + 1, // backend 1-based
        limit: parentPageSize,
        q,
      });
      const arr = Array.isArray(res?.data) ? res.data : [];
      const total = Number(res?.headers?.['x-total-count'] ?? 0);

      setParentHasMore((page + 1) * parentPageSize < total);
      setParentOptions((prev) => (append ? [...prev, ...arr] : arr));
      setParentPage(page);
    } finally {
      setParentLoading(false);
    }
  };

  // Debounce de búsqueda
  const debouncedSearchParents = React.useMemo(
    () =>
      debounce((q) => {
        setParentQuery(q);
        loadParents(0, q, false);
      }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Scroll infinito en el popup del Autocomplete
  const onParentsListboxScroll = (ev) => {
    const listboxNode = ev.currentTarget;
    if (!parentHasMore || parentLoading) return;
    const nearBottom =
      listboxNode.scrollTop + listboxNode.clientHeight >=
      listboxNode.scrollHeight - 24;
    if (nearBottom) {
      loadParents(parentPage + 1, parentQuery, true);
    }
  };

  // Apagar overlay al montar (la lista lo dejó encendido)
  useEffect(() => {
    stop();
  }, [stop]);

  // Inicialización
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        if (id) {
          // Editar: cargamos la categoría actual
          const r = await fetchCategoria(id);
          const data = r?.data || {};
          const { nombre = '', parent_id = null } = data;
          setForm({
            nombre,
            parent_id: parent_id != null ? String(parent_id) : '',
          });
          const isRoot = parent_id == null;
          setEsPadre(isRoot);
          setEsPadreEditable(!isRoot);

          // Para mostrar el valor seleccionado, necesitamos que esté en options.
          // Cargamos padres legacy (sin q) y luego, si no lo trae, lo pedimos explícito.
          const legacy = await fetchCategoriasPadre();
          const opts = Array.isArray(legacy?.data) ? legacy.data : [];
          setParentOptions(opts);
        } else {
          // Crear: por defecto es padre (sin padre)
          setEsPadre(true);
          setForm({ nombre: '', parent_id: '' });
          setEsPadreEditable(true);
        }
      } catch (err) {
        console.error('Error cargando categoría:', err);
        showToast({ message: 'Error cargando categoría', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChangeNombre = (e) => {
    setForm((prev) => ({ ...prev, nombre: e.target.value }));
    setDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nombre: form.nombre.trim(),
      parent_id: esPadre ? null : form.parent_id ? Number(form.parent_id) : null,
    };

    if (id) {
      const ok = await confirm({
        title: 'Actualizar categoría',
        content: '¿Deseas actualizar esta categoría?',
        confirmText: 'Sí, actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start();
    try {
      if (id) {
        await updateCategoria(id, payload);
        showToast({ message: 'Categoría actualizada', severity: 'success' });
      } else {
        await createCategoria(payload);
        showToast({ message: 'Categoría creada', severity: 'success' });
      }
      nav('/categorias', { replace: true });
    } catch (err) {
      console.error('Error guardando categoría:', err);
      showToast({ message: 'Error guardando categoría', severity: 'error' });
      stop();
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

  // Valor seleccionado (objeto) para el Autocomplete
  const selectedParentObj =
    esPadre || !form.parent_id
      ? null
      : parentOptions.find((o) => String(o.id) === String(form.parent_id)) || null;

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
              onChange={handleChangeNombre}
              required
              inputProps={{ maxLength: 100 }}
            />

            {/* Checkbox: Es categoría padre */}
            {(!id || esPadre) && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={esPadre}
                    disabled={!esPadreEditable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEsPadre(checked);
                      if (checked) {
                        setForm((prev) => ({ ...prev, parent_id: '' }));
                      } else {
                        // al pasar a subcategoría, pre-cargar lista
                        if (parentOptions.length === 0) loadParents(0, '', false);
                      }
                      setDirty(true);
                    }}
                  />
                }
                label="Es categoría padre (no tiene padre)"
              />
            )}

            {/* Autocomplete asíncrono para Categoría Padre */}
            <Autocomplete
              disabled={esPadre}
              value={selectedParentObj}
              onChange={(_, newValue) => {
                setForm((prev) => ({ ...prev, parent_id: newValue ? String(newValue.id) : '' }));
                setDirty(true);
              }}
              onOpen={() => {
                if (parentOptions.length === 0) loadParents(0, parentQuery, false);
              }}
              filterOptions={(x) => x} // sin filtrado local
              options={parentOptions}
              getOptionLabel={(opt) => (opt?.nombre ?? '')}
              isOptionEqualToValue={(opt, val) => String(opt.id) === String(val.id)}
              loading={parentLoading}
              ListboxProps={{
                ref: listboxRef,
                onScroll: onParentsListboxScroll,
                style: { maxHeight: 300, overflow: 'auto' },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoría Padre"
                  placeholder="Escribe para buscar…"
                  onChange={(e) => debouncedSearchParents(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {parentLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              clearOnEscape
            />

            {/* Botones */}
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
