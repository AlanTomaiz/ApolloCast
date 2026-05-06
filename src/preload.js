const { contextBridge, ipcRenderer } = require('electron');
const bonjour = require('bonjour');
const { Client } = require('castv2-client');
const { DefaultMediaReceiver } = require('castv2-client');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const bonjourInstance = bonjour();
let discoveryBrowser = null;
let activeCastClient = null;
let activeDeviceHost = null;
let activeMediaServer = null;
let activeMediaPlayer = null;

const MIME_BY_EXTENSION = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
};

const getMimeType = filePath => {
  const extension = path.extname(filePath || '').toLowerCase();
  return MIME_BY_EXTENSION[extension] || 'video/mp4';
};

const getLocalIpAddress = () => {
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceName of Object.keys(networkInterfaces)) {
    const interfaceAddresses = networkInterfaces[interfaceName] || [];

    for (const currentAddress of interfaceAddresses) {
      if (currentAddress.family === 'IPv4' && !currentAddress.internal) {
        return currentAddress.address;
      }
    }
  }

  return null;
};

const stopMediaServer = () => {
  if (activeMediaServer) {
    activeMediaServer.close();
    activeMediaServer = null;
    console.info('[Media] Servidor local de midia encerrado');
  }
};

const stopMediaPlayback = () => {
  if (activeMediaPlayer) {
    activeMediaPlayer.stop(() => {
      console.info('[Media] Player de transmissao interrompido');
    });
    activeMediaPlayer = null;
  }

  stopMediaServer();
};

const pauseMediaPlayback = () =>
  new Promise((resolve, reject) => {
    if (!activeMediaPlayer) {
      reject(new Error('Nenhum player ativo para pausar'));
      return;
    }

    activeMediaPlayer.pause((pauseError) => {
      if (pauseError) {
        reject(pauseError);
        return;
      }

      console.info('[Media] Transmissao pausada');
      resolve();
    });
  });

const resumeMediaPlayback = () =>
  new Promise((resolve, reject) => {
    if (!activeMediaPlayer) {
      reject(new Error('Nenhum player ativo para retomar'));
      return;
    }

    activeMediaPlayer.play((playError) => {
      if (playError) {
        reject(playError);
        return;
      }

      console.info('[Media] Transmissao retomada');
      resolve();
    });
  });

const getMediaPlaybackStatus = () =>
  new Promise((resolve, reject) => {
    if (!activeMediaPlayer) {
      resolve(null);
      return;
    }

    activeMediaPlayer.getStatus((statusError, status) => {
      if (statusError) {
        reject(statusError);
        return;
      }

      resolve({
        currentTime: Number(status?.currentTime || 0),
        duration: Number(status?.media?.duration || 0),
        playerState: status?.playerState || 'UNKNOWN'
      });
    });
  });

const seekMediaPlayback = (seconds) =>
  new Promise((resolve, reject) => {
    if (!activeMediaPlayer) {
      reject(new Error('Nenhum player ativo para avancar tempo'));
      return;
    }

    activeMediaPlayer.seek(seconds, (seekError) => {
      if (seekError) {
        reject(seekError);
        return;
      }

      console.info(`[Media] Posicao alterada para ${seconds}s`);
      resolve();
    });
  });

const getCastVolume = () =>
  new Promise((resolve, reject) => {
    if (!activeCastClient) {
      resolve(null);
      return;
    }

    activeCastClient.getVolume((volumeError, volumeInfo) => {
      if (volumeError) {
        reject(volumeError);
        return;
      }

      resolve(Number(volumeInfo?.level ?? 1));
    });
  });

const setCastVolume = (volumeLevel) =>
  new Promise((resolve, reject) => {
    if (!activeCastClient) {
      reject(new Error('Nenhuma conexao ativa para ajustar volume'));
      return;
    }

    const normalizedLevel = Math.max(0, Math.min(1, Number(volumeLevel)));

    activeCastClient.setVolume(
      { level: normalizedLevel, muted: normalizedLevel === 0 },
      (setVolumeError) => {
        if (setVolumeError) {
          reject(setVolumeError);
          return;
        }

        console.info(`[Media] Volume ajustado para ${normalizedLevel}`);
        resolve();
      }
    );
  });

