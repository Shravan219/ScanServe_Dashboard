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
    console.log('DYNO_WEBHOOK_INBOUND:', JSON.stringify(body, null, 2));

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
      const orderId = String(
        order.data?.order_id ||
        order.data?.orderId ||
        order.data?.id ||
        order.order_id ||
        order.orderId ||
        order.id ||
        order.order_number ||
        order.orderNumber ||
        `DYN-${Math.floor(10000 + Math.random() * 90000)}`
      );

      // Extract Customer Name, Phone, Total, and Items per specification
      const customerName = (
        order.data?.customer_name ||
        order.data?.customer?.name ||
        order.customer_name ||
        order.customer?.name ||
        order.delivery_details?.customer_name ||
        order.delivery_details?.name ||
        order.user?.name ||
        "Guest Customer"
      ).toString().trim();

      const customerPhone = (
        order.data?.customer_phone ||
        order.data?.customer?.phone ||
        order.customer_phone ||
        order.customer?.phone ||
        order.delivery_details?.phone ||
        order.delivery_details?.phone_number ||
        "Masked Number"
      ).toString().trim();

      const rawTotal = 
        order.data?.bill_amount ??
        order.data?.grand_total ??
        order.data?.total_amount ??
        order.bill_amount ??
        order.grand_total ??
        order.total_amount ??
        0;

      const grandTotal = Number(rawTotal) || 0;

      const rawItems = 
        order.data?.items ||
        order.data?.order_items ||
        order.items ||
        order.order_items ||
        [];

      const items = Array.isArray(rawItems)
        ? rawItems.map((it: any, idx: number) => ({
            id: String(it?.id || it?.item_id || `item_${idx + 1}`),
            name: String(it?.name || it?.item_name || it?.title || `Item ${idx + 1}`),
            quantity: Number(it?.quantity ?? it?.qty ?? it?.count ?? 1) || 1,
            price: Number(it?.price ?? it?.rate ?? it?.amount ?? 0) || 0,
            item_notes: it?.item_notes || it?.notes || it?.special_instructions || it?.instruction || ''
          }))
        : [];

      // Fallback total calculation if grandTotal is 0
      const itemsSum = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const finalTotal = grandTotal > 0 ? grandTotal : itemsSum;

      // Platform / Source identification
      const rawSource = 
        order.data?.source ||
        order.data?.channel ||
        order.data?.order_from ||
        order.data?.platform ||
        order.source ||
        order.channel ||
        order.order_from ||
        order.platform ||
        'DYNO';

      const source = String(rawSource).toLowerCase();
      const token = `#${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'D01'}`;

      const createdAt = order.data?.created_at || order.data?.placed_at || order.created_at || order.placed_at || new Date().toISOString();
      const tableId = order.data?.table_id || order.data?.table_number || order.table_id || order.table_number || undefined;
      const notes = order.data?.instructions || order.data?.notes || order.data?.special_instructions || order.instructions || order.notes || '';

      const serverOrder: ServerOrder = {
        id: orderId,
        token,
        status: 'pending',
        total: finalTotal,
        items,
        customer_name: customerName,
        customer_phone: customerPhone,
        table_id: tableId,
        order_type: 'aggregator',
        aggregator_platform: source,
        notes,
        created_at: createdAt,
        placed_at_ist: formatIST(createdAt)
      };

      // 1. In-Memory Store
      try {
        saveMemoryOrder(serverOrder);
      } catch (memErr: any) {
        console.warn('[Dyno API] Memory save warning:', memErr?.message);
      }

      // 2. Supabase DB Persistence
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from('orders').upsert({
            id: serverOrder.id,
            token: serverOrder.token,
            status: serverOrder.status,
            total: serverOrder.total,
            items: serverOrder.items,
            customer_name: serverOrder.customer_name,
            customer_phone: serverOrder.customer_phone,
            table_id: serverOrder.table_id,
            order_type: serverOrder.order_type,
            aggregator_platform: serverOrder.aggregator_platform,
            notes: serverOrder.notes,
            created_at: serverOrder.created_at
          });
        }
      } catch (dbErr: any) {
        console.warn('[Dyno API] Supabase persistence warning:', dbErr?.message);
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
    return res.status(200).json([
      {
        status: 500,
        orderId: 'ERROR',
        message: error?.message || 'Error processing Dyno order payload'
      }
    ]);
  }
}
