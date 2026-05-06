import React from 'react';
import { FiPause, FiPlay, FiVolume2, FiX } from 'react-icons/fi';
import { useRender } from '../../services/Context';
import {
  ResolvedMediaMetadata,
  resolveMediaMetadata
} from '../../services/Metadata';
import './index.css';

const Player: React.FC = () => {
  const {
    state,
    chromecast,
    startStreaming,
    stopStreaming,
    clearMediaSelection
  } = useRender();

  const [volume, setVolume] = React.useState(100);
  const [metadata, setMetadata] = React.useState<ResolvedMediaMetadata | null>(
    null
  );
  const isConnected = state.connection.status === 'connected';
  const hasMediaSelected = Boolean(state.media.filePath);
  const isStreaming = state.media.status === 'playing';
  const isStartingStream = state.media.status === 'loading';

  const handleStartStreaming = React.useCallback(async () => {
    await startStreaming();
  }, [startStreaming]);

  const handleStopStreaming = React.useCallback(() => {
    stopStreaming();
  }, [stopStreaming]);

  const handlePlayPause = React.useCallback(async () => {
    if (isStreaming) {
      handleStopStreaming();
      return;
    }

    await handleStartStreaming();
  }, [handleStartStreaming, handleStopStreaming, isStreaming]);

  const handleClosePlayer = React.useCallback(() => {
    if (isStreaming || isStartingStream) {
      stopStreaming();
    }

    clearMediaSelection();
  }, [clearMediaSelection, isStartingStream, isStreaming, stopStreaming]);

  React.useEffect(() => {
    let isMounted = true;

    const loadMetadata = async () => {
      if (!state.media.fileName) {
        setMetadata(null);
        return;
      }

      const result = await resolveMediaMetadata(state.media.fileName);

      if (isMounted) {
        setMetadata(result);
      }
    };

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [state.media.fileName]);

  const mediaTitle = metadata?.title || 'Sem titulo';
  const mediaSubtitle = metadata?.kind === 'series' ? metadata.subtitle : null;

  return (
    <>
      <div className="player-box">
        <div className="player-panel-top">
          <button
            type="button"
            className="player-close-btn"
            onClick={handleClosePlayer}
          >
            <FiX size={28} />
          </button>

          {metadata?.imageUrl && (
            <img
              className="player-poster"
              src={metadata.imageUrl}
              alt={mediaTitle}
            />
          )}

          <div className="player-video-meta">
            <h2>{mediaTitle}</h2>
            {mediaSubtitle && <p>{mediaSubtitle}</p>}
            <strong>
              Playing on {chromecast?.name || 'Nenhum dispositivo'}
            </strong>
          </div>
        </div>

        <div className="player-panel-bottom">
          <div className="player-time-row">
            <span>4:52</span>
            <div className="player-time-track">
              <div className="player-time-progress" />
              <div className="player-time-thumb" />
            </div>
            <span>55:15</span>
          </div>

          <div className="player-controls-row">
            <div className="player-left-controls">
              <button
                type="button"
                className="player-main-btn"
                onClick={handlePlayPause}
                disabled={!isConnected || !hasMediaSelected || isStartingStream}
              >
                {isStreaming ? <FiPause size={31} /> : <FiPlay size={31} />}
              </button>
            </div>

            <div className="player-right-controls">
              <div className="player-volume-wrap">
                <FiVolume2 size={20} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.media.status === 'failed' && state.media.reason && (
        <div className="media-selection-error player-feedback-error">
          {state.media.reason}
        </div>
      )}
    </>
  );
};

export default React.memo(Player);
