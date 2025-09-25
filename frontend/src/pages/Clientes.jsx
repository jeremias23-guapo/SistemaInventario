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
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const loadClientes = async () => {
    setLoading(true);
    try {
      const res = await fetchClientes();
      const payload = res?.data ?? res ?? [];
      setClientes(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error cargando clientes', err);
      showToast({ message: 'Error cargando clientes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadClientes();
      } finally {
        stop(); // apaga overlay al terminar
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navegación con overlay
  const goToNuevo = () => {
    start();
    nav('/clientes/nuevo');
  };

  const goToEditar = (id) => {
    start();
    nav(`/clientes/editar/${id}`);
  };

  // Eliminar con confirm, overlay y recarga
  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      content: `¿Eliminar el cliente "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start();
    try {
      await deleteCliente(row.id);
      showToast({ message: 'Cliente eliminado', severity: 'success' });
      await loadClientes();
    } catch (err) {
      console.error('Error eliminando cliente', err);
      showToast({ message: 'No se pudo eliminar el cliente', severity: 'error' });
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
