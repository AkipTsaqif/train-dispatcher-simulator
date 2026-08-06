"use client";

import { useEffect, useRef, useState } from "react";
import {
  TRAINS,
  buildJourney,
  initTrain,
  advanceTrain,
  occupiedSections,
  reservationAhead,
  signalSections,
  type JourneyPlan,
  type Train,
  type TrainState,
  type MoveCtx,
} from "../lib/trains";

type SwitchState = "normal" | "reversed";
type Aspect = "red" | "amber" | "green";
type Dir = "right" | "left";

const CELL = 58; // grid cell size in viewBox units

const EXT = 10; // how many cells the running lines are extended at the right end
const CUT_LEFT = 3; // columns (A–C) cut from the left side of the map
const SHIFT = (EXT - CUT_LEFT) * CELL; // diagram translate — the left extension is now 7 cells (406)
const RIGHT = (21 + EXT * 2 - CUT_LEFT) * CELL; // full width in cells: 21 + EXT + (EXT − CUT_LEFT) = 2204

/** Spreadsheet-style column letter for a 0-based index (0=A, 25=Z, 26=AA, ...). */
const colsName = (i: number): string => {
  let n = i;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

// ---------------------------------------------------------------------------
// Points (signal-box numbering P1..P8)
// ---------------------------------------------------------------------------
type Sw = {
  id: number;
  x: number; // junction point on the main line
  y: number;
  lineY: number; // y of the main line through this point
  dashSide: "left" | "right"; // side the diverging branch leaves from; that side's straight is dashed when reversed
  branch: string; // diverging track (full length; rendered only inside this point's cell)
  label: string;
};

const SWITCHES: Sw[] = [
  { id: 1, x: 326, y: 89, lineY: 89, dashSide: "right", branch: "M326 90 L438 205", label: "left crossover, upper end" },
  { id: 2, x: 438, y: 205, lineY: 205, dashSide: "left", branch: "M326 90 L438 205", label: "left crossover, lower end" },
  { id: 3, x: 500, y: 89, lineY: 89, dashSide: "right", branch: "M500 89 L556 148", label: "upper loop, west end" },
  { id: 4, x: 786, y: 89, lineY: 89, dashSide: "left", branch: "M730 148 L786 89", label: "upper loop, east end" },
  { id: 5, x: 500, y: 205, lineY: 205, dashSide: "right", branch: "M500 205 L556 264", label: "lower loop, west end" },
  { id: 6, x: 788, y: 205, lineY: 205, dashSide: "left", branch: "M730 264 L788 205", label: "lower loop, east end" },
  { id: 7, x: 846, y: 205, lineY: 205, dashSide: "right", branch: "M846 205 L960 89", label: "right crossover, lower end" },
  { id: 8, x: 960, y: 89, lineY: 89, dashSide: "left", branch: "M846 205 L960 89", label: "right crossover, upper end" },
];

/**
 * Coupled crossover pairs: one mechanical unit — both ends always share a single
 * state, and a lock on either end locks the pair.
 */
const COUPLED: number[][] = [
  [1, 2], // left crossover
  [7, 8], // right crossover
];

/**
 * One controllably distinct point control: a single button per coupled pair,
 * placed at the midpoint between the two physical ends (e.g. P1 F2 + P2 H4 → G3).
 */
type PointControl = { ids: number[]; x: number; y: number; coupled: boolean; label: string };
const POINT_CONTROLS: PointControl[] = (() => {
  const coupledSet = new Set(COUPLED.flat());
  const controls: PointControl[] = [];
  for (const sw of SWITCHES) {
    if (coupledSet.has(sw.id)) continue;
    controls.push({ ids: [sw.id], x: sw.x, y: sw.y, coupled: false, label: sw.label });
  }
  for (const group of COUPLED) {
    const [a, b] = [SWITCHES.find((s) => s.id === group[0])!, SWITCHES.find((s) => s.id === group[1])!];
    controls.push({
      ids: [...group],
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      coupled: true,
      label: `${a.label.split(",")[0]}`,
    });
  }
  return controls.sort((a, b) => a.x - b.x);
})();

// ---------------------------------------------------------------------------
// Track graph — junctions & track ends. Each node: straight continuation per
// direction, optional point, and an optional diverging branch (a path of nodes
// ending at the far point that must be set to rejoin the other line).
// ---------------------------------------------------------------------------
type GNode = {
  x: number;
  y: number;
  straight: Record<Dir, string | null>;
  branch?: Partial<Record<Dir, { path: string[]; farSw: number }>>;
  sw?: number;
};

const NODES: Record<string, GNode> = {
  // top line (y=89) — traffic runs right → left
  tlL: { x: -SHIFT, y: 89, straight: { right: "p1", left: null } },
  p1: { x: 326, y: 89, sw: 1, straight: { right: "p3", left: "tlL" }, branch: { right: { path: ["p2"], farSw: 2 } } },
  p3: { x: 500, y: 89, sw: 3, straight: { right: "p4", left: "p1" }, branch: { right: { path: ["ul1", "ul2", "p4"], farSw: 4 } } },
  ul1: { x: 556, y: 148, straight: { right: "ul2", left: "p3" } },
  ul2: { x: 730, y: 148, straight: { right: "p4", left: "ul1" } },
  p4: { x: 786, y: 89, sw: 4, straight: { right: "p8", left: "p3" }, branch: { left: { path: ["ul2", "ul1", "p3"], farSw: 3 } } },
  p8: { x: 960, y: 89, sw: 8, straight: { right: "tlR", left: "p4" }, branch: { left: { path: ["p7"], farSw: 7 } } },
  tlR: { x: 1218 + EXT * CELL, y: 89, straight: { right: null, left: "p8" } },
  // bottom line (y=205) — traffic runs left → right
  blL: { x: -SHIFT, y: 205, straight: { right: "p2", left: null } },
  p2: { x: 438, y: 205, sw: 2, straight: { right: "p5", left: "blL" }, branch: { left: { path: ["p1"], farSw: 1 } } },
  p5: { x: 500, y: 205, sw: 5, straight: { right: "p6", left: "p2" }, branch: { right: { path: ["ll1", "ll2", "p6"], farSw: 6 } } },
  ll1: { x: 556, y: 264, straight: { right: "ll2", left: "p5" } },
  ll2: { x: 730, y: 264, straight: { right: "p6", left: "ll1" } },
  p6: { x: 788, y: 205, sw: 6, straight: { right: "p7", left: "p5" }, branch: { left: { path: ["ll2", "ll1", "p5"], farSw: 5 } } },
  p7: { x: 846, y: 205, sw: 7, straight: { right: "blR", left: "p6" }, branch: { right: { path: ["p8"], farSw: 8 } } },
  blR: { x: 1218 + EXT * CELL, y: 205, straight: { right: null, left: "p7" } },
};

// ---------------------------------------------------------------------------
// Signals — mount "up" = head above the track, "down" = below.
// edge = [behind node, ahead node] in the signal's travel direction.
// ---------------------------------------------------------------------------
type SignalDef = {
  id: string; // internal id — unique, used for routing logic, keys, lookups
  code?: string; // display code shown on the diagram/buttons (defaults to id)
  x: number;
  y: number;
  lineY: number;
  dir: Dir;
  mount: "up" | "down";
  edge: [string, string];
  label: string;
  block?: boolean; // automatic block signal — always mirrors the next signal, not controllable
  ai?: boolean; // AI-controlled entry signal — not player-controllable (red until the AI clears it)
};

const SIGNALS: SignalDef[] = [
  { id: "S1", x: 322, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "bottom line, right direction" },
  { id: "S2", x: 730, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p5", "p6"], label: "bottom line, left of P6" },
  { id: "S3", x: 730, y: 264, lineY: 264, dir: "right", mount: "down", edge: ["ll1", "ll2"], label: "lower loop (siding), right direction" },
  { id: "S4", x: 1076, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "top line, two cells right of P8" },
  { id: "S5", x: 558, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p4", "p3"], label: "top line, right of P3" },
  { id: "S6", x: 558, y: 148, lineY: 148, dir: "left", mount: "up", edge: ["ul2", "ul1"], label: "upper loop (siding), left direction" },
  { id: "S7", x: 558, y: 264, lineY: 264, dir: "left", mount: "down", edge: ["ll2", "ll1"], label: "lower loop (reversed siding), left direction" },
  // automatic block signals on the bottom-line approach (always mirror the next signal).
  // B101 is the smallest number and lies closest to S1 (J4); higher numbers reach further
  // left (G4, D4, A4).
  { id: "B101", x: 145, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, J4", block: true },
  { id: "B102", x: -29, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, G4", block: true },
  { id: "B103", x: -203, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, D4", block: true },
  { id: "B104", x: -377, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, A4", block: true },
  // top-line approach (right→left): blocks J2→G2→D2→A2 (A2 = B201 at the map edge;
  // the former AI entry signal was cut with columns A–C)
  { id: "B201", x: -377, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, A2", block: true },
  { id: "B202", x: -203, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, D2", block: true },
  { id: "B203", x: -29, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, G2", block: true },
  { id: "B204", x: 145, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, J2", block: true },
  // top-line right approach: blocks AC2..AL2 nearest to S4. Displayed as
  // B201..B204 (internal ids stay unique — two sets share the same codes).
  { id: "B9", code: "B201", x: 1247, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AC2", block: true },
  { id: "B10", code: "B202", x: 1421, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AF2", block: true },
  { id: "B11", code: "B203", x: 1595, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AI2", block: true },
  { id: "B12", code: "B204", x: 1769, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AL2", block: true },
  // bottom-line right exit: blocks AC4..AL4 — entry root is beyond the map, so no next
  // signal here and they all read green. Numbered away from the map (B109 = AC4 nearest).
  { id: "B109", x: 1247, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AC4", block: true },
  { id: "B108", x: 1421, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AF4", block: true },
  { id: "B107", x: 1595, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AI4", block: true },
  { id: "B106", x: 1769, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AL4", block: true },
];

/** Display code for a signal — internal ids may differ from what is shown on the page. */
const codeOf = (id: string): string => SIGNALS.find((s) => s.id === id)?.code ?? id;

// ---------------------------------------------------------------------------
// All track geometry (always drawn solid black; per-cell styling is overlaid)
// ---------------------------------------------------------------------------
const ALL_TRACKS: string[] = [
  // running-line extensions (EXT cells at the right end, EXT−CUT_LEFT at the left)
  `M${-SHIFT} 89 H64`, `M1162 89 H${1218 + EXT * CELL}`,
  `M${-SHIFT} 205 H62`, `M1162 205 H${1218 + EXT * CELL}`,
  "M64 89 H326", "M326 89 H500", "M500 89 H786", "M786 89 H960", "M960 89 H1162",
  "M62 205 H438", "M438 205 H500", "M500 205 H788", "M788 205 H846", "M846 205 H1162",
  "M326 90 L438 205",
  "M846 205 L960 89",
  "M500 89 L556 148", "M556 148 H730", "M730 148 L786 89",
  "M500 205 L556 264", "M556 264 H730", "M730 264 L788 205",
];

const INITIAL_SWITCHES: Record<number, SwitchState> = {
  1: "normal", 2: "normal", 3: "normal", 4: "normal",
  5: "normal", 6: "normal", 7: "normal", 8: "normal",
};

// Main-line normal traffic direction by line y (top runs right→left, bottom left→right).
const NORMAL_DIR: Record<number, Dir> = { 89: "left", 205: "right" };
const TOP_LINE_Y = 89;

// Simulation speed scales (×1 real-time through ×10).
const TIME_SCALES = [1, 2, 5, 10] as const;
type TimeScale = (typeof TIME_SCALES)[number];

/** Simulation clock display, HH:MM:SS.hh (hours may exceed two digits). */
const fmtTime = (sec: number): string => {
  const total = Math.floor(sec);
  const cs = Math.floor(sec * 100) % 100;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":") + "." + String(cs).padStart(2, "0");
};

// ---------------------------------------------------------------------------
// Stations — two layers: the full-name nameplates between the running lines,
// and the platform cells that form each station's footprint (tagged with the
// official station code). Cell refs are grid letters/rows; origins are computed
// in pre-shift coordinates (rendered inside the shifted diagram).
// ---------------------------------------------------------------------------
// Column letter → 0-based index (A=0, Z=25, AA=26, ...).
const colIdx = (letters: string): number => {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

// Nameplates — merged-cell plates between the running lines.
type Station = { name: string; x: number; y: number; w: number; h: number };
const STATIONS: Station[] = [
  { name: "Bekasi Timur", x: 58 - SHIFT, y: 116, w: 116, h: 58 }, // cells B3–C3, row 3
  { name: "Tambun", x: 986 - SHIFT, y: 0, w: 116, h: 58 }, // cells R1–S1, row 1
  { name: "Cibitung", x: 2030 - SHIFT, y: 116, w: 116, h: 58 }, // cells AJ3–AK3, row 3
];

type StationCell = { code: string; cells: { col: string; row: number }[] };
const STATION_CELLS: StationCell[] = [
  // B2–C2 and B4–C4 → BKST (Bekasi Timur)
  { code: "BKST", cells: [{ col: "B", row: 2 }, { col: "C", row: 2 }, { col: "B", row: 4 }, { col: "C", row: 4 }] },
  // R2–S2, R3–S3, R4–S4, R5–S5 → TB (Tambun)
  { code: "TB", cells: [{ col: "R", row: 2 }, { col: "S", row: 2 }, { col: "R", row: 3 }, { col: "S", row: 3 }, { col: "R", row: 4 }, { col: "S", row: 4 }, { col: "R", row: 5 }, { col: "S", row: 5 }] },
  // AJ2–AK2 and AJ4–AK4 → CIT (Cibitung)
  { code: "CIT", cells: [{ col: "AJ", row: 2 }, { col: "AK", row: 2 }, { col: "AJ", row: 4 }, { col: "AK", row: 4 }] },
];

/** Station footprint cell → pre-shift origin inside the shifted diagram. */
const cellOrigin = (c: { col: string; row: number }): [number, number] => [colIdx(c.col) * CELL - SHIFT, (c.row - 1) * CELL];

// Top-line platform CENTER x per station code (row-2 cells of the footprint),
// used by the train journey planner.
const PLATFORM_CENTER_X: Record<string, number> = Object.fromEntries(
  STATION_CELLS.map((st) => {
    const cols = st.cells.filter((c) => c.row === 2).map((c) => colIdx(c.col));
    return [st.code, ((Math.min(...cols) + Math.max(...cols) + 1) / 2) * CELL - SHIFT];
  })
);

// Prototype trains: journey plans (schedule → per-leg speeds) + static sections.
const JOURNEYS: { train: Train; plan: JourneyPlan }[] = TRAINS.map((tr) => ({
  train: tr,
  plan: buildJourney(tr.stops, PLATFORM_CENTER_X, TOP_LINE_Y, NODES, "left"),
}));
const SIGNAL_SECTIONS = signalSections(SIGNALS.map((s) => ({ id: s.id, x: s.x, y: s.lineY, dir: s.dir })));

// ---------------------------------------------------------------------------
// Route walker: from a signal, walk the graph in its direction, following
// points (divert / block) until the next same-direction signal or the end.
// ---------------------------------------------------------------------------
type Route = { d: string; note: string; nextSignalId?: string; pts: [number, number][]; blocked?: boolean };

const walkRoute = (
  sig: SignalDef,
  switches: Record<number, SwitchState>
): Route => {
  const dir = sig.dir;
  const pts: [number, number][] = [[sig.x, sig.y]];
  const toD = () => "M" + pts.map(([x, y]) => `${x},${y}`).join(" ");

  const done = (note: string, nextSignalId?: string, blocked = false): Route => ({
    d: toD(),
    note,
    nextSignalId,
    blocked,
    pts,
  });

  // Next same-direction signal between fromX and node (along that line) — the closest
  const nextSignalOn = (fromX: number, node: GNode): SignalDef | undefined => {
    const lo = Math.min(fromX, node.x);
    const hi = Math.max(fromX, node.x);
    const cands = SIGNALS.filter(
      (s) =>
        s.dir === dir &&
        s.id !== sig.id &&
        s.lineY === node.y &&
        lo < s.x &&
        s.x <= hi // inclusive: signals sitting at a corner node count
    );
    if (!cands.length) return undefined;
    return cands.reduce((a, b) => (dir === "right" ? (a.x < b.x ? a : b) : a.x > b.x ? a : b));
  };

  let cur: string | null = sig.edge[1];
  let incoming: string = sig.edge[0]; // node we're arriving from
  while (cur && NODES[cur]) {
    const node: GNode = NODES[cur];
    const fromX = pts[pts.length - 1][0];

    // stop at the next same-direction signal on this segment
    const hit = nextSignalOn(fromX, node);
    if (hit) {
      pts.push([hit.x, hit.y]);
      return done(`to ${hit.id}`, hit.id);
    }

    if (node.sw !== undefined) {
      const reversed = switches[node.sw] === "reversed";
      const branchAhead = node.branch?.[dir];
      // arriving via the branch edge (loop/crossover exit) — the point must be
      // reversed for the exit to be open, otherwise the route ends here
      const cameFromBranch =
        (node.branch?.right?.path[0] ?? node.branch?.left?.path[0]) === incoming;
      if (cameFromBranch) {
        if (!reversed) {
          pts.push([node.x, node.y]);
          return done(`ends at P${node.sw}`, undefined, true);
        }
      } else if (branchAhead && reversed) {
        // divert: push this junction first (in path order), then the branch path
        pts.push([node.x, node.y]);
        for (let i = 0; i < branchAhead.path.length; i++) {
          const nid = branchAhead.path[i];
          const n = NODES[nid];
          const nx = pts[pts.length - 1][0];
          const hit2 = nextSignalOn(nx, n);
          if (hit2) {
            pts.push([hit2.x, hit2.y]);
            return done(`to ${hit2.id}`, hit2.id);
          }
          pts.push([n.x, n.y]);
        }
        const last = branchAhead.path.length - 1;
        const far = NODES[branchAhead.path[last]];
        if (switches[branchAhead.farSw] === "reversed") {
          // rejoin the other line and keep going in the same direction
          incoming = last >= 1 ? branchAhead.path[last - 1] : cur;
          cur = far.straight[dir];
          if (!cur) return done(dir === "right" ? "to the far right" : "to the far left");
          continue; // junction already pushed — skip the fall-through push
        }
        // exit not set — trapped at the far end
        return done(`ends at P${branchAhead.farSw} — not set`, undefined, true);
      } else if (reversed) {
        // branch behind (or none) + reversed = straight blocked
        pts.push([node.x, node.y]);
        return done(`ends at P${node.sw}`, undefined, true);
      }
    }

    pts.push([node.x, node.y]);
    const next = node.straight[dir];
    incoming = cur;
    cur = next;
    if (!cur) {
      return done(dir === "right" ? "to the far right" : "to the far left");
    }
  }
  return done("unknown", undefined, true);
};

// ---------------------------------------------------------------------------
// Geometric conflict detection: two routes conflict if any of their segments
// share a positive-length portion (collinear overlap or a proper crossing).
// Meeting at a single point (block boundary) is NOT a conflict.
// ---------------------------------------------------------------------------
const segsOverlap = (a: [number, number][], b: [number, number][]): boolean => {
  const [p1, p2] = a;
  const [q1, q2] = b;
  const cross = (o: [number, number], p: [number, number], q: [number, number]) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const c1 = cross(p1, p2, q1);
  const c2 = cross(p1, p2, q2);
  if (Math.abs(c1) > 0.5 || Math.abs(c2) > 0.5) {
    // not collinear — proper crossing?
    const c3 = cross(q1, q2, p1);
    const c4 = cross(q1, q2, p2);
    return c1 * c2 < 0 && c3 * c4 < 0;
  }
  // collinear — overlap along the dominant axis
  const ax = Math.abs(p2[0] - p1[0]);
  const proj = (pt: [number, number]) => (ax >= Math.abs(p2[1] - p1[1]) ? pt[0] : pt[1]);
  const lo = Math.max(Math.min(proj(p1), proj(p2)), Math.min(proj(q1), proj(q2)));
  const hi = Math.min(Math.max(proj(p1), proj(p2)), Math.max(proj(q1), proj(q2)));
  return hi - lo > 0.5;
};

const routesOverlap = (a: [number, number][], b: [number, number][]): boolean => {
  for (let i = 0; i + 1 < a.length; i++) {
    for (let j = 0; j + 1 < b.length; j++) {
      if (segsOverlap([a[i], a[i + 1]], [b[j], b[j + 1]])) return true;
    }
  }
  return false;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DispatchingTable() {
  const [switches, setSwitches] = useState<Record<number, SwitchState>>(INITIAL_SWITCHES);
  const [signalOn, setSignalOn] = useState<Record<string, boolean>>({ S1: false, S2: false, S3: false, S4: false, S5: false, S6: false, S7: false });
  const [conflictNote, setConflictNote] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true); // bottom point & signal buttons
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timeScale, setTimeScale] = useState<TimeScale>(1);
  // Simulation-time accumulator (trains will consume this) + direct DOM clock
  // updates so the display stays smooth without re-rendering the table 60×/s.
  const simRef = useRef(0);
  const clockRef = useRef<HTMLSpanElement>(null);
  const scaleRef = useRef<TimeScale>(1);
  scaleRef.current = timeScale; // keep the tick loop in sync with the selected scale
  // Train movement state (mutated per tick) — markers move via direct DOM
  // updates; React re-renders only when a train's occupied section changes.
  const trainStatesRef = useRef<TrainState[]>(
    JOURNEYS.map((j) => initTrain(j.plan, NODES, j.plan.legs[0]?.speed ?? 0))
  );
  const trainGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const trainTextRefs = useRef<(SVGTextElement | null)[]>([]);
  const [occupancyTick, setOccupancyTick] = useState(0);
  const trainSectionKeyRef = useRef("");
  // Independent route reservations: created when the player clears a signal,
  // persist while a train uses them, and are consumed progressively by the train.
  type Reservation = { pts: [number, number][]; nextSignalId?: string; lineY: number };
  const [reservations, setReservations] = useState<Record<string, Reservation>>({});
  const reservationsRef = useRef(reservations);
  reservationsRef.current = reservations;
  const reservationPathRefs = useRef<Record<string, SVGPathElement | null>>({});
  // latest ctx for the tick loop (mutated each render)
  const switchesRef = useRef(switches);
  switchesRef.current = switches;
  const aspectOfRef = useRef<(id: string) => Aspect>(() => "red");

  // Close the settings popover on Escape.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  // Simulation clock: advances accumulated sim-time at the selected scale and
  // writes the display directly (no React re-render per frame). Trains advance
  // on the same accumulator; markers move via direct DOM updates and React
  // re-renders only when a train's occupied signal section changes.
  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = ((now - last) / 1000) * scaleRef.current;
      last = now;
      simRef.current += dt;
      const el = clockRef.current;
      if (el) {
        const t = fmtTime(simRef.current);
        if (el.textContent !== t) {
          el.textContent = t;
          el.setAttribute("aria-label", `Simulation time ${t}`);
        }
      }
      const ctx: MoveCtx = {
        nodes: NODES,
        signals: SIGNALS.map((s) => ({ id: s.id, x: s.x, y: s.lineY, dir: s.dir })),
        switches: switchesRef.current,
        aspectOf: aspectOfRef.current,
        trainHalfLen: CELL,
      };
      const sections = JOURNEYS.map((j, ti) => {
        const st = trainStatesRef.current[ti];
        const plan = j.plan;
        const g = trainGroupRefs.current[ti];
        const txt = trainTextRefs.current[ti];
        if (simRef.current < plan.originArr) {
          g?.setAttribute("visibility", "hidden");
          return "";
        }
        st.spawned = true;
        // advance only the travel time since the origin (big sim jumps must not
        // let the train run before it materializes). While stopped, no travel
        // time is consumed — the engine only re-checks the release condition,
        // and on release the budget resets so the train resumes without a jump.
        const travel = Math.max(0, simRef.current - st.originArr);
        if (st.stopped) {
          advanceTrain(st, 0, ctx, plan.legs);
          if (!st.stopped) st.advanced = travel;
        } else {
          const delta = travel - st.advanced;
          if (delta > 0 && !st.done) advanceTrain(st, delta, ctx, plan.legs);
          st.advanced = travel;
        }
        // Signal-pass consumption: signals the train's leading edge crossed this
        // tick lose their player clear (they stay red until re-clicked) and the
        // reservations whose routes ended there are released.
        for (const pid of st.passedSignals) {
          const s = SIGNALS.find((x) => x.id === pid);
          if (!s) continue;
          if (!s.block && !s.ai) {
            setSignalOn((o) => (o[s.id] ? { ...o, [s.id]: false } : o));
          }
          setReservations((r) => {
            let changed = false;
            const out: Record<string, Reservation> = {};
            for (const [k, v] of Object.entries(r)) {
              if (v.nextSignalId === s.id) changed = true;
              else out[k] = v;
            }
            return changed ? out : r;
          });
        }
        // keep reservation highlights in sync with the train's progress (per-cell)
        const resFronts = trainStatesRef.current
          .filter((m) => m.spawned && !m.done)
          .map((m) => ({ lineY: m.y, front: m.dir === "left" ? m.x - CELL : m.x + CELL }));
        for (const [id, res] of Object.entries(reservationsRef.current)) {
          const el = reservationPathRefs.current[id];
          if (!el) continue;
          const ahead = reservationAhead(res.pts, resFronts);
          const d = ahead && ahead.length >= 2 ? "M" + ahead.map(([x, y]) => `${x},${y}`).join(" ") : "";
          if (el.getAttribute("d") !== d) el.setAttribute("d", d);
        }
        // render: straights snap to the nearest 2-cell span (grid-aligned hops);
        // diagonals (crossovers) follow the track continuously, rotated
        const horizontal = st.segFrom[1] === st.segTo[1];
        let rx = st.x;
        let ry = st.y;
        let ang = 0;
        if (horizontal) {
          const col = Math.round((st.x + SHIFT) / CELL) - 1;
          rx = (col + 1) * CELL - SHIFT;
        } else {
          // diagonal: advance in discrete CELL steps along the segment, so the
          // crossing is grid-based too (not a smooth slide)
          const [fx, fy] = st.segFrom;
          const [tx, ty] = st.segTo;
          const len = Math.hypot(tx - fx, ty - fy) || 1;
          const progress = Math.hypot(st.x - fx, st.y - fy);
          const stepped = Math.min(len, Math.round(progress / CELL) * CELL);
          const t = stepped / len;
          rx = fx + (tx - fx) * t;
          ry = fy + (ty - fy) * t;
          ang = (Math.atan2(ty - fy, tx - fx) * 180) / Math.PI;
        }
        if (g) {
          g.setAttribute("transform", `translate(${rx}, ${ry}) rotate(${ang})`);
          g.setAttribute("visibility", "visible");
          g.setAttribute("data-x", String(Math.round(rx)));
          g.setAttribute("data-y", String(Math.round(ry)));
        }
        if (txt) txt.setAttribute("transform", `rotate(${-ang})`);
        return occupiedSections(st, SIGNAL_SECTIONS, CELL);
      });
      const key = sections.join(",");
      if (key !== trainSectionKeyRef.current) {
        trainSectionKeyRef.current = key;
        setOccupancyTick((t) => t + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /**
   * Approach locking: a point is locked while any cleared (proceed) route passes
   * through its junction. Returns the signal holding that route, if any.
   */
  const lockedBy = (swId: number): string | undefined => {
    const sw = SWITCHES.find((s) => s.id === swId)!;
    return SIGNALS.find((sig) => {
      if (sig.block) return false;
      // a reservation locks its points even after the train passed the signal
      // (the clear is consumed but the route stays reserved while the train uses it)
      const res = reservations[sig.id];
      if (!res) return false;
      return res.pts.some(([x, y]) => x === sw.x && y === sw.y);
    })?.id;
  };

  const coupledWith = (id: number): number[] => COUPLED.find((g) => g.includes(id)) ?? [id];

  /** A coupled pair is locked when either end is locked by a route. */
  const isLocked = (id: number): boolean => coupledWith(id).some((gid) => lockedBy(gid) !== undefined);

  const toggleSwitch = (id: number) => {
    const group = coupledWith(id);
    const owner = group.map((gid) => lockedBy(gid)).find((o) => o !== undefined);
    if (owner) {
      const name = group.length > 1 ? `P${group.join("+P")}` : `P${group[0]}`;
      setConflictNote(`${name} is locked by ${codeOf(owner)}'s reservation — set ${codeOf(owner)} to red first.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      return; // locked under a route
    }
    const newState = switches[id] === "normal" ? "reversed" : "normal";
    setSwitches((s) => {
      const next = { ...s };
      for (const gid of group) next[gid] = newState; // coupled ends move together
      return next;
    });
  };

  /**
   * Clear a signal (on/off). Turning on is refused if the points are not set for
   * the route, or if the route would overlap an opposite-direction reservation.
   */
  const toggleSignal = (id: string) => {
    if (signalOn[id]) {
      setSignalOn((o) => ({ ...o, [id]: false }));
      setReservations((r) => {
        const { [id]: _, ...rest } = r;
        return rest;
      });
      return;
    }
    const sig = SIGNALS.find((s) => s.id === id)!;
    const prospective = walkRoute(sig, switches);
    if (prospective.blocked) {
      setConflictNote(`${codeOf(sig.id)} cannot clear — points not set (${prospective.note}).`);
      window.setTimeout(() => setConflictNote(null), 3000);
      return; // stay red
    }
    const clash = SIGNALS.find((other) => {
      if (other.id === id || other.block || other.dir === sig.dir) return false;
      const otherRoute = reservations[other.id]?.pts ?? (signalOn[other.id] ? routeOf(other.id).pts : undefined);
      return otherRoute ? routesOverlap(prospective.pts, otherRoute) : false;
    });
    if (clash) {
      setConflictNote(`${codeOf(sig.id)} cannot clear — its route overlaps ${codeOf(clash.id)}'s reservation.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      return; // stay red
    }
    setSignalOn((o) => ({ ...o, [id]: true }));
    setReservations((r) => ({
      ...r,
      [id]: { pts: prospective.pts, nextSignalId: prospective.nextSignalId, lineY: sig.lineY },
    }));
  };

  /**
   * Derived aspect: red when off, when the route is not set (points blocked), or
   * when a conflicting route is set; green only if the next same-direction signal
   * is also green; amber (caution) when it is not. No next signal = open line = green.
   * Block signals are always active and simply mirror the next signal.
   */
  const routeOf = (id: string) => walkRoute(SIGNALS.find((s) => s.id === id)!, switches);

  /**
   * Wrong-direction operation: x-intervals on a main line that a cleared route
   * currently reserves against the normal traffic direction.
   */
  const wrongWaySpans = (y: number, normalDir: Dir): [number, number][] => {
    const spans: [number, number][] = [];
    for (const sig of SIGNALS) {
      if (sig.block || !signalOn[sig.id]) continue;
      const r = walkRoute(sig, switches);
      if (r.blocked) continue;
      for (let i = 0; i + 1 < r.pts.length; i++) {
        const [x1, y1] = r.pts[i];
        const [x2, y2] = r.pts[i + 1];
        // collinear horizontal segment on this line, running against the flow
        if (y1 === y2 && y1 === y && (normalDir === "right" ? x1 > x2 : x1 < x2)) {
          spans.push([Math.min(x1, x2), Math.max(x1, x2)]);
        }
      }
    }
    return spans;
  };

  /**
   * A normal-direction signal is held at red while a wrong-way route reserves
   * its ENTIRE protected section (fully covers it). A bounded wrong-way
   * diversion between crossovers only reds what it physically covers — the
   * train's own occupancy handles that. Signals beyond the reserved stretch
   * (e.g. the exit chain east of the map) are unaffected.
   */
  const forcedRed = (id: string): boolean => {
    const sig = SIGNALS.find((s) => s.id === id)!;
    const normalDir = NORMAL_DIR[sig.lineY];
    if (!normalDir || sig.dir !== normalDir) return false;
    const spans = wrongWaySpans(sig.lineY, normalDir);
    if (!spans.length) return false;
    // merge adjacent/overlapping spans into a union of intervals
    const sorted = [...spans].sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [];
    for (const [a, b] of sorted) {
      if (merged.length && a <= merged[merged.length - 1][1]) {
        merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], b);
      } else {
        merged.push([a, b]);
      }
    }
    // the section this signal protects: between it and its next same-direction signal
    const nextId = routeOf(id).nextSignalId;
    const farSig = nextId ? SIGNALS.find((s) => s.id === nextId) : undefined;
    const farX = farSig ? farSig.x : sig.dir === "right" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    const lo = Math.min(sig.x, farX);
    const hi = Math.max(sig.x, farX);
    return merged.some(([a, b]) => a <= lo && b >= hi); // fully covered by a wrong-way span
  };

  /**
   * Occupancy: does a currently-shown train occupy any part of the x-range
   * [x1, x2] on the given line? (Prototype trains run the top line.)
   */
  const trainOccupies = (lineY: number, x1: number, x2: number): boolean =>
    // body-based: a section is occupied while ANY part of the train overlaps it —
    // it clears only after the rear leaves. A train stopped AT a signal (front
    // touching the section edge) does not occupy the section beyond it.
    trainStatesRef.current.some((m) => {
      if (!m.spawned || m.done || m.y !== lineY) return false;
      return m.x - CELL < x2 && m.x + CELL > x1;
    });

  const aspectOf = (id: string, visited: Set<string> = new Set()): Aspect => {
    if (visited.has(id)) return "red";
    visited.add(id);
    const sig = SIGNALS.find((s) => s.id === id)!;
    // Wrong-way reservation on this line → the signals serving the reserved
    // stretch (and the chain feeding them) are held red.
    const normalDir = NORMAL_DIR[sig.lineY];
    if (normalDir && sig.dir === normalDir && forcedRed(id)) {
      return "red";
    }
    const nextId = routeOf(id).nextSignalId;
    // Occupancy: a train in the protected section (between this signal and the
    // next same-direction signal) holds it at red — overriding a player clear
    // and driving the block cascade behind the train.
    const farSig = nextId ? SIGNALS.find((s) => s.id === nextId) : undefined;
    const farX = farSig ? farSig.x : sig.dir === "right" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    if (trainOccupies(sig.lineY, Math.min(sig.x, farX), Math.max(sig.x, farX))) {
      return "red";
    }
    if (sig.block) {
      // automatic block signal: always active — amber when the next signal is RED,
      // green otherwise (amber or green next). Only the signal right before a red
      // shows amber; the ones behind it stay green.
      return nextId ? (aspectOf(nextId, visited) === "red" ? "amber" : "green") : "green";
    }
    if (!signalOn[id]) return "red";
    const route = routeOf(id);
    if (route.blocked) return "red"; // points not set for the route
    // green unless the next signal is red (1-2 blocks clear); amber if the next is red
    return nextId ? (aspectOf(nextId, visited) === "red" ? "amber" : "green") : "green";
  };
  aspectOfRef.current = aspectOf; // keep the tick loop's aspect lookup current

  /** Leading-edge positions of the currently shown trains. */
  const trainFronts = (): { lineY: number; front: number }[] =>
    trainStatesRef.current
      .filter((m) => m.spawned && !m.done)
      .map((m) => ({ lineY: m.y, front: m.dir === "left" ? m.x - CELL : m.x + CELL }));

  const cellX0 = (sw: Sw) => Math.floor(sw.x / CELL) * CELL;
  const cellY0 = (sw: Sw) => Math.floor(sw.y / CELL) * CELL;

  const inactivePath = (sw: Sw, reversed: boolean) =>
    reversed
      ? sw.dashSide === "left"
        ? `M${cellX0(sw)} ${sw.lineY} H${sw.x}`
        : `M${sw.x} ${sw.lineY} H${cellX0(sw) + CELL}`
      : sw.branch;

  return (
    <div className="w-full max-w-[2000px]">
      {/* Time controls — fixed top-left: simulation clock + speed scale */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm">
        <span
          ref={clockRef}
          role="timer"
          aria-label="Simulation time 00:00:00.00"
          className="font-mono text-sm font-medium tabular-nums text-slate-700"
        >
          00:00:00.00
        </span>
        <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <div role="group" aria-label="Time scale" className="flex items-center gap-1">
          {TIME_SCALES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={timeScale === s}
              onClick={() => setTimeScale(s)}
              className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${
                timeScale === s
                  ? "bg-green-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              ×{s}
            </button>
          ))}
        </div>
      </div>

      {/* Settings — fixed top-right; a gear opens a popover with toggles */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
          aria-label="Settings"
          title="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors cursor-pointer hover:border-slate-400 hover:text-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </button>

        {settingsOpen && (
          <>
            {/* invisible backdrop — click anywhere to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSettingsOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
              role="dialog"
              aria-label="Settings"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Control buttons</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Show the point &amp; signal buttons below the table
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showControls}
                  aria-label="Show control buttons"
                  onClick={() => setShowControls((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                    showControls ? "bg-green-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      showControls ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <svg
        viewBox={`${-26} ${-22} ${RIGHT + 52} 401`}
        className="w-full h-auto"
        role="img"
        aria-label="Railway dispatching table: two main lines with crossovers, passing loops, and signals"
      >
        {/* Full-width graph-paper grid, 58px cells (incl. the EXT-cell extensions) */}
        <g stroke="#e7e7e7" strokeWidth={1}>
          {Array.from({ length: RIGHT / CELL + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={353} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * CELL} x2={RIGHT} y2={i * CELL} />
          ))}
        </g>

        {/* Grid references — letters (columns A..AO) across the top/bottom, numbers 1–6 down the sides */}
        <g>
          {/* ticks at column boundaries */}
          {Array.from({ length: RIGHT / CELL + 1 }, (_, i) => (
            <g key={`ct${i}`} stroke="#cbd5e1" strokeWidth={1}>
              <line x1={i * CELL} y1={-6} x2={i * CELL} y2={0} />
              <line x1={i * CELL} y1={353} x2={i * CELL} y2={359} />
            </g>
          ))}
          {/* ticks at row boundaries */}
          {Array.from({ length: 7 }, (_, i) => (
            <g key={`rt${i}`} stroke="#cbd5e1" strokeWidth={1}>
              <line x1={-6} y1={i * CELL} x2={0} y2={i * CELL} />
              <line x1={RIGHT} y1={i * CELL} x2={RIGHT + 6} y2={i * CELL} />
            </g>
          ))}
          {/* column letters and row numbers */}
          <g fontSize={11} fontWeight={500} fill="#64748b" textAnchor="middle">
            {Array.from({ length: RIGHT / CELL }, (_, i) => {
              const x = i * CELL + CELL / 2;
              const letter = colsName(i);
              return (
                <g key={`c${i}`}>
                  <text x={x} y={-9}>
                    {letter}
                  </text>
                  <text x={x} y={370}>
                    {letter}
                  </text>
                </g>
              );
            })}
            {Array.from({ length: 6 }, (_, i) => {
              const y = i * CELL + CELL / 2 + 4;
              return (
                <g key={`r${i}`}>
                  <text x={-13} y={y}>
                    {i + 1}
                  </text>
                  <text x={RIGHT + 14} y={y}>
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </g>
        </g>

        {/* Shifted original diagram — everything below uses the original coordinates
            and is moved right by SHIFT to leave room for the left extension */}
        <g transform={`translate(${SHIFT}, 0)`}>
          <defs>
            {SWITCHES.map((sw) => (
              <clipPath key={sw.id} id={`cell-${sw.id}`}>
                <rect x={cellX0(sw)} y={cellY0(sw)} width={CELL} height={CELL} />
              </clipPath>
            ))}
          </defs>

          {/* Station platform cells — tinted footprint under the tracks */}
          <g>
            {STATION_CELLS.map((st) =>
              st.cells.map((c) => {
                const [x, y] = cellOrigin(c);
                return (
                  <rect
                    key={`${st.code}-${c.col}${c.row}`}
                    x={x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    fill="#fef3c7"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    opacity={0.55}
                  />
                );
              })
            )}
          </g>

          {/* All tracks — always solid black outside of point cells */}
          <g stroke="#000" strokeWidth={2} strokeLinecap="round" fill="none">
            {ALL_TRACKS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

        {/* Reserved routes (amber) — independent of the signal aspect; only the
            unpassed portion of each reservation stays highlighted (per-cell).
            The tick loop keeps the paths in sync with the train's progress. */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {Object.entries(reservations).map(([id, res]) => {
            const ahead = reservationAhead(res.pts, trainFronts());
            if (!ahead || ahead.length < 2) return null;
            const d = "M" + ahead.map(([x, y]) => `${x},${y}`).join(" ");
            return (
              <path
                key={id}
                ref={(el) => {
                  reservationPathRefs.current[id] = el;
                }}
                d={d}
                stroke="#f59e0b"
                strokeWidth={6}
                opacity={0.85}
              />
            );
          })}
        </g>

        {/* Direction arrows (traffic flow: top runs right→left, bottom left→right) */}
        <g fill="#000">
          <polygon points="-396,83 -396,95 -406,89" />
          <polygon points="1788,199 1788,211 1798,205" />
        </g>

        {/* Stations — merged-cell name plates (e.g. Bekasi Timur at E3–F3) */}
        {STATIONS.map((st) => (
          <g key={st.name}>
            <rect
              x={st.x}
              y={st.y}
              width={st.w}
              height={st.h}
              rx={6}
              fill="#94a3b8"
              stroke="#334155"
              strokeWidth={2.5}
            />
            <text
              x={st.x + st.w / 2}
              y={st.y + st.h / 2 + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight={700}
              fill="#ffffff"
              pointerEvents="none"
            >
              {st.name}
            </text>
          </g>
        ))}

        {/* Per-cell inactive routes: dashed, clipped to the point's own cell */}
        {SWITCHES.map((sw) => {
          const reversed = switches[sw.id] === "reversed";
          const d = inactivePath(sw, reversed);
          return (
            <g key={sw.id} clipPath={`url(#cell-${sw.id})`}>
              <path d={d} stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" fill="none" />
              <path d={d} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" fill="none" />
            </g>
          );
        })}

        {/* Point buttons — one per switch; a single mid-crossover button per coupled pair. */}
        {POINT_CONTROLS.map((ctl) => {
          const id = ctl.ids[0];
          const reversed = switches[id] === "reversed";
          const locked = isLocked(id);
          const r = ctl.coupled ? 12 : 10;
          return (
            <g
              key={ctl.ids.join("-")}
              transform={`translate(${ctl.x}, ${ctl.y})`}
              className={`group select-none focus:outline-none ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              role="button"
              aria-pressed={reversed}
              aria-disabled={locked}
              aria-label={`${ctl.coupled ? "Coupled" : "Point"} ${ctl.coupled ? ctl.ids.map((i) => `P${i}`).join("+") : ctl.ids[0]} (${ctl.label}), ${reversed ? "reversed" : "normal"}${locked ? ", locked" : ""}`}
              tabIndex={locked ? -1 : 0}
              onClick={() => toggleSwitch(id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSwitch(id);
                }
              }}
            >
              <circle
                r={ctl.coupled ? 16 : 14}
                fill="none"
                stroke={locked ? "#ef4444" : "#16a34a"}
                strokeWidth={1.5}
                strokeDasharray={locked ? "3 3" : undefined}
                className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              />
              <circle
                r={r}
                fill={reversed ? "#16a34a" : "#ffffff"}
                stroke={reversed ? "#15803d" : "#94a3b8"}
                strokeWidth={2}
              />
              {locked && (
                <text y={-r - 4} textAnchor="middle" fontSize={11} pointerEvents="none">
                  🔒
                </text>
              )}
              <text
                y={4}
                textAnchor="middle"
                fontSize={ctl.coupled ? 9 : 11}
                fontWeight={700}
                fill={reversed ? "#ffffff" : "#475569"}
                pointerEvents="none"
              >
                {ctl.coupled ? `${ctl.ids[0]}${ctl.ids[1]}` : ctl.ids[0]}
              </text>
            </g>
          );
        })}

        {/* Signals — 3-aspect (green top, yellow middle, red bottom, railway order) */}
        {SIGNALS.map((sig) => {
          const aspect = aspectOf(sig.id);
          const passive = sig.block === true || sig.ai === true; // not controllable by the player
          const up = sig.mount === "up";
          const headTop = up ? -50 : 6;
          const lamps = [up ? -38 : 18, up ? -26 : 30, up ? -14 : 42]; // green, yellow, red
          const lit = [aspect === "green", aspect === "amber", aspect === "red"];
          const colors = ["#22c55e", "#eab308", "#ef4444"];
          return (
            <g
              key={sig.id}
              transform={`translate(${sig.x}, ${sig.y})`}
              className={passive ? "select-none" : "group cursor-pointer select-none focus:outline-none"}
              role={passive ? undefined : "button"}
              aria-pressed={passive ? undefined : aspect !== "red"}
              aria-label={`Signal ${codeOf(sig.id)} (${sig.label}), aspect ${aspect}${sig.block ? ", automatic block" : sig.ai ? ", AI-controlled" : ""}`}
              tabIndex={passive ? -1 : 0}
              onClick={passive ? undefined : () => toggleSignal(sig.id)}
              onKeyDown={(e) => {
                if (passive) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleSignal(sig.id);
                }
              }}
            >
              {/* invisible hit area + hover ring (only for controllable signals) */}
              {!passive && (
                <>
                  <rect x={-14} y={up ? -54 : -4} width={28} height={58} rx={8} fill="transparent" />
                  <rect
                    x={-14}
                    y={up ? -54 : -4}
                    width={28}
                    height={58}
                    rx={8}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                  />
                </>
              )}
              {/* post */}
              <line x1={0} y1={0} x2={0} y2={up ? -6 : 6} stroke="#334155" strokeWidth={3} />
              {/* head */}
              <rect x={-9} y={headTop} width={18} height={44} rx={5} fill="#ffffff" stroke="#334155" strokeWidth={1.5} />
              {/* lit lamp glow */}
              {lit[0] && <circle cx={0} cy={lamps[0]} r={9} fill={colors[0]} opacity={0.35} />}
              {lit[1] && <circle cx={0} cy={lamps[1]} r={9} fill={colors[1]} opacity={0.35} />}
              {lit[2] && <circle cx={0} cy={lamps[2]} r={9} fill={colors[2]} opacity={0.35} />}
              {/* lamps */}
              <circle cx={0} cy={lamps[0]} r={5} fill={lit[0] ? colors[0] : "#64748b"} />
              <circle cx={0} cy={lamps[1]} r={5} fill={lit[1] ? colors[1] : "#64748b"} />
              <circle cx={0} cy={lamps[2]} r={5} fill={lit[2] ? colors[2] : "#64748b"} />
              {/* label */}
              <text
                x={13}
                y={headTop + 26}
                textAnchor="start"
                fontSize={10}
                fontWeight={600}
                fill="#64748b"
                pointerEvents="none"
              >
                {codeOf(sig.id)}
              </text>
            </g>
          );
        })}

        {/* Trains — block markers on the track with their train number. The tick
            loop moves them via direct transform updates for smooth motion. */}
        {JOURNEYS.map(({ train }, ti) => (
          <g
            key={train.train_no}
            data-train={train.train_no}
            aria-label={`Train ${train.train_no} ${train.name}`}
            ref={(el) => {
              trainGroupRefs.current[ti] = el;
            }}
            transform="translate(-1000, -1000)"
            visibility="hidden"
          >
            <rect x={-58} y={-11} width={116} height={22} rx={5} fill="#bfdbfe" stroke="#2563eb" strokeWidth={1.5} />
            <text
              ref={(el) => {
                trainTextRefs.current[ti] = el;
              }}
              x={0}
              y={4}
              textAnchor="middle"
              fontSize={12}
              fontWeight={800}
              fill="#1e3a8a"
              pointerEvents="none"
            >
              {train.train_no}
            </text>
          </g>
        ))}
        </g>
      </svg>

      {/* Control buttons (legend text lives in the settings panel if needed) */}
      <div className="mt-6">
        {showControls && (
        <div className="flex flex-wrap justify-center gap-2">
          {POINT_CONTROLS.map((ctl) => {
            const id = ctl.ids[0];
            const reversed = switches[id] === "reversed";
            const locked = isLocked(id);
            const name = ctl.coupled ? `P${ctl.ids[0]}+P${ctl.ids[1]}` : `P${id}`;
            return (
              <button
                key={ctl.ids.join("-")}
                type="button"
                onClick={() => toggleSwitch(id)}
                aria-pressed={reversed}
                aria-disabled={locked}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  locked
                    ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed"
                    : reversed
                    ? "bg-green-100 border-green-300 text-green-800 cursor-pointer"
                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 cursor-pointer"
                }`}
              >
                {name} · {reversed ? "REVERSED" : "NORMAL"}
                {locked && " 🔒"}
              </button>
            );
          })}
          {SIGNALS.map((sig) => {
            const aspect = aspectOf(sig.id);
            const label = aspect === "green" ? "GREEN" : aspect === "amber" ? "AMBER" : "RED";
            if (sig.block || sig.ai) {
              return (
                <button
                  key={sig.id}
                  type="button"
                  disabled
                  title={`${sig.label} — ${sig.block ? "automatic, mirrors the next signal" : "AI-controlled"}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border cursor-default ${
                    aspect === "green"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : aspect === "amber"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  {codeOf(sig.id)} · {label}
                </button>
              );
            }
            return (
              <button
                key={sig.id}
                type="button"
                onClick={() => toggleSignal(sig.id)}
                aria-pressed={aspect !== "red"}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                  aspect === "green"
                    ? "bg-green-100 border-green-300 text-green-800"
                    : aspect === "amber"
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {codeOf(sig.id)} · {label}
              </button>
            );
          })}
        </div>
        )}
        {conflictNote && (
          <div
            role="alert"
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            {conflictNote}
          </div>
        )}
      </div>
    </div>
  );
}
