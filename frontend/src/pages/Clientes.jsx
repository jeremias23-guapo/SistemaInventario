// frontend/src/pages/Clientes.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Stack,
  Typography,
  Paper
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchClientes, deleteCliente } from '../api/clientes';
import { useNavigate } from 'react-router-dom';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const loadClientes = async () => {
    setLoading(true);
    try {
      const data = await fetchClientes();
      setClientes(data);
    } catch (err) {
      console.error('Error cargando clientes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Contacto', accessor: 'contacto' },
    { Header: 'Email', accessor: 'email' },
    { Header: 'Dirección', accessor: 'direccion' }
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Clientes</Typography>
        <Button
          variant="contained"
          onClick={() => nav('/clientes/nuevo')}
        >
          Nuevo Cliente
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={clientes}
          columns={columns}
          loading={loading}
          onEdit={row => nav(`/clientes/editar/${row.id}`)}
          onDelete={row => {
            if (window.confirm('¿Eliminar este cliente?')) {
              deleteCliente(row.id).then(loadClientes);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
