import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import webhookRouter from './server/routes/webhooks';
import ordersRouter from './server/routes/orders';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware for JSON webhooks
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Webhook Routes for Petpooja / Deliverect / Zomato / Swiggy / Testers
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/webhook', webhookRouter);
  app.use('/api/petpooja', webhookRouter);
  app.use('/api/aggregator', webhookRouter);

  // API Order Status Outbound & Management Routes
  app.use('/api/orders', ordersRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vyoma Express Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Vyoma server:', err);
});
