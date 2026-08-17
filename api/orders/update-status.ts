import { triggerOutboundWebhook } from '../../server/routes/orders';
import { getMemoryOrder, saveMemoryOrder, broadcastEvent, getSupabaseClient } from '../../server/orderStore';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { order_id, token, status, source, restaurant_id } = body || {};

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: order_id and status are mandatory'
      });
    }

    const existing = getMemoryOrder(String(order_id)) || getMemoryOrder(String(token));
    if (existing) {
      existing.status = status;
      saveMemoryOrder(existing);
      broadcastEvent('order_updated', existing);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('orders')
          .update({ status })
          .or(`id.eq.${order_id},token.eq.${token || order_id}`);
      } catch (err: any) {
        console.warn('Could not update status in Supabase:', err.message);
      }
    }

    const webhookResult = await triggerOutboundWebhook({
      order_id: String(order_id),
      token: token ? String(token) : undefined,
      status: String(status),
      source: source || 'DINE_IN',
      restaurant_id
    });

    return res.status(200).json({
      success: true,
      message: 'Status update processed',
      webhook_dispatch: webhookResult
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal error handling status sync'
    });
  }
}
