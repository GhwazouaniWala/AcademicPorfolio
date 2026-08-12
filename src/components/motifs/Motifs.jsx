// Small abstract signal-readout motifs. Each one stands in for a project
// screenshot with something that visually echoes what the project measures.

export function Waveform({ className = "" }) {
  return (
    <svg viewBox="0 0 320 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M0 60 L20 60 L30 30 L40 90 L50 15 L60 105 L70 45 L80 75 L90 60 L110 60 L120 20 L130 100 L140 40 L150 80 L160 60 L180 60 L190 35 L200 95 L210 25 L220 90 L230 55 L240 65 L250 60 L270 60 L280 40 L290 85 L300 60 L320 60"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-signal"
        opacity="0.85"
      />
      <path
        d="M0 60 L320 60"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="2 6"
        className="text-line"
      />
    </svg>
  );
}

export function Candlestick({ className = "" }) {
  const candles = [
    { x: 10, o: 60, c: 40, h: 30, l: 68 },
    { x: 30, o: 40, c: 55, h: 34, l: 62 },
    { x: 50, o: 55, c: 30, h: 24, l: 60 },
    { x: 70, o: 30, c: 45, h: 22, l: 50 },
    { x: 90, o: 45, c: 20, h: 16, l: 48 },
    { x: 110, o: 20, c: 35, h: 14, l: 42 },
    { x: 130, o: 35, c: 65, h: 30, l: 72 },
    { x: 150, o: 65, c: 50, h: 44, l: 74 },
    { x: 170, o: 50, c: 58, h: 40, l: 66 },
    { x: 190, o: 58, c: 28, h: 22, l: 64 },
    { x: 210, o: 28, c: 40, h: 20, l: 46 },
    { x: 230, o: 40, c: 22, h: 16, l: 48 },
    { x: 250, o: 22, c: 38, h: 14, l: 44 },
    { x: 270, o: 38, c: 30, h: 24, l: 46 },
    { x: 290, o: 30, c: 48, h: 22, l: 54 },
  ];
  return (
    <svg viewBox="0 0 320 100" className={className} aria-hidden="true">
      {candles.map((c, i) => {
        const up = c.c < c.o;
        return (
          <g key={i} className={up ? "text-signal" : "text-attention"}>
            <line x1={c.x} x2={c.x} y1={c.h} y2={c.l} stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <rect
              x={c.x - 4}
              y={Math.min(c.o, c.c)}
              width="8"
              height={Math.max(2, Math.abs(c.c - c.o))}
              fill="currentColor"
              opacity="0.85"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Radar({ className = "" }) {
  const cx = 60, cy = 60, r = 50;
  const n = 14;
  const points = Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const val = 0.45 + 0.5 * Math.abs(Math.sin(i * 1.7 + 1));
    return [cx + Math.cos(angle) * r * val, cy + Math.sin(angle) * r * val];
  });
  const path = points.map((p) => p.join(",")).join(" ");
  const rings = [0.33, 0.66, 1];
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      {rings.map((f, i) => (
        <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke="currentColor" className="text-line" strokeWidth="0.75" />
      ))}
      <polygon points={path} fill="rgba(88,230,207,0.12)" stroke="currentColor" className="text-signal" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

export function ScriptGrid({ className = "" }) {
  const cells = 8;
  const cellSize = 14;
  const seed = [3, 7, 2, 9, 5, 1, 8, 4, 6, 2, 9, 3, 5, 7, 1, 8, 4, 6, 2, 9, 3, 5, 7, 1, 4, 6, 2, 9, 8, 3, 5, 1, 7, 4, 6, 2, 9, 5, 3, 8, 1, 6, 4, 7, 2, 9, 5, 3, 8, 6, 1, 4, 7, 2, 9, 5, 3, 8, 6, 1, 4, 7];
  return (
    <svg viewBox={`0 0 ${cells * cellSize} ${cells * cellSize}`} className={className} aria-hidden="true">
      {Array.from({ length: cells * cells }, (_, i) => {
        const x = (i % cells) * cellSize;
        const y = Math.floor(i / cells) * cellSize;
        const v = seed[i % seed.length];
        const on = v > 4;
        return (
          <rect
            key={i}
            x={x + 2}
            y={y + 2}
            width={cellSize - 4}
            height={cellSize - 4}
            rx="1.5"
            className={on ? "text-signal" : "text-line"}
            fill="currentColor"
            opacity={on ? 0.15 + (v / 9) * 0.55 : 0.4}
          />
        );
      })}
    </svg>
  );
}
