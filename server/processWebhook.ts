import {
  getSupabaseClient,
  saveMemoryOrder,
  getMemoryOrder,
  formatIST,
  recordInboundLog,
  broadcastEvent,
  ServerOrder,
  InboundWebhookLog
} from './orderStore';

/**
 * Deep parser to extract an order object from any webhook body representation
 * (JSON object, stringified JSON, form body with 'order'/'order_details'/'data'/'payload' key, or array)
 */
function extractOrderObject(body: any): any {
  if (!body) return null;

  let current = body;

  // If body is a string, try JSON parse
  if (typeof current === 'string') {
    try {
      current = JSON.parse(current);
    } catch {
      // Could be URL-encoded query string like order=%7B...%7D
      try {
        const urlParams = new URLSearchParams(current);
        const orderParam = urlParams.get('order') || urlParams.get('order_details') || urlParams.get('data') || urlParams.get('payload');
        if (orderParam) {
          current = JSON.parse(orderParam);
        }
      } catch {
        // failed parse
      }
    }
  }

  // If array, take the first order object
  if (Array.isArray(current) && current.length > 0) {
    current = current[0];
  }

  if (typeof current !== 'object' || current === null) {
    return null;
  }

  // Check common wrapper keys
  const wrappers = [
    'order_details',
    'orderDetails',
    'OrderDetails',
    'Order_Details',
    'order',
    'Order',
    'order_info',
    'OrderInfo',
    'orderInfo',
    'data',
    'Data',
    'payload',
    'Payload',
    'orderData',
    'OrderData'
  ];

  for (const key of wrappers) {
    if (current[key]) {
      let sub = current[key];
      if (typeof sub === 'string') {
        try {
          sub = JSON.parse(sub);
        } catch {
          // ignore
        }
      }
      if (typeof sub === 'object' && sub !== null) {
        if (Array.isArray(sub) && sub.length > 0) {
          return sub[0];
        }
        return sub;
      }
    }
  }

  return current;
}

