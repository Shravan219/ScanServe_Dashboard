/**
 * Server-side PDF receipt generator.
 * Uses jsPDF (which works in Node.js) to produce a receipt PDF buffer
 * that can be sent directly as a WhatsApp document by the Baileys bot.
 */

import { jsPDF } from 'jspdf';

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
}

export interface ReceiptData {
  id: string;
  token?: string | number;
  customer_name?: string;
  customer_phone?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax_amount?: number;
  discount?: number;
  total: number;
  payment_mode?: string;
  table_id?: string | number;
  created_at?: string;
  gstin?: string;
}

/**
 * Generates a professional thermal-style PDF receipt on the server.
 * Returns the PDF as a Buffer ready to be sent via Baileys sendMessage.
 */
export function generateReceiptPdfBuffer(
  data: ReceiptData,
  restaurantName = 'VYOMA ARTISAN CAFE'
): Buffer {
  const baseHeight = 110;
  const itemHeight = Math.max(data.items.length * 6.5, 20);
  const totalHeight = Math.max(160, baseHeight + itemHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, totalHeight]
  });

  const pageWidth = 80;
  let y = 10;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(restaurantName, pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('OFFICIAL TAX INVOICE', pageWidth / 2, y, { align: 'center' });

  if (data.gstin) {
    y += 3.5;
    doc.text(`GSTIN: ${data.gstin}`, pageWidth / 2, y, { align: 'center' });
  }

  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(6, y, pageWidth - 6, y);

  // ── Order Details ────────────────────────────────────────────────────────
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  const tokenStr = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const tableStr = data.table_id
    ? `Table ${String(data.table_id).replace(/^table\s*/i, '')}`
    : 'Counter';
  const dateStr = data.created_at
    ? new Date(data.created_at).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short'
      })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  doc.text(`Token: ${tokenStr} (${tableStr})`, 6, y);
  y += 4;
  doc.text(`Date: ${dateStr}`, 6, y);
  y += 4;
  const cust =
    data.customer_name && data.customer_name.toLowerCase() !== 'guest'
      ? data.customer_name
      : 'Guest Customer';
  doc.text(`Customer: ${cust}`, 6, y);
  if (data.customer_phone) {
    y += 4;
    doc.text(`Phone: ${data.customer_phone}`, 6, y);
  }

  y += 4;
  doc.line(6, y, pageWidth - 6, y);

  // ── Items Header ─────────────────────────────────────────────────────────
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 30, 30);
  doc.text('ITEM', 6, y);
  doc.text('QTY', 44, y, { align: 'center' });
  doc.text('PRICE', 58, y, { align: 'right' });
  doc.text('TOTAL', pageWidth - 6, y, { align: 'right' });

  y += 2.5;
  doc.line(6, y, pageWidth - 6, y);

  // ── Items List ────────────────────────────────────────────────────────────
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  data.items.forEach((it) => {
    const cleanName = it.name.length > 20 ? it.name.substring(0, 19) + '…' : it.name;
    const lineTotal = (it.price * it.quantity).toFixed(2);

    doc.text(cleanName, 6, y);
    doc.text(String(it.quantity), 44, y, { align: 'center' });
    doc.text(it.price.toFixed(2), 58, y, { align: 'right' });
    doc.text(lineTotal, pageWidth - 6, y, { align: 'right' });
    y += 4.5;
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  y += 1;
  doc.line(6, y, pageWidth - 6, y);
  y += 4.5;

  const subtotalVal =
    data.subtotal ?? data.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const taxVal = data.tax_amount ?? 0;
  const discountVal = data.discount ?? 0;
  const grandTotal = data.total;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  doc.text('Subtotal:', 40, y);
  doc.text(`Rs. ${subtotalVal.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
  y += 4;

  if (taxVal > 0) {
    doc.text('GST (5%):', 40, y);
    doc.text(`Rs. ${taxVal.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
    y += 4;
  }

  if (discountVal > 0) {
    doc.text('Discount:', 40, y);
    doc.text(`-Rs. ${discountVal.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });
    y += 4;
  }

  doc.setLineWidth(0.3);
  doc.line(6, y, pageWidth - 6, y);
  y += 5;

  // ── Grand Total ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text('GRAND TOTAL:', 6, y);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - 6, y, { align: 'right' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const payMode = (data.payment_mode || 'UPI').toUpperCase();
  doc.setTextColor(16, 120, 60);
  doc.text(`Payment Status: PAID via ${payMode}`, 6, y);

  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(6, y, pageWidth - 6, y);

  // ── Footer ────────────────────────────────────────────────────────────────
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for dining with us!', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Please visit again ✦ Powered by Vyoma POS', pageWidth / 2, y, { align: 'center' });

  // Return as Node.js Buffer
  const uint8Array = doc.output('arraybuffer');
  return Buffer.from(uint8Array);
}
