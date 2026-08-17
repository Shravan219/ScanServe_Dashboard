/**
 * Outbound Webhook Dispatcher for Petpooja & Aggregator Status Sync
 * @packageDocumentation
 */

export type PetpoojaInputStatus = 
  | 'COOKING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'preparing' 
  | 'ready' 
  | 'completed' 
  | 'cancelled' 
  | 'pending'
  | string;

export type PetpoojaMappedStatus = 'IN_KITCHEN' | 'READY' | 'CANCELLED' | string;

export interface SendPetpoojaStatusParams {
  orderId: string;
  status: PetpoojaInputStatus;
  callbackUrl?: string;
}

export interface PetpoojaDispatchResult {
  success: boolean;
  http_status?: number;
  data?: any;
  message?: string;
  error?: string;
  endpoint?: string;
}

/**
 * Maps standard application statuses to Petpooja API format:
 * - 'COOKING' / 'preparing' -> 'IN_KITCHEN'
 * - 'COMPLETED' / 'ready' / 'completed' -> 'READY'
 * - 'CANCELLED' / 'cancelled' -> 'CANCELLED'
 */
export function mapPetpoojaStatus(status: PetpoojaInputStatus): PetpoojaMappedStatus {
  const norm = (status || '').toString().trim().toUpperCase();
  
  if (norm === 'COOKING' || norm === 'PREPARING' || norm === 'IN_KITCHEN' || norm === 'IN_PROGRESS' || norm === 'ACCEPTED') {
    return 'IN_KITCHEN';
  }
  
  if (norm === 'COMPLETED' || norm === 'READY' || norm === 'DISPATCHED' || norm === 'SERVED') {
    return 'READY';
  }
  
  if (norm === 'CANCELLED' || norm === 'CANCELED' || norm === 'REJECTED') {
    return 'CANCELLED';
  }
  
  return norm || 'IN_KITCHEN';
}

/**
 * Checks if an order originated from Petpooja, an aggregator (Swiggy/Zomato), or a webhook tester
 */
export function isPetpoojaOrAggregatorOrder(order?: any): boolean {
  if (!order) return false;
  
  // 1. Explicit callback_url or source attribute
  if (order.callback_url && typeof order.callback_url === 'string' && order.callback_url.trim().length > 0) {
    return true;
  }
  if (order.source && typeof order.source === 'string' && order.source.trim().length > 0 && order.source.toUpperCase() !== 'DINE_IN') {
    return true;
  }
  
  // 2. Aggregator platform tag
  if (order.aggregator_platform && ['swiggy', 'zomato', 'magicpin', 'petpooja', 'ubereats'].includes(order.aggregator_platform.toLowerCase())) {
    return true;
  }
  if (order.order_type === 'aggregator' || order.order_type === 'delivery') {
    return true;
  }
  
  // 3. ID / Token / Table indicators
  const idStr = (order.id || '').toString().toUpperCase();
  const tokenStr = (order.token || '').toString().toUpperCase();
  const tableStr = (order.table_id || '').toString().toUpperCase();
  const notesStr = (order.notes || '').toString().toUpperCase();

  if (
    idStr.startsWith('PP_') || 
    idStr.startsWith('SW_') || 
    idStr.startsWith('SWIGGY_') || 
    idStr.startsWith('ZOM_') || 
    idStr.startsWith('ZOMATO_') ||
    tokenStr.startsWith('SW') || 
    tokenStr.startsWith('ZM') ||
    tableStr.includes('SWIGGY') || 
    tableStr.includes('ZOMATO') ||
    tableStr.includes('ONLINE') ||
    notesStr.includes('SWIGGY') ||
    notesStr.includes('ZOMATO') ||
    notesStr.includes('PETPOOJA')
  ) {
    return true;
  }

  return false;
}

/**
 * Dispatches an outbound status change webhook payload to the configured Petpooja / Tester callback URL.
 * 
 * Payload structure:
 * {
 *   "restID": process.env.PETPOOJA_REST_ID || "REST_XTRA_01",
 *   "client_id": process.env.PETPOOJA_CLIENT_ID || "petpooja_client_9812",
 *   "order_id": orderId,
 *   "order_status": mappedStatus,
 *   "cancel_reason": status === 'CANCELLED' ? "Cancelled by kitchen" : "",
 *   "updated_at": new Date().toISOString()
 * }
 */
export async function sendPetpoojaStatusUpdate({
  orderId,
  status,
  callbackUrl
}: SendPetpoojaStatusParams): Promise<PetpoojaDispatchResult> {
  const mappedStatus = mapPetpoojaStatus(status);
  
  // Determine Restaurant ID & Client ID
  const restID = 
    (typeof process !== 'undefined' && process.env?.PETPOOJA_REST_ID) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PETPOOJA_REST_ID) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('vyoma_petpooja_rest_id')) ||
    "REST_XTRA_01";

  const clientId = 
    (typeof process !== 'undefined' && process.env?.PETPOOJA_CLIENT_ID) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PETPOOJA_CLIENT_ID) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('vyoma_petpooja_client_id')) ||
    "petpooja_client_9812";

  // Determine Target Callback URL
  const targetUrl = 
    (callbackUrl && callbackUrl.trim()) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('vyoma_outbound_webhook_url')) ||
    (typeof process !== 'undefined' && process.env?.PETPOOJA_CALLBACK_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PETPOOJA_CALLBACK_URL) ||
    "http://localhost:3001/api/mock-callback";

  const isCancelled = status.toString().trim().toUpperCase() === 'CANCELLED' || mappedStatus === 'CANCELLED';

  const payload = {
    restID,
    client_id: clientId,
    order_id: orderId,
    order_status: mappedStatus,
    cancel_reason: isCancelled ? "Cancelled by kitchen" : "",
    updated_at: new Date().toISOString()
  };

  console.log(`[Petpooja Outbound Dispatcher] Sending ${mappedStatus} update for Order ${orderId} to: ${targetUrl}`, payload);

  // Also notify internal server endpoint to record in server telemetry / outbound logs
  try {
    fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        status: mappedStatus,
        restaurant_id: restID,
        callback_url: targetUrl
      })
    }).catch(() => {});
  } catch {}

  // Dispatch HTTP POST to callbackUrl with a 5-second timeout AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Restaurant-ID': restID,
        'X-Source': 'VYOMA_POS'
      },
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
      console.log(`[Petpooja Outbound Dispatcher] Status successfully synced for order ${orderId}:`, responseData);
      return {
        success: true,
        http_status: response.status,
        data: responseData,
        endpoint: targetUrl
      };
    } else {
      console.warn(`[Petpooja Outbound Dispatcher] Remote returned non-success for order ${orderId} (HTTP ${response.status}):`, responseData);
      return {
        success: false,
        http_status: response.status,
        error: responseData?.message || `HTTP ${response.status}`,
        data: responseData,
        endpoint: targetUrl
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      console.warn(`[Petpooja Outbound Dispatcher] Request timed out after 5000ms for order ${orderId} to ${targetUrl}`);
      return {
        success: false,
        error: 'Request timed out after 5 seconds',
        endpoint: targetUrl
      };
    }

    console.warn(`[Petpooja Outbound Dispatcher] Network / CORS error dispatching status update for order ${orderId}:`, err.message || err);
    
    // Return gracefully without throwing so UI state changes are completely unblocked
    return {
      success: false,
      error: err.message || 'Network connection failure',
      endpoint: targetUrl
    };
  }
}
