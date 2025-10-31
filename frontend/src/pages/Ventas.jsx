import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  TextField,
  TablePagination,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DateField from '../components/DateField';
import DataTable from '../components/DataTable';
import { fetchVentas, searchVentas, deleteVenta, quickUpdateVenta } from '../api/ventas';
import { useLoading } from '../contexts/LoadingContext';
import { toast } from '../utils/alerts';

const getIsAdmin = () => {
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return false;
    const u = JSON.parse(stored);
    return u.rol === 'admin' || u.rol_id === 1;
  } catch {
    return false;
  }
};

const isLocked = (row) =>
  ['cancelada', 'finalizada'].includes((row?.estado_venta || '').toLowerCase());

const ESTADOS_ENVIO = [
  { value: '', label: 'Todos' },
  { value: 'pendiente_envio', label: 'Pendiente de envío' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'recibido', label: 'Recibido' },
];

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [fecha, setFecha] = useState('');
  const [estadoEnvio, setEstadoEnvio] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [confirmData, setConfirmData] = useState(null); // 💬 para el diálogo

  const nav = useNavigate();
  const isAdmin = getIsAdmin();
  const { start, stop } = useLoading();
  const stoppedOnceRef = useRef(false);

  // ✅ Cargar ventas iniciales
  const formatVentas = (resp) => {
    if (Array.isArray(resp)) {
      setTotal(resp.length);
      return resp;
    }
    const data = Array.isArray(resp?.data) ? resp.data : [];
    const pg = resp?.pagination;
    if (pg) {
      setTotal(Number(pg.total || 0));
      if (pg.page) setPage(pg.page);
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

  const handleSearch = async ({ codigo, fecha, estado_envio, opts = {} }) => {
    setLoading(true);
    try {
      const data = await searchVentas({ codigo, fecha, estado_envio, page, limit, ...(opts || {}) });
      setVentas(formatVentas(data));
    } catch (err) {
      console.error('Error buscando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadVentas();
      } finally {
        if (!stoppedOnceRef.current) {
          stop();
          stoppedOnceRef.current = true;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      const hasFilters = codigo || fecha || estadoEnvio;
      setPage(1);
      if (hasFilters) {
        handleSearch({ codigo, fecha, estado_envio: estadoEnvio, opts: { page: 1 } });
      } else {
        loadVentas({ page: 1 });
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, fecha, estadoEnvio]);

  useEffect(() => {
    const hasFilters = codigo || fecha || estadoEnvio;
    if (hasFilters) handleSearch({ codigo, fecha, estado_envio: estadoEnvio });
    else loadVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onClear = async () => {
    setCodigo('');
    setFecha('');
    setEstadoEnvio('');
    setPage(1);
    await loadVentas({ page: 1 });
  };

  // 💬 Confirmación
  const handleConfirm = async () => {
    if (!confirmData) return;
    const { row, field, next } = confirmData;
    try {
      await quickUpdateVenta(row.id, { [field]: next });
      toast.ok('Estado actualizado correctamente');
      setVentas((v) => v.map((r) => (r.id === row.id ? { ...r, [field]: next } : r)));
    } catch (err) {
      toast.error('Error', 'No se pudo actualizar el estado');
      console.error(err);
    } finally {
      setConfirmData(null);
    }
  };
  const handleCancelDialog = () => setConfirmData(null);

  // ✅ Columnas con Chips interactivos
  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'Código', accessor: 'codigo' },
      { Header: 'Cliente', accessor: 'cliente_nombre' },
      { Header: 'Fecha', accessor: (row) => <DateField value={row.fecha} empty="—" /> },

      // 🔹 Estado de pago interactivo
      {
        Header: 'Pago',
        accessor: (row) => {
          const val = (row.estado_pago || '').toLowerCase();
          const color = val.includes('pagada') ? 'success' : 'error';
          const next = val === 'pagada' ? 'pendiente_pago' : 'pagada';
          const isDisabled = isLocked(row);

          return (
            <Chip
              label={row.estado_pago || '—'}
              variant="outlined"
              color={color}
              size="small"
              sx={{
                textTransform: 'capitalize',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onClick={() => {
                if (isDisabled) return;
                setConfirmData({
                  row,
                  field: 'estado_pago',
                  next,
                  title: 'Cambiar estado de pago',
                  message: `¿Deseas cambiar el estado de pago a "${next}"?`,
                });
              }}
            />
          );
        },
      },

      // 🔹 Estado de envío interactivo
      {
        Header: 'Envío',
        accessor: (row) => {
          const val = (row.estado_envio || '').toLowerCase();
          const color =
            val === 'pendiente_envio'
              ? 'error'
              : val === 'enviado'
              ? 'info'
              : val === 'recibido'
              ? 'success'
              : 'default';
          const next =
            val === 'pendiente_envio'
              ? 'enviado'
              : val === 'enviado'
              ? 'recibido'
              : 'pendiente_envio';
          const isDisabled = isLocked(row);

          return (
            <Chip
              label={row.estado_envio || '—'}
              variant="outlined"
              color={color}
              size="small"
              sx={{
                textTransform: 'capitalize',
                fontWeight: 600,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
              }}
              onClick={() => {
                if (isDisabled) return;
                setConfirmData({
                  row,
                  field: 'estado_envio',
                  next,
                  title: 'Cambiar estado de envío',
                  message: `¿Deseas cambiar el estado de envío a "${next}"?`,
                });
              }}
            />
          );
        },
      },

      // 🔹 Estado de venta
      {
        Header: 'Venta',
        accessor: (row) => {
          const val = (row.estado_venta || '').toLowerCase();
          let color = 'default';
          if (val === 'activa') color = 'error';
          else if (val === 'finalizada') color = 'success';
          else if (val === 'cancelada') color = 'info';
          return (
            <Chip
              label={row.estado_venta || '—'}
              variant="outlined"
              color={color}
              size="small"
              sx={{ textTransform: 'capitalize', fontWeight: 600 }}
            />
          );
        },
      },

      { Header: 'Método', accessor: 'metodo_pago' },
      { Header: 'Total bruto', accessor: (r) => Number(r.total_venta).toFixed(2) },
      { Header: 'Total neto', accessor: (r) => `$ ${Number(r.total_venta_neta).toFixed(2)}` },
      { Header: 'Usuario', accessor: 'usuario_nombre' },
      { Header: 'Transportista', accessor: (r) => r.transportista_nombre || '—' },
      { Header: 'Comisión', accessor: (r) => `$ ${Number(r.transportista_comision || 0).toFixed(2)}` },
    ],
    []
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Ventas
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Código"
            variant="outlined"
            size="small"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Fecha"
            type="date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={loading}
          />
          <TextField
            select
            size="small"
            label="Estado envío"
            value={estadoEnvio}
            onChange={(e) => setEstadoEnvio(e.target.value)}
            sx={{ minWidth: 200 }}
            disabled={loading}
          >
            {ESTADOS_ENVIO.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="text" onClick={onClear} disabled={loading || (!codigo && !fecha && !estadoEnvio)}>
            Limpiar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              start();
              nav('/ventas/nuevo');
            }}
          >
            Nueva Venta
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <DataTable
          rows={ventas}
          columns={columns}
          loading={loading}
          onView={(row) => {
            start();
            nav(`/ventas/ver/${row.id}`);
          }}
          onEdit={(row) => {
            if (!isAdmin && isLocked(row)) return;
            start();
            nav(`/ventas/editar/${row.id}`);
          }}
          onDelete={(row) => {
            if (!isAdmin && isLocked(row)) return;
            if (window.confirm('¿Eliminar esta venta?')) {
              setLoading(true);
              deleteVenta(row.id)
                .then(() => {
                  if (ventas.length === 1 && page > 1) {
                    setPage((p) => p - 1);
                  } else {
                    if (codigo || fecha || estadoEnvio)
                      return handleSearch({ codigo, fecha, estado_envio: estadoEnvio });
                    return loadVentas();
                  }
                })
                .catch((err) => console.error('Error eliminando venta', err))
                .finally(() => setLoading(false));
            }
          }}
          actionGuard={(row) => ({
            view: true,
            edit: isAdmin || !isLocked(row),
            delete: isAdmin || !isLocked(row),
          })}
        />

        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_, newPage) => setPage(newPage + 1)}
          rowsPerPage={limit}
          onRowsPerPageChange={(e) => {
            setLimit(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[5, 10, 20, 50, 100]}
        />
      </Paper>

      {/* 💬 Diálogo de confirmación */}
      <Dialog open={!!confirmData} onClose={handleCancelDialog}>
        <DialogTitle>{confirmData?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmData?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
