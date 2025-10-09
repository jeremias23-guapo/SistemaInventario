import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarOrdenCompraPDF = (orden) => {
  if (!orden) return;

  const doc = new jsPDF();
  const formatoFecha = fechaStr => new Date(fechaStr).toLocaleString();

  // ====== ENCABEZADO ======
  doc.setFontSize(18);
  doc.text(`Detalle de Orden de Compra #${orden.id}`, 14, 18);
  doc.setFontSize(11);

  const totalOrden = Number(orden.total_orden || 0);

  autoTable(doc, {
    startY: 24,
    body: [
      ['Código', orden.codigo || '—'],
      ['Proveedor', orden.proveedor_nombre || '—'],
      ['Fecha', formatoFecha(orden.fecha)],
      ['Estado', orden.estado || '—'],
      ['Total orden', `$ ${totalOrden.toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  // ====== DETALLE DE LÍNEAS ======
  const body = (orden.lineas || []).map(ln => ([
    ln.id,
    ln.producto?.nombre ?? `ID ${ln.producto?.id ?? ln.producto_id}`,
    ln.cantidad,
    `$ ${Number(ln.precio_unitario).toFixed(2)}`,
    `$ ${Number(ln.impuesto || 0).toFixed(2)}`,
    `$ ${Number(ln.libraje || 0).toFixed(2)}`,
    `$ ${Number(ln.descuento || 0).toFixed(2)}`,
    `$ ${Number(ln.subtotal).toFixed(2)}`
  ]));

  const startY = (doc.lastAutoTable?.finalY || 50) + 8;

  autoTable(doc, {
    startY,
    head: [['ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Impuesto', 'Libraje', 'Descuento', 'Subtotal']],
    body,
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], textColor: 255 },
    styles: { fontSize: 10 },
  });

  // ====== TOTALES ======
  const endY = (doc.lastAutoTable?.finalY || startY) + 10;
  const totalCalculado = (orden.lineas || []).reduce((acc, ln) => acc + Number(ln.subtotal || 0), 0);
  const totalFinal = totalOrden || totalCalculado;

  doc.setFontSize(12);
  doc.text(`Total orden: $ ${totalFinal.toFixed(2)}`, 14, endY);

  // ====== DESCARGA ======
  doc.save(`orden_compra_${orden.codigo || orden.id}.pdf`);
};