const { app, BrowserWindow } = require('electron');

process.env.NODE_ENV = 'production';

// Import server initializer
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

    // Load the dynamic port passed by startServer()
    mainWindow.loadURL(`http://127.0.0.1:${port}`);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    try {
        // Wait for Express to start and retrieve active port
        const activePort = await startServer();
        createWindow(activePort);
    } catch (err) {
        console.error('Failed to launch application:', err);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});