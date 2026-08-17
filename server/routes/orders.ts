import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// Petpooja / Aggregator Outbound Webhook Trigger Handler
export async function triggerOutboundWebhook(orderData: {
  order_id: string;
  restaurant_id?: string;
  status: string;
  updated_at?: string;
  source?: 'ZOMATO' | 'SWIGGY' | 'ONLINE' | string;
}) {
  // CRITICAL: Outbound webhook applies ONLY to SWIGGY, ZOMATO, and ONLINE aggregator orders
  let source = (orderData.source || '').toUpperCase();
  if (source.includes('ZOMATO')) source = 'ZOMATO';
  else if (source.includes('SWIGGY')) source = 'SWIGGY';
  else if (source.includes('ONLINE')) source = 'ONLINE';
  else {
    console.log(`[Outbound Webhook Skipped] Order ${orderData.order_id} source is ${source || 'DINE_IN'}. Skipping outbound sync.`);
    return {
      success: true,
      skipped: true,
      reason: 'Dine-In/Table order ignored for outbound webhook'
    };
  }

  // Strictly TWO outbound statuses: "IN_KITCHEN" and "READY_FOR_PICKUP"
  let mappedStatus: string | null = null;
  const sUpper = (orderData.status || '').toUpperCase();
  if (sUpper === 'PREPARING' || sUpper === 'IN_KITCHEN') {
    mappedStatus = 'IN_KITCHEN';
  } else if (sUpper === 'READY' || sUpper === 'READY_FOR_PICKUP') {
    mappedStatus = 'READY_FOR_PICKUP';
  } else {
    // Ignore DISPATCHED, DELIVERED, COMPLETED or others
    console.log(`[Outbound Webhook Skipped] Status ${orderData.status} is outside active trigger scope (IN_KITCHEN | READY_FOR_PICKUP).`);
    return {
      success: true,
      skipped: true,
      reason: `Status ${orderData.status} is not an outbound trigger`
    };
  }

  const targetUrl = process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL || 'https://api.petpooja.com/v1/orders/status_update';
  const restaurantId = process.env.PETPOOJA_RESTAURANT_ID || orderData.restaurant_id || 'REST_XTRA_01';
  const apiSecret = process.env.PETPOOJA_WEBHOOK_SECRET || 'vyoma_live_sec_882194ad7c10b';
  const posVersion = 'v2.19.4';
  const updatedAt = orderData.updated_at || new Date().toISOString();

  const payload = {
    order_id: orderData.order_id,
    restaurant_id: restaurantId,
    status: mappedStatus,
    updated_at: updatedAt,
    source
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
    'X-Petpooja-Signature': signature
  };

  console.log(`[Outbound Webhook] Dispatching status update for order ${orderData.order_id} -> ${mappedStatus} to ${targetUrl}`);

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

    const responseText = await response.text();
    let responseJson = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    return {
      success: response.ok,
      http_status: response.status,
      target_url: targetUrl,
      payload,
      response: responseJson
    };
  } catch (err: any) {
    console.warn(`[Outbound Webhook Warning] Could not reach ${targetUrl}:`, err.message);
    return {
      success: false,
      error: err.message,
      target_url: targetUrl,
      payload,
      fallback_logged: true
    };
  }
}

/**
 * POST /api/orders/update-status
 * Payload: { order_id, status, source, restaurant_id }
 */
router.post('/update-status', async (req: Request, res: Response) => {
  try {
    const { order_id, status, source, restaurant_id } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: order_id and status are mandatory'
      });
    }

    const webhookResult = await triggerOutboundWebhook({
      order_id: String(order_id),
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
