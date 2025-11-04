// frontend/src/pages/VentaDetail.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Grid, Table, TableBody, TableCell, Stack,
  TableContainer, TableHead, TableRow, CircularProgress, Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVenta } from '../api/ventas';
import { fetchProductos } from '../api/productos';
import { useLoading } from '../contexts/LoadingContext';
import { generarVentaPDF } from '../utils/pdfHelpers';

export default function VentaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();

  const [venta, setVenta] = useState(null);
  const [productosMap, setProductosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { stop(); }, [stop]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetchProductos();
        const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []);
        const map = {};
        arr.forEach(p => { map[p.id] = p.nombre; });
        setProductosMap(map);
      } catch { /* noop */ }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const r = await fetchVenta(id);
        const data = r?.data ?? r ?? null;
        setVenta(data);
      } catch (err) {
        setError(err?.response?.data?.error || err?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const formatoFecha = (fechaStr) => new Date(fechaStr).toLocaleString();

  const handleDownloadPdf = () => {
    if (!venta) return;
    generarVentaPDF(venta, productosMap);
  };

  if (loading) {
    return (<Container sx={{ mt: 4, textAlign: 'center' }}><CircularProgress /></Container>);
  }
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button onClick={() => { start(); nav('/ventas'); }} sx={{ mt: 2 }} variant="contained">
          Volver a Ventas
        </Button>
      </Container>
    );
  }
  if (!venta) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>No se encontró la venta.</Typography>
        <Button onClick={() => { start(); nav('/ventas'); }} sx={{ mt: 2 }} variant="contained">
          Volver a Ventas
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button onClick={() => { start(); nav('/ventas'); }} variant="outlined">
          ← Volver a Lista de Ventas
        </Button>
        <Button onClick={handleDownloadPdf} variant="contained">Descargar PDF</Button>
      </Stack>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Detalle de Venta #{venta.id}
        </Typography>

        <Grid container spacing={2}>
          {/* --- Cabecera general --- */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Código:</Typography>
            <Typography>{venta.codigo}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Cliente:</Typography>
            <Typography>{venta.cliente_nombre}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2">Fecha:</Typography>
            <Typography>{formatoFecha(venta.fecha)}</Typography>
          </Grid>

          {/* --- Estados y método --- */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Método de pago:</Typography>
            <Typography>{venta.metodo_pago}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Estado pago:</Typography>
            <Typography>{venta.estado_pago}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Estado envío:</Typography>
            <Typography>{venta.estado_envio}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Estado venta:</Typography>
            <Typography>{venta.estado_venta}</Typography>
          </Grid>

          {/* --- Totales y descuento --- */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Total sin descuento:</Typography>
            <Typography>
              $ {venta.lineas && venta.lineas.length > 0
                ? (venta.lineas.reduce((sum, ln) => sum + (ln.cantidad * ln.precio_unitario), 0)).toFixed(2)
                : '0.00'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Descuento aplicado:</Typography>
            <Typography>
              {venta.lineas?.[0]?.descuento || 0}%
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Total bruto (líneas):</Typography>
            <Typography>$ {Number(venta.total_venta).toFixed(2)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Costo envío (proveedor):</Typography>
            <Typography>$ {Number(venta.costo_envio_proveedor || 0).toFixed(2)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Comisión transportista:</Typography>
            <Typography>$ {Number(venta.transportista_comision || 0).toFixed(2)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Total neto (líneas + envío - comisión):</Typography>
            <Typography>
              $ {Number(venta.total_venta_neta || (venta.total_venta + (venta.costo_envio_proveedor||0) - (venta.transportista_comision||0))).toFixed(2)}
            </Typography>
          </Grid>

          {/* --- Otros datos --- */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2">Transportista:</Typography>
            <Typography>{venta.transportista_nombre || '—'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Typography variant="h6" sx={{ p: 2 }}>Líneas de Detalle</Typography>
        <TableContainer sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Imagen</strong></TableCell>
                <TableCell><strong>Producto</strong></TableCell>
                <TableCell align="right"><strong>Cantidad</strong></TableCell>
                <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                <TableCell align="right"><strong>Total sin desc.</strong></TableCell>
                <TableCell align="right"><strong>Descuento</strong></TableCell>
                <TableCell align="right"><strong>Subtotal</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {venta.lineas?.length > 0 ? (
                venta.lineas.map((ln) => {
                  const totalBruto = ln.cantidad * ln.precio_unitario;
                  return (
                    <TableRow key={ln.detalle_id}>
                      <TableCell>{ln.detalle_id}</TableCell>
                      <TableCell>
                        {ln.imagen_url ? (
                          <img
                            src={ln.imagen_url}
                            alt={ln.producto_nombre}
                            width="45"
                            height="45"
                            style={{ objectFit: 'cover', borderRadius: 6 }}
                          />
                        ) : ('-')}
                      </TableCell>
                      <TableCell>{ln.producto_nombre}</TableCell>
                      <TableCell align="right">{ln.cantidad}</TableCell>
                      <TableCell align="right">${Number(ln.precio_unitario).toFixed(2)}</TableCell>
                      <TableCell align="right">${Number(totalBruto).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ${Number(ln.descuento_monto || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">${Number(ln.subtotal).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">Sin líneas de detalle</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
