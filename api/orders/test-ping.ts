import { triggerOutboundWebhook } from '../../server/outboundWebhook';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    const { target_url, order_id, status, source } = body || {};

    const testOrderId = order_id || `TEST_PING_${Math.floor(1000 + Math.random() * 9000)}`;
    const testStatus = status || 'IN_KITCHEN';
    const testSource = source || 'SWIGGY';

    const result = await triggerOutboundWebhook({
      order_id: testOrderId,
      token: testOrderId,
      status: testStatus,
      source: testSource,
      custom_target_url: target_url
    });

    return res.status(200).json({
      success: result.success,
      message: result.success
        ? `Successfully delivered test update to tester (${result.http_status})`
        : `Failed to deliver test update to tester: ${result.error || 'HTTP ' + result.http_status}`,
      details: result
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      message: err.message || 'Test ping failed',
      fallback: true
    });
  }
}
