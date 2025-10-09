// frontend/src/pages/Transacciones.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Paper, Stack, Button } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchHistorialPage } from '../api/transacciones';
import { useLoading } from '../contexts/LoadingContext';
import DateField from '../components/DateField';

export default function Transacciones() {
  const [rows, setRows] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const { stop } = useLoading();

  const loadPage = useCallback(async (cursor = null) => {
    setLoading(true);
    try {
      const { items, nextCursor: nc, hasMore: hm } = await fetchHistorialPage({ limit: 50, cursor });
      setRows(prev => (cursor ? [...prev, ...items] : items));
      setNextCursor(nc || null);
      setHasMore(Boolean(hm));
    } catch (err) {
      console.error('Error cargando historial', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try { await loadPage(null); } finally { stop(); }
    })();
  }, [loadPage, stop]);

  const columns = [
    { Header: 'ID TX',        accessor: 'id_transaccion' },
    { Header: 'Producto',     accessor: 'producto_nombre' },
    { Header: 'Código Orden', accessor: 'orden_codigo' },
    { Header: 'Tipo',         accessor: 'tipo_transaccion' },
    { Header: 'Precio',       accessor: 'precio_transaccion' },
    { Header: 'Cantidad',     accessor: 'cantidad_transaccion' },
    {
      Header: 'Fecha',
      accessor: row => <DateField value={row.fecha_transaccion} />
    }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Historial de Transacciones</Typography>
      </Stack>
      <Paper>
        <DataTable rows={rows} columns={columns} loading={loading} />
        <Stack direction="row" justifyContent="center" p={2}>
          <Button
            variant="contained"
            disabled={loading || !hasMore}
            onClick={() => loadPage(nextCursor)}
          >
            {hasMore ? (loading ? 'Cargando…' : 'Cargar más') : 'No hay más'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
