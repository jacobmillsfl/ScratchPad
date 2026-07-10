import { join } from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as fs from 'fs';

interface SessionNote {
  id: string;
  content: string;
  pinned: boolean;
  customTitle?: string;
  archived?: boolean;
}

interface SessionData {
  notes: SessionNote[];
  activeNoteId: string | null;
}

let mainWindow: BrowserWindow | null = null;

function getSessionPath(): string {
  return join(app.getPath('userData'), 'scratchpad-session.json');
}

function loadSession(): SessionData {
  const sessionPath = getSessionPath();
  try {
    if (fs.existsSync(sessionPath)) {
      const raw = fs.readFileSync(sessionPath, 'utf-8');
      return JSON.parse(raw) as SessionData;
    }
  } catch {
    // Corrupt session file — start fresh
  }
  return { notes: [], activeNoteId: null };
}

function saveSession(data: SessionData): void {
  const sessionPath = getSessionPath();
  fs.mkdirSync(join(sessionPath, '..'), { recursive: true });
  fs.writeFileSync(sessionPath, JSON.stringify(data, null, 2), 'utf-8');
}

function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isAllowedNavigation(url: string): boolean {
  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    return url.startsWith('http://localhost:') || url.startsWith('file://');
  }
  return url.startsWith('file://');
}

function openExternalUrl(url: string): void {
  if (isSafeExternalUrl(url)) {
    void shell.openExternal(url);
  }
}

function attachNavigationHandlers(window: BrowserWindow): void {
  const { webContents } = window;

  webContents.setWindowOpenHandler(({ url }) => {
    openExternalUrl(url);
    return { action: 'deny' };
  });

  webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
      openExternalUrl(url);
    }
  });
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: 'Scratchpad',
    show: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = window;

  attachNavigationHandlers(window);

  window.on('closed', () => {
    mainWindow = null;
  });

  window.on('close', () => {
    if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
      window.webContents.send('app-before-quit');
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (!app.isPackaged && devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadFile(join(__dirname, '../src/out/index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('session:load', () => loadSession());
  ipcMain.handle('session:save', (_event, data: SessionData) => {
    saveSession(data);
    return true;
  });
  ipcMain.on('session:save-sync', (event, data: SessionData) => {
    saveSession(data);
    event.returnValue = true;
  });
  ipcMain.handle('open-external', (_event, url: string) => {
    openExternalUrl(url);
    return true;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send('app-before-quit');
  }
});
