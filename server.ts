import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app';
import { whatsAppBot } from './server/whatsappBot';

async function startServer() {
  const PORT = 3000;

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

  // Start WhatsApp bot after server is listening
  console.log('[WhatsApp Bot] Initializing Baileys connection...');
  whatsAppBot.init().catch((err) => {
    console.error('[WhatsApp Bot] Failed to initialize:', err);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Vyoma server:', err);
});
