import { broadcastEvent } from './orderStore';

let dynamicOutboundUrl: string = process.env.DYNO_API_URL || 'https://dynoapis.com/api/v1/orders/status';
let dynamicApiKey: string = process.env.DYNO_API_KEY || '';

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

export function updateDynamicConfig(config: { outbound_url?: string; api_key?: string }) {
  if (config.outbound_url !== undefined) dynamicOutboundUrl = config.outbound_url;
  if (config.api_key !== undefined) dynamicApiKey = config.api_key;
}

export function getDynamicConfig() {
  return {
    outbound_url: dynamicOutboundUrl || process.env.DYNO_API_URL || 'https://dynoapis.com/api/v1/orders/status',
    api_key: dynamicApiKey || process.env.DYNO_API_KEY || ''
  };
}

export function mapStatusToDyno(rawStatus: string): string {
  const s = String(rawStatus || '').toUpperCase();
  if (s === 'PENDING' || s === 'ACCEPTED') return 'ACCEPTED';
  if (s === 'PREPARING' || s === 'IN_KITCHEN') return 'PREPARING';
  if (s === 'READY' || s === 'READY_FOR_PICKUP') return 'READY';
  if (s === 'COMPLETED' || s === 'DISPATCHED' || s === 'DELIVERED') return 'DELIVERED';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'ACCEPTED';
}

export async function triggerOutboundWebhook(orderData: {
  order_id: string;
  token?: string;
  status: string;
  updated_at?: string;
  source?: string;
  custom_target_url?: string;
}) {
  const targetUrl =
    orderData.custom_target_url ||
    dynamicOutboundUrl ||
    process.env.DYNO_API_URL ||
    'https://dynoapis.com/api/v1/orders/status';

  const mappedStatus = mapStatusToDyno(orderData.status);
  const source = (orderData.source || 'DYNO').toUpperCase();

  const payload = {
    order_id: orderData.order_id,
    status: mappedStatus
  };

  const payloadString = JSON.stringify(payload);
  const apiKey = dynamicApiKey || process.env.DYNO_API_KEY || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  console.log(`[Dyno Outbound Webhook] Dispatching status update for order ${orderData.order_id} -> ${mappedStatus} to ${targetUrl}`);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    console.warn(`[Dyno Outbound Webhook Warning] Could not reach ${targetUrl}:`, err.message);

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
