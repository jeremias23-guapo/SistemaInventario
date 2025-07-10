// frontend/src/pages/Transacciones.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Stack
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchHistorial } from '../api/transacciones';
import { useNavigate } from 'react-router-dom';

export default function Transacciones() {
  const [txs, setTxs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // Cargar todo el historial de transacciones al montar
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHistorial();
      setTxs(data);
    } catch (err) {
      console.error('Error cargando historial', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Columnas de solo lectura (sin botones de acción)
  const columns = [
    { Header: 'ID TX',           accessor: 'id_transaccion' },
    { Header: 'Producto',        accessor: 'producto_nombre' },
    { Header: 'Código Orden',    accessor: 'orden_codigo' },
    { Header: 'Tipo',            accessor: 'tipo_transaccion' },
    { Header: 'Precio',          accessor: 'precio_transaccion' },
    { Header: 'Cantidad',        accessor: 'cantidad_transaccion' },
    { Header: 'Fecha',           accessor: 'fecha_transaccion' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Historial de Transacciones</Typography>
        {/* Ya no mostramos botón de “Nueva Transacción” */}
      </Stack>
      <Paper>
        <DataTable
          rows={txs}
          columns={columns}
          loading={loading}
          // Sin acciones onEdit ni onDelete:
        />
      </Paper>
    </Container>
  );
}
