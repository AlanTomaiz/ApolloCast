/* eslint-disable react/jsx-no-constructed-context-values */
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
  setConnectionStatus: (status: ConnectionStatus, reason?: string) => void;
  setMediaSelection: (filePath: string, fileName: string) => void;
  clearMediaSelection: () => void;
  setMediaStatus: (status: MediaStatus, reason?: string) => void;
}

const APIContext = React.createContext<IContext>({} as IContext);

const APIProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = React.useReducer(castReducer, initialCastState);

  const chromecasts = state.discovery.devices;
  const chromecast = React.useMemo(
    () =>
      chromecasts.find(
      currentDevice =>
          getDeviceId(currentDevice) === state.connection.deviceId,
    ),
    [chromecasts, state.connection.deviceId],
  );

  const setDevice = React.useCallback((device: IDevice) => {
    dispatch({ type: 'DEVICE_SELECTED', deviceId: getDeviceId(device) });
  }, []);

  const setConnectionStatus = React.useCallback(
    (status: ConnectionStatus, reason?: string) => {
      dispatch({ type: 'CONNECTION_STATUS_SET', status, reason });
    },
    [],
  );

  const setMediaSelection = React.useCallback(
    (filePath: string, fileName: string) => {
      dispatch({ type: 'MEDIA_SELECTED', filePath, fileName });
    },
    [],
  );

  const clearMediaSelection = React.useCallback(() => {
    dispatch({ type: 'MEDIA_CLEARED' });
  }, []);

  const setMediaStatus = React.useCallback(
    (status: MediaStatus, reason?: string) => {
      dispatch({ type: 'MEDIA_STATUS_SET', status, reason });
    },
    [],
  );

  React.useEffect(() => {
    dispatch({ type: 'DISCOVERY_STARTED' });

    window.render.scanner((service: IService) => {
      const newDevice = {
        host: service.addresses[0],
        name: service.txt.fn,
        type: service.txt.md,
      };

      dispatch({ type: 'DEVICE_FOUND', device: newDevice });
    });
  }, []);

  return (
    <APIContext.Provider
      value={{
        state,
        chromecasts,
        chromecast,
        setDevice,
        setConnectionStatus,
        setMediaSelection,
        clearMediaSelection,
        setMediaStatus,
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
