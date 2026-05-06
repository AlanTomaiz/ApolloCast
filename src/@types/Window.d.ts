/* eslint-disable no-unused-vars */
import { IService } from './Render';

type DiscoveryCallback = (service: IService) => void;

declare global {
  interface Window {
    render: {
      close: () => void;
      minimize: () => void;
      startDiscovery: (callback: DiscoveryCallback) => void;
      stopDiscovery: () => void;
      scanner: (callback: DiscoveryCallback) => void;
      connectDevice: (host: string) => Promise<void>;
      disconnectDevice: () => void;
    };
  }
}
