const { contextBridge, ipcRenderer } = require('electron');
const bonjour = require('bonjour');
const { Client } = require('castv2-client');

const bonjourInstance = bonjour();
let discoveryBrowser = null;
let activeCastClient = null;
let activeDeviceHost = null;

const disconnectCastSession = () => {
  if (!activeCastClient) {
    activeDeviceHost = null;
    return;
  }

  activeCastClient.close();
  activeCastClient = null;
  activeDeviceHost = null;
};

const connectCastSession = host =>
  new Promise((resolve, reject) => {
    if (!host) {
      reject(new Error('Device host is required'));
      return;
    }

    if (activeCastClient && activeDeviceHost === host) {
      resolve();
      return;
    }

    disconnectCastSession();

    const client = new Client();
    const connectTimeout = setTimeout(() => {
      client.close();
      reject(new Error('Connection timeout'));
    }, 7000);

    client.on('error', error => {
      clearTimeout(connectTimeout);
      client.close();
      if (activeCastClient === client) {
        activeCastClient = null;
        activeDeviceHost = null;
      }
      reject(error);
    });

    client.connect(host, () => {
      clearTimeout(connectTimeout);
      activeCastClient = client;
      activeDeviceHost = host;
      resolve();
    });
  });

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
  connectDevice: host => connectCastSession(host),
  disconnectDevice: () => disconnectCastSession(),
});
