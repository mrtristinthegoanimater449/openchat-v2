const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// Desktop loads the web app bundled inside the installer (file://). The app
// then talks to any OpenChat server the user configures (first-run setup
// screen). A default is provided for convenience.
const DEFAULT_SERVER_URL = 'https://lid-graduation-automotive-mere.trycloudflare.com';
const DEFAULT_SERVER = (process.env.OPENCHAT_URL || DEFAULT_SERVER_URL).trim().replace(/\/+$/, '');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'OpenChat V2',
    backgroundColor: '#1e1f22',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // External links go to the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the bundled web app. Pass desktop=1 + a convenient default server URL;
  // the app stores it only if the user hasn't configured one already.
  const indexFile = path.join(__dirname, '..', 'dist', 'index.html');
  win.loadFile(indexFile, {
    query: {
      desktop: '1',
      server: DEFAULT_SERVER,
    },
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

Menu.setApplicationMenu(null);
