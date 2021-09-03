import { Device, GenericData, Register } from './types';

export async function worker(answers: Register[]) {
  const device: Device = {} as Device;

  return new Promise<Device | undefined>((resolve, reject) => {
    answers.forEach(async ({ name, type, data }) => {
      // Get Host
      if (type === 'SRV') {
        const deviceId = name.replace('._googlecast._tcp.local', '');
        device.deviceId = deviceId;

        // @ts-expect-error Não consigo encontrar o type dessa desgraça
        device.host = data.target;
      }

      // Get friendlyName || deviceName
      if (type === 'TXT') {
        // Fix data
        const decodedData: GenericData = {};

        if (Array.isArray(data)) {
          data.forEach(buf => {
            const [key, value] = buf.toString().split('=');

            decodedData[key] = value;
          });
        }

        const friendlyName = decodedData.fn || decodedData.n;

        if (friendlyName) {
          device.friendlyName = friendlyName;
        }
      }
    });

    // Device found
    if (device.friendlyName) {
      resolve(device);
    }

    resolve(undefined);
  });
}
