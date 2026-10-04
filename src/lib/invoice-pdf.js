import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(date) {
  const value = date ? new Date(date) : new Date();
  return Number.isNaN(value.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(value);
}

function formatMoney(amount) {
  return `BDT ${Number(amount || 0).toLocaleString('en-BD')}`;
}

function addInvoice(document, order) {
  const pageWidth = document.internal.pageSize.getWidth();
  const firstPage = document.internal.getCurrentPageInfo().pageNumber;
  const margin = 16;
  const right = pageWidth - margin;
  let y = 18;

  document.setFont('helvetica', 'bold');
  document.setFontSize(21);
  document.setTextColor(17, 24, 39);
  document.text('DREVEN', margin, y);

  document.setFontSize(16);
  document.text('INVOICE', right, y, { align: 'right' });
  y += 7;

  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(107, 114, 128);
  document.text('Order confirmation & payment receipt', margin, y);
  document.text(`Invoice #: ${order.id || '—'}`, right, y, { align: 'right' });
  y += 5;
  document.setDrawColor(229, 231, 235);
  document.line(margin, y, right, y);
  y += 9;

  const address = [order.address, order.upazila, order.city].filter(Boolean).join(', ');
  const customerDetails = [
    ['BILL TO', order.customer || '—'],
    ['PHONE', order.phone || '—'],
    ['EMAIL', order.email || '—'],
    ['SHIP TO', address || '—'],
  ];
  const columnGap = 12;
  const columnWidth = (right - margin - columnGap) / 2;
  const lineHeight = 4.5;

  customerDetails.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * (columnWidth + columnGap);
    const blockY = y + row * 15;
    document.setFont('helvetica', 'bold');
    document.setFontSize(7.5);
    document.setTextColor(107, 114, 128);
    document.text(label, x, blockY);
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(31, 41, 55);
    const lines = document.splitTextToSize(String(value), columnWidth);
    document.text(lines.slice(0, 2), x, blockY + lineHeight);
  });
  y += 36;

  const metadata = [
    ['ORDER DATE', formatDate(order.createdAt)],
    ['ORDER NUMBER', String(order.id || '—')],
    ['PAYMENT METHOD', String(order.paymentMethod || 'Cash on delivery')],
  ];
  const metadataWidth = (right - margin) / metadata.length;
  metadata.forEach(([label, value], index) => {
    const x = margin + index * metadataWidth;
    document.setFont('helvetica', 'bold');
    document.setFontSize(7.5);
    document.setTextColor(107, 114, 128);
    document.text(label, x, y);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(31, 41, 55);
    document.text(document.splitTextToSize(value, metadataWidth - 3).slice(0, 2), x, y + lineHeight);
  });
  y += 11;

  autoTable(document, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Item', 'Unit price', 'Qty', 'Amount']],
    body: (order.items || []).map((item) => [
      `${String(item.name || 'Item')}${item.sizeMl ? ` (${item.sizeMl}ml)` : ''}`,
      formatMoney(item.price),
      String(item.quantity || 0),
      formatMoney(Number(item.price || 0) * Number(item.quantity || 0)),
    ]),
    theme: 'grid',
    headStyles: {
      fillColor: [17, 24, 39],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: { textColor: [55, 65, 81], fontSize: 9 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { cellPadding: 3, lineColor: [229, 231, 235], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 34 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 34 },
    },
  });

  let summaryY = document.lastAutoTable.finalY + 8;
  if (summaryY > document.internal.pageSize.getHeight() - 42) {
    document.addPage();
    summaryY = margin + 8;
  }

  const labelX = right - 67;
  const valueX = right;
  const summaryRows = [
    ['Subtotal', order.subtotal ?? (Number(order.total || 0) - Number(order.deliveryFee || 0))],
    ['Delivery', order.deliveryFee],
  ];
  document.setFontSize(9);
  summaryRows.forEach(([label, value]) => {
    document.setFont('helvetica', 'normal');
    document.setTextColor(107, 114, 128);
    document.text(label, labelX, summaryY);
    document.setTextColor(31, 41, 55);
    document.text(formatMoney(value), valueX, summaryY, { align: 'right' });
    summaryY += 6;
  });

  document.setDrawColor(209, 213, 219);
  document.line(labelX, summaryY - 2, valueX, summaryY - 2);
  document.setFont('helvetica', 'bold');
  document.setFontSize(11);
  document.setTextColor(17, 24, 39);
  document.text('TOTAL DUE', labelX, summaryY + 4);
  document.text(formatMoney(order.total), valueX, summaryY + 4, { align: 'right' });
  summaryY += 13;

  document.setFont('helvetica', 'normal');
  document.setFontSize(8);
  document.setTextColor(107, 114, 128);
  document.text(`Order status: ${order.status || 'Pending'}`, margin, summaryY);
  document.text('Thank you for shopping with Dreven.', margin, summaryY + 6);

  const lastPage = document.getNumberOfPages();
  const invoicePageCount = lastPage - firstPage + 1;
  for (let page = firstPage; page <= lastPage; page += 1) {
    document.setPage(page);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(156, 163, 175);
    document.text(
      `Dreven · ${order.id} · Page ${page - firstPage + 1} of ${invoicePageCount}`,
      pageWidth / 2,
      document.internal.pageSize.getHeight() - 7,
      { align: 'center' },
    );
  }
}

export function createInvoicesPdf(orders) {
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error('There are no orders to include in an invoice.');
  }

  const document = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  document.setProperties({
    title: orders.length === 1 ? `Invoice ${orders[0].id}` : 'Dreven order invoices',
    subject: 'Dreven order invoice',
    creator: 'Dreven Admin',
  });

  orders.forEach((order, index) => {
    if (index > 0) document.addPage();
    addInvoice(document, order);
  });

  return document;
}

export function downloadInvoicesPdf(orders, filename) {
  createInvoicesPdf(orders).save(filename);
}
