const { app, BrowserWindow, shell, Menu } = require('electron');

// Built-in default — matches the Android/iOS apps. Override with OPENCHAT_URL env var.
const DEFAULT_SERVER_URL = 'https://lid-graduation-automotive-mere.trycloudflare.com';
const OPENCHAT_URL = process.env.OPENCHAT_URL || DEFAULT_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'OpenChat V2',
    backgroundColor: '#1e1f22',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Open external links in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(OPENCHAT_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  win.loadURL(OPENCHAT_URL);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

Menu.setApplicationMenu(null);
