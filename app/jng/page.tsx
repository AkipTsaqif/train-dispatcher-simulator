"use client";

// Jatinegara schematic preview (smoke test) — the generated layout rendered in
// schematic mode: no grid chrome, continuous markers, the 8-track throat with
// its 58 switches, 23 signals, and the multi-length JNG platforms.

import { JATINEGARA_DISPATCH } from "../dispatching/jatinegara";

const { map } = JATINEGARA_DISPATCH;
const PRESENTATION = map.presentation;
const VB = PRESENTATION.viewBox!;
const SHAPES = PRESENTATION.stationShapes ?? [];

// the three stub trains at their platform positions
const TRAINS = [
  { no: "J201", x: 850, y: 496, ang: 0, dir: "right" },
  { no: "J102", x: 464, y: 464, ang: 180, dir: "left" },
  { no: "J310", x: 430, y: 336, ang: 0, dir: "right" },
];

const ARROW_RIGHT = "M32,0 H41 M36,-4 L41,0 L36,4";
const ARROW_LEFT = "M-32,0 H-41 M-36,-4 L-41,0 L-36,4";

export default function JatinegaraPreview() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <h1 className="mb-2 text-sm font-semibold text-slate-600">
        Jatinegara — schematic mode (8 jalur, 58 wesel, 23 sinyal, peron multi-panjang)
      </h1>
      <svg
        viewBox={`${VB.minX} ${VB.minY} ${VB.width} ${VB.height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Jatinegara schematic preview"
      >
        {/* tracks from the compiled geometry */}
        <g stroke="#000" strokeWidth={2} strokeLinecap="round" fill="none">
          {map.trackPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* flyover glyphs (none here — kept for completeness) */}
        {map.levelCrossings.map((crossing, i) => {
          const [px, py] = crossing.point;
          const { dx, dy } = crossing.direction;
          const nx = -dy;
          const ny = dx;
          return (
            <g key={`flyover-${i}`}>
              <rect x={px - 8} y={py - 8} width={16} height={16} fill="#ffffff" />
              <line x1={px - dx * 12} y1={py - dy * 12} x2={px + dx * 12} y2={py + dy * 12} stroke="#000" strokeWidth={2} />
              <g stroke="#000" strokeWidth={2} strokeLinecap="round">
                <line x1={px - nx * 11 - dx * 4} y1={py - ny * 11 - dy * 4} x2={px - nx * 11 + dx * 4} y2={py - ny * 11 + dy * 4} />
                <line x1={px + nx * 11 - dx * 4} y1={py + ny * 11 - dy * 4} x2={px + nx * 11 + dx * 4} y2={py + ny * 11 + dy * 4} />
              </g>
            </g>
          );
        })}

        {/* the 8 multi-length platforms */}
        {SHAPES.map((shape, i) => {
          const h = shape.width ?? 10;
          const barY = shape.side === "down" ? shape.y + 8 : shape.y - 8 - h;
          return (
            <g key={`${shape.code}-${i}`}>
              <rect x={shape.x - shape.length / 2} y={barY} width={shape.length} height={h} rx={h / 2} fill="#94a3b8" stroke="#334155" strokeWidth={2} />
            </g>
          );
        })}
        <text x={200} y={262} fontSize={14} fontWeight={700} fill="#334155">Jatinegara</text>

        {/* signals at their compiled positions (red circles) */}
        {map.signals.items.map((sig) => (
          <g key={sig.id}>
            <circle cx={sig.x} cy={sig.y} r={4} fill={sig.block ? "#334155" : "#dc2626"} stroke="#0f172a" strokeWidth={1} />
            <text x={sig.x} y={sig.y - 9} textAnchor="middle" fontSize={9} fontWeight={700} fill="#334155">
              {sig.id}
            </text>
          </g>
        ))}

        {/* continuous train markers */}
        {TRAINS.map((t) => (
          <g
            key={t.no}
            transform={`translate(${t.x}, ${t.y}) rotate(${t.ang})`}
            aria-label={`Train ${t.no} at ${Math.round(t.x)},${Math.round(t.y)}`}
          >
            <rect x={-50} y={-11} width={100} height={22} rx={5} fill="#bfdbfe" stroke="#2563eb" strokeWidth={1.5} />
            <path d={t.dir === "right" ? ARROW_RIGHT : ARROW_LEFT} stroke="#1e3a8a" strokeWidth={2} strokeLinecap="round" fill="none" pointerEvents="none" />
            <text x={0} y={4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#1e3a8a">
              {t.no}
            </text>
          </g>
        ))}
      </svg>
    </main>
  );
}