const startMediaServer = filePath =>
  new Promise((resolve, reject) => {
    const localIpAddress = getLocalIpAddress();

    if (!localIpAddress) {
      reject(new Error('Nao foi possivel identificar IP local para transmitir'));
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        reject(new Error('Arquivo de video invalido para transmissao'));
        return;
      }

      const server = http.createServer((request, response) => {
        if (request.url !== '/video') {
          response.statusCode = 404;
          response.end('Not Found');
          return;
        }

        const range = request.headers.range;
        const contentType = getMimeType(filePath);

        if (!range) {
          response.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          });
          fs.createReadStream(filePath).pipe(response);
          return;
        }

        const bytesPrefix = 'bytes=';
        if (!range.startsWith(bytesPrefix)) {
          response.statusCode = 416;
          response.end();
          return;
        }

        const rangeParts = range.replace(bytesPrefix, '').split('-');
        const start = Number.parseInt(rangeParts[0], 10);
        const end = rangeParts[1]
          ? Number.parseInt(rangeParts[1], 10)
          : stats.size - 1;

        if (
          Number.isNaN(start) ||
          Number.isNaN(end) ||
          start < 0 ||
          end >= stats.size ||
          start > end
        ) {
          response.statusCode = 416;
          response.end();
          return;
        }

        response.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
        });

        fs.createReadStream(filePath, { start, end }).pipe(response);
      });

      server.on('error', (serverError) => {
        reject(serverError);
      });

      server.listen(0, () => {
        const address = server.address();

        if (!address || typeof address === 'string') {
          server.close();
          reject(new Error('Falha ao iniciar servidor local de midia'));
          return;
        }

        const mediaUrl = `http://${localIpAddress}:${address.port}/video`;
        activeMediaServer = server;
        console.info(`[Media] Servidor local iniciado em ${mediaUrl}`);
        resolve(mediaUrl);
      });
    });
  });

const startCastStreaming = async (filePath, fileName) => {
  console.info(
    `[Media] Solicitacao de transmissao recebida: ${fileName || filePath || 'arquivo-desconhecido'}`
  );

  if (!activeCastClient) {
    throw new Error('Nenhum dispositivo conectado para iniciar transmissao');
  }

  if (!filePath) {
    throw new Error('Arquivo de video e obrigatorio para transmissao');
  }

  stopMediaPlayback();

  const mediaUrl = await startMediaServer(filePath);
  const contentType = getMimeType(filePath);

  return new Promise((resolve, reject) => {
    activeCastClient.launch(DefaultMediaReceiver, (launchError, player) => {
      if (launchError) {
        stopMediaServer();
        reject(launchError);
        return;
      }

      const media = {
        contentId: mediaUrl,
        contentType,
        streamType: 'BUFFERED',
        metadata: {
          type: 0,
          metadataType: 0,
          title: fileName || path.basename(filePath),
        },
      };

      player.load(media, { autoplay: true }, (loadError) => {
        if (loadError) {
          stopMediaServer();
          reject(loadError);
          return;
        }

        activeMediaPlayer = player;
        console.info('[Media] Transmissao iniciada com sucesso');
        resolve();
      });
    });
  });
};

const disconnectCastSession = () => {
  console.info('[Cast] Solicitacao de desconexao recebida');

  if (!activeCastClient) {
    console.info('[Cast] Nenhuma sessao ativa para desconectar');
    activeDeviceHost = null;
    stopMediaPlayback();
    return;
  }

  stopMediaPlayback();
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
  startStreaming: (filePath, fileName) =>
    startCastStreaming(filePath, fileName),
  pauseStreaming: () => pauseMediaPlayback(),
  resumeStreaming: () => resumeMediaPlayback(),
  getStreamingStatus: () => getMediaPlaybackStatus(),
  seekStreaming: (seconds) => seekMediaPlayback(seconds),
  getStreamingVolume: () => getCastVolume(),
  setStreamingVolume: (volumeLevel) => setCastVolume(volumeLevel),
  stopStreaming: () => stopMediaPlayback(),
  connectDevice: host => connectCastSession(host),
  disconnectDevice: () => disconnectCastSession(),
});
