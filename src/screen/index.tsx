import React from 'react';
import { FiCast, FiPlusCircle } from 'react-icons/fi';
import { useRender } from '../services/Context';
import Header from './Header';
import ListDevices from './List';

const Screen: React.FC = () => {
  const { state, selectVideoFile } = useRender();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const isConnected = state.connection.status === 'connected';

  const openModal = React.useCallback(() => setIsModalOpen(true), []);
  const closeModal = React.useCallback(() => setIsModalOpen(false), []);

  const handleSelectVideoFile = React.useCallback(async () => {
    await selectVideoFile();
  }, [selectVideoFile]);

  return (
    <>
      <div className="container">
        <Header />
        <div className="content">
          <div className="background" />
          <button
            type="button"
            className="cast-conn"
            data-connected={isConnected}
            onClick={openModal}
          >
            <FiCast size={25} />
          </button>

          <button
            type="button"
            className="videoBTN"
            onClick={handleSelectVideoFile}
            disabled={!isConnected}
            title={
              isConnected
                ? 'Selecionar arquivo de video'
                : 'Conecte em um dispositivo para selecionar video'
            }
          >
            <FiPlusCircle />
            Selecione vídeo
          </button>

          <div className="media-selection-info">
            {state.media.fileName
              ? `Arquivo selecionado: ${state.media.fileName}`
              : 'Nenhum arquivo selecionado'}
          </div>

          {state.media.status === 'failed' && state.media.reason && (
            <div className="media-selection-error">{state.media.reason}</div>
          )}
        </div>
      </div>

      {isModalOpen && <ListDevices onClose={closeModal} />}
    </>
  );
};

export default Screen;
