import { processWebhookPayload } from '../../server/processWebhook';
import { getAllMemoryOrders, getSupabaseClient } from '../../server/orderStore';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    try {
      let memoryOrders: any[] = [];
      try {
        memoryOrders = getAllMemoryOrders() || [];
      } catch {
        memoryOrders = [];
      }

      let dbOrders: any[] = [];
      try {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            dbOrders = data;
          }
        }
      } catch {
        // Supabase unreachable or table not set up yet
      }

      const orderMap = new Map<string, any>();
      for (const o of dbOrders) {
        const key = o.id || o.token;
        if (key) orderMap.set(key, o);
      }
      for (const o of memoryOrders) {
        const key = o.id || o.token;
        if (key) orderMap.set(key, o);
      }

      const merged = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );

      return res.status(200).json({
        success: true,
        count: merged.length,
        orders: merged
      });
    } catch (e: any) {
      console.warn('[API /orders GET Warning]', e?.message);
      return res.status(200).json({ success: true, count: 0, orders: [] });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }
      const result = await processWebhookPayload(body, req.headers, {
        method: req.method,
        path: '/api/orders'
      });
      return res.status(result.status || 200).json(result.data);
    } catch (err: any) {
      return res.status(200).json({
        success: '1',
        status: 'success',
        message: 'Order received',
        error: err?.message
      });
    }
  }

  return res.status(200).json({ success: true, orders: [] });
}
