// frontend/src/pages/Reportes.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Paper, Stack, TextField, Button, Tabs, Tab, Grid, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DataTable from '../components/DataTable';
import {
  fetchSalesReport, downloadSalesCsv,
  fetchKpis, fetchSalesByDay, fetchSalesByProduct, fetchSalesByCategory,
  fetchSalesByClient, fetchSalesByUser,
  fetchInventory, fetchLowStock,
  downloadInventoryCsv, downloadLowStockCsv,
  downloadCsvGeneric
} from '../api/reports';
import { useLoading } from '../contexts/LoadingContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid, PieChart, Pie, Legend } from 'recharts';

const currency = (n) => (n==null ? '—' : new Intl.NumberFormat('es-SV',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n)));

function KpiCard({ title, value }) {
  return (
    <Paper sx={{ p:2, borderRadius:3, boxShadow:3 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5" sx={{ mt:0.5 }}>{value ?? '—'}</Typography>
    </Paper>
  );
}

export default function Reportes() {
  // OJO: exponé stop en el contexto para poder “resetear” defensivamente
  const { withLoader, stop } = useLoading();
  const reqIdRef = useRef(0);
  const mountedRef = useRef(false);
  const didMount = useRef(false);

  // ---- util robusto: timeout SIN “unhandled rejections” ----
  const SAFE_TIMEOUT_MS = 20000;
  const withTimeout = (promise, ms, label='task') =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout ${label} después de ${ms}ms`)), ms);
      promise.then(
        v => { clearTimeout(t); resolve(v); },
        e => { clearTimeout(t); reject(e); }
      );
    });
  const logSettledErrors = (results, scope) => {
    const errs = results.filter(r => r.status === 'rejected');
    if (errs.length) console.error(`[Reportes] Errores en ${scope}:`, errs.map(e => e.reason));
  };

  // filtros
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [estado, setEstado] = useState('pagada');
  const TZ = '-06:00';

  // ventas
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  // datasets
  const [kpis, setKpis] = useState(null);
  const [byDay, setByDay] = useState([]);
  const [byProduct, setByProduct] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byClient, setByClient] = useState([]);
  const [byUser, setByUser] = useState([]);

  // inventario (paginado)
  const [inventoryRows, setInventoryRows] = useState([]);
  const [invPage, setInvPage] = useState(1);
  const [invPageSize] = useState(50);
  const [invTotal, setInvTotal] = useState(0);

  // bajo stock (paginado)
  const [lowRows, setLowRows] = useState([]);
  const [lowPage, setLowPage] = useState(1);
  const [lowPageSize] = useState(50);
  const [lowTotal, setLowTotal] = useState(0);
  const [threshold, setThreshold] = useState(2);

  const [tab, setTab] = useState('ventas');

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(new Blob([blob], { type:'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const paramsAgg = () => ({ from: from||undefined, to: to||undefined, estado, tz: TZ });

  // cargas sin overlay (paginación fluida)
  const loadSales = async (rid) => {
    const r = await fetchSalesReport({ page, pageSize, ...paramsAgg() });
    if (rid && rid !== reqIdRef.current) return;
    setRows(r.rows); setTotal(r.total);
  };
  const loadInventory = async (rid) => {
    const r = await fetchInventory({ page: invPage, pageSize: invPageSize });
    if (rid && rid !== reqIdRef.current) return;
    setInventoryRows(r.rows); setInvTotal(r.total);
  };
  const loadLowStock = async (rid) => {
    const r = await fetchLowStock({ threshold, page: lowPage, pageSize: lowPageSize });
    if (rid && rid !== reqIdRef.current) return;
    setLowRows(r.rows); setLowTotal(r.total);
  };
  const reloadAgg = async (rid) => {
    const p = paramsAgg();
    const res = await Promise.allSettled([
      fetchKpis(p), fetchSalesByDay(p), fetchSalesByProduct(p),
      fetchSalesByCategory(p), fetchSalesByClient(p), fetchSalesByUser(p)
    ]);
    if (rid && rid !== reqIdRef.current) return;
    const [k, d, pr, cat, cli, usr] = res.map(r => (r.status === 'fulfilled' ? r.value : undefined));
    setKpis(k ?? null);
    setByDay(d ?? []);
    setByProduct(pr ?? []);
    setByCategory(cat ?? []);
    setByClient(cli ?? []);
    setByUser(usr ?? []);
    logSettledErrors(res, 'reloadAgg');
  };

  // carga visible con overlay
  const loadAll = async () => {
    const rid = ++reqIdRef.current;
    try {
      await withLoader(async () => {
        const results = await Promise.allSettled([
          withTimeout(loadSales(rid), SAFE_TIMEOUT_MS, 'ventas'),
          withTimeout(reloadAgg(rid), SAFE_TIMEOUT_MS, 'agregados'),
          withTimeout(loadInventory(rid), SAFE_TIMEOUT_MS, 'inventario'),
          withTimeout(loadLowStock(rid), SAFE_TIMEOUT_MS, 'bajo_stock'),
        ]);
        logSettledErrors(results, 'loadAll');
      });
    } finally {
      // Kill-switch defensivo: por si el contador quedó desbalanceado desde otra pantalla
      stop?.();
    }
  };

  // mount: resetea overlay heredado y carga
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    stop?.();         // apaga overlay heredado si venías de otra ruta con loader activo
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // paginación sin overlay
  useEffect(() => { if (!didMount.current) { didMount.current = true; return; } loadSales(); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { loadInventory(); /* eslint-disable-next-line */ }, [invPage]);
  useEffect(() => { loadLowStock(); /* eslint-disable-next-line */ }, [lowPage, threshold]);

  const onApply = async () => {
    setPage(1); setInvPage(1); setLowPage(1);
    await loadAll();
  };

  const columns = useMemo(()=>[
    { Header:'ID', accessor:'id' },
    { Header:'Código', accessor:'codigo' },
    { Header:'Fecha', accessor:'fecha' },
    { Header:'Total', accessor:'total_venta', Cell: ({value}) => currency(value) },
    { Header:'Cliente', accessor:'cliente' },
    { Header:'Usuario', accessor:'usuario' },
  ],[]);

  const Presets = () => (
    <Stack direction="row" spacing={1}>
      <Button size="small" onClick={()=>{ const t=new Date().toISOString().slice(0,10); setFrom(t); setTo(t); }}>Hoy</Button>
      <Button size="small" onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-6); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10)); }}>7d</Button>
      <Button size="small" onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-29); setFrom(d.toISOString().slice(0,10)); setTo(new Date().toISOString().slice(0,10)); }}>30d</Button>
      <Button size="small" onClick={()=>{ setFrom(''); setTo(''); }}>Clear</Button>
    </Stack>
  );

  return (
    <Container sx={{ mt:4, pb:4 }}>
      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={6} md={3}><KpiCard title="Total ventas" value={currency(kpis?.total_ventas)} /></Grid>
        <Grid item xs={6} md={3}><KpiCard title="Tickets" value={kpis?.tickets} /></Grid>
        <Grid item xs={6} md={3}><KpiCard title="Ticket promedio" value={currency(kpis?.ticket_promedio)} /></Grid>
        <Grid item xs={6} md={3}><KpiCard title="Clientes únicos" value={kpis?.clientes_unicos} /></Grid>
      </Grid>

      {/* Toolbar filtros */}
      <Paper sx={{ p:2, mb:2, position:'sticky', top:64, zIndex:1 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
          <TextField label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }} value={from} onChange={(e)=>setFrom(e.target.value)} />
          <TextField label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }} value={to} onChange={(e)=>setTo(e.target.value)} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado (pago)</InputLabel>
            <Select label="Estado (pago)" value={estado} onChange={(e)=>setEstado(e.target.value)}>
              <MenuItem value="pagada">Pagada</MenuItem>
              <MenuItem value="pendiente">Pendiente</MenuItem>
              <MenuItem value="cancelada">Cancelada</MenuItem>
              <MenuItem value="todas">Todas</MenuItem>
            </Select>
          </FormControl>
          <Presets />
          <Button variant="contained" onClick={onApply}>Aplicar</Button>
          <Button variant="outlined" onClick={async ()=>{
            await withLoader(async ()=>{
              const blob = await withTimeout(downloadSalesCsv({ ...paramsAgg() }), SAFE_TIMEOUT_MS, 'csv ventas');
              triggerDownload(blob, 'sales_report.csv');
            });
            stop?.(); // defensa adicional
          }}>Exportar CSV</Button>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb:2 }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
          <Tab label="VENTAS" value="ventas" />
          <Tab label="POR DÍA" value="dia" />
          <Tab label="POR PRODUCTO" value="prod" />
          <Tab label="POR CATEGORÍA" value="cat" />
          <Tab label="POR CLIENTE" value="cli" />
          <Tab label="POR USUARIO" value="usr" />
          <Tab label="INVENTARIO" value="inv" />
          <Tab label="BAJO STOCK" value="low" />
        </Tabs>
      </Paper>

      {/* Ventas */}
      {tab==='ventas' && (
        <Paper>
          <DataTable
            rows={rows}
            columns={columns}
            pagination={{ page, pageSize, total, onPageChange:setPage }}
            showActions={false}
          />
        </Paper>
      )}

      {/* Por día */}
      {tab==='dia' && (
        <Paper sx={{ p:2 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Por producto */}
      {tab==='prod' && (
        <Paper sx={{ p:2 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb:1 }}>
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadCsvGeneric('/sales-by-product.csv', paramsAgg()), SAFE_TIMEOUT_MS, 'csv por producto');
                triggerDownload(blob, 'sales_by_product.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={byProduct}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nombre" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingreso" name="Ingreso" />
              <Bar dataKey="unidades" name="Unidades" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Por categoría */}
      {tab==='cat' && (
        <Paper sx={{ p:2 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb:1 }}>
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadCsvGeneric('/sales-by-category.csv', paramsAgg()), SAFE_TIMEOUT_MS, 'csv por categoría');
                triggerDownload(blob, 'sales_by_category.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie data={byCategory} dataKey="ingreso" nameKey="categoria" outerRadius={120} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Por cliente */}
      {tab==='cli' && (
        <Paper sx={{ p:2 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb:1 }}>
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadCsvGeneric('/sales-by-client.csv', paramsAgg()), SAFE_TIMEOUT_MS, 'csv por cliente');
                triggerDownload(blob, 'sales_by_client.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={byClient}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cliente" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingreso" name="Ingreso" />
              <Bar dataKey="tickets" name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Por usuario */}
      {tab==='usr' && (
        <Paper sx={{ p:2 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mb:1 }}>
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadCsvGeneric('/sales-by-user.csv', paramsAgg()), SAFE_TIMEOUT_MS, 'csv por usuario');
                triggerDownload(blob, 'sales_by_user.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={byUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="usuario" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ingreso" name="Ingreso" />
              <Bar dataKey="tickets" name="Tickets" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Inventario */}
      {tab==='inv' && (
        <Paper sx={{ p:2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb:1 }}>
            <Typography variant="h6">Inventario (valuación)</Typography>
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadInventoryCsv(), SAFE_TIMEOUT_MS, 'csv inventario');
                triggerDownload(blob, 'inventory.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <DataTable
            rows={inventoryRows}
            columns={[
              { Header:'ID', accessor:'id' },
              { Header:'Producto', accessor:'nombre' },
              { Header:'Stock', accessor:'stock' },
              { Header:'Precio', accessor:'precio_venta', Cell: ({value})=>currency(value) },
              { Header:'Costo prom.', accessor:'costo_promedio', Cell: ({value})=>currency(value) },
              { Header:'Valuación', accessor:'valuacion', Cell: ({value})=>currency(value) },
            ]}
            pagination={{ page: invPage, pageSize: invPageSize, total: invTotal, onPageChange:setInvPage }}
            showActions={false}
          />
        </Paper>
      )}

      {/* Bajo stock */}
      {tab==='low' && (
        <Paper sx={{ p:2 }}>
          <Stack direction={{xs:'column', sm:'row'}} spacing={2} alignItems="center" sx={{ mb:1 }}>
            <Typography variant="h6" sx={{ flexGrow:1 }}>Bajo stock (≤ {threshold})</Typography>
            <TextField
              label="Umbral"
              type="number"
              size="small"
              value={threshold}
              onChange={(e)=>{ setLowPage(1); setThreshold(Math.max(0, Number(e.target.value)||0)); }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 120 }}
            />
            <Button size="small" onClick={async ()=>{
              await withLoader(async ()=>{
                const blob = await withTimeout(downloadLowStockCsv({ threshold }), SAFE_TIMEOUT_MS, 'csv bajo stock');
                triggerDownload(blob, 'low_stock.csv');
              });
              stop?.();
            }}>CSV</Button>
          </Stack>
          <DataTable
            rows={lowRows}
            columns={[
              { Header:'ID', accessor:'id' },
              { Header:'Producto', accessor:'nombre' },
              { Header:'Stock', accessor:'stock' },
            ]}
            pagination={{ page: lowPage, pageSize: lowPageSize, total: lowTotal, onPageChange:setLowPage }}
            showActions={false}
          />
        </Paper>
      )}
    </Container>
  );
}
