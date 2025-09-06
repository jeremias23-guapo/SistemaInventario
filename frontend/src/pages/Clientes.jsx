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
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading(); // 👈

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

  // Carga inicial: apaga el overlay que encendió el Layout al navegar
  useEffect(() => {
    (async () => {
      try {
        await loadClientes();
      } finally {
        stop(); // 👈 apaga overlay al terminar
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegación con overlay (estos clicks no pasan por Layout)
  const goToNuevo = () => {
    start();
    nav('/clientes/nuevo');
  };

  const goToEditar = (id) => {
    start();
    nav(`/clientes/editar/${id}`);
  };

  // Eliminar con overlay y recarga
  const handleDelete = async (row) => {
    const ok = window.confirm('¿Eliminar este cliente?');
    if (!ok) return;

    start();
    try {
      await deleteCliente(row.id);
      await loadClientes();
    } catch (err) {
      console.error('Error eliminando cliente', err);
    } finally {
      stop();
    }
  };

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
        <Button variant="contained" onClick={goToNuevo}>
          Nuevo Cliente
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={clientes}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={(row) => handleDelete(row)}
        />
      </Paper>
    </Container>
  );
}
