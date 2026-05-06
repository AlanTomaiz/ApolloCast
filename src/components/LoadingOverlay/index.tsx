import React from 'react';
import './index.css';

interface LoadingOverlayProps {
  active?: boolean;
  message?: string;
  children?: React.ReactNode;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  active = false,
  children,
  message = 'Carregando...'
}) => {
  return (
    <div className="loading-overlay-root">
      <div className={`loading-overlay-stage${active ? ' is-active' : ''}`}>
        {children}
      </div>

      {active && (
        <div className="page-loading-overlay" aria-live="polite">
          <span className="page-loading-spinner" />
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(LoadingOverlay);
