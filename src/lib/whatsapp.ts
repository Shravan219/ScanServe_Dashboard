import { jsPDF } from 'jspdf';

export interface OrderReceiptData {
  id: string;
  token?: string | number;
  customer_name?: string;
  customer_phone?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
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
 * Standardizes phone numbers for WhatsApp URL scheme.
 * Default country code is '91' (India) if 10 digits are supplied.
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '91'): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  return cleaned;
}

/**
 * Generates a clean, formatted WhatsApp text summary.
 */
export function generateWhatsAppReceiptText(data: OrderReceiptData, restaurantName = 'VYOMA ARTISAN CAFE'): string {
  const token = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const dateStr = data.created_at 
    ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const customer = data.customer_name && data.customer_name.toLowerCase() !== 'guest' ? data.customer_name : 'Valued Guest';
  const table = data.table_id ? `Table ${String(data.table_id).replace(/^table\s*/i, '')}` : 'Takeaway / POS';

  const itemsList = data.items
    .map(it => `• *${it.name}* x${it.quantity} = ₹${(it.price * it.quantity).toFixed(2)}`)
    .join('\n');

  const subtotalVal = data.subtotal ?? data.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const taxVal = data.tax_amount ?? 0;
  const discountVal = data.discount ?? 0;
  const grandTotal = data.total;
  const payMode = (data.payment_mode || 'UPI').toUpperCase();

  return `🧾 *${restaurantName} - TAX INVOICE*
--------------------------------
*Order Token:* ${token} (${table})
*Date:* ${dateStr}
*Customer:* ${customer}

*ITEMS ORDERED:*
${itemsList}

--------------------------------
Subtotal: ₹${subtotalVal.toFixed(2)}
${taxVal > 0 ? `GST: ₹${taxVal.toFixed(2)}\n` : ''}${discountVal > 0 ? `Discount: -₹${discountVal.toFixed(2)}\n` : ''}*GRAND TOTAL:* *₹${grandTotal.toFixed(2)}*
*Payment Mode:* ${payMode} (Paid ✅)

📄 *Official PDF Receipt Generated*
Thank you for dining with us! 🙏
Have a great day ahead! ✨`;
}

/**
 * Generates a high-resolution, professional PDF receipt document using jsPDF.
 */
export function generateReceiptPDF(data: OrderReceiptData, restaurantName = 'VYOMA ARTISAN CAFE'): jsPDF {
  // Compute dynamic height based on number of items
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

  // Header Title
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

  // Order Details
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  const tokenStr = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const tableStr = data.table_id ? `Table ${String(data.table_id).replace(/^table\s*/i, '')}` : 'Counter';
  const dateStr = data.created_at
    ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  doc.text(`Token: ${tokenStr} (${tableStr})`, 6, y);
  y += 4;
  doc.text(`Date: ${dateStr}`, 6, y);
  y += 4;
  const cust = data.customer_name && data.customer_name.toLowerCase() !== 'guest' ? data.customer_name : 'Guest Customer';
  doc.text(`Customer: ${cust}`, 6, y);
  if (data.customer_phone) {
    y += 4;
    doc.text(`Phone: ${data.customer_phone}`, 6, y);
  }

  y += 4;
  doc.line(6, y, pageWidth - 6, y);

  // Items Header
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

  // Items List
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  data.items.forEach(it => {
    // Truncate name if too long
    const cleanName = it.name.length > 20 ? it.name.substring(0, 19) + '…' : it.name;
    const lineTotal = (it.price * it.quantity).toFixed(2);

    doc.text(cleanName, 6, y);
    doc.text(String(it.quantity), 44, y, { align: 'center' });
    doc.text(it.price.toFixed(2), 58, y, { align: 'right' });
    doc.text(lineTotal, pageWidth - 6, y, { align: 'right' });
    y += 4.5;
  });

  // Summary section
  y += 1;
  doc.line(6, y, pageWidth - 6, y);
  y += 4.5;

  const subtotalVal = data.subtotal ?? data.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const taxVal = data.tax_amount ?? 0;
  const discountVal = data.discount ?? 0;
  const grandTotal = data.total;

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

  // Grand Total Highlight
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

  // Footer
  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for dining with us!', pageWidth / 2, y, { align: 'center' });
  y += 3.5;
  doc.text('Please visit again', pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Builds the wa.me URL scheme for opening WhatsApp Web/App directly.
 */
export function getWhatsAppLink(phone: string, textPayload: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedText = encodeURIComponent(textPayload);
  
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

/**
 * Downloads the PDF receipt locally to the device.
 */
export function downloadReceiptPDF(data: OrderReceiptData): void {
  const doc = generateReceiptPDF(data);
  const filename = `Receipt_${data.token || data.id.slice(-4)}.pdf`;
  doc.save(filename);
}

/**
 * Sends the receipt to the customer's WhatsApp:
 * 1. On Mobile/Tablet or browsers with Web Share API with files:
 *    Shares the actual PDF file directly into WhatsApp.
 * 2. On Desktop browsers:
 *    Automatically downloads the PDF receipt and opens WhatsApp Web pre-filled,
 *    ready for the cashier to attach the downloaded PDF with 1 click.
 */
export async function sendWhatsAppReceiptWithPDF(
  data: OrderReceiptData,
  phoneOverride?: string
): Promise<{ success: boolean; nativeShared: boolean; pdfDownloaded: boolean; error?: string }> {
  const phone = phoneOverride || data.customer_phone || '';
  const tokenStr = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const filename = `Receipt_${data.token || data.id.slice(-4)}.pdf`;

  const doc = generateReceiptPDF(data);
  const pdfBlob = doc.output('blob');
  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

  // 1. Try Native Web Share API (Attaches actual PDF file in mobile/supported environments)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Receipt ${tokenStr}`,
        text: `Official Tax Invoice Receipt ${tokenStr} from VYOMA ARTISAN CAFE`
      });
      return { success: true, nativeShared: true, pdfDownloaded: false };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, nativeShared: false, pdfDownloaded: false };
      }
      // If error sharing file, fallback to desktop flow
    }
  }

  // 2. Desktop Fallback:
  // Auto-download the PDF receipt to downloads folder
  doc.save(filename);

  // Open WhatsApp Web with formatted summary & attachment notice
  const text = generateWhatsAppReceiptText(data);
  const url = getWhatsAppLink(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');

  return { success: true, nativeShared: false, pdfDownloaded: true };
}

/**
 * Backwards-compatible synchronous / fallback trigger
 */
export function openWhatsAppReceipt(data: OrderReceiptData, phoneOverride?: string): boolean {
  const phone = phoneOverride || data.customer_phone || '';
  if (!phone.trim()) {
    return false;
  }
  sendWhatsAppReceiptWithPDF(data, phoneOverride);
  return true;
}
