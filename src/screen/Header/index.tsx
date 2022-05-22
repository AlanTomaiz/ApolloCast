/* eslint-disable no-unused-vars */
import React, { memo, useCallback } from 'react';
import { FiX, FiMinus } from 'react-icons/fi';

const Header: React.FC = () => {
  const handleMinimize = useCallback(() => window.render.minimize(), []);
  const handleClose = useCallback(() => window.render.close(), []);

  return (
    <div className="tray-container">
      <strong>Apollo Stream</strong>
      <div className="tray-actions">
        <button type="button" onClick={() => handleMinimize()}>
          <FiMinus />
        </button>
        <button type="button" onClick={() => handleClose()}>
          <FiX />
        </button>
      </div>
    </div>
  );
};

export default memo(Header);
