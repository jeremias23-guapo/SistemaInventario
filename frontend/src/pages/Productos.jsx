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
import { fetchCategoriasPadre } from '../api/categorias';  // ← Importa el nuevo método
import { useNavigate } from 'react-router-dom';

export default function Productos() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [categorias, setCategorias] = useState([]);      // categorías padre
  const [subcategorias, setSubcategorias] = useState([]); // subcategorías hijas
  const nav = useNavigate();

  // 1) Refrescar productos con filtros
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

  // 2) Cargar solo categorías padre
  const loadCategorias = async () => {
    try {
      const res = await fetchCategoriasPadre();
      setCategorias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando categorías padre:', err);
    }
  };

  // 3) Cargar subcategorías según categoría seleccionada
  const loadSubcategorias = async (categoriaId) => {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3001/api/categorias/${categoriaId}/subcategorias`
      );
      const data = await response.json();
      setSubcategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando subcategorías:', err);
    }
  };

  // Efecto: recarga productos y categorías padre al montar y cuando cambien filtros
  useEffect(() => {
    loadCategorias();
    refresh();
  }, []);

  // Efecto: cada vez que cambie categoría o subcategoría, refresca productos
  useEffect(() => {
    refresh();
  }, [search, categoria, subcategoria]);

  const handleSearchChange = e => setSearch(e.target.value);

  const handleCategoriaChange = e => {
    const catId = e.target.value;
    setCategoria(catId);
    setSubcategoria('');
    loadSubcategorias(catId);
  };

  const handleSubcategoriaChange = e => setSubcategoria(e.target.value);

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
    ) : (
      '—'
    )
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
        <Button variant="contained" onClick={() => nav('/productos/nuevo')}>
          Nuevo Producto
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} mb={2}>
        {/* Búsqueda */}
        <TextField
          label="Buscar Producto"
          variant="outlined"
          fullWidth
          value={search}
          onChange={handleSearchChange}
        />

        {/* Filtro Categoría (solo padres) */}
        <FormControl variant="outlined" fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select value={categoria} onChange={handleCategoriaChange} label="Categoría">
            <MenuItem value="">Todas</MenuItem>
            {categorias.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Filtro Subcategoría */}
        <FormControl variant="outlined" fullWidth>
          <InputLabel>Subcategoría</InputLabel>
          <Select
            value={subcategoria}
            onChange={handleSubcategoriaChange}
            label="Subcategoría"
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
          onEdit={row => nav(`/productos/editar/${row.id}`)}
          onDelete={row => {/* lógica de eliminar */}}
        />
      </Paper>
    </Container>
  );
}
