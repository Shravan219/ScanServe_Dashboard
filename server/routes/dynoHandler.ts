import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  saveMemoryOrder,
  getSupabaseClient,
  broadcastEvent,
  recordInboundLog,
  formatIST,
  ServerOrder
} from '../orderStore';

export interface NormalizedDynoOrder {
  orderId: string;
  source: string;
  resId?: string;
  status: string;
  customer_name: string;
  customer_mobile: string;
  bill_amount: number;
  order_items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    item_notes?: string;
  }>;
  table_id: string;
  instructions?: string;
  raw: any;
}

/**
 * Normalizes an incoming Dyno order payload object
 */
export function normalizeDynoPayload(item: any): NormalizedDynoOrder {
  if (!item || typeof item !== 'object') {
    const fallbackId = `DYN-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      orderId: fallbackId,
      source: 'dyno',
      status: 'pending',
      customer_name: 'Guest Customer',
      customer_mobile: 'Masked Number',
      bill_amount: 0,
      order_items: [],
      table_id: 'Dyno API',
      raw: item
    };
  }

  // 1. Extract orderId and vendor source deterministically
  const rawId =
    item.orderId ||
    item.order_id ||
    item.id ||
    item.data?.orderId ||
    item.data?.order_id ||
    item.data?.id;

  const orderId = rawId ? String(rawId).trim() : `DYN-${Date.now()}`;

  const rawVendor =
    item.vendor ||
    item.vendor_name ||
    item.source ||
    item.channel ||
    item.data?.vendor ||
    item.data?.source ||
    item.data?.channel ||
    'dyno';
  const source = String(rawVendor).trim().toLowerCase() || 'dyno';

  const resId = item.resId || item.data?.resId || item.data?.restaurant_id || undefined;
  const status = (item.status || item.data?.status || 'pending').toString().toLowerCase();

  // 2. Extract customer, bill, and item details
  const data = item.data && typeof item.data === 'object' ? item.data : item;

  const customer_name = String(
    data.customer_name ||
    data.customerName ||
    data.CustomerName ||
    data.customer?.name ||
    data.delivery_details?.customer_name ||
    data.delivery_details?.name ||
    data.user?.name ||
    item.customer_name ||
    item.customerName ||
    item.name ||
    'Guest Customer'
  ).trim() || 'Guest Customer';

  const customer_mobile = String(
    data.customer_mobile ||
    data.customer_phone ||
    data.customerPhone ||
    data.CustomerPhone ||
    data.customer?.phone ||
    data.customer?.mobile ||
    data.delivery_details?.phone ||
    data.phone ||
    data.mobile ||
    item.customer_mobile ||
    item.customer_phone ||
    item.phone ||
    'Masked Number'
  ).trim() || 'Masked Number';

  let rawItemsCandidate: any =
    data.order_items ||
    data.items ||
    data.Item ||
    data.item ||
    data.order_details ||
    data.OrderDetails ||
    data.cart ||
    data.dishes ||
    data.products ||
    item.order_items ||
    item.items ||
    item.Item ||
    item.item ||
    item.order_details ||
    item.OrderDetails ||
    item.cart ||
    item.dishes ||
    item.products;

  if (typeof rawItemsCandidate === 'string') {
    try {
      rawItemsCandidate = JSON.parse(rawItemsCandidate);
    } catch {
      rawItemsCandidate = [{ name: rawItemsCandidate.trim(), quantity: 1, price: 0 }];
    }
  }

  let rawItems: any[] = [];
  if (Array.isArray(rawItemsCandidate)) {
    rawItems = rawItemsCandidate;
  } else if (typeof rawItemsCandidate === 'object' && rawItemsCandidate !== null) {
    rawItems = [rawItemsCandidate];
  }

  const order_items = rawItems.map((rawIt: any, idx: number) => {
    if (typeof rawIt === 'string') {
      return { id: `item_${idx + 1}`, name: rawIt, price: 0, quantity: 1 };
    }

    const name = String(
      rawIt?.name ||
      rawIt?.Item_Name ||
      rawIt?.item_name ||
      rawIt?.itemName ||
      rawIt?.title ||
      rawIt?.description ||
      rawIt?.dish_name ||
      `Item ${idx + 1}`
    ).trim();

    const rawPrice =
      rawIt?.price ??
      rawIt?.Price ??
      rawIt?.rate ??
      rawIt?.Rate ??
      rawIt?.item_price ??
      rawIt?.unit_price ??
      rawIt?.amount ??
      0;
    const price = Number(rawPrice);

    const rawQty =
      rawIt?.quantity ??
      rawIt?.Quantity ??
      rawIt?.qty ??
      rawIt?.Qty ??
      rawIt?.count ??
      1;
    const quantity = Number(rawQty);

    return {
      id: String(rawIt?.id || rawIt?.item_id || rawIt?.Item_ID || `item_${idx + 1}`),
      name: name || `Item ${idx + 1}`,
      price: isNaN(price) || price < 0 ? 0 : price,
      quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
      item_notes: rawIt?.notes || rawIt?.item_notes || rawIt?.special_instructions || undefined
    };
  });

  const calculatedItemsTotal = order_items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  const rawBill =
    data.bill_amount ??
    data.grand_total ??
    data.total_amount ??
    data.total ??
    item.bill_amount ??
    item.grand_total ??
    item.total;

  let bill_amount = Number(rawBill);
  if (isNaN(bill_amount) || bill_amount <= 0) {
    bill_amount = calculatedItemsTotal > 0 ? calculatedItemsTotal : 0;
  }

  return {
    orderId,
    source,
    resId,
    status,
    customer_name,
    customer_mobile,
    bill_amount,
    order_items,
    table_id: String(data.table_id || data.table_no || data.table || item.table_id || 'Dyno API'),
    instructions: String(data.instructions || data.special_instructions || data.notes || item.instructions || ''),
    raw: item
  };
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export default async function handler(req: Request, res: Response) {
  const startTime = Date.now();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Source, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 200,
      message: 'Dyno Webhook API endpoint is active',
      endpoint: '/api/webhooks/dyno',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json([
      {
        status: 405,
        orderId: 'N/A',
        message: `Method ${req.method} not allowed`
      }
    ]);
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        try {
          const params = new URLSearchParams(body);
          const dataParam = params.get('data') || params.get('order') || params.get('orders');
          if (dataParam) {
            body = JSON.parse(dataParam);
          }
        } catch {}
      }
    }

    console.log('RECEIVED_DYNO_PAYLOAD:', JSON.stringify(body, null, 2));

    const rawOrdersList: any[] = Array.isArray(body?.orders)
      ? body.orders
      : Array.isArray(body?.data?.orders)
      ? body.data.orders
      : [body];

    const responseList: Array<{ status: number; orderId: string; message: string }> = [];

    for (const rawOrder of rawOrdersList) {
      if (!rawOrder || typeof rawOrder !== 'object') continue;

      const norm = normalizeDynoPayload(rawOrder);

      let token = (
        rawOrder.token ||
        rawOrder.data?.token ||
        rawOrder.token_no ||
        ''
      ).toString().replace(/[^0-9]/g, '');

      if (token.length !== 4) {
        token = norm.orderId.replace(/[^0-9]/g, '').slice(-4);
      }
      if (token.length !== 4) {
        token = Math.floor(1000 + Math.random() * 9000).toString();
      }

      let safeStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
      const st = norm.status;
      if (st === 'in_kitchen' || st === 'preparing' || st === 'accepted' || st === 'confirmed' || st === '1') {
        safeStatus = 'preparing';
      } else if (st === 'ready' || st === 'ready_for_pickup' || st === '2') {
        safeStatus = 'ready';
      } else if (st === 'completed' || st === 'dispatched' || st === 'delivered' || st === '3') {
        safeStatus = 'completed';
      }

      let aggregatorPlatform: 'swiggy' | 'zomato' | 'other_online' = 'other_online';
      if (norm.source.includes('swiggy')) aggregatorPlatform = 'swiggy';
      else if (norm.source.includes('zomato')) aggregatorPlatform = 'zomato';

      const createdAt = rawOrder.created_at || rawOrder.data?.created_at || new Date().toISOString();

      const serverOrder: ServerOrder = {
        id: norm.orderId,
        token: `#${token}`,
        status: safeStatus,
        total: norm.bill_amount,
        items: norm.order_items,
        customer_name: norm.customer_name,
        customer_phone: norm.customer_mobile,
        table_id: norm.table_id,
        order_type: 'aggregator',
        aggregator_platform: aggregatorPlatform,
        created_at: createdAt,
        placed_at_ist: formatIST(createdAt),
        notes: norm.instructions || `Vendor: ${norm.source} | Ref: ${norm.orderId}`
      };

      // 1. Save to in-memory store
      saveMemoryOrder(serverOrder);

      // 2. Persist to Supabase Database
      const supabase = getSupabaseClient();
      if (supabase) {
        console.log('ATTEMPTING_DB_PERSIST:', {
          orderId: norm.orderId,
          customerName: serverOrder.customer_name,
          grandTotal: serverOrder.total
        });

        const dbPayload: Record<string, any> = {
          token: serverOrder.token,
          status: serverOrder.status || 'pending',
          total: Number(serverOrder.total) || 0,
          items: serverOrder.items || [],
          customer_name: serverOrder.customer_name || 'Guest Customer',
          customer_phone: serverOrder.customer_phone || 'Masked Number',
          table_id: String(serverOrder.table_id || 'Dyno API'),
          created_at: serverOrder.created_at || new Date().toISOString(),
          gstin: rawOrder.gstin || rawOrder.data?.gstin || null,
          notes: serverOrder.notes
        };

        if (isUUID(norm.orderId)) {
          dbPayload.id = norm.orderId;
        } else {
          dbPayload.id = crypto.randomUUID();
        }

        try {
          const { data: dbData, error: dbError } = await supabase
            .from('orders')
            .upsert([dbPayload])
            .select();

          if (dbError) {
            console.warn('DB_WRITE_WARNING (Saved to memory store):', dbError.message);
          } else {
            console.log('DB_PERSIST_SUCCESS:', { orderId: norm.orderId, dbData });
          }
        } catch (dbErr: any) {
          console.warn('DB_WRITE_EXCEPTION (Saved to memory store):', dbErr?.message || dbErr);
        }
      }

      // 3. Real-Time SSE Broadcast
      try {
        broadcastEvent('new_order', serverOrder);
        broadcastEvent('order_created', serverOrder);
      } catch (sseErr: any) {
        console.warn('[Dyno API] SSE broadcast warning:', sseErr?.message);
      }

      // 4. Log for Live Inbound Inspector
      try {
        recordInboundLog({
          id: `dyno_log_${Date.now()}_${norm.orderId}`,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: '/api/webhooks/dyno',
          ip: (Array.isArray(req.headers?.['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers?.['x-forwarded-for']) || req.socket?.remoteAddress || 'unknown',
          headers: req.headers || {},
          raw_body: rawOrder,
          detected_platform: 'Dyno API',
          detected_source: norm.source.toUpperCase(),
          order_id: norm.orderId,
          token: serverOrder.token,
          item_count: norm.order_items.length,
          total_amount: norm.bill_amount,
          status_code: 200,
          success: true,
          message: `Order No. ${norm.orderId} Inserted Successfully`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr: any) {
        console.warn('[Dyno API] Inbound log recording warning:', logErr?.message);
      }

      // 5. Format success response matching Dyno API specification
      responseList.push({
        status: 200,
        orderId: norm.orderId,
        message: `Order No. ${norm.orderId} Inserted Successfully`
      });
    }

    return res.status(200).json(responseList);
  } catch (error: any) {
    console.error('[Dyno API Exception]:', error);
    return res.status(500).json([
      {
        status: 500,
        orderId: 'ERROR',
        message: error?.message || 'Error processing Dyno order payload'
      }
    ]);
  }
}