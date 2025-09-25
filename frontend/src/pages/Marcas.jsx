// frontend/src/pages/Marcas.jsx
import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchMarcas, deleteMarca } from '../api/marcas';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  // Carga todas las marcas
  const loadMarcas = async () => {
    setLoading(true);
    try {
      const res = await fetchMarcas();
      const payload = res?.data ?? res ?? [];
      setMarcas(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error al cargar marcas', err);
      showToast({ message: 'Error al cargar marcas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadMarcas();
      } finally {
        // Apagamos overlay global al terminar la carga inicial
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
  ];

  const goToNuevo = () => {
    start();
    nav('/marcas/nuevo');
  };

  const goToEditar = (id) => {
    start();
    nav(`/marcas/editar/${id}`);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar marca',
      content: `¿Eliminar la marca "${row.nombre}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start(); // overlay durante la operación
    try {
      await deleteMarca(row.id);
      showToast({ message: 'Marca eliminada', severity: 'success' });
      await loadMarcas();
    } catch (err) {
      console.error('Error eliminando marca', err);
      showToast({ message: 'No se pudo eliminar la marca', severity: 'error' });
    } finally {
      stop();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Marcas</Typography>
        <Button variant="contained" onClick={goToNuevo}>
          Nueva Marca
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={marcas}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={handleDelete}
        />
      </Paper>
    </Container>
  );
}
