import React from 'react';
import { BsCast } from 'react-icons/bs';
import { getDeviceId } from '../../renderer/state/castReducer';
import { useRender } from '../../services/Context';


interface IProps {
  onClose: () => void;
}

const ListDevices: React.FC<IProps> = ({ onClose }) => {
  const { chromecasts, chromecast, setDevice, state } = useRender();

  const handleSelectDevice = React.useCallback(
    (deviceIndex: number) => {
      const targetDevice = chromecasts[deviceIndex];

      if (!targetDevice) {
        return;
      }

      setDevice(targetDevice);
      onClose();
    },
    [chromecasts, onClose, setDevice],
  );

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
          {state.discovery.status === 'scanning' && chromecasts.length === 0 && (
            <p className="modal-empty">Buscando dispositivos...</p>
          )}

          {state.discovery.status !== 'scanning' && chromecasts.length === 0 && (
            <p className="modal-empty">Nenhum dispositivo encontrado.</p>
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
