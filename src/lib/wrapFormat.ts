export type WrapFormat = 'bold' | 'italic' | 'code';

function wrapText(text: string, format: WrapFormat): string {
  switch (format) {
    case 'bold':
      return `**${text}**`;
    case 'italic':
      return `_${text}_`;
    case 'code':
      if (text.includes('\n')) {
        return `\`\`\`\n${text}\n\`\`\``;
      }
      return `\`${text}\``;
  }
}

export function applyWrapFormatToSelection(
  content: string,
  from: number,
  to: number,
  format: WrapFormat,
): { content: string; selectionFrom: number; selectionTo: number } | null {
  if (from === to) return null;

  const selected = content.slice(from, to);
  const wrapped = wrapText(selected, format);

  return {
    content: content.slice(0, from) + wrapped + content.slice(to),
    selectionFrom: from,
    selectionTo: from + wrapped.length,
  };
}
