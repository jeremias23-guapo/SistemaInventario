import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  TextField,
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchVentas, searchVentas, deleteVenta } from '../api/ventas';

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
  ['pagada', 'cancelada'].includes((row?.estado || '').toLowerCase());

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [fecha, setFecha] = useState('');
  const nav = useNavigate();
  const isAdmin = getIsAdmin();

  const formatVentas = data =>
    data.map(v => ({
      ...v,
      fecha: v.fecha ? v.fecha.slice(0, 10) : ''
    }));

  const loadVentas = async () => {
    setLoading(true);
    try {
      const data = await fetchVentas();
      setVentas(formatVentas(data));
      setCodigo('');
      setFecha('');
    } catch (err) {
      console.error('Error cargando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async ({ codigo, fecha }) => {
    setLoading(true);
    try {
      const data = await searchVentas({ codigo, fecha });
      setVentas(formatVentas(data));
    } catch (err) {
      console.error('Error buscando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codigo || fecha) {
      handleSearch({ codigo, fecha });
    } else {
      loadVentas();
    }
  }, [codigo, fecha]);

  useEffect(() => {
    loadVentas();
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Código', accessor: 'codigo' },
    { Header: 'Cliente', accessor: 'cliente_nombre' },
    { Header: 'Fecha', accessor: 'fecha' },
    { Header: 'Estado', accessor: 'estado' },
    { Header: 'Total', accessor: 'total_venta' },
    { Header: 'Usuario', accessor: 'usuario_nombre' },
  ];

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
            onChange={e => setCodigo(e.target.value)}
          />
          <TextField
            label="Fecha"
            type="date"
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={loadVentas}
            disabled={loading}
          >
            Ver Todas
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => nav('/ventas/nuevo')}
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
  onView={row => nav(`/ventas/ver/${row.id}`)}
  onEdit={row => {
    if (!isAdmin && isLocked(row)) return;
    nav(`/ventas/editar/${row.id}`);
  }}
  onDelete={row => {
    if (!isAdmin && isLocked(row)) return;
    if (window.confirm('¿Eliminar esta venta?')) {
      deleteVenta(row.id).then(loadVentas);
    }
  }}
  actionGuard={{ isAdmin, isLocked }}  // 👈 aquí
/>
      </Paper>
    </Container>
  );
}
