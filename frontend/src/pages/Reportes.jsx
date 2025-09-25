// frontend/src/pages/Reportes.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Paper, Stack, TextField, Button, Tabs, Tab, Grid, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DataTable from '../components/DataTable';
import { useLoading } from '../contexts/LoadingContext';
import {
  fetchSalesReport, downloadSalesCsv,
  fetchKpis, fetchSalesByDay, fetchSalesByProduct, fetchSalesByCategory,
  fetchSalesByClient, fetchSalesByUser,
  fetchInventory, fetchLowStock, fetchMovements,
  downloadCsvGeneric
} from '../api/reports';
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
  const { start, stop } = useLoading();

  // filtros
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [estado, setEstado] = useState('pagada'); // pagada | pendiente | cancelada | todas
  const TZ = '-06:00';

  // ventas (tabla)
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
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [movs, setMovs] = useState([]);

  const [tab, setTab] = useState('ventas');
  const didMount = useRef(false);

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(new Blob([blob], { type:'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };
  const paramsAgg = () => ({ from: from||undefined, to: to||undefined, estado, tz: TZ });

  const loadSales = async () => {
    const r = await fetchSalesReport({ page, pageSize, ...paramsAgg() });
    setRows(r.rows); setTotal(r.total);
  };
  const reloadAgg = async () => {
    const p = paramsAgg();
    const [k, d, pr, cat, cli, usr] = await Promise.all([
      fetchKpis(p), fetchSalesByDay(p), fetchSalesByProduct(p),
      fetchSalesByCategory(p), fetchSalesByClient(p), fetchSalesByUser(p)
    ]);
    setKpis(k); setByDay(d); setByProduct(pr); setByCategory(cat); setByClient(cli); setByUser(usr);
  };
  const loadInventory = async () => setInventory(await fetchInventory());
  const loadLowStock = async (threshold=2) => setLowStock(await fetchLowStock({ threshold }));
  const loadMovs = async () => setMovs(await fetchMovements({ from: from||undefined, to: to||undefined }));

  const loadAll = async () => {
    start();
    try { await Promise.all([loadSales(), reloadAgg(), loadInventory(), loadLowStock(), loadMovs()]); }
    finally { (()=>stop())(); }
  };

  useEffect(() => { try { stop(); } catch(_){} loadAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (!didMount.current) { didMount.current = true; return; } loadSales(); /* eslint-disable-next-line */ }, [page]);

  const onApply = () => { setPage(1); loadAll(); };

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

      {/* Toolbar */}
      <Paper sx={{ p:2, mb:2, position:'sticky', top:64, zIndex:1 }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
          <TextField label="Desde" type="date" size="small" InputLabelProps={{ shrink: true }} value={from} onChange={e=>setFrom(e.target.value)} />
          <TextField label="Hasta" type="date" size="small" InputLabelProps={{ shrink: true }} value={to} onChange={e=>setTo(e.target.value)} />
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
            start();
            try {
              const blob = await downloadSalesCsv({ ...paramsAgg() });
              triggerDownload(blob, 'sales_report.csv');
            } finally { (()=>stop())(); }
          }}>Exportar CSV</Button>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb:2 }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} variant="scrollable" scrollButtons allowScrollButtonsMobile>
          <Tab label="Ventas" value="ventas" />
          <Tab label="Por día" value="dia" />
          <Tab label="Por producto" value="prod" />
          <Tab label="Por categoría" value="cat" />
          <Tab label="Por cliente" value="cli" />
          <Tab label="Por usuario" value="usr" />
          <Tab label="Inventario" value="inv" />
          <Tab label="Bajo stock" value="low" />
          <Tab label="Movimientos" value="mov" />
        </Tabs>
      </Paper>

      {/* Contenido: ventas */}
      {tab==='ventas' && (
        <Paper>
          <DataTable rows={rows} columns={columns} pagination={{ page, pageSize, total, onPageChange:setPage }} />
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
              start();
              try {
                const blob = await downloadCsvGeneric('/sales-by-product.csv', paramsAgg());
                triggerDownload(blob, 'sales_by_product.csv');
              } finally { (()=>stop())(); }
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
              start();
              try {
                const blob = await downloadCsvGeneric('/sales-by-category.csv', paramsAgg());
                triggerDownload(blob, 'sales_by_category.csv');
              } finally { (()=>stop())(); }
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
              start();
              try {
                const blob = await downloadCsvGeneric('/sales-by-client.csv', paramsAgg());
                triggerDownload(blob, 'sales_by_client.csv');
              } finally { (()=>stop())(); }
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
              start();
              try {
                const blob = await downloadCsvGeneric('/sales-by-user.csv', paramsAgg());
                triggerDownload(blob, 'sales_by_user.csv');
              } finally { (()=>stop())(); }
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
          <Typography variant="h6" sx={{ mb:1 }}>Inventario (valuación)</Typography>
          <DataTable rows={inventory} columns={[
            { Header:'ID', accessor:'id' },
            { Header:'Producto', accessor:'nombre' },
            { Header:'Stock', accessor:'stock' },
            { Header:'Precio', accessor:'precio_venta', Cell: ({value})=>currency(value) },
            { Header:'Costo prom.', accessor:'costo_promedio', Cell: ({value})=>currency(value) },
            { Header:'Valuación', accessor:'valuacion', Cell: ({value})=>currency(value) },
          ]} />
        </Paper>
      )}

      {/* Bajo stock */}
      {tab==='low' && (
        <Paper sx={{ p:2 }}>
          <Typography variant="h6" sx={{ mb:1 }}>Bajo stock (≤ 2)</Typography>
          <DataTable rows={lowStock} columns={[
            { Header:'ID', accessor:'id' },
            { Header:'Producto', accessor:'nombre' },
            { Header:'Stock', accessor:'stock' },
          ]} />
        </Paper>
      )}

      {/* Movimientos */}
      {tab==='mov' && (
        <Paper sx={{ p:2 }}>
          <Typography variant="h6" sx={{ mb:1 }}>Movimientos</Typography>
          <DataTable rows={movs} columns={[
            { Header:'ID', accessor:'id_transaccion' },
            { Header:'Producto', accessor:'nombre' },
            { Header:'Tipo', accessor:'tipo_transaccion' },
            { Header:'Fecha', accessor:'fecha_transaccion' },
            { Header:'Precio', accessor:'precio_transaccion', Cell: ({value})=>currency(value) },
            { Header:'Cantidad', accessor:'cantidad_transaccion' },
          ]} />
        </Paper>
      )}
    </Container>
  );
}
