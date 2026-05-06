import React from 'react';
import { IDevice, IService } from '../../@types/Render';
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
