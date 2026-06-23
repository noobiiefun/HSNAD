const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Import server
let serverInstance = null;
let mainWindow = null;
let tray = null;

const DASHBOARD_PORT = 5173;
const OVERLAY_PORT = 5174;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    frame: false,         // custom titlebar
    backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../build-assets/icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.on('close', (e) => {
    // Minimize to tray instead of closing
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const iconPath = isDev
    ? path.join(__dirname, '../../build-assets/tray-icon.png')
    : path.join(process.resourcesPath, 'build-assets/tray-icon.png');

  // Fallback jika icon belum ada
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hey Streamer — Notice Alert Donation',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '📺 Open Dashboard',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      },
    },
    {
      label: '🔗 Open Overlay URL',
      click: () => {
        shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay`);
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit',
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setToolTip('Hey Streamer');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

async function startServer() {
  try {
    const { startExpressServer } = require('../server/index');
    serverInstance = await startExpressServer(OVERLAY_PORT);
    console.log(`[Main] Server started on port ${OVERLAY_PORT}`);
  } catch (err) {
    console.error('[Main] Failed to start server:', err);
  }
}

// IPC handlers
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.restore();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.hide());

ipcMain.handle('get-overlay-url', () => {
  return `http://localhost:${OVERLAY_PORT}/overlay`;
});

ipcMain.handle('open-external', (_, url) => {
  shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(async () => {
  await startServer();
  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => {
  // Prevent quitting — app lives in tray
  e.preventDefault();
});

app.on('before-quit', () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
