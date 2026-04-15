export function ShieldSprite({ size = 32, color = '#00ff41' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="1" width="8" height="1" fill={color} />
      <rect x="2" y="2" width="12" height="1" fill={color} />
      <rect x="2" y="3" width="12" height="8" fill={color} />
      <rect x="3" y="11" width="10" height="2" fill={color} />
      <rect x="4" y="13" width="8" height="1" fill={color} />
      <rect x="5" y="14" width="6" height="1" fill={color} />
      <rect x="6" y="15" width="4" height="1" fill={color} />
      <rect x="7" y="5" width="2" height="4" fill="#0a0a0f" />
      <rect x="5" y="7" width="6" height="2" fill="#0a0a0f" />
    </svg>
  );
}

export function SwordSprite({ size = 32, color = '#ffd700' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="8" y="1" width="2" height="1" fill={color} />
      <rect x="7" y="2" width="2" height="8" fill={color} />
      <rect x="5" y="10" width="6" height="2" fill={color} />
      <rect x="7" y="12" width="2" height="3" fill="#888" />
      <rect x="6" y="14" width="4" height="1" fill="#888" />
    </svg>
  );
}

export function CrownSprite({ size = 32, color = '#ffd700' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="10" width="14" height="4" fill={color} />
      <rect x="1" y="9"  width="2"  height="2" fill={color} />
      <rect x="7" y="8"  width="2"  height="3" fill={color} />
      <rect x="13" y="9" width="2"  height="2" fill={color} />
      <rect x="1" y="7"  width="2"  height="3" fill={color} />
      <rect x="13" y="7" width="2"  height="3" fill={color} />
      <rect x="7" y="6"  width="2"  height="3" fill={color} />
      <rect x="3" y="11" width="2" height="2" fill="#ff4444" />
      <rect x="7" y="11" width="2" height="2" fill="#00e5ff" />
      <rect x="11" y="11" width="2" height="2" fill="#b14aff" />
    </svg>
  );
}

export function StarSprite({ size = 24, color = '#ffd700' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="7" y="1" width="2" height="3" fill={color} />
      <rect x="6" y="4" width="4" height="2" fill={color} />
      <rect x="1" y="6" width="14" height="2" fill={color} />
      <rect x="3" y="8" width="10" height="2" fill={color} />
      <rect x="2" y="10" width="4" height="3" fill={color} />
      <rect x="10" y="10" width="4" height="3" fill={color} />
      <rect x="7" y="12" width="2" height="2" fill={color} />
    </svg>
  );
}

export function BugSprite({ size = 24, color = '#ff4444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="5" y="2" width="6" height="6" fill={color} />
      <rect x="4" y="3" width="8" height="4" fill={color} />
      <rect x="5" y="3" width="2" height="2" fill="#fff" />
      <rect x="9" y="3" width="2" height="2" fill="#fff" />
      <rect x="6" y="3" width="1" height="1" fill="#000" />
      <rect x="10" y="3" width="1" height="1" fill="#000" />
      <rect x="5" y="8" width="6" height="5" fill={color} />
      <rect x="4" y="9" width="8" height="3" fill={color} />
      <rect x="2" y="9" width="3" height="1" fill={color} />
      <rect x="11" y="9" width="3" height="1" fill={color} />
      <rect x="1" y="11" width="4" height="1" fill={color} />
      <rect x="11" y="11" width="4" height="1" fill={color} />
    </svg>
  );
}
