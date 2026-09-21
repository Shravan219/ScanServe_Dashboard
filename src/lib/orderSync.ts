// Standardized status mapping for outbound Dyno POS integration
export const DYNO_STATUS_MAP = {
  pending: 'ACCEPTED',
  preparing: 'PREPARING',
  ready: 'READY',
  completed: 'DELIVERED',
  cancelled: 'CANCELLED'
} as const;

/**
 * Dispatches an outbound status change notification to Dyno API via our backend API.
 */
export async function syncOrderStatusToDyno(params: {
  orderId: string;
  token?: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | string;
  source?: string;
}) {
  const mappedStatus = (DYNO_STATUS_MAP as any)[params.status] || params.status.toUpperCase();

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
        source: params.source || 'DYNO'
      })
    });

    if (!response.ok) {
      console.warn(`[Dyno Sync] HTTP ${response.status} when updating order ${params.orderId}`);
    } else {
      const data = await response.json();
      console.log(`[Dyno Sync] Outbound status sync successful:`, data);
    }
  } catch (error) {
    console.warn(`[Dyno Sync Error] Could not reach status sync endpoint:`, error);
  }
}

export const syncOrderStatusToPetpooja = syncOrderStatusToDyno;
