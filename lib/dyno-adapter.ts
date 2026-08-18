export interface DynoItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  item_notes?: string;
}

export interface DynoCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface NormalizedDynoOrder {
  orderId: string;
  source: string;
  customer: DynoCustomer;
  items: DynoItem[];
  totalAmount: number;
  status: string;
  placedAt?: string;
  tableId?: string | number;
  instructions?: string;
  raw?: any;
}

/**
 * Normalizes incoming order payloads from Dyno API (Zomato / Swiggy / Aggregators)
 * into internal standard schema with robust fallbacks for privacy-masked and variable keys:
 * 
 * - Customer Name: payload.customer?.name || payload.customer_details?.name || payload.delivery_details?.name || payload.customer_name || "Delivery Customer"
 * - Customer Phone: payload.customer?.phone || payload.customer_details?.phone || payload.delivery_details?.phone || payload.customer_phone || "Masked (Platform Policy)"
 * - Order Total: Number(payload.order_total || payload.bill_amount || payload.net_amount || payload.total_amount || 0)
 * - Item Price: Number(item.price || item.rate || item.item_price || item.final_price || 0)
 */
export function parseDynoOrderPayload(body: any): NormalizedDynoOrder {
  if (!body) {
    throw new Error('Empty payload received');
  }

  let payload = body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      try {
        const params = new URLSearchParams(payload);
        const dataParam = params.get('data') || params.get('order') || params.get('payload');
        if (dataParam) {
          payload = JSON.parse(dataParam);
        }
      } catch {
        // Fallback if raw text
      }
    }
  }

  // Handle nested wrapper if present (e.g. data, order, payload)
  if (payload && typeof payload === 'object') {
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      payload = payload.data;
    } else if (payload.order && typeof payload.order === 'object') {
      payload = payload.order;
    } else if (payload.payload && typeof payload.payload === 'object') {
      payload = payload.payload;
    }
  }

  // 1. Map orderId
  const orderId = String(
    payload.order_id ||
    payload.id ||
    payload.orderId ||
    payload.order_number ||
    payload.orderNumber ||
    payload.orderID ||
    `DYNO_${Date.now()}`
  );

  // 2. Map source from channel ('ZOMATO' / 'SWIGGY' / etc. -> lowercase)
  const rawChannel = (
    payload.channel ||
    payload.source ||
    payload.platform ||
    payload.order_from ||
    payload.aggregator ||
    'dyno'
  );
  const source = String(rawChannel).toLowerCase();

  // 3. Robust Customer Name Parsing with Aggregator Fallbacks
  const rawCustomer = payload.customer || payload.customer_details || payload.user_details || {};
  const rawDelivery = payload.delivery_details || payload.delivery_info || payload.delivery || {};

  const extractedName = (
    rawCustomer.name ||
    rawDelivery.name ||
    payload.customer_name ||
    payload.recipient_name ||
    payload.client_name ||
    payload.user_name ||
    payload.buyer_name ||
    ''
  ).toString().trim();

  const customerName = extractedName || 'Delivery Customer';

  // 4. Robust Customer Phone Parsing with Platform Privacy Fallbacks
  const extractedPhone = (
    rawCustomer.phone ||
    rawCustomer.contact ||
    rawDelivery.phone ||
    rawDelivery.contact ||
    payload.customer_phone ||
    payload.recipient_phone ||
    payload.contact_number ||
    payload.phone_number ||
    payload.phone ||
    ''
  ).toString().trim();

  const customerPhone = extractedPhone || 'Masked (Platform Policy)';

  const customer: DynoCustomer = {
    name: customerName,
    phone: customerPhone,
    email: rawCustomer.email || payload.customer_email || '',
    address: rawCustomer.address || rawDelivery.address || payload.delivery_address || payload.address || ''
  };

  // 5. Map order_items array to { name, quantity, price, item_notes }
  const rawItems = Array.isArray(payload.order_items)
    ? payload.order_items
    : Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.item_details)
    ? payload.item_details
    : Array.isArray(payload.orderItems)
    ? payload.orderItems
    : [];

  const items: DynoItem[] = rawItems.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? item.qty ?? item.count ?? item.item_quantity ?? 1) || 1;
    const price = Number(
      item.price ??
      item.rate ??
      item.item_price ??
      item.final_price ??
      item.unit_price ??
      item.amount ??
      0
    ) || 0;

    return {
      id: item.id || item.item_id || `item_${idx + 1}`,
      name: item.name || item.item_name || item.title || item.item_title || `Item ${idx + 1}`,
      quantity: qty,
      price: price,
      item_notes: item.item_notes || item.notes || item.special_instructions || item.instruction || ''
    };
  });

  // 6. Map total_amount with multiple key fallbacks
  const calculatedItemsTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  
  const rawTotalValue = 
    payload.order_total ??
    payload.bill_amount ??
    payload.net_amount ??
    payload.total_amount ??
    payload.total ??
    payload.final_amount ??
    payload.order_amount ??
    payload.grand_total ??
    payload.amount;

  const totalAmount = rawTotalValue !== undefined && rawTotalValue !== null && rawTotalValue !== ''
    ? Number(rawTotalValue) || 0
    : calculatedItemsTotal;

  // 7. Map status (default to 'ACCEPTED')
  const status = payload.status || payload.order_status || 'ACCEPTED';

  return {
    orderId,
    source,
    customer,
    items,
    totalAmount,
    status,
    placedAt: payload.placed_at || payload.created_at || payload.order_time || new Date().toISOString(),
    tableId: payload.table_id || payload.table_number || payload.table,
    instructions: payload.instructions || payload.special_instructions || payload.notes || payload.cooking_instructions || '',
    raw: payload
  };
}
