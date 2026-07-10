import { useCallback, useEffect, useRef, useState } from 'react';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { indentUnit, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import {
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
} from '@codemirror/search';
import { createEditorSearchPanel } from '../lib/editorSearchPanel';
import { useNotesStore } from '../store/notes';
import { useUiStore } from '../store/ui';
import { applyTransformToSelection } from '../lib/listTransform';
import { applyLinkTransformToSelection } from '../lib/linkTransform';
import { applyWrapFormatToSelection, type WrapFormat } from '../lib/wrapFormat';
import { MacroHelpButton } from './MacroHelpButton';

interface EditorPaneProps {
  noteId: string;
  content: string;
}

interface ContextMenuState {
  x: number;
  y: number;
  from: number;
  to: number;
}

const lineNumbersCompartment = new Compartment();

export function EditorPane({ noteId, content }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const updateContent = useNotesStore((s) => s.updateContent);
  const showLineNumbers = useUiStore((s) => s.showLineNumbers);
  const toggleLineNumbers = useUiStore((s) => s.toggleLineNumbers);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const applyTransform = useCallback(
    (mode: 'list' | 'actions', from: number, to: number) => {
      const view = viewRef.current;
      if (!view) return;

      const current = view.state.doc.toString();
      const result = applyTransformToSelection(current, from, to, mode);
      updateContent(noteId, result.content);

      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: result.content },
        selection: { anchor: result.selectionFrom, head: result.selectionTo },
      });
      setContextMenu(null);
    },
    [noteId, updateContent],
  );

  const applyLinkTransform = useCallback(
    (from: number, to: number) => {
      const view = viewRef.current;
      if (!view) return false;

      const current = view.state.doc.toString();
      const result = applyLinkTransformToSelection(current, from, to);
      if (!result) return false;

      updateContent(noteId, result.content);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: result.content },
        selection: { anchor: result.selectionFrom, head: result.selectionTo },
      });
      setContextMenu(null);
      return true;
    },
    [noteId, updateContent],
  );

  const applyWrapFormat = useCallback(
    (format: WrapFormat, from: number, to: number) => {
      const view = viewRef.current;
      if (!view) return false;

      const current = view.state.doc.toString();
      const result = applyWrapFormatToSelection(current, from, to, format);
      if (!result) return false;

      updateContent(noteId, result.content);
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: result.content },
        selection: { anchor: result.selectionFrom, head: result.selectionTo },
      });
      setContextMenu(null);
      return true;
    },
    [noteId, updateContent],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        updateContent(noteId, update.state.doc.toString());
      }
    });

    const replaceKeymap = keymap.of([
      {
        key: 'Mod-Alt-f',
        run: (view) => {
          openSearchPanel(view);
          requestAnimationFrame(() => {
            const field = view.dom.querySelector(
              '.cm-search input[name="replace"]',
            ) as HTMLInputElement | null;
            field?.focus();
            field?.select();
          });
          return true;
        },
      },
    ]);

    const makeListKeymap = keymap.of([
      {
        key: 'Mod-b',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          return applyWrapFormat('bold', from, to);
        },
      },
      {
        key: 'Mod-i',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          return applyWrapFormat('italic', from, to);
        },
      },
      {
        key: 'Mod-`',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          return applyWrapFormat('code', from, to);
        },
      },
      {
        key: 'Mod-Shift-l',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          applyTransform('list', from, to);
          return true;
        },
      },
      {
        key: 'Mod-Shift-a',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          applyTransform('actions', from, to);
          return true;
        },
      },
      {
        key: 'Mod-Shift-h',
        run: (view) => {
          const { from, to } = view.state.selection.main;
          if (from === to) return false;
          return applyLinkTransform(from, to);
        },
      },
    ]);

    const state = EditorState.create({
      doc: content,
      extensions: [
        indentUnit.of('  '),
        Prec.highest(
          keymap.of([
            { key: 'Tab', run: indentMore },
            { key: 'Shift-Tab', run: indentLess },
          ]),
        ),
        lineNumbersCompartment.of(showLineNumbers ? lineNumbers() : []),
        highlightActiveLine(),
        drawSelection(),
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        search({ top: true, createPanel: createEditorSearchPanel }),
        highlightSelectionMatches(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        Prec.high(replaceKeymap),
        Prec.high(makeListKeymap),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
          '.cm-content': { padding: '12px 0' },
          '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
          '.cm-lineNumbers .cm-gutterElement': {
            color: 'rgba(0, 0, 0, 0.2)',
            fontSize: '12px',
            minWidth: '2.25em',
          },
          '.cm-activeLineGutter': {
            color: 'rgba(0, 0, 0, 0.32)',
            backgroundColor: 'transparent',
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate only when note changes
  }, [noteId]);

  useEffect(() => {
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: lineNumbersCompartment.reconfigure(showLineNumbers ? lineNumbers() : []),
    });
  }, [showLineNumbers]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  const handleContextMenu = (e: React.MouseEvent) => {
    const view = viewRef.current;
    if (!view) return;

    const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
    if (pos === null) return;

    const { from, to } = view.state.selection.main;
    if (from === to) return;

    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, from, to });
  };

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div className="editor-pane" onContextMenu={handleContextMenu}>
      <div className="pane-header">
        <span>Editor</span>
        <div className="pane-header-controls">
          <button
            type="button"
            className={`pane-toggle ${showLineNumbers ? 'pane-toggle-active' : ''}`}
            onClick={toggleLineNumbers}
            title="Toggle line numbers"
          >
            #
          </button>
          <MacroHelpButton />
        </div>
      </div>
      <div ref={containerRef} className="editor-container" />
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={() => applyTransform('list', contextMenu.from, contextMenu.to)}>
            Make list
          </button>
          <button type="button" onClick={() => applyTransform('actions', contextMenu.from, contextMenu.to)}>
            Make actions
          </button>
          <button type="button" onClick={() => applyLinkTransform(contextMenu.from, contextMenu.to)}>
            Make link
          </button>
        </div>
      )}
    </div>
  );
}
