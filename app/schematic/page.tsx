"use client";

// Phase 7 smoke test — the flyover fixture rendered in SCHEMATIC mode:
// no grid chrome, train markers at true continuous positions rotated to their
// segment bearings, authored platform shapes, and the bridge glyph where the
// level-1 ramp crosses the middle line. Not part of the main Bekasi UI.

import { FLYOVER_FIXTURE_DISPATCH } from "../dispatching/flyover-fixture";

const { map } = FLYOVER_FIXTURE_DISPATCH;
const PRESENTATION = map.presentation;
const VB = PRESENTATION.viewBox!;
const SHAPES = PRESENTATION.stationShapes ?? [];

// a few static train markers at continuous positions (x, y, segment, dir)
const TRAINS = [
  { no: "F1", x: 1300, y: 89, ang: 180, moving: false },
  { no: "F2", x: 820, y: 141.2, ang: Math.atan2(205 - 89, 600 - 1000) * 180 / Math.PI, moving: true },
  { no: "F3", x: 700, y: 147, ang: 180, moving: false },
];

export default function SchematicPreview() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <h1 className="mb-2 text-sm font-semibold text-slate-600">
        Schematic mode — flyover fixture (no grid chrome, continuous markers, bridge glyph)
      </h1>
      <svg
        viewBox={`${VB.minX} ${VB.minY} ${VB.width} ${VB.height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Schematic flyover preview"
      >
        {/* tracks from the compiled geometry */}
        <g stroke="#000" strokeWidth={2} strokeLinecap="round" fill="none">
          {map.trackPaths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {/* flyover: gap in the lower line + bridge piers on the upper ramp */}
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

        {/* authored platform shapes */}
        {SHAPES.map((shape) => {
          const h = shape.width ?? 10;
          const barY = shape.side === "down" ? shape.y + 8 : shape.y - 8 - h;
          return (
            <g key={shape.code}>
              <rect x={shape.x - shape.length / 2} y={barY} width={shape.length} height={h} rx={h / 2} fill="#94a3b8" stroke="#334155" strokeWidth={2} />
              <text x={shape.x} y={barY + (shape.side === "down" ? h + 14 : -6)} textAnchor="middle" fontSize={13} fontWeight={700} fill="#334155">
                {map.stations.namesByCode[shape.code] ?? shape.code}
              </text>
            </g>
          );
        })}

        {/* signals at their compiled positions */}
        {map.signals.items.map((sig) => (
          <g key={sig.id}>
            <circle cx={sig.x} cy={sig.y} r={4} fill={sig.block ? "#334155" : "#dc2626"} stroke="#0f172a" strokeWidth={1} />
            <text x={sig.x} y={sig.y - 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="#334155">
              {sig.id}
            </text>
          </g>
        ))}

        {/* continuous train markers (true x/y, rotated to the segment bearing) */}
        {TRAINS.map((t) => (
          <g
            key={t.no}
            transform={`translate(${t.x}, ${t.y}) rotate(${t.ang})`}
            aria-label={`Train ${t.no} at ${Math.round(t.x)},${Math.round(t.y)}`}
          >
            <rect x={-50} y={-11} width={100} height={22} rx={5} fill="#bfdbfe" stroke={t.moving ? "#2563eb" : "#16a34a"} strokeWidth={1.5} />
            <text x={0} y={4} textAnchor="middle" fontSize={12} fontWeight={800} fill="#1e3a8a">
              {t.no}
            </text>
          </g>
        ))}
      </svg>
    </main>
  );
}
