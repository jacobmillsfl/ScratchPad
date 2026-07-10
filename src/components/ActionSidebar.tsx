import { useNotesStore } from '../store/notes';

export function ActionSidebar() {
  const showCompleted = useNotesStore((s) => s.showCompleted);
  const setShowCompleted = useNotesStore((s) => s.setShowCompleted);
  const toggleAction = useNotesStore((s) => s.toggleAction);
  const getActiveActions = useNotesStore((s) => s.getActiveActions);
  const activeNoteId = useNotesStore((s) => s.activeNoteId);
  const getOpenActionCountForNote = useNotesStore((s) => s.getOpenActionCountForNote);

  const actions = getActiveActions();
  const openCount = activeNoteId ? getOpenActionCountForNote(activeNoteId) : 0;

  return (
    <div className="action-sidebar">
      <div className="pane-header">
        <span>Actions</span>
        <div className="pane-header-controls">
          <span className="action-count">{openCount} open</span>
        </div>
      </div>

      <div className="action-list">
        {actions.length === 0 && (
          <p className="action-empty">
            Action items from <code>- [ ]</code> checkboxes in this tab appear here.
          </p>
        )}

        {actions.map((action) => (
          <label key={action.id} className={`action-item ${action.done ? 'action-done' : ''}`}>
            <input
              type="checkbox"
              checked={action.done}
              onChange={(e) => toggleAction(action.noteId, action.lineIndex, e.target.checked)}
            />
            <span>{action.text}</span>
          </label>
        ))}
      </div>

      <label className="show-completed">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={(e) => setShowCompleted(e.target.checked)}
        />
        Show completed
      </label>
    </div>
  );
}
