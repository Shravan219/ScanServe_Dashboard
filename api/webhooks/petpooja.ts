import crypto from 'crypto';
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

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
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
      } catch {
        try {
          const urlParams = new URLSearchParams(body);
          const orderParam = urlParams.get('order') || urlParams.get('order_details') || urlParams.get('data') || urlParams.get('payload');
          if (orderParam) {
            body = JSON.parse(orderParam);
          }
        } catch {}
      }
    }

    // 1. LOG INCOMING PAYLOAD RIGHT AT THE TOP
    console.log('RECEIVED_PAYLOAD:', JSON.stringify(body, null, 2));

    // Handle Ping / Healthcheck probe
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

    const hasOrderFields = Boolean(
      body?.order_details ||
      body?.order ||
      body?.orders ||
      body?.order_id ||
      body?.orderId ||
      body?.Order_ID ||
      body?.Customer ||
      body?.customer ||
      body?.Item ||
      body?.items ||
      body?.order_items ||
      body?.data
    );

    if (isExplicitPing && !hasOrderFields) {
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

    // 2. ROBUST FIELD EXTRACTION (PETPOOJA, DYNO, AND CUSTOM SCHEMAS)

    // Customer Name
    const rawCustomerName =
      body?.Customer?.Name ||
      body?.Customer?.name ||
      body?.customer_name ||
      body?.customerName ||
      body?.CustomerName ||
      body?.customer?.name ||
      body?.customer?.customer_name ||
      body?.data?.customer_name ||
      body?.data?.customer?.name ||
      body?.delivery_details?.customer_name ||
      body?.delivery_details?.name ||
      body?.user?.name ||
      details?.Customer?.Name ||
      details?.Customer?.name ||
      details?.customer_name ||
      details?.customerName ||
      details?.CustomerName ||
      details?.customer?.name ||
      details?.customer?.customer_name ||
      details?.data?.customer_name ||
      details?.data?.customer?.name ||
      details?.delivery_details?.customer_name ||
      details?.delivery_details?.name ||
      details?.user?.name ||
      details?.recipient_name ||
      details?.client_name ||
      details?.buyer_name ||
      '';

    const customerName = String(rawCustomerName).trim() || 'Guest Customer';

    // Customer Phone
    const rawCustomerPhone =
      body?.Customer?.Mobile ||
      body?.Customer?.mobile ||
      body?.Customer?.Phone ||
      body?.Customer?.phone ||
      body?.customer_phone ||
      body?.customerPhone ||
      body?.CustomerPhone ||
      body?.customer?.phone ||
      body?.customer?.mobile ||
      body?.customer?.phone_number ||
      body?.data?.customer_phone ||
      body?.data?.customer?.phone ||
      body?.delivery_details?.phone ||
      body?.delivery_details?.phone_number ||
      body?.phone_number ||
      body?.mobile ||
      body?.user?.phone ||
      details?.Customer?.Mobile ||
      details?.Customer?.mobile ||
      details?.Customer?.Phone ||
      details?.Customer?.phone ||
      details?.customer_phone ||
      details?.customerPhone ||
      details?.CustomerPhone ||
      details?.customer?.phone ||
      details?.customer?.mobile ||
      details?.customer?.phone_number ||
      details?.data?.customer_phone ||
      details?.data?.customer?.phone ||
      details?.delivery_details?.phone ||
      details?.delivery_details?.phone_number ||
      details?.phone_number ||
      details?.phone ||
      details?.mobile ||
      details?.user?.phone ||
      '';

    const customerPhone = String(rawCustomerPhone).trim() || 'Masked Number';

    // Items Array
    const rawItems =
      (Array.isArray(body?.Item) && body.Item) ||
      (Array.isArray(body?.item) && body.item) ||
      (Array.isArray(body?.items) && body.items) ||
      (Array.isArray(body?.Items) && body.Items) ||
      (Array.isArray(body?.order_items) && body.order_items) ||
      (Array.isArray(body?.orderItems) && body.orderItems) ||
      (Array.isArray(body?.OrderItems) && body.OrderItems) ||
      (Array.isArray(body?.data?.items) && body.data.items) ||
      (Array.isArray(body?.data?.order_items) && body.data.order_items) ||
      (Array.isArray(details?.Item) && details.Item) ||
      (Array.isArray(details?.item) && details.item) ||
      (Array.isArray(details?.items) && details.items) ||
      (Array.isArray(details?.Items) && details.Items) ||
      (Array.isArray(details?.order_items) && details.order_items) ||
      (Array.isArray(details?.orderItems) && details.orderItems) ||
      (Array.isArray(details?.OrderItems) && details.OrderItems) ||
      (Array.isArray(details?.data?.items) && details.data.items) ||
      (Array.isArray(details?.data?.order_items) && details.data.order_items) ||
      [];

    const items = rawItems.map((item: any, idx: number) => {
      const name = String(
        item?.Item_Name ||
        item?.ItemName ||
        item?.item_name ||
        item?.itemName ||
        item?.name ||
        item?.Name ||
        item?.title ||
        item?.Title ||
        item?.item_title ||
        `Item ${idx + 1}`
      ).trim();

      const rawPrice =
        item?.Price ??
        item?.price ??
        item?.Rate ??
        item?.rate ??
        item?.Item_Price ??
        item?.item_price ??
        item?.final_price ??
        item?.unit_price ??
        item?.amount ??
        item?.Amount ??
        0;

      const price = Number(rawPrice) || 0;

      const rawQty =
        item?.Quantity ??
        item?.quantity ??
        item?.Qty ??
        item?.qty ??
        item?.count ??
        item?.Count ??
        item?.item_quantity ??
        1;

      const quantity = Number(rawQty) || 1;

      return {
        id: String(item?.item_id || item?.id || item?.Item_ID || item?.ItemID || `item_${idx + 1}`),
        name: name || `Item ${idx + 1}`,
        price: isNaN(price) ? 0 : price,
        quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
        item_notes: item?.notes || item?.item_notes || item?.special_instructions || item?.instruction || undefined
      };
    });

    // Fallback if no item array was found but single item was provided in root
    if (items.length === 0) {
      const singleName =
        body?.item_name ||
        body?.itemName ||
        body?.Item_Name ||
        details?.item_name ||
        details?.itemName ||
        details?.Item_Name ||
        details?.name ||
        'Order Item';

      const singlePrice = Number(
        body?.price ||
        body?.Price ||
        body?.total ||
        body?.grand_total ||
        details?.price ||
        details?.total ||
        details?.grand_total ||
        0
      ) || 0;

      items.push({
        id: 'item_1',
        name: singleName,
        price: singlePrice,
        quantity: 1
      });
    }

    // Total Amount Extraction
    const calculatedItemsTotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);

    const rawTotalValue =
      body?.Order_Total ??
      body?.order_total ??
      body?.grand_total ??
      body?.Grand_Total ??
      body?.bill_amount ??
      body?.Bill_Amount ??
      body?.total_amount ??
      body?.Total_Amount ??
      body?.total ??
      body?.Total ??
      body?.data?.bill_amount ??
      body?.data?.grand_total ??
      body?.data?.total_amount ??
      body?.pricing?.grand_total ??
      body?.pricing?.total ??
      details?.Order_Total ??
      details?.order_total ??
      details?.grand_total ??
      details?.Grand_Total ??
      details?.bill_amount ??
      details?.Bill_Amount ??
      details?.total_amount ??
      details?.Total_Amount ??
      details?.total ??
      details?.Total ??
      details?.data?.bill_amount ??
      details?.data?.grand_total ??
      details?.data?.total_amount ??
      details?.amount ??
      details?.Amount;

    let total = Number(rawTotalValue);
    if (isNaN(total) || total <= 0) {
      total = calculatedItemsTotal > 0 ? calculatedItemsTotal : 0;
    }

    // Detect Source Channel / Platform
    const rawOrderFrom = (
      body?.channel ||
      body?.source ||
      body?.platform ||
      body?.order_from ||
      body?.orderFrom ||
      details?.order_from ||
      details?.orderFrom ||
      details?.OrderFrom ||
      details?.source ||
      details?.Source ||
      details?.order_source ||
      details?.aggregator ||
      details?.channel ||
      req.headers?.['x-source'] ||
      req.headers?.['x-channel'] ||
      'petpooja'
    ).toString().trim().toLowerCase();

    let detectedPlatform: 'swiggy' | 'zomato' | 'other_online' = 'other_online';
    let sourceUpper = 'PETPOOJA';

    if (rawOrderFrom.includes('swiggy') || rawOrderFrom === 'sw') {
      detectedPlatform = 'swiggy';
      sourceUpper = 'SWIGGY';
    } else if (rawOrderFrom.includes('zomato') || rawOrderFrom === 'zm') {
      detectedPlatform = 'zomato';
      sourceUpper = 'ZOMATO';
    } else if (rawOrderFrom.includes('dyno')) {
      detectedPlatform = 'other_online';
      sourceUpper = 'DYNO';
    } else if (rawOrderFrom.includes('magicpin')) {
      detectedPlatform = 'other_online';
      sourceUpper = 'MAGICPIN';
    } else if (rawOrderFrom) {
      sourceUpper = rawOrderFrom.toUpperCase();
    }

    // 2. UNIQUE ORDER ID HANDLER FOR TESTING & REGULAR ORDERS
    const rawProvidedId =
      body?.Order_ID ||
      body?.order_id ||
      body?.orderId ||
      body?.id ||
      details?.Order_ID ||
      details?.order_id ||
      details?.orderId ||
      details?.OrderID ||
      details?.id ||
      details?.order_number ||
      details?.orderNumber ||
      details?.bill_no;

    let finalOrderId = rawProvidedId ? String(rawProvidedId) : `TEST-${Date.now()}`;
    // If it's explicitly named test or duplicate-prone, ensure uniqueness
    if (finalOrderId.toLowerCase().includes('test') && !finalOrderId.includes(String(Date.now()).slice(0, 8))) {
      finalOrderId = `${finalOrderId}_${Date.now()}`;
    }

    let token = String(
      body?.token ||
      body?.token_no ||
      body?.Token ||
      details?.token ||
      details?.Token ||
      details?.token_no ||
      ''
    ).replace(/[^0-9]/g, '');

    if (token.length !== 4) {
      token = finalOrderId.replace(/[^0-9]/g, '').slice(-4);
    }
    if (token.length !== 4) {
      token = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Status Mapping
    const rawStatus = String(
      body?.status ||
      body?.order_status ||
      body?.Status ||
      details?.status ||
      details?.Status ||
      'pending'
    ).toLowerCase();

    let safeStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
    if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted' || rawStatus === 'confirmed' || rawStatus === '1') {
      safeStatus = 'preparing';
    } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === '2') {
      safeStatus = 'ready';
    } else if (rawStatus === 'completed' || rawStatus === 'dispatched' || rawStatus === 'delivered' || rawStatus === '3') {
      safeStatus = 'completed';
    }

    const createdAt = details?.created_at || details?.order_date || body?.created_at || body?.placed_at || new Date().toISOString();
    const placedAtIst = details?.placed_at_ist || body?.placed_at_ist || formatIST(createdAt);

    // 3. VALIDATE REQUIRED SCHEMA FIELDS & CONSTRUCT UNIFIED SERVER ORDER
    const serverOrder: ServerOrder = {
      id: finalOrderId,
      token: `#${token}`,
      status: safeStatus,
      total,
      items,
      customer_name: customerName,
      customer_phone: customerPhone,
      table_id: body?.table_id || details?.table_id || `${sourceUpper} Online`,
      order_type: 'aggregator',
      aggregator_platform: detectedPlatform,
      created_at: createdAt,
      placed_at_ist: placedAtIst,
      notes: body?.instructions || body?.special_instructions || details?.notes || details?.special_instructions || `Ref: ${finalOrderId}`
    };

    // Save to server memory store
    try {
      saveMemoryOrder(serverOrder);
    } catch (e: any) {
      console.warn('[Petpooja Webhook] Memory order save warning:', e?.message);
    }

    // Record Inbound Log for Live Inspector
    try {
      recordInboundLog({
        id: `petpooja_log_${Date.now()}_${finalOrderId}`,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: '/api/webhooks/petpooja',
        ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        headers: req.headers || {},
        raw_body: body,
        detected_platform: 'Vyoma Webhook',
        detected_source: sourceUpper,
        order_id: finalOrderId,
        token: serverOrder.token,
        item_count: items.length,
        total_amount: total,
        status_code: 200,
        success: true,
        message: `Order ${finalOrderId} received (${sourceUpper}) for ${customerName} (₹${total})`,
        duration_ms: Date.now() - startTime
      });
    } catch (logErr: any) {
      console.warn('[Petpooja Webhook] Log recording warning:', logErr?.message);
    }

    // Broadcast Real-Time SSE to Kitchen Display System & Dashboard
    try {
      broadcastEvent('new_order', serverOrder);
      broadcastEvent('order_created', serverOrder);
    } catch (sseErr: any) {
      console.warn('[Petpooja Webhook] SSE broadcast warning:', sseErr?.message);
    }

    // 1. EXPLICIT DATABASE LOGGING & ERROR HANDLING
    const supabase = getSupabaseClient();
    if (supabase) {
      console.log('ATTEMPTING_DB_PERSIST:', {
        orderId: finalOrderId,
        customerName: serverOrder.customer_name,
        grandTotal: serverOrder.total
      });

      // Prepare validated non-nullable fields matching public.orders schema
      const dbPayload: Record<string, any> = {
        token: serverOrder.token,
        status: serverOrder.status || 'pending',
        total: Number(serverOrder.total) || 0,
        items: serverOrder.items || [],
        customer_name: serverOrder.customer_name || 'Guest Customer',
        customer_phone: serverOrder.customer_phone || 'Masked Number',
        table_id: String(serverOrder.table_id || `${sourceUpper} Online`),
        created_at: serverOrder.created_at || new Date().toISOString(),
        gstin: body?.gstin || details?.gstin || null
      };

      // Set valid UUID for PostgreSQL UUID primary key compatibility
      if (isUUID(finalOrderId)) {
        dbPayload.id = finalOrderId;
      } else {
        dbPayload.id = crypto.randomUUID();
      }

      try {
        const { data: dbData, error: dbError } = await supabase
          .from('orders')
          .insert([dbPayload])
          .select();

        if (dbError) {
          console.error('DB_WRITE_FAILED:', dbError);
          return res.status(500).json({
            success: false,
            error: dbError.message || 'Database insert failed',
            details: dbError,
            order_id: finalOrderId
          });
        }

        console.log('DB_PERSIST_SUCCESS:', {
          orderId: finalOrderId,
          dbId: dbPayload.id,
          dbData
        });
      } catch (dbException: any) {
        console.error('DB_WRITE_FAILED:', dbException);
        return res.status(500).json({
          success: false,
          error: dbException?.message || 'Database connection or query exception',
          order_id: finalOrderId
        });
      }
    } else {
      console.warn('SUPABASE_NOT_CONFIGURED: Order persisted in memory only.');
    }

    // Return official Petpooja acknowledgement response
    return res.status(200).json({
      success: '1',
      message: 'Order saved successfully',
      order_id: finalOrderId,
      token: serverOrder.token,
      customer: customerName,
      total_amount: total,
      items_count: items.length,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('[Petpooja Webhook Exception]:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error processing webhook order payload',
      timestamp: new Date().toISOString()
    });
  }
}
