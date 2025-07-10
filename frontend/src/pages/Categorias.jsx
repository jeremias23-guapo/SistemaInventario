// frontend/src/pages/Categorias.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Button,
  Stack,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Delete
} from '@mui/icons-material';
import { fetchCategorias, deleteCategoria } from '../api/categorias'; // Asegúrate que la ruta a tu API sea correcta
import { useNavigate } from 'react-router-dom';

export default function Categorias() {
  const [data, setData] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const nav = useNavigate();

  // Carga o refresca la lista de categorías desde el servidor
  const refresh = async () => {
    try {
      const res = await fetchCategorias();
      setData(res.data);
    } catch (error) {
      console.error("Error al cargar las categorías:", error);
      // Aquí podrías mostrar una notificación al usuario
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Alterna el estado (abierto/cerrado) de una categoría padre
  const toggle = id => {
    setOpenMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Lógica para eliminar una categoría
  const handleBorrar = id => {
    if (window.confirm('¿Seguro que quieres eliminar esta categoría? Al hacerlo, los productos asociados podrían quedar sin categoría.')) {
      deleteCategoria(id).then(() => {
        refresh(); // Vuelve a cargar los datos para reflejar el cambio
      }).catch(error => {
        console.error("Error al eliminar la categoría:", error);
        // Notificar al usuario sobre el error
      });
    }
  };

  // Filtra solo las categorías que no tienen padre para iniciar el renderizado
  const padres = data.filter(c => c.parent_id === null);

  return (
    <Container sx={{ mt: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" component="h1">
          Categorías
        </Typography>
        <Button variant="contained" onClick={() => nav('/categorias/nuevo')}>
          Nueva Categoría
        </Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '50px' }} aria-label="expand" />
              <TableCell style={{ width: '100px' }}>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {padres.map(padre => {
              const hijos = data.filter(c => c.parent_id === padre.id);
              const isOpen = Boolean(openMap[padre.id]);

              return (
                <React.Fragment key={padre.id}>
                  {/* Fila del Padre */}
                  <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>
                      {hijos.length > 0 && (
                        <IconButton size="small" onClick={() => toggle(padre.id)}>
                          {isOpen ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      )}
                    </TableCell>
                    <TableCell>{padre.id}</TableCell>
                    <TableCell component="th" scope="row">{padre.nombre}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="editar"
                        onClick={() => nav(`/categorias/editar/${padre.id}`)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        aria-label="eliminar"
                        onClick={() => handleBorrar(padre.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Filas de los Hijos (con indentación) */}
                  {isOpen && hijos.map(hijo => (
                    <TableRow key={hijo.id}>
                      <TableCell /> {/* Celda vacía para alinear con el padre */}
                      <TableCell>{hijo.id}</TableCell>
                      <TableCell component="th" scope="row" sx={{ pl: 5 }}> {/* Indentación */}
                        - {hijo.nombre}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          aria-label="editar subcategoría"
                          onClick={() => nav(`/categorias/editar/${hijo.id}`)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="eliminar subcategoría"
                          onClick={() => handleBorrar(hijo.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}