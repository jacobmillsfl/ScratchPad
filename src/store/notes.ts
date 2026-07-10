import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { deriveTitle, parseNote, toggleActionInContent, type ActionItem } from '../lib/parser';

export interface Note {
  id: string;
  content: string;
  pinned: boolean;
  customTitle?: string;
  archived?: boolean;
}

interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  showCompleted: boolean;
  hydrated: boolean;

  hydrate: (notes: Note[], activeNoteId: string | null) => void;
  createNote: () => string;
  closeNote: (id: string) => void;
  setActiveNote: (id: string) => void;
  updateContent: (id: string, content: string) => void;
  togglePin: (id: string) => void;
  renameNote: (id: string, title: string) => void;
  setNotesArchived: (ids: string[], archived: boolean) => void;
  archiveNote: (id: string) => void;
  toggleAction: (noteId: string, lineIndex: number, done: boolean) => void;
  setShowCompleted: (show: boolean) => void;

  getActiveNote: () => Note | undefined;
  getActiveActions: () => ActionItem[];
  getOpenActionCountForNote: (noteId: string) => number;
  getNoteTitle: (id: string) => string;
  toSession: () => { notes: Note[]; activeNoteId: string | null };
}

const DEFAULT_CONTENT = '';

function resolveActiveNoteId(notes: Note[], activeNoteId: string | null): string | null {
  const current = notes.find((n) => n.id === activeNoteId && !n.archived);
  if (current) return activeNoteId;
  return notes.find((n) => !n.archived)?.id ?? null;
}

function ensureActiveNote(notes: Note[], activeNoteId: string | null): { notes: Note[]; activeNoteId: string } {
  const resolved = resolveActiveNoteId(notes, activeNoteId);
  if (resolved) return { notes, activeNoteId: resolved };
  const newId = uuidv4();
  return {
    notes: [...notes, { id: newId, content: DEFAULT_CONTENT, pinned: false }],
    activeNoteId: newId,
  };
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  showCompleted: false,
  hydrated: false,

  hydrate: (notes, activeNoteId) => {
    if (notes.length === 0) {
      const id = uuidv4();
      set({
        notes: [{ id, content: DEFAULT_CONTENT, pinned: false }],
        activeNoteId: id,
        hydrated: true,
      });
      return;
    }
    const normalized = notes.map((n) => ({ ...n, archived: n.archived ?? false }));
    const { notes: resolvedNotes, activeNoteId: resolvedActive } = ensureActiveNote(
      normalized,
      activeNoteId ?? normalized[0]?.id ?? null,
    );
    set({ notes: resolvedNotes, activeNoteId: resolvedActive, hydrated: true });
  },

  createNote: () => {
    const id = uuidv4();
    set((state) => ({
      notes: [...state.notes, { id, content: DEFAULT_CONTENT, pinned: false }],
      activeNoteId: id,
    }));
    return id;
  },

  closeNote: (id) => {
    set((state) => {
      const notes = state.notes.filter((n) => n.id !== id);
      let activeNoteId = state.activeNoteId;
      if (activeNoteId === id) {
        activeNoteId = notes.length > 0 ? notes[notes.length - 1].id : null;
      }
      if (notes.length === 0) {
        const newId = uuidv4();
        return {
          notes: [{ id: newId, content: DEFAULT_CONTENT, pinned: false }],
          activeNoteId: newId,
        };
      }
      return { notes, activeNoteId };
    });
  },

  setActiveNote: (id) => set({ activeNoteId: id }),

  updateContent: (id, content) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, content } : n)),
    }));
  },

  togglePin: (id) => {
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    }));
  },

  renameNote: (id, title) => {
    const trimmed = title.trim();
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, customTitle: trimmed || undefined } : n,
      ),
    }));
  },

  setNotesArchived: (ids, archived) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    set((state) => {
      const notes = state.notes.map((n) => (idSet.has(n.id) ? { ...n, archived } : n));
      return ensureActiveNote(notes, state.activeNoteId);
    });
  },

  archiveNote: (id) => get().setNotesArchived([id], true),

  toggleAction: (noteId, lineIndex, done) => {
    set((state) => ({
      notes: state.notes.map((n) => {
        if (n.id !== noteId) return n;
        return { ...n, content: toggleActionInContent(n.content, lineIndex, done) };
      }),
    }));
  },

  setShowCompleted: (show) => set({ showCompleted: show }),

  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId);
  },

  getActiveActions: () => {
    const { notes, activeNoteId, showCompleted } = get();
    if (!activeNoteId) return [];
    const note = notes.find((n) => n.id === activeNoteId);
    if (!note) return [];
    const actions = parseNote(note.id, note.content).actions;
    return showCompleted ? actions : actions.filter((a) => !a.done);
  },

  getOpenActionCountForNote: (noteId) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return 0;
    return parseNote(note.id, note.content).actions.filter((a) => !a.done).length;
  },

  getNoteTitle: (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return 'Untitled';
    if (note.customTitle?.trim()) return note.customTitle.trim();
    return deriveTitle(note.content);
  },

  toSession: () => {
    const { notes, activeNoteId } = get();
    return { notes, activeNoteId };
  },
}));
