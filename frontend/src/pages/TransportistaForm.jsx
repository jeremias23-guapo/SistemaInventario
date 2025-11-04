// frontend/components/TransportistaForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material';

export default function TransportistaForm({ open, initial, onSave, onClose }) {
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [precioEnvio, setPrecioEnvio] = useState(0);

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setActivo(typeof initial?.activo === 'boolean' ? initial.activo : true);
    setPrecioEnvio(initial?.precio_envio ?? 0);
  }, [initial]);

  const handleSave = () => {
    onSave({
      nombre: nombre.trim(),
      activo,
      precio_envio: parseFloat(precioEnvio) || 0,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {initial ? 'Editar Transportista' : 'Nuevo Transportista'}
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="dense"
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          autoFocus
          required
        />

        <TextField
          fullWidth
          margin="dense"
          label="Precio de Envío (USD)"
          type="number"
          inputProps={{ min: 0, step: 0.01 }}
          value={precioEnvio}
          onChange={(e) => setPrecioEnvio(e.target.value)}
          required
        />

        <FormControlLabel
          control={
            <Switch
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
            />
          }
          label="Activo"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!nombre.trim()}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
