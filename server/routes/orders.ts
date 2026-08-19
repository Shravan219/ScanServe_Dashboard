import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  getAllMemoryOrders,
  getMemoryOrder,
  saveMemoryOrder,
  registerSSEClient,
  unregisterSSEClient,
  broadcastEvent,
  getSupabaseClient,
  ServerOrder
} from '../orderStore';
import { processWebhookPayload } from '../processWebhook';

const router = Router();

import {
  triggerOutboundWebhook,
  OutboundLog,
  recordLog,
  getOutboundLogs,
  clearOutboundLogs,
  updateDynamicConfig,
  getDynamicConfig
} from '../outboundWebhook';

export {
  triggerOutboundWebhook,
  recordLog,
  getOutboundLogs,
  clearOutboundLogs,
  updateDynamicConfig,
  getDynamicConfig
};
export type { OutboundLog };

/**
 * GET /api/orders/events
 * Real-time Server-Sent Events (SSE) stream for instantaneous browser updates
 */
router.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  
  const send = (data: string) => {
    res.write(data);
  };

  registerSSEClient(clientId, send);

  // Send initial ping and current orders
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat every 20 seconds to keep connection alive through proxies
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unregisterSSEClient(clientId);
  });
});

/**
 * GET /api/orders
 * Returns all active & historic orders (merges server memory + Supabase)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const memoryOrders = getAllMemoryOrders();
    
    // Try fetching from Supabase if connected
    const supabase = getSupabaseClient();
    let dbOrders: any[] = [];
    if (supabase) {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) dbOrders = data;
      } catch (dbErr: any) {
        console.warn('Supabase fetch error in GET /api/orders:', dbErr?.message);
      }
    }

    // Merge uniquely by ID / Token
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
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return res.status(200).json({
      success: true,
      count: merged.length,
      orders: merged
    });
  } catch (err: any) {
    console.error('Error in GET /api/orders:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Error fetching orders'
    });
  }
});

/**
 * POST /api/orders or POST /api/orders/create or POST /api/orders/webhook
 * Ingests an order directly
 */
router.post(['/', '/create', '/webhook'], async (req: Request, res: Response) => {
  try {
    const result = await processWebhookPayload(req.body, req.headers, {
      method: req.method,
      path: req.originalUrl || '/api/orders',
      ip: req.ip || req.socket?.remoteAddress
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err?.message || 'Error processing order'
    });
  }
});

/**
 * GET /api/orders/webhook-config
 * Return current outbound target URL and config
 */
router.get('/webhook-config', (req: Request, res: Response) => {
  try {
    const cfg = getDynamicConfig();
    return res.status(200).json({
      success: true,
      outbound_webhook_url: cfg.outbound_url,
      restaurant_id: cfg.restaurant_id,
      env_configured: !!process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL
    });
  } catch (err: any) {
    console.error('Error in GET /webhook-config:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error fetching config' });
  }
});

/**
 * POST /api/orders/webhook-config
 * Update dynamic outbound target URL
 */
router.post('/webhook-config', (req: Request, res: Response) => {
  try {
    const { outbound_webhook_url, restaurant_id } = req.body || {};
    updateDynamicConfig({
      outbound_url: outbound_webhook_url !== undefined ? String(outbound_webhook_url).trim() : undefined,
      restaurant_id: restaurant_id !== undefined ? String(restaurant_id).trim() : undefined
    });
    const cfg = getDynamicConfig();
    return res.status(200).json({
      success: true,
      message: 'Webhook config updated successfully',
      outbound_webhook_url: cfg.outbound_url,
      restaurant_id: cfg.restaurant_id
    });
  } catch (err: any) {
    console.error('Error updating webhook config:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error updating config' });
  }
});

/**
 * GET /api/orders/webhook-logs
 * Return recent outbound dispatch logs
 */
router.get('/webhook-logs', (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      logs: getOutboundLogs()
    });
  } catch (err: any) {
    console.error('Error fetching webhook logs:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error fetching logs' });
  }
});

/**
 * POST /api/orders/test-ping
 * Send a test status ping to verify connection with Tester App
 */
router.post('/test-ping', async (req: Request, res: Response) => {
  try {
    const { target_url, order_id, status, source } = req.body || {};

    const testOrderId = order_id || `TEST_PING_${Math.floor(1000 + Math.random() * 9000)}`;
    const testStatus = status || 'IN_KITCHEN';
    const testSource = source || 'SWIGGY';

    const result = await triggerOutboundWebhook({
      order_id: testOrderId,
      token: testOrderId,
      status: testStatus,
      source: testSource,
      custom_target_url: target_url
    });

    return res.status(200).json({
      success: result.success,
      message: result.success
        ? `Successfully delivered test update to tester (${result.http_status})`
        : `Failed to deliver test update to tester: ${result.error || 'HTTP ' + result.http_status}`,
      details: result
    });
  } catch (err: any) {
    console.error('Error in POST /test-ping:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || 'Error executing test ping'
    });
  }
});

/**
 * POST /api/orders/update-status
 * Payload: { order_id, token, status, source, restaurant_id }
 */
router.post('/update-status', async (req: Request, res: Response) => {
  try {
    const { order_id, token, status, source, restaurant_id } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: order_id and status are mandatory'
      });
    }

    // Update memory order if exists
    const existing = getMemoryOrder(String(order_id)) || getMemoryOrder(String(token));
    if (existing) {
      existing.status = status;
      saveMemoryOrder(existing);
      broadcastEvent('order_updated', existing);
    }

    // Update Supabase if connected
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
      message: 'Status update processed and outbound webhook triggered',
      webhook_dispatch: webhookResult
    });
  } catch (err: any) {
    console.error('Error in /api/orders/update-status:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal error handling status sync'
    });
  }
});

export default router;
