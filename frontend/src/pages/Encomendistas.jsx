import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { fetchEncomendistas, deleteEncomendista } from '../api/encomendistas';
import { toast } from '../utils/alerts';
import { useNavigate } from 'react-router-dom';

export default function Encomendistas() {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState('');
  const [confirmData, setConfirmData] = useState(null); // 💬 para el diálogo
  const navigate = useNavigate();

  const loadData = async (q = '') => {
    try {
      const res = await fetchEncomendistas(q);
      setData(res);
    } catch (err) {
      toast.error('Error al cargar encomendistas');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    loadData(q);
  };

  // 💬 Confirmación para eliminar
  const handleDelete = (row) => {
    setConfirmData({
      row,
      title: 'Eliminar encomendista',
      message: `¿Deseas eliminar a "${row.nombre}"?`,
    });
  };

  const handleConfirm = async () => {
    if (!confirmData) return;
    const { row } = confirmData;
    try {
      await deleteEncomendista(row.id);
      toast.ok('Encomendista eliminado correctamente');
      setData((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      toast.error('Error al eliminar encomendista');
      console.error(err);
    } finally {
      setConfirmData(null);
    }
  };

  const handleCancelDialog = () => setConfirmData(null);

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Encomendistas</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/encomendistas/nuevo')}
        >
          Nuevo
        </Button>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar por nombre o lugar"
          value={search}
          onChange={handleSearch}
        />
      </Paper>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Lugares que visita</TableCell>
                <TableCell align="center">Cantidad</TableCell>
                <TableCell align="center">Activo</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.nombre}</TableCell>

                  {/* 🔹 Mostrar lugares con día y hora */}
                  <TableCell>
                    {row.lugares && row.lugares.length > 0 ? (
                      <Stack spacing={0.5}>
                        {row.lugares.map((l, idx) => (
                          <Typography key={idx} variant="body2">
                            <strong>{l.lugar}</strong>
                            {l.dias_horarios ? ` — ${l.dias_horarios}` : ''}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin lugares
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell align="center">{row.num_lugares}</TableCell>
                  <TableCell align="center">{row.activo ? 'Sí' : 'No'}</TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/encomendistas/editar/${row.id}`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(row)}>
                        <Delete />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No se encontraron resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 💬 Diálogo de confirmación */}
      <Dialog open={!!confirmData} onClose={handleCancelDialog}>
        <DialogTitle>{confirmData?.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmData?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
