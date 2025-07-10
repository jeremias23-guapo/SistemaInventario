// frontend/src/pages/VentaForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  MenuItem,
  IconButton,
  Grid
} from '@mui/material';
import { AddCircle, RemoveCircle } from '@mui/icons-material';
import {
  fetchVenta,
  createVenta,
  updateVenta
} from '../api/ventas';
import { fetchProductos } from '../api/productos';
import { fetchClientes } from '../api/clientes'; // Asegúrate de que fetchClientes devuelva un array
import { useNavigate, useParams } from 'react-router-dom';

export default function VentaForm() {
  const { id } = useParams();
  const nav = useNavigate();

  // ------------------------
  // 1) Estado de la cabecera
  // ------------------------
  const [cabecera, setCabecera] = useState({
    codigo: '',
    cliente_id: '',
    estado: 'pendiente'
  });

  // ----------------------------
  // 2) Estado para las líneas
  // ----------------------------
  const [lineas, setLineas] = useState([]);

  // ----------------------------
  // 3) Catálogos (productos + clientes)
  // ----------------------------
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);

  // ---------------------------------------------------
  // 4) useEffect: cargar catálogos y, si editando, datos
  // ---------------------------------------------------
  useEffect(() => {
    // 4.a) Cargar productos
    fetchProductos()
      .then(r => {
        // r.data ya es el array de productos
        setProductos(r.data || []);
      })
      .catch(err => {
        console.error('Error cargando productos:', err);
        setProductos([]);
      });

    // 4.b) Cargar clientes
    fetchClientes()
      .then(arr => {
        // Aquí arr ES directo el array de clientes
        setClientes(arr || []);
      })
      .catch(err => {
        console.error('Error cargando clientes:', err);
        setClientes([]);
      });

    // 4.c) Si hay id → editar, cargar la venta completa
    if (id) {
      fetchVenta(id)
        .then(r => {
          // r.lineas podría venir undefined; forzamos a []
          const fetchedLineas = Array.isArray(r.lineas) ? r.lineas : [];

          setCabecera({
            codigo: r.codigo || '',
            cliente_id: r.cliente_id?.toString() || '',
            estado: r.estado || 'pendiente'
          });

          // Mapear líneas al formato local
          setLineas(
            fetchedLineas.map(ln => ({
              producto_id: ln.producto_id.toString(),
              cantidad: ln.cantidad.toString(),
              precio_unitario: ln.precio_unitario.toString(),
              descuento: (ln.descuento || 0).toString()
            }))
          );
        })
        .catch(err => {
          console.error('Error al cargar la venta:', err);
          setLineas([]);
        });
    }
  }, [id]);

  // ---------------------------------------
  // 5) Manejo de cambio en la cabecera
  // ---------------------------------------
  const handleCabeceraChange = e => {
    const { name, value } = e.target;
    setCabecera(c => ({ ...c, [name]: value }));
  };

  // ---------------------------------------
  // 6) Manejo de cambio en una línea
  // ---------------------------------------
  const handleLineaChange = (idx, e) => {
    const { name, value } = e.target;
    setLineas(lines =>
      lines.map((ln, i) => (i === idx ? { ...ln, [name]: value } : ln))
    );
  };

  // -------------------------------------------------------------------
  // 7) Cuando selecciono un producto: autollenar el precio unitario
  // -------------------------------------------------------------------
  const handleProductoSelect = (idx, productoId) => {
    const prod = productos.find(p => p.id.toString() === productoId);
    const precioStr = prod ? prod.precio_venta.toString() : '';
    setLineas(lines =>
      lines.map((ln, i) =>
        i === idx
          ? { ...ln, producto_id: productoId, precio_unitario: precioStr }
          : ln
      )
    );
  };

  // ------------------------
  // 8) Agregar línea vacía
  // ------------------------
  const addLinea = () => {
    setLineas(l => [
      ...l,
      { producto_id: '', cantidad: '', precio_unitario: '', descuento: '' }
    ]);
  };

  // ----------------------
  // 9) Eliminar una línea
  // ----------------------
  const removeLinea = idx => {
    setLineas(l => l.filter((_, i) => i !== idx));
  };

  // ------------------------------------------------
  // 10) Calcular subtotal de una línea (sin impuesto)
  // ------------------------------------------------
  const calcularSubtotal = ln => {
    const c    = Number(ln.cantidad) || 0;
    const pu   = Number(ln.precio_unitario) || 0;
    const desc = Number(ln.descuento) || 0;
    return c * pu - desc;
  };

  // ---------------------------------------
  // 11) Calcular total de la venta
  // ---------------------------------------
  const totalVenta = (lineas || []).reduce(
    (sum, ln) => sum + calcularSubtotal(ln),
    0
  );

  // ------------------------------------------------
  // 12) Enviar formulario: crear o actualizar venta
  // ------------------------------------------------
  const handleSubmit = async e => {
    e.preventDefault();

    // Validar que haya al menos una línea
    if (!Array.isArray(lineas) || lineas.length === 0) {
      alert('Debe agregar al menos una línea');
      return;
    }

    // Validar cada línea (producto, cantidad > 0, precio > 0)
    for (const ln of lineas) {
      if (
        !ln.producto_id ||
        Number(ln.cantidad) <= 0 ||
        Number(ln.precio_unitario) <= 0
      ) {
        alert(
          'Cada línea requiere un producto, cantidad mayor a 0 y precio unitario mayor a 0'
        );
        return;
      }
    }

    // Construir payload sin campo impuesto (tu tabla no tiene impuesto)
    const payload = {
      codigo: cabecera.codigo,
      cliente_id: Number(cabecera.cliente_id),
      estado: cabecera.estado,
      lineas: lineas.map(ln => ({
        producto_id: Number(ln.producto_id),
        cantidad: Number(ln.cantidad),
        precio_unitario: Number(ln.precio_unitario),
        descuento: Number(ln.descuento) || 0
      }))
    };

    try {
      if (id) {
        await updateVenta(id, payload);
      } else {
        await createVenta(payload);
      }
      nav('/ventas');
    } catch (err) {
      console.error('Error guardando venta', err.response?.data || err);
      alert('Hubo un error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          {id ? 'Editar Venta' : 'Nueva Venta'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {/* ======= CABECERA ======= */}
            <Grid container spacing={2}>
              {/* Código */}
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

              {/* Cliente */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Cliente"
                  name="cliente_id"
                  value={cabecera.cliente_id}
                  onChange={handleCabeceraChange}
                  required
                  fullWidth
                >
                  {/* Mapear sobre (clientes || []) para evitar undefined */}
                  {(clientes || []).map(c => (
                    <MenuItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Estado */}
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Estado"
                  name="estado"
                  value={cabecera.estado}
                  onChange={handleCabeceraChange}
                  fullWidth
                >
                  <MenuItem value="pendiente">pendiente</MenuItem>
                  <MenuItem value="pagada">pagada</MenuItem>
                  <MenuItem value="cancelada">cancelada</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* ======= LÍNEAS DE VENTA ======= */}
            <Typography variant="h6" mt={2}>
              Líneas de Venta
            </Typography>
            {(lineas || []).map((ln, idx) => (
              <Paper
                key={idx}
                sx={{ p: 2, mb: 1, position: 'relative' }}
              >
                {/* Botón para eliminar esta línea */}
                <IconButton
                  size="small"
                  onClick={() => removeLinea(idx)}
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                >
                  <RemoveCircle color="error" />
                </IconButton>

                <Grid container spacing={2}>
                  {/* Producto */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      label="Producto"
                      name="producto_id"
                      value={ln.producto_id}
                      onChange={e =>
                        handleProductoSelect(idx, e.target.value)
                      }
                      required
                      fullWidth
                    >
                      {(productos || []).map(p => (
                        <MenuItem
                          key={p.id}
                          value={p.id.toString()}
                        >
                          {p.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Cantidad */}
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

                  {/* Precio Unitario (auto‐llenado según producto) */}
                  <Grid item xs={6} md={2}>
                    <TextField
                      label="Precio Unit."
                      name="precio_unitario"
                      type="number"
                      inputProps={{ step: '0.01' }}
                      value={ln.precio_unitario}
                      onChange={e => handleLineaChange(idx, e)}
                      required
                      fullWidth
                    />
                  </Grid>

                  {/* Descuento */}
                  <Grid item xs={6} md={2}>
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

                  {/* Subtotal */}
                  <Grid item xs={6} md={2}>
                    <TextField
                      label="Subtotal"
                      name="subtotal"
                      type="number"
                      value={calcularSubtotal(ln).toFixed(2)}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {/* Botón “Agregar Línea” */}
            <Button
              variant="outlined"
              startIcon={<AddCircle />}
              onClick={addLinea}
            >
              Agregar Línea
            </Button>

            {/* ======= TOTAL DE LA VENTA ======= */}
            <Typography variant="h6" align="right" mt={2}>
              Total de la Venta: $ {totalVenta.toFixed(2)}
            </Typography>

            {/* ======= BOTONES DE ACCIÓN ======= */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => nav('/ventas')}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="contained">
                {id ? 'Actualizar Venta' : 'Guardar Venta'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
