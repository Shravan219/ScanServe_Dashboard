import { app } from '../server/app';

export default function handler(req: any, res: any) {
  return app(req, res, (err?: any) => {
    if (err) {
      console.error('[Vercel Express Error]:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          status: 'error',
          message: err?.message || 'Internal Server Error'
        });
      }
      return;
    }
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        status: 'not_found',
        message: `Endpoint ${req.url || req.path} not found`
      });
    }
  });
}
