import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNotesStore } from '../store/notes';
import { parseNote } from '../lib/parser';
import { getModKey } from '../lib/shortcutLabel';

interface TabBarProps {
  onCloseRequest: (id: string, openActions: number) => void;
}

interface TabContextMenu {
  x: number;
  y: number;
  noteId: string;
}

interface RenameState {
  noteId: string;
  value: string;
}

export function TabBar({ onCloseRequest }: TabBarProps) {
  const notes = useNotesStore((s) => s.notes);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const setActiveNote = useNotesStore((s) => s.setActiveNote);
  const createNote = useNotesStore((s) => s.createNote);
  const togglePin = useNotesStore((s) => s.togglePin);
  const renameNote = useNotesStore((s) => s.renameNote);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const getNoteTitle = useNotesStore((s) => s.getNoteTitle);
  const newTabShortcut = `${getModKey()}+T`;

  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const [contextMenu, setContextMenu] = useState<TabContextMenu | null>(null);
  const [renameState, setRenameState] = useState<RenameState | null>(null);

  const sortedNotes = [...notes]
    .filter((n) => !n.archived)
    .sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return 0;
  });

  const updatePagination = useCallback(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list) return;

    const viewportWidth = viewport.clientWidth;
    const listWidth = list.scrollWidth;
    const nextMaxOffset = Math.max(0, listWidth - viewportWidth);
    setMaxOffset(nextMaxOffset);
    setOffset((current) => Math.min(current, nextMaxOffset));
  }, []);

  useLayoutEffect(() => {
    updatePagination();
  }, [sortedNotes.length, activeNoteId, updatePagination]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!viewport || !list) return;

    const observer = new ResizeObserver(updatePagination);
    observer.observe(viewport);
    observer.observe(list);
    return () => observer.disconnect();
  }, [updatePagination]);

  useEffect(() => {
    if (!activeNoteId) return;
    const tab = tabRefs.current.get(activeNoteId);
    const viewport = viewportRef.current;
    if (!tab || !viewport) return;

    requestAnimationFrame(() => {
      const tabStart = tab.offsetLeft;
      const tabEnd = tabStart + tab.offsetWidth;
      setOffset((current) => {
        const viewStart = current;
        const viewEnd = current + viewport.clientWidth;
        if (tabStart < viewStart) return tabStart;
        if (tabEnd > viewEnd) {
          return Math.min(maxOffset, tabEnd - viewport.clientWidth);
        }
        return current;
      });
    });
  }, [activeNoteId, sortedNotes.length, maxOffset]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const pageLeft = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setOffset((current) => Math.max(0, current - viewport.clientWidth * 0.85));
  };

  const pageRight = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setOffset((current) =>
      Math.min(maxOffset, current + viewport.clientWidth * 0.85),
    );
  };

  const canPageLeft = offset > 0;
  const canPageRight = offset < maxOffset - 1;

  const openRename = (noteId: string) => {
    setContextMenu(null);
    setRenameState({ noteId, value: getNoteTitle(noteId) });
  };

  const submitRename = () => {
    if (!renameState) return;
    renameNote(renameState.noteId, renameState.value);
    setRenameState(null);
  };

  return (
    <>
      <div className="tab-bar">
        <button
          type="button"
          className="tab-page-btn tab-page-prev"
          onClick={pageLeft}
          disabled={!canPageLeft}
          title="Previous tabs"
          aria-label="Previous tabs"
        >
          ‹
        </button>

        <div className="tab-viewport" ref={viewportRef}>
          <div
            className="tab-list"
            ref={listRef}
            style={{ transform: `translateX(-${offset}px)` }}
          >
            {sortedNotes.map((note) => {
              const title = getNoteTitle(note.id);
              const isActive = note.id === activeNoteId;
              const openActions = parseNote(note.id, note.content).actions.filter((a) => !a.done).length;

              return (
                <div
                  key={note.id}
                  ref={(el) => {
                    if (el) tabRefs.current.set(note.id, el);
                    else tabRefs.current.delete(note.id);
                  }}
                  className={`tab ${isActive ? 'tab-active' : ''}`}
                  onClick={() => setActiveNote(note.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id });
                  }}
                >
                  {note.pinned && <span className="tab-pin" title="Pinned">★</span>}
                  <span className="tab-title">{title}</span>
                  {openActions > 0 && <span className="tab-badge">{openActions}</span>}
                  <button
                    type="button"
                    className="tab-pin-btn"
                    title={note.pinned ? 'Unpin' : 'Pin'}
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(note.id);
                    }}
                  >
                    {note.pinned ? '★' : '☆'}
                  </button>
                  <button
                    type="button"
                    className="tab-close"
                    title="Close tab (deletes note)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseRequest(note.id, openActions);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="tab-page-btn tab-page-next"
          onClick={pageRight}
          disabled={!canPageRight}
          title="Next tabs"
          aria-label="Next tabs"
        >
          ›
        </button>

        <button type="button" className="tab-new" onClick={() => createNote()} title={`New tab (${newTabShortcut})`}>
          +
        </button>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={() => openRename(contextMenu.noteId)}>
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              archiveNote(contextMenu.noteId);
              setContextMenu(null);
            }}
          >
            Archive
          </button>
        </div>
      )}

      {renameState && (
        <div className="rename-overlay" onClick={() => setRenameState(null)}>
          <div className="rename-dialog" onClick={(e) => e.stopPropagation()}>
            <label htmlFor="tab-rename-input">Tab name</label>
            <input
              id="tab-rename-input"
              type="text"
              value={renameState.value}
              autoFocus
              onChange={(e) => setRenameState({ ...renameState, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenameState(null);
              }}
            />
            <div className="rename-actions">
              <button type="button" onClick={() => setRenameState(null)}>
                Cancel
              </button>
              <button type="button" className="rename-submit" onClick={submitRename}>
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
