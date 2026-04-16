export default function MpBar({ value = 0, max = 100, label = '', color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (
    pct >= 80 ? '#00bfff' :
    pct >= 50 ? '#4169e1' :
    pct >= 30 ? '#8a2be2' :
                '#ff00ff'
  );
  const glowColor = color || (
    pct >= 80 ? '#00bfff55' :
    pct >= 50 ? '#4169e155' :
                '#8a2be255'
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
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 6px ${glowColor}`,
          }}
        />
        <div
          className="absolute inset-0 flex pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 9px, rgba(0,0,0,0.3) 9px, rgba(0,0,0,0.3) 10px)',
          }}
        />
      </div>
    </div>
  );
}
