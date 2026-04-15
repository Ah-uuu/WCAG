export default function HpBar({ value = 0, max = 100, label = '', color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (
    pct >= 80 ? '#00ff41' :
    pct >= 50 ? '#ffd700' :
    pct >= 30 ? '#ff8c00' :
    '#ff4444'
  );
  const glowColor = color || (
    pct >= 80 ? '#00ff4155' :
    pct >= 50 ? '#ffd70055' :
    '#ff444455'
  );
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-pixel-gray text-xs">{label}</span>
          <span className="font-pixel text-xs" style={{ color: barColor }}>{value}/{max}</span>
        </div>
      )}
      <div className="hp-bar-track relative">
        <div
          className="hp-bar-fill"
          style={{ width: `${pct}%`, backgroundColor: barColor, boxShadow: `0 0 6px ${glowColor}` }}
        />
        <div className="absolute inset-0 flex pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(0,0,0,0.3) 9px, rgba(0,0,0,0.3) 10px)' }}
        />
      </div>
    </div>
  );
}
