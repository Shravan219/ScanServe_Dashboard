// Standardized status mapping for outbound POS integration
export const POS_STATUS_MAP = {
  preparing: 'IN_KITCHEN',
  ready: 'READY',
  completed: 'DISPATCHED',
  cancelled: 'CANCELLED'
} as const;

export type MappedPosStatus = 'IN_KITCHEN' | 'READY' | 'DISPATCHED' | 'CANCELLED';

/**
 * Dispatches an outbound status change notification to Petpooja/Aggregators via our backend API.
 * Uses optimistic execution and error tolerance.
 */
export async function syncOrderStatusToPetpooja(params: {
  orderId: string;
  token?: string;
  status: 'preparing' | 'ready' | 'completed' | 'cancelled' | string;
  source?: 'ZOMATO' | 'SWIGGY' | 'DINE_IN' | string;
  restaurantId?: string;
}) {
  const mappedStatus = (POS_STATUS_MAP as any)[params.status] || params.status.toUpperCase();

  try {
    const response = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.orderId || params.token,
        token: params.token || params.orderId,
        status: mappedStatus,
        source: params.source || 'DINE_IN',
        order_from: params.source || 'DINE_IN',
        restaurant_id: params.restaurantId || 'REST_XTRA_01'
      })
    });

    if (!response.ok) {
      console.warn(`[Petpooja Sync] HTTP ${response.status} when updating order ${params.orderId}`);
    } else {
      const data = await response.json();
      console.log(`[Petpooja Sync] Outbound status sync successful:`, data);
    }
  } catch (error) {
    // Non-blocking: optimistic UI continues normally even with offline or network latency
    console.warn(`[Petpooja Sync Error] Could not reach status sync endpoint:`, error);
  }
}
