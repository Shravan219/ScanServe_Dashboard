import express from 'express';
import path from 'path';
import { app } from './server/app';

export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const PORT = Number(process.env.PORT) || 3000;

    const cwd = process.cwd();
    const distPath = cwd.endsWith('dist')
      ? cwd
      : path.join(cwd, 'dist');

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

if (import.meta.url.endsWith('server.ts')) {
  startServer().catch((err) => console.error('Failed to start server:', err));
}
