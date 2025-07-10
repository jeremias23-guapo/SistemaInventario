import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchProveedores, deleteProveedor } from '../api/proveedores';
import { useNavigate } from 'react-router-dom';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // Carga todas los proveedores
  const loadProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetchProveedores();
      setProveedores(res.data);
    } catch (err) {
      console.error('Error al cargar proveedores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Contacto', accessor: 'contacto' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Proveedores</Typography>
        <Button
          variant="contained"
          onClick={() => nav('/proveedores/nuevo')}
        >
          Nuevo Proveedor
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={proveedores}
          columns={columns}
          loading={loading}
          onEdit={row => nav(`/proveedores/editar/${row.id}`)}
          onDelete={row => {
            if (window.confirm('¿Eliminar este proveedor?')) {
              deleteProveedor(row.id).then(loadProveedores);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
