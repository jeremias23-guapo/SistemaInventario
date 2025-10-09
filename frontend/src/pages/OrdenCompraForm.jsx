// frontend/src/pages/OrdenCompraForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, TextField, Button, Stack, Typography,
  Grid, Box, Paper, IconButton, Divider, MenuItem
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { fetchOrdenCompra, createOrdenCompra, updateOrdenCompra } from '../api/ordenes_compra';
import { fetchProveedores, fetchProveedor } from '../api/proveedores';
import { fetchProducto, searchProductosLight } from '../api/productos';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import AsyncAutocomplete from '../components/AsyncAutocomplete';

export default function OrdenCompraForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [cabecera, setCabecera] = useState({ codigo: '', proveedor_id: '', estado: 'pendiente' });
  const [proveedorSel, setProveedorSel] = useState(null); // { id, label }

  // cada línea: { producto_id, productoObj, cantidad, precio_unitario, impuesto, libraje, descuento }
  const [lineas, setLineas] = useState([]);
  const [dirty, setDirty] = useState(false);

  // Carga inicial y, si aplica, la orden
  useEffect(() => {
    stop(); // apaga overlay global al montar

    if (id) {
      fetchOrdenCompra(id)
        .then(async (r) => {
          const data = r?.data ?? r ?? {};
          setCabecera({
            codigo: data.codigo || '',
            proveedor_id: data.proveedor_id != null ? String(data.proveedor_id) : '',
            estado: data.estado || 'pendiente'
          });

          // Pre-cargar proveedor seleccionado para mostrar su label
          if (data.proveedor_id != null) {
            try {
              const rp = await fetchProveedor(data.proveedor_id);
              const pv = rp?.data ?? null;
              if (pv) setProveedorSel({ id: String(pv.id), label: pv.nombre });
              else setProveedorSel({ id: String(data.proveedor_id), label: '' });
            } catch {
              setProveedorSel({ id: String(data.proveedor_id), label: '' });
            }
          }

          // Preparar líneas y resolver labels de productos para el autocomplete
          const baseLineas = (data.lineas || []).map(ln => ({
            producto_id: ln.producto_id != null ? String(ln.producto_id) : '',
            productoObj: null,
            cantidad: ln.cantidad ?? '',
            precio_unitario: ln.precio_unitario ?? '',
            impuesto: ln.impuesto ?? '',
            libraje: ln.libraje ?? '',
            descuento: ln.descuento ?? ''
          }));

          const llenas = await Promise.all(
            baseLineas.map(async (ln) => {
              if (!ln.producto_id) return ln;
              try {
                const rp = await fetchProducto(ln.producto_id);
                const p = rp?.data ?? rp ?? null;
                return p
                  ? { ...ln, productoObj: { id: String(p.id), label: p.nombre } }
                  : ln;
              } catch {
                return ln;
              }
            })
          );
          setLineas(llenas);
        })
        .catch(() => showToast({ message: 'No se pudo cargar la orden.', severity: 'error' }));
    }
  }, [id, showToast, stop]);

  // Mapeador para el AsyncAutocomplete (5 por página) - Proveedores
  const fetchPageProveedores = async ({ q, page, limit }) => {
    const res = await fetchProveedores({ page, limit, search: q }); // backend: {data,total}
    const payload = res?.data ?? {};
    const data = Array.isArray(payload.data) ? payload.data : [];
    const total = Number(payload.total || 0);
    return {
      items: data.map(p => ({ id: String(p.id), label: p.nombre })),
      hasMore: page * limit < total
    };
  };

  // Paginador para productos (sin mostrar precios)
  const fetchPageProductos = async ({ q, page, limit }) => {
    // Espera: { items:[{id,label,...}], hasMore, page, pageSize, total }
    const res = await searchProductosLight({ q, page, pageSize: limit });
    const items = Array.isArray(res?.items) ? res.items : [];
    return {
      items: items.map(it => ({
        id: String(it.id),
        label: it.label ?? it.nombre ?? `#${it.id}`
      })),
      hasMore: Boolean(res?.hasMore)
    };
  };

  const handleCabeceraChange = e => {
    setCabecera(c => ({ ...c, [e.target.name]: e.target.value }));
    setDirty(true);
  };

  const handleLineaChange = (i, e) => {
    setLineas(l => l.map((ln, idx) => (idx === i ? { ...ln, [e.target.name]: e.target.value } : ln)));
    setDirty(true);
  };

  const addLinea = () => {
    setLineas(l => [
      ...l,
      { producto_id: '', productoObj: null, cantidad: '', precio_unitario: '', impuesto: '', libraje: '', descuento: '' }
    ]);
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

  const totalOrden = useMemo(
    () => lineas.reduce((s, ln) => s + calcularSubtotal(ln), 0),
    [lineas]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cabecera.proveedor_id) {
      showToast({ message: 'Selecciona un proveedor.', severity: 'warning' });
      return;
    }
    if (!lineas.length) {
      showToast({ message: 'Agrega al menos una línea.', severity: 'warning' });
      return;
    }
    const invalida = lineas.some(
      ln => !ln.producto_id && !ln.productoObj || Number(ln.cantidad) <= 0 || Number(ln.precio_unitario) <= 0
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
        producto_id: Number(ln.productoObj?.id ?? ln.producto_id),
        cantidad: Number(ln.cantidad),
        precio_unitario: Number(ln.precio_unitario), // manual
        impuesto: Number(ln.impuesto) || 0,
        libraje: Number(ln.libraje) || 0,
        descuento: Number(ln.descuento) || 0
      }))
    };

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
    if (!dirty) { start(); nav('/ordenes_compra'); return; }
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
                <TextField
                  label="Código"
                  name="codigo"
                  value={cabecera.codigo}
                  onChange={handleCabeceraChange}
                  required
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <AsyncAutocomplete
                  label="Proveedor"
                  value={proveedorSel}
                  onChange={(val) => {
                    setProveedorSel(val);
                    setCabecera(c => ({ ...c, proveedor_id: val?.id ?? '' }));
                    setDirty(true);
                  }}
                  fetchPage={fetchPageProveedores} // server-side
                  limit={5}
                  placeholder="Buscar proveedor..."
                  noOptionsText="Sin resultados"
                  loadingText="Buscando…"
                  popupMinWidth={360}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Estado"
                  name="estado"
                  value={cabecera.estado}
                  onChange={handleCabeceraChange}
                  fullWidth
                >
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
                  <IconButton
                    size="small"
                    onClick={() => removeLinea(idx)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                    title="Eliminar línea"
                  >
                    <RemoveCircle />
                  </IconButton>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <AsyncAutocomplete
                        label="Producto"
                        value={ln.productoObj || (ln.producto_id ? { id: ln.producto_id, label: '' } : null)}
                        onChange={(val) => {
                          setLineas(ls => ls.map((l, i) => i === idx
                            ? {
                                ...l,
                                productoObj: val || null,
                                producto_id: val?.id ?? ''
                              }
                            : l
                          ));
                          setDirty(true);
                        }}
                        fetchPage={fetchPageProductos}
                        limit={10}
                        placeholder="Buscar producto..."
                        noOptionsText="Sin resultados"
                        loadingText="Buscando…"
                        popupMinWidth={420}
                        // No mostrar precios en las opciones:
                        renderOption={(props, opt) => (
                          <li {...props} key={opt.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {opt.label}
                            </span>
                          </li>
                        )}
                      />
                    </Grid>

                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Cantidad"
                        name="cantidad"
                        type="number"
                        value={ln.cantidad}
                        onChange={e => handleLineaChange(idx, e)}
                        required
                        fullWidth
                      />
                    </Grid>

                    <Grid item xs={6} md={2}>
                      <TextField
                        label="Precio U."
                        name="precio_unitario"
                        type="number"
                        inputProps={{ step: '0.01' }}
                        value={ln.precio_unitario}
                        onChange={e => handleLineaChange(idx, e)}
                        required
                        fullWidth
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <TextField
                        label="Subtotal"
                        value={calcularSubtotal(ln).toFixed(2)}
                        InputProps={{ readOnly: true }}
                        fullWidth
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={4} md={4}>
                      <TextField
                        label="Impuesto"
                        name="impuesto"
                        type="number"
                        inputProps={{ step: '0.01' }}
                        value={ln.impuesto}
                        onChange={e => handleLineaChange(idx, e)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4} md={4}>
                      <TextField
                        label="Libraje"
                        name="libraje"
                        type="number"
                        inputProps={{ step: '0.01' }}
                        value={ln.libraje}
                        onChange={e => handleLineaChange(idx, e)}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={4} md={4}>
                      <TextField
                        label="Descuento"
                        name="descuento"
                        type="number"
                        inputProps={{ step: '0.01' }}
                        value={ln.descuento}
                        onChange={e => handleLineaChange(idx, e)}
                        fullWidth
                      />
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
