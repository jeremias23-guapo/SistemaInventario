// src/utils/pdfHelpers.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarVentaPDF = (venta, productosMap = {}) => {
  if (!venta) return;

  const doc = new jsPDF();
  const formatoFecha = (fechaStr) => new Date(fechaStr).toLocaleString();
  const descuentoPorcentaje = venta.lineas?.[0]?.descuento || 0;

  // ====== ENCABEZADO VISUAL ======
  doc.setFillColor(33, 150, 243);
  doc.rect(0, 0, 210, 25, 'F'); // Fondo azul superior
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('COMPROBANTE DE VENTA', 14, 16);

  // ====== DATOS EMPRESA ======
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('Mi Empresa S.A. de C.V.', 150, 10);
  doc.text('Tel: +503 7777-7777', 150, 14);
  doc.text('Email: ventas@miempresa.com', 150, 18);

  // ====== INFORMACIÓN GENERAL ======
  doc.setFontSize(12);
  doc.text(`Detalle de Venta #${venta.id}`, 14, 32);
  doc.setFontSize(10);

  autoTable(doc, {
    startY: 36,
    body: [
      ['Código', venta.codigo || '—', 'Cliente', venta.cliente_nombre || '—'],
      ['Fecha', formatoFecha(venta.fecha), 'Método de pago', venta.metodo_pago || '—'],
      ['Estado pago', venta.estado_pago || '—', 'Estado envío', venta.estado_envio || '—'],
      ['Estado venta', venta.estado_venta || '—', 'Descuento aplicado', `${descuentoPorcentaje}%`],
      ['Transportista', venta.transportista_nombre || '—', 'Comisión transportista', `$${Number(venta.transportista_comision || 0).toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 2: { fontStyle: 'bold', cellWidth: 40 } },
  });

  // ====== DETALLE DE PRODUCTOS ======
  const body = (venta.lineas || []).map((ln) => {
    const totalSinDesc = ln.cantidad * ln.precio_unitario;
    const descuentoMonto = totalSinDesc * (ln.descuento / 100);
    const subtotal = totalSinDesc - descuentoMonto;
    return [
      ln.detalle_id,
      ln.producto_nombre || productosMap[ln.producto_id] || `ID ${ln.producto_id}`,
      ln.cantidad,
      `$${Number(ln.precio_unitario).toFixed(2)}`,
      `$${Number(totalSinDesc).toFixed(2)}`,
      `$${Number(descuentoMonto).toFixed(2)}`,
      `$${Number(subtotal).toFixed(2)}`,
    ];
  });

  const startY = (doc.lastAutoTable?.finalY || 60) + 8;

  autoTable(doc, {
    startY,
    head: [['ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Total sin desc.', 'Descuento', 'Subtotal']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [33, 150, 243], textColor: 255, halign: 'center' },
    bodyStyles: { fontSize: 10 },
    styles: { cellPadding: 2 },
  });

  // ====== TOTALES ======
  const totalSinDesc = (venta.lineas || []).reduce((sum, ln) => sum + ln.cantidad * ln.precio_unitario, 0);
  const totalDescuento = (venta.lineas || []).reduce((sum, ln) => sum + ln.cantidad * ln.precio_unitario * (ln.descuento / 100), 0);
  const endY = (doc.lastAutoTable?.finalY || startY) + 10;

  doc.setFontSize(11);
  doc.text(`Total sin descuento: $${totalSinDesc.toFixed(2)}`, 14, endY);
  doc.text(`Descuento total: $${totalDescuento.toFixed(2)}`, 14, endY + 5);
  doc.text(`Total con descuento: $${Number(venta.total_venta).toFixed(2)}`, 14, endY + 10);
  doc.text(`Total neto: $${Number(venta.total_venta_neta || venta.total_venta).toFixed(2)}`, 14, endY + 15);

  // ====== PIE DE PÁGINA ======
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Gracias por su compra.', 14, 290);
  doc.text('Este documento no tiene validez fiscal.', 14, 295);

  // ====== DESCARGA ======
  doc.save(`venta_${venta.codigo || venta.id}.pdf`);
};
