interface PaneToggleIconProps {
  side: 'left' | 'right';
  active: boolean;
}

export function PaneToggleIcon({ side, active }: PaneToggleIconProps) {
  const panelOpacity = active ? 1 : 0.3;

  if (side === 'left') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect
          x="1.5"
          y="2.5"
          width="13"
          height="11"
          rx="0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <rect x="2" y="3" width="4" height="10" rx="0.25" fill="currentColor" opacity={panelOpacity} />
        <line x1="6" y1="3" x2="6" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.45" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="1.5"
        y="2.5"
        width="13"
        height="11"
        rx="0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <rect x="10" y="3" width="4" height="10" rx="0.25" fill="currentColor" opacity={panelOpacity} />
      <line x1="10" y1="3" x2="10" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.45" />
    </svg>
  );
}
