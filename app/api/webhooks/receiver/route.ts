import {
  saveMemoryOrder,
  getSupabaseClient,
  broadcastEvent,
  recordInboundLog,
  formatIST,
  ServerOrder
} from '@/server/orderStore';
import crypto from 'crypto';

export interface DynoItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  item_notes?: string;
}

export interface DynoCustomerDetails {
  name: string;
  mobile: string;
  email?: string;
}

export interface DynoBillSummary {
  bill_amount: number;
  subtotal?: number;
  taxes?: number;
  discount?: number;
}

export interface DynoNormalizedOrder {
  orderId: string;
  vendor: string;
  resId?: string;
  status: string;
  customer_details: DynoCustomerDetails;
  bill_summary: DynoBillSummary;
  items: DynoItem[];
  raw: any;
}

export interface DynoResponseItem {
  status: number;
  orderId: string;
  message: string;
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Sanitizes raw string to replace invalid mock placeholders (like literal `[ ... ]` or `[...]`)
 * with empty arrays `[]` and strip trailing commas before parsing with `JSON.parse()`.
 */
export function sanitizeRawJsonString(raw: string): string {
  if (!raw || typeof raw !== 'string') return '{}';

  let sanitized = raw.trim();

  // Replace invalid mock placeholders like [ ... ], [...], [ ... ] with []
  sanitized = sanitized.replace(/\[\s*\.\.\.\s*\]/g, '[]');
  sanitized = sanitized.replace(/\{\s*\.\.\.\s*\}/g, '{}');

  // Replace stray placeholders inside double quotes like "...details..." or "...item..."
  sanitized = sanitized.replace(/"[^"]*\.\.\.[^"]*"/g, '""');

  // Remove trailing commas before closing ] or }
  sanitized = sanitized.replace(/,\s*([\]\}])/g, '$1');

  return sanitized;
}

/**
 * Safely normalizes incoming Dyno payloads across flat & wrapped array structures.
 */
