export interface DynoItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  item_notes?: string;
}

export interface DynoCustomer {
  name?: string;
  phone?: string;
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
 * Normalizes incoming order payloads from Dyno API into internal standard schema:
 * - orderId: map from body.order_id or body.id
 * - source: map from body.channel ('ZOMATO' / 'SWIGGY'), converted to lower case
 * - customer: { name: body.customer_details?.name, phone: body.customer_details?.phone }
 * - items: map body.order_items array to { name, quantity, price }
 * - totalAmount: map from body.total_amount
 * - status: default to 'ACCEPTED'
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

  // Handle nested wrapper if present (e.g. data or order)
  if (payload && typeof payload === 'object') {
    if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
      payload = payload.data;
    } else if (payload.order && typeof payload.order === 'object') {
      payload = payload.order;
    }
  }

  // 1. Map orderId
  const orderId = String(
    payload.order_id ||
    payload.id ||
    payload.orderId ||
    payload.order_number ||
    payload.orderNumber ||
    `DYNO_${Date.now()}`
  );

  // 2. Map source from channel ('ZOMATO' / 'SWIGGY' -> lowercase)
  const rawChannel = payload.channel || payload.source || payload.platform || 'dyno';
  const source = String(rawChannel).toLowerCase();

  // 3. Map customer details
  const customerDetails = payload.customer_details || payload.customer || {};
  const customer: DynoCustomer = {
    name: customerDetails.name || payload.customer_name || 'Guest Customer',
    phone: customerDetails.phone || payload.customer_phone || '',
    email: customerDetails.email || payload.customer_email || '',
    address: customerDetails.address || payload.delivery_address || ''
  };

  // 4. Map order_items to { name, quantity, price }
  const rawItems = Array.isArray(payload.order_items)
    ? payload.order_items
    : Array.isArray(payload.items)
    ? payload.items
    : [];

  const items: DynoItem[] = rawItems.map((item: any, idx: number) => {
    const qty = Number(item.quantity ?? item.qty ?? item.count ?? 1) || 1;
    const price = Number(item.price ?? item.rate ?? item.unit_price ?? item.amount ?? 0) || 0;
    return {
      id: item.id || item.item_id || `item_${idx + 1}`,
      name: item.name || item.item_name || item.title || `Item ${idx + 1}`,
      quantity: qty,
      price: price,
      item_notes: item.item_notes || item.notes || item.special_instructions || ''
    };
  });

  // 5. Map total_amount
  const calculatedTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const totalAmount = typeof payload.total_amount !== 'undefined'
    ? Number(payload.total_amount)
    : (typeof payload.total !== 'undefined' ? Number(payload.total) : calculatedTotal);

  // 6. Map status (default to 'ACCEPTED')
  const status = payload.status || 'ACCEPTED';

  return {
    orderId,
    source,
    customer,
    items,
    totalAmount,
    status,
    placedAt: payload.placed_at || payload.created_at || new Date().toISOString(),
    tableId: payload.table_id || payload.table_number || payload.table,
    instructions: payload.instructions || payload.special_instructions || payload.notes || '',
    raw: payload
  };
}
