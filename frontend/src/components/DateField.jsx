//para formatear fechas

import React from 'react';
import { formatDateSV } from '../utils/date';

export default function DateField({ value, empty = '—' }) {
  const text = value ? formatDateSV(value) : empty;
  return <span>{text}</span>;
}
