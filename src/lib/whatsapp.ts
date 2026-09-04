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
}

/**
 * Standardizes phone numbers for WhatsApp URL scheme.
 * Default country code is '91' (India) if 10 digits are supplied.
 */
export function formatPhoneNumber(phone: string, defaultCountryCode = '91'): string {
  if (!phone) return '';
  // Remove non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `${defaultCountryCode}${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Generates a clean, beautifully formatted WhatsApp text receipt.
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

  return `🧾 *${restaurantName}*
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

Thank you for dining with us! 🙏
Have a great day ahead! ✨`;
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
 * Opens WhatsApp Web or App with prefilled message in a new window/tab.
 */
export function openWhatsAppReceipt(data: OrderReceiptData, phoneOverride?: string): boolean {
  const phone = phoneOverride || data.customer_phone || '';
  if (!phone.trim()) {
    return false;
  }

  const text = generateWhatsAppReceiptText(data);
  const url = getWhatsAppLink(phone, text);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
