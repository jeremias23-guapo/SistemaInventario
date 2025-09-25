// frontend/src/pages/Productos.jsx
import React, { useEffect, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import {
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
} from '@mui/material';


import DataTable from '../components/DataTable';
import DateField from '../components/DateField';
import { fetchProductos, deleteProducto } from '../api/productos';
import { fetchCategoriasPadre, fetchSubcategorias } from '../api/categorias';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
export default function Productos() {
  // data & loading
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [categorias, setCategorias] = useState([]);       // categorías padre
  const [subcategorias, setSubcategorias] = useState([]); // subcategorías hijas

  // paginación (MUI usa 0-based en 'page')
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const nav = useNavigate();
   const { showToast } = useToast();
const confirm = useConfirm();
  const { start, stop } = useLoading();

  // Refrescar lista de productos con filtros + paginación (server-side)
  const refresh = async () => {
    setLoading(true);
    try {
      const filters = { search, categoriaId: categoria, subcategoriaId: subcategoria };
      // Backend espera 1-based para 'page'
      const paging = { page: page + 1, pageSize: rowsPerPage };
      // Nota: asegúrate de que fetchProductos soporte 'paging' en query (?page=&pageSize=)
      const res = await fetchProductos(filters, paging);
      const payload = res?.data;

      // Soporta tanto respuesta antigua (array) como nueva ({ data, total })
      if (Array.isArray(payload)) {
        setData(payload);
        setTotal(payload.length); // fallback
      } else {
        setData(Array.isArray(payload?.data) ? payload.data : []);
        setTotal(Number(payload?.total ?? 0));
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
     showToast({ message: 'Error cargando productos', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Cargar solo categorías padre
  const loadCategorias = async () => {
    try {
      const res = await fetchCategoriasPadre();
      setCategorias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando categorías', err);
    showToast({ message: 'Error cargando Categorias', severity: 'error' });
    }
  };

  // Cargar subcategorías según categoría seleccionada
  const loadSubcategorias = async (categoriaId) => {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    try {
      const res = await fetchSubcategorias(categoriaId);
      setSubcategorias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando subcategorías:', err);
     showToast({ message: 'Error cargando subcategorias', severity: 'error' });
    }
  };

  // Al montar: cargar categorías y productos y luego apagar overlay
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadCategorias(), refresh()]);
      } finally {
        stop(); // apaga overlay que pudo quedar encendido
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambian filtros o paginación: recargar productos
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoria, subcategoria, page, rowsPerPage]);

  // Handlers filtros
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0); // reset paginación al cambiar filtros
  };

  const handleCategoriaChange = (e) => {
    const catId = e.target.value;
    setCategoria(catId);
    setSubcategoria('');
    setPage(0);
    loadSubcategorias(catId);
  };

  const handleSubcategoriaChange = (e) => {
    setSubcategoria(e.target.value);
    setPage(0);
  };

  // Navegación CRUD
  const goToNuevo = () => {
    start(); // muestra overlay hasta que la pantalla siguiente monte y lo apague
    nav('/productos/nuevo');
  };

  const goToEditar = (id) => {
    start();
    nav(`/productos/editar/${id}`);
  };

const handleDelete = async (row) => {
   const ok = await confirm({
     title: 'Eliminar producto',
     content: `¿Eliminar (soft-delete) el producto "${row.nombre}"?`,
     confirmText: 'Eliminar',
     cancelText: 'Cancelar',
    confirmColor: 'error',
  });
  if (!ok) return;   try {
   await deleteProducto(row.id);
    showToast({ message: 'Producto eliminado', severity: 'success' });
    const nextPage = page > 0 && data.length === 1 ? page - 1 : page;
   setPage(nextPage);
    await refresh();
  } catch (err) {
   console.error('Error eliminando producto:', err);
    showToast({ message: 'No se pudo eliminar el producto', severity: 'error' });
  }
};

  // Definición de columnas para DataTable
  const columns = [
    {
      Header: 'Imagen',
      accessor: (row) =>
        row.imagen_url ? (
          <Tooltip
            title={
              <img
                src={row.imagen_url}
                alt={row.nombre}
                style={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
            }
            arrow
            placement="right"
            interactive
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
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Descripción', accessor: 'descripcion' },
    // Mostrar precio_compra (informativo; el costo real por lote se maneja en compras)
   {
  Header: 'Precio Compra',
  accessor: (row) =>
    row.precio_compra ? `$${row.precio_compra}` : '$',
},
{
  Header: 'Precio Venta',
  accessor: (row) =>
    row.precio_venta ? `$${row.precio_venta}` : '$',
},
    { Header: 'Stock', accessor: 'stock' },
    { Header: 'Presentación', accessor: 'presentacion' },
    { Header: 'Categoría', accessor: (row) => `${row.categoria || '—'} › ${row.subcategoria || '—'}` },
    { Header: 'Marca', accessor: (row) => row.marca || '—' },
    { Header: 'Creado', accessor: (row) => <DateField value={row.created_at} /> },
    { Header: 'Modificado', accessor: (row) => <DateField value={row.modified_at} /> },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Productos</Typography>
        <Button variant="contained" onClick={goToNuevo}>
          Nuevo Producto
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Buscar Producto"
          variant="outlined"
          fullWidth
          value={search}
          onChange={handleSearchChange}
        />

        <FormControl variant="outlined" fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select value={categoria} onChange={handleCategoriaChange} label="Categoría">
            <MenuItem value="">Todas</MenuItem>
            {categorias.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl variant="outlined" fullWidth>
          <InputLabel>Subcategoría</InputLabel>
          <Select
            value={subcategoria}
            onChange={handleSubcategoriaChange}
            label="Subcategoría"
            disabled={!categoria}
          >
            <MenuItem value="">Todas</MenuItem>
            {subcategorias.map((sub) => (
              <MenuItem key={sub.id} value={sub.id}>
                {sub.nombre}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
          {/* Botón para limpiar */}
  <Button
    variant="outlined"
    color="secondary"
    onClick={() => {
      setSearch('');
      setCategoria('');
      setSubcategoria('');
      setSubcategorias([]);
    }}
  >
    Limpiar filtros
  </Button>
      </Stack>

      <Paper>
        <DataTable
          rows={data}
          columns={columns}
          loading={loading}
          onEdit={(row) => goToEditar(row.id)}
          onDelete={handleDelete}
        />

        {/* Paginación (server-side) */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            const next = parseInt(e.target.value, 10) || 10;
            setRowsPerPage(next);
            setPage(0); // reset a la primera página
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Filas por página"
        />
      </Paper>
    </Container>
  );
}
