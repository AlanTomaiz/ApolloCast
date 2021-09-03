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
