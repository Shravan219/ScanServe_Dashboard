import { parseDynoOrderPayload } from '../../../lib/dyno-adapter';
import {
  saveMemoryOrder,
  getSupabaseClient,
  broadcastEvent,
  recordInboundLog,
  formatIST,
  ServerOrder
} from '../../../server/orderStore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      status: 'online',
      message: 'Dyno Webhook endpoint is active and ready to receive POST payloads',
      endpoint: '/api/webhooks/dyno',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    // 1. Log exact incoming payload for developer inspection in Vercel / terminal logs
    console.log('RAW_DYNO_WEBHOOK:', JSON.stringify(body, null, 2));

    // 2. Parse Dyno payload using Adapter with robust aggregator key fallbacks
    const normalized = parseDynoOrderPayload(body);
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
        item_notes: it.item_notes,
      })),
      customer_name: normalized.customer.name,
      customer_phone: normalized.customer.phone,
      table_id: normalized.tableId,
      order_type: 'aggregator',
      aggregator_platform: normalized.source,
      notes: normalized.instructions,
      created_at: normalized.placedAt || new Date().toISOString(),
      placed_at_ist: formatIST(normalized.placedAt),
    };

    try {
      saveMemoryOrder(serverOrder);
    } catch {}

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
          created_at: serverOrder.created_at,
        });
      }
    } catch {}

    try {
      recordInboundLog({
        id: `dyno_log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        method: 'POST',
        path: '/api/webhooks/dyno',
        headers: {},
        raw_body: body,
        detected_platform: 'Dyno API',
        detected_source: normalized.source.toUpperCase(),
        order_id: normalized.orderId,
        token: serverOrder.token,
        item_count: normalized.items.length,
        total_amount: normalized.totalAmount,
        status_code: 200,
        success: true,
        message: `Dyno order ${normalized.orderId} processed (${normalized.source.toUpperCase()}) - ${normalized.customer.name}`,
        duration_ms: Date.now() - startTime,
      });
    } catch {}

    try {
      broadcastEvent('new_order', serverOrder);
      broadcastEvent('order_created', serverOrder);
    } catch {}

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order received and processed successfully',
        order_id: normalized.orderId,
        source: normalized.source,
        customer_name: normalized.customer.name,
        customer_phone: normalized.customer.phone,
        total_amount: normalized.totalAmount,
        items_count: normalized.items.length,
        status: normalized.status,
        data: normalized,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (err: any) {
    console.error('[Dyno Webhook Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Invalid Dyno order payload',
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
