const { contextBridge, ipcRenderer } = require('electron');
const bonjour = require('bonjour');

const bonjourInstance = bonjour();
let discoveryBrowser = null;

const stopDiscovery = () => {
  if (discoveryBrowser) {
    discoveryBrowser.stop();
    discoveryBrowser = null;
  }
};

contextBridge.exposeInMainWorld('render', {
  close: () => ipcRenderer.invoke('closeApp'),
  minimize: () => ipcRenderer.invoke('minimize'),
  startDiscovery: callback => {
    stopDiscovery();
    discoveryBrowser = bonjourInstance.find({ type: 'googlecast' }, callback);
  },
  stopDiscovery,
  scanner: callback => {
    stopDiscovery();
    discoveryBrowser = bonjourInstance.find({ type: 'googlecast' }, callback);
  },
});
