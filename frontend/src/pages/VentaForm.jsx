import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  MenuItem,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { fetchVenta, createVenta, updateVenta } from '../api/ventas';
import { fetchCliente, searchClientesLight } from '../api/clientes';
import { searchTransportistasLight, fetchTransportista } from '../api/transportistas';
import { searchProductosLight } from '../api/productos';
import { useNavigate, useParams } from 'react-router-dom';
import { useLoading } from '../contexts/LoadingContext';
import AsyncAutocomplete from '../components/AsyncAutocomplete';
import { toast } from '../utils/alerts';

const METODOS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'contra_entrega', label: 'Contra entrega' },
];
const ESTADOS_ENVIO = [
  { value: 'pendiente_envio', label: 'Pendiente de envío' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'recibido', label: 'Recibido' },
];
const ESTADOS_PAGO = [
  { value: 'pendiente_pago', label: 'Pendiente de pago' },
  { value: 'pagada', label: 'Pagada' },
];
const ESTADOS_VENTA = [
  { value: 'activa', label: 'Activa' },
  { value: 'cancelada', label: 'Cancelada' },
  // 🔹 No permitir elegir manualmente "finalizada"
];


const fmtMoney = (n) => (Number.isFinite(+n) ? Number(n).toFixed(2) : '0.00');

const prettifyStockError = (rawMsg, lineas) => {
  if (!rawMsg) return '';
  const getNombre = (pid) => {
    const ln = (lineas || []).find((l) => String(l.producto_id) === String(pid));
    return ln?._producto?.label || 'Producto';
  };
  return String(rawMsg).replace(/producto\s+(\d+)/gi, (_, pid) => {
    const nombre = getNombre(pid);
    return `producto ${nombre} ID ${pid}`;
  });
};

