import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchMarcas, deleteMarca } from '../api/marcas';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading(); // 👈

  // Carga todas las marcas
  const loadMarcas = async () => {
    setLoading(true);
    try {
      const res = await fetchMarcas();
      setMarcas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error al cargar marcas', err);
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
    { Header: 'Nombre', accessor: 'nombre' }
  ];

  const goToNuevo = () => {
    start();             // 👈 overlay durante la navegación
    nav('/marcas/nuevo');
  };

  const goToEditar = (id) => {
    start();             // 👈 overlay durante la navegación
    nav(`/marcas/editar/${id}`);
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Marcas</Typography>
        <Button
          variant="contained"
          onClick={goToNuevo}
        >
          Nueva Marca
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={marcas}
          columns={columns}
          loading={loading}
          onEdit={row => goToEditar(row.id)}   // 👈 con overlay
          onDelete={async row => {
            if (!window.confirm('¿Eliminar esta marca?')) return;
            // Spinner local para borrar; si prefieres overlay, puedes usar start()/stop()
            setLoading(true);
            try {
              await deleteMarca(row.id);
              await loadMarcas();
            } catch (err) {
              console.error('Error eliminando marca', err);
              alert('No se pudo eliminar la marca.');
            } finally {
              setLoading(false);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
