// frontend/src/pages/Marcas.jsx
import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchMarcas, deleteMarca } from '../api/marcas';
import { useNavigate } from 'react-router-dom';

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // Carga todas las marcas
  const loadMarcas = async () => {
    setLoading(true);
    try {
      const res = await fetchMarcas();
      setMarcas(res.data);
    } catch (err) {
      console.error('Error al cargar marcas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarcas();
  }, []);

  const columns = [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' }
  ];

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
          onClick={() => nav('/marcas/nuevo')}
        >
          Nueva Marca
        </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={marcas}
          columns={columns}
          loading={loading}
          onEdit={row => nav(`/marcas/editar/${row.id}`)}
          onDelete={row => {
            if (window.confirm('¿Eliminar esta marca?')) {
              deleteMarca(row.id).then(loadMarcas);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
