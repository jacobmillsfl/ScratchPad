import { useMemo, useState } from 'react';
import { getAltKey, getModKey } from '../lib/shortcutLabel';

export function MacroHelpButton() {
  const [open, setOpen] = useState(false);
  const mod = getModKey();
  const alt = getAltKey();

  const macros = useMemo(
    () => [
      { name: 'new tab', shortcut: `${mod}+T` },
      { name: 'find', shortcut: `${mod}+F` },
      { name: 'replace', shortcut: `${mod}+${alt}+F` },
      { name: 'find next', shortcut: `${mod}+G` },
      { name: 'bold', shortcut: `${mod}+B` },
      { name: 'italic', shortcut: `${mod}+I` },
      { name: 'code', shortcut: `${mod}+\`` },
      { name: 'list', shortcut: `${mod}+Shift+L` },
      { name: 'actions', shortcut: `${mod}+Shift+A` },
      { name: 'link', shortcut: `${mod}+Shift+H` },
    ],
    [mod, alt],
  );

  return (
    <div
      className="macro-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="pane-toggle macro-help-btn"
        aria-label="Keyboard shortcuts"
        aria-expanded={open}
      >
        ?
      </button>
      {open && (
        <div className="macro-help-tooltip" aria-hidden="true">
          {macros.map(({ name, shortcut }) => (
            <div key={name} className="macro-help-line">
              {name} : {shortcut}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
