// src/utils/alerts.js
import Swal from 'sweetalert2';

/** Base toast estilo “snackbar” (discreto y consistente en toda la app) */
const baseToast = (opts = {}) =>
  Swal.fire({
    toast: true,
    position: 'bottom',   // bottom-center (estilo de tu screenshot)
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (el) => {
      el.style.marginBottom = '18px';
      el.style.minWidth = '320px';
      el.style.maxWidth = '520px';
      el.style.textAlign = 'left';
    },
    ...opts,
  });

/** Variantes rápidas */
export const toast = {
  info:   (title, text, extra = {}) => baseToast({ icon: 'info',    title, text, ...extra }),
  ok:     (title, text, extra = {}) => baseToast({ icon: 'success', title, text, ...extra }),
  warn:   (title, text, extra = {}) => baseToast({ icon: 'warning', title, text, ...extra }),
  error:  (title, text, extra = {}) => baseToast({ icon: 'error',   title, text, ...extra }),
};

/** Modal compacto (cuando necesitas botón OK) */
export const modal = (opts = {}) =>
  Swal.fire({
    width: 380,
    backdrop: 'rgba(0,0,0,0.25)',
    confirmButtonText: 'OK',
    ...opts,
  });

/** Confirmación con OK/Cancelar (devuelve true/false) */
export const confirm = async (opts = {}) => {
  const res = await Swal.fire({
    icon: opts.icon ?? 'question',
    title: opts.title ?? '¿Confirmar?',
    text: opts.text ?? '',
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? 'Sí',
    cancelButtonText: opts.cancelText ?? 'Cancelar',
    reverseButtons: true,
    ...opts,
  });
  return Boolean(res.isConfirmed);
};

/** Loading global sencillo (útil para operaciones largas) */
export const loading = {
  show: (title = 'Procesando...') =>
    Swal.fire({
      title,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    }),
  hide: () => Swal.close(),
};
