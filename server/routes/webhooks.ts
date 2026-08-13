import { Router, Request, Response } from 'express';
import { processWebhookPayload } from '../processWebhook';

const router = Router();

/**
 * Express router handler for Cloud Run / Express Server environment
 */
router.post(['/petpooja', '/aggregator'], async (req: Request, res: Response) => {
  try {
    const result = await processWebhookPayload(req.body);
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Express Webhook Route Error:', err);
    return res.status(500).json({
      success: "0",
      message: err?.message || 'Internal server error processing webhook'
    });
  }
});

export default router;
