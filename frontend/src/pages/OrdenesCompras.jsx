import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  TextField,
  TablePagination
} from '@mui/material';
import DataTable from '../components/DataTable';
import {
  fetchOrdenesCompra,
  deleteOrdenCompra,
  searchOrdenesCompra
} from '../api/ordenes_compra';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import DateField from '../components/DateField';
import { AuthContext } from '../contexts/AuthContext'; // 👈 para saber el rol

export default function OrdenesCompra() {
  const { user } = useContext(AuthContext); // 👈 obtener el usuario actual
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [fecha, setFecha] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const nav = useNavigate();
  const loc = useLocation();
  const { start, stop } = useLoading();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const stoppedOnceRef = useRef(false);

  const extractArray = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.rows)) return payload.rows;
    return [];
  };

  const applyResult = (res) => {
    const arr = extractArray(res);
    setOrdenes(arr);
    const p = res?.pagination || {};
    setTotal(Number(p.total || arr.length || 0));
  };

  const load = async (apiPage, size) => {
    setLoading(true);
    try {
      const res = await fetchOrdenesCompra({ page: apiPage, pageSize: size });
      applyResult(res);
    } catch (err) {
      console.error('Error cargando órdenes', err);
      setOrdenes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async ({ codigo, fecha }, apiPage, size) => {
    setLoading(true);
    try {
      const res = await searchOrdenesCompra({ codigo, fecha, page: apiPage, pageSize: size });
      applyResult(res);
    } catch (err) {
      console.error('Error buscando órdenes', err);
      setOrdenes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try { await load(1, pageSize); }
      finally {
        if (!stoppedOnceRef.current) {
          stop();
          stoppedOnceRef.current = true;
        }
      }
    })();

    const flash = loc.state?.flash;
    if (flash?.message) {
      showToast({ message: flash.message, severity: flash.severity || 'success' });
      nav(loc.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(0);
      const apiPage = 1;
      if (codigo || fecha) {
        handleSearch({ codigo, fecha }, apiPage, pageSize);
      } else {
        load(apiPage, pageSize);
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, fecha]);

  const onClear = async () => {
    setCodigo('');
    setFecha('');
    setPage(0);
    await load(1, pageSize);
  };

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Código', accessor: 'codigo' },
    { Header: 'Proveedor', accessor: 'proveedor_nombre' },
    { Header: 'Fecha', accessor: (row) => <DateField value={row.fecha} /> },
    { Header: 'Estado', accessor: 'estado' },
    {
      Header: 'Total',
      accessor: (row) =>
        new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' })
          .format(Number(row.total_orden || 0)),
    },
  ];

  const goToNuevo = () => { start(); nav('/ordenes_compra/nuevo'); };
  const goToVer = (id) => { start(); nav(`/ordenes_compra/detalle/${id}`); };
  const goToEdit = (id) => { start(); nav(`/ordenes_compra/editar/${id}`); };

  const onDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar orden',
      content: `¿Seguro que quieres eliminar la orden "${row.codigo}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error'
    });
    if (!ok) return;

    setLoading(true);
    try {
      await deleteOrdenCompra(row.id);

      let targetPage = page;
      if (ordenes.length === 1 && page > 0) {
        targetPage = page - 1;
        setPage(targetPage);
      }
      const apiPage = targetPage + 1;

      if (codigo || fecha) await handleSearch({ codigo, fecha }, apiPage, pageSize);
      else await load(apiPage, pageSize);

      showToast({ message: 'Orden eliminada correctamente.', severity: 'success' });
    } catch (err) {
      console.error('Error eliminando orden', err);
      showToast({ message: 'No se pudo eliminar la orden.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = async (_evt, newPage) => {
    setPage(newPage);
    const apiPage = newPage + 1;
    if (codigo || fecha) await handleSearch({ codigo, fecha }, apiPage, pageSize);
    else await load(apiPage, pageSize);
  };

  const handleChangeRowsPerPage = async (evt) => {
    const newSize = parseInt(evt.target.value, 10);
    setPageSize(newSize);
    setPage(0);
    const apiPage = 1;
    if (codigo || fecha) await handleSearch({ codigo, fecha }, apiPage, newSize);
    else await load(apiPage, newSize);
  };

  // 🔐 Control de acciones según rol y estado
  const actionGuard = (row) => {
    const estado = row.estado?.toLowerCase() || '';

    // 👑 Admin puede todo
    if (user?.rol_id === 1) {
      return { view: true, edit: true, delete: true };
    }

    // 👤 Usuario (rol 2)
    if (user?.rol_id === 2) {
      if (estado === 'pendiente') {
        return { view: true, edit: true, delete: true };
      }
      if (estado === 'recibida' || estado === 'cancelada') {
        return { view: true, edit: false, delete: false };
      }
    }

    // por defecto solo ver
    return { view: true };
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Órdenes de Compra</Typography>

        {/* ✅ Botón visible para todos (admin y usuario) */}
        <Button variant="contained" onClick={goToNuevo}>
          Nueva Orden
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Código"
            variant="outlined"
            size="small"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Fecha"
            type="date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            disabled={loading}
          />
          <Button variant="text" onClick={onClear} disabled={loading || (!codigo && !fecha)}>
            Limpiar
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <DataTable
          rows={ordenes}
          columns={columns}
          loading={loading}
          onView={row => goToVer(row.id)}
          onEdit={row => goToEdit(row.id)}
          onDelete={onDelete}
          actionGuard={actionGuard} // 👈 aquí se aplican los permisos
          maxHeight={window.innerHeight - 300}
        />
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>
    </Container>
  );
}
