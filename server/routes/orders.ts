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
} from '../orderStore.js';
import { processWebhookPayload } from '../processWebhook.js';

const router = Router();

// In-memory runtime config that overrides process.env if set via UI
let dynamicOutboundUrl: string = process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL || '';
let dynamicRestaurantId: string = process.env.PETPOOJA_RESTAURANT_ID || 'REST_XTRA_01';
let dynamicSecret: string = process.env.PETPOOJA_WEBHOOK_SECRET || 'vyoma_live_sec_882194ad7c10b';

// Outbound logs circular buffer (last 50 items)
export interface OutboundLog {
  id: string;
  timestamp: string;
  order_id: string;
  status: string;
  source: string;
  target_url: string;
  http_status: number | string;
  success: boolean;
  duration_ms: number;
  payload: any;
  response: any;
  error?: string;
}

const outboundLogs: OutboundLog[] = [];

function recordLog(log: OutboundLog) {
  outboundLogs.unshift(log);
  if (outboundLogs.length > 50) {
    outboundLogs.pop();
  }
  broadcastEvent('outbound_log', log);
}

// Petpooja / Aggregator Outbound Webhook Trigger Handler
export async function triggerOutboundWebhook(orderData: {
  order_id: string;
  token?: string;
  restaurant_id?: string;
  status: string;
  updated_at?: string;
  source?: 'ZOMATO' | 'SWIGGY' | 'DINE_IN' | string;
  custom_target_url?: string;
}) {
  const targetUrl =
    orderData.custom_target_url ||
    dynamicOutboundUrl ||
    process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL ||
    'https://api.petpooja.com/v1/orders/status_update';
  const restaurantId = orderData.restaurant_id || dynamicRestaurantId || 'REST_XTRA_01';
  const apiSecret = dynamicSecret;
  const posVersion = 'v2.19.4';
  const updatedAt = orderData.updated_at || new Date().toISOString();

  // Normalize mapping for status
  let mappedStatus = orderData.status;
  const sUpper = (orderData.status || '').toUpperCase();
  if (sUpper === 'PREPARING' || sUpper === 'IN_KITCHEN') {
    mappedStatus = 'IN_KITCHEN';
  } else if (sUpper === 'READY' || sUpper === 'READY_FOR_PICKUP') {
    mappedStatus = 'READY';
  } else if (sUpper === 'COMPLETED' || sUpper === 'DISPATCHED' || sUpper === 'DELIVERED') {
    mappedStatus = 'DISPATCHED';
  } else if (sUpper === 'CANCELLED') {
    mappedStatus = 'CANCELLED';
  }

  // Determine Source (ZOMATO, SWIGGY, DINE_IN, ONLINE)
  let source = (orderData.source || 'DINE_IN').toUpperCase();
  if (source.includes('ZOMATO')) source = 'ZOMATO';
  else if (source.includes('SWIGGY')) source = 'SWIGGY';
  else if (source.includes('DINE') || source.includes('TABLE')) source = 'DINE_IN';

  const payload = {
    order_id: orderData.order_id,
    token: orderData.token || orderData.order_id,
    restaurant_id: restaurantId,
    status: mappedStatus,
    updated_at: updatedAt,
    source,
    order_from: source
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(payloadString)
    .digest('hex');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiSecret}`,
    'X-Restaurant-ID': restaurantId,
    'X-Pos-Version': posVersion,
    'X-Petpooja-Signature': signature,
    'X-Source': 'VYOMA_POS'
  };

  console.log(`[Outbound Webhook] Dispatching status update for order ${orderData.order_id} -> ${mappedStatus} to ${targetUrl}`);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const duration_ms = Date.now() - startTime;

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    const logEntry: OutboundLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      order_id: orderData.order_id,
      status: mappedStatus,
      source,
      target_url: targetUrl,
      http_status: response.status,
      success: response.ok,
      duration_ms,
      payload,
      response: responseJson
    };
    recordLog(logEntry);

    return {
      success: response.ok,
      http_status: response.status,
      target_url: targetUrl,
      duration_ms,
      payload,
      response: responseJson
    };
  } catch (err: any) {
    const duration_ms = Date.now() - startTime;
    console.warn(`[Outbound Webhook Warning] Could not reach ${targetUrl}:`, err.message);

    const logEntry: OutboundLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      order_id: orderData.order_id,
      status: mappedStatus,
      source,
      target_url: targetUrl,
      http_status: 'FAILED',
      success: false,
      duration_ms,
      payload,
      response: null,
      error: err.message
    };
    recordLog(logEntry);

    return {
      success: false,
      error: err.message,
      target_url: targetUrl,
      duration_ms,
      payload,
      fallback_logged: true
    };
  }
}

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
    } catch {
      // ignore
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

  res.json({
    success: true,
    count: merged.length,
    orders: merged
  });
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
      ip: req.ip || req.socket.remoteAddress
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Error processing order'
    });
  }
});

/**
 * GET /api/orders/webhook-config
 * Return current outbound target URL and config
 */
router.get('/webhook-config', (req: Request, res: Response) => {
  res.json({
    success: true,
    outbound_webhook_url: dynamicOutboundUrl || process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL || '',
    restaurant_id: dynamicRestaurantId,
    env_configured: !!process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL
  });
});

/**
 * POST /api/orders/webhook-config
 * Update dynamic outbound target URL
 */
router.post('/webhook-config', (req: Request, res: Response) => {
  const { outbound_webhook_url, restaurant_id } = req.body;
  if (outbound_webhook_url !== undefined) {
    dynamicOutboundUrl = String(outbound_webhook_url).trim();
  }
  if (restaurant_id) {
    dynamicRestaurantId = String(restaurant_id).trim();
  }
  res.json({
    success: true,
    message: 'Webhook config updated successfully',
    outbound_webhook_url: dynamicOutboundUrl,
    restaurant_id: dynamicRestaurantId
  });
});

/**
 * GET /api/orders/webhook-logs
 * Return recent outbound dispatch logs
 */
router.get('/webhook-logs', (req: Request, res: Response) => {
  res.json({
    success: true,
    logs: outboundLogs
  });
});

/**
 * POST /api/orders/test-ping
 * Send a test status ping to verify connection with Tester App
 */
router.post('/test-ping', async (req: Request, res: Response) => {
  const { target_url, order_id, status, source } = req.body;

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

  return res.json({
    success: result.success,
    message: result.success
      ? `Successfully delivered test update to tester (${result.http_status})`
      : `Failed to deliver test update to tester: ${result.error || 'HTTP ' + result.http_status}`,
    details: result
  });
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
