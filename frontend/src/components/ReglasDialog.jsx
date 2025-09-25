// frontend/components/ReglasDialog.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, FormControlLabel, Switch, MenuItem, Typography
} from '@mui/material';
import { fetchReglas, upsertRegla, deleteRegla } from '../api/transportistas';
import { useLoading } from '../contexts/LoadingContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

const METODOS = ['transferencia','contra_entrega'];

export default function ReglasDialog({ open, onClose, transportista }) {
  const { start, stop } = useLoading();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [reglas, setReglas] = useState([]);
  const [mp, setMp] = useState('contra_entrega');

  const load = async () => {
    if (!transportista?.id) return;
    try {
      start();
      const list = await fetchReglas(transportista.id);
      setReglas(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      showToast({ message: 'No se pudieron cargar las reglas', severity: 'error' });
    } finally {
      stop();
    }
  };
  useEffect(() => { if (open && transportista?.id) load(); /* eslint-disable-next-line */ }, [open, transportista?.id]);

  const currentRegla = useMemo(() =>
    reglas.find(r => r.metodo_pago === mp) || {
      metodo_pago: mp, porcentaje: 0, fijo_usd: 0, umbral_monto: '', aplica_si_menor_que: 0
    }, [reglas, mp]);

  const updateLocal = (key, val) => {
    setReglas(prev => {
      const exists = prev.some(x => x.metodo_pago === mp);
      return exists
        ? prev.map(x => x.metodo_pago === mp ? { ...x, [key]: val } : x)
        : [...prev, { ...currentRegla, [key]: val }];
    });
  };

  const save = async () => {
    // 🟡 Confirmar antes de guardar
    const ok = await confirm({
      title: 'Confirmar cambios',
      content: '¿Estás seguro de realizar los cambios?',
      confirmText: 'Sí, guardar',
      cancelText: 'Cancelar',
      confirmColor: 'warning',
    });
    if (!ok) return;

    try {
      start();
      const r = reglas.find(x => x.metodo_pago === mp) || currentRegla;
      await upsertRegla(transportista.id, {
        metodo_pago: mp,
        porcentaje: Number(r.porcentaje || 0),
        fijo_usd: Number(r.fijo_usd || 0),
        umbral_monto: r.umbral_monto === '' || r.umbral_monto == null ? null : Number(r.umbral_monto),
        aplica_si_menor_que: Number(!!r.aplica_si_menor_que),
      });
      showToast({ message: 'Cambios guardados', severity: 'success' });

      // ✅ “Regresar” al formulario/lista de transportistas = cerrar el diálogo
      onClose?.();
    } catch (e) {
      console.error(e);
      showToast({ message: 'No se pudo guardar la regla', severity: 'error' });
    } finally {
      stop();
    }
  };

  const remove = async () => {
    const existing = reglas.find(x => x.metodo_pago === mp);
    if (!existing?.id) {
      showToast({ message: 'No hay regla para eliminar en este método', severity: 'info' });
      return;
    }
    const ok = await confirm({
      title: 'Eliminar regla',
      content: '¿Seguro que quieres eliminar esta regla?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      confirmColor: 'error',
    });
    if (!ok) return;

    try {
      start();
      await deleteRegla(existing.id);
      showToast({ message: 'Regla eliminada', severity: 'success' });
      await load();
    } catch (e) {
      console.error(e);
      showToast({ message: 'No se pudo eliminar la regla', severity: 'error' });
    } finally {
      stop();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Reglas · {transportista?.nombre}</DialogTitle>
      <DialogContent>
        <TextField select label="Método de pago" value={mp} onChange={e=>setMp(e.target.value)} fullWidth margin="dense">
          {METODOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
        </TextField>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="% comisión (0.04 = 4%)"
              value={currentRegla.porcentaje}
              onChange={e=>updateLocal('porcentaje', e.target.value)}
              fullWidth type="number" inputProps={{ step: '0.0001' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fijo USD"
              value={currentRegla.fijo_usd}
              onChange={e=>updateLocal('fijo_usd', e.target.value)}
              fullWidth type="number" inputProps={{ step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Umbral (ej: 25.00)"
              value={currentRegla.umbral_monto ?? ''}
              onChange={e=>updateLocal('umbral_monto', e.target.value)}
              fullWidth type="number" inputProps={{ step: '0.01' }}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display:'flex', alignItems:'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!currentRegla.aplica_si_menor_que}
                  onChange={e=>updateLocal('aplica_si_menor_que', e.target.checked ? 1 : 0)}
                />
              }
              label="Aplicar fijo si total < umbral"
            />
          </Grid>
        </Grid>

        <Typography variant="body2" sx={{ mt:1 }}>
          Ejemplo: contra_entrega con 4% y si total &lt; 25 aplicar $1 fijo (pon 0.04, 1.00, 25.00 y activa el switch).
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={remove} color="error">Eliminar regla</Button>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="contained" onClick={save}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
