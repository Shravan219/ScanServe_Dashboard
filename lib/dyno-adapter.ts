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
 * Normalizes incoming order payloads from Dyno API / Webhook Testers into internal schema:
 * 
 * 1. Customer Name:
 *    body.customer?.name || body.customer_name || body.delivery_details?.customer_name || body.delivery_details?.name || body.user?.name
 * 
 * 2. Phone Number:
 *    body.customer?.phone || body.phone_number || body.customer_phone || body.delivery_details?.phone || body.delivery_details?.phone_number
 * 
 * 3. Total Price / Grand Total:
 *    body.grand_total || body.order_total || body.total_amount || body.bill_amount || body.pricing?.grand_total
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
    body?.order_id ||
    body?.id ||
    body?.orderId ||
    payload?.order_id ||
    payload?.id ||
    payload?.orderId ||
    payload?.order_number ||
    payload?.orderNumber ||
    payload?.orderID ||
    `DYNO_${Date.now()}`
  );

  // 2. Map source from channel ('ZOMATO' / 'SWIGGY' / etc. -> lowercase)
  const rawChannel = (
    body?.channel ||
    body?.source ||
    body?.platform ||
    payload?.channel ||
    payload?.source ||
    payload?.platform ||
    payload?.order_from ||
    payload?.aggregator ||
    'dyno'
  );
  const source = String(rawChannel).toLowerCase();

  // 3. Customer Name Parsing with full fallback variations:
  // body.customer?.name || body.customer_name || body.delivery_details?.customer_name || body.user?.name
  const rawCustomer = payload?.customer || payload?.customer_details || payload?.user_details || body?.customer || body?.customer_details || {};
  const rawDelivery = payload?.delivery_details || payload?.delivery_info || payload?.delivery || body?.delivery_details || {};
  const rawUser = payload?.user || body?.user || {};

  const extractedName = (
    body?.customer?.name ||
    body?.customer_name ||
    body?.delivery_details?.customer_name ||
    body?.delivery_details?.name ||
    body?.user?.name ||
    payload?.customer?.name ||
    payload?.customer_name ||
    payload?.delivery_details?.customer_name ||
    payload?.delivery_details?.name ||
    payload?.user?.name ||
    rawCustomer.name ||
    rawCustomer.customer_name ||
    rawDelivery.customer_name ||
    rawDelivery.name ||
    rawUser.name ||
    payload?.recipient_name ||
    payload?.client_name ||
    payload?.user_name ||
    payload?.buyer_name ||
    ''
  ).toString().trim();

  const customerName = extractedName || 'Delivery Customer';

  // 4. Phone Number Parsing with full fallback variations:
  // body.customer?.phone || body.phone_number || body.customer_phone || body.delivery_details?.phone
  const extractedPhone = (
    body?.customer?.phone ||
    body?.phone_number ||
    body?.customer_phone ||
    body?.delivery_details?.phone ||
    body?.delivery_details?.phone_number ||
    payload?.customer?.phone ||
    payload?.phone_number ||
    payload?.customer_phone ||
    payload?.delivery_details?.phone ||
    payload?.delivery_details?.phone_number ||
    rawCustomer.phone ||
    rawCustomer.phone_number ||
    rawCustomer.contact ||
    rawDelivery.phone ||
    rawDelivery.phone_number ||
    rawDelivery.contact ||
    rawUser.phone ||
    payload?.recipient_phone ||
    payload?.contact_number ||
    payload?.phone ||
    ''
  ).toString().trim();

  const customerPhone = extractedPhone || 'Masked (Platform Policy)';

  const customer: DynoCustomer = {
    name: customerName,
    phone: customerPhone,
    email: rawCustomer.email || payload?.customer_email || body?.customer_email || '',
    address: rawCustomer.address || rawDelivery.address || payload?.delivery_address || payload?.address || ''
  };

  // 5. Map order_items array to { name, quantity, price, item_notes }
  const rawItems = Array.isArray(body?.order_items)
    ? body.order_items
    : Array.isArray(body?.items)
    ? body.items
    : Array.isArray(payload?.order_items)
    ? payload.order_items
    : Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.item_details)
    ? payload.item_details
    : Array.isArray(payload?.orderItems)
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

  // 6. Map total_amount with full fallback variations:
  // body.grand_total || body.order_total || body.total_amount || body.bill_amount || body.pricing?.grand_total
  const calculatedItemsTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  
  const rawTotalValue = 
    body?.grand_total ??
    body?.order_total ??
    body?.total_amount ??
    body?.bill_amount ??
    body?.pricing?.grand_total ??
    body?.pricing?.total ??
    body?.total ??
    payload?.grand_total ??
    payload?.order_total ??
    payload?.total_amount ??
    payload?.bill_amount ??
    payload?.pricing?.grand_total ??
    payload?.pricing?.total ??
    payload?.total ??
    payload?.final_amount ??
    payload?.order_amount ??
    payload?.amount;

  const totalAmount = rawTotalValue !== undefined && rawTotalValue !== null && rawTotalValue !== ''
    ? Number(rawTotalValue) || 0
    : calculatedItemsTotal;

  // 7. Map status (default to 'ACCEPTED')
  const status = body?.status || payload?.status || payload?.order_status || 'ACCEPTED';

  return {
    orderId,
    source,
    customer,
    items,
    totalAmount,
    status,
    placedAt: payload?.placed_at || payload?.created_at || body?.created_at || new Date().toISOString(),
    tableId: payload?.table_id || payload?.table_number || payload?.table || body?.table_id,
    instructions: payload?.instructions || payload?.special_instructions || payload?.notes || body?.instructions || '',
    raw: body
  };
}
