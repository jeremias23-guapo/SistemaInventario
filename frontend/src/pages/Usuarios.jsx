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

export default function Usuarios() {
  const { user } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const data = await listUsuarios();
        setUsuarios(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsuarios();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Usuarios</Typography>
        {user?.rol === 1 && (
          <Button
            component={RouterLink}
            to="/usuarios/nuevo"
            variant="contained"
            color="primary"
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
