import { useMemo, type MouseEvent } from 'react';
import { parseMarkdownPreview } from '../lib/markdownPreview';
import { useNotesStore } from '../store/notes';

interface PreviewPaneProps {
  content: string;
}

function wrapMarkdownTables(html: string): string {
  return html
    .replace(/<table>/gi, '<div class="markdown-table-wrapper"><table>')
    .replace(/<\/table>/gi, '</table></div>');
}

function handlePreviewClick(event: MouseEvent<HTMLDivElement>): void {
  const anchor = (event.target as HTMLElement).closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  event.preventDefault();
  event.stopPropagation();

  try {
    const url = new URL(href, window.location.href).href;
    void window.scratchpad?.openExternal(url);
  } catch {
    // Ignore malformed links
  }
}

export function PreviewPane({ content }: PreviewPaneProps) {
  const html = useMemo(() => {
    if (!content.trim()) {
      return '<p class="preview-empty">Preview will appear here as you write markdown.</p>';
    }
    return wrapMarkdownTables(parseMarkdownPreview(content));
  }, [content]);

  return (
    <div className="preview-pane">
      <div className="pane-header">
        <span>Preview</span>
        <div className="pane-header-controls" aria-hidden="true" />
      </div>
      <div
        className="preview-content markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handlePreviewClick}
      />
    </div>
  );
}

export function useActiveContent(): string {
  const activeNote = useNotesStore((s) => s.getActiveNote());
  return activeNote?.content ?? '';
}
