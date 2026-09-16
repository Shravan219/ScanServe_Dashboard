import { jsPDF } from 'jspdf';

export interface OrderReceiptData {
  id: string;
  token?: string | number;
<<<<<<< HEAD
  tokens?: string[];
  order_ids?: string[];
  customer_name?: string;
  customer_phone?: string;
  items: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    item_notes?: string;
=======
  customer_name?: string;
  customer_phone?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  }>;
  subtotal?: number;
  tax_amount?: number;
  discount?: number;
  total: number;
  payment_mode?: string;
  table_id?: string | number;
  created_at?: string;
  gstin?: string;
<<<<<<< HEAD
  mergedCount?: number;
  notes?: string;
}

/**
 * Standardizes phone numbers for display and WhatsApp messaging.
 * - Strips all non-digit characters.
 * - Removes leading zero for 11-digit numbers (e.g. 09876543210 -> 9876543210).
 * - Auto-prefixes '+91' for standard 10-digit Indian numbers (or '91' when includePlus is false).
 * - Handles already-prefixed numbers safely.
 */
export function formatPhoneNumber(phone: string, includePlus: boolean = true): string {
=======
}

/**
 * Standardizes phone numbers for WhatsApp URL scheme.
 * Strips all formatting, removes leading zeros, and prefixes default country code ('91' for India).
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '91'): string {
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';

  // Remove leading 0 if 11 digits (e.g., 09876543210 -> 9876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

<<<<<<< HEAD
  // 10 digits standard Indian mobile number -> auto-prefix +91 (or 91)
  if (cleaned.length === 10) {
    return includePlus ? `+91${cleaned}` : `91${cleaned}`;
  }

  // 12 digits starting with 91 (e.g., 919876543210)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return includePlus ? `+${cleaned}` : cleaned;
  }

  // If already formatted or other international number
  if (cleaned.length > 10) {
    return includePlus ? `+${cleaned}` : cleaned;
=======
  // 10 digits standard mobile number -> prefix country code (e.g., 919876543210)
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }

  // Already includes country code (e.g., 919876543210)
  if (cleaned.length === 12 && cleaned.startsWith(defaultCountryCode)) {
    return cleaned;
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  }

  return cleaned;
}

/**
<<<<<<< HEAD
 * Returns clean numeric phone number formatted strictly for wa.me URLs (digits only, no '+' sign).
 */
export function getWhatsAppPhoneNumber(phone: string): string {
  return formatPhoneNumber(phone, false).replace(/\D/g, '');
}

/**
 * Generates a clean, professional text-based receipt summary formatted for WhatsApp.
 * Handles single orders as well as consolidated/merged multi-order invoices.
 */
