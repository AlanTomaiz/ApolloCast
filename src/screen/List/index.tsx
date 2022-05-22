import React from 'react';
import { BsCast } from 'react-icons/bs';

import { useRender } from '../../services/Context';

const ListDevices: React.FC = () => {
  const { chromecasts } = useRender();

  return (
    <div className="modal">
      <div className="modal-container">
        <div className="moda-close" />
        <div className="modal-title">Transmitir para:</div>
        <div className="modal-content">
          <ul>
            <li>
              <BsCast />
              Sala de estar
            </li>
            <li>
              <BsCast />
              Sala de estar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ListDevices);
