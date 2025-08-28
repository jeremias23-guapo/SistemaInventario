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
  InputLabel
} from '@mui/material';
import DataTable from '../components/DataTable';
import { fetchProductos } from '../api/productos';
import { fetchCategoriasPadre, fetchSubcategorias } from '../api/categorias';
import { useNavigate } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext'; // 👈 agregado

export default function Productos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [categorias, setCategorias] = useState([]);      // categorías padre
  const [subcategorias, setSubcategorias] = useState([]); // subcategorías hijas
  const nav = useNavigate();

  const { start, stop } = useLoading(); // 👈 overlay global

  // Refrescar lista de productos
  const refresh = async () => {
    setLoading(true);
    try {
      const filters = { search, categoriaId: categoria, subcategoriaId: subcategoria };
      const res = await fetchProductos(filters);
      setData(res.data);
    } catch (err) {
      console.error('Error cargando productos:', err);
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
      console.error('Error cargando categorías padre:', err);
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
    }
  };

  // Al montar: cargar categorías y productos y luego apagar overlay
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadCategorias(), refresh()]);
      } finally {
        stop(); // 👈 apagamos overlay al terminar carga inicial
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambian filtros: recargar productos (solo spinner local)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoria, subcategoria]);

  const handleSearchChange = e => setSearch(e.target.value);

  const handleCategoriaChange = e => {
    const catId = e.target.value;
    setCategoria(catId);
    setSubcategoria('');
    loadSubcategorias(catId);
  };

  const handleSubcategoriaChange = e => setSubcategoria(e.target.value);

  // 👇 Navegar mostrando overlay
  const goToNuevo = () => {
    start();
    nav('/productos/nuevo');
  };
  const goToEditar = (id) => {
    start();
    nav(`/productos/editar/${id}`);
  };

  const columns = [
    {
      Header: 'Imagen',
      accessor: row =>
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
        ) : '—'
    },
    { Header: 'Nombre', accessor: 'nombre' },
    { Header: 'Descripción', accessor: 'descripcion' },
    { Header: 'Precio Compra', accessor: 'precio_compra' },
    { Header: 'Precio Venta', accessor: 'precio_venta' },
    { Header: 'Stock', accessor: 'stock' },
    { Header: 'Presentación', accessor: 'presentacion' },
    { Header: 'Activo', accessor: row => (row.activo ? 'Sí' : 'No') },
    { Header: 'Categoría', accessor: row => `${row.categoria} › ${row.subcategoria}` },
    { Header: 'Marca', accessor: row => row.marca || '—' },
    { Header: 'Creado', accessor: row => new Date(row.created_at).toLocaleString() },
    { Header: 'Modificado', accessor: row => new Date(row.modified_at).toLocaleString() },
    { Header: 'Eliminado', accessor: row => (row.is_deleted ? 'Sí' : 'No') }
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
            {categorias.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
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
            {subcategorias.map(sub => (
              <MenuItem key={sub.id} value={sub.id}>{sub.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Paper>
        <DataTable
          rows={data}
          columns={columns}
          loading={loading}
          onEdit={row => goToEditar(row.id)}  // 👈 con overlay
          onDelete={row => {/* lógica de eliminar */}}
        />
      </Paper>
    </Container>
  );
}
