import { useCallback, useEffect } from 'react';
import { TabBar } from './components/TabBar';
import { EditorPane } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { ActionSidebar } from './components/ActionSidebar';
import { PaneToggleIcon } from './components/PaneToggleIcon';
import { ArchiveIcon } from './components/ArchiveIcon';
import { ArchiveModal } from './components/ArchiveModal';
import { useNotesStore } from './store/notes';
import { useUiStore } from './store/ui';
import { parseNote } from './lib/parser';

const SAMPLE_NOTE = `## TODO

Create "Feature Brief" for remaining S.A.M. work.

- 2025 year in review
- Features/specs for 17.0 & 17.1
- Cost projections from Atakan
- Microservice Decommissioning
- Shared cache for pods in a K8 cluster

---

## DCAI SEC FINDING

- Find architects
- Forward email

---

## Pen Test / Evaluation for new Hendrix APIs

- Research
- Make Test Plan
- Pentest

---

## Identify Flex Compute Costs

Previous estimates:
Compute cost (Ethos) ~$375/month per microservice
RDS cost ~$1.4k/month
`;

export default function App() {
  const hydrated = useNotesStore((s) => s.hydrated);
  const notes = useNotesStore((s) => s.notes);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const hydrate = useNotesStore((s) => s.hydrate);
  const createNote = useNotesStore((s) => s.createNote);
  const closeNote = useNotesStore((s) => s.closeNote);
  const toSession = useNotesStore((s) => s.toSession);
  const updateContent = useNotesStore((s) => s.updateContent);

  const showActionsPane = useUiStore((s) => s.showActionsPane);
  const showPreviewPane = useUiStore((s) => s.showPreviewPane);
  const showArchiveModal = useUiStore((s) => s.showArchiveModal);
  const toggleActionsPane = useUiStore((s) => s.toggleActionsPane);
  const togglePreviewPane = useUiStore((s) => s.togglePreviewPane);
  const setShowArchiveModal = useUiStore((s) => s.setShowArchiveModal);

  useEffect(() => {
    async function load() {
      if (window.scratchpad) {
        const session = await window.scratchpad.loadSession();
        hydrate(session.notes, session.activeNoteId);
      } else {
        hydrate([], null);
        const id = useNotesStore.getState().activeNoteId;
        if (id) updateContent(id, SAMPLE_NOTE);
      }
    }
    load();
  }, [hydrate, updateContent]);

  useEffect(() => {
    if (!hydrated) return;

    const save = () => {
      if (window.scratchpad) {
        window.scratchpad.saveSession(toSession());
      }
    };

    const saveSync = () => {
      const session = useNotesStore.getState().toSession();
      if (window.scratchpad?.saveSessionSync) {
        window.scratchpad.saveSessionSync(session);
      } else if (window.scratchpad) {
        void window.scratchpad.saveSession(session);
      }
    };

    save();
    const interval = setInterval(save, 5000);

    window.addEventListener('beforeunload', saveSync);
    const removeBeforeQuit = window.scratchpad?.onBeforeQuit(saveSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveSync);
      removeBeforeQuit?.();
    };
  }, [hydrated, notes, activeNoteId, toSession]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 't') {
        e.preventDefault();
        createNote();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [createNote]);

  const handleCloseRequest = useCallback(
    (id: string, openActions: number) => {
      const note = notes.find((n) => n.id === id);
      if (note?.pinned) {
        alert('Unpin this tab before closing.');
        return;
      }

      if (openActions > 0) {
        const title = parseNote(id, note?.content ?? '').title;
        const ok = confirm(
          `"${title}" has ${openActions} open action${openActions === 1 ? '' : 's'}. Close and delete this note?`,
        );
        if (!ok) return;
      }

      closeNote(id);
    },
    [notes, closeNote],
  );

  const activeNote =
    notes.find((n) => n.id === activeNoteId && !n.archived) ?? notes.find((n) => !n.archived);

  if (!hydrated || !activeNote) {
    return <div className="loading">Loading…</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Scratchpad</h1>
        <div className="view-toggles">
          <button
            type="button"
            className="view-toggle"
            onClick={() => setShowArchiveModal(true)}
            title="Manage archives"
            aria-label="Manage archives"
          >
            <ArchiveIcon />
          </button>
          <button
            type="button"
            className={`view-toggle ${showActionsPane ? 'view-toggle-active' : ''}`}
            onClick={toggleActionsPane}
            title={showActionsPane ? 'Hide actions pane' : 'Show actions pane'}
            aria-label={showActionsPane ? 'Hide actions pane' : 'Show actions pane'}
            aria-pressed={showActionsPane}
          >
            <PaneToggleIcon side="left" active={showActionsPane} />
          </button>
          <button
            type="button"
            className={`view-toggle ${showPreviewPane ? 'view-toggle-active' : ''}`}
            onClick={togglePreviewPane}
            title={showPreviewPane ? 'Hide preview pane' : 'Show preview pane'}
            aria-label={showPreviewPane ? 'Hide preview pane' : 'Show preview pane'}
            aria-pressed={showPreviewPane}
          >
            <PaneToggleIcon side="right" active={showPreviewPane} />
          </button>
        </div>
      </header>
      <TabBar onCloseRequest={handleCloseRequest} />
      <main className="app-main">
        {showActionsPane && <ActionSidebar />}
        <div className={`editor-preview ${!showPreviewPane ? 'editor-preview-full' : ''}`}>
          <EditorPane key={activeNote.id} noteId={activeNote.id} content={activeNote.content} />
          {showPreviewPane && <PreviewPane content={activeNote.content} />}
        </div>
      </main>
      {showArchiveModal && <ArchiveModal />}
    </div>
  );
}
