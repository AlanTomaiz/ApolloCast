const { contextBridge, ipcRenderer } = require('electron');
const bonjour = require('bonjour');
const { Client } = require('castv2-client');

const bonjourInstance = bonjour();
let discoveryBrowser = null;
let activeCastClient = null;
let activeDeviceHost = null;

const disconnectCastSession = () => {
  console.info('[Cast] Solicitacao de desconexao recebida');

  if (!activeCastClient) {
    console.info('[Cast] Nenhuma sessao ativa para desconectar');
    activeDeviceHost = null;
    return;
  }

  activeCastClient.close();
  activeCastClient = null;
  activeDeviceHost = null;

  console.info('[Cast] Sessao desconectada');
};

const connectCastSession = host =>
  new Promise((resolve, reject) => {
    console.info(
      `[Cast] Solicitacao de conexao para host: ${host || 'desconhecido'}`
    );

    if (!host) {
      reject(new Error('Host do dispositivo e obrigatorio'));
      return;
    }

    if (activeCastClient && activeDeviceHost === host) {
      console.info('[Cast] Reutilizando sessao cast existente');
      resolve();
      return;
    }

    disconnectCastSession();

    const client = new Client();
    const connectTimeout = setTimeout(() => {
      client.close();
      console.error(`[Cast] Tempo limite de conexao excedido para host ${host}`);
      reject(new Error('Tempo limite de conexao excedido'));
    }, 7000);

    client.on('error', error => {
      clearTimeout(connectTimeout);
      client.close();
      if (activeCastClient === client) {
        activeCastClient = null;
        activeDeviceHost = null;
      }
      console.error(`[Cast] Erro de conexao para host ${host}:`, error);
      reject(error);
    });

    client.connect(host, () => {
      clearTimeout(connectTimeout);
      activeCastClient = client;
      activeDeviceHost = host;
      console.info(`[Cast] Conectado ao host ${host}`);
      resolve();
    });
  });

const stopDiscovery = () => {
  console.info('[Discovery] Solicitacao de parada recebida');

  if (discoveryBrowser) {
    discoveryBrowser.stop();
    discoveryBrowser = null;
    console.info('[Discovery] Scanner interrompido');
    return;
  }

  console.info('[Discovery] Scanner ja estava interrompido');
};

const startDiscovery = callback => {
  console.info('[Discovery] Solicitacao de inicio recebida');
  stopDiscovery();

  discoveryBrowser = bonjourInstance.find({ type: 'googlecast' }, service => {
    const host = service?.addresses?.[0] || 'unknown';
    const name = service?.txt?.fn || 'unknown';
    console.info(`[Discovery] Dispositivo encontrado: ${name} (${host})`);
    callback(service);
  });

  console.info('[Discovery] Scanner iniciado');
};

contextBridge.exposeInMainWorld('render', {
  close: () => ipcRenderer.invoke('closeApp'),
  minimize: () => ipcRenderer.invoke('minimize'),
  waitForMainWindowLoaded: () => ipcRenderer.invoke('waitForMainWindowLoaded'),
  startDiscovery,
  stopDiscovery,
  scanner: callback => {
    console.info(
      '[Discovery] scanner() esta depreciado, usando fluxo startDiscovery'
    );
    startDiscovery(callback);
  },
  pickVideoFile: () => ipcRenderer.invoke('pickVideoFile'),
  connectDevice: host => connectCastSession(host),
  disconnectDevice: () => disconnectCastSession(),
});
