import { processWebhookPayload } from '../../server/processWebhook';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: '1',
      status: 'online',
      message: 'Vyoma Aggregator Webhook Endpoint is active and ready for POST order payloads.'
    });
  }

  try {
    const result = await processWebhookPayload(req.body, req.headers, {
      method: req.method,
      path: '/api/webhooks/aggregator'
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Serverless Webhook Handler Error:', err);
    return res.status(500).json({
      success: '0',
      status: 'error',
      message: err?.message || 'Internal error processing webhook'
    });
  }
}
