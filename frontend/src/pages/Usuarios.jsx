// src/pages/Usuarios.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { listUsuarios } from '../api/usuarios';
import { AuthContext } from '../contexts/AuthContext';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function Usuarios() {
  const { user } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const { start, stop } = useLoading(); // 👈

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const res  = await listUsuarios();
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setUsuarios(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
        stop(); // 👈 apaga overlay global al terminar la carga inicial
      }
    }
    fetchUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Usuarios</Typography>
        {user?.rol_id === 1 && (
          <Button
            component={RouterLink}
            to="/usuarios/nuevo"
            variant="contained"
            color="primary"
            onClick={() => start()} // 👈 overlay durante la navegación
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuarios.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.nombre}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.rol}</TableCell>
                  <TableCell align="right">
                    <Button
                      component={RouterLink}
                      to={`/usuarios/editar/${u.id}`}
                      size="small"
                      onClick={() => start()} // 👈 overlay durante la navegación
                    >
                      Editar
                    </Button>
                    {/* Aquí podrías añadir un botón de eliminar */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
