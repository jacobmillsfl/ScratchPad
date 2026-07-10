import { create } from 'zustand';

interface UiState {
  showLineNumbers: boolean;
  showActionsPane: boolean;
  showEditorPane: boolean;
  showPreviewPane: boolean;
  showArchiveModal: boolean;
  setShowLineNumbers: (show: boolean) => void;
  setShowActionsPane: (show: boolean) => void;
  setShowEditorPane: (show: boolean) => void;
  setShowPreviewPane: (show: boolean) => void;
  setShowArchiveModal: (show: boolean) => void;
  toggleLineNumbers: () => void;
  toggleActionsPane: () => void;
  toggleEditorPane: () => void;
  togglePreviewPane: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  showLineNumbers: true,
  showActionsPane: true,
  showEditorPane: true,
  showPreviewPane: true,
  showArchiveModal: false,
  setShowLineNumbers: (show) => set({ showLineNumbers: show }),
  setShowActionsPane: (show) => set({ showActionsPane: show }),
  setShowEditorPane: (show) => set({ showEditorPane: show }),
  setShowPreviewPane: (show) => set({ showPreviewPane: show }),
  setShowArchiveModal: (show) => set({ showArchiveModal: show }),
  toggleLineNumbers: () => set((s) => ({ showLineNumbers: !s.showLineNumbers })),
  toggleActionsPane: () => set((s) => ({ showActionsPane: !s.showActionsPane })),
  toggleEditorPane: () => set((s) => ({ showEditorPane: !s.showEditorPane })),
  togglePreviewPane: () => set((s) => ({ showPreviewPane: !s.showPreviewPane })),
}));
