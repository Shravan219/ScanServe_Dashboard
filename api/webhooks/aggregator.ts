import { processWebhookPayload } from '../../server/processWebhook';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: "0",
      message: `Method ${req.method} Not Allowed. Please use POST for webhook endpoints.`
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // keep string
      }
    }

    const result = await processWebhookPayload(body);
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Vercel Webhook Error:', err);
    return res.status(500).json({
      success: "0",
      message: err?.message || 'Internal server error'
    });
  }
}
