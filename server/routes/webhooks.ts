import { Router, Request, Response } from 'express';
import { processWebhookPayload } from '../processWebhook';
import { getInboundLogs, clearInboundLogs } from '../orderStore';
import dynoHandler from './dynoHandler';

const router = Router();

/**
 * GET /api/webhooks/logs
 * Returns live inbound webhook inspection logs
 */
router.get('/logs', (req: Request, res: Response) => {
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

router.get('/inbound-logs', (req: Request, res: Response) => {
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
 * Clears inbound webhook logs
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
 * Direct Dyno API webhook route
 */
router.all('/dyno', async (req: Request, res: Response) => {
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
 * POST /api/webhooks/simulate
 * Simulates an order directly from UI / testing
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
 * Universal Webhook Handler for Petpooja, Deliverect, Zomato, Swiggy, and generic testers.
 * Catches all common paths (/petpooja, /aggregator, /zomato, /swiggy, /orders, /saveorder, /, etc.)
 */
const webhookHandler = async (req: Request, res: Response) => {
  // If GET request, return health / ping confirmation
  if (req.method === 'GET') {
    return res.json({
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

// Mount universal handler on all specific routes & wildcard
router.all([
  '/',
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
], webhookHandler);

export default router;
