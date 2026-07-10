import { contextBridge, ipcRenderer } from 'electron';

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

contextBridge.exposeInMainWorld('scratchpad', {
  loadSession: (): Promise<SessionData> => ipcRenderer.invoke('session:load'),
  saveSession: (data: SessionData): Promise<boolean> => ipcRenderer.invoke('session:save', data),
  saveSessionSync: (data: SessionData): boolean =>
    ipcRenderer.sendSync('session:save-sync', data) as boolean,
  onBeforeQuit: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('app-before-quit', handler);
    return () => ipcRenderer.removeListener('app-before-quit', handler);
  },
  openExternal: (url: string): Promise<boolean> => ipcRenderer.invoke('open-external', url),
});
