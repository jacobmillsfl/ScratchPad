export function getModKey(): 'Cmd' | 'Ctrl' {
  if (typeof navigator === 'undefined') return 'Cmd';
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform) ? 'Cmd' : 'Ctrl';
}

export function getAltKey(): 'Option' | 'Alt' {
  return getModKey() === 'Cmd' ? 'Option' : 'Alt';
}
