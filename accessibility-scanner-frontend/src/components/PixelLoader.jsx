export default function PixelLoader({ message = 'LOADING...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <div className="relative w-16 h-16">
        {[0,1,2,3,4,5,6,7].map((i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-pixel-green"
            style={{
              animation: `blink 0.8s step-end ${i * 0.1}s infinite`,
              transform: `rotate(${i * 45}deg) translateY(-24px)`,
              transformOrigin: '6px 6px',
              top: '50%', left: '50%', marginTop: '-6px', marginLeft: '-6px',
            }}
          />
        ))}
      </div>
      <div className="font-pixel text-xs text-pixel-green text-glow-green blink-cursor">{message}</div>
      <div className="flex gap-2">
        {[0,1,2].map((i) => (
          <div key={i} className="w-3 h-3 bg-pixel-green"
            style={{ animation: `blink 0.6s step-end ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

export function ScanLoader({ url }) {
  const messages = [
    '▶ INITIALIZING DUNGEON CRAWLER...',
    '▶ CONNECTING TO TARGET...',
    '▶ CASTING ACCESSIBILITY SPELL...',
    '▶ ANALYZING WCAG VIOLATIONS...',
    '▶ COUNTING ENEMIES...',
  ];
  return (
    <div className="pixel-box p-8 text-center">
      <div className="text-4xl mb-6 animate-bounce">⚔️</div>
      <div className="font-pixel text-pixel-green text-xs mb-2">SCANNING DUNGEON</div>
      {url && (
        <div className="font-pixel text-pixel-yellow text-xs mb-6 break-all">
          ▸ {url.substring(0, 40)}{url.length > 40 ? '...' : ''}
        </div>
      )}
      <div className="hp-bar-track mb-4">
        <div className="hp-bar-fill bg-pixel-green"
          style={{ width: '60%', boxShadow: '0 0 8px #00ff4155', animation: 'float 2s ease-in-out infinite' }} />
      </div>
      <div className="space-y-2 text-left mt-6">
        {messages.map((msg, i) => (
          <div key={i} className="font-pixel text-xs text-pixel-gray"
            style={{ animation: `blink 0.5s step-end ${i * 1.5}s 1 forwards`, opacity: 0 }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
