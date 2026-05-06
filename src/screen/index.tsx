import React from 'react';
import { FiCast, FiPlusCircle } from 'react-icons/fi';
import LoadingOverlay from '../components/LoadingOverlay';
import Player from '../components/Player';
import { useRender } from '../services/Context';
import Header from './Header';
import ListDevices from './List';

const Screen: React.FC = () => {
  const { state, selectVideoFile } = useRender();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const isConnected = state.connection.status === 'connected';
  const hasMediaSelected = Boolean(state.media.filePath);
  const isStreaming = state.media.status === 'playing';
  const isStartingStream = state.media.status === 'loading';

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
          <LoadingOverlay active={isStartingStream}>
            <div className="background" />

            <button
              type="button"
              className="cast-conn"
              data-connected={isConnected}
              onClick={openModal}
            >
              <FiCast size={25} />
            </button>

            {!hasMediaSelected && !isStreaming && (
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
                Selecionar vídeo
              </button>
            )}

            {hasMediaSelected && !isStartingStream && <Player />}
          </LoadingOverlay>
        </div>
      </div>

      {isModalOpen && <ListDevices onClose={closeModal} />}
    </>
  );
};

export default Screen;
