import { processWebhookPayload } from '../../server/processWebhook';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function parseBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
  }

  // If req is a readable stream and body is not populated
  if (typeof req.on === 'function') {
    try {
      const chunks: any[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch {
      return {};
    }
  }

  return req.body || {};
}

export default async function handler(req: any, res: any) {
  try {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID, x-requested-with');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.status(200).json({
        success: '1',
        status: 'online',
        message: 'Vyoma Webhook Endpoint is active and ready for POST order payloads.',
        service: 'vyoma-pos-webhook',
        timestamp: new Date().toISOString()
      });
    }

    const body = await parseBody(req);

    const result = await processWebhookPayload(body, req.headers, {
      method: req.method || 'POST',
      path: '/api/webhooks/petpooja',
      ip: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress
    });

    return res.status(result.status || 200).json(result.data);
  } catch (err: any) {
    console.error('Serverless Webhook Handler Error:', err);
    return res.status(200).json({
      success: '1',
      status: 'success',
      message: 'Acknowledged with fallback',
      warning: err?.message
    });
  }
}
