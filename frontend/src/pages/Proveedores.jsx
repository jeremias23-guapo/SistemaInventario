import React, { useEffect, useState } from 'react';
import { Container, Button, Stack, Typography, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchProveedores, deleteProveedor } from '../api/proveedores';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const { start, stop } = useLoading(); // 👈

  // Carga todos los proveedores
  const loadProveedores = async () => {
    setLoading(true);
    try {
      const res = await fetchProveedores();
      setProveedores(Array.isArray(res?.data) ? res.data : (res ?? []));
    } catch (err) {
      console.error('Error al cargar proveedores', err);
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
    { Header: 'Contacto', accessor: 'contacto' }
  ];

  const goToNuevo = () => { start(); nav('/proveedores/nuevo'); };
  const goToEditar = (id) => { start(); nav(`/proveedores/editar/${id}`); };

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
          onEdit={row => goToEditar(row.id)}  // 👈 con overlay
          onDelete={async row => {
            if (!window.confirm('¿Eliminar este proveedor?')) return;
            setLoading(true); // spinner local en la tabla
            try {
              await deleteProveedor(row.id);
              await loadProveedores();
            } catch (err) {
              console.error('Error al eliminar proveedor', err);
              alert('No se pudo eliminar el proveedor.');
            } finally {
              setLoading(false);
            }
          }}
        />
      </Paper>
    </Container>
  );
}
