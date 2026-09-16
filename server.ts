import express from 'express';
import path from 'path';
<<<<<<< HEAD
import { app } from './server/app';

export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const PORT = Number(process.env.PORT) || 3000;

    const distPath = __dirname.endsWith('dist')
      ? __dirname
      : path.join(process.cwd(), 'dist');

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    const server = app.listen(PORT, '127.0.0.1', () => {
      const address = server.address();
      const activePort = typeof address === 'object' && address ? address.port : Number(PORT);
      console.log(`Vyoma Express Server listening on http://127.0.0.1:${activePort}`);
      resolve(activePort);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(0, '127.0.0.1');
      } else {
        reject(err);
      }
    });
  });
}

if (require.main === module) {
  startServer().catch((err) => console.error('Failed to start server:', err));
}
=======
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
>>>>>>> c2b00bfb2046f03570804654f6f6b7bac088ac65
