import React from 'react';
import { IDevice, IService } from '../../@types/Render';
import { SelectedVideoFile, StreamingStatus } from '../../@types/Window';
import {
  castReducer,
  CastState,
  ConnectionStatus,
  getDeviceId,
  initialCastState,
  MediaStatus
} from '../../renderer/state/castReducer';

interface IContext {
  state: CastState;
  chromecast: IDevice | undefined;
  chromecasts: IDevice[];
  setDevice: (device: IDevice) => void;
  connectToDevice: (device: IDevice) => Promise<boolean>;
  disconnectFromDevice: () => void;
  selectVideoFile: () => Promise<boolean>;
  startStreaming: () => Promise<boolean>;
  pauseStreaming: () => Promise<boolean>;
  resumeStreaming: () => Promise<boolean>;
  getStreamingStatus: () => Promise<StreamingStatus | null>;
  seekStreaming: (seconds: number) => Promise<boolean>;
  stopStreaming: () => void;
  setConnectionStatus: (status: ConnectionStatus, reason?: string) => void;
  setMediaSelection: (filePath: string, fileName: string) => void;
  clearMediaSelection: () => void;
  setMediaStatus: (status: MediaStatus, reason?: string) => void;
}

const APIContext = React.createContext<IContext>({} as IContext);

const toPtBrConnectionError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Falha ao conectar ao dispositivo';
  }

  const rawMessage = error.message || '';
  const normalizedMessage = rawMessage.toLowerCase();

  if (
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('tempo limite')
  ) {
    return 'Tempo limite de conexao excedido';
  }

  if (normalizedMessage.includes('host')) {
    return 'Host do dispositivo e obrigatorio';
  }

  return 'Falha ao conectar ao dispositivo';
};

const toPtBrVideoPickerError = (): string =>
  'Falha ao selecionar arquivo de video';

const toPtBrStreamingError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Falha ao iniciar transmissao';
  }

  const normalizedMessage = (error.message || '').toLowerCase();

  if (normalizedMessage.includes('conectado')) {
    return 'Conecte em um dispositivo para iniciar transmissao';
  }

  if (normalizedMessage.includes('arquivo')) {
    return 'Selecione um arquivo de video antes de transmitir';
  }

  if (normalizedMessage.includes('ip local')) {
    return 'Falha ao identificar IP local para transmitir';
  }

  return 'Falha ao iniciar transmissao';
};

const toPtBrPlaybackControlError = (action: 'pause' | 'resume'): string => {
  if (action === 'pause') {
    return 'Falha ao pausar transmissao';
  }

  return 'Falha ao retomar transmissao';
};

