/* eslint-disable react/jsx-no-constructed-context-values */
import React from 'react';

import { IDevice, IService } from '../../@types/Render';

interface IContext {
  chromecast: IDevice;
  chromecasts: IDevice[];
  // addLog: (message: string) => void;
  setDevice: (device: IDevice) => void;
  // setVideoPath: (videoPath: string) => void;
}

const APIContext = React.createContext<IContext>({} as IContext);

const APIProvider = ({ children }: any) => {
  const [chromecast, setChromecast] = React.useState<IDevice>();
  const [chromecasts, setChromecasts] = React.useState<IDevice[]>([]);
  const [media, setMedia] = React.useState<any>({});

  React.useEffect(() => {
    window.render.scanner((service: IService) => {
      const newDevice = {
        host: service.addresses[0],
        name: service.txt.fn,
        type: service.txt.md,
      };

      setChromecasts(chromeCasts => [...chromeCasts, newDevice]);
    });
  }, []);

  return (
    <APIContext.Provider
      value={{ chromecasts, chromecast, setDevice: setChromecast }}
    >
      {children}
    </APIContext.Provider>
  );
};

const useRender = () => {
  const context = React.useContext(APIContext);
  return context;
};

export { APIProvider, useRender };
