const EventEmitter = require('events');
const chalk = require('chalk');
const Client = require('castv2-client').Client;
const MediaReceiver = require('./MediaReceiver');

class DeviceCast extends EventEmitter {
  constructor(device) {
    super();

    this.device = device;
    this.client = undefined;
  }

  async play(Entry, callback) {
    try {
      await this._connect();
      await this._playMedia(Entry);

      callback();
    } catch (err) {
      //
    }
  }

  pause() {
    if (!this.player) {
      return undefined;
    }

    this.player.pause();
    this.emit('paused');
  }

  resume() {
    if (!this.player) {
      return undefined;
    }

    this.player.play();
    this.emit('recume');
  }

  stop() {
    if (!this.player) {
      return undefined;
    }

    this.client.stop(this.player, () => {
      this.player.stop();
      this.emit('stoped');

      this.client = undefined;
    });
  }

  _connect() {
    return new Promise((resolve, reject) => {
      if (this.client) {
        this.client.close();
        this.client = undefined;
      }

      this.client = new Client();

      this.client.on('error', (err) => {
        this.emit('error', 'Não foi possível conectar a este dispositivo.');

        this.client.close();
        this.client = undefined;
        reject(undefined);
      });

      this.client.connect(this.device.host, () => {
        this.emit('connected');
        resolve();
      });
    })
  }

  _launch(app, callback) {
    if (!this.client) {
      return undefined;
    }

    console.log(chalk.green(`Launching app...`));

    this.client.getSessions((error, sessions) => {
      if (error) {
        this.emit('error', 'Erro ao executar player de vídeo.');
        return callback('error');
      }

      const filtered = sessions.filter((session) => session.appId === app.APP_ID);
      const session = filtered.shift();

      if (session) {
        this.client.join(session, app, callback)
      }

      if (!session) {
        this.client.launch(app, callback);
      }
    });
  }

  _playMedia(media) {
    return new Promise((resolve, reject) => {
      this._launch(MediaReceiver, (err, player) => {
        if (err) {
          console.log(chalk.red(`Launching error: ${err}`));

          reject();
        }

        this.player = player;

        this.player.on('status', (status) => {
          this.emit('status', status);

          // emit 'finished'
          if (status.playerState === 'IDLE' && status.idleReason === 'FINISHED') {
            this.emit('finished');
            this.stop();
          }
        });

        this.player.load(media, (err, status) => {
          if (err) {
            console.log(chalk.red(`Launching error: ${err}`));

            reject();
          }

          const { playerState, volume, media } = status;
          const { duration } = media;

          console.log(chalk.green(`Started vídeo.`));
          resolve();
        });
      });
    });
  }
}

module.exports = DeviceCast;