// frontend/src/pages/VentaDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVenta } from '../api/ventas';
import { fetchProductos } from '../api/productos';

export default function VentaDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [venta, setVenta] = useState(null);
  const [productosMap, setProductosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1) Cargar catálogo de productos para mostrar nombre
  useEffect(() => {
    fetchProductos()
      .then(r => {
        // r.data es un array [{ id, nombre, ... }, ...]
        const map = {};
        (r.data || []).forEach(p => {
          map[p.id] = p.nombre;
        });
        setProductosMap(map);
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        // Si falla, seguiremos mostrando el ID en lugar del nombre
      });
  }, []);

  // 2) Cargar la venta completa (cabecera + lineas)
  useEffect(() => {
    setLoading(true);
    fetchVenta(id)
      .then(r => {
        setVenta(r);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando venta:', err);
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={() => nav('/ventas')} sx={{ mt: 2 }} variant="contained">
          Volver a Ventas
        </Button>
      </Container>
    );
  }

  if (!venta) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>No se encontró la venta.</Typography>
        <Button onClick={() => nav('/ventas')} sx={{ mt: 2 }} variant="contained">
          Volver a Ventas
        </Button>
      </Container>
    );
  }

  // Formato de fecha (ajusta a tu preferencia)
  const formatoFecha = fechaStr => {
    const fechaObj = new Date(fechaStr);
    return fechaObj.toLocaleString();
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Button onClick={() => nav('/ventas')} variant="outlined" sx={{ mb: 2 }}>
        ← Volver a Lista de Ventas
      </Button>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Detalle de Venta #{venta.id}
        </Typography>
        <Grid container spacing={2}>
          {/* Código */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Código:</Typography>
            <Typography>{venta.codigo}</Typography>
          </Grid>
          {/* Cliente */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Cliente:</Typography>
            <Typography>{venta.cliente_nombre}</Typography>
          </Grid>
          {/* Fecha */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Fecha:</Typography>
            <Typography>{formatoFecha(venta.fecha)}</Typography>
          </Grid>
          {/* Estado */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Estado:</Typography>
            <Typography>{venta.estado}</Typography>
          </Grid>
          {/* Total Venta */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Total:</Typography>
            <Typography>$ {Number(venta.total_venta).toFixed(2)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Typography variant="h6" sx={{ p: 2 }}>
          Líneas de Detalle
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
  <TableRow>
    <TableCell><strong>ID</strong></TableCell>
    <TableCell><strong>Imagen</strong></TableCell>
    <TableCell><strong>Producto</strong></TableCell>
    <TableCell align="right"><strong>Cantidad</strong></TableCell>
    <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
    <TableCell align="right"><strong>Descuento</strong></TableCell>
    <TableCell align="right"><strong>Subtotal</strong></TableCell>
  </TableRow>
</TableHead>
<TableBody>
  {(venta.lineas || []).map(ln => (
    <TableRow key={ln.detalle_id}>
      <TableCell>{ln.detalle_id}</TableCell>
      <TableCell>
        {ln.imagen_url && (
          <img src={ln.imagen_url} alt={ln.producto_nombre} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
        )}
      </TableCell>
      <TableCell>{ln.producto_nombre || `ID ${ln.producto_id}`}</TableCell>
      <TableCell align="right">{ln.cantidad}</TableCell>
      <TableCell align="right">
        $ {Number(ln.precio_unitario).toFixed(2)}
      </TableCell>
      <TableCell align="right">
        $ {Number(ln.descuento || 0).toFixed(2)}
      </TableCell>
      <TableCell align="right">
        $ {Number(ln.subtotal).toFixed(2)}
      </TableCell>
    </TableRow>
  ))}
  {(!venta.lineas || venta.lineas.length === 0) && (
    <TableRow>
      <TableCell colSpan={7} align="center">
        No hay líneas de detalle.
      </TableCell>
    </TableRow>
  )}
</TableBody>

          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
