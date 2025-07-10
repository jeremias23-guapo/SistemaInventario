import React, { useEffect, useState } from 'react';
import {
  Container, Button, Stack, Typography, Paper
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchOrdenesCompra, deleteOrdenCompra } from '../api/ordenes_compra';
import { useNavigate } from 'react-router-dom';

export default function OrdenesCompra() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setOrdenes(await fetchOrdenesCompra());
    } catch (err) {
      console.error('Error cargando órdenes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Código', accessor: 'codigo' },
    { Header: 'Proveedor', accessor: 'proveedor_nombre' },
    { Header: 'Fecha', accessor: 'fecha' },
    { Header: 'Estado', accessor: 'estado' },
    { Header: 'Total', accessor: 'total_orden' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Órdenes de Compra</Typography>
        <Button variant="contained" onClick={() => nav('/ordenes_compra/nuevo')}>
          Nueva Orden
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={ordenes}
          columns={columns}
          loading={loading}
          onView={row => nav(`/ordenes_compra/detalle/${row.id}`)}
          onEdit={row => nav(`/ordenes_compra/editar/${row.id}`)}
          onDelete={row => {
            if (window.confirm('¿Eliminar esta orden?')) {
              deleteOrdenCompra(row.id).then(load);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
