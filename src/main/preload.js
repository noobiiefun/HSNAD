const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // App info
  getOverlayUrl: () => ipcRenderer.invoke('get-overlay-url'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Platform detection
  isElectron: true,
});
