import { app, BrowserWindow, dialog, ipcMain, nativeImage } from 'electron';
import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let mainWindow: BrowserWindow;
let isMainWindowLoaded = false;
const mainWindowReadyResolvers: Array<() => void> = [];

const notifyMainWindowLoaded = (): void => {
  isMainWindowLoaded = true;

  while (mainWindowReadyResolvers.length > 0) {
    const resolve = mainWindowReadyResolvers.shift();
    if (resolve) {
      resolve();
    }
  }
};

const createWindow = (): void => {
  const icon = nativeImage.createFromPath(`${app.getAppPath()}/build/icon.png`);

  if (app.dock) {
    app.dock.setIcon(icon);
  }

  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon,
    width: 800,
    height: 450,
    frame: false,
    resizable: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.once('did-finish-load', () => {
    notifyMainWindowLoaded();
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('closeApp', () => {
  app.quit();
});

ipcMain.handle('minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('waitForMainWindowLoaded', async () => {
  if (isMainWindowLoaded) {
    return true;
  }

  await new Promise<void>((resolve) => {
    mainWindowReadyResolvers.push(resolve);
  });

  return true;
});

ipcMain.handle('pickVideoFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Videos',
        extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi']
      }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];

  return {
    path: selectedPath,
    name: path.basename(selectedPath)
  };
});
