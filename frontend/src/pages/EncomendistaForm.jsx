import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Stack, TextField, Button, Typography,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchEncomendista,
  createEncomendista,
  updateEncomendista
} from '../api/encomendistas';
import { toast } from '../utils/alerts';

export default function EncomendistaForm() {
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(1);
  const [lugares, setLugares] = useState([{ lugar: '', dias_horarios: '' }]);
  const [confirmData, setConfirmData] = useState(null); // 💬 diálogo confirmación
  const { id } = useParams();
  const navigate = useNavigate();
  const editMode = Boolean(id);

  useEffect(() => {
    if (editMode) {
      (async () => {
        try {
          const data = await fetchEncomendista(id);
          setNombre(data.nombre);
          setActivo(data.activo);
          setLugares(data.lugares?.length ? data.lugares : [{ lugar: '', dias_horarios: '' }]);
        } catch {
          toast.error('Error al cargar el encomendista');
        }
      })();
    }
  }, [id, editMode]);

  const handleLugarChange = (i, field, value) => {
    const copy = [...lugares];
    copy[i][field] = value;
    setLugares(copy);
  };

  const addLugar = () => setLugares([...lugares, { lugar: '', dias_horarios: '' }]);
  const removeLugar = (i) => setLugares(lugares.filter((_, idx) => idx !== i));

  const handleSubmit = () => {
    if (!nombre.trim()) return toast.error('Debe ingresar un nombre');

    setConfirmData({
      title: editMode ? 'Confirmar actualización' : 'Confirmar creación',
      message: editMode
        ? `¿Deseas actualizar el encomendista "${nombre}"?`
        : `¿Deseas crear el encomendista "${nombre}"?`,
      action: async () => {
        const payload = { nombre, activo, lugares };

        try {
          if (editMode) {
            await updateEncomendista(id, payload);
            toast.ok('Encomendista actualizado correctamente');
          } else {
            await createEncomendista(payload);
            toast.ok('Encomendista creado correctamente');
          }
          navigate('/encomendistas');
        } catch {
          toast.error('Error al guardar los datos');
        }
      },
    });
  };

  const handleConfirm = async () => {
    if (confirmData?.action) await confirmData.action();
    setConfirmData(null);
  };

  const handleCancelDialog = () => setConfirmData(null);

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        {editMode ? 'Editar Encomendista' : 'Nuevo Encomendista'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <Typography variant="subtitle1">Lugares y Horarios</Typography>
          {lugares.map((l, i) => (
            <Stack direction="row" spacing={1} key={i}>
              <TextField
                label="Lugar"
                value={l.lugar}
                onChange={(e) => handleLugarChange(i, 'lugar', e.target.value)}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Día y hora"
                value={l.dias_horarios}
                onChange={(e) => handleLugarChange(i, 'dias_horarios', e.target.value)}
                sx={{ flex: 1 }}
              />
              <IconButton color="error" onClick={() => removeLugar(i)}>
                <Delete />
              </IconButton>
            </Stack>
          ))}

          <Button startIcon={<Add />} onClick={addLugar}>
            Agregar lugar
          </Button>

          <Stack direction="row" spacing={2}>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              {editMode ? 'Actualizar' : 'Guardar'}
            </Button>
            <Button variant="outlined" onClick={() => navigate('/encomendistas')}>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* 💬 Diálogo de confirmación */}
      <Dialog open={!!confirmData} onClose={handleCancelDialog}>
        <DialogTitle>{confirmData?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmData?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
