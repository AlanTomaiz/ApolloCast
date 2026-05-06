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
    if (!device?.host) {
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
      return true;
    } catch (error) {
      dispatch({
        type: 'CONNECTION_STATUS_SET',
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Falha ao conectar'
      });
      return false;
    }
  }, []);

  const disconnectFromDevice = React.useCallback(() => {
    window.render.disconnectDevice();
    dispatch({
      type: 'CONNECTION_STATUS_SET',
      status: 'disconnected'
    });
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
    dispatch({ type: 'DISCOVERY_STARTED' });

    try {
      window.render.startDiscovery((service: IService) => {
        const newDevice = {
          host: service.addresses[0],
          name: service.txt.fn,
          type: service.txt.md
        };

        dispatch({ type: 'DEVICE_FOUND', device: newDevice });
      });
    } catch (error) {
      dispatch({
        type: 'DISCOVERY_FAILED',
        reason:
          error instanceof Error ? error.message : 'Failed to start discovery'
      });
    }

    return () => {
      window.render.stopDiscovery();
      window.render.disconnectDevice();
      dispatch({ type: 'DISCOVERY_STOPPED' });
      dispatch({ type: 'CONNECTION_STATUS_SET', status: 'disconnected' });
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
