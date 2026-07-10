import { useMemo, useState } from 'react';
import { useNotesStore } from '../store/notes';
import { useUiStore } from '../store/ui';

export function ArchiveModal() {
  const notes = useNotesStore((s) => s.notes);
  const getNoteTitle = useNotesStore((s) => s.getNoteTitle);
  const setNotesArchived = useNotesStore((s) => s.setNotesArchived);
  const setShowArchiveModal = useUiStore((s) => s.setShowArchiveModal);

  const [selectedActive, setSelectedActive] = useState<Set<string>>(() => new Set());
  const [selectedArchived, setSelectedArchived] = useState<Set<string>>(() => new Set());

  const activeNotes = useMemo(
    () => notes.filter((n) => !n.archived),
    [notes],
  );
  const archivedNotes = useMemo(
    () => notes.filter((n) => n.archived),
    [notes],
  );

  const toggleSelection = (id: string, archived: boolean) => {
    const setter = archived ? setSelectedArchived : setSelectedActive;
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveToArchive = () => {
    const ids = [...selectedActive];
    if (ids.length === 0) return;
    setNotesArchived(ids, true);
    setSelectedActive(new Set());
  };

  const restoreFromArchive = () => {
    const ids = [...selectedArchived];
    if (ids.length === 0) return;
    setNotesArchived(ids, false);
    setSelectedArchived(new Set());
  };

  const close = () => setShowArchiveModal(false);

  return (
    <div className="archive-overlay" onClick={close}>
      <div className="archive-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="archive-header">
          <h2>Manage archives</h2>
          <button type="button" className="archive-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div className="archive-columns">
          <section className="archive-panel">
            <h3>Active</h3>
            <ul className="archive-list">
              {activeNotes.length === 0 ? (
                <li className="archive-empty">No active tabs</li>
              ) : (
                activeNotes.map((note) => (
                  <li key={note.id}>
                    <label className="archive-item">
                      <input
                        type="checkbox"
                        checked={selectedActive.has(note.id)}
                        onChange={() => toggleSelection(note.id, false)}
                      />
                      <span className="archive-item-title">{getNoteTitle(note.id)}</span>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </section>

          <div className="archive-transfer">
            <button
              type="button"
              className="archive-transfer-btn"
              onClick={moveToArchive}
              disabled={selectedActive.size === 0}
              title="Move selected to archive"
            >
              →
            </button>
            <button
              type="button"
              className="archive-transfer-btn"
              onClick={restoreFromArchive}
              disabled={selectedArchived.size === 0}
              title="Restore selected to active"
            >
              ←
            </button>
          </div>

          <section className="archive-panel">
            <h3>Archived</h3>
            <ul className="archive-list">
              {archivedNotes.length === 0 ? (
                <li className="archive-empty">No archived tabs</li>
              ) : (
                archivedNotes.map((note) => (
                  <li key={note.id}>
                    <label className="archive-item">
                      <input
                        type="checkbox"
                        checked={selectedArchived.has(note.id)}
                        onChange={() => toggleSelection(note.id, true)}
                      />
                      <span className="archive-item-title">{getNoteTitle(note.id)}</span>
                    </label>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