const APIProvider: React.FC<React.PropsWithChildren<object>> = ({
  children
}) => {
  const [state, dispatch] = React.useReducer(castReducer, initialCastState);

  const chromecasts = state.discovery.devices;
  const chromecast = React.useMemo(
    () =>
      chromecasts.find(
        (currentDevice) =>
          getDeviceId(currentDevice) === state.connection.deviceId
      ),
    [chromecasts, state.connection.deviceId]
  );

  const setDevice = React.useCallback((device: IDevice) => {
    dispatch({ type: 'DEVICE_SELECTED', deviceId: getDeviceId(device) });
  }, []);

  const connectToDevice = React.useCallback(async (device: IDevice) => {
    console.info(
      `[Cast] Fluxo de conexao iniciado para dispositivo: ${device?.name || 'desconhecido'} (${device?.host || 'desconhecido'})`
    );

    if (!device?.host) {
      console.warn(
        '[Cast] Dispositivo invalido para tentativa de conexao',
        device
      );
      dispatch({
        type: 'CONNECTION_STATUS_SET',
        status: 'failed',
        reason: 'Dispositivo invalido para conexao'
      });
      return false;
    }

    dispatch({ type: 'DEVICE_SELECTED', deviceId: getDeviceId(device) });
    dispatch({ type: 'CONNECTION_STATUS_SET', status: 'connecting' });

    try {
      await window.render.connectDevice(device.host);
      dispatch({ type: 'CONNECTION_STATUS_SET', status: 'connected' });
      console.info(`[Cast] Conectado ao host do dispositivo: ${device.host}`);
      return true;
    } catch (error) {
      console.error('[Cast] Falha na conexao', error);
      dispatch({
        type: 'CONNECTION_STATUS_SET',
        status: 'failed',
        reason: toPtBrConnectionError(error)
      });
      return false;
    }
  }, []);

  const disconnectFromDevice = React.useCallback(() => {
    console.info('[Cast] Fluxo de desconexao iniciado');
    window.render.disconnectDevice();
    dispatch({
      type: 'CONNECTION_STATUS_SET',
      status: 'disconnected'
    });
    console.info('[Cast] Fluxo de desconexao finalizado');
  }, []);

  const selectVideoFile = React.useCallback(async () => {
    console.info('[Media] Fluxo de selecao de video iniciado');

    try {
      const selectedFile: SelectedVideoFile | null =
        await window.render.pickVideoFile();

      if (!selectedFile) {
        console.info('[Media] Selecao de video cancelada pelo usuario');
        return false;
      }

      dispatch({
        type: 'MEDIA_SELECTED',
        filePath: selectedFile.path,
        fileName: selectedFile.name
      });

      if (state.connection.status !== 'connected') {
        dispatch({ type: 'MEDIA_STATUS_SET', status: 'stopped' });
        console.info(`[Media] Video selecionado: ${selectedFile.name}`);
        return true;
      }

      dispatch({ type: 'MEDIA_STATUS_SET', status: 'loading' });

      await window.render.startStreaming(selectedFile.path, selectedFile.name);
      dispatch({ type: 'MEDIA_STATUS_SET', status: 'playing' });
      console.info(
        `[Media] Video selecionado e transmissao iniciada: ${selectedFile.name}`
      );
      return true;
    } catch (error) {
      console.error('[Media] Falha ao selecionar video', error);
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason:
          error instanceof Error &&
          error.message.toLowerCase().includes('transmiss')
            ? toPtBrStreamingError(error)
            : toPtBrVideoPickerError()
      });
      return false;
    }
  }, [state.connection.status]);

  const startStreaming = React.useCallback(async () => {
    if (state.connection.status !== 'connected') {
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: 'Conecte em um dispositivo para iniciar transmissao'
      });
      return false;
    }

    if (!state.media.filePath) {
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: 'Selecione um arquivo de video antes de transmitir'
      });
      return false;
    }

    dispatch({ type: 'MEDIA_STATUS_SET', status: 'loading' });

    try {
      await window.render.startStreaming(
        state.media.filePath,
        state.media.fileName || undefined
      );
      dispatch({ type: 'MEDIA_STATUS_SET', status: 'playing' });
      console.info('[Media] Transmissao em execucao');
      return true;
    } catch (error) {
      console.error('[Media] Falha ao iniciar transmissao', error);
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: toPtBrStreamingError(error)
      });
      return false;
    }
  }, [state.connection.status, state.media.fileName, state.media.filePath]);

  const stopStreaming = React.useCallback(() => {
    window.render.stopStreaming();
    dispatch({ type: 'MEDIA_STATUS_SET', status: 'stopped' });
    console.info('[Media] Transmissao interrompida');
  }, []);

  const getStreamingStatus = React.useCallback(async () => {
    try {
      return await window.render.getStreamingStatus();
    } catch (error) {
      console.error('[Media] Falha ao consultar status de reproducao', error);
      return null;
    }
  }, []);

  const seekStreaming = React.useCallback(
    async (seconds: number) => {
      if (state.connection.status !== 'connected') {
        dispatch({
          type: 'MEDIA_STATUS_SET',
          status: 'failed',
          reason: 'Conecte em um dispositivo para avancar video'
        });
        return false;
      }

      try {
        await window.render.seekStreaming(seconds);
        return true;
      } catch (error) {
        console.error('[Media] Falha ao alterar tempo da transmissao', error);
        dispatch({
          type: 'MEDIA_STATUS_SET',
          status: 'failed',
          reason: 'Falha ao alterar tempo da transmissao'
        });
        return false;
      }
    },
    [state.connection.status]
  );

  const pauseStreaming = React.useCallback(async () => {
    if (state.connection.status !== 'connected') {
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: 'Conecte em um dispositivo para pausar transmissao'
      });
      return false;
    }

    try {
      await window.render.pauseStreaming();
      dispatch({ type: 'MEDIA_STATUS_SET', status: 'paused' });
      return true;
    } catch (error) {
      console.error('[Media] Falha ao pausar transmissao', error);
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: toPtBrPlaybackControlError('pause')
      });
      return false;
    }
  }, [state.connection.status]);

  const resumeStreaming = React.useCallback(async () => {
    if (state.connection.status !== 'connected') {
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: 'Conecte em um dispositivo para retomar transmissao'
      });
      return false;
    }

    try {
      await window.render.resumeStreaming();
      dispatch({ type: 'MEDIA_STATUS_SET', status: 'playing' });
      return true;
    } catch (error) {
      console.error('[Media] Falha ao retomar transmissao', error);
      dispatch({
        type: 'MEDIA_STATUS_SET',
        status: 'failed',
        reason: toPtBrPlaybackControlError('resume')
      });
      return false;
    }
  }, [state.connection.status]);

  const setConnectionStatus = React.useCallback(
    (status: ConnectionStatus, reason?: string) => {
      dispatch({ type: 'CONNECTION_STATUS_SET', status, reason });
    },
    []
  );

  const setMediaSelection = React.useCallback(
    (filePath: string, fileName: string) => {
      dispatch({ type: 'MEDIA_SELECTED', filePath, fileName });
    },
    []
  );

  const clearMediaSelection = React.useCallback(() => {
    dispatch({ type: 'MEDIA_CLEARED' });
  }, []);

  const setMediaStatus = React.useCallback(
    (status: MediaStatus, reason?: string) => {
      dispatch({ type: 'MEDIA_STATUS_SET', status, reason });
    },
    []
  );

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapDiscovery = async () => {
      dispatch({ type: 'DISCOVERY_STARTED' });
      console.info('[Discovery] Bootstrap iniciado');

      try {
        await window.render.waitForMainWindowLoaded();

        if (!isMounted) {
          return;
        }

        console.info(
          '[Discovery] Janela principal totalmente carregada, iniciando scan'
        );

        window.render.startDiscovery((service: IService) => {
          const host = service.addresses?.[0];
          const name = service.txt?.fn;
          const type = service.txt?.md;

          if (!host || !name || !type) {
            console.warn(
              '[Discovery] Ignorando payload de servico malformado',
              service
            );
            return;
          }

          dispatch({
            type: 'DEVICE_FOUND',
            device: {
              host,
              name,
              type
            }
          });
        });
      } catch (error) {
        console.error('[Discovery] Falha ao iniciar discovery', error);
        dispatch({
          type: 'DISCOVERY_FAILED',
          reason:
            error instanceof Error
              ? 'Falha ao iniciar discovery'
              : 'Falha ao iniciar discovery'
        });
      }
    };

    bootstrapDiscovery();

    return () => {
      isMounted = false;
      console.info('[Discovery] Cleanup iniciado');
      window.render.stopDiscovery();
      window.render.stopStreaming();
      window.render.disconnectDevice();
      dispatch({ type: 'DISCOVERY_STOPPED' });
      dispatch({ type: 'CONNECTION_STATUS_SET', status: 'disconnected' });
      console.info('[Discovery] Cleanup finalizado');
    };
  }, []);

  return (
    <APIContext.Provider
      value={{
        state,
        chromecasts,
        chromecast,
        setDevice,
        connectToDevice,
        disconnectFromDevice,
        selectVideoFile,
        startStreaming,
        pauseStreaming,
        resumeStreaming,
        getStreamingStatus,
        seekStreaming,
        stopStreaming,
        setConnectionStatus,
        setMediaSelection,
        clearMediaSelection,
        setMediaStatus
      }}
    >
      {children}
    </APIContext.Provider>
  );
};

const useRender = () => {
  const context = React.useContext(APIContext);
  return context;
};

export { APIProvider, useRender };
