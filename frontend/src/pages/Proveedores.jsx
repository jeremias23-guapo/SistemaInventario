// frontend/src/pages/Proveedores.jsx
import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchProveedores, deleteProveedor } from '../api/proveedores';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Carga todos los proveedores
  const loadProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetchProveedores();
      const payload = res?.data ?? res ?? [];
      setProveedores(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error al cargar proveedores', err);
      showToast({ message: 'Error al cargar proveedores', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadProveedores();
      } finally {
        // Apaga overlay global al terminar la carga inicial
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Contacto', accessor: 'contacto' },
  ];

  const goToNuevo = () => {
    start();
    nav('/proveedores/nuevo');
  };
  const goToEditar = (id) => {
    start();
    nav(`/proveedores/editar/${id}`);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar proveedor',
      content: `¿Eliminar el proveedor "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start(); // overlay durante la operación
    try {
      await deleteProveedor(row.id);
      showToast({ message: 'Proveedor eliminado', severity: 'success' });
      await loadProveedores();
    } catch (err) {
      console.error('Error al eliminar proveedor', err);
      showToast({ message: 'No se pudo eliminar el proveedor', severity: 'error' });
    } finally {
      stop();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Proveedores</Typography>
        <Button variant="contained" onClick={goToNuevo}>
          Nuevo Proveedor
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={proveedores}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={handleDelete}
        />
      </Paper>
    </Container>
  );
}