export default function VentaForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const nav = useNavigate();
  const { start, stop } = useLoading();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  const [clienteSel, setClienteSel] = useState(null);
  const [transportistaSel, setTransportistaSel] = useState(null);

  useEffect(() => {
    stop();
  }, [stop]);

  useEffect(() => {
    if (id) {
      fetchVenta(id)
        .then(async (r) => {
          const v = r?.data ?? r ?? {};
          const fetchedLineas = Array.isArray(v.lineas) ? v.lineas : [];

          setCabecera({
            codigo: v.codigo || '',
            cliente_id: v.cliente_id?.toString() || '',
            transportista_id: v.transportista_id?.toString() || '',
            metodo_pago: v.metodo_pago || 'transferencia',
            estado_envio: v.estado_envio || 'pendiente_envio',
            estado_pago: v.estado_pago || 'pendiente_pago',
            estado_venta: v.estado_venta || 'activa',
          });

          if (v.cliente_id) {
            const respC = await fetchCliente(v.cliente_id);
            const cl = respC?.data ?? respC ?? null;
            if (cl) setClienteSel({ id: String(cl.id), label: cl.nombre });
          }

          if (v.transportista_id) {
            const respT = await fetchTransportista(v.transportista_id);
            const tr = respT?.data ?? respT ?? null;
            if (tr) setTransportistaSel({ id: String(tr.id), label: tr.nombre });
          }

          setLineas(
            fetchedLineas.map((ln) => ({
              _producto:
                ln.producto_id && ln.producto_nombre
                  ? { id: ln.producto_id, label: ln.producto_nombre, precio_venta: ln.precio_unitario }
                  : null,
              producto_id: (ln.producto_id ?? '').toString(),
              cantidad: (ln.cantidad ?? '').toString(),
              precio_unitario: (ln.precio_unitario ?? '').toString(),
              descuento: (ln.descuento || 0).toString(),
            }))
          );
        })
        .catch(() => setLineas([]));
    }
  }, [id]);

  const handleCabeceraChange = (e) => {
    const { name, value } = e.target;
    setCabecera((c) => ({ ...c, [name]: value }));
  };

  const handleLineaChange = (idx, e) => {
    const { name, value } = e.target;
    setLineas((l) => l.map((ln, i) => (i === idx ? { ...ln, [name]: value } : ln)));
  };

  const addLinea = () =>
    setLineas((l) => [
      ...l,
      { _producto: null, producto_id: '', cantidad: '', precio_unitario: '', descuento: '' },
    ]);

  const removeLinea = (idx) => setLineas((l) => l.filter((_, i) => i !== idx));

 const calcularSubtotal = (ln) => {
  const c = Number(ln.cantidad) || 0;
  const pu = Number(ln.precio_unitario) || 0;
  const d = Number(ln.descuento) || 0;
  return c * pu * (1 - d / 100);
};

  const totalVenta = (lineas || []).reduce((sum, ln) => sum + calcularSubtotal(ln), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cabecera.cliente_id) return toast.warn('Cliente requerido', 'Debe seleccionar un cliente.');
    if (!Array.isArray(lineas) || lineas.length === 0)
      return toast.warn('Sin líneas', 'Debe agregar al menos una línea.');
    for (const ln of lineas) {
      if (!ln.producto_id || Number(ln.cantidad) <= 0 || Number(ln.precio_unitario) <= 0)
        return toast.warn('Datos incompletos', 'Cada línea requiere producto, cantidad > 0 y precio > 0.');
    }

    const payloadBase = {
      cliente_id: Number(cabecera.cliente_id),
      transportista_id: cabecera.transportista_id ? Number(cabecera.transportista_id) : null,
      metodo_pago: cabecera.metodo_pago,
      estado_envio: cabecera.estado_envio,
      estado_pago: cabecera.estado_pago,
      estado_venta: cabecera.estado_venta,
      lineas: lineas.map((ln) => ({
        producto_id: Number(ln.producto_id),
        cantidad: Number(ln.cantidad),
        precio_unitario: Number(ln.precio_unitario),
        descuento: Number(ln.descuento) || 0,
      })),
    };
    const payload = isEdit ? { ...payloadBase, codigo: cabecera.codigo } : payloadBase;

    try {
      if (isEdit) await updateVenta(id, payload);
      else await createVenta(payload);
      toast.ok('Guardado', 'La venta se guardó correctamente.', { timer: 1800 });
      nav('/ventas');
    } catch (err) {
      const raw = err?.response?.data?.error || err?.message || 'Error desconocido';
      const pretty = prettifyStockError(raw, lineas);
      toast.error('No se pudo guardar', pretty);
      console.error('Error guardando venta', err?.response?.data || err);
      stop();
    }
  };

  const handleCancel = () => {
    start();
    nav('/ventas');
  };

  const fetchClientesPage = async ({ q, page, limit }) => {
    const res = await searchClientesLight({ q, page, pageSize: limit });
    const items = res?.items || res?.data || [];
    return { items: items.map((c) => ({ id: String(c.id), label: c.nombre })), hasMore: !!res?.hasMore };
  };

  const fetchTransportistasPage = async ({ q, page, limit }) => {
    const res = await searchTransportistasLight({ q, page, pageSize: limit });
    const items = res?.items || res?.data || [];
    return { items: items.map((t) => ({ id: String(t.id), label: t.nombre })), hasMore: !!res?.hasMore };
  };

  const fetchProductosPage = async ({ q, page, limit }) => {
    const res = await searchProductosLight({ q, page, pageSize: limit });
    return { items: res?.items || [], hasMore: !!res?.hasMore };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          boxShadow: 3,
          overflow: 'hidden',
        }}
      >
        {/* CONTENIDO PRINCIPAL */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {isEdit ? 'Editar Venta' : 'Nueva Venta'}
          </Typography>

          <form id="venta-form" onSubmit={handleSubmit}>
            {/* === CABECERA === */}
            {/* === CABECERA === */}
<Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    alignItems: "flex-start",
    mb: 2,
  }}
