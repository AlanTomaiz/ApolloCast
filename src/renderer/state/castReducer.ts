import { IDevice } from '../../@types/Render';

export type DiscoveryStatus = 'idle' | 'scanning' | 'stopped' | 'failed';
export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'failed';
export type MediaStatus =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'failed';

export interface CastDiscoveryState {
  status: DiscoveryStatus;
  devices: IDevice[];
  reason: string | null;
}

export interface CastConnectionState {
  status: ConnectionStatus;
  deviceId: string | null;
  reason: string | null;
}

export interface CastMediaState {
  status: MediaStatus;
  filePath: string | null;
  fileName: string | null;
  reason: string | null;
}

export interface CastState {
  discovery: CastDiscoveryState;
  connection: CastConnectionState;
  media: CastMediaState;
}

export type CastAction =
  | { type: 'DISCOVERY_STARTED' }
  | { type: 'DISCOVERY_RESET' }
  | { type: 'DISCOVERY_STOPPED' }
  | { type: 'DISCOVERY_FAILED'; reason: string }
  | { type: 'DEVICE_FOUND'; device: IDevice }
  | { type: 'DEVICE_SELECTED'; deviceId: string }
  | { type: 'CONNECTION_STATUS_SET'; status: ConnectionStatus; reason?: string }
  | { type: 'MEDIA_SELECTED'; filePath: string; fileName: string }
  | { type: 'MEDIA_CLEARED' }
  | { type: 'MEDIA_STATUS_SET'; status: MediaStatus; reason?: string };

export const getDeviceId = (device: IDevice): string =>
  `${device.host}-${device.name}-${device.type}`;

export const initialCastState: CastState = {
  discovery: {
    status: 'idle',
    devices: [],
    reason: null
  },
  connection: {
    status: 'idle',
    deviceId: null,
    reason: null
  },
  media: {
    status: 'idle',
    filePath: null,
    fileName: null,
    reason: null
  }
};

export const castReducer = (
  state: CastState,
  action: CastAction
): CastState => {
  switch (action.type) {
    case 'DISCOVERY_STARTED':
      return {
        ...state,
        discovery: {
          ...state.discovery,
          status: 'scanning',
          reason: null
        }
      };

    case 'DISCOVERY_RESET':
      return {
        ...state,
        discovery: {
          status: 'idle',
          devices: [],
          reason: null
        }
      };

    case 'DISCOVERY_STOPPED':
      return {
        ...state,
        discovery: {
          ...state.discovery,
          status: 'stopped',
          reason: null
        }
      };

    case 'DISCOVERY_FAILED':
      return {
        ...state,
        discovery: {
          ...state.discovery,
          status: 'failed',
          reason: action.reason
        }
      };

    case 'DEVICE_FOUND': {
      const newDeviceId = getDeviceId(action.device);
      const alreadyExists = state.discovery.devices.some(
        (currentDevice) => getDeviceId(currentDevice) === newDeviceId
      );

      if (alreadyExists) {
        return state;
      }

      return {
        ...state,
        discovery: {
          ...state.discovery,
          devices: [...state.discovery.devices, action.device]
        }
      };
    }

    case 'DEVICE_SELECTED':
      return {
        ...state,
        connection: {
          ...state.connection,
          deviceId: action.deviceId
        }
      };

    case 'CONNECTION_STATUS_SET':
      return {
        ...state,
        connection: {
          ...state.connection,
          status: action.status,
          reason: action.reason ?? null
        }
      };

    case 'MEDIA_SELECTED':
      return {
        ...state,
        media: {
          ...state.media,
          filePath: action.filePath,
          fileName: action.fileName,
          reason: null
        }
      };

    case 'MEDIA_CLEARED':
      return {
        ...state,
        media: {
          ...state.media,
          status: 'idle',
          filePath: null,
          fileName: null,
          reason: null
        }
      };

    case 'MEDIA_STATUS_SET':
      return {
        ...state,
        media: {
          ...state.media,
          status: action.status,
          reason: action.reason ?? null
        }
      };

    default:
      return state;
  }
};
