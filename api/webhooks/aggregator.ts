import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

function formatIST(dateInput?: string | Date) {
  if (!dateInput) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: "0",
      message: `Method ${req.method} Not Allowed. Please use POST for webhook endpoints.`
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // retain string
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: "0",
        message: "Invalid payload: Request body must be a JSON object"
      });
    }

    const details = body.order_details || body.order || body.data || body;

    if (!details || typeof details !== 'object') {
      return res.status(400).json({
        success: "0",
        message: "Invalid payload structure: missing order_details or order object"
      });
    }

    // Extract Order Source (Zomato / Swiggy / Petpooja / Deliverect)
    const rawSource = (details.order_from || details.source || details.order_source || details.aggregator || 'zomato').toString().toLowerCase();
    const sourceUpper = rawSource.includes('swiggy') 
      ? 'SWIGGY' 
      : rawSource.includes('zomato') 
        ? 'ZOMATO' 
        : rawSource.toUpperCase();

    // Extract Order ID & Token (strictly 4-digit pure numeric token)
    const orderId = (details.order_id || details.id || details.order_number || Math.floor(1000 + Math.random() * 9000)).toString();
    let token = details.token ? details.token.toString().replace(/[^0-9]/g, '') : '';
    if (token.length !== 4) {
      token = orderId.replace(/[^0-9]/g, '').slice(-4);
    }
    if (token.length !== 4) {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Customer info
    const customerName = details.customer_name || details.customer?.name || details.client_name || `${sourceUpper} Customer`;
    const customerPhone = details.customer_phone || details.customer?.phone || details.phone || '+919876543210';

    // Parse items
    const rawItems = Array.isArray(details.items) ? details.items : (Array.isArray(details.order_items) ? details.order_items : []);
    const items = rawItems.map((item: any, idx: number) => ({
      id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
      name: item.item_name || item.name || item.title || `Item ${idx + 1}`,
      price: parseFloat(item.price || item.rate || item.unit_price || 0),
      quantity: parseInt(item.quantity || item.qty || 1, 10)
    }));

    if (items.length === 0) {
      items.push({
        id: 'item-1',
        name: details.item_name || 'Chef Special Pizza',
        price: parseFloat(details.price || details.total || 450),
        quantity: 1
      });
    }

    let total = parseFloat(details.total || details.order_total || details.amount || details.grand_total || 0);
    if (!total || total === 0) {
      total = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    }

    const createdAt = details.created_at || details.order_date || details.placed_at || new Date().toISOString();
    const placedAtIst = details.placed_at_ist || formatIST(createdAt);

    const orderRecord = {
      token,
      status: 'pending',
      total,
      items,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_id: `${sourceUpper} Online`,
      created_at: createdAt,
      placed_at_ist: placedAtIst
    };

    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(500).json({
        success: "0",
        message: "Server Configuration Error: Missing or invalid Supabase Environment Variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) in Vercel settings."
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select();

    if (error) {
      console.error('Supabase error inserting webhook order:', error);
      return res.status(500).json({
        success: "0",
        message: `Database error inserting order: ${error.message}`
      });
    }

    const insertedData = data?.[0] || orderRecord;

    return res.status(200).json({
      success: "1",
      message: "Order processed successfully",
      order_id: insertedData.id || orderId,
      token: insertedData.token || token,
      placed_at_ist: insertedData.placed_at_ist || placedAtIst,
      data: {
        ...insertedData,
        placed_at_ist: insertedData.placed_at_ist || placedAtIst
      }
    });

  } catch (err: any) {
    console.error('Vercel Webhook Error:', err);
    return res.status(500).json({
      success: "0",
      message: err?.message || 'Internal server error processing webhook'
    });
  }
}
