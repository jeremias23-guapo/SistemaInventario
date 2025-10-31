// frontend/src/pages/OrdenCompraForm.jsx
import React, { useEffect, useState, useMemo } from 'react';
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
  Divider,
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchOrdenCompra, createOrdenCompra, updateOrdenCompra } from '../api/ordenes_compra';
import { fetchProveedores } from '../api/proveedores';
import { searchProductosLight } from '../api/productos';
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
  const theme = useTheme();

  const [cabecera, setCabecera] = useState({
    codigo: '',
    proveedor_id: '',
    estado: 'pendiente',
  });
  const [proveedorSel, setProveedorSel] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [dirty, setDirty] = useState(false);

  // === CARGA DE ORDEN EXISTENTE ===
  useEffect(() => {
    stop();
    if (id) {
      fetchOrdenCompra(id)
        .then((r) => {
          const data = r?.data ?? r ?? {};

          setCabecera({
            codigo: data.codigo || '',
            proveedor_id: data.proveedor_id ? String(data.proveedor_id) : '',
            estado: data.estado || 'pendiente',
          });

          if (data.proveedor_nombre && data.proveedor_id) {
            setProveedorSel({
              id: String(data.proveedor_id),
              label: data.proveedor_nombre,
            });
          }

          // ✅ Usar producto del backend directamente
          const baseLineas = (data.lineas || []).map((ln) => ({
            producto_id: String(ln.producto?.id || ''),
            productoObj: ln.producto
              ? { id: String(ln.producto.id), label: ln.producto.nombre }
              : null,
            cantidad: ln.cantidad ?? '',
            precio_unitario: ln.precio_unitario ?? '',
            impuesto: ln.impuesto ?? '',
            libraje: ln.libraje ?? '',
            descuento: ln.descuento ?? '',
          }));

          setLineas(baseLineas);
        })
        .catch(() =>
          showToast({ message: 'Error al cargar la orden.', severity: 'error' })
        );
    }
  }, [id, showToast, stop]);

  // === FETCHERS ===
  const fetchPageProveedores = async ({ q, page, limit }) => {
    const res = await fetchProveedores({ page, limit, search: q });
    const payload = res?.data ?? {};
    const data = Array.isArray(payload.data) ? payload.data : [];
    const total = Number(payload.total || 0);
    return {
      items: data.map((p) => ({ id: String(p.id), label: p.nombre })),
      hasMore: page * limit < total,
    };
  };

  const fetchPageProductos = async ({ q, page, limit }) => {
    const res = await searchProductosLight({ q, page, pageSize: limit });
    const items = Array.isArray(res?.items) ? res.items : [];
    return {
      items: items.map((it) => ({
        id: String(it.id),
        label: it.label ?? it.nombre ?? `#${it.id}`,
      })),
      hasMore: Boolean(res?.hasMore),
    };
  };

  // === HANDLERS ===
  const handleCabeceraChange = (e) => {
    setCabecera((c) => ({ ...c, [e.target.name]: e.target.value }));
    setDirty(true);
  };

  const handleLineaChange = (i, e) => {
    setLineas((l) =>
      l.map((ln, idx) =>
        idx === i ? { ...ln, [e.target.name]: e.target.value } : ln
      )
    );
    setDirty(true);
  };

  const addLinea = () => {
    setLineas((l) => [
      ...l,
      {
        producto_id: '',
        productoObj: null,
        cantidad: '',
        precio_unitario: '',
        impuesto: '',
        libraje: '',
        descuento: '',
      },
    ]);
    setDirty(true);
  };

  const removeLinea = (i) => {
    setLineas((l) => l.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  // === CALCULO SUBTOTAL (con % de impuesto y descuento) ===
  // 🔹 Libraje se multiplica por la cantidad (por unidad)
  const calcularSubtotal = (ln) => {
    const c = Number(ln.cantidad) || 0;
    const pu = Number(ln.precio_unitario) || 0;
    const imp = Number(ln.impuesto) || 0;
    const lib = Number(ln.libraje) || 0;
    const d = Number(ln.descuento) || 0;

    const base = c * pu;
    const subtotal = base + base * (imp / 100) + (lib * c) - base * (d / 100);
    return subtotal;
  };

  const totalOrden = useMemo(
    () => lineas.reduce((s, ln) => s + calcularSubtotal(ln), 0),
    [lineas]
  );

  // === GUARDAR / ACTUALIZAR ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cabecera.proveedor_id)
      return showToast({ message: 'Selecciona un proveedor.', severity: 'warning' });
    if (!lineas.length)
      return showToast({ message: 'Agrega al menos una línea.', severity: 'warning' });

    const payload = {
      codigo: cabecera.codigo,
      proveedor_id: Number(cabecera.proveedor_id),
      estado: cabecera.estado,
      lineas: lineas.map((ln) => ({
        producto_id: Number(ln.productoObj?.id ?? ln.producto_id),
        cantidad: Number(ln.cantidad),
        precio_unitario: Number(ln.precio_unitario),
        impuesto: Number(ln.impuesto) || 0,
        libraje: Number(ln.libraje) || 0,
        descuento: Number(ln.descuento) || 0,
      })),
    };

    if (id) {
      const ok = await confirm({
        title: 'Actualizar orden',
        content: '¿Deseas actualizar esta orden?',
        confirmText: 'Actualizar',
        cancelText: 'Cancelar',
        confirmColor: 'warning',
      });
      if (!ok) return;
    }

    start();
    try {
      if (id) await updateOrdenCompra(id, payload);
      else await createOrdenCompra(payload);
      nav('/ordenes_compra', {
        replace: true,
        state: {
          flash: {
            severity: 'success',
            message: id ? 'Orden actualizada correctamente.' : 'Orden creada correctamente.',
          },
        },
      });
    } catch (err) {
      console.error(err);
      showToast({ message: 'Error al guardar la orden.', severity: 'error' });
      stop();
    }
  };

  // === CANCELAR ===
  const handleCancel = async () => {
    if (!dirty) {
      start();
      nav('/ordenes_compra');
      return;
    }
    const ok = await confirm({
      title: 'Descartar cambios',
      content: 'Tienes cambios sin guardar. ¿Deseas salir?',
      confirmText: 'Salir sin guardar',
      cancelText: 'Seguir editando',
      confirmColor: 'warning',
    });
    if (ok) {
      start();
      nav('/ordenes_compra');
    }
  };

  // === RENDER ===
  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 2,
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        {/* CONTENIDO SCROLLEABLE */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            {id ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <form id="orden-form" onSubmit={handleSubmit}>
            {/* === CABECERA (mejorada y responsive) === */}
<Box
  sx={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'flex-start',
    mb: 2,
  }}
>
  {/* Código */}
  <TextField
    label="Código"
    name="codigo"
    value={cabecera.codigo}
    onChange={handleCabeceraChange}
    required
    fullWidth
    sx={{ flex: '1 1 180px', minWidth: 180 }}
  />

  {/* Proveedor */}
  <Box sx={{ flex: '1 1 260px', minWidth: 240 }}>
    <AsyncAutocomplete
      label="Proveedor"
      value={proveedorSel}
      onChange={(val) => {
        setProveedorSel(val);
        setCabecera((c) => ({ ...c, proveedor_id: val?.id ?? '' }));
      }}
      fetchPage={fetchPageProveedores}
      limit={5}
      placeholder="Buscar proveedor..."
    />
  </Box>

  {/* Estado */}
  <TextField
    select
    label="Estado"
    name="estado"
    value={cabecera.estado}
    onChange={handleCabeceraChange}
    fullWidth
    sx={{ flex: '1 1 200px', minWidth: 200 }}
  >
    <MenuItem value="pendiente">Pendiente</MenuItem>
    <MenuItem value="recibida">Recibida</MenuItem>
    <MenuItem value="cancelada">Cancelada</MenuItem>
  </TextField>
</Box>


            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Detalle de Productos
            </Typography>

            <TableContainer sx={{ borderRadius: 2, boxShadow: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio U.</TableCell>
                    <TableCell align="right">Impuesto (%)</TableCell>
                    <TableCell align="right">Libraje ($)</TableCell>
                    <TableCell align="right">Descuento (%)</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineas.map((ln, idx) => (
                    <TableRow key={idx}>
                      <TableCell width="25%">
                        <AsyncAutocomplete
                          label=""
                          value={ln.productoObj}
                          fetchPage={fetchPageProductos}
                          onChange={(val) => {
                            setLineas((ls) =>
                              ls.map((l, i) =>
                                i === idx ? { ...l, productoObj: val, producto_id: val?.id ?? '' } : l
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" width="8%">
                        <TextField
                          size="small"
                          name="cantidad"
                          type="number"
                          value={ln.cantidad}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        <TextField
                          size="small"
                          name="precio_unitario"
                          type="number"
                          value={ln.precio_unitario}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        <TextField
                          size="small"
                          name="impuesto"
                          type="number"
                          value={ln.impuesto}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        <TextField
                          size="small"
                          name="libraje"
                          type="number"
                          value={ln.libraje}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        <TextField
                          size="small"
                          name="descuento"
                          type="number"
                          value={ln.descuento}
                          onChange={(e) => handleLineaChange(idx, e)}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell align="right" width="10%">
                        ${calcularSubtotal(ln).toFixed(2)}
                      </TableCell>
                      <TableCell align="center" width="5%">
                        <IconButton color="error" onClick={() => removeLinea(idx)}>
                          <RemoveCircle />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Button
                        startIcon={<AddCircle />}
                        onClick={addLinea}
                        variant="outlined"
                        sx={{ mt: 1 }}
                      >
                        Agregar Línea
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </form>
        </Box>

        {/* FOOTER FIJO */}
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
            Total:{' '}
            {new Intl.NumberFormat('es-SV', {
              style: 'currency',
              currency: 'USD',
            }).format(totalOrden)}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" form="orden-form" variant="contained">
              {id ? 'Actualizar' : 'Guardar'}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
