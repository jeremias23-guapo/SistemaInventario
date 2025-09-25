// frontend/src/pages/VentaForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Container, TextField, Button, Stack, Typography, Paper, MenuItem, IconButton, Grid
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { fetchVenta, createVenta, updateVenta } from '../api/ventas';
import { fetchClientes } from '../api/clientes';
import { fetchTransportistas } from '../api/transportistas';
import { searchProductosLight } from '../api/productos';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import AsyncAutocomplete from '../components/AsyncAutocomplete';

const METODOS = [
  { value: 'transferencia', label: 'transferencia' },
  { value: 'contra_entrega', label: 'contra_entrega' },
];
const ESTADOS_ENVIO = [
  { value: 'pendiente_envio', label: 'pendiente_envio' },
  { value: 'enviado', label: 'enviado' },
  { value: 'recibido', label: 'recibido' },
];
const ESTADOS_PAGO = [
  { value: 'pendiente_pago', label: 'pendiente_pago' },
  { value: 'pagada', label: 'pagada' },
];
const ESTADOS_VENTA = [
  { value: 'activa', label: 'activa' },
  { value: 'cancelada', label: 'cancelada' },
  { value: 'finalizada', label: 'finalizada' },
];

const fmtMoney = (n) => (Number.isFinite(+n) ? Number(n).toFixed(2) : '0.00');

