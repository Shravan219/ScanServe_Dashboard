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

// API Webhook Routes for Petpooja / Deliverect / Dyno / Zomato / Swiggy / Testers
app.use('/api/webhooks', webhookRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/petpooja', webhookRouter);
app.use('/api/aggregator', webhookRouter);

// API Order Status Outbound & Management & Invoice Routes
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', ordersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
