import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function processWebhookPayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    return {
      status: 400,
      data: {
        success: "0",
        message: "Invalid payload: Request body must be a JSON object"
      }
    };
  }

  // Support nested payload structures (e.g. { order_details: { ... } } or { order: { ... } } or flat)
  const details = payload.order_details || payload.order || payload.data || payload;

  if (!details || typeof details !== 'object') {
    return {
      status: 400,
      data: {
        success: "0",
        message: "Invalid payload structure: missing order_details or order object"
      }
    };
  }

  // Extract Order Source (Zomato / Swiggy / Petpooja / Deliverect)
  const rawSource = (details.order_from || details.source || details.order_source || details.aggregator || 'zomato').toString().toLowerCase();
  const sourceUpper = rawSource.includes('swiggy') 
    ? 'SWIGGY' 
    : rawSource.includes('zomato') 
      ? 'ZOMATO' 
      : rawSource.toUpperCase();

  // Extract Order ID & Token
  const orderId = (details.order_id || details.id || details.order_number || Math.floor(1000 + Math.random() * 9000)).toString();
  const tokenPrefix = sourceUpper.startsWith('SWI') ? 'SWI' : sourceUpper.startsWith('ZOM') ? 'ZOM' : sourceUpper.slice(0, 3);
  
  // Format token e.g., ZOM-9821 or SWI-4412
  const token = details.token || `${tokenPrefix}-${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

  // Customer info
  const customerName = details.customer_name || details.customer?.name || details.client_name || `${sourceUpper} Customer`;
  const customerPhone = details.customer_phone || details.customer?.phone || details.phone || '+919876543210';

  // Parse items
  const rawItems = Array.isArray(details.items) ? details.items : (Array.isArray(details.order_items) ? details.order_items : []);
  
  const items = rawItems.map((item: any, idx: number) => {
    const name = item.item_name || item.name || item.title || `Item ${idx + 1}`;
    const price = parseFloat(item.price || item.rate || item.unit_price || 0);
    const quantity = parseInt(item.quantity || item.qty || 1, 10);
    return {
      id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
      name,
      price,
      quantity
    };
  });

  // Default sample items if array was empty
  if (items.length === 0) {
    items.push({
      id: 'item-1',
      name: details.item_name || 'Chef Special Pizza',
      price: parseFloat(details.price || details.total || 450),
      quantity: 1
    });
  }

  // Total Amount
  let total = parseFloat(details.total || details.order_total || details.amount || details.grand_total || 0);
  if (!total || total === 0) {
    total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
  }

  // Timestamp
  const createdAt = details.created_at || new Date().toISOString();

  const orderRecord = {
    token,
    status: 'pending',
    total,
    items,
    customer_name: customerName,
    customer_phone: customerPhone,
    table_id: `${sourceUpper} Online`,
    created_at: createdAt
  };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .insert([orderRecord])
    .select();

  if (error) {
    console.error('Supabase error inserting webhook order:', error);
    return {
      status: 500,
      data: {
        success: "0",
        message: `Database error inserting order: ${error.message}`
      }
    };
  }

  return {
    status: 200,
    data: {
      success: "1",
      message: "Order processed successfully",
      order_id: data?.[0]?.id,
      token: data?.[0]?.token || token,
      data: data?.[0]
    }
  };
}
