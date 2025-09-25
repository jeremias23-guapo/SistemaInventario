import React, { useEffect, useState } from 'react';
import {
  Container, TextField, Button, Stack, Typography,
  Grid, Box, Paper, IconButton, Divider, MenuItem
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { fetchOrdenCompra, createOrdenCompra, updateOrdenCompra } from '../api/ordenes_compra';
import { fetchProductos } from '../api/productos';
import { fetchProveedores } from '../api/proveedores';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

export default function OrdenCompraForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [cabecera, setCabecera] = useState({ codigo: '', proveedor_id: '', estado: 'pendiente' });
  const [lineas, setLineas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { stop(); }, [stop]);

  useEffect(() => {
    fetchProductos().then(r => setProductos(r?.data ?? r ?? [])).catch(() =>
      showToast({ message: 'No se pudieron cargar los productos.', severity: 'error' })
    );
    fetchProveedores().then(r => setProveedores(r?.data ?? r ?? [])).catch(() =>
      showToast({ message: 'No se pudieron cargar los proveedores.', severity: 'error' })
    );

    if (id) {
      fetchOrdenCompra(id)
        .then(r => {
          const data = r?.data ?? r ?? {};
          setCabecera({
            codigo: data.codigo || '',
            proveedor_id: data.proveedor_id ?? '',
            estado: data.estado || 'pendiente'
          });
          setLineas((data.lineas || []).map(ln => ({
            producto_id: ln.producto_id ?? '',
            cantidad: ln.cantidad ?? '',
            precio_unitario: ln.precio_unitario ?? '',
            impuesto: ln.impuesto ?? '',
            libraje: ln.libraje ?? '',
            descuento: ln.descuento ?? ''
          })));
        })
        .catch(() => showToast({ message: 'No se pudo cargar la orden.', severity: 'error' }));
    }
  }, [id, showToast]);

  const handleCabeceraChange = e => {
    setCabecera(c => ({ ...c, [e.target.name]: e.target.value }));
    setDirty(true);
  };

  const handleLineaChange = (i, e) => {
    setLineas(l => l.map((ln, idx) => (idx === i ? { ...ln, [e.target.name]: e.target.value } : ln)));
    setDirty(true);
  };

  const addLinea = () => {
    setLineas(l => [...l, { producto_id: '', cantidad: '', precio_unitario: '', impuesto: '', libraje: '', descuento: '' }]);
    setDirty(true);
  };

  const removeLinea = i => {
    setLineas(l => l.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const calcularSubtotal = ln => {
    const c = Number(ln.cantidad) || 0;
    const pu = Number(ln.precio_unitario) || 0;
    const imp = Number(ln.impuesto) || 0;
    const lib = Number(ln.libraje) || 0;
    const d = Number(ln.descuento) || 0;
    return c * pu + imp + lib - d;
  };

  const totalOrden = lineas.reduce((s, ln) => s + calcularSubtotal(ln), 0);

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!lineas.length) {
    showToast({ message: 'Agrega al menos una línea.', severity: 'warning' });
    return;
  }
  const invalida = lineas.some(
    ln => !ln.producto_id || Number(ln.cantidad) <= 0 || Number(ln.precio_unitario) <= 0
  );
  if (invalida) {
    showToast({ message: 'Revisa producto, cantidad y precio en cada línea.', severity: 'warning' });
    return;
  }

  const payload = {
    codigo: cabecera.codigo,
    proveedor_id: Number(cabecera.proveedor_id),
    estado: cabecera.estado,
    lineas: lineas.map(ln => ({
      producto_id: Number(ln.producto_id),
      cantidad: Number(ln.cantidad),
      precio_unitario: Number(ln.precio_unitario),
      impuesto: Number(ln.impuesto) || 0,
      libraje: Number(ln.libraje) || 0,
      descuento: Number(ln.descuento) || 0
    }))
  };

  // ✅ Confirmar SOLO en actualización
  if (id) {
    const ok = await confirm({
      title: 'Actualizar orden',
      content: '¿Estás seguro de actualizar esta orden?',
      confirmText: 'Sí, actualizar',
      cancelText: 'No, volver',
      confirmColor: 'warning'
    });
    if (!ok) return;
  }

  start();
  try {
    if (id) {
      await updateOrdenCompra(id, payload);
    } else {
      await createOrdenCompra(payload);
    }

    nav('/ordenes_compra', {
      replace: true,
      state: {
        flash: {
          severity: 'success',
          message: id ? 'Orden actualizada correctamente.' : 'Orden creada correctamente.'
        }
      }
    });
  } catch (err) {
    console.error(err);
    showToast({ message: 'Error al guardar la orden.', severity: 'error' });
    stop();
  }
};


  const handleCancel = async () => {
    if (!dirty) {
      start(); nav('/ordenes_compra'); return;
    }
    const ok = await confirm({
      title: 'Descartar cambios',
      content: 'Tienes cambios sin guardar. ¿Deseas salir y descartar los cambios?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Seguir editando',
      confirmColor: 'warning'
    });
    if (ok) { start(); nav('/ordenes_compra'); }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          {id ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Cabecera */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Código" name="codigo" value={cabecera.codigo} onChange={handleCabeceraChange} required fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select label="Proveedor" name="proveedor_id" value={cabecera.proveedor_id} onChange={handleCabeceraChange} required fullWidth>
                  {proveedores.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField select label="Estado" name="estado" value={cabecera.estado} onChange={handleCabeceraChange} fullWidth>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="recibida">Recibida</MenuItem>
                  <MenuItem value="cancelada">Cancelada</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Líneas */}
            <Stack spacing={2}>
              {lineas.map((ln, idx) => (
                <Paper key={idx} sx={{ p: 2, position: 'relative' }}>
                  <IconButton size="small" onClick={() => removeLinea(idx)} sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }} title="Eliminar línea">
                    <RemoveCircle />
                  </IconButton>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <TextField
                        select label="Producto" name="producto_id" value={ln.producto_id}
                        onChange={e => handleLineaChange(idx, e)} required fullWidth
                      >
                        {productos.map(p => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nombre} – ${Number(p.precio_compra || 0).toFixed(2)}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField label="Cantidad" name="cantidad" type="number" value={ln.cantidad} onChange={e => handleLineaChange(idx, e)} required fullWidth />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField label="Precio U." name="precio_unitario" type="number" inputProps={{ step: '0.01' }} value={ln.precio_unitario} onChange={e => handleLineaChange(idx, e)} required fullWidth />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <TextField label="Subtotal" value={calcularSubtotal(ln).toFixed(2)} InputProps={{ readOnly: true }} fullWidth />
                    </Grid>
                  </Grid>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={4} md={4}>
                      <TextField label="Impuesto" name="impuesto" type="number" inputProps={{ step: '0.01' }} value={ln.impuesto} onChange={e => handleLineaChange(idx, e)} fullWidth />
                    </Grid>
                    <Grid item xs={4} md={4}>
                      <TextField label="Libraje" name="libraje" type="number" inputProps={{ step: '0.01' }} value={ln.libraje} onChange={e => handleLineaChange(idx, e)} fullWidth />
                    </Grid>
                    <Grid item xs={4} md={4}>
                      <TextField label="Descuento" name="descuento" type="number" inputProps={{ step: '0.01' }} value={ln.descuento} onChange={e => handleLineaChange(idx, e)} fullWidth />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Box textAlign="center" sx={{ mt: 1 }}>
                <Button variant="outlined" startIcon={<AddCircle />} onClick={addLinea}>
                  Agregar Línea
                </Button>
              </Box>
            </Stack>

            {/* Total y botones */}
            <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
              <Typography variant="h6">
                Total: {new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(totalOrden)}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
                <Button variant="contained" type="submit">{id ? 'Actualizar' : 'Guardar'}</Button>
              </Stack>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
