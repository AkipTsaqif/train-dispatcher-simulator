"use client";

import { useState } from "react";

type SwitchState = "normal" | "reversed";
type Aspect = "red" | "amber" | "green";
type Dir = "right" | "left";

const CELL = 58; // grid cell size in viewBox units

const EXT = 10; // how many cells the running lines are extended on each end
const SHIFT = EXT * CELL; // the whole original diagram is shifted right by this (580)
const RIGHT = 41 * CELL; // new full width in cells (21 original + EXT each side) = 2378

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
  tlR: { x: SHIFT + 1218, y: 89, straight: { right: null, left: "p8" } },
  // bottom line (y=205) — traffic runs left → right
  blL: { x: -SHIFT, y: 205, straight: { right: "p2", left: null } },
  p2: { x: 438, y: 205, sw: 2, straight: { right: "p5", left: "blL" }, branch: { left: { path: ["p1"], farSw: 1 } } },
  p5: { x: 500, y: 205, sw: 5, straight: { right: "p6", left: "p2" }, branch: { right: { path: ["ll1", "ll2", "p6"], farSw: 6 } } },
  ll1: { x: 556, y: 264, straight: { right: "ll2", left: "p5" } },
  ll2: { x: 730, y: 264, straight: { right: "p6", left: "ll1" } },
  p6: { x: 788, y: 205, sw: 6, straight: { right: "p7", left: "p5" }, branch: { left: { path: ["ll2", "ll1", "p5"], farSw: 5 } } },
  p7: { x: 846, y: 205, sw: 7, straight: { right: "blR", left: "p6" }, branch: { right: { path: ["p8"], farSw: 8 } } },
  blR: { x: SHIFT + 1218, y: 205, straight: { right: null, left: "p7" } },
};

