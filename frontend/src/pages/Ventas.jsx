// frontend/src/pages/Ventas.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  TextField,
  TablePagination,   // <-- agregado
} from '@mui/material';
import DataTable from '../components/DataTable';
import DateField from '../components/DateField';
import { fetchVentas, searchVentas, deleteVenta } from '../api/ventas';
import { useLoading } from '../contexts/LoadingContext';

const getIsAdmin = () => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    const u = JSON.parse(stored);
    return u.rol === 'admin' || u.rol_id === 1;
  } catch { return false; }
};

const isLocked = (row) =>
  ['cancelada', 'finalizada'].includes((row?.estado_venta || '').toLowerCase());

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [fecha, setFecha] = useState('');

  // --- NUEVO: estado de paginación
  const [page, setPage] = useState(1);      // 1-based
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const nav = useNavigate();
  const isAdmin = getIsAdmin();
  const { start, stop } = useLoading();
  const stoppedOnceRef = useRef(false);

  const formatVentas = (resp) => {
    // Compat: backend nuevo devuelve { data, pagination }; antiguo: array
    if (Array.isArray(resp)) {
      setTotal(resp.length);
      return resp;
    }
    const data = Array.isArray(resp?.data) ? resp.data : [];
    const pg = resp?.pagination;
    if (pg) {
      setTotal(Number(pg.total || 0));
      // solo actualizamos si vienen definidos (para no pisar estado cuando viene de compat)
      if (pg.page)  setPage(pg.page);
      if (pg.limit) setLimit(pg.limit);
    }
    return data;
  };

  const loadVentas = async (opts = {}) => {
    setLoading(true);
    try {
      const data = await fetchVentas({ page, limit, ...(opts || {}) });
      setVentas(formatVentas(data));
    } catch (err) {
      console.error('Error cargando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async ({ codigo, fecha, opts = {} }) => {
    setLoading(true);
    try {
      const data = await searchVentas({ codigo, fecha, page, limit, ...(opts || {}) });
      setVentas(formatVentas(data));
    } catch (err) {
      console.error('Error buscando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try { await loadVentas(); }
      finally {
        if (!stoppedOnceRef.current) { stop(); stoppedOnceRef.current = true; }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuscar al cambiar filtros con pequeño debounce
  useEffect(() => {
    const id = setTimeout(() => {
      if (codigo || fecha) {
        // al cambiar filtro, resetea a primera página
        setPage(1);
        handleSearch({ codigo, fecha, opts: { page: 1 } });
      } else {
        setPage(1);
        loadVentas({ page: 1 });
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, fecha]);

  // Rebuscar al cambiar page/limit (sin tocar filtros)
  useEffect(() => {
    if (codigo || fecha) handleSearch({ codigo, fecha });
    else loadVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onClear = async () => {
    setCodigo(''); setFecha('');
    setPage(1);
    await loadVentas({ page: 1 });
  };

  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'Código', accessor: 'codigo' },
      { Header: 'Cliente', accessor: 'cliente_nombre' },
      { Header: 'Fecha', accessor: (row) => <DateField value={row.fecha} empty="—" /> },
      { Header: 'Pago', accessor: 'estado_pago' },
      { Header: 'Envío', accessor: 'estado_envio' },
      { Header: 'Venta', accessor: 'estado_venta' },
      { Header: 'Método', accessor: 'metodo_pago' },
      { Header: 'Total bruto', accessor: r => Number(r.total_venta).toFixed(2) },
      { Header: 'Total neto', accessor: r => `$ ${Number(r.total_venta_neta).toFixed(2)}` },
      { Header: 'Usuario', accessor: 'usuario_nombre' },
      { Header: 'Transportista', accessor: r => r.transportista_nombre || '—' },
      { Header: 'Comisión', accessor: r => `$ ${Number(r.transportista_comision || 0).toFixed(2)}` },
    ],
    []
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Ventas</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField label="Código" variant="outlined" size="small" value={codigo} onChange={e => setCodigo(e.target.value)} disabled={loading} />
          <TextField label="Fecha" type="date" variant="outlined" size="small" InputLabelProps={{ shrink: true }} value={fecha} onChange={e => setFecha(e.target.value)} disabled={loading} />
          <Button variant="text" onClick={onClear} disabled={loading || (!codigo && !fecha)}>Limpiar</Button>
          <Button variant="contained" color="primary" onClick={() => { start(); nav('/ventas/nuevo'); }}>
            Nueva Venta
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <DataTable
          rows={ventas}
          columns={columns}
          loading={loading}
          onView={row => { start(); nav(`/ventas/ver/${row.id}`); }}
          onEdit={row => { if (!isAdmin && isLocked(row)) return; start(); nav(`/ventas/editar/${row.id}`); }}
          onDelete={row => {
            if (!isAdmin && isLocked(row)) return;
            if (window.confirm('¿Eliminar esta venta?')) {
              setLoading(true);
              deleteVenta(row.id)
                .then(() => {
                  if (ventas.length === 1 && page > 1) {
                    // si borramos la última de la página, retrocedemos una página
                    setPage(p => p - 1);
                  } else {
                    if (codigo || fecha) return handleSearch({ codigo, fecha });
                    return loadVentas();
                  }
                })
                .catch(err => console.error('Error eliminando venta', err))
                .finally(() => setLoading(false));
            }
          }}
          actionGuard={{ isAdmin, isLocked }}
        />

        {/* Paginador MUI desacoplado del DataTable por compatibilidad */}
        <TablePagination
          component="div"
          count={total}
          page={page - 1} // TablePagination es 0-based
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </Paper>
    </Container>
  );
}
