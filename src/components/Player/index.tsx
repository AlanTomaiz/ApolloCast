import React from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import { FiVolume2, FiX } from 'react-icons/fi';
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
    selectVideoFile,
    startStreaming,
    pauseStreaming,
    resumeStreaming,
    getStreamingStatus,
    seekStreaming,
    getStreamingVolume,
    setStreamingVolume,
    stopStreaming,
    clearMediaSelection
  } = useRender();

  const [volume, setVolume] = React.useState(100);
  const [metadata, setMetadata] = React.useState<ResolvedMediaMetadata | null>(
    null
  );
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isSeeking, setIsSeeking] = React.useState(false);
  const [previewSeekTime, setPreviewSeekTime] = React.useState(0);
  const isConnected = state.connection.status === 'connected';
  const hasMediaSelected = Boolean(state.media.filePath);
  const isStreaming = state.media.status === 'playing';
  const isPaused = state.media.status === 'paused';
  const isStartingStream = state.media.status === 'loading';

  const handleStartStreaming = React.useCallback(async () => {
    await startStreaming();
  }, [startStreaming]);

  const handlePauseStreaming = React.useCallback(async () => {
    await pauseStreaming();
  }, [pauseStreaming]);

  const handleResumeStreaming = React.useCallback(async () => {
    await resumeStreaming();
  }, [resumeStreaming]);

  const handlePlayPause = React.useCallback(async () => {
    if (isStreaming) {
      await handlePauseStreaming();
      return;
    }

    if (isPaused) {
      await handleResumeStreaming();
      return;
    }

    await handleStartStreaming();
  }, [
    handlePauseStreaming,
    handleResumeStreaming,
    handleStartStreaming,
    isPaused,
    isStreaming
  ]);

  const handleClosePlayer = React.useCallback(() => {
    if (isStreaming || isStartingStream) {
      stopStreaming();
    }

    clearMediaSelection();
  }, [
    clearMediaSelection,
    isPaused,
    isStartingStream,
    isStreaming,
    stopStreaming
  ]);

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

  React.useEffect(() => {
    const root = document.documentElement;

    if (metadata?.imageUrl) {
      root.style.setProperty(
        '--dynamic-bg-image',
        `url("${metadata.imageUrl}")`
      );
      return;
    }

    root.style.removeProperty('--dynamic-bg-image');
  }, [metadata?.imageUrl]);

  React.useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('--dynamic-bg-image');
    };
  }, []);

  const mediaTitle = metadata?.title || 'Sem titulo';
  const mediaSubtitle = metadata?.kind === 'series' ? metadata.subtitle : null;

  const displayCurrentTime = isSeeking ? previewSeekTime : currentTime;
  const progressPercent =
    duration > 0 ? Math.min((displayCurrentTime / duration) * 100, 100) : 0;
  const volumePercent = Math.max(0, Math.min(volume, 100));
  const blueFill = '#5e73e8';
  const blueTrack = 'rgba(71, 88, 186, 0.28)';

  const formatTime = React.useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(
        remainingSeconds
      ).padStart(2, '0')}`;
    }

    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  }, []);

  const syncPlaybackStatus = React.useCallback(async () => {
    const playbackStatus = await getStreamingStatus();

    if (!playbackStatus) {
      if (!hasMediaSelected) {
        setCurrentTime(0);
        setDuration(0);
      }
      return;
    }

    setCurrentTime(playbackStatus.currentTime || 0);
    setDuration(playbackStatus.duration || 0);
  }, [getStreamingStatus, hasMediaSelected]);

  React.useEffect(() => {
    if (!hasMediaSelected || isSeeking) {
      return undefined;
    }

    syncPlaybackStatus();
    const timer = window.setInterval(syncPlaybackStatus, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasMediaSelected, isSeeking, syncPlaybackStatus]);

  React.useEffect(() => {
    if (!isConnected) {
      return undefined;
    }

    let cancelled = false;

    const syncVolume = async () => {
      const currentVolume = await getStreamingVolume();

      if (!cancelled && currentVolume !== null) {
        setVolume(Math.round(currentVolume * 100));
      }
    };

    syncVolume();

    return () => {
      cancelled = true;
    };
  }, [getStreamingVolume, isConnected]);

  const handleProgressChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsSeeking(true);
      setPreviewSeekTime(Number(event.target.value));
    },
    []
  );

  const commitSeek = React.useCallback(
    async (event: React.SyntheticEvent<HTMLInputElement>) => {
      const nextTime = Number(event.currentTarget.value);
      const didSeek = await seekStreaming(nextTime);

      if (didSeek) {
        setCurrentTime(nextTime);
      }

      setPreviewSeekTime(0);
      setIsSeeking(false);
      syncPlaybackStatus();
    },
    [seekStreaming, syncPlaybackStatus]
  );

  const handleVolumeChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextVolume = Number(event.target.value);
      setVolume(nextVolume);
      void setStreamingVolume(nextVolume / 100);
    },
    [setStreamingVolume]
  );

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
            <span>{formatTime(displayCurrentTime)}</span>
            <input
              className="player-progress-slider"
              type="range"
              style={{
                background: `linear-gradient(to right, ${blueFill} 0%, ${blueFill} ${progressPercent}%, ${blueTrack} ${progressPercent}%, ${blueTrack} 100%)`
              }}
              min={0}
              max={Math.max(duration, 0)}
              step={1}
              value={Math.min(
                displayCurrentTime,
                duration || displayCurrentTime
              )}
              onChange={handleProgressChange}
              onMouseUp={commitSeek}
              onTouchEnd={commitSeek}
              disabled={!hasMediaSelected || isStartingStream || duration <= 0}
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="player-controls-row">
            <div className="player-left-controls">
              <button
                type="button"
                className="player-main-btn"
                onClick={handlePlayPause}
                disabled={!isConnected || !hasMediaSelected || isStartingStream}
              >
                {isStreaming ? <FaPause size={31} /> : <FaPlay size={31} />}
              </button>
            </div>

            <div className="player-right-controls">
              <div className="player-volume-wrap">
                <FiVolume2 size={20} />
                <input
                  className="player-volume-slider"
                  type="range"
                  min={0}
                  max={100}
                  style={{
                    background: `linear-gradient(to right, ${blueFill} 0%, ${blueFill} ${volumePercent}%, ${blueTrack} ${volumePercent}%, ${blueTrack} 100%)`
                  }}
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={!isConnected}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.media.status === 'failed' && state.media.reason && (
        <div className="player-feedback-error">
          <p className="player-feedback-error-text">{state.media.reason}</p>
        </div>
      )}
    </>
  );
};

export default React.memo(Player);
