import React, { useRef } from 'react';
import { FiCast } from 'react-icons/fi';
import { useRender } from '../services/Context';

import Header from './Header';

const Screen: React.FC = () => {
  const { chromecast } = useRender();
  // eslint-disable-next-line no-unused-vars
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="container">
        <Header />
        <div className="content">
          <div className="background" />
          <div className="cast-conn" data-connected={chromecast}>
            <FiCast size={25} />
          </div>
        </div>
      </div>

      {/* <CastsModal visible={isModalOpen} onClose={toggleModalOpen} /> */}
    </>
  );
};

export default Screen;
