import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Button,
  Stack,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
  Chip,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FilterAltOffRoundedIcon from '@mui/icons-material/FilterAltOffRounded';
import DataTable from '../components/DataTable';
import DateField from '../components/DateField';
import { fetchProductos, deleteProducto } from '../api/productos';
import { fetchCategoriasPadre, fetchSubcategorias } from '../api/categorias';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

export default function Productos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const nav = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { start, stop } = useLoading();

  const theme = useTheme();
  const isMobileSm = useMediaQuery(theme.breakpoints.down('sm'));
  const appBarH = isMobileSm ? 56 : 64;

  const refresh = async () => {
    setLoading(true);
    try {
      const filters = { search, categoriaId: categoria, subcategoriaId: subcategoria };
      const paging = { page: page + 1, pageSize: rowsPerPage };
      const res = await fetchProductos(filters, paging);
      const payload = res?.data;
      if (Array.isArray(payload)) {
        setData(payload);
        setTotal(payload.length);
      } else {
        setData(Array.isArray(payload?.data) ? payload.data : []);
        setTotal(Number(payload?.total ?? 0));
      }
    } catch (err) {
      showToast({ message: 'Error cargando productos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchCategoriasPadre().then(r => setCategorias(r.data)), refresh()]);
      stop();
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [search, categoria, subcategoria, page, rowsPerPage]);

  const loadSubcategorias = async (id) => {
    if (!id) return setSubcategorias([]);
    const res = await fetchSubcategorias(id);
    setSubcategorias(res.data);
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Eliminar producto',
      content: `¿Eliminar el producto "${row.nombre}"?`,
      confirmColor: 'error',
    });
    if (!ok) return;
    try {
      await deleteProducto(row.id);
      showToast({ message: 'Producto eliminado', severity: 'success' });
      await refresh();
    } catch {
      showToast({ message: 'Error al eliminar', severity: 'error' });
    }
  };

  const columns = [
    {
      Header: 'Imagen',
      width: 70,
      sticky: 'left',
      accessor: (row) =>
        row.imagen_url ? (
          <Tooltip
            title={<img src={row.imagen_url} alt={row.nombre} width={200} height={200} />}
            placement="right"
            arrow
          >
            <img
              src={row.imagen_url}
              alt={row.nombre}
              style={{
                width: 40,
                height: 40,
                objectFit: 'cover',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            />
          </Tooltip>
        ) : (
          '—'
        ),
    },
    { Header: 'Nombre', accessor: 'nombre', width: 220, sticky: 'left', stickyOffset: 70 },
    { Header: 'Precio Compra', accessor: (r) => `$${r.precio_compra}`, align: 'right', width: 120 },
    { Header: 'Precio Venta', accessor: (r) => `$${r.precio_venta}`, align: 'right', width: 120 },
    { Header: 'Stock', accessor: 'stock', align: 'right', width: 90 },
    { Header: 'Presentación', accessor: 'presentacion', width: 140 },
    {
      Header: 'Categoría',
      accessor: (r) => (
        <>
          <Chip size="small" label={r.categoria || '—'} sx={{ mr: 0.5 }} />
          <Chip size="small" variant="outlined" label={r.subcategoria || '—'} />
        </>
      ),
      width: 220,
    },
    { Header: 'Marca', accessor: (r) => r.marca || '—', width: 160 },
    { Header: 'Descripción', accessor: 'descripcion', width: 320 },
    { Header: 'Creado', accessor: (r) => <DateField value={r.created_at} />, width: 170 },
    { Header: 'Modificado', accessor: (r) => <DateField value={r.modified_at} />, width: 170 },
  ];

  return (
    <Box
      sx={{
        height: `calc(100vh - ${appBarH}px)`,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        overflow: 'hidden', // 👈 evita scroll en todo el contenido
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
        {/* ===== HEADER + FILTROS ===== */}
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 2, mb: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Productos
              </Typography>
              <Button
                variant="contained"
                onClick={() => nav('/productos/nuevo')}
                sx={{
                  position: { xs: 'fixed', md: 'static' },
                  bottom: { xs: 16, md: 'auto' },
                  right: { xs: 16, md: 'auto' },
                  zIndex: (t) => t.zIndex.appBar + 2,
                }}
              >
                Nuevo producto
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
              <TextField
                label="Buscar producto"
                fullWidth
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoria}
                  label="Categoría"
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setSubcategoria('');
                    loadSubcategorias(e.target.value);
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categorias.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth disabled={!categoria}>
                <InputLabel>Subcategoría</InputLabel>
                <Select
                  value={subcategoria}
                  label="Subcategoría"
                  onChange={(e) => setSubcategoria(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {subcategorias.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {(search || categoria || subcategoria) && (
                <Button
                  startIcon={<FilterAltOffRoundedIcon />}
                  onClick={() => {
                    setSearch('');
                    setCategoria('');
                    setSubcategoria('');
                    setSubcategorias([]);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Stack>
          </Paper>
        </Box>

        {/* ===== TABLA ===== */}
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <DataTable
            rows={data}
            columns={columns}
            loading={loading}
            onEdit={(r) => nav(`/productos/editar/${r.id}`)}
            onDelete={handleDelete}
            stickyActionsRight
            maxHeight="calc(100vh - 360px)" // 👈 ajusta según el tamaño de tus filtros
          />
          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              const next = parseInt(e.target.value, 10) || 10;
              setRowsPerPage(next);
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Filas por página"
          />
        </Paper>
      </Container>
    </Box>
  );
}
