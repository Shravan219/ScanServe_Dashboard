import { processWebhookPayload } from '@/server/processWebhook';
import { triggerOutboundWebhook } from '@/server/routes/orders';

// Standardized status mapping for outbound POS integration
// Strictly 2 outbound events: "IN_KITCHEN" and "READY_FOR_PICKUP"
export const POS_STATUS_MAP = {
  preparing: 'IN_KITCHEN',
  ready: 'READY_FOR_PICKUP'
} as const;

export type MappedPosStatus = 'IN_KITCHEN' | 'READY_FOR_PICKUP';

/**
 * Dispatches an outbound status change notification to Petpooja/Aggregators via our backend API.
 * Only fires for SWIGGY, ZOMATO, and ONLINE aggregator orders.
 * Strictly triggers for 'preparing' (IN_KITCHEN) and 'ready' (READY_FOR_PICKUP).
 */
export async function syncOrderStatusToPetpooja(params: {
  orderId: string;
  token?: string;
  status: 'preparing' | 'ready' | string;
  source?: 'ZOMATO' | 'SWIGGY' | 'ONLINE' | string;
  restaurantId?: string;
}) {
  const sourceUpper = (params.source || '').toUpperCase();
  const isOnline = sourceUpper === 'SWIGGY' || sourceUpper === 'ZOMATO' || sourceUpper === 'ONLINE';

  // Ignore Dine-In/Captain table orders
  if (!isOnline) {
    return;
  }

  // Only trigger for preparing and ready states
  const mappedStatus = (POS_STATUS_MAP as any)[params.status];
  if (!mappedStatus) {
    return;
  }

  try {
    const response = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: params.token || params.orderId,
        status: mappedStatus,
        source: sourceUpper,
        restaurant_id: params.restaurantId || 'REST_XTRA_01'
      })
    });

    if (!response.ok) {
      console.warn(`[Petpooja Sync] HTTP ${response.status} when updating order ${params.orderId}`);
    } else {
      const data = await response.json();
      console.log(`[Petpooja Sync] Outbound status sync (${mappedStatus}):`, data);
      return data;
    }
  } catch (error) {
    // Non-blocking: optimistic UI continues normally
    console.warn(`[Petpooja Sync Error] Could not reach status sync endpoint:`, error);
  }
}
