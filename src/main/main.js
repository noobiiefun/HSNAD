const {
  app, BrowserWindow, ipcMain,
  Tray, Menu, nativeImage, shell, dialog,
} = require('electron');
const path = require('path');
const http = require('http');

const isDev        = process.env.NODE_ENV === 'development';
const OVERLAY_PORT = 5174;

let serverInstance = null;
let mainWindow     = null;
let splashWindow   = null;
let tray           = null;

// ── Single Instance Lock ──────────────────────────────────────────────────────
// Pastikan hanya ada 1 instance app berjalan
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Jika user buka lagi, fokus ke window yang sudah ada
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── Path Helpers ──────────────────────────────────────────────────────────────
function assetPath(...parts) {
  return isDev
    ? path.join(__dirname, '../../build-assets', ...parts)
    : path.join(process.resourcesPath, 'build-assets', ...parts);
}

function overlayPath(...parts) {
  return isDev
    ? path.join(__dirname, '../../overlay', ...parts)
    : path.join(process.resourcesPath, 'overlay', ...parts);
}

function soundPath(...parts) {
  return isDev
    ? path.join(__dirname, '../../public/sounds', ...parts)
    : path.join(process.resourcesPath, 'sounds', ...parts);
}

// ── Port Availability Check ───────────────────────────────────────────────────
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port, '127.0.0.1');
  });
}

// ── Splash Screen ─────────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width:       520,
    height:      340,
    frame:       false,
    transparent: true,
    resizable:   false,
    alwaysOnTop: true,
    center:      true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
    },
    icon: assetPath('icon.png'),
  });

  // Splash HTML ada di src/main/splash.html — dipackage bersama main.js
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => { splashWindow = null; });
}

// ── Main Window ───────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        1024,
    minHeight:       680,
    frame:           false,
    show:            false,
    backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
      webSecurity:      true,
    },
    icon: assetPath('icon.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load dari React build
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // Splash minimal 2.5 detik, lalu tutup dan tampilkan main
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
      }
      mainWindow.show();
      mainWindow.focus();
    }, isDev ? 1000 : 2500);
  });

  // Minimize to tray saat close button
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  // Handle navigasi external link
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── System Tray ───────────────────────────────────────────────────────────────
function createTray() {
  let icon;
  try {
    icon = nativeImage.createFromPath(assetPath('tray-icon.png'));
    // Windows: resize ke 16x16 untuk tray
    if (process.platform === 'win32') {
      icon = icon.resize({ width: 16, height: 16 });
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('HSNAD — Hey Streamer Notice Alert Donation');

  const buildMenu = () => Menu.buildFromTemplate([
    { label: 'HSNAD v1.0.0',              enabled: false },
    { label: 'HEY Streamer Notice Alert Donation', enabled: false },
    { type: 'separator' },
    {
      label: '📺  Buka Dashboard',
      click: () => { mainWindow.show(); mainWindow.focus(); },
    },
    {
      label: '🔗  Buka Overlay URL',
      click: () => shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay`),
    },
    {
      label: '📋  Copy Overlay URL',
      click: () => {
        const { clipboard } = require('electron');
        clipboard.writeText(`http://localhost:${OVERLAY_PORT}/overlay`);
      },
    },
    { type: 'separator' },
    {
      label: '❌  Keluar dari HSNAD',
      click: () => {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(buildMenu());
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── IPC Handlers ──────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.restore() : mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.hide());

ipcMain.handle('get-overlay-url',   ()       => `http://localhost:${OVERLAY_PORT}/overlay`);
ipcMain.handle('get-app-version',   ()       => app.getVersion());
ipcMain.handle('open-external',     (_, url) => shell.openExternal(url));
ipcMain.handle('is-maximized',      ()       => mainWindow?.isMaximized() ?? false);

// Quit dari renderer
ipcMain.on('app-quit', () => app.exit(0));

// ── Server Start ──────────────────────────────────────────────────────────────
async function startServer() {
  // Cek apakah port sudah dipakai
  const portFree = await checkPort(OVERLAY_PORT);
  if (!portFree) {
    console.warn(`[Main] Port ${OVERLAY_PORT} sudah dipakai, mungkin ada instance lain.`);
    // Port tidak free tapi kita sudah punya single instance lock
    // Berarti ini restart — coba langsung pakai
  }

  try {
    const { startExpressServer } = require('../server/index');
    serverInstance = await startExpressServer(OVERLAY_PORT);
    console.log(`[Main] HSNAD Server berjalan di http://localhost:${OVERLAY_PORT}`);
  } catch (err) {
    console.error('[Main] Gagal start server:', err);
    // Tampilkan error dialog hanya di production
    if (!isDev) {
      dialog.showErrorBox(
        'HSNAD — Gagal Start',
        `Server tidak bisa dijalankan di port ${OVERLAY_PORT}.\n\nError: ${err.message}\n\nCoba restart aplikasi.`
      );
    }
  }
}

// ── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Set app user model id untuk Windows (taskbar grouping)
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.noobiiefun.hsnad');
  }

  createSplash();
  await startServer();
  createWindow();
  createTray();
});

app.on('window-all-closed', (e) => {
  // Jangan quit — app hidup di tray
  e.preventDefault();
});

app.on('before-quit', () => {
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('[Main] Server closed.');
    });
  }
});

// Handle unhandled exceptions di main process
process.on('uncaughtException', (err) => {
  console.error('[Main] Uncaught Exception:', err);
});
