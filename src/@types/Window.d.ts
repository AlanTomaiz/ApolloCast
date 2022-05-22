/* eslint-disable no-unused-vars */
import { IpcRenderer } from 'electron';
import Device from './Render';

declare global {
  interface Window {
    render: {
      close: () => void;
      minimize: () => void;
      scanner: (device: object) => void;
    };
  }
}
