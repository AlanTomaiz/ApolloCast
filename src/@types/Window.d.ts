/* eslint-disable no-unused-vars */
import { IService } from './Render';

type DiscoveryCallback = (service: IService) => void;

export interface SelectedVideoFile {
  path: string;
  name: string;
}

declare global {
  interface Window {
    render: {
      close: () => void;
      minimize: () => void;
      waitForMainWindowLoaded: () => Promise<boolean>;
      startDiscovery: (callback: DiscoveryCallback) => void;
      stopDiscovery: () => void;
      scanner: (callback: DiscoveryCallback) => void;
      pickVideoFile: () => Promise<SelectedVideoFile | null>;
      connectDevice: (host: string) => Promise<void>;
      disconnectDevice: () => void;
    };
  }
}
