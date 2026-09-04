import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhooks';
import ordersRouter from './routes/orders';
import authRouter from './routes/auth';
import customersRouter from './routes/customers';
import { whatsAppBot } from './whatsappBot';
import { generateReceiptPdfBuffer } from './pdfGenerator';

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

// API Authentication & Password Routes
app.use('/api/auth', authRouter);

// API Customers Database Routes
app.use('/api/customers', customersRouter);

// API Order Status Outbound & Management & Invoice Routes
app.use('/api/orders', ordersRouter);
app.use('/api/invoices', ordersRouter);

// ─────────────────────────────────────────────────────────────
// WhatsApp Bot Routes
// ─────────────────────────────────────────────────────────────

/** GET /api/whatsapp/status – returns current bot connection state */
app.get('/api/whatsapp/status', (_req, res) => {
  res.json({ success: true, data: whatsAppBot.getState() });
});

/** GET /api/whatsapp/qr – returns the QR code data URL for scanning */
app.get('/api/whatsapp/qr', (_req, res) => {
  const state = whatsAppBot.getState();
  if (state.status === 'qr_ready' && state.qrCodeDataUrl) {
    res.json({ success: true, qrCodeDataUrl: state.qrCodeDataUrl });
  } else if (state.status === 'connected') {
    res.json({ success: false, message: 'Bot is already connected. No QR needed.' });
  } else {
    res.json({ success: false, message: 'QR not ready yet. Bot may still be initializing.' });
  }
});

/**
 * POST /api/whatsapp/send-receipt
 * Body: { order: ReceiptData, phone?: string }
 * Generates a PDF receipt server-side and sends it as a WhatsApp document to the customer.
 */
app.post('/api/whatsapp/send-receipt', async (req, res) => {
  try {
    const { order, phone } = req.body as { order: any; phone?: string };

    if (!order) {
      return res.status(400).json({ success: false, message: 'Missing order data in request body' });
    }

    const targetPhone: string = phone || order.customer_phone || '';
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'No customer phone number provided' });
    }

    // Generate PDF buffer on server
    const pdfBuffer = generateReceiptPdfBuffer(order);
    const fileName = `Receipt_${order.token || String(order.id || '').slice(-4)}.pdf`;

    // Send via Baileys bot
    const result = await whatsAppBot.sendPDFDocument(
      targetPhone,
      pdfBuffer,
      fileName,
      `🧾 Your receipt from ${order.restaurant_name || 'Vyoma POS'} – Order ${order.token || ''}`
    );

    if (result.success) {
      return res.json({ success: true, message: result.message, jid: result.jid });
    } else {
      return res.status(503).json({ success: false, message: result.message });
    }
  } catch (err: any) {
    console.error('[WhatsApp Route] Error sending receipt:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Internal error' });
  }
});

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