export function generateWhatsAppReceiptText(
  data: OrderReceiptData, 
  restaurantName = 'VYOMA ARTISAN CAFE'
): string {
  // Format token string: multiple tokens if merged, or single token
  let tokenStr: string;
  if (data.tokens && data.tokens.length > 0) {
    tokenStr = data.tokens.map(t => String(t).startsWith('#') ? t : `#${t}`).join(', ');
  } else if (data.token) {
    tokenStr = String(data.token).startsWith('#') ? String(data.token) : `#${data.token}`;
  } else {
    tokenStr = `#${data.id.slice(-4)}`;
  }

  const dateStr = data.created_at 
    ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const rawCustomer = (data.customer_name || '').trim();
  const customer = rawCustomer && rawCustomer.toLowerCase() !== 'guest' && rawCustomer.toLowerCase() !== 'walk-in'
    ? rawCustomer 
    : 'Valued Guest';

  const isDineIn = data.table_id !== undefined && 
    data.table_id !== null && 
    String(data.table_id).trim() !== '' && 
    String(data.table_id).toUpperCase() !== 'TAKEAWAY';

  const tableStr = isDineIn
    ? `Table ${String(data.table_id).replace(/^table\s*/i, '').trim()}`
    : 'Takeaway / Counter';
=======
 * Generates a clean, formatted WhatsApp text receipt for the customer.
 */
export function generateWhatsAppReceiptText(data: OrderReceiptData, restaurantName = 'VYOMA ARTISAN CAFE'): string {
  const token = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const dateStr = data.created_at 
    ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const customer = data.customer_name && data.customer_name.toLowerCase() !== 'guest' ? data.customer_name : 'Valued Guest';
  const table = data.table_id ? `Table ${String(data.table_id).replace(/^table\s*/i, '')}` : 'Takeaway / POS';
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65

  const itemsList = data.items
    .map(it => `• *${it.name}* x${it.quantity} = ₹${(it.price * it.quantity).toFixed(2)}`)
    .join('\n');

  const subtotalVal = data.subtotal ?? data.items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const taxVal = data.tax_amount ?? 0;
  const discountVal = data.discount ?? 0;
  const grandTotal = data.total;
  const payMode = (data.payment_mode || 'UPI').toUpperCase();

<<<<<<< HEAD
  const mergedNotice = data.mergedCount && data.mergedCount > 1 
    ? `\n*Consolidated Orders:* ${data.mergedCount} sub-orders merged` 
    : '';

  const phoneLine = data.customer_phone 
    ? `*Phone:* ${formatPhoneNumber(data.customer_phone, true)}\n` 
    : '';

  return `🧾 *${restaurantName} - TAX INVOICE*
--------------------------------
*Order Token(s):* ${tokenStr} (${tableStr})${mergedNotice}
*Date:* ${dateStr}
*Customer:* ${customer}
${phoneLine}
=======
  // Public digital bill URL if running on web domain
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const receiptUrl = origin ? `${origin}/?receipt=${data.id}` : '';

  return `🧾 *${restaurantName} - TAX INVOICE*
--------------------------------
*Order Token:* ${token} (${table})
*Date:* ${dateStr}
*Customer:* ${customer}

>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
*ITEMS ORDERED:*
${itemsList}

--------------------------------
Subtotal: ₹${subtotalVal.toFixed(2)}
${taxVal > 0 ? `GST: ₹${taxVal.toFixed(2)}\n` : ''}${discountVal > 0 ? `Discount: -₹${discountVal.toFixed(2)}\n` : ''}*GRAND TOTAL:* *₹${grandTotal.toFixed(2)}*
*Payment Mode:* ${payMode} (Paid ✅)
Thank you for dining with us! 🙏
Have a great day ahead! ✨`;
}

/**
<<<<<<< HEAD
 * Builds the dynamic https://wa.me/<phone>?text=<encoded_text> deep-link trigger.
 * WhatsApp requires raw digits with country code and no '+' or special symbols.
 */
export function getWhatsAppLink(phone: string, textPayload: string): string | null {
  const digitsOnly = getWhatsAppPhoneNumber(phone);
  if (!digitsOnly || digitsOnly.length < 10) return null;
  const encodedText = encodeURIComponent(textPayload);
  return `https://wa.me/${digitsOnly}?text=${encodedText}`;
}

/**
 * Creates dynamic deep link trigger directly from OrderReceiptData.
 */
export function createWhatsAppReceiptLink(
  data: OrderReceiptData,
  restaurantName = 'VYOMA ARTISAN CAFE'
): string | null {
  const phone = data.customer_phone;
  if (!phone) return null;
  const text = generateWhatsAppReceiptText(data, restaurantName);
  return getWhatsAppLink(phone, text);
}

/**
 * Robust cross-platform external link opener that works everywhere:
 * - Web Browsers (Chrome, Edge, Safari, Firefox)
 * - Electron Desktop (.exe) via window.open / shell
 * - Android (.apk / Capacitor / Cordova WebView) via Intent interception & window.location fallback
 */
export function openExternalUrl(url: string): void {
  if (typeof window === 'undefined' || !url) return;

  try {
    // 1. If Electron exposed custom openExternal API on window
    if ((window as any).electron?.openExternal) {
      (window as any).electron.openExternal(url);
      return;
    }

    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent || '');
    const isCapacitor = !!(window as any).Capacitor;

    // 2. Try window.open first
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    // 3. Fallback: If popup was blocked or running in an embedded WebView
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        try {
          document.body.removeChild(anchor);
        } catch {}
      }, 200);

      // On Android APK / mobile WebViews, location.href directly triggers the OS WhatsApp Intent
      if (isMobile || isCapacitor) {
        setTimeout(() => {
          try {
            window.location.href = url;
          } catch {}
        }, 150);
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Link Fallback]', err);
    try {
      window.location.href = url;
    } catch {}
  }
}

