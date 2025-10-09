// frontend/src/pages/Proveedores.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container, Button, Stack, Typography, Paper,
  TextField, InputAdornment, Pagination, FormControl, Select, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DataTable from '../components/DataTable';
import { fetchProveedores, deleteProveedor } from '../api/proveedores';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Proveedores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // estado de paginación/búsqueda
  const [page, setPage] = useState(1);       // 1-based
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const [search, setSearch] = useState('');
  const searchDebounce = useRef(null);

  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Contacto', accessor: 'contacto' },
  ];

  // carga paginada
  const loadProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetchProveedores({ page, limit, search });
      const payload = res?.data ?? {};
      const data = Array.isArray(payload?.data) ? payload.data : [];
      setRows(data);
      setTotal(Number(payload?.total ?? 0));
    } catch (err) {
      console.error('Error al cargar proveedores', err);
      showToast({ message: 'Error al cargar proveedores', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // carga inicial y cuando cambian page/limit
  useEffect(() => {
    (async () => {
      try {
        await loadProveedores();
      } finally {
        // Apaga overlay global al terminar la carga inicial
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // búsqueda con debounce (300ms)
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setPage(1); // reset a página 1 al cambiar búsqueda
      await loadProveedores();
    }, 300);
    return () => clearTimeout(searchDebounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const goToNuevo = () => {
    start();
    nav('/proveedores/nuevo');
  };
  const goToEditar = (id) => {
    start();
    // Mantengo tu patrón de ruta actual:
    nav(`/proveedores/editar/${id}`);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar proveedor',
      content: `¿Eliminar el proveedor "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start(); // overlay durante la operación
    try {
      await deleteProveedor(row.id);
      showToast({ message: 'Proveedor eliminado', severity: 'success' });

      // si era el último de la página y no es la primera, retrocede una página
      const nextPage = page > 1 && rows.length === 1 ? page - 1 : page;
      setPage(nextPage);
      await loadProveedores();
    } catch (err) {
      console.error('Error al eliminar proveedor', err);
      showToast({ message: 'No se pudo eliminar el proveedor', severity: 'error' });
    } finally {
      stop();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h5">Proveedores</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar por nombre o contacto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button variant="contained" onClick={goToNuevo}>
            Nuevo Proveedor
          </Button>
        </Stack>
      </Stack>

      <Paper>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={handleDelete}
        />
      </Paper>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography variant="body2">Total: {total}</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small">
            <Select
              value={limit}
              onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
            >
              <MenuItem value={5}>5 / página</MenuItem>
              <MenuItem value={10}>10 / página</MenuItem>
              <MenuItem value={25}>25 / página</MenuItem>
              <MenuItem value={50}>50 / página</MenuItem>
            </Select>
          </FormControl>

          <Pagination
            count={totalPages}
            page={page}
            onChange={(_evt, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      </Stack>
    </Container>
  );
}
