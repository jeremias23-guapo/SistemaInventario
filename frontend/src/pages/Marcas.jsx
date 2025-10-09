import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Stack, Typography, Paper, TextField, TablePagination } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchMarcas, deleteMarca } from '../api/marcas';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Marcas() {
  const [rows, setRows] = useState([]);
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(true);

  // UI 0-based, API 1-based
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const stoppedOnceRef = useRef(false);

  const load = async (apiPage, size, qNombre) => {
    setLoading(true);
    try {
      // 👇 Recibir AxiosResponse y extraer su .data
      const resp = await fetchMarcas({
        page: apiPage,
        pageSize: size,
        nombre: qNombre ?? nombre
      });
      const { data, pagination } = resp?.data ?? {};
      setRows(Array.isArray(data) ? data : []);
      setTotal(Number(pagination?.total || 0));
    } catch (e) {
      console.error('Error cargando marcas', e);
      setRows([]); setTotal(0);
      showToast({ message: 'Error al cargar marcas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try { await load(1, rowsPerPage, nombre); }
      finally {
        if (!stoppedOnceRef.current) { stop(); stoppedOnceRef.current = true; }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounce de filtro nombre
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      load(1, rowsPerPage, nombre);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, rowsPerPage]);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
  ];

  const goToNuevo = () => { start(); nav('/marcas/nuevo'); };
  const goToEditar = (id) => { start(); nav(`/marcas/editar/${id}`); };

  const onDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar marca',
      content: `¿Eliminar la marca "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    setLoading(true);
    try {
      await deleteMarca(row.id);
      // si la página queda vacía, retrocede una
      let targetPage = page;
      if (rows.length === 1 && page > 0) {
        targetPage = page - 1;
        setPage(targetPage);
      }
      await load(targetPage + 1, rowsPerPage, nombre);
      showToast({ message: 'Marca eliminada', severity: 'success' });
    } catch (e) {
      console.error('Error eliminando marca', e);
      showToast({ message: 'No se pudo eliminar la marca', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (_evt, newPage) => {
    setPage(newPage);
    load(newPage + 1, rowsPerPage, nombre);
  };

  const handleChangeRowsPerPage = (evt) => {
    const newSize = parseInt(evt.target.value, 10);
    setRowsPerPage(newSize);
    setPage(0);
    load(1, newSize, nombre);
  };

  const onClear = () => {
    setNombre('');
    setPage(0);
    load(1, rowsPerPage, '');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Marcas</Typography>
        <Button variant="contained" onClick={goToNuevo}>Nueva Marca</Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Nombre"
            variant="outlined"
            size="small"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            disabled={loading}
          />
          <Button variant="text" onClick={onClear} disabled={loading || !nombre}>Limpiar</Button>
        </Stack>
      </Paper>

      <Paper>
        <DataTable
          rows={rows}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={onDelete}
        />
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Container>
  );
}
