import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: true,
  },
};

function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    return null;
  }
}

function formatIST(dateInput?: string | Date) {
  if (!dateInput) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

function extractOrderObject(body: any): any {
  if (!body) return null;
  let current = body;

  if (typeof current === 'string') {
    try {
      current = JSON.parse(current);
    } catch {
      try {
        const urlParams = new URLSearchParams(current);
        const orderParam = urlParams.get('order') || urlParams.get('order_details') || urlParams.get('data') || urlParams.get('payload');
        if (orderParam) {
          current = JSON.parse(orderParam);
        }
      } catch {}
    }
  }

  if (Array.isArray(current) && current.length > 0) {
    current = current[0];
  }

  if (typeof current !== 'object' || current === null) {
    return null;
  }

  const wrappers = [
    'order_details',
    'orderDetails',
    'OrderDetails',
    'Order_Details',
    'order',
    'Order',
    'order_info',
    'OrderInfo',
    'data',
    'payload'
  ];

  for (const key of wrappers) {
    if (current[key]) {
      let sub = current[key];
      if (typeof sub === 'string') {
        try { sub = JSON.parse(sub); } catch {}
      }
      if (typeof sub === 'object' && sub !== null) {
        if (Array.isArray(sub) && sub.length > 0) return sub[0];
        return sub;
      }
    }
  }

  return current;
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID, x-requested-with');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Browser visit or tester GET / HEAD healthcheck
  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.status(200).json({
      success: '1',
      status: 'online',
      message: 'Vyoma Petpooja Webhook Endpoint is ACTIVE and ready to receive POST order payloads.',
      endpoint: '/api/webhooks/petpooja',
      timestamp: new Date().toISOString()
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {}
    }

    // 2. Explicit or empty Ping Probe acknowledgment
    const isExplicitPing =
      !body ||
      body === 'ping' ||
      body?.ping !== undefined ||
      body?.action === 'ping' ||
      body?.event === 'ping' ||
      body?.type === 'ping' ||
      body?.status === 'ping' ||
      body?.event_type === 'ping' ||
      body?.healthcheck !== undefined ||
      body?.test === true ||
      (typeof body === 'object' && Object.keys(body).length === 0);

    if (isExplicitPing && (!body?.order_details && !body?.order && !body?.order_id && !body?.items)) {
      return res.status(200).json({
        success: '1',
        status: 'success',
        success_bool: true,
        http_code: 200,
        message: 'Ping acknowledged successfully. Vyoma Webhook Endpoint is online.',
        pong: true,
        timestamp: new Date().toISOString()
      });
    }

    const details = extractOrderObject(body) || body || {};

    // 3. Detect Platform
    const rawOrderFrom = (
      details.order_from ||
      details.orderFrom ||
      details.OrderFrom ||
      details.source ||
      details.Source ||
      details.order_source ||
      details.aggregator ||
      details.channel ||
      req.headers?.['x-source'] ||
      ''
    ).toString().trim().toLowerCase();

    let detectedPlatform: 'swiggy' | 'zomato' | 'other_online' = 'other_online';
    let sourceUpper = 'ONLINE';

    if (rawOrderFrom.includes('swiggy') || rawOrderFrom === 'sw') {
      detectedPlatform = 'swiggy';
      sourceUpper = 'SWIGGY';
    } else if (rawOrderFrom.includes('zomato') || rawOrderFrom === 'zm') {
      detectedPlatform = 'zomato';
      sourceUpper = 'ZOMATO';
    } else if (rawOrderFrom.includes('magicpin')) {
      detectedPlatform = 'other_online';
      sourceUpper = 'MAGICPIN';
    } else if (rawOrderFrom.includes('petpooja')) {
      detectedPlatform = 'other_online';
      sourceUpper = 'PETPOOJA';
    } else if (rawOrderFrom) {
      sourceUpper = rawOrderFrom.toUpperCase();
    }

    // 4. Token & Raw Petpooja Order ID
    const rawOrderId = (
      details.order_id ||
      details.orderId ||
      details.OrderID ||
      details.id ||
      details.order_number ||
      details.bill_no ||
      `PP_${Math.floor(100000 + Math.random() * 900000)}`
    ).toString();

    let token = (details.token || details.Token || details.token_no || '').toString().replace(/[^0-9]/g, '');
    if (token.length !== 4) {
      token = rawOrderId.replace(/[^0-9]/g, '').slice(-4);
    }
    if (token.length !== 4) {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 5. Items Extraction
    const rawItems = Array.isArray(details.items)
      ? details.items
      : Array.isArray(details.order_items)
      ? details.order_items
      : Array.isArray(details.OrderItems)
      ? details.OrderItems
      : [];

    const items = rawItems.map((item: any, idx: number) => {
      const name = (item.item_name || item.itemName || item.name || item.title || `Item ${idx + 1}`).toString();
      const price = parseFloat(item.price || item.item_price || item.rate || 0);
      const quantity = parseInt(item.quantity || item.qty || 1, 10);
      return {
        id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
        name,
        price: isNaN(price) ? 0 : price,
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        item_notes: item.notes || item.item_notes || undefined
      };
    });

    if (items.length === 0) {
      const singleName = details.item_name || details.name || `${sourceUpper} Combo Meal`;
      const singlePrice = parseFloat(details.total || details.amount || 450);
      items.push({
        id: 'item-1',
        name: singleName,
        price: isNaN(singlePrice) ? 450 : singlePrice,
        quantity: 1
      });
    }

    // 6. Total Calculation
    let total = parseFloat(details.total || details.order_total || details.amount || details.grand_total || 0);
    if (isNaN(total) || total <= 0) {
      total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    }

    // 7. Status Mapping (Constrained strictly to postgres array ['pending', 'preparing', 'ready', 'completed'])
    const rawStatus = (details.status || details.Status || 'pending').toString().toLowerCase();
    let safeStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
    
    if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted' || rawStatus === '1') {
      safeStatus = 'preparing';
    } else if (rawStatus === 'ready' || rawStatus === '2') {
      safeStatus = 'ready';
    } else if (rawStatus === 'completed' || rawStatus === 'dispatched' || rawStatus === '3') {
      safeStatus = 'completed';
    }

    const createdAt = details.created_at || details.order_date || new Date().toISOString();
    const placedAtIst = details.placed_at_ist || formatIST(createdAt);

    // Omit 'id' field so Postgres generates a valid UUID automatically
    const orderRecord = {
      token,
      status: safeStatus,
      total,
      items, // Passed directly into jsonb column
      customer_name: details.customer_name || details.customerName || `${sourceUpper} Customer`,
      customer_phone: details.customer_phone || details.phone || '+919876543210',
      table_id: details.table_id || `${sourceUpper} Online`,
      order_type: 'aggregator',
      aggregator_platform: detectedPlatform,
      created_at: createdAt,
      placed_at_ist: placedAtIst,
      notes: details.notes || details.special_instructions || `Petpooja Ref: ${rawOrderId}`
    };

    // 8. Persist to Supabase
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[WEBHOOK ERROR] Supabase credentials missing from environment variables.');
      return res.status(500).json({
        success: '0',
        status: 'error',
        message: 'Database configuration missing on server. Check env variables.'
      });
    }

    const { data: dbData, error: dbError } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select();

    if (dbError) {
      console.error('[SUPABASE INSERT FAILED]:', dbError);
      return res.status(500).json({
        success: '0',
        status: 'db_error',
        message: dbError.message,
        code: dbError.code,
        details: dbError.details
      });
    }

    console.log('[SUCCESS] Order persisted to Supabase:', dbData);

    return res.status(200).json({
      success: '1',
      status: 'success',
      message: 'Order processed and persisted successfully',
      generated_id: dbData[0]?.id,
      token: orderRecord.token,
      order_from: sourceUpper,
      platform: detectedPlatform,
      placed_at_ist: placedAtIst,
      data: dbData[0]
    });

  } catch (err: any) {
    console.error('Webhook execution caught error:', err);
    return res.status(500).json({
      success: '0',
      status: 'error',
      message: err?.message || 'Internal server error processing payload'
    });
  }
}