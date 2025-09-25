// frontend/components/TransportistaForm.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Switch
} from '@mui/material';

export default function TransportistaForm({ open, initial, onSave, onClose }) {
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    setNombre(initial?.nombre || '');
    setActivo(typeof initial?.activo === 'boolean' ? initial.activo : true);
  }, [initial]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>{initial ? 'Editar Transportista' : 'Nuevo Transportista'}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="dense"
          label="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          autoFocus
          required
        />
        <FormControlLabel
          control={<Switch checked={activo} onChange={e => setActivo(e.target.checked)} />}
          label="Activo"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => onSave({ nombre: nombre.trim(), activo })}
          disabled={!nombre.trim()}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
