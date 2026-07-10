const URL_PATTERN = /^https?:\/\/\S+$/i;

export function isUrl(text: string): boolean {
  return URL_PATTERN.test(text.trim());
}

export function urlToMarkdownLink(url: string): string | null {
  const trimmed = url.trim();
  if (!isUrl(trimmed)) return null;

  let label: string;
  try {
    const parsed = new URL(trimmed);
    const segments = parsed.pathname.split('/').filter(Boolean);
    label = segments.length > 0 ? segments[segments.length - 1] : parsed.hostname;
  } catch {
    const segments = trimmed.split('/').filter(Boolean);
    label = segments[segments.length - 1] ?? trimmed;
  }

  return `[${label}](${trimmed})`;
}

export function applyLinkTransformToSelection(
  content: string,
  from: number,
  to: number,
): { content: string; selectionFrom: number; selectionTo: number } | null {
  const before = content.slice(0, from);
  const selected = content.slice(from, to);
  const after = content.slice(to);

  const lines = selected.split('\n');
  const transformed = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    const link = urlToMarkdownLink(trimmed);
    if (!link) return line;
    const indent = line.match(/^(\s*)/)?.[1] ?? '';
    return `${indent}${link}`;
  });

  if (transformed.join('\n') === selected) return null;

  const replacement = transformed.join('\n');
  return {
    content: before + replacement + after,
    selectionFrom: from,
    selectionTo: from + replacement.length,
  };
}
