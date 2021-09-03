import { TypedEmitter } from 'tiny-typed-emitter';

import { Device, DeviceEvents, EntryPlay, noop } from '../../utils/types';

export default class DeviceCast extends TypedEmitter<DeviceEvents> {
  constructor(device: Device): void;

  play(Entry: EntryPlay, fn: noop): void;

  pause(): void;

  resume(): void;

  stop(): void;
}