/**
=======
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
 * Generates a high-resolution, professional PDF receipt document using jsPDF.
 */
export function generateReceiptPDF(data: OrderReceiptData, restaurantName = 'VYOMA ARTISAN CAFE'): jsPDF {
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

<<<<<<< HEAD
  let tokenStr: string;
  if (data.tokens && data.tokens.length > 0) {
    tokenStr = data.tokens.map(t => String(t).startsWith('#') ? t : `#${t}`).join(', ');
  } else if (data.token) {
    tokenStr = String(data.token).startsWith('#') ? String(data.token) : `#${data.token}`;
  } else {
    tokenStr = `#${data.id.slice(-4)}`;
  }

  const isDineIn = data.table_id !== undefined && 
    data.table_id !== null && 
    String(data.table_id).trim() !== '' && 
    String(data.table_id).toUpperCase() !== 'TAKEAWAY';

  const tableStr = isDineIn 
    ? `Table ${String(data.table_id).replace(/^table\s*/i, '').trim()}` 
    : 'Counter';

=======
  const tokenStr = data.token ? `#${data.token}` : `#${data.id.slice(-4)}`;
  const tableStr = data.table_id ? `Table ${String(data.table_id).replace(/^table\s*/i, '')}` : 'Counter';
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  const dateStr = data.created_at
    ? new Date(data.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

  doc.text(`Token: ${tokenStr} (${tableStr})`, 6, y);
<<<<<<< HEAD
  if (data.mergedCount && data.mergedCount > 1) {
    y += 4;
    doc.text(`Merged: ${data.mergedCount} orders consolidated`, 6, y);
  }
=======
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  y += 4;
  doc.text(`Date: ${dateStr}`, 6, y);
  y += 4;
  const cust = data.customer_name && data.customer_name.toLowerCase() !== 'guest' ? data.customer_name : 'Guest Customer';
  doc.text(`Customer: ${cust}`, 6, y);
  if (data.customer_phone) {
    y += 4;
<<<<<<< HEAD
    doc.text(`Phone: ${formatPhoneNumber(data.customer_phone, true)}`, 6, y);
=======
    doc.text(`Phone: ${data.customer_phone}`, 6, y);
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
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
<<<<<<< HEAD
    doc.text('GST:', 40, y);
=======
    doc.text('GST (5%):', 40, y);
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
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
<<<<<<< HEAD
 * Downloads the PDF receipt locally to the device (wrapped with safety guards).
 */
export function downloadReceiptPDF(data: OrderReceiptData, restaurantName = 'VYOMA ARTISAN CAFE'): void {
  try {
    const doc = generateReceiptPDF(data, restaurantName);
    const tokenPart = data.tokens && data.tokens.length > 0
      ? data.tokens.join('_')
      : (data.token || data.id.slice(-4));
    const filename = `Receipt_${tokenPart}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.warn('[PDF Download Notice] Auto-download skipped in this client environment:', err);
  }
}

/**
 * Triggers the dynamic WhatsApp deep-link across Web, .exe, and .apk.
 */
export function triggerWhatsAppReceipt(
  data: OrderReceiptData,
  phoneOverride?: string,
  restaurantName = 'VYOMA ARTISAN CAFE'
): { success: boolean; url?: string; formattedPhone?: string; error?: string } {
  const rawPhone = phoneOverride || data.customer_phone || '';
  const digitsOnly = getWhatsAppPhoneNumber(rawPhone);

  if (!digitsOnly || digitsOnly.length < 10) {
    return {
      success: false,
      error: 'Missing or invalid customer phone number'
    };
  }

  const text = generateWhatsAppReceiptText(data, restaurantName);
  const link = getWhatsAppLink(digitsOnly, text);

  if (!link) {
    return {
      success: false,
      error: 'Failed to construct WhatsApp link'
    };
  }

  openExternalUrl(link);

  return {
    success: true,
    formattedPhone: formatPhoneNumber(rawPhone, true),
    url: link
  };
}

/**
 * Sends the receipt DIRECTLY to the customer's WhatsApp chat:
 * 1. Opens WhatsApp directly using the cross-platform openExternalUrl.
 * 2. Asynchronously downloads the PDF locally so popup blockers and WebView handlers aren't interrupted.
 */
export function sendWhatsAppReceiptWithPDF(
  data: OrderReceiptData,
  phoneOverride?: string,
  restaurantName = 'VYOMA ARTISAN CAFE'
): { success: boolean; formattedPhone?: string; url?: string; error?: string } {
  const rawPhone = phoneOverride || data.customer_phone || '';
  const digitsOnly = getWhatsAppPhoneNumber(rawPhone);

  if (!digitsOnly || digitsOnly.length < 10) {
=======
 * Builds the wa.me URL scheme.
 * When formattedPhone is provided, WhatsApp navigates directly into that customer's chat.
 * NEVER returns a generic URL without a phone number to avoid contact selection prompts.
 */
export function getWhatsAppLink(phone: string, textPayload: string): string | null {
  const formattedPhone = formatPhoneNumber(phone);
  if (!formattedPhone) return null;
  const encodedText = encodeURIComponent(textPayload);
  return `https://wa.me/${formattedPhone}?text=${encodedText}`;
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
 * Sends the receipt DIRECTLY to the customer's WhatsApp chat without prompting to select contacts:
 * 1. Formats the customer's exact phone number (with country code).
 * 2. Directly opens https://wa.me/<customer_phone>?text=<receipt> in a new tab.
 * 3. Downloads the official PDF receipt locally so the cashier has the file on hand.
 *
 * NOTE: Does NOT use navigator.share to avoid OS contact selection dialogs.
 */
export function sendWhatsAppReceiptWithPDF(
  data: OrderReceiptData,
  phoneOverride?: string
): { success: boolean; formattedPhone?: string; error?: string } {
  const rawPhone = phoneOverride || data.customer_phone || '';
  const formattedPhone = formatPhoneNumber(rawPhone);

  if (!formattedPhone) {
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
    return {
      success: false,
      error: 'Missing or invalid customer phone number'
    };
  }

<<<<<<< HEAD
  const text = generateWhatsAppReceiptText(data, restaurantName);
  const directWhatsAppUrl = getWhatsAppLink(digitsOnly, text);

  if (!directWhatsAppUrl) {
    return {
      success: false,
      error: 'Failed to generate WhatsApp link'
    };
  }

  // 1. Open WhatsApp immediately to preserve active user click gesture
  openExternalUrl(directWhatsAppUrl);

  // 2. Auto-download vector PDF receipt locally after short delay so it doesn't block window opener
  setTimeout(() => {
    downloadReceiptPDF(data, restaurantName);
  }, 300);

  return {
    success: true,
    formattedPhone: formatPhoneNumber(rawPhone, true),
    url: directWhatsAppUrl
=======
  // 1. Download official vector PDF receipt locally
  try {
    downloadReceiptPDF(data);
  } catch (e) {
    console.warn('Could not auto-download PDF:', e);
  }

  // 2. Open WhatsApp Web/App DIRECTLY to the customer's phone number
  const text = generateWhatsAppReceiptText(data);
  const directWhatsAppUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  
  window.open(directWhatsAppUrl, '_blank', 'noopener,noreferrer');

  return {
    success: true,
    formattedPhone
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
  };
}

/**
 * Backwards-compatible direct trigger
 */
export function openWhatsAppReceipt(data: OrderReceiptData, phoneOverride?: string): boolean {
  const result = sendWhatsAppReceiptWithPDF(data, phoneOverride);
  return result.success;
}
