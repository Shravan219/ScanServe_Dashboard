export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'waiting for payment' | 'completed' | 'cancelled';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string | number;
  table_number: string;
  capacity: number;
  status: TableStatus;
  section?: string;
  active_order_id?: string | null;
  customer_name?: string | null;
  total_amount?: number;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  item_notes?: string;
}

export interface Order {
  id: string;
  created_at: string;
  placed_at_ist?: string;
  token: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  table_id?: string | number;
  gstin?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery' | 'aggregator';
  aggregator_platform?: 'swiggy' | 'zomato' | 'ubereats' | 'magicpin' | string;
  source?: string;
  callback_url?: string;
  notes?: string;
  custom_instructions?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  discount_price?: number | null;
  category: string;
  image?: string;
  is_sold_out: boolean;
}

export function normalizeOrderItems(rawItems: any): OrderItem[] {
  let arr: any[] = [];
  if (Array.isArray(rawItems)) {
    arr = rawItems;
  } else if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && typeof parsed === 'object') {
        arr = [parsed];
      } else if (rawItems.trim()) {
        arr = [{ name: rawItems.trim(), quantity: 1, price: 0 }];
      }
    } catch {
      if (rawItems.trim()) {
        arr = [{ name: rawItems.trim(), quantity: 1, price: 0 }];
      }
    }
  } else if (rawItems && typeof rawItems === 'object') {
    arr = [rawItems];
  }

  if (arr.length === 0) {
    return [{ id: '1', name: 'Order Item', quantity: 1, price: 0 }];
  }

  return arr.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return { id: `item_${idx + 1}`, name: item, quantity: 1, price: 0 };
    }
    const name = String(
      item?.Item_Name ||
      item?.ItemName ||
      item?.item_name ||
      item?.itemName ||
      item?.name ||
      item?.Name ||
      item?.title ||
      item?.Title ||
      item?.description ||
      item?.dish_name ||
      `Item ${idx + 1}`
    ).trim();

    const price = Number(
      item?.price ??
      item?.Price ??
      item?.Rate ??
      item?.rate ??
      item?.item_price ??
      item?.Item_Price ??
      item?.unit_price ??
      item?.amount ??
      0
    ) || 0;

    const quantity = Number(
      item?.quantity ??
      item?.Quantity ??
      item?.qty ??
      item?.Qty ??
      item?.count ??
      item?.Count ??
      1
    ) || 1;

    return {
      id: String(item?.id || item?.item_id || item?.Item_ID || `item_${idx + 1}`),
      name: name || `Item ${idx + 1}`,
      quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
      price: isNaN(price) ? 0 : price,
      item_notes: item?.notes || item?.item_notes || item?.special_instructions || undefined
    };
  });
}

export function normalizeOrder(rawOrder: any): Order {
  if (!rawOrder) {
    return {
      id: `ord_${Date.now()}`,
      created_at: new Date().toISOString(),
      token: '#0000',
      status: 'pending',
      total: 0,
      items: [{ id: '1', name: 'Order Item', quantity: 1, price: 0 }]
    };
  }
  return {
    ...rawOrder,
    items: normalizeOrderItems(
      rawOrder?.items || 
      rawOrder?.order_items || 
      rawOrder?.orderItems || 
      rawOrder?.Item || 
      rawOrder?.item || 
      rawOrder?.OrderItems || 
      rawOrder?.order_details ||
      rawOrder?.OrderDetails ||
      rawOrder?.cart ||
      rawOrder?.dishes
    )
  };
}

export function getOrderPlatform(order: Order): 'swiggy' | 'zomato' | 'other_online' | 'dine_in' {
  if (order.aggregator_platform === 'swiggy') return 'swiggy';
  if (order.aggregator_platform === 'zomato') return 'zomato';

  const tokenUpper = (order.token || '').toUpperCase();
  if (tokenUpper.startsWith('SWI') || tokenUpper.startsWith('SW') || tokenUpper.includes('SWI') || tokenUpper.includes('SWIGGY')) return 'swiggy';
  if (tokenUpper.startsWith('ZOM') || tokenUpper.startsWith('ZM') || tokenUpper.includes('ZOM') || tokenUpper.includes('ZOMATO')) return 'zomato';

  const tableStr = (order.table_id || '').toString().toLowerCase();
  if (tableStr.includes('swiggy') || tableStr.includes('sw_')) return 'swiggy';
  if (tableStr.includes('zomato') || tableStr.includes('zom_')) return 'zomato';

  const name = (order.customer_name || '').toLowerCase();
  const notes = (order.notes || '').toLowerCase();
  const instructions = (order.custom_instructions || '').toLowerCase();
  const fullText = `${name} ${notes} ${instructions} ${tableStr}`;

  if (fullText.includes('swiggy')) return 'swiggy';
  if (fullText.includes('zomato')) return 'zomato';

  if (order.order_type === 'aggregator' || order.order_type === 'delivery') {
    return 'other_online';
  }

  if (fullText.includes('online') || fullText.includes('ubereats') || fullText.includes('magicpin')) {
    return 'other_online';
  }

  return 'dine_in';
}
