const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'production';

// Resolve app root (resources/app) so relative paths and .env lookups work when
// the exe is launched from any working directory (e.g. Explorer double-click).
const appPath = app.getAppPath();
try {
  process.chdir(appPath);
} catch (_) {
  /* ignore */
}

// Import server initializer (bundles express + routes; serves dist/)
const { startServer } = require('./dist/server.cjs');

let mainWindow;

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Vyoma',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Intercept external links (WhatsApp, etc.) and open in the system browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const url = details.url;
    if (
      url.startsWith('https://wa.me') ||
      url.startsWith('https://api.whatsapp.com') ||
      url.startsWith('whatsapp:') ||
      (url.startsWith('http') &&
        !url.includes(`127.0.0.1:${port}`) &&
        !url.includes(`localhost:${port}`))
    ) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (
      url.startsWith('https://wa.me') ||
      url.startsWith('https://api.whatsapp.com') ||
      url.startsWith('whatsapp:') ||
      (url.startsWith('http') &&
        !url.includes(`127.0.0.1:${port}`) &&
        !url.includes(`localhost:${port}`))
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showLaunchError(err) {
  console.error('Failed to launch application:', err);
  try {
    const logPath = path.join(app.getPath('userData'), 'launch-error.log');
    fs.writeFileSync(logPath, String(err && err.stack ? err.stack : err), 'utf8');
  } catch (_) {
    /* ignore */
  }
}

app.whenReady().then(async () => {
  try {
    const activePort = await startServer();
    // Expose port for external-link filtering / debugging
    process.env.VYOMA_PORT = String(activePort);
    createWindow(activePort);
  } catch (err) {
    showLaunchError(err);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