// ---------------------------------------------------------------------------
// Signals — mount "up" = head above the track, "down" = below.
// edge = [behind node, ahead node] in the signal's travel direction.
// ---------------------------------------------------------------------------
type SignalDef = {
  id: string;
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
  // B1 is the smallest number and lies closest to S1 (M4); higher numbers reach further
  // left (J4, G4, D4).
  { id: "B1", x: 145, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, M4", block: true },
  { id: "B2", x: -29, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, J4", block: true },
  { id: "B3", x: -203, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, G4", block: true },
  { id: "B4", x: -377, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "block signal, D4", block: true },
  // top-line approach (right→left): entry at A2, then blocks M2→J2→G2→D2 (D2 = B5 closest to A2)
  { id: "A2", x: -551, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "entry signal, A2 (AI-controlled)", ai: true },
  { id: "B5", x: -377, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, D2", block: true },
  { id: "B6", x: -203, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, G2", block: true },
  { id: "B7", x: -29, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, J2", block: true },
  { id: "B8", x: 145, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "block signal, M2", block: true },
  // top-line right approach: blocks AF2..AO2 nearest to S4 (B9 = AF2 = smallest)
  { id: "B9", x: 1247, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AF2", block: true },
  { id: "B10", x: 1421, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AI2", block: true },
  { id: "B11", x: 1595, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AL2", block: true },
  { id: "B12", x: 1769, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "block signal, AO2", block: true },
  // bottom-line right exit: blocks AF4..AO4 — entry root is beyond the map, so no next
  // signal here and they all read green
  { id: "B13", x: 1247, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AF4", block: true },
  { id: "B14", x: 1421, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AI4", block: true },
  { id: "B15", x: 1595, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AL4", block: true },
  { id: "B16", x: 1769, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "block signal, AO4", block: true },
];

// ---------------------------------------------------------------------------
// All track geometry (always drawn solid black; per-cell styling is overlaid)
// ---------------------------------------------------------------------------
const ALL_TRACKS: string[] = [
  // running-line extensions (EXT cells each end)
  `M${-SHIFT} 89 H64`, `M1162 89 H${SHIFT + 1218}`,
  `M${-SHIFT} 205 H62`, `M1162 205 H${SHIFT + 1218}`,
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

// ---------------------------------------------------------------------------
// Stations — a name plate across merged grid cells (pre-shift coords, rendered
// inside the shifted diagram between the two running lines).
// ---------------------------------------------------------------------------
type Station = { name: string; x: number; y: number; w: number; h: number };
const STATIONS: Station[] = [
  { name: "Bekasi Timur", x: 232 - SHIFT, y: 116, w: 116, h: 58 }, // cells E3–F3, row 3
  { name: "Tambun", x: 1160 - SHIFT, y: 0, w: 116, h: 58 }, // cells U1–V1, row 1
  { name: "Cibitung", x: 2204 - SHIFT, y: 116, w: 116, h: 58 }, // cells AM3–AN3, row 3
];

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

  /**
   * Approach locking: a point is locked while any cleared (proceed) route passes
   * through its junction. Returns the signal holding that route, if any.
   */
  const lockedBy = (swId: number): string | undefined => {
    const sw = SWITCHES.find((s) => s.id === swId)!;
    return SIGNALS.find((sig) => {
      if (sig.block || aspectOf(sig.id) === "red") return false;
      return routeOf(sig.id).pts.some(([x, y]) => x === sw.x && y === sw.y);
    })?.id;
  };

  const coupledWith = (id: number): number[] => COUPLED.find((g) => g.includes(id)) ?? [id];

  /** A coupled pair is locked when either end is locked by a route. */
  const isLocked = (id: number): boolean => coupledWith(id).some((gid) => lockedBy(gid) !== undefined);

  const toggleSwitch = (id: number) => {
    const group = coupledWith(id);
    const owner = group.map((gid) => lockedBy(gid)).find((o) => o !== undefined);
    if (owner) {
      setConflictNote(`P${id} is locked by ${owner}'s reservation — set ${owner} to red first.`);
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
      return;
    }
    const sig = SIGNALS.find((s) => s.id === id)!;
    const prospective = walkRoute(sig, switches);
    if (prospective.blocked) {
      setConflictNote(`${sig.id} cannot clear — points not set (${prospective.note}).`);
      window.setTimeout(() => setConflictNote(null), 3000);
      return; // stay red
    }
    const clash = SIGNALS.find(
      (other) =>
        other.id !== id &&
        !other.block &&
        other.dir !== sig.dir &&
        aspectOf(other.id) !== "red" &&
        routesOverlap(prospective.pts, routeOf(other.id).pts)
    );
    if (clash) {
      setConflictNote(`${sig.id} cannot clear — its route overlaps ${clash.id}'s reservation.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      return; // stay red
    }
    setSignalOn((o) => ({ ...o, [id]: true }));
  };

  /**
   * Derived aspect: red when off, when the route is not set (points blocked), or
   * when a conflicting route is set; green only if the next same-direction signal
   * is also green; amber (caution) when it is not. No next signal = open line = green.
   * Block signals are always active and simply mirror the next signal.
   */
  const routeOf = (id: string) => walkRoute(SIGNALS.find((s) => s.id === id)!, switches);

  const aspectOf = (id: string, visited: Set<string> = new Set()): Aspect => {
    if (visited.has(id)) return "red";
    visited.add(id);
    const sig = SIGNALS.find((s) => s.id === id)!;
    const nextId = routeOf(id).nextSignalId;
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

  const reversedCount = Object.values(switches).filter((v) => v === "reversed").length;
  const routes = SIGNALS.filter((s) => !s.block && aspectOf(s.id) !== "red").map((s) => ({
    sig: s,
    route: routeOf(s.id),
  }));

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

          {/* All tracks — always solid black outside of point cells */}
          <g stroke="#000" strokeWidth={2} strokeLinecap="round" fill="none">
            {ALL_TRACKS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

        {/* Reserved routes (amber) for every cleared signal */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {routes.map(({ sig, route }) => (
            <path key={sig.id} d={route.d} stroke="#f59e0b" strokeWidth={6} opacity={0.85} />
          ))}
        </g>

        {/* Direction arrows (traffic flow: top runs right→left, bottom left→right) */}
        <g fill="#000">
          <polygon points="-570,83 -570,95 -580,89" />
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
              aria-label={`Signal ${sig.id} (${sig.label}), aspect ${aspect}${sig.block ? ", automatic block" : sig.ai ? ", AI-controlled" : ""}`}
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
                {sig.id}
              </text>
            </g>
          );
        })}
        </g>
      </svg>

      {/* Legend + live status */}
      <div className="mt-6">
        <p className="text-sm text-slate-500 text-center mb-3">
          Tracks are shown per grid cell; a point&apos;s own cell shows the inactive route
          as dashed. Click a point to throw it. Signals default to{" "}
          <span className="text-red-600 font-medium">red</span>; click to clear —{" "}
          <span className="text-green-700 font-medium">green</span> when the next signal
          is clear, <span className="text-amber-600 font-medium">amber</span> (caution)
          when the next signal is red. A signal only clears when the points are set for
          its route, and never into an opposite-direction reservation. Points under a
          reserved route are locked <span className="text-red-500">🔒</span> until the
          signal is put back to red. Crossovers P1⇄P2 and P7⇄P8 are coupled — one click
          throws both ends together. B1–B16 are automatic block signals — they cannot be
          controlled and always mirror the next signal; the smallest number is closest to
          its signalled route (B1→M4, B5→D2, B9→AF2). B13–B16 (AF4..AO4) are beyond the
          map at the bottom-line exit, so they read green. A2 is the AI-controlled entry
          signal — red for now, it will be cleared by the AI later.
        </p>
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
                  {sig.id} · {label}
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
                {sig.id} · {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">
          {reversedCount === 0
            ? "All points normal."
            : `${reversedCount} point${reversedCount === 1 ? "" : "s"} reversed.`}{" "}
          {routes.length === 0
            ? "All signals at danger (red)."
            : `${routes.length} signal${routes.length === 1 ? "" : "s"} clear: ${routes
                .map(({ sig, route }) => {
                  const asp = aspectOf(sig.id);
                  return `${sig.id} (${asp}) → ${route.note}`;
                })
                .join(", ")}.`}
          {conflictNote && (
            <span className="text-red-600 font-medium"> {conflictNote}</span>
          )}
        </p>
      </div>
    </div>
  );
}
