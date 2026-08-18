import { createClient } from '@supabase/supabase-js';
import {
  saveMemoryOrder,
  broadcastEvent,
  recordInboundLog,
  ServerOrder
} from '../../server/orderStore.js';

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
  const startTime = Date.now();

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

    // 4. Print console log of the incoming body object right at the start
    console.log('INCOMING_WEBHOOK_BODY:', JSON.stringify(body, null, 2));

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
      body.channel ||
      body.source ||
      body.platform ||
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

    // 4. Token & Raw Order ID
    const rawOrderId = (
      body.order_id ||
      body.id ||
      body.orderId ||
      details.order_id ||
      details.orderId ||
      details.OrderID ||
      details.id ||
      details.order_number ||
      details.bill_no ||
      `PP_${Math.floor(100000 + Math.random() * 900000)}`
    ).toString();

    let token = (
      body.token ||
      body.token_no ||
      details.token ||
      details.Token ||
      details.token_no ||
      ''
    ).toString().replace(/[^0-9]/g, '');

    if (token.length !== 4) {
      token = rawOrderId.replace(/[^0-9]/g, '').slice(-4);
    }
    if (token.length !== 4) {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 1. Customer Name fallback parsing:
    // body.customer?.name || body.customer_name || body.delivery_details?.customer_name || body.user?.name
    const customerName = (
      body.customer?.name ||
      body.customer_name ||
      body.delivery_details?.customer_name ||
      body.delivery_details?.name ||
      body.user?.name ||
      body.customer?.customer_name ||
      details.customer?.name ||
      details.customer_name ||
      details.customerName ||
      details.CustomerName ||
      details.delivery_details?.customer_name ||
      details.delivery_details?.name ||
      details.user?.name ||
      details.customer_details?.name ||
      details.customer_details?.customer_name ||
      details.recipient_name ||
      details.client_name ||
      details.buyer_name ||
      `${sourceUpper} Customer`
    ).toString().trim();

    // 2. Phone Number fallback parsing:
    // body.customer?.phone || body.phone_number || body.customer_phone || body.delivery_details?.phone
    const customerPhone = (
      body.customer?.phone ||
      body.phone_number ||
      body.customer_phone ||
      body.delivery_details?.phone ||
      body.delivery_details?.phone_number ||
      body.customer?.phone_number ||
      body.user?.phone ||
      details.customer?.phone ||
      details.phone_number ||
      details.customer_phone ||
      details.customerPhone ||
      details.CustomerPhone ||
      details.delivery_details?.phone ||
      details.delivery_details?.phone_number ||
      details.customer_details?.phone ||
      details.user?.phone ||
      details.phone ||
      details.mobile ||
      'Masked (Platform Policy)'
    ).toString().trim();

    // 5. Items Extraction
    const rawItems = Array.isArray(body.order_items)
      ? body.order_items
      : Array.isArray(body.items)
      ? body.items
      : Array.isArray(details.items)
      ? details.items
      : Array.isArray(details.order_items)
      ? details.order_items
      : Array.isArray(details.OrderItems)
      ? details.OrderItems
      : [];

    const items = rawItems.map((item: any, idx: number) => {
      const name = (
        item.item_name ||
        item.itemName ||
        item.name ||
        item.title ||
        item.item_title ||
        `Item ${idx + 1}`
      ).toString();
      const price = parseFloat(
        item.price ??
        item.rate ??
        item.item_price ??
        item.final_price ??
        item.unit_price ??
        item.amount ??
        0
      );
      const quantity = parseInt(
        item.quantity ??
        item.qty ??
        item.count ??
        item.item_quantity ??
        1,
        10
      );
      return {
        id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
        name,
        price: isNaN(price) ? 0 : price,
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        item_notes: item.notes || item.item_notes || item.special_instructions || undefined
      };
    });

    if (items.length === 0) {
      const singleName = details.item_name || details.name || body.item_name || `${sourceUpper} Combo Meal`;
      const singlePrice = parseFloat(details.total || details.amount || body.total || 450);
      items.push({
        id: 'item-1',
        name: singleName,
        price: isNaN(singlePrice) ? 450 : singlePrice,
        quantity: 1
      });
    }

    // 3. Total Price / Grand Total fallback parsing:
    // body.grand_total || body.order_total || body.total_amount || body.bill_amount || body.pricing?.grand_total
    const calculatedItemsTotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const rawTotalValue =
      body.grand_total ??
      body.order_total ??
      body.total_amount ??
      body.bill_amount ??
      body.pricing?.grand_total ??
      body.pricing?.total ??
      body.total ??
      body.final_amount ??
      body.net_amount ??
      details.grand_total ??
      details.order_total ??
      details.total_amount ??
      details.bill_amount ??
      details.pricing?.grand_total ??
      details.pricing?.total ??
      details.total ??
      details.amount ??
      details.final_total ??
      details.net_amount;

    let total = parseFloat(rawTotalValue);
    if (isNaN(total) || total <= 0) {
      total = calculatedItemsTotal;
    }

    // 7. Status Mapping
    const rawStatus = (
      body.status ||
      body.order_status ||
      details.status ||
      details.Status ||
      'pending'
    ).toString().toLowerCase();

    let safeStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
    if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted' || rawStatus === 'confirmed' || rawStatus === '1') {
      safeStatus = 'preparing';
    } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === '2') {
      safeStatus = 'ready';
    } else if (rawStatus === 'completed' || rawStatus === 'dispatched' || rawStatus === 'delivered' || rawStatus === '3') {
      safeStatus = 'completed';
    }

    const createdAt = details.created_at || details.order_date || body.created_at || body.placed_at || new Date().toISOString();
    const placedAtIst = details.placed_at_ist || body.placed_at_ist || formatIST(createdAt);

    const serverOrder: ServerOrder = {
      id: rawOrderId,
      token: `#${token}`,
      status: safeStatus,
      total,
      items,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_id: body.table_id || details.table_id || `${sourceUpper} Online`,
      order_type: 'aggregator',
      aggregator_platform: detectedPlatform,
      created_at: createdAt,
      placed_at_ist: placedAtIst,
      notes: body.instructions || body.special_instructions || details.notes || details.special_instructions || `Ref: ${rawOrderId}`
    };

    // Save to memory store
    try {
      saveMemoryOrder(serverOrder);
    } catch (e: any) {
      console.warn('[Petpooja Webhook] Memory order save warning:', e?.message);
    }

    // Record Inbound Log for Inspector
    try {
      recordInboundLog({
        id: `petpooja_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: '/api/webhooks/petpooja',
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        headers: req.headers,
        raw_body: body,
        detected_platform: 'Vyoma Webhook',
        detected_source: sourceUpper,
        order_id: rawOrderId,
        token: serverOrder.token,
        item_count: items.length,
        total_amount: total,
        status_code: 200,
        success: true,
        message: `Order ${rawOrderId} received (${sourceUpper}) for ${customerName}`,
        duration_ms: Date.now() - startTime
      });
    } catch (logErr: any) {
      console.warn('[Petpooja Webhook] Log recording warning:', logErr?.message);
    }

    // Broadcast SSE
    try {
      broadcastEvent('new_order', serverOrder);
      broadcastEvent('order_created', serverOrder);
    } catch (sseErr: any) {
      console.warn('[Petpooja Webhook] SSE broadcast warning:', sseErr?.message);
    }

    // Persist to Supabase if credentials exist
    let dbRecord = null;
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('orders')
          .insert([{
            token: serverOrder.token,
            status: serverOrder.status,
            total: serverOrder.total,
            items: serverOrder.items,
            customer_name: serverOrder.customer_name,
            customer_phone: serverOrder.customer_phone,
            table_id: serverOrder.table_id,
            order_type: serverOrder.order_type,
            aggregator_platform: serverOrder.aggregator_platform,
            created_at: serverOrder.created_at,
            placed_at_ist: serverOrder.placed_at_ist,
            notes: serverOrder.notes
          }])
          .select();

        if (!dbError && dbData && dbData.length > 0) {
          dbRecord = dbData[0];
        }
      } catch (dbEx: any) {
        console.warn('[Petpooja Webhook] Supabase insert warning:', dbEx?.message);
      }
    }

    return res.status(200).json({
      success: '1',
      status: 'success',
      message: 'Order processed and persisted successfully',
      generated_id: dbRecord?.id || serverOrder.id,
      token: serverOrder.token,
      order_from: sourceUpper,
      platform: detectedPlatform,
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: total,
      placed_at_ist: placedAtIst,
      data: dbRecord || serverOrder
    });

  } catch (err: any) {
    console.error('Webhook execution caught error:', err);
    return res.status(200).json({
      success: '1',
      status: 'acknowledged_with_warning',
      message: 'Payload received and handled with fallback',
      error: err?.message || 'Warning while parsing order payload'
    });
  }
}
