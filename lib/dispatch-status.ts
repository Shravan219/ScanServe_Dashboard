export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PetpoojaMappedStatus = 'ACCEPTED' | 'IN_KITCHEN' | 'READY' | 'DISPATCHED' | 'CANCELLED';

export type DynoMappedStatus = 'ACCEPTED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface DispatchOrderStatusParams {
  orderId: string;
  nextStatus: OrderStatus;
  restId?: string;
  callbackUrl?: string;
}

export interface DispatchResult {
  success: boolean;
  mode: 'PROD' | 'MOCK' | 'DYNO';
  endpoint: string;
  order_status: string;
  http_status?: number;
  data?: any;
  error?: string;
}

export function mapStatusToPetpooja(status: OrderStatus): PetpoojaMappedStatus {
  switch (status) {
    case 'pending':
      return 'ACCEPTED';
    case 'preparing':
      return 'IN_KITCHEN';
    case 'ready':
      return 'READY';
    case 'completed':
      return 'DISPATCHED';
    case 'cancelled':
      return 'CANCELLED';
    default:
      return 'ACCEPTED';
  }
}

/**
 * Map internal status codes to Dyno status strings:
 * - 'pending'   -> 'ACCEPTED'
 * - 'preparing' / 'IN_KITCHEN' -> 'PREPARING'
 * - 'ready'     -> 'READY'
 * - 'completed' / 'COMPLETED' -> 'DELIVERED'
 * - 'dispatched' -> 'DISPATCHED'
 * - 'cancelled' -> 'CANCELLED'
 */
export function mapStatusToDyno(status: OrderStatus | string): DynoMappedStatus {
  const normalized = String(status || '').toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'accepted':
      return 'ACCEPTED';
    case 'preparing':
    case 'in_kitchen':
      return 'PREPARING';
    case 'ready':
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
  restId,
  callbackUrl
}: DispatchOrderStatusParams): Promise<DispatchResult> {
  // Dyno API configuration check
  const dynoApiKey = getEnvVar('DYNO_API_KEY');

  // Petpooja API configuration check
  const appKey = getEnvVar('PETPOOJA_APP_KEY');
  const appSecret = getEnvVar('PETPOOJA_APP_SECRET');
  const accessToken = getEnvVar('PETPOOJA_ACCESS_TOKEN');

  let mode: 'PROD' | 'MOCK' | 'DYNO' = 'MOCK';
  let endpoint = '';
  let mappedStatus = '';
  let payload: any = {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (dynoApiKey) {
    // 1. Dyno API dispatch mode
    mode = 'DYNO';
    mappedStatus = mapStatusToDyno(nextStatus);
    endpoint = getEnvVar('DYNO_API_URL') || 'https://dynoapis.com/api/v1/orders/status';
    headers['x-api-key'] = dynoApiKey;
    payload = {
      order_id: orderId,
      status: mappedStatus
    };
  } else if (appKey && appSecret && accessToken) {
    // 2. Production Petpooja Open API dispatch mode
    mode = 'PROD';
    mappedStatus = mapStatusToPetpooja(nextStatus);
    endpoint = getEnvVar('PETPOOJA_STATUS_API_URL') || 'https://open-api.petpooja.com/v1/orders/update_status';
    headers['app-key'] = appKey;
    headers['app-secret'] = appSecret;
    headers['access-token'] = accessToken;

    const resolvedRestId = 
      restId ||
      getEnvVar('PETPOOJA_REST_ID') ||
      getEnvVar('PETPOOJA_RESTAURANT_ID') ||
      'REST_XTRA_01';

    const clientId = 
      getEnvVar('PETPOOJA_CLIENT_ID') ||
      'petpooja_client_live';

    payload = {
      restID: resolvedRestId,
      client_id: clientId,
      order_id: orderId,
      order_status: mappedStatus,
      updated_at: new Date().toISOString()
    };
  } else {
    // 3. Fallback / Mock Tester Receiver mode
    mode = 'MOCK';
    mappedStatus = mapStatusToPetpooja(nextStatus);
    endpoint = 
      callbackUrl ||
      getEnvVar('TESTER_CALLBACK_URL') ||
      getEnvVar('PETPOOJA_OUTBOUND_WEBHOOK_URL') ||
      'https://vyomapos-t.vercel.app/api/webhooks/receiver';

    const resolvedRestId = 
      restId ||
      getEnvVar('PETPOOJA_REST_ID') ||
      getEnvVar('PETPOOJA_RESTAURANT_ID') ||
      'REST_XTRA_01';

    const clientId = 
      getEnvVar('PETPOOJA_CLIENT_ID') ||
      'petpooja_client_live';

    payload = {
      restID: resolvedRestId,
      client_id: clientId,
      order_id: orderId,
      order_status: mappedStatus,
      updated_at: new Date().toISOString()
    };
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
      responseData?.status === 'success';

    if (isSuccess) {
      console.log(`[STATUS DISPATCH] (${mode}) -> status ${mappedStatus} (order: ${orderId}) sent to ${endpoint}`);
      return {
        success: true,
        mode,
        endpoint,
        order_status: mappedStatus,
        http_status: response.status,
        data: responseData
      };
    } else {
      console.warn(`[STATUS DISPATCH] (${mode}) -> status ${mappedStatus} (order: ${orderId}) returned HTTP ${response.status} from ${endpoint}`, responseData);
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
      console.warn(`[STATUS DISPATCH] (${mode}) -> request timed out after 5000ms for order ${orderId} to ${endpoint}`);
      return {
        success: false,
        mode,
        endpoint,
        order_status: mappedStatus,
        error: 'Request timed out after 5 seconds'
      };
    }

    console.warn(`[STATUS DISPATCH] (${mode}) -> failed to dispatch status ${mappedStatus} for order ${orderId}:`, error.message || error);
    return {
      success: false,
      mode,
      endpoint,
      order_status: mappedStatus,
      error: error.message || 'Network connection failure'
    };
  }
}
