import express from 'express';
import path from 'path';
import fs from 'fs';
import { app } from './server/app';

function resolveDistPath(): string {
  // Production CJS bundle (dist/server.cjs) sits next to index.html
  if (typeof __dirname === 'string' && __dirname) {
    const candidates = [
      __dirname,
      path.join(__dirname, 'dist'),
      path.join(__dirname, '..', 'dist'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(path.join(candidate, 'index.html'))) {
        return candidate;
      }
    }
  }

  // Electron packaged app: resources/app/dist
  const cwd = process.cwd();
  const electronDist = path.join(cwd, 'resources', 'app', 'dist');
  if (fs.existsSync(path.join(electronDist, 'index.html'))) {
    return electronDist;
  }

  // Dev (tsx) / node dist/server.cjs run from project root
  return cwd.endsWith('dist') ? cwd : path.join(cwd, 'dist');
}

export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const PORT = Number(process.env.PORT) || 3000;
    const distPath = resolveDistPath();

    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.error(`[Vyoma] dist/index.html not found (looked in: ${distPath})`);
    }

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
        const retry = app.listen(0, '127.0.0.1', () => {
          const address = retry.address();
          const activePort = typeof address === 'object' && address ? address.port : 0;
          console.log(`Vyoma Express Server listening on http://127.0.0.1:${activePort} (fallback)`);
          resolve(activePort);
        });
        retry.on('error', reject);
      } else {
        reject(err);
      }
    });
  });
}

// Node-safe check that works in both dev (TSX/ESM) and built CommonJS (esbuild).
// When required from electron.cjs, argv[1] is Electron/electron.cjs — not server — so we do not auto-start.
const isMainScript =
  typeof process !== 'undefined' &&
  !!process.argv[1] &&
  (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.cjs'));

if (isMainScript) {
  startServer().catch((err) => console.error('Failed to start server:', err));
}
