import { registerSSEClient, unregisterSSEClient } from '../../server/orderStore';

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const send = (data: string) => {
    try {
      res.write(data);
    } catch {
      // client disconnected
    }
  };

  try {
    registerSSEClient(clientId, send);

    // Initial connected payload
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    // Periodic heartbeat every 15s to keep connection open through reverse proxies
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeatInterval);
        unregisterSSEClient(clientId);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      unregisterSSEClient(clientId);
    });
  } catch (err) {
    console.warn('[SSE Events Handler Warning]', err);
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'fallback', timestamp: new Date().toISOString() })}\n\n`);
  }
}
