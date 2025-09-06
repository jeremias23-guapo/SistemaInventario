// frontend/src/pages/OrdenesCompra.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Container, Button, Stack, Typography, Paper, TextField } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchOrdenesCompra, deleteOrdenCompra, searchOrdenesCompra } from '../api/ordenes_compra';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [fecha, setFecha]   = useState('');
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const stoppedOnceRef = useRef(false);

  const formatRows = (res) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchOrdenesCompra();
      setOrdenes(formatRows(res));
    } catch (err) {
      console.error('Error cargando órdenes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async ({ codigo, fecha }) => {
    setLoading(true);
    try {
      const data = await searchOrdenesCompra({ codigo, fecha });
      setOrdenes(formatRows(data));
    } catch (err) {
      console.error('Error buscando órdenes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        if (!stoppedOnceRef.current) {
          stop();
          stoppedOnceRef.current = true;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce de filtros
  useEffect(() => {
    const id = setTimeout(() => {
      if (codigo || fecha) {
        handleSearch({ codigo, fecha });
      } else {
        load();
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigo, fecha]);

  const onClear = async () => {
    setCodigo('');
    setFecha('');
    await load();
  };

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Código', accessor: 'codigo' },
    { Header: 'Proveedor', accessor: 'proveedor_nombre' },
    { Header: 'Fecha', accessor: 'fecha' }, // si tienes DateField, úsalo aquí también
    { Header: 'Estado', accessor: 'estado' },
    { Header: 'Total', accessor: 'total_orden' }
  ];

  const goToNuevo = () => { start(); nav('/ordenes_compra/nuevo'); };
  const goToVer   = (id) => { start(); nav(`/ordenes_compra/detalle/${id}`); };
  const goToEdit  = (id) => { start(); nav(`/ordenes_compra/editar/${id}`); };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Órdenes de Compra</Typography>
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
          onDelete={async row => {
            if (!window.confirm('¿Eliminar esta orden?')) return;
            setLoading(true);
            try {
              await deleteOrdenCompra(row.id);
              await load();
            } catch (err) {
              console.error('Error eliminando orden', err);
              alert('No se pudo eliminar la orden.');
            } finally {
              setLoading(false);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
