const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Window controls ──
  minimizeWindow: ()    => ipcRenderer.send('window-minimize'),
  maximizeWindow: ()    => ipcRenderer.send('window-maximize'),
  closeWindow:    ()    => ipcRenderer.send('window-close'),
  quitApp:        ()    => ipcRenderer.send('app-quit'),

  // ── App info ──
  getOverlayUrl:  ()    => ipcRenderer.invoke('get-overlay-url'),
  getAppVersion:  ()    => ipcRenderer.invoke('get-app-version'),
  isMaximized:    ()    => ipcRenderer.invoke('is-maximized'),
  openExternal:   (url) => ipcRenderer.invoke('open-external', url),

  // ── Platform detection ──
  isElectron: true,
  platform:   process.platform,
});
