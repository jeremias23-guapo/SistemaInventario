// frontend/src/pages/Transacciones.jsx
import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Stack } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchHistorial } from '../api/transacciones';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global
import DateField from '../components/DateField';
export default function Transacciones() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { stop } = useLoading(); // no navegamos desde acá, solo apagamos overlay al montar

  // Cargar historial al montar
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchHistorial();
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setTxs(data);
    } catch (err) {
      console.error('Error cargando historial', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        // Apagar overlay global al terminar la carga inicial
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Columnas de solo lectura
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
        {/* Sin botón de “Nueva Transacción” */}
      </Stack>
      <Paper>
        <DataTable
          rows={txs}
          columns={columns}
          loading={loading}
        />
      </Paper>
    </Container>
  );
}
