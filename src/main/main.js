const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let serverInstance = null;
let mainWindow = null;
let splashWindow = null;
let tray = null;

const OVERLAY_PORT = 5174;

// ─── Helper path icon ────────────────────────────────────────────────────────
function assetPath(filename) {
  return isDev
    ? path.join(__dirname, '../../build-assets', filename)
    : path.join(process.resourcesPath, 'build-assets', filename);
}

// ─── Splash Screen ───────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 520,
    height: 340,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    icon: assetPath('icon.png'),
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ─── Main Window ─────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    frame: false,
    show: false,             // hidden sampai siap
    backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: assetPath('icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // Tutup splash, tampilkan main window
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
      mainWindow.show();
      mainWindow.focus();
      if (isDev) mainWindow.webContents.openDevTools();
    }, 2800); // tunggu splash minimal 2.8 detik
  });

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

// ─── System Tray ─────────────────────────────────────────────────────────────
function createTray() {
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(assetPath('tray-icon.png'));
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('HSNAD — Hey Streamer');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'HSNAD — Hey Streamer', enabled: false },
    { label: 'Notice Alert Donation', enabled: false },
    { type: 'separator' },
    {
      label: '📺 Open Dashboard',
      click: () => { mainWindow.show(); mainWindow.focus(); },
    },
    {
      label: '🔗 Open Overlay URL',
      click: () => shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay`),
    },
    { type: 'separator' },
    { label: '❌ Quit HSNAD', click: () => app.exit(0) },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.restore() : mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.hide());

ipcMain.handle('get-overlay-url', () => `http://localhost:${OVERLAY_PORT}/overlay`);
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

// ─── Server ───────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    const { startExpressServer } = require('../server/index');
    serverInstance = await startExpressServer(OVERLAY_PORT);
    console.log(`[Main] Server started on port ${OVERLAY_PORT}`);
  } catch (err) {
    console.error('[Main] Failed to start server:', err);
  }
}

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createSplash();
  await startServer();
  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => e.preventDefault());
app.on('before-quit', () => serverInstance?.close());
