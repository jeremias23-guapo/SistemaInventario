// src/utils/pdfHelpers.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarVentaPDF = (venta, productosMap = {}) => {
  if (!venta) return;

  const doc = new jsPDF();
  const formatoFecha = fechaStr => new Date(fechaStr).toLocaleString();

  // ====== ENCABEZADO ======
  doc.setFontSize(18);
  doc.text(`Detalle de Venta #${venta.id}`, 14, 18);
  doc.setFontSize(11);

  autoTable(doc, {
    startY: 24,
    body: [
      ['Código', venta.codigo || '—'],
      ['Cliente', venta.cliente_nombre || '—'],
      ['Fecha', formatoFecha(venta.fecha)],
      ['Método de pago', venta.metodo_pago || '—'],
      ['Estado pago', venta.estado_pago || '—'],
      ['Estado envío', venta.estado_envio || '—'],
      ['Estado venta', venta.estado_venta || '—'],
      ['Transportista', venta.transportista_nombre || '—'],
      ['Comisión transportista', `$ ${Number(venta.transportista_comision || 0).toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  // ====== DETALLE DE PRODUCTOS ======
  const body = (venta.lineas || []).map(ln => ([
    ln.detalle_id,
    ln.producto_nombre || productosMap[ln.producto_id] || `ID ${ln.producto_id}`,
    ln.cantidad,
    `$ ${Number(ln.precio_unitario).toFixed(2)}`,
    `$ ${Number(ln.descuento || 0).toFixed(2)}`,
    `$ ${Number(ln.subtotal).toFixed(2)}`
  ]));

  const startY = (doc.lastAutoTable?.finalY || 50) + 8;

  autoTable(doc, {
    startY,
    head: [['ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Descuento', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    styles: { fontSize: 10 },
  });

  // ====== TOTALES ======
  const endY = (doc.lastAutoTable?.finalY || startY) + 10;
  doc.setFontSize(12);
  doc.text(`Total bruto: $ ${Number(venta.total_venta).toFixed(2)}`, 14, endY);
  doc.text(
    `Total neto: $ ${Number(venta.total_venta_neta || (venta.total_venta - (venta.transportista_comision || 0))).toFixed(2)}`,
    14,
    endY + 6
  );

  // ====== DESCARGA ======
  doc.save(`venta_${venta.codigo || venta.id}.pdf`);
};
