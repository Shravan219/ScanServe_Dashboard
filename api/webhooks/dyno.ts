import { parseDynoOrderPayload } from '../../lib/dyno-adapter';
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

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      status: 'online',
      message: 'Dyno Webhook endpoint is active and ready to receive POST payloads',
      endpoint: '/api/webhooks/dyno',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // Fallback for form body
      }
    }

    // 1. Parse Dyno payload using Adapter
    const normalized = parseDynoOrderPayload(body);

    // 2. Convert to internal ServerOrder format
    const token = normalized.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || 'D01';
    const serverOrder: ServerOrder = {
      id: normalized.orderId,
      token: `#${token}`,
      status: 'pending',
      total: normalized.totalAmount,
      items: normalized.items.map((it, idx) => ({
        id: it.id || `item_${idx + 1}`,
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        item_notes: it.item_notes
      })),
      customer_name: normalized.customer.name,
      customer_phone: normalized.customer.phone,
      table_id: normalized.tableId,
      order_type: 'aggregator',
      aggregator_platform: normalized.source,
      notes: normalized.instructions,
      created_at: normalized.placedAt || new Date().toISOString(),
      placed_at_ist: formatIST(normalized.placedAt)
    };

    // 3. Save to In-Memory store
    try {
      saveMemoryOrder(serverOrder);
    } catch (e: any) {
      console.warn('[Dyno Webhook] Memory order save warning:', e?.message);
    }

    // 4. Save to Supabase (if configured)
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
      console.warn('[Dyno Webhook] Supabase sync warning:', dbErr?.message);
    }

    // 5. Record inbound log for Live Inspector
    try {
      recordInboundLog({
        id: `dyno_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: '/api/webhooks/dyno',
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        headers: req.headers,
        raw_body: body,
        detected_platform: 'Dyno API',
        detected_source: normalized.source.toUpperCase(),
        order_id: normalized.orderId,
        token: serverOrder.token,
        item_count: normalized.items.length,
        total_amount: normalized.totalAmount,
        status_code: 200,
        success: true,
        message: `Dyno order ${normalized.orderId} processed (${normalized.source.toUpperCase()})`,
        duration_ms: Date.now() - startTime
      });
    } catch (logErr: any) {
      console.warn('[Dyno Webhook] Log recording warning:', logErr?.message);
    }

    // 6. Broadcast SSE real-time event to KDS and Dashboard
    try {
      broadcastEvent('new_order', serverOrder);
      broadcastEvent('order_created', serverOrder);
    } catch (sseErr: any) {
      console.warn('[Dyno Webhook] SSE broadcast warning:', sseErr?.message);
    }

    // 7. Return success response
    return res.status(200).json({
      success: true,
      message: 'Order received and processed successfully',
      order_id: normalized.orderId,
      source: normalized.source,
      total_amount: normalized.totalAmount,
      items_count: normalized.items.length,
      status: normalized.status,
      data: normalized
    });
  } catch (err: any) {
    console.error('[Dyno Webhook Error]:', err);

    try {
      recordInboundLog({
        id: `dyno_err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: '/api/webhooks/dyno',
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
        headers: req.headers,
        raw_body: req.body,
        detected_platform: 'Dyno API',
        detected_source: 'DYNO',
        item_count: 0,
        total_amount: 0,
        status_code: 400,
        success: false,
        message: err?.message || 'Failed to parse Dyno order payload',
        error: err?.message,
        duration_ms: Date.now() - startTime
      });
    } catch {}

    return res.status(400).json({
      success: false,
      error: err?.message || 'Invalid Dyno order payload'
    });
  }
}
