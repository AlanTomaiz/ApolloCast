import React from 'react';
import { BsCast } from 'react-icons/bs';
import { getDeviceId } from '../../renderer/state/castReducer';
import { useRender } from '../../services/Context';

interface IProps {
  onClose: () => void;
}

const ListDevices: React.FC<IProps> = ({ onClose }) => {
  const {
    chromecasts,
    chromecast,
    connectToDevice,
    disconnectFromDevice,
    restartDiscovery,
    state
  } = useRender();

  const handleSelectDevice = React.useCallback(
    async (deviceIndex: number) => {
      const targetDevice = chromecasts[deviceIndex];

      if (!targetDevice) {
        return;
      }

      const hasConnected = await connectToDevice(targetDevice);
      if (hasConnected) {
        onClose();
      }
    },
    [chromecasts, connectToDevice, onClose]
  );

  const handleDisconnect = React.useCallback(() => {
    disconnectFromDevice();
  }, [disconnectFromDevice]);

  const handleRetryConnection = React.useCallback(async () => {
    if (!chromecast) {
      restartDiscovery();
      return;
    }

    const hasConnected = await connectToDevice(chromecast);
    if (hasConnected) {
      onClose();
    }
  }, [chromecast, connectToDevice, onClose, restartDiscovery]);

  const handleRetryDiscovery = React.useCallback(() => {
    restartDiscovery();
  }, [restartDiscovery]);

  const selectedDeviceId = chromecast ? getDeviceId(chromecast) : null;

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <button type="button" className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <button type="button" className="modal-close" onClick={onClose}>
          Fechar
        </button>
        <div className="modal-title">Transmitir para:</div>
        <div className="modal-content">
          {state.connection.status === 'failed' && state.connection.reason && (
            <div className="modal-feedback-card modal-feedback-error">
              <p className="modal-error">{state.connection.reason}</p>
              <div className="modal-feedback-actions">
                <button type="button" onClick={handleRetryConnection}>
                  Tentar novamente
                </button>
                <button type="button" onClick={handleRetryDiscovery}>
                  Buscar novamente
                </button>
              </div>
            </div>
          )}

          {/* {state.connection.status === 'connected' && chromecast && (
            <div className="modal-connected-actions">
              <span>Conectado: {chromecast.name || chromecast.host}</span>
              <button type="button" onClick={handleDisconnect}>
                Desconectar
              </button>
            </div>
          )} */}

          {state.discovery.status === 'scanning' &&
            chromecasts.length === 0 && (
              <p className="modal-empty">Buscando dispositivos...</p>
            )}

          {state.discovery.status !== 'scanning' &&
            chromecasts.length === 0 && (
              <div className="modal-feedback-card">
                <p className="modal-empty">Nenhum dispositivo encontrado.</p>
                <div className="modal-feedback-actions">
                  <button type="button" onClick={handleRetryDiscovery}>
                    Buscar novamente
                  </button>
                </div>
              </div>
            )}

          {chromecasts.length > 0 && (
            <ul>
              {chromecasts.map((device, index) => {
                const deviceId = getDeviceId(device);
                const isSelected = selectedDeviceId === deviceId;

                return (
                  <li key={deviceId}>
                    <button
                      type="button"
                      className="device-item"
                      data-selected={isSelected}
                      disabled={state.connection.status === 'connecting'}
                      onClick={() => handleSelectDevice(index)}
                    >
                      <BsCast />
                      <span>{device.name || device.host}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListDevices);
