// frontend/src/pages/Categorias.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  Paper,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import { ExpandMore, ExpandLess, Edit, Delete, Search, Clear } from '@mui/icons-material';
import { fetchCategorias, deleteCategoria } from '../api/categorias';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

export default function Categorias() {
  const [data, setData] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [page, setPage] = useState(0);           // 0-based para MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalParents, setTotalParents] = useState(0);
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const debounceRef = useRef(null);

  const nav = useNavigate();
  const { start, stop } = useLoading();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const refresh = async (p = page, l = rowsPerPage, query = q) => {
    try {
      const params = { page: p + 1, limit: l };
      if (query && query.trim()) params.q = query.trim();
      const res = await fetchCategorias(params);
      const arr = Array.isArray(res?.data) ? res.data : [];
      setData(arr);

      const totalHdr = res?.headers?.['x-total-count'];
      if (totalHdr !== undefined) setTotalParents(Number(totalHdr) || 0);
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
      showToast({ message: 'Error al cargar categorías', severity: 'error' });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        stop();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce del input de búsqueda
  const onChangeSearch = (e) => {
    const val = e.target.value;
    setQInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const nextQ = val.trim();
      setQ(nextQ);
      setPage(0);               // reset paginado al buscar
      start();
      try {
        await refresh(0, rowsPerPage, nextQ);
      } finally {
        stop();
      }
    }, 350);
  };

  const clearSearch = async () => {
    setQ('');
    setQInput('');
    setPage(0);
    start();
    try {
      await refresh(0, rowsPerPage, '');
    } finally {
      stop();
    }
  };

  // Filtramos padres e hijos (el backend ya devuelve página de padres + hijos relevantes)
  const padres = useMemo(() => data.filter((c) => c.parent_id === null), [data]);

  const hijosByParent = useMemo(() => {
    const map = {};
    for (const c of data) {
      if (c.parent_id != null) {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c);
      }
    }
    return map;
  }, [data]);

  const toggle = (id) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBorrar = async (id) => {
    const ok = await confirm({
      title: 'Eliminar categoría',
      content:
        '¿Seguro que quieres eliminar esta categoría? Los productos asociados podrían quedar sin categoría.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    start();
    try {
      await deleteCategoria(id);
      showToast({ message: 'Categoría eliminada', severity: 'success' });

      const esPadre = data.find(d => d.id === id && d.parent_id === null);
      const newTotalParents = Math.max(totalParents - (esPadre ? 1 : 0), 0);
      const maxPageIdx = Math.max(Math.ceil(newTotalParents / rowsPerPage) - 1, 0);
      const nextPage = Math.min(page, maxPageIdx);
      setPage(nextPage);
      await refresh(nextPage, rowsPerPage);
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      showToast({ message: 'No se pudo eliminar la categoría', severity: 'error' });
    } finally {
      stop();
    }
  };

  const handleChangePage = async (_, newPage) => {
    setPage(newPage);
    start();
    try {
      await refresh(newPage, rowsPerPage);
    } finally {
      stop();
    }
  };

  const handleChangeRowsPerPage = async (e) => {
    const newRows = parseInt(e.target.value, 10);
    setRowsPerPage(newRows);
    setPage(0);
    start();
    try {
      await refresh(0, newRows);
    } finally {
      stop();
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h1">
          Categorías
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            start();
            nav('/categorias/nuevo');
          }}
        >
          Nueva Categoría
        </Button>
      </Stack>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre de categoría o subcategoría…"
          value={qInput}
          onChange={onChangeSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: qInput ? (
              <InputAdornment position="end">
                <IconButton aria-label="limpiar búsqueda" onClick={clearSearch} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
        />
      </Paper>

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
            {padres.map((padre) => {
              const hijos = hijosByParent[padre.id] || [];
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
                    <TableCell component="th" scope="row">
                      {padre.nombre}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label="editar"
                        onClick={() => {
                          start();
                          nav(`/categorias/editar/${padre.id}`);
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton aria-label="eliminar" onClick={() => handleBorrar(padre.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Filas de los Hijos (cuando se expande) */}
                  {isOpen &&
                    hijos.map((hijo) => (
                      <TableRow key={hijo.id}>
                        <TableCell />
                        <TableCell>{hijo.id}</TableCell>
                        <TableCell component="th" scope="row" sx={{ pl: 5 }}>
                          − {hijo.nombre}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label="editar subcategoría"
                            onClick={() => {
                              start();
                              nav(`/categorias/editar/${hijo.id}`);
                            }}
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

        <TablePagination
          component="div"
          count={totalParents}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Padres por página"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
          }
        />
      </Paper>
    </Container>
  );
}
