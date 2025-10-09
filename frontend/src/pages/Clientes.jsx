// frontend/src/pages/Clientes.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchClientes, deleteCliente } from '../api/clientes';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // estado para paginación
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const loadClientes = async (p = page, limit = rowsPerPage) => {
    setLoading(true);
    try {
      // IMPORTANTE: fetchClientes debe aceptar (page, limit)
      const res = await fetchClientes(p, limit);
      // backend responde { data, total, page, pages }
      const payload = res?.data ?? [];
      setClientes(Array.isArray(payload) ? payload : []);
      setPage(res?.page ?? p);
      setTotalPages(res?.pages ?? 1);
      setTotalRows(res?.total ?? payload.length);
    } catch (err) {
      console.error('Error cargando clientes', err);
      showToast({ message: 'Error cargando clientes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadClientes(1, rowsPerPage);
      } finally {
        stop(); // apaga overlay al terminar
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // si cambia el tamaño de página, reiniciamos a la página 1
  const handleChangeRowsPerPage = async (e) => {
    const newLimit = Number(e.target.value);
    setRowsPerPage(newLimit);
    await loadClientes(1, newLimit);
  };

  // cambio de página
  const handleChangePage = async (_e, value) => {
    await loadClientes(value, rowsPerPage);
  };

  // Navegación con overlay
  const goToNuevo = () => {
    start();
    nav('/clientes/nuevo');
  };

  const goToEditar = (id) => {
    start();
    nav(`/clientes/editar/${id}`);
  };

  // Eliminar con confirm, overlay y recarga
  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      content: `¿Eliminar el cliente "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start();
    try {
      await deleteCliente(row.id);
      showToast({ message: 'Cliente eliminado', severity: 'success' });

      // recargar conservando página actual; si se queda vacía, retrocede una página
      await loadClientes(page, rowsPerPage);
      if (clientes.length === 1 && page > 1) {
        await loadClientes(page - 1, rowsPerPage);
      }
    } catch (err) {
      console.error('Error eliminando cliente', err);
      showToast({ message: 'No se pudo eliminar el cliente', severity: 'error' });
    } finally {
      stop();
    }
  };

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Contacto', accessor: 'contacto' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Dirección', accessor: 'direccion' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Clientes</Typography>
        <Button variant="contained" onClick={goToNuevo}>
          Nuevo Cliente
        </Button>
      </Stack>

      <Paper>
        {/* Barra superior: info y tamaño de página */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ p: 2 }}
        >
          <Typography variant="body2">
            {loading
              ? 'Cargando...'
              : `Mostrando ${clientes.length} de ${totalRows} clientes (página ${page}/${totalPages})`}
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="rows-per-page-label">Filas por página</InputLabel>
            <Select
              labelId="rows-per-page-label"
              value={rowsPerPage}
              label="Filas por página"
              onChange={handleChangeRowsPerPage}
            >
              {[5, 10, 20, 50].map(n => (
                <MenuItem key={n} value={n}>{n}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <DataTable
          rows={clientes}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={(row) => handleDelete(row)}
        />

        {/* Paginación inferior */}
        <Stack alignItems="center" p={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handleChangePage}
            color="primary"
          />
        </Stack>
      </Paper>
    </Container>
  );
}
