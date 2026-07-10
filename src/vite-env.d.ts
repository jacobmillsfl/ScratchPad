/// <reference types="vite/client" />

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

declare global {
  interface Window {
    scratchpad?: {
      loadSession: () => Promise<SessionData>;
      saveSession: (data: SessionData) => Promise<boolean>;
      saveSessionSync: (data: SessionData) => boolean;
      onBeforeQuit: (callback: () => void) => () => void;
      openExternal: (url: string) => Promise<boolean>;
    };
  }
}

export {};
