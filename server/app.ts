import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhooks';
import ordersRouter from './routes/orders';

dotenv.config();

export const app = express();

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Source, X-Restaurant-ID, x-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// API Webhook Routes for Dyno API & Aggregators
app.use('/api/webhooks', webhookRouter);
app.use('/api/webhook', webhookRouter);

// API Order Status Outbound & Management & Invoice Routes
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', ordersRouter);

// Health check endpoints
app.get(['/api', '/api/', '/api/health'], (req, res) => {
  res.json({
    success: true,
    status: 'online',
    message: 'Vyoma POS API & Webhook Service is active',
    timestamp: new Date().toISOString()
  });
});

// Fallback 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    status: 'not_found',
    message: `API Endpoint ${req.originalUrl || req.url || req.path} not found`
  });
});

// Global error handler for uncaught exceptions in route handlers
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Vyoma API Error]:', err);

  // Catch malformed JSON body-parser syntax errors and return Dyno API 200 error array
  if (err instanceof SyntaxError || err?.type === 'entity.parse.failed') {
    return res.status(200).json([
      {
        status: 400,
        orderId: 'INVALID_JSON',
        message: 'Malformed payload sanitized'
      }
    ]);
  }

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: err?.message || 'Internal server error'
    });
  }
});
