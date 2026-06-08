const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowControl: (action) => ipcRenderer.send('window-control', action),
  openExternal: (url) => ipcRenderer.send('open-external', url)
});