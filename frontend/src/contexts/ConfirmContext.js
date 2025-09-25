import React, { createContext, useContext, useRef, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button
} from '@mui/material';

const ConfirmContext = createContext(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  return ctx;
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: '¿Estás seguro?',
    content: 'Esta acción no se puede deshacer.',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    // 'primary' | 'error' | 'warning' | 'success' | 'info' (MUI color)
    confirmColor: 'error',
    dismissible: true, // cerrar con ESC / backdrop
  });
  const resolverRef = useRef(null);

  const confirm = (opts = {}) =>
    new Promise((resolve) => {
      resolverRef.current = resolve;
      setState(s => ({ ...s, open: true, ...opts }));
    });

  const handleClose = (answer) => {
    if (resolverRef.current) {
      resolverRef.current(answer);
      resolverRef.current = null;
    }
    setState(s => ({ ...s, open: false }));
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        onClose={state.dismissible ? () => handleClose(false) : undefined}
        aria-labelledby="confirm-dialog-title"
      >
        {state.title && <DialogTitle id="confirm-dialog-title">{state.title}</DialogTitle>}
        {state.content && (
          <DialogContent>
            <DialogContentText>{state.content}</DialogContentText>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => handleClose(false)}>{state.cancelText}</Button>
          <Button
            onClick={() => handleClose(true)}
            variant="contained"
            color={state.confirmColor}
          >
            {state.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
