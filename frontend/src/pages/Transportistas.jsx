// src/pages/Transportistas.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Container, Paper, Stack, Button, TextField, Typography } from '@mui/material';
import DataTable from '../components/DataTable';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import {
  fetchTransportistas,
  createTransportista,
  updateTransportista,
  deleteTransportista
} from '../api/transportistas';
import TransportistaForm from './TransportistaForm';
import ReglasDialog from '../components/ReglasDialog';

export default function Transportistas() {
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openReglas, setOpenReglas] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchTransportistas();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando transportistas', err);
      showToast({ message: 'Error cargando transportistas', severity: 'error' });
    } finally {
      setLoading(false);
      stop(); // apaga overlay al terminar la carga inicial o recargas manuales
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => rows.filter(r => r.nombre?.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const columns = useMemo(() => [
    { Header: 'ID', accessor: 'id' },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Activo', accessor: r => (r.activo ? 'Sí' : 'No') },
  ], []);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Transportistas</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            label="Buscar por nombre"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            Nuevo Transportista
          </Button>
        </Stack>
      </Paper>

      <Paper>
        <DataTable
          rows={filtered}
          columns={columns}
          loading={loading}
          onView={row => { setSelected(row); setOpenReglas(true); }}
          onEdit={row => { setEditing(row); setOpenForm(true); }}
          onDelete={async row => {
            const ok = await confirm({
              title: 'Eliminar transportista',
              content: `¿Eliminar el transportista "${row.nombre}"?`,
              confirmText: 'Eliminar',
              cancelText: 'Cancelar',
              confirmColor: 'error',
            });
            if (!ok) return;

            start();
            try {
              await deleteTransportista(row.id);
              showToast({ message: 'Transportista eliminado', severity: 'success' });
              await load();
            } catch (err) {
              console.error('Error eliminando transportista', err);
              showToast({ message: 'No se pudo eliminar el transportista', severity: 'error' });
              stop();
            }
          }}
          // Mapea "Ver" como "Reglas"
          viewLabel="Reglas"
        />
      </Paper>

      <TransportistaForm
        open={openForm}
        initial={editing}
        onClose={() => setOpenForm(false)}
        onSave={async (payload) => {
          // Confirmar solo si es edición
          if (editing) {
            const ok = await confirm({
              title: 'Actualizar transportista',
              content: '¿Deseas actualizar este transportista?',
              confirmText: 'Sí, actualizar',
              cancelText: 'Cancelar',
              confirmColor: 'warning',
            });
            if (!ok) return;
          }

          start();
          try {
            if (editing) {
              await updateTransportista(editing.id, payload);
              showToast({ message: 'Transportista actualizado', severity: 'success' });
            } else {
              await createTransportista(payload);
              showToast({ message: 'Transportista creado', severity: 'success' });
            }
            setOpenForm(false);
            await load();
          } catch (err) {
            console.error('Error guardando transportista', err);
            showToast({ message: 'Error guardando transportista', severity: 'error' });
            stop();
          }
        }}
      />

      <ReglasDialog
        open={openReglas}
        transportista={selected}
        onClose={() => setOpenReglas(false)}
      />
    </Container>
  );
}
