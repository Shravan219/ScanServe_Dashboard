export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const defaultOutboundUrl =
    process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL ||
    process.env.TESTER_CALLBACK_URL ||
    'https://vyomapos-t.vercel.app/api/webhooks/receiver';

  const defaultRestId =
    process.env.PETPOOJA_REST_ID ||
    process.env.PETPOOJA_RESTAURANT_ID ||
    'REST_XTRA_01';

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }
      const { outbound_webhook_url, restaurant_id } = body || {};

      return res.status(200).json({
        success: true,
        message: 'Webhook config updated successfully',
        outbound_webhook_url: outbound_webhook_url || defaultOutboundUrl,
        restaurant_id: restaurant_id || defaultRestId
      });
    } catch (e: any) {
      return res.status(200).json({
        success: true,
        outbound_webhook_url: defaultOutboundUrl,
        restaurant_id: defaultRestId
      });
    }
  }

  return res.status(200).json({
    success: true,
    outbound_webhook_url: defaultOutboundUrl,
    restaurant_id: defaultRestId,
    env_configured: !!process.env.PETPOOJA_OUTBOUND_WEBHOOK_URL
  });
}
