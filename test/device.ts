import DeviceCast from '../src/lib/device';

const resource = {
  path: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
  title: 'Big Bug Bunny',
  background:
    'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
};

const device = new DeviceCast({
  friendlyName: 'Sala de estar',
  deviceId: 'Chromecast-6b759060959453c50d1bde400cefd92f',
  host: '6b759060-9594-53c5-0d1b-de400cefd92f.local',
});

// device.on('status', status => console.log('status front', status));

device.play(resource, () => {
  setTimeout(() => {
    device.resume();

    setTimeout(() => {
      device.pause();

      setTimeout(() => {
        device.resume();

        setTimeout(() => {
          device.stop();
        }, 5000);
      }, 5000);
    }, 5000);
  }, 8000);
});
