import { Router, Request, Response } from 'express';
import { processWebhookPayload } from '../processWebhook';
import { getInboundLogs, clearInboundLogs } from '../orderStore';
import dynoHandler from './dynoHandler';

const router = Router();

// Apply CORS headers on all webhook routes
router.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Source, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

/**
 * GET /api/webhooks (Root Health Check Endpoint)
 */
router.get(['/', ''], (req: Request, res: Response) => {
  return res.status(200).json({
    success: '1',
    status: 'online',
    message: 'Vyoma Webhook API Service is ACTIVE and ready to receive POST order payloads.',
    endpoint: req.originalUrl || '/api/webhooks',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET & POST /api/webhooks/dyno and /api/webhooks/receiver
 */
router.all(['/dyno', '/receiver'], async (req: Request, res: Response) => {
  try {
    return await dynoHandler(req, res);
  } catch (err: any) {
    console.error('[Dyno Route Exception]:', err);
    return res.status(500).json([
      {
        status: 500,
        orderId: 'ERROR',
        message: err?.message || 'Internal server exception in Dyno route'
      }
    ]);
  }
});

/**
 * GET /api/webhooks/logs and GET /api/webhooks/inbound-logs
 */
router.get(['/logs', '/inbound-logs'], (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      logs: getInboundLogs()
    });
  } catch (err: any) {
    console.error('Error fetching inbound logs:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error fetching logs' });
  }
});

/**
 * DELETE /api/webhooks/logs
 */
router.delete('/logs', (req: Request, res: Response) => {
  try {
    clearInboundLogs();
    return res.status(200).json({
      success: true,
      message: 'Inbound webhook logs cleared'
    });
  } catch (err: any) {
    console.error('Error clearing inbound logs:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error clearing logs' });
  }
});

/**
 * POST /api/webhooks/simulate
 */
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const result = await processWebhookPayload(req.body, req.headers, {
      method: 'POST',
      path: '/api/webhooks/simulate',
      ip: req.ip || req.socket?.remoteAddress
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    return res.status(500).json({
      success: '0',
      status: 'error',
      message: err?.message || 'Error simulating order'
    });
  }
});

/**
 * Universal Webhook Handler for Petpooja, Deliverect, Zomato, Swiggy, etc.
 */
const universalWebhookHandler = async (req: Request, res: Response) => {
  if (req.method === 'GET') {
    return res.status(200).json({
      success: '1',
      status: 'online',
      message: 'Vyoma Webhook Endpoint is ACTIVE and ready to receive POST order payloads.',
      endpoint: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const result = await processWebhookPayload(req.body, req.headers, {
      method: req.method,
      path: req.originalUrl || req.path,
      ip: req.ip || req.socket?.remoteAddress
    });
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Express Webhook Handler Error:', err);
    return res.status(500).json({
      success: '0',
      status: 'error',
      message: err?.message || 'Internal server error processing webhook'
    });
  }
};

router.all([
  '/petpooja',
  '/aggregator',
  '/zomato',
  '/swiggy',
  '/deliverect',
  '/order',
  '/orders',
  '/saveorder',
  '/push',
  '*'
], universalWebhookHandler);

export default router;
