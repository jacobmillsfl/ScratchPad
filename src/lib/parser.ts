export interface ActionItem {
  id: string;
  noteId: string;
  section: string;
  text: string;
  done: boolean;
  lineIndex: number;
}

export interface ParsedNote {
  title: string;
  sections: { name: string; lineIndex: number }[];
  actions: ActionItem[];
}

const SECTION_HEADER = /^#{1,6}\s+(.+)$/;
const ALL_CAPS_HEADER = /^[A-Z][A-Z0-9\s/&.-]{2,}$/;
const DIVIDER = /^-{3,}\s*$/;
const ACTION_CHECKBOX = /^-\s*\[([ xX])\]\s+(.*)$/;

function makeActionId(noteId: string, lineIndex: number): string {
  return `${noteId}:${lineIndex}`;
}

export function deriveTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || DIVIDER.test(trimmed)) continue;

    const mdMatch = trimmed.match(SECTION_HEADER);
    if (mdMatch) return mdMatch[1].trim();

    if (ALL_CAPS_HEADER.test(trimmed)) return trimmed;

    return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
  }
  return 'Untitled';
}

export function parseNote(noteId: string, content: string): ParsedNote {
  const lines = content.split('\n');
  const sections: { name: string; lineIndex: number }[] = [];
  const actions: ActionItem[] = [];
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const mdHeader = trimmed.match(SECTION_HEADER);
    if (mdHeader) {
      currentSection = mdHeader[1].trim();
      sections.push({ name: currentSection, lineIndex: i });
      continue;
    }

    if (ALL_CAPS_HEADER.test(trimmed) && !DIVIDER.test(trimmed)) {
      currentSection = trimmed;
      sections.push({ name: currentSection, lineIndex: i });
      continue;
    }

    const checkbox = trimmed.match(ACTION_CHECKBOX);
    if (checkbox) {
      actions.push({
        id: makeActionId(noteId, i),
        noteId,
        section: currentSection,
        text: checkbox[2].trim(),
        done: checkbox[1].toLowerCase() === 'x',
        lineIndex: i,
      });
      continue;
    }
  }

  return {
    title: deriveTitle(content),
    sections,
    actions,
  };
}

export function toggleActionInContent(content: string, lineIndex: number, done: boolean): string {
  const lines = content.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return content;

  const line = lines[lineIndex];
  const checkbox = line.trim().match(ACTION_CHECKBOX);
  if (checkbox) {
    const indent = line.match(/^(\s*)/)?.[1] ?? '';
    lines[lineIndex] = `${indent}- [${done ? 'x' : ' '}] ${checkbox[2]}`;
    return lines.join('\n');
  }

  return content;
}

