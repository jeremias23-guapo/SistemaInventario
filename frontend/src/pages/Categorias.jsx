import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
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
  InputAdornment,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  Search,
  Clear,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { fetchCategorias, deleteCategoria } from '../api/categorias';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

export default function Categorias() {
  const [data, setData] = useState([]);
  const [openMap, setOpenMap] = useState({});
  const [page, setPage] = useState(0); // 0-based para MUI
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalParents, setTotalParents] = useState(0);
  const [q, setQ] = useState('');
  const [qInput, setQInput] = useState('');
  const debounceRef = useRef(null);

  const nav = useNavigate();
  const { start, stop } = useLoading();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const theme = useTheme();
  const isMobileSm = useMediaQuery(theme.breakpoints.down('sm'));
  const appBarH = isMobileSm ? 56 : 64;

  // ============ Carga de datos ============
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

  // ============ Búsqueda con debounce ============
  const onChangeSearch = (e) => {
    const val = e.target.value;
    setQInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const nextQ = val.trim();
      setQ(nextQ);
      setPage(0);
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

  // ============ Derivaciones ============
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

  // ============ CRUD ============
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

      const esPadre = data.find((d) => d.id === id && d.parent_id === null);
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

  // ============ Render ============
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        overflow: 'hidden',
        height: `calc(100vh - ${appBarH}px)`,
      }}
    >
      <Container
        sx={{
          flex: 1,
          maxWidth: 'lg !important',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" component="h1" fontWeight={600}>
            Categorías
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              start();
              nav('/categorias/nuevo');
            }}
            sx={{
              position: { xs: 'fixed', md: 'static' },
              bottom: { xs: 16, md: 'auto' },
              right: { xs: 16, md: 'auto' },
              zIndex: (t) => t.zIndex.appBar + 2,
            }}
          >
            Nueva Categoría
          </Button>
        </Stack>

        {/* Búsqueda */}
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
                  <IconButton
                    aria-label="limpiar búsqueda"
                    onClick={clearSearch}
                    size="small"
                  >
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Paper>

        {/* Tabla principal */}
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell style={{ width: '50px' }} />
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
                      <TableRow hover>
                        <TableCell>
                          {hijos.length > 0 && (
                            <IconButton size="small" onClick={() => toggle(padre.id)}>
                              {isOpen ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>{padre.id}</TableCell>
                        <TableCell>{padre.nombre}</TableCell>
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
                          <IconButton
                            aria-label="eliminar"
                            onClick={() => handleBorrar(padre.id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Subcategorías */}
                      {isOpen &&
                        hijos.map((hijo) => (
                          <TableRow key={hijo.id} hover>
                            <TableCell />
                            <TableCell>{hijo.id}</TableCell>
                            <TableCell sx={{ pl: 5 }}>– {hijo.nombre}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  start();
                                  nav(`/categorias/editar/${hijo.id}`);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
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
          </Box>

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
    </Box>
  );
}
