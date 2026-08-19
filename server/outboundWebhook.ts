import crypto from 'crypto';
import { broadcastEvent } from './orderStore';

// In-memory runtime config that overrides process.env if set via UI
let dynamicOutboundUrl: string = process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL || '';
let dynamicRestaurantId: string = process.env.PETPOOJA_RESTAURANT_ID || 'REST_XTRA_01';
let dynamicSecret: string = process.env.PETPOOJA_WEBHOOK_SECRET || 'vyoma_live_sec_882194ad7c10b';

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

export function recordLog(log: OutboundLog) {
  outboundLogs.unshift(log);
  if (outboundLogs.length > 50) {
    outboundLogs.pop();
  }
  broadcastEvent('outbound_log', log);
}

export function getOutboundLogs(): OutboundLog[] {
  return outboundLogs;
}

export function clearOutboundLogs() {
  outboundLogs.length = 0;
}

export function updateDynamicConfig(config: { outbound_url?: string; restaurant_id?: string; secret?: string }) {
  if (config.outbound_url !== undefined) dynamicOutboundUrl = config.outbound_url;
  if (config.restaurant_id !== undefined) dynamicRestaurantId = config.restaurant_id;
  if (config.secret !== undefined) dynamicSecret = config.secret;
}

export function getDynamicConfig() {
  return {
    outbound_url: dynamicOutboundUrl || process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL || 'https://vyomapos-t.vercel.app/api/webhooks/receiver',
    restaurant_id: dynamicRestaurantId || process.env.PETPOOJA_RESTAURANT_ID || 'REST_XTRA_01',
    secret: dynamicSecret
  };
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
      http_status: err.name === 'AbortError' ? 408 : 503,
      success: false,
      duration_ms,
      payload,
      response: null,
      error: err.message || 'Request failed or timed out'
    };
    recordLog(logEntry);

    return {
      success: false,
      http_status: err.name === 'AbortError' ? 408 : 503,
      target_url: targetUrl,
      duration_ms,
      payload,
      error: err.message,
      simulated: true
    };
  }
}
