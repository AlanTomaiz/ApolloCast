import React, { useRef } from 'react';
import { FiCast } from 'react-icons/fi';
import { useRender } from '../services/Context';
import Header from './Header';
import ListDevices from './List';


const Screen: React.FC = () => {
  const { chromecast } = useRender();
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const openModal = React.useCallback(() => setIsModalOpen(true), []);
  const closeModal = React.useCallback(() => setIsModalOpen(false), []);

  // eslint-disable-next-line no-unused-vars
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="container">
        <Header />
        <div className="content">
          <div className="background" />
          <button
            type="button"
            className="cast-conn"
            data-connected={Boolean(chromecast)}
            onClick={openModal}
          >
            <FiCast size={25} />
          </button>
        </div>
      </div>

      {isModalOpen && <ListDevices onClose={closeModal} />}
    </>
  );
};

export default Screen;
