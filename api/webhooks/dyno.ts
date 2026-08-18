import crypto from 'crypto';
import {
  saveMemoryOrder,
  getSupabaseClient,
  broadcastEvent,
  recordInboundLog,
  formatIST,
  ServerOrder
} from '../../server/orderStore';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export default async function handler(req: any, res: any) {
  const startTime = Date.now();

  // Set standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Source, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health / ping check
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
        // Fallback for form body
        try {
          const params = new URLSearchParams(body);
          const dataParam = params.get('data') || params.get('order') || params.get('orders');
          if (dataParam) {
            body = JSON.parse(dataParam);
          }
        } catch {}
      }
    }

    // Inspect incoming raw payload in server logs
    console.log('RECEIVED_PAYLOAD:', JSON.stringify(body, null, 2));

    // Support both multi-order batches (body.orders) and single order objects (body)
    const rawOrdersList: any[] = Array.isArray(body?.orders)
      ? body.orders
      : Array.isArray(body?.data?.orders)
      ? body.data.orders
      : [body];

    const responseList: Array<{ status: number; orderId: string; message: string }> = [];

    for (const order of rawOrdersList) {
      if (!order || typeof order !== 'object') continue;

      // Extract Order ID with clean fallbacks
      const rawId =
        order.data?.order_id ||
        order.data?.orderId ||
        order.data?.id ||
        order.order_id ||
        order.orderId ||
        order.id ||
        order.order_number ||
        order.orderNumber;

      let orderId = rawId ? String(rawId) : `DYN-${Date.now()}`;
      if (orderId.toLowerCase().includes('test') && !orderId.includes(String(Date.now()).slice(0, 8))) {
        orderId = `${orderId}_${Date.now()}`;
      }

      // Extract Customer Name, Phone, Total, and Items per specification
      const customerName = (
        order.data?.customer_name ||
        order.data?.customer?.name ||
        order.customer_name ||
        order.customer?.name ||
        order.delivery_details?.customer_name ||
        order.delivery_details?.name ||
        order.user?.name ||
        order.name ||
        'Guest Customer'
      ).toString().trim();

      const customerPhone = (
        order.data?.customer_phone ||
        order.data?.customer?.phone ||
        order.customer_phone ||
        order.customer?.phone ||
        order.delivery_details?.phone ||
        order.phone ||
        order.mobile ||
        'Masked Number'
      ).toString().trim();

      const totalAmount = Number(
        order.data?.bill_amount ||
        order.data?.grand_total ||
        order.data?.total ||
        order.bill_amount ||
        order.grand_total ||
        order.total ||
        order.amount ||
        0
      );

      const rawItems = Array.isArray(order.data?.items)
        ? order.data.items
        : Array.isArray(order.items)
        ? order.items
        : Array.isArray(order.data?.order_items)
        ? order.data.order_items
        : Array.isArray(order.order_items)
        ? order.order_items
        : [];

      const items = rawItems.map((item: any, idx: number) => {
        const itemName = (
          item.Item_Name ||
          item.item_name ||
          item.name ||
          item.title ||
          `Item ${idx + 1}`
        ).toString().trim();

        const itemPrice = Number(
          item.Price ||
          item.price ||
          item.rate ||
          item.item_price ||
          item.unit_price ||
          0
        );

        const itemQuantity = Number(
          item.Quantity ||
          item.quantity ||
          item.qty ||
          item.count ||
          1
        );

        return {
          id: (item.item_id || item.id || `item_${idx + 1}`).toString(),
          name: itemName,
          price: isNaN(itemPrice) ? 0 : itemPrice,
          quantity: isNaN(itemQuantity) || itemQuantity <= 0 ? 1 : itemQuantity,
          item_notes: item.notes || item.special_instructions || undefined
        };
      });

      const calculatedItemsTotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const finalTotal = totalAmount > 0 ? totalAmount : (calculatedItemsTotal > 0 ? calculatedItemsTotal : 0);

      // Extract / Normalize 4-digit token
      let token = (
        order.token ||
        order.data?.token ||
        order.token_no ||
        ''
      ).toString().replace(/[^0-9]/g, '');

      if (token.length !== 4) {
        token = orderId.replace(/[^0-9]/g, '').slice(-4);
      }
      if (token.length !== 4) {
        token = Math.floor(1000 + Math.random() * 9000).toString();
      }

      // Map status
      const rawStatus = (order.status || order.data?.status || 'pending').toString().toLowerCase();
      let safeStatus: 'pending' | 'preparing' | 'ready' | 'completed' = 'pending';
      if (rawStatus === 'in_kitchen' || rawStatus === 'preparing' || rawStatus === 'accepted' || rawStatus === 'confirmed' || rawStatus === '1') {
        safeStatus = 'preparing';
      } else if (rawStatus === 'ready' || rawStatus === 'ready_for_pickup' || rawStatus === '2') {
        safeStatus = 'ready';
      } else if (rawStatus === 'completed' || rawStatus === 'dispatched' || rawStatus === 'delivered' || rawStatus === '3') {
        safeStatus = 'completed';
      }

      const source = (order.source || order.channel || order.platform || 'dyno').toString().toLowerCase();
      let aggregatorPlatform: 'swiggy' | 'zomato' | 'other_online' = 'other_online';
      if (source.includes('swiggy')) aggregatorPlatform = 'swiggy';
      else if (source.includes('zomato')) aggregatorPlatform = 'zomato';

      const createdAt = order.created_at || order.data?.created_at || new Date().toISOString();

      const serverOrder: ServerOrder = {
        id: orderId,
        token: `#${token}`,
        status: safeStatus,
        total: finalTotal,
        items,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_id: order.table_id || order.data?.table_id || 'Dyno API',
        order_type: 'aggregator',
        aggregator_platform: aggregatorPlatform,
        created_at: createdAt,
        placed_at_ist: formatIST(createdAt),
        notes: order.instructions || order.notes || `Ref: ${orderId}`
      };

      // 1. Save to in-memory store
      saveMemoryOrder(serverOrder);

      // 2. Persist to Supabase Database (if configured)
      const supabase = getSupabaseClient();
      if (supabase) {
        console.log('ATTEMPTING_DB_PERSIST:', {
          orderId,
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
          gstin: order.gstin || null
        };

        if (isUUID(orderId)) {
          dbPayload.id = orderId;
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
              order_id: orderId
            });
          }

          console.log('DB_PERSIST_SUCCESS:', { orderId, dbData });
        } catch (dbErr: any) {
          console.error('DB_WRITE_FAILED:', dbErr);
          return res.status(500).json({
            success: false,
            error: dbErr?.message || 'Database exception',
            order_id: orderId
          });
        }
      }

      // 3. Real-Time SSE Broadcast to KDS
      try {
        broadcastEvent('new_order', serverOrder);
        broadcastEvent('order_created', serverOrder);
      } catch (sseErr: any) {
        console.warn('[Dyno API] SSE broadcast warning:', sseErr?.message);
      }

      // 4. Log for Live Inbound Inspector
      try {
        recordInboundLog({
          id: `dyno_log_${Date.now()}_${orderId}`,
          timestamp: new Date().toISOString(),
          method: req.method,
          path: '/api/webhooks/dyno',
          ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
          headers: req.headers || {},
          raw_body: order,
          detected_platform: 'Dyno API',
          detected_source: source.toUpperCase(),
          order_id: orderId,
          token: serverOrder.token,
          item_count: items.length,
          total_amount: finalTotal,
          status_code: 200,
          success: true,
          message: `Order No. ${orderId} Inserted Successfully`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr: any) {
        console.warn('[Dyno API] Inbound log recording warning:', logErr?.message);
      }

      // Add to official Dyno response schema
      responseList.push({
        status: 200,
        orderId: orderId,
        message: `Order No. ${orderId} Inserted Successfully`
      });
    }

    // Return official Dyno JSON response array
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
