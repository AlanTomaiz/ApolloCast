import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';

import { APIProvider } from './services/Context';
import Screen from './screen';

const rootElement = document.getElementById('app');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <APIProvider>
    <Screen />
  </APIProvider>,
);
