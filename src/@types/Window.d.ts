/* eslint-disable no-unused-vars */
import { IService } from './Render';

type DiscoveryCallback = (service: IService) => void;

export interface SelectedVideoFile {
  path: string;
  name: string;
}

export interface StreamingStatus {
  currentTime: number;
  duration: number;
  playerState: string;
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
      startStreaming: (filePath: string, fileName?: string) => Promise<void>;
      pauseStreaming: () => Promise<void>;
      resumeStreaming: () => Promise<void>;
      getStreamingStatus: () => Promise<StreamingStatus | null>;
      seekStreaming: (seconds: number) => Promise<void>;
      stopStreaming: () => void;
      connectDevice: (host: string) => Promise<void>;
      disconnectDevice: () => void;
    };
  }
}
