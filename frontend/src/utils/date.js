// frontend/src/utils/date.js
export const SV_TZ = 'America/El_Salvador';

/** Normaliza strings de MySQL/ISO a un Date en UTC */
export const toUtcDate = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  const isoUtc = s.endsWith('Z') ? s : (s.includes('T') ? s + 'Z' : s.replace(' ', 'T') + 'Z');
  const d = new Date(isoUtc);
  return isNaN(d) ? null : d;
};

/** Muestra en hora local de El Salvador (read-only) */
export const formatDateSV = (value, opts = {}) => {
  const d = value instanceof Date ? value : toUtcDate(value);
  if (!d) return '—';
  return new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: SV_TZ,
    ...opts,
  }).format(d);
};

/** Para formularios: Date (UTC) -> string local 'YYYY-MM-DDTHH:mm' (para <input type="datetime-local">) */
export const toLocalInputValue = (value) => {
  const d = value instanceof Date ? value : toUtcDate(value);
  if (!d) return '';
  const pad = n => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
};

/** Inverso para enviar al backend: string local -> ISO UTC con Z */
export const localInputToIsoUtc = (localStr) => {
  if (!localStr) return null; // 'YYYY-MM-DDTHH:mm'
  const dLocal = new Date(localStr); // interpreta como local del navegador
  return new Date(dLocal.getTime() - dLocal.getTimezoneOffset() * 60000).toISOString();
};

/** Para búsqueda por día: normaliza a 'YYYY-MM-DD' */
export const toYMD = (value) => {
  const d = toUtcDate(value);
  return d ? d.toISOString().slice(0, 10) : '';
};
