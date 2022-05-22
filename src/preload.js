const { contextBridge, ipcRenderer } = require('electron');
const bonjour = require('bonjour');

contextBridge.exposeInMainWorld('render', {
  close: () => ipcRenderer.invoke('closeApp'),
  minimize: () => ipcRenderer.invoke('minimize'),
  scanner: (callback) => bonjour().find({ type: 'googlecast' }, callback),
});