// frontend/src/pages/OrdenesCompraDetalle.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Box
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchOrdenCompra } from '../api/ordenes_compra';
import { fetchProductos }   from '../api/productos';
import { useLoading } from '../contexts/LoadingContext'; // 👈 overlay global

export default function OrdenesCompraDetalle() {
  const { id } = useParams();
  const nav   = useNavigate();
  const { start, stop } = useLoading(); // 👈
  const [orden, setOrden] = useState(null);
  const [prodMap, setProdMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Al entrar: apaga overlay global (la vista muestra su spinner local)
  useEffect(() => { stop(); }, [stop]);

  useEffect(() => {
    const load = async () => {
      try {
        // Cargar mapa de productos
        const prodRes = await fetchProductos();
        const prodArr = Array.isArray(prodRes?.data) ? prodRes.data : (prodRes ?? []);
        const m = {};
        prodArr.forEach(p => { m[p.id] = p.nombre; });
        setProdMap(m);

        // Cargar orden de compra
        const ocRes = await fetchOrdenCompra(id);
        const oc = ocRes?.data ?? ocRes ?? null;
        setOrden(oc);
      } catch (err) {
        console.error('Error cargando detalle de orden', err);
        setOrden(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!orden) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6">Orden no encontrada</Typography>
        <Button
          variant="contained"
          onClick={() => { start(); nav('/ordenes_compra'); }} // 👈 overlay al volver
          sx={{ mt: 2 }}
        >
          Volver
        </Button>
      </Container>
    );
  }

  const fmtDate = f => new Date(f).toLocaleString();
  const total = Number(orden.total_orden) || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Detalle Orden #{orden.id} – {orden.codigo}
        </Typography>
        <Button variant="outlined" onClick={() => { start(); nav('/ordenes_compra'); }}>
          Volver
        </Button>
      </Box>
      <Divider sx={{ mb: 3 }} />

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography><strong>Proveedor:</strong> {orden.proveedor_nombre}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography><strong>Fecha:</strong> {fmtDate(orden.fecha)}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography><strong>Estado:</strong> {orden.estado}</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography><strong>Total Orden:</strong> $ {total.toFixed(2)}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Líneas de Detalle
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="right"><strong>Cant.</strong></TableCell>
              <TableCell align="right"><strong>Precio U.</strong></TableCell>
              <TableCell align="right"><strong>Imp.</strong></TableCell>
              <TableCell align="right"><strong>Lib.</strong></TableCell>
              <TableCell align="right"><strong>Desc.</strong></TableCell>
              <TableCell align="right"><strong>Subtotal</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(orden.lineas || []).map(ln => (
              <TableRow key={ln.id}>
                <TableCell>{ln.id}</TableCell>
                <TableCell>{prodMap[ln.producto_id] || `ID ${ln.producto_id}`}</TableCell>
                <TableCell align="right">{ln.cantidad}</TableCell>
                <TableCell align="right">$ {Number(ln.precio_unitario).toFixed(2)}</TableCell>
                <TableCell align="right">$ {Number(ln.impuesto).toFixed(2)}</TableCell>
                <TableCell align="right">$ {Number(ln.libraje).toFixed(2)}</TableCell>
                <TableCell align="right">$ {Number(ln.descuento).toFixed(2)}</TableCell>
                <TableCell align="right">$ {Number(ln.subtotal).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {(orden.lineas || []).length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay líneas de detalle.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