export async function processWebhookPayload(
  rawBody: any,
  headers?: Record<string, any>,
  meta?: { method?: string; path?: string; ip?: string }
) {
  const startTime = Date.now();
  const reqMethod = meta?.method || 'POST';
  const reqPath = meta?.path || '/api/webhooks/petpooja';

  // 0. Handle Ping / Healthcheck Probes from Testers, Petpooja, Zomato, Swiggy
  const isExplicitPing =
    !rawBody ||
    rawBody === 'ping' ||
    rawBody?.ping !== undefined ||
    rawBody?.action === 'ping' ||
    rawBody?.event === 'ping' ||
    rawBody?.type === 'ping' ||
    rawBody?.status === 'ping' ||
    rawBody?.event_type === 'ping' ||
    rawBody?.healthcheck !== undefined ||
    rawBody?.test === true ||
    (typeof rawBody === 'object' && Object.keys(rawBody).length === 0);

  if (isExplicitPing && (!rawBody?.order_details && !rawBody?.order && !rawBody?.order_id && !rawBody?.items)) {
    const logEntry: InboundWebhookLog = {
      id: `in_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      method: reqMethod,
      path: reqPath,
      ip: meta?.ip,
      headers: headers || {},
      raw_body: rawBody || { ping: true },
      detected_platform: 'ping',
      detected_source: 'PING_CHECK',
      item_count: 0,
      total_amount: 0,
      status_code: 200,
      success: true,
      message: 'Ping / Healthcheck probe acknowledged successfully',
      duration_ms: Date.now() - startTime
    };
    recordInboundLog(logEntry);

    return {
      status: 200,
      data: {
        success: '1',
        status: 'success',
        success_bool: true,
        http_code: 200,
        message: 'Ping acknowledged successfully. Vyoma Webhook Endpoint is online.',
        pong: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  const details = extractOrderObject(rawBody);

  if (!details || typeof details !== 'object') {
    const errorMsg = 'Invalid webhook payload: missing order data or could not parse JSON body';
    const log: InboundWebhookLog = {
      id: `in_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      method: reqMethod,
      path: reqPath,
      ip: meta?.ip,
      headers: headers || {},
      raw_body: rawBody,
      detected_platform: 'unknown',
      detected_source: 'UNKNOWN',
      item_count: 0,
      total_amount: 0,
      status_code: 400,
      success: false,
      message: errorMsg,
      error: errorMsg,
      duration_ms: Date.now() - startTime
    };
    recordInboundLog(log);

    return {
      status: 400,
      data: {
        success: '0',
        status: 'error',
        success_bool: false,
        message: errorMsg
      }
    };
  }

  // 1. Detect Aggregator Source / Platform
  const rawOrderFrom = (
    details.order_from ||
    details.orderFrom ||
    details.OrderFrom ||
    details.source ||
    details.Source ||
    details.order_source ||
    details.orderSource ||
    details.aggregator ||
    details.Aggregator ||
    details.aggregator_platform ||
    details.channel ||
    details.delivery_service ||
    headers?.['x-source'] ||
    headers?.['X-Source'] ||
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
  } else if (rawOrderFrom.includes('ubereats') || rawOrderFrom.includes('uber')) {
    detectedPlatform = 'other_online';
    sourceUpper = 'UBEREATS';
  } else if (rawOrderFrom.includes('petpooja')) {
    detectedPlatform = 'other_online';
    sourceUpper = 'PETPOOJA';
  } else if (rawOrderFrom) {
    sourceUpper = rawOrderFrom.toUpperCase();
  } else {
    // Check hints from text
    const textHints = `${details.table_id || ''} ${details.order_id || ''} ${details.notes || ''} ${details.special_instructions || ''}`.toLowerCase();
    if (textHints.includes('swiggy')) {
      detectedPlatform = 'swiggy';
      sourceUpper = 'SWIGGY';
    } else if (textHints.includes('zomato')) {
      detectedPlatform = 'zomato';
      sourceUpper = 'ZOMATO';
    }
  }

  // 2. Extract Order ID & 4-Digit Token
  const rawOrderId = (
    details.order_id ||
    details.orderId ||
    details.OrderID ||
    details.id ||
    details.ID ||
    details.order_number ||
    details.orderNumber ||
    details.order_no ||
    details.OrderNo ||
    details.bill_no ||
    details.billNo ||
    ''
  ).toString();

  const generatedId = `PP_${Math.floor(100000 + Math.random() * 900000)}`;
  const orderId = rawOrderId || generatedId;

  let token = (details.token || details.Token || details.token_no || details.TokenNo || details.token_number || '').toString().replace(/[^0-9]/g, '');
  if (token.length !== 4) {
    token = orderId.replace(/[^0-9]/g, '').slice(-4);
  }
  if (token.length !== 4) {
    token = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // 3. Map Order Status
  const rawStatus = (details.status || details.Status || details.order_status || 'pending').toString().toLowerCase();
  let mappedStatus: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' = 'pending';

  if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted' || rawStatus === 'confirmed' || rawStatus === '1') {
    mappedStatus = 'preparing';
  } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === 'food_ready' || rawStatus === '2') {
    mappedStatus = 'ready';
  } else if (rawStatus === 'dispatched' || rawStatus === 'completed' || rawStatus === 'delivered' || rawStatus === 'settled' || rawStatus === '3') {
    mappedStatus = 'completed';
  } else if (rawStatus === 'cancelled' || rawStatus === 'rejected' || rawStatus === '4' || rawStatus === '-1') {
    mappedStatus = 'cancelled';
  }

  // 4. Customer Info
  const customerName = (
    details.customer_name ||
    details.customerName ||
    details.CustomerName ||
    details.customer?.name ||
    details.client_name ||
    details.buyer_name ||
    `${sourceUpper} Customer`
  ).toString();

  const customerPhone = (
    details.customer_phone ||
    details.customerPhone ||
    details.CustomerPhone ||
    details.customer?.phone ||
    details.phone ||
    details.mobile ||
    '+919876543210'
  ).toString();

  // 5. Parse Item Details
  const rawItems = Array.isArray(details.items)
    ? details.items
    : Array.isArray(details.order_items)
    ? details.order_items
    : Array.isArray(details.OrderItems)
    ? details.OrderItems
    : Array.isArray(details.orderitems)
    ? details.orderitems
    : Array.isArray(details.item)
    ? details.item
    : [];

  const items = rawItems.map((item: any, idx: number) => {
    const name = (
      item.item_name ||
      item.itemName ||
      item.ItemName ||
      item.name ||
      item.title ||
      item.item_title ||
      `Delicacy Item ${idx + 1}`
    ).toString();

    const price = parseFloat(item.price || item.item_price || item.rate || item.unit_price || item.amount || 0);
    const quantity = parseInt(item.quantity || item.qty || item.Qty || item.Quantity || 1, 10);
    const itemNotes = item.notes || item.item_notes || item.customization || undefined;

    return {
      id: (item.item_id || item.id || `item-${idx + 1}`).toString(),
      name,
      price: isNaN(price) ? 0 : price,
      quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
      item_notes: itemNotes
    };
  });

  // If no items were parsed, construct a fallback item from top-level fields
  if (items.length === 0) {
    const singleName = details.item_name || details.name || `${sourceUpper} Special Combo`;
    const singlePrice = parseFloat(details.total || details.order_total || details.amount || details.grand_total || 450);
    items.push({
      id: 'item-1',
      name: singleName,
      price: isNaN(singlePrice) ? 450 : singlePrice,
      quantity: 1
    });
  }

  // 6. Calculate Total
  let total = parseFloat(
    details.total ||
    details.order_total ||
    details.grand_total ||
    details.amount ||
    details.final_total ||
    details.net_amount ||
    0
  );

  if (isNaN(total) || total <= 0) {
    total = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  }

  // 7. Timestamps
  const createdAt = details.created_at || details.order_date || details.placed_at || new Date().toISOString();
  const placedAtIst = details.placed_at_ist || formatIST(createdAt);

  // 8. Construct Unified Server Order Record
  const orderRecord: ServerOrder = {
    id: orderId,
    token,
    status: mappedStatus,
    total,
    items,
    customer_name: customerName,
    customer_phone: customerPhone,
    table_id: details.table_id || `${sourceUpper} Online`,
    order_type: 'aggregator',
    aggregator_platform: detectedPlatform,
    created_at: createdAt,
    placed_at_ist: placedAtIst,
    notes: details.notes || details.special_instructions || details.customer_note || undefined
  };

  // 9. Save to Server Memory Store & check existing
  const existingOrder = getMemoryOrder(orderId) || getMemoryOrder(token);
  const isUpdate = !!existingOrder;

  saveMemoryOrder(orderRecord);

  // Broadcast Real-time event via SSE to all active browser windows / tabs
  broadcastEvent(isUpdate ? 'order_updated' : 'order_created', orderRecord);

  // 10. Persist to Supabase in Background (Resilient dual-storage)
  const supabase = getSupabaseClient();
  if (supabase) {
    (async () => {
      try {
        if (isUpdate && existingOrder) {
          await supabase
            .from('orders')
            .update({
              status: mappedStatus,
              total,
              items,
              placed_at_ist: placedAtIst
            })
            .eq('id', existingOrder.id);
        } else {
          await supabase.from('orders').insert([orderRecord]);
        }
      } catch (dbErr: any) {
        console.warn('[Supabase Sync Warning] Background DB persistence notice:', dbErr?.message);
      }
    })();
  }

  const duration_ms = Date.now() - startTime;

  // 11. Record in Inbound Webhook Inspection Log
  const logEntry: InboundWebhookLog = {
    id: `in_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    method: reqMethod,
    path: reqPath,
    ip: meta?.ip,
    headers: headers || {},
    raw_body: rawBody,
    detected_platform: detectedPlatform,
    detected_source: sourceUpper,
    order_id: orderRecord.id,
    token: orderRecord.token,
    item_count: items.length,
    total_amount: total,
    status_code: 200,
    success: true,
    message: isUpdate
      ? `Order #${token} status updated to ${mappedStatus.toUpperCase()}`
      : `New ${sourceUpper} order #${token} injected with ${items.length} items`,
    duration_ms
  };
  recordInboundLog(logEntry);

  console.log(`[Webhook Received] ${sourceUpper} order #${token} (${orderRecord.id}) - Status: ${mappedStatus}, Items: ${items.length}, Total: ₹${total} in ${duration_ms}ms`);

  // 12. Return Multi-Standard Petpooja & Aggregator 200 OK Response
  return {
    status: 200,
    data: {
      success: '1',
      status: 'success',
      success_bool: true,
      http_code: 200,
      message: 'Order processed successfully',
      order_id: orderRecord.id,
      token: orderRecord.token,
      order_from: sourceUpper,
      platform: detectedPlatform,
      placed_at_ist: placedAtIst,
      is_update: isUpdate,
      data: orderRecord
    }
  };
}
