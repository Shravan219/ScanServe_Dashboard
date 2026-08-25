export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'waiting for payment' | 'completed' | 'cancelled';

export type DynoMappedStatus = 'ACCEPTED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface DispatchOrderStatusParams {
  orderId: string;
  nextStatus: OrderStatus;
  restId?: string;
  callbackUrl?: string;
}

export interface DispatchResult {
  success: boolean;
  mode: 'DYNO' | 'MOCK';
  endpoint: string;
  order_status: string;
  http_status?: number;
  data?: any;
  error?: string;
}

/**
 * Map internal status codes strictly to Dyno status strings:
 * - 'pending'   -> 'ACCEPTED'
 * - 'preparing' -> 'PREPARING'
 * - 'ready'     -> 'READY'
 * - 'waiting for payment' -> 'READY'
 * - 'completed' -> 'DELIVERED'
 * - 'dispatched' -> 'DISPATCHED'
 * - 'cancelled' -> 'CANCELLED'
 */
export function mapStatusToDyno(status: OrderStatus | string): DynoMappedStatus {
  const normalized = String(status || '').toLowerCase().trim();
  switch (normalized) {
    case 'pending':
    case 'accepted':
      return 'ACCEPTED';
    case 'preparing':
    case 'in_kitchen':
      return 'PREPARING';
    case 'ready':
    case 'waiting for payment':
    case 'waiting_for_payment':
      return 'READY';
    case 'dispatched':
      return 'DISPATCHED';
    case 'completed':
    case 'delivered':
      return 'DELIVERED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'ACCEPTED';
  }
}

function getEnvVar(key: string, viteKey?: string): string {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const vKey = viteKey || `VITE_${key}`;
    if ((import.meta as any).env[vKey]) {
      return (import.meta as any).env[vKey];
    }
    if ((import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  }
  return '';
}

export async function dispatchOrderStatus({
  orderId,
  nextStatus,
  callbackUrl
}: DispatchOrderStatusParams): Promise<DispatchResult> {
  const dynoApiKey = getEnvVar('DYNO_API_KEY');
  const mappedStatus = mapStatusToDyno(nextStatus);
  const endpoint = callbackUrl || getEnvVar('DYNO_API_URL') || 'https://dynoapis.com/api/v1/orders/status';
  const mode: 'DYNO' | 'MOCK' = dynoApiKey ? 'DYNO' : 'MOCK';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (dynoApiKey) {
    headers['x-api-key'] = dynoApiKey;
  }

  const payload = {
    order_id: orderId,
    status: mappedStatus
  };

  // Also send duplicate order status dispatch to TESTER_CALLBACK_URL if configured
  const testerUrl = getEnvVar('TESTER_CALLBACK_URL', 'VITE_TESTER_CALLBACK_URL');
  if (testerUrl && testerUrl !== endpoint) {
    fetch(testerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(tRes => {
      console.log(`[TESTER CALLBACK DISPATCH] Sent status ${mappedStatus} for order ${orderId} to ${testerUrl} (HTTP ${tRes.status})`);
    }).catch(tErr => {
      console.warn(`[TESTER CALLBACK DISPATCH WARNING] Could not reach ${testerUrl}:`, tErr.message);
    });
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    const isSuccess = 
      response.ok || 
      responseData?.success === '1' || 
      responseData?.success === 1 || 
      responseData?.success === true ||
      responseData?.status === 'success' ||
      responseData?.status === 200;

    if (isSuccess) {
      console.log(`[DYNO STATUS DISPATCH] (${mode}) -> status ${mappedStatus} (order: ${orderId}) sent to ${endpoint}`);
      return {
        success: true,
        mode,
        endpoint,
        order_status: mappedStatus,
        http_status: response.status,
        data: responseData
      };
    } else {
      console.warn(`[DYNO STATUS DISPATCH] (${mode}) -> status ${mappedStatus} (order: ${orderId}) returned HTTP ${response.status} from ${endpoint}`, responseData);
      return {
        success: false,
        mode,
        endpoint,
        order_status: mappedStatus,
        http_status: response.status,
        error: responseData?.message || `HTTP ${response.status}`,
        data: responseData
      };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.warn(`[DYNO STATUS DISPATCH] (${mode}) -> request timed out after 5000ms for order ${orderId} to ${endpoint}`);
      return {
        success: false,
        mode,
        endpoint,
        order_status: mappedStatus,
        error: 'Request timed out after 5 seconds'
      };
    }

    console.warn(`[DYNO STATUS DISPATCH] (${mode}) -> failed to dispatch status ${mappedStatus} for order ${orderId}:`, error.message || error);
    return {
      success: false,
      mode,
      endpoint,
      order_status: mappedStatus,
      error: error.message || 'Network connection failure'
    };
  }
}
