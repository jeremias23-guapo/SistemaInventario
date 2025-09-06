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
} from '@mui/material';
import DataTable from '../components/DataTable';
import DateField from '../components/DateField';        // 👈 usa tu componente
import { fetchVentas, searchVentas, deleteVenta } from '../api/ventas';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

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
  const { start, stop } = useLoading();

  // Evita llamar stop() dos veces si el componente remonta
  const stoppedOnceRef = useRef(false);

  // Ya no recortamos la fecha; dejamos tal cual viene del backend
  const formatVentas = (data) => (Array.isArray(data) ? data : []);

  const loadVentas = async () => {
    setLoading(true);
    try {
      const data = await fetchVentas();
      setVentas(formatVentas(data));
      // No reseteamos filtros aquí, solo en "Ver Todas" o "Limpiar"
    } catch (err) {
      console.error('Error cargando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async ({ codigo, fecha }) => {
    setLoading(true);
    try {
      const data = await searchVentas({ codigo, fecha }); // normaliza en la API
      setVentas(formatVentas(data));
    } catch (err) {
      console.error('Error buscando ventas', err);
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial + apagar overlay global (una sola vez)
  useEffect(() => {
    (async () => {
      try {
        await loadVentas();
      } finally {
        if (!stoppedOnceRef.current) {
          stop(); // 👈 apaga overlay al terminar la primera carga
          stoppedOnceRef.current = true;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce de búsqueda cuando cambian filtros
  useEffect(() => {
    // Si no hay filtros, recarga todas con un ligero debounce también
    const id = setTimeout(() => {
      if (codigo || fecha) {
        handleSearch({ codigo, fecha });
      } else {
        loadVentas();
      }
    }, 300); // ⏱️ 300ms

    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, fecha]);

  const onClear = async () => {
    setCodigo('');
    setFecha('');
    await loadVentas();
  };

  const columns = useMemo(
    () => [
      { Header: 'ID', accessor: 'id' },
      { Header: 'Código', accessor: 'codigo' },
      { Header: 'Cliente', accessor: 'cliente_nombre' },
      {
        Header: 'Fecha',
        accessor: (row) => <DateField value={row.fecha} empty="—" /> // 👈 formateo SV
      },
      { Header: 'Estado', accessor: 'estado' },
      { Header: 'Total', accessor: 'total_venta' },
      { Header: 'Usuario', accessor: 'usuario_nombre' },
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
  
    <Button
      variant="text"
      onClick={onClear}
      disabled={loading || (!codigo && !fecha)}
    >
      Limpiar
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={() => { start(); nav('/ventas/nuevo'); }}
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
          onView={row => { start(); nav(`/ventas/ver/${row.id}`); }}     // 👈 overlay
          onEdit={row => {
            if (!isAdmin && isLocked(row)) return;
            start();                                                     // 👈 overlay
            nav(`/ventas/editar/${row.id}`);
          }}
          onDelete={row => {
            if (!isAdmin && isLocked(row)) return;
            if (window.confirm('¿Eliminar esta venta?')) {
              setLoading(true); // spinner local
              deleteVenta(row.id)
                .then(loadVentas)
                .catch(err => console.error('Error eliminando venta', err))
                .finally(() => setLoading(false));
            }
          }}
          actionGuard={{ isAdmin, isLocked }}
        />
      </Paper>
    </Container>
  );
}