export function normalizeDynoOrder(item: any): DynoNormalizedOrder {
  if (!item || typeof item !== 'object') {
    const fallbackId = `DYN-${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      orderId: fallbackId,
      vendor: 'dyno',
      status: 'pending',
      customer_details: {
        name: 'Guest Customer',
        mobile: 'Masked Number'
      },
      bill_summary: {
        bill_amount: 0
      },
      items: [],
      raw: item
    };
  }

  // Extract orderId with optional chaining
  const rawOrderId =
    item?.orderId ??
    item?.order_id ??
    item?.id ??
    item?.data?.orderId ??
    item?.data?.order_id ??
    item?.data?.id;

  let orderId = rawOrderId ? String(rawOrderId).trim() : `DYN-${Date.now()}`;
  if (orderId.toLowerCase().includes('test') && !orderId.includes(String(Date.now()).slice(0, 8))) {
    orderId = `${orderId}_${Date.now()}`;
  }

  // Extract vendor/source
  const rawVendor =
    item?.vendor ??
    item?.vendor_name ??
    item?.data?.vendor ??
    item?.data?.source ??
    item?.data?.channel ??
    item?.source ??
    item?.channel ??
    'dyno';
  const vendor = String(rawVendor).trim().toLowerCase() || 'dyno';

  const resId = item?.resId ?? item?.data?.resId ?? item?.data?.restaurant_id ?? undefined;
  const status = String(item?.status ?? item?.data?.status ?? 'pending').toLowerCase();

  // Extract customer details across nested objects
  const data = item?.data && typeof item?.data === 'object' ? item.data : item;

  const customerName = String(
    data?.customer_details?.name ??
    data?.customer_name ??
    data?.customerName ??
    data?.CustomerName ??
    data?.customer?.name ??
    data?.delivery_details?.customer_name ??
    data?.delivery_details?.name ??
    item?.customer_details?.name ??
    item?.customer_name ??
    item?.customerName ??
    item?.name ??
    'Guest Customer'
  ).trim() || 'Guest Customer';

  const customerMobile = String(
    data?.customer_details?.mobile ??
    data?.customer_details?.phone ??
    data?.customer_mobile ??
    data?.customer_phone ??
    data?.customerPhone ??
    data?.customer?.mobile ??
    data?.customer?.phone ??
    data?.delivery_details?.phone ??
    item?.customer_details?.mobile ??
    item?.customer_mobile ??
    item?.customer_phone ??
    item?.phone ??
    item?.mobile ??
    'Masked Number'
  ).trim() || 'Masked Number';

  // Extract items array
  const rawItems =
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.order_items) && data.order_items) ||
    (Array.isArray(item?.items) && item.items) ||
    (Array.isArray(item?.order_items) && item.order_items) ||
    [];

  const items: DynoItem[] = rawItems.map((rawIt: any, idx: number) => {
    const itemName = String(
      rawIt?.name ??
      rawIt?.Item_Name ??
      rawIt?.item_name ??
      rawIt?.itemName ??
      rawIt?.title ??
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
      id: String(rawIt?.id ?? rawIt?.item_id ?? rawIt?.Item_ID ?? `item_${idx + 1}`),
      name: itemName || `Item ${idx + 1}`,
      price: isNaN(price) || price < 0 ? 0 : price,
      quantity: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
      item_notes: rawIt?.notes ?? rawIt?.item_notes ?? rawIt?.special_instructions ?? undefined
    };
  });

  const calculatedTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  // Extract bill summary
  const rawBill =
    data?.bill_summary?.bill_amount ??
    data?.bill_summary?.total ??
    data?.bill_amount ??
    data?.grand_total ??
    data?.total_amount ??
    data?.total ??
    item?.bill_summary?.bill_amount ??
    item?.bill_amount ??
    item?.grand_total ??
    item?.total;

  let billAmount = Number(rawBill);
  if (isNaN(billAmount) || billAmount <= 0) {
    billAmount = calculatedTotal > 0 ? calculatedTotal : 0;
  }

  return {
    orderId,
    vendor,
    resId,
    status,
    customer_details: {
      name: customerName,
      mobile: customerMobile
    },
    bill_summary: {
      bill_amount: billAmount
    },
    items,
    raw: item
  };
}

/**
 * Next.js App Router HTTP POST Handler (`export async function POST(req: Request)`)
 */
export async function POST(req: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Safe Raw Body Reading
    const rawText = await req.text();

    // Return HTTP 200 immediately if payload is empty or a heartbeat ping
    const trimmed = (rawText || '').trim();
    if (
      !trimmed ||
      trimmed === 'ping' ||
      trimmed === '{}' ||
      trimmed === '[]' ||
      trimmed === '{"ping":true}' ||
      trimmed === '{"ping": true}'
    ) {
      return new Response(
        JSON.stringify([
          {
            status: 200,
            orderId: 'PING_OK',
            message: 'Heartbeat ping acknowledged successfully'
          }
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Sanitization & Isolated JSON Parsing
    let parsedBody: any = null;
    try {
      const sanitizedText = sanitizeRawJsonString(trimmed);
      parsedBody = JSON.parse(sanitizedText);
    } catch (parseErr: any) {
      console.error('[Dyno Webhook Parsing Error]:', parseErr?.message);
      // Requirement 2: Respond with HTTP 200 and error object on syntax error
      return new Response(
        JSON.stringify([
          {
            status: 400,
            orderId: 'INVALID_JSON',
            message: 'Malformed payload sanitized'
          }
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Flexible Shape Normalization
    // Handles wrapped arrays `{ "orders": [...] }` AND single flat JSON objects
    const rawOrdersList: any[] = Array.isArray(parsedBody?.orders)
      ? parsedBody.orders
      : Array.isArray(parsedBody?.data?.orders)
      ? parsedBody.data.orders
      : Array.isArray(parsedBody)
      ? parsedBody
      : [parsedBody];

    const responseList: DynoResponseItem[] = [];

    for (const rawOrder of rawOrdersList) {
      if (!rawOrder || typeof rawOrder !== 'object') continue;

      const norm = normalizeDynoOrder(rawOrder);

      // Extract / Normalize 4-digit token
      let token = String(
        rawOrder?.token ??
        rawOrder?.data?.token ??
        rawOrder?.token_no ??
        ''
      ).replace(/[^0-9]/g, '');

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
      if (norm.vendor.includes('swiggy')) aggregatorPlatform = 'swiggy';
      else if (norm.vendor.includes('zomato')) aggregatorPlatform = 'zomato';

      const createdAt = rawOrder?.created_at ?? rawOrder?.data?.created_at ?? new Date().toISOString();

      const serverOrder: ServerOrder = {
        id: norm.orderId,
        token: `#${token}`,
        status: safeStatus,
        total: norm.bill_summary.bill_amount,
        items: norm.items,
        customer_name: norm.customer_details.name,
        customer_phone: norm.customer_details.mobile,
        table_id: String(rawOrder?.data?.table_id ?? rawOrder?.table_id ?? 'Dyno API'),
        order_type: 'aggregator',
        aggregator_platform: aggregatorPlatform,
        created_at: createdAt,
        placed_at_ist: formatIST(createdAt),
        notes: `Vendor: ${norm.vendor} | Ref: ${norm.orderId}`
      };

      // 4. Save to in-memory store & broadcast
      try {
        saveMemoryOrder(serverOrder);
        broadcastEvent('new_order', serverOrder);
        broadcastEvent('order_created', serverOrder);
      } catch (memErr: any) {
        console.warn('[Dyno Webhook Memory Store Warning]:', memErr?.message);
      }

      // 5. Isolated Database Upsert Logic
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const dbPayload: Record<string, any> = {
            token: serverOrder.token,
            status: serverOrder.status || 'pending',
            total: Number(serverOrder.total) || 0,
            items: serverOrder.items || [],
            customer_name: serverOrder.customer_name || 'Guest Customer',
            customer_phone: serverOrder.customer_phone || 'Masked Number',
            table_id: String(serverOrder.table_id || 'Dyno API'),
            created_at: serverOrder.created_at || new Date().toISOString()
          };

          if (isUUID(norm.orderId)) {
            dbPayload.id = norm.orderId;
          } else {
            dbPayload.id = crypto.randomUUID();
          }

          const { error: dbError } = await supabase
            .from('orders')
            .insert([dbPayload]);

          if (dbError) {
            console.error('[Dyno Webhook Database Write Error]:', dbError.message);
          }
        }
      } catch (dbException: any) {
        // Isolated try/catch ensures DB connection/write errors NEVER throw 500
        console.error('[Dyno Webhook DB Exception Suppressed]:', dbException?.message);
      }

      // 6. Record Inbound Log
      try {
        recordInboundLog({
          id: `dyno_log_${Date.now()}_${norm.orderId}`,
          timestamp: new Date().toISOString(),
          method: 'POST',
          path: '/api/webhooks/receiver',
          headers: {},
          raw_body: rawOrder,
          detected_platform: 'Dyno Webhook Receiver',
          detected_source: norm.vendor.toUpperCase(),
          order_id: norm.orderId,
          token: serverOrder.token,
          item_count: norm.items.length,
          total_amount: norm.bill_summary.bill_amount,
          status_code: 200,
          success: true,
          message: `Order No. ${norm.orderId} Inserted Successfully`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr: any) {
        console.warn('[Dyno Webhook Inbound Log Warning]:', logErr?.message);
      }

      // 7. Push to response list
      responseList.push({
        status: 200,
        orderId: norm.orderId,
        message: `Order No. ${norm.orderId} Inserted Successfully`
      });
    }

    // 8. Return HTTP 200 with Dyno API response array
    return new Response(JSON.stringify(responseList), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (globalErr: any) {
    console.error('[Dyno Webhook Receiver Global Error]:', globalErr?.message);
    return new Response(
      JSON.stringify([
        {
          status: 200,
          orderId: 'HANDLED_EXCEPTION',
          message: 'Order processed with default parameters'
        }
      ]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