>
  {isEdit && (
    <TextField
      label="Código"
      name="codigo"
      value={cabecera.codigo}
      fullWidth
      InputProps={{ readOnly: true }}
      sx={{ flex: "1 1 180px", minWidth: 180 }}
    />
  )}

  <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
    <AsyncAutocomplete
      label="Cliente"
      value={clienteSel}
      onChange={(val) => {
        setClienteSel(val);
        setCabecera((c) => ({ ...c, cliente_id: val?.id ?? "" }));
      }}
      fetchPage={fetchClientesPage}
      placeholder="Buscar cliente..."
    />
    <Button
      size="small"
      onClick={() => {
        setClienteSel(null);
        setCabecera((c) => ({ ...c, cliente_id: "" }));
      }}
      sx={{
        mt: 0.5,
        textTransform: "none",
        fontSize: "0.8rem",
        color: "primary.main",
      }}
    >
      Sin cliente
    </Button>
  </Box>

  <TextField
    select
    label="Método de pago"
    name="metodo_pago"
    value={cabecera.metodo_pago}
    onChange={handleCabeceraChange}
    fullWidth
    sx={{ flex: "1 1 200px", minWidth: 200 }}
  >
    {METODOS.map((o) => (
      <MenuItem key={o.value} value={o.value}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>

  <Box sx={{ flex: "1 1 250px", minWidth: 250 }}>
    <AsyncAutocomplete
      label="Transportista"
      value={transportistaSel}
      onChange={(val) => {
        setTransportistaSel(val);
        setCabecera((c) => ({ ...c, transportista_id: val?.id ?? "" }));
      }}
      fetchPage={fetchTransportistasPage}
      placeholder="Buscar transportista..."
    />
    <Button
      size="small"
      onClick={() => {
        setTransportistaSel(null);
        setCabecera((c) => ({ ...c, transportista_id: "" }));
      }}
      sx={{
        mt: 0.5,
        textTransform: "none",
        fontSize: "0.8rem",
        color: "primary.main",
      }}
    >
      Sin transportista
    </Button>
  </Box>

  <TextField
    select
    label="Estado de pago"
    name="estado_pago"
    value={cabecera.estado_pago}
    onChange={handleCabeceraChange}
    fullWidth
    sx={{ flex: "1 1 200px", minWidth: 200 }}
  >
    {ESTADOS_PAGO.map((o) => (
      <MenuItem key={o.value} value={o.value}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="Estado de envío"
    name="estado_envio"
    value={cabecera.estado_envio}
    onChange={handleCabeceraChange}
    fullWidth
    sx={{ flex: "1 1 200px", minWidth: 200 }}
  >
    {ESTADOS_ENVIO.map((o) => (
      <MenuItem key={o.value} value={o.value}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="Estado de venta"
    name="estado_venta"
    value={cabecera.estado_venta}
    onChange={handleCabeceraChange}
    fullWidth
    sx={{ flex: "1 1 200px", minWidth: 200 }}
  >
    {ESTADOS_VENTA.map((o) => (
      <MenuItem key={o.value} value={o.value}>
        {o.label}
      </MenuItem>
    ))}
  </TextField>
</Box>


            {/* === LÍNEAS DE VENTA === */}
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Líneas de Venta
            </Typography>

            <TableContainer sx={{ borderRadius: 2, boxShadow: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Descuento</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineas.map((ln, idx) => (
                    <TableRow key={idx}>
                      <TableCell width="35%">
                        <AsyncAutocomplete
                          label=""
                          value={ln._producto || null}
                          fetchPage={fetchProductosPage}
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
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        <TextField
                          size="small"
                          name="cantidad"
                          type="number"
                          value={ln.cantidad}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="15%">
                        <TextField
                          size="small"
                          name="precio_unitario"
                          type="number"
                          value={ln.precio_unitario}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                    <TableCell align="right" width="15%">
  <TextField
    size="small"
    name="descuento"
    type="number"
    label="Descuento"
    value={ln.descuento}
    onChange={(e) => handleLineaChange(idx, e)}
    fullWidth
    InputProps={{
      endAdornment: <span style={{ marginLeft: 4, opacity: 0.6 }}>%</span>,
    }}
  />
</TableCell>

                      <TableCell align="right" width="15%">
                        ${fmtMoney(calcularSubtotal(ln))}
                      </TableCell>
                      <TableCell align="center" width="5%">
                        <IconButton color="error" onClick={() => removeLinea(idx)}>
                          <RemoveCircle />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Button startIcon={<AddCircle />} onClick={addLinea} variant="outlined" sx={{ mt: 1 }}>
                        Agregar línea
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </form>
        </Box>

        {/* === FOOTER FIJO === */}
        <Box
          sx={{
            p: 2,
            borderTop: (t) => `1px solid ${t.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.background.paper,
          }}
        >
          <Typography variant="h6">
            Total: <strong>${fmtMoney(totalVenta)}</strong>
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="venta-form" variant="contained">
              {isEdit ? 'Actualizar Venta' : 'Guardar Venta'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
