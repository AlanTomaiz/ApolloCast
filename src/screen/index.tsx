import React from 'react';
import { FiCast, FiPlayCircle, FiPlusCircle, FiSquare } from 'react-icons/fi';
import { useRender } from '../services/Context';
import Header from './Header';
import ListDevices from './List';

const Screen: React.FC = () => {
  const { state, selectVideoFile, startStreaming, stopStreaming } = useRender();
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

  const handleStartStreaming = React.useCallback(async () => {
    await startStreaming();
  }, [startStreaming]);

  const handleStopStreaming = React.useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

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

          <button
            type="button"
            className="streamBTN"
            onClick={isStreaming ? handleStopStreaming : handleStartStreaming}
            disabled={!isConnected || !hasMediaSelected || isStartingStream}
            title={
              isStreaming
                ? 'Parar transmissao'
                : 'Iniciar transmissao do video selecionado'
            }
          >
            {isStreaming ? <FiSquare /> : <FiPlayCircle />}
            {isStreaming ? 'Parar transmissão' : 'Transmitir vídeo'}
          </button>

          <div className="media-selection-info">
            {state.media.fileName
              ? `Arquivo selecionado: ${state.media.fileName}`
              : 'Nenhum arquivo selecionado'}
          </div>

          <div className="media-status-info">
            {state.media.status === 'playing' && 'Status: transmitindo'}
            {state.media.status === 'loading' &&
              'Status: iniciando transmissao...'}
            {state.media.status === 'stopped' &&
              hasMediaSelected &&
              'Status: pronto para transmitir'}
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
