import { Answer } from 'dns-packet';

export type Register = Answer;

export type GenericData = {
  [key: string]: string;
};

export type Device = {
  deviceId: string;
  friendlyName: string;
  host: string;
};

export type Devices = {
  [key: string | number]: Device;
};

export interface ClientEvents {
  device: (device: Device) => void;
}

export interface DeviceEvents {
  status: (status: any) => void;
  error: (message: string) => void;
  connect: () => void;
  connected: () => void;
  desconnect: () => void;
}

export type noop = () => void;

type Subtitles = {
  path: 'string';
  name: 'string';
  language: 'string';
};

export type EntryPlay = {
  path: string;
  title: string;
  background?: string;
  subtitles?: Subtitles[];
  subtitlesStyle?: GenericData;
};
