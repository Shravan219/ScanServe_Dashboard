import crypto from 'crypto';
import {
  getSupabaseClient,
  saveMemoryOrder,
  formatIST,
  recordInboundLog,
  broadcastEvent,
  ServerOrder,
  InboundWebhookLog
} from './orderStore.js';

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Deep parser to extract an order object from any webhook body representation
 */
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
    'Data',
    'payload',
    'Payload'
  ];

  for (const key of wrappers) {
    if (current[key]) {
      let sub = current[key];
      if (typeof sub === 'string') {
        try {
          sub = JSON.parse(sub);
        } catch {}
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

  // 1. LOG INCOMING PAYLOAD
  console.log('RECEIVED_PAYLOAD:', JSON.stringify(rawBody, null, 2));

  // 0. Handle Ping / Healthcheck Probes
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

  const hasOrderData = Boolean(
    rawBody?.order_details ||
    rawBody?.order ||
    rawBody?.orders ||
    rawBody?.order_id ||
    rawBody?.orderId ||
    rawBody?.Order_ID ||
    rawBody?.Customer ||
    rawBody?.customer ||
    rawBody?.Item ||
    rawBody?.items ||
    rawBody?.order_items ||
    rawBody?.data
  );

  if (isExplicitPing && !hasOrderData) {
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

  const details = extractOrderObject(rawBody) || rawBody || {};

  // Customer Name
  const rawCustomerName =
    rawBody?.Customer?.Name ||
    rawBody?.Customer?.name ||
    rawBody?.customer_name ||
    rawBody?.customerName ||
    rawBody?.CustomerName ||
    rawBody?.customer?.name ||
    rawBody?.customer?.customer_name ||
    rawBody?.data?.customer_name ||
    rawBody?.data?.customer?.name ||
    rawBody?.delivery_details?.customer_name ||
    rawBody?.delivery_details?.name ||
    rawBody?.user?.name ||
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
    rawBody?.Customer?.Mobile ||
    rawBody?.Customer?.mobile ||
    rawBody?.Customer?.Phone ||
    rawBody?.Customer?.phone ||
    rawBody?.customer_phone ||
    rawBody?.customerPhone ||
    rawBody?.CustomerPhone ||
    rawBody?.customer?.phone ||
    rawBody?.customer?.mobile ||
    rawBody?.customer?.phone_number ||
    rawBody?.data?.customer_phone ||
    rawBody?.data?.customer?.phone ||
    rawBody?.delivery_details?.phone ||
    rawBody?.delivery_details?.phone_number ||
    rawBody?.phone_number ||
    rawBody?.mobile ||
    rawBody?.user?.phone ||
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
    (Array.isArray(rawBody?.Item) && rawBody.Item) ||
    (Array.isArray(rawBody?.item) && rawBody.item) ||
    (Array.isArray(rawBody?.items) && rawBody.items) ||
    (Array.isArray(rawBody?.Items) && rawBody.Items) ||
    (Array.isArray(rawBody?.order_items) && rawBody.order_items) ||
    (Array.isArray(rawBody?.orderItems) && rawBody.orderItems) ||
    (Array.isArray(rawBody?.OrderItems) && rawBody.OrderItems) ||
    (Array.isArray(rawBody?.data?.items) && rawBody.data.items) ||
    (Array.isArray(rawBody?.data?.order_items) && rawBody.data.order_items) ||
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

  if (items.length === 0) {
    const singleName =
      rawBody?.item_name ||
      rawBody?.itemName ||
      rawBody?.Item_Name ||
      details?.item_name ||
      details?.itemName ||
      details?.Item_Name ||
      details?.name ||
      'Order Item';

    const singlePrice = Number(
      rawBody?.price ||
      rawBody?.Price ||
      rawBody?.total ||
      rawBody?.grand_total ||
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

  // Total Amount
  const calculatedItemsTotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);

  const rawTotalValue =
    rawBody?.Order_Total ??
    rawBody?.order_total ??
    rawBody?.grand_total ??
    rawBody?.Grand_Total ??
    rawBody?.bill_amount ??
    rawBody?.Bill_Amount ??
    rawBody?.total_amount ??
    rawBody?.Total_Amount ??
    rawBody?.total ??
    rawBody?.Total ??
    rawBody?.data?.bill_amount ??
    rawBody?.data?.grand_total ??
    rawBody?.data?.total_amount ??
    rawBody?.pricing?.grand_total ??
    rawBody?.pricing?.total ??
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

  // Detect Source Channel
  const headerSource = headers?.['x-source'] || headers?.['x-channel'] || headers?.['x-platform'];
  const rawOrderFrom = (
    rawBody?.channel ||
    rawBody?.source ||
    rawBody?.platform ||
    rawBody?.order_from ||
    rawBody?.orderFrom ||
    details?.order_from ||
    details?.orderFrom ||
    details?.OrderFrom ||
    details?.source ||
    details?.Source ||
    details?.order_source ||
    details?.aggregator ||
    details?.channel ||
    headerSource ||
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

  // Order ID
  const rawProvidedId =
    rawBody?.Order_ID ||
    rawBody?.order_id ||
    rawBody?.orderId ||
    rawBody?.id ||
    details?.Order_ID ||
    details?.order_id ||
    details?.orderId ||
    details?.OrderID ||
    details?.id ||
    details?.order_number ||
    details?.orderNumber ||
    details?.bill_no;

  let finalOrderId = rawProvidedId ? String(rawProvidedId) : `TEST-${Date.now()}`;
  if (finalOrderId.toLowerCase().includes('test') && !finalOrderId.includes(String(Date.now()).slice(0, 8))) {
    finalOrderId = `${finalOrderId}_${Date.now()}`;
  }

  let token = String(
    rawBody?.token ||
    rawBody?.token_no ||
    rawBody?.Token ||
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
    rawBody?.status ||
    rawBody?.order_status ||
    rawBody?.Status ||
    details?.status ||
    details?.Status ||
    'pending'
  ).toLowerCase();

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

  const createdAt = details?.created_at || details?.order_date || details?.placed_at || rawBody?.created_at || rawBody?.placed_at || new Date().toISOString();
  const placedAtIst = details?.placed_at_ist || rawBody?.placed_at_ist || formatIST(createdAt);

  const orderRecord: ServerOrder = {
    id: finalOrderId,
    token: `#${token}`,
    status: mappedStatus,
    total,
    items,
    customer_name: customerName,
    customer_phone: customerPhone,
    table_id: rawBody?.table_id || details?.table_id || `${sourceUpper} Online`,
    order_type: 'aggregator',
    aggregator_platform: detectedPlatform,
    created_at: createdAt,
    placed_at_ist: placedAtIst,
    notes: rawBody?.instructions || rawBody?.special_instructions || details?.notes || details?.special_instructions || `Ref: ${finalOrderId}`
  };

  // Save to Memory Store
  saveMemoryOrder(orderRecord);

  // Broadcast Real-time SSE
  try {
    broadcastEvent('new_order', orderRecord);
    broadcastEvent('order_created', orderRecord);
  } catch (sseErr: any) {
    console.warn('[processWebhookPayload] SSE broadcast error:', sseErr);
  }

  // Record Inbound Webhook Inspection Log
  try {
    recordInboundLog({
      id: `in_${Date.now()}_${finalOrderId}`,
      timestamp: new Date().toISOString(),
      method: reqMethod,
      path: reqPath,
      ip: meta?.ip,
      headers: headers || {},
      raw_body: rawBody,
      detected_platform: 'Vyoma Webhook',
      detected_source: sourceUpper,
      order_id: finalOrderId,
      token: orderRecord.token,
      item_count: items.length,
      total_amount: total,
      status_code: 200,
      success: true,
      message: `Order ${finalOrderId} processed (${sourceUpper}) for ${customerName} (₹${total})`,
      duration_ms: Date.now() - startTime
    });
  } catch (logErr: any) {
    console.warn('[processWebhookPayload] Inbound log error:', logErr);
  }

  // 1. EXPLICIT DATABASE LOGGING & ERROR HANDLING
  const supabase = getSupabaseClient();
  if (supabase) {
    console.log('ATTEMPTING_DB_PERSIST:', {
      orderId: finalOrderId,
      customerName: orderRecord.customer_name,
      grandTotal: orderRecord.total
    });

    const dbPayload: Record<string, any> = {
      token: orderRecord.token,
      status: orderRecord.status || 'pending',
      total: Number(orderRecord.total) || 0,
      items: orderRecord.items || [],
      customer_name: orderRecord.customer_name || 'Guest Customer',
      customer_phone: orderRecord.customer_phone || 'Masked Number',
      table_id: String(orderRecord.table_id || `${sourceUpper} Online`),
      created_at: orderRecord.created_at || new Date().toISOString(),
      gstin: rawBody?.gstin || details?.gstin || null
    };

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
        return {
          status: 500,
          data: {
            success: false,
            error: dbError.message || 'Database insert failed',
            details: dbError,
            order_id: finalOrderId
          }
        };
      }

      console.log('DB_PERSIST_SUCCESS:', {
        orderId: finalOrderId,
        dbId: dbPayload.id,
        dbData
      });
    } catch (dbException: any) {
      console.error('DB_WRITE_FAILED:', dbException);
      return {
        status: 500,
        data: {
          success: false,
          error: dbException?.message || 'Database exception',
          order_id: finalOrderId
        }
      };
    }
  }

  // Return standard Petpooja JSON Success Response
  return {
    status: 200,
    data: {
      success: '1',
      message: 'Order saved successfully',
      order_id: finalOrderId,
      token: orderRecord.token,
      customer: customerName,
      total_amount: total,
      items_count: items.length,
      timestamp: new Date().toISOString()
    }
  };
}
