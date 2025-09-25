import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    duration: 3000,
    anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
  });

  const showToast = useCallback(({ message, severity = 'info', duration = 3000, anchorOrigin }) => {
    setOpts(o => ({
      ...o,
      message,
      severity,
      duration,
      anchorOrigin: anchorOrigin || o.anchorOrigin
    }));
    setOpen(true);
  }, []);

  const close = () => setOpen(false);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={opts.duration}
        onClose={close}
        anchorOrigin={opts.anchorOrigin}
      >
        <Alert onClose={close} severity={opts.severity} variant="filled">
          {opts.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
