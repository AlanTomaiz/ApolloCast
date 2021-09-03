/* eslint class-methods-use-this: "off" */
import { TypedEmitter } from 'tiny-typed-emitter';
import chalk from 'chalk';

import { cast } from '../service/mdns';
import { worker } from '../utils/worker';
import { ClientEvents, Devices } from '../utils/types';

export default class Client extends TypedEmitter<ClientEvents> {
  private devices: Devices;

  constructor() {
    super();

    this.devices = {};
  }

  start() {
    cast.on('response', async response => {
      const data = response.answers.concat(response.additionals);
      const device = await worker(data);

      if (device && !this.devices[device.deviceId]) {
        console.log(chalk.green(`New device found ${device.deviceId}`));

        this.devices[device.deviceId] = device;
        this.emit('device', device);
      }
    });

    cast.query('_googlecast._tcp.local', 'PTR');
  }
}