export default function VentaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { start, stop } = useLoading();

  const [cabecera, setCabecera] = useState({
    codigo: '',
    cliente_id: '',
    transportista_id: '',
    metodo_pago: 'transferencia',
    estado_envio: 'pendiente_envio',
    estado_pago: 'pendiente_pago',
    estado_venta: 'activa',
  });

  const [lineas, setLineas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [transportistas, setTransportistas] = useState([]);

  useEffect(() => { stop(); }, [stop]);

  useEffect(() => {
    fetchClientes().then(r => {
      const arr = Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []);
      setClientes(arr || []);
    }).catch(()=>setClientes([]));

    fetchTransportistas()
      .then(setTransportistas)
      .catch(()=>setTransportistas([]));

    if (id) {
      fetchVenta(id).then(r => {
        const v = r?.data ?? r ?? {};
        const fetchedLineas = Array.isArray(v.lineas) ? v.lineas : [];
        setCabecera({
          codigo: v.codigo || '',
          cliente_id: v.cliente_id?.toString() || '',
          transportista_id: v.transportista_id?.toString() || '',
          metodo_pago: v.metodo_pago || 'transferencia',
          estado_envio: v.estado_envio || 'pendiente_envio',
          estado_pago:  v.estado_pago  || 'pendiente_pago',
          estado_venta: v.estado_venta || 'activa',
        });
        setLineas(
          fetchedLineas.map(ln => ({
            _producto: ln.producto_id && ln.producto_nombre
              ? { id: ln.producto_id, label: ln.producto_nombre, precio_venta: ln.precio_unitario }
              : null,
            producto_id: (ln.producto_id ?? '').toString(),
            cantidad: (ln.cantidad ?? '').toString(),
            precio_unitario: (ln.precio_unitario ?? '').toString(),
            descuento: (ln.descuento || 0).toString()
          }))
        );
      }).catch(()=>setLineas([]));
    }
  }, [id]);

  const handleCabeceraChange = e => {
    const { name, value } = e.target;
    setCabecera(c => ({ ...c, [name]: value }));
  };

  const handleLineaChange = (idx, e) => {
    const { name, value } = e.target;
    setLineas(lines => lines.map((ln, i) => (i === idx ? { ...ln, [name]: value } : ln)));
  };

  const addLinea = () =>
    setLineas(l => [...l, { _producto: null, producto_id: '', cantidad: '', precio_unitario: '', descuento: '' }]);

  const removeLinea = idx => setLineas(l => l.filter((_, i) => i !== idx));

  const calcularSubtotal = ln => {
    const c = Number(ln.cantidad) || 0;
    const pu = Number(ln.precio_unitario) || 0;
    const d = Number(ln.descuento) || 0;
    return c * pu - d;
  };
  const totalVenta = (lineas || []).reduce((sum, ln) => sum + calcularSubtotal(ln), 0);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!Array.isArray(lineas) || lineas.length === 0) return alert('Debe agregar al menos una línea');

    for (const ln of lineas) {
      if (!ln.producto_id || Number(ln.cantidad) <= 0 || Number(ln.precio_unitario) <= 0) {
        return alert('Cada línea requiere producto, cantidad>0 y precio>0');
      }
    }

    const payloadBase = {
      cliente_id: Number(cabecera.cliente_id),
      transportista_id: cabecera.transportista_id ? Number(cabecera.transportista_id) : null,
      metodo_pago: cabecera.metodo_pago,
      estado_envio: cabecera.estado_envio,
      estado_pago:  cabecera.estado_pago,
      estado_venta: cabecera.estado_venta,
      lineas: lineas.map(ln => ({
        producto_id: Number(ln.producto_id),
        cantidad: Number(ln.cantidad),
        precio_unitario: Number(ln.precio_unitario),
        descuento: Number(ln.descuento) || 0
      }))
    };

    const payload = isEdit ? { ...payloadBase, codigo: cabecera.codigo } : payloadBase;

    try {
      if (isEdit) await updateVenta(id, payload);
      else await createVenta(payload);
      nav('/ventas');
    } catch (err) {
      console.error('Error guardando venta', err?.response?.data || err);
      alert('Hubo un error: ' + (err?.response?.data?.error || err.message));
      stop();
    }
  };

  const handleCancel = () => { start(); nav('/ventas'); };

  // Adapter fetch para el autocomplete
  const fetchProductosPage = async ({ q, page, limit }) => {
    const res = await searchProductosLight({ q, page, pageSize: limit });
    return { items: res?.items || [], hasMore: !!res?.hasMore };
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>{isEdit ? 'Editar Venta' : 'Nueva Venta'}</Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              {isEdit && (
                <Grid item xs={12} md={4}>
                  <TextField label="Código" name="codigo" value={cabecera.codigo} fullWidth InputProps={{ readOnly: true }} />
                </Grid>
              )}

              <Grid item xs={12} md={isEdit ? 4 : 6}>
                <TextField select label="Cliente" name="cliente_id" value={cabecera.cliente_id} onChange={handleCabeceraChange} required fullWidth>
                  {(clientes || []).map(c => <MenuItem key={c.id} value={c.id.toString()}>{c.nombre}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={isEdit ? 4 : 6}>
                <TextField select label="Método de pago" name="metodo_pago" value={cabecera.metodo_pago} onChange={handleCabeceraChange} fullWidth>
                  {METODOS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={isEdit ? 4 : 6}>
                <TextField select label="Transportista" name="transportista_id" value={cabecera.transportista_id} onChange={handleCabeceraChange} fullWidth>
                  <MenuItem value="">(sin transportista)</MenuItem>
                  {(transportistas || []).map(t => <MenuItem key={t.id} value={t.id.toString()}>{t.nombre}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField select label="Estado pago" name="estado_pago" value={cabecera.estado_pago} onChange={handleCabeceraChange} fullWidth>
                  {ESTADOS_PAGO.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField select label="Estado envío" name="estado_envio" value={cabecera.estado_envio} onChange={handleCabeceraChange} fullWidth>
                  {ESTADOS_ENVIO.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField select label="Estado venta" name="estado_venta" value={cabecera.estado_venta} onChange={handleCabeceraChange} fullWidth>
                  {ESTADOS_VENTA.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <Typography variant="h6" mt={2}>Líneas de Venta</Typography>
            {(lineas || []).map((ln, idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1, position: 'relative' }}>
                <IconButton size="small" onClick={() => removeLinea(idx)} sx={{ position: 'absolute', top: 4, right: 4 }}>
                  <RemoveCircle color="error" />
                </IconButton>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={4}>
                    <AsyncAutocomplete
                      label="Producto"
                      value={ln._producto || null}
                      onChange={(val) => {
                        const precioStr = val?.precio_venta != null ? String(val.precio_venta) : '';
                        setLineas((lines) =>
                          lines.map((row, i) =>
                            i === idx
                              ? { ...row, _producto: val || null, producto_id: val?.id?.toString() || '', precio_unitario: precioStr }
                              : row
                          )
                        );
                      }}
                      fetchPage={fetchProductosPage}
                      popupMinWidth={420}
                      getOptionLabel={(opt) => opt?.label ?? ''}
                      renderOption={(props, opt) => (
                        <li {...props} key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {opt.label}
                          </span>
                          {opt.precio_venta != null && (
                            <span style={{ opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
                              ${fmtMoney(opt.precio_venta)}
                            </span>
                          )}
                        </li>
                      )}
                    />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField label="Cantidad" name="cantidad" type="number" value={ln.cantidad} onChange={e => handleLineaChange(idx, e)} required fullWidth />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField label="Precio Unit." name="precio_unitario" type="number" inputProps={{ step: '0.01' }} value={ln.precio_unitario} onChange={e => handleLineaChange(idx, e)} required fullWidth />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField label="Descuento" name="descuento" type="number" inputProps={{ step: '0.01' }} value={ln.descuento} onChange={e => handleLineaChange(idx, e)} fullWidth />
                  </Grid>

                  <Grid item xs={6} md={2}>
                    <TextField label="Subtotal" name="subtotal" type="number" value={fmtMoney(calcularSubtotal(ln))} InputProps={{ readOnly: true }} fullWidth />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            <Button variant="outlined" startIcon={<AddCircle />} onClick={addLinea}>Agregar Línea</Button>

            <Typography variant="h6" align="right" mt={2}>Total de la Venta: $ {fmtMoney(totalVenta)}</Typography>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleCancel}>Cancelar</Button>
              <Button type="submit" variant="contained">{isEdit ? 'Actualizar Venta' : 'Guardar Venta'}</Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
