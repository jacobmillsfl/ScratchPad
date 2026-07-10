export type ListTransformMode = 'list' | 'actions';

function stripListPrefix(line: string): string {
  const trimmed = line.trim();
  const checkbox = trimmed.match(/^-\s*\[[ xX]\]\s+(.*)$/);
  if (checkbox) return checkbox[1];
  const bullet = trimmed.match(/^-\s+(.*)$/);
  if (bullet) return bullet[1];
  const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
  if (numbered) return numbered[1];
  return trimmed;
}

export function transformLines(lines: string[], mode: ListTransformMode): string[] {
  return lines
    .map((line) => {
      if (!line.trim()) return null;
      const text = stripListPrefix(line);
      const indent = line.match(/^(\s*)/)?.[1] ?? '';
      if (mode === 'actions') {
        return `${indent}- [ ] ${text}`;
      }
      return `${indent}- ${text}`;
    })
    .filter((line): line is string => line !== null);
}

export function applyTransformToSelection(
  content: string,
  from: number,
  to: number,
  mode: ListTransformMode,
): { content: string; selectionFrom: number; selectionTo: number } {
  const before = content.slice(0, from);
  const selected = content.slice(from, to);
  const after = content.slice(to);

  const selectedLines = selected.split('\n');
  const transformed = transformLines(selectedLines, mode);
  const replacement = transformed.join('\n');

  const newContent = before + replacement + after;
  return {
    content: newContent,
    selectionFrom: from,
    selectionTo: from + replacement.length,
  };
}
