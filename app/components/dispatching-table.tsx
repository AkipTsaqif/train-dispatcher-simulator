"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  initTrain,
  advanceTrain,
  occupiedSections,
  reservationAhead,
  footprintOf,
  bodiesOverlap,
  pathAhead,
  buildSegmentLimits,
  type TrainState,
  type MoveCtx,
  type LegPlan,
} from "../lib/train-engine";
import { polylinesOverlap, routesOverlap } from "../lib/geometry";
import { BEKASI_TAMBUN_CIBITUNG_DISPATCH } from "../dispatching/bekasi-tambun-cibitung";
import type { DispatchRuntime } from "../lib/dispatch-runtime";
import { bearingDot, bearingOf } from "../lib/topology";
import { findRoute, flankPoints, closedSpanOnRoute, type ClosedSpan } from "../lib/route-search";
import type { Bearing, GNodeExit, LeveledPoint } from "../lib/topology";
import type {
  Dir,
  DispatchMapDefinition,
  GNode,
  SignalDef,
  Sw,
  SwitchState,
} from "../maps/bekasi-tambun-cibitung";

type Aspect = "red" | "amber" | "green";

/** Stroke width of a solid running track. The point-cell eraser must be at
 *  least this wide to actually hide the track underneath it. */
const TRACK_STROKE = 2;

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

// Train direction arrows (local +x is the travel direction once the marker is
// rotated onto a diagonal segment, so the right-pointing shape is used there).
// Authored as a fraction of the marker's own half-length so a dense layout
// (small controlScale) gets an arrow that matches its shrunken body — fixed
// offsets would float outside a scaled-down marker. The fractions reproduce
// the original hand-tuned Bekasi geometry exactly at halfLen = CELL = 58
// (32/58 and 41/58), keeping the arrow INSIDE the box.
const ARROW_TAIL_FRAC = 32 / 58;
const ARROW_TIP_FRAC = 41 / 58;
const ARROW_BARB_FRAC = 36 / 58;
const ARROW_BARB_HALF_FRAC = 4 / 58;
// Furthest along the half-length the tip may reach. Short of 1 so the stroke
// sits inside the border rather than straddling it.
const ARROW_TIP_LIMIT_FRAC = 0.9;
// Largest scale that respects that limit. Scaling the fractions naively lets
// the arrow escape the marker (41/58 * 1.6 > 1), so the growth is clamped here
// rather than left to each layout to get right by trial.
const ARROW_MAX_SCALE = ARROW_TIP_LIMIT_FRAC / ARROW_TIP_FRAC;
// `scale` grows the whole glyph about the box centre, which also pushes the
// tail away from the centred train number. 1 reproduces the Bekasi geometry.
// The barb half-width is deliberately NOT clamped: only the along-axis extent
// can overflow, and a wider barb still reads correctly inside a taller box.
const arrowPath = (halfLen: number, sign: 1 | -1, scale = 1) => {
  const round = (v: number) => Number(v.toFixed(4));
  const axial = Math.min(scale, ARROW_MAX_SCALE);
  const tail = round(sign * halfLen * ARROW_TAIL_FRAC * axial);
  const tip = round(sign * halfLen * ARROW_TIP_FRAC * axial);
  const barb = round(sign * halfLen * ARROW_BARB_FRAC * axial);
  const half = round(halfLen * ARROW_BARB_HALF_FRAC * scale);
  return `M${tail},0 H${tip} M${barb},-${half} L${tip},0 L${barb},${half}`;
};
const arrowRight = (halfLen: number, scale = 1) => arrowPath(halfLen, 1, scale);
const arrowLeft = (halfLen: number, scale = 1) => arrowPath(halfLen, -1, scale);

/**
 * The train body as an ARTICULATED outline that follows the track centre-line.
 *
 * A rigid rotated box cannot express a train straddling a junction: on a
 * thrown point the real body is bent, with one part still on the straight and
 * the rest already on the diagonal. Given the centre-line the body occupies
 * (front first, running backwards), this offsets that polyline by half the
 * body height to each side and closes the ends, so the marker bends at the
 * junction and stays pointy along the rails.
 *
 * Purely presentational. The spine comes from the same footprint geometry the
 * engine already computes, so the drawn shape cannot disagree with the
 * simulated one.
 */
const articulatedBodyPath = (spine: [number, number][], halfHeight: number): string => {
  if (spine.length < 2) return "";
  const round = (v: number) => Number(v.toFixed(3));
  const unit = (from: number, to: number): [number, number] => {
    const dx = spine[to][0] - spine[from][0];
    const dy = spine[to][1] - spine[from][1];
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len]; // the tangent, rotated 90 degrees
  };
  // The offset direction at each vertex. At a bend the two adjacent segment
  // normals are averaged and lengthened to the MITRE, so both offset edges
  // meet exactly on the corner instead of pinching the body at the joint.
  const normals: [number, number][] = spine.map((_, i) => {
    if (i === 0) return unit(0, 1);
    if (i === spine.length - 1) return unit(spine.length - 2, spine.length - 1);
    const [ax, ay] = unit(i - 1, i);
    const [bx, by] = unit(i, i + 1);
    const mx = ax + bx;
    const my = ay + by;
    const mitre = mx * ax + my * ay || 1; // 1 + cos(turn) — 0 only at a reversal
    return [mx / mitre, my / mitre];
  });
  const side = (sign: 1 | -1): [number, number][] =>
    spine.map((pt, i) => [
      round(pt[0] + sign * normals[i][0] * halfHeight),
      round(pt[1] + sign * normals[i][1] * halfHeight),
    ]);
  const ring = [...side(1), ...side(-1).reverse()];
  return `M${ring.map(([x, y]) => `${x},${y}`).join(" L")} Z`;
};

/**
 * The centre-line the DRAWN body covers: from its visual front, back along the
 * current segment and then through the trail, for one body length.
 *
 * This mirrors the engine's own footprint walk, but takes the marker's snapped
 * centre and its (possibly shorter) visual half-length, so the bend appears
 * exactly where the drawn marker sits rather than where the longer operational
 * footprint reaches. Returns null when the geometry is unusable.
 */
const spineOf = (
  st: { segFrom: [number, number]; segTo: [number, number]; trail: { pt: [number, number] }[] },
  center: [number, number],
  halfLen: number,
  /** Node positions the train is about to run over, in travel order. */
  ahead: [number, number][]
): [number, number][] | null => {
  const segLen = Math.hypot(st.segTo[0] - st.segFrom[0], st.segTo[1] - st.segFrom[1]);
  if (!segLen) return null;

  // Build ONE continuous route polyline in travel order: the trail behind,
  // then the current segment, then the points the train is about to reach.
  // Working on a single path means the body is just an arc-length window on
  // it, so the nose and tail can never be computed from different geometry.
  const route: [number, number][] = [];
  const push = (pt: [number, number]) => {
    const last = route[route.length - 1];
    if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) > 1e-9) route.push(pt);
  };
  for (const t of st.trail) push([t.pt[0], t.pt[1]]);
  push([st.segFrom[0], st.segFrom[1]]);
  push([st.segTo[0], st.segTo[1]]);
  for (const pt of ahead) push(pt);

  // Where the DRAWN centre sits on that route. The marker's x is snapped to
  // the display grid, so project it onto the route rather than assuming it is
  // exactly the engine's position — otherwise a snapped centre and an
  // unsnapped nose disagree and the body jitters at a junction.
  let centerS: number | null = null;
  let best = Infinity;
  let s = 0;
  for (let i = 0; i + 1 < route.length; i++) {
    const [ax, ay] = route[i];
    const [bx, by] = route[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (!len) continue;
    const t = Math.max(0, Math.min(1, ((center[0] - ax) * dx + (center[1] - ay) * dy) / (len * len)));
    const px = ax + dx * t;
    const py = ay + dy * t;
    const d = Math.hypot(center[0] - px, center[1] - py);
    if (d < best) {
      best = d;
      centerS = s + len * t;
    }
    s += len;
  }
  const total = s;
  if (centerS === null) return null;

  // Sample the route at an arc-length distance from its start, clamping past
  // either end by extending the terminal bearing so the body always keeps its
  // full drawn length (a freshly spawned train has almost no trail).
  const at = (target: number): [number, number] => {
    if (target <= 0) {
      const [ax, ay] = route[0];
      const [bx, by] = route[1] ?? route[0];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      return [ax - ((bx - ax) / len) * -target, ay - ((by - ay) / len) * -target];
    }
    if (target >= total) {
      const [ax, ay] = route[route.length - 2] ?? route[route.length - 1];
      const [bx, by] = route[route.length - 1];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const over = target - total;
      return [bx + ((bx - ax) / len) * over, by + ((by - ay) / len) * over];
    }
    let acc = 0;
    for (let i = 0; i + 1 < route.length; i++) {
      const [ax, ay] = route[i];
      const [bx, by] = route[i + 1];
      const len = Math.hypot(bx - ax, by - ay);
      if (!len) continue;
      if (target <= acc + len) {
        const t = (target - acc) / len;
        return [ax + (bx - ax) * t, ay + (by - ay) * t];
      }
      acc += len;
    }
    return [...route[route.length - 1]] as [number, number];
  };

  // The body is the window [centre - half, centre + half], nose first, with
  // every route vertex strictly inside it kept so real junctions become bends.
  const noseS = centerS + halfLen;
  const tailS = centerS - halfLen;
  const spine: [number, number][] = [at(noseS)];
  let acc = 0;
  const vertices: { s: number; pt: [number, number] }[] = [];
  for (let i = 0; i + 1 < route.length; i++) {
    const len = Math.hypot(route[i + 1][0] - route[i][0], route[i + 1][1] - route[i][1]);
    if (!len) continue;
    acc += len;
    if (i + 1 < route.length - 1) vertices.push({ s: acc, pt: route[i + 1] });
  }
  for (let i = vertices.length - 1; i >= 0; i--) {
    const v = vertices[i];
    if (v.s < noseS && v.s > tailS) spine.push([...v.pt] as [number, number]);
  }
  spine.push(at(tailS));
  return spine;
};

/**
 * Drop vertices that do not actually turn.
 *
 * A train passing a node on plain track still collects that node as a spine
 * point, and a straight "bend" would pointlessly switch the marker to path
 * mode (and mitre against a zero angle). Only real direction changes survive.
 */
const withoutStraightJoints = (spine: [number, number][]): [number, number][] => {
  if (spine.length < 3) return spine;
  const kept: [number, number][] = [spine[0]];
  for (let i = 1; i < spine.length - 1; i++) {
    const [px, py] = kept[kept.length - 1];
    const [cx, cy] = spine[i];
    const [nx, ny] = spine[i + 1];
    const ax = cx - px;
    const ay = cy - py;
    const bx = nx - cx;
    const by = ny - cy;
    const al = Math.hypot(ax, ay);
    const bl = Math.hypot(bx, by);
    if (!al || !bl) continue; // a duplicate point is never a joint
    // the sine of the turn; well below a degree is the same bearing
    if (Math.abs((ax * by - ay * bx) / (al * bl)) > 1e-6) kept.push(spine[i]);
  }
  kept.push(spine[spine.length - 1]);
  return kept;
};

// Train marker color by state: blue = running, green = stopped at a station per
// the schedule (dwell), red = held at a red signal, amber = waiting at a junction.
const TRAIN_COLORS = {
  moving: { fill: "#bfdbfe", stroke: "#2563eb" },
  station: { fill: "#bbf7d0", stroke: "#16a34a" },
  signal: { fill: "#fecaca", stroke: "#dc2626" },
  junction: { fill: "#fde68a", stroke: "#d97706" },
  queue: { fill: "#fde68a", stroke: "#b45309" },
  conflict: { fill: "#ef4444", stroke: "#450a0a" },
} as const;
type TrainStopState = keyof typeof TRAIN_COLORS;

/** Display code for a signal — internal ids may differ from what is shown on the page. */
const createSignalCodeLookup = (signals: SignalDef[]) => (id: string): string =>
  signals.find((signal) => signal.id === id)?.code ?? id;


// Simulation speed scales (×1 real-time through ×100 fast-forward).
const TIME_SCALES = [1, 2, 5, 10, 20, 50, 100] as const;
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

// Column letter → 0-based index (A=0, Z=25, AA=26, ...).
const colIdx = (letters: string): number => {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** Station footprint cell → pre-shift origin inside the shifted diagram. */
const cellOrigin = (
  cell: { col: string; row: number },
  grid: Pick<DispatchMapDefinition["grid"], "cellSize" | "shift">
): [number, number] => [
  colIdx(cell.col) * grid.cellSize - grid.shift,
  (cell.row - 1) * grid.cellSize,
];

// ---------------------------------------------------------------------------
// Route walker: from a signal, walk the graph in its direction, following
// points (divert / block) until the next same-direction signal or the end.
// ---------------------------------------------------------------------------
type Route = { d: string; note: string; nextSignalId?: string; pts: LeveledPoint[]; blocked?: boolean };

const walkRoute = (
  sig: SignalDef,
  switches: Record<number, SwitchState>,
  map: Pick<DispatchMapDefinition, "nodes" | "signals" | "segmentLevels">
): Route => {
  const dir = sig.dir;
  const nodes = map.nodes;
  const signals = map.signals.items;
  const segLvl = (a: string | null, b: string | null) =>
    a && b ? (map.segmentLevels[`${a}|${b}`] ?? map.segmentLevels[`${b}|${a}`] ?? 0) : 0;
  const pts: LeveledPoint[] = [[sig.x, sig.y, segLvl(sig.edge[0], sig.edge[1])]];
  let curLevel = pts[0][2] ?? 0;
  const push = (x: number, y: number, level?: number): void => {
    pts.push([x, y, level ?? curLevel]);
    if (level !== undefined) curLevel = level;
  };
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
    const cands = signals.filter(
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
  while (cur && nodes[cur]) {
    const node: GNode = nodes[cur];
    const fromX = pts[pts.length - 1][0];

    // stop at the next same-direction signal on this segment
    const hit = nextSignalOn(fromX, node);
    if (hit) {
      push(hit.x, hit.y);
      return done(`ke ${hit.id}`, hit.id);
    }

    // incoming travel bearing — the direction from the previous point to here.
    // A signal sitting exactly at a corner node gives a zero-length first step,
    // in which case the signal's own facing bearing is the travel direction.
    const prevPoint = pts[pts.length - 1];
    const incBearing =
      prevPoint[0] === node.x && prevPoint[1] === node.y
        ? sig.bearing
        : bearingOf(prevPoint, [node.x, node.y]);

    if (node.sw !== undefined) {
      const reversed = switches[node.sw] === "reversed";
      const branchExit = node.exits.find((exit) => exit.viaSwitchPort === "reversed");
      const branchAhead =
        branchExit !== undefined && bearingDot(incBearing, branchExit.bearing) > 0;
      // arriving via the branch edge (loop/crossover exit) — the point must be
      // reversed for the exit to be open, otherwise the route ends here
      const cameFromBranch = branchExit !== undefined && incoming === branchExit.neighbor;
      if (cameFromBranch) {
        if (!reversed) {
          push(node.x, node.y);
          return done(`berakhir di P${node.sw}`, undefined, true);
        }
      } else if (branchAhead && reversed) {
        // divert: push this junction first (in path order), then the branch path
        push(node.x, node.y);
        const branchPath = branchExit!.branchPath ?? [];
        let prevId: string | null = cur;
        for (let i = 0; i < branchPath.length; i++) {
          const nid = branchPath[i];
          const n = nodes[nid];
          const nx = pts[pts.length - 1][0];
          const hit2 = nextSignalOn(nx, n);
          if (hit2) {
            push(hit2.x, hit2.y);
            return done(`ke ${hit2.id}`, hit2.id);
          }
          push(n.x, n.y, segLvl(prevId, nid));
          prevId = nid;
        }
        const last = branchPath.length - 1;
        const far = nodes[branchPath[last]];
        if (branchExit!.farSw === undefined || switches[branchExit!.farSw] === "reversed") {
          // the branch ends at a plain node (a fixed track turn) or its far
          // switch is thrown — either way the divert continues
          // rejoin the other line and keep going in the same direction
          incoming = last >= 1 ? branchPath[last - 1] : cur;
          // the far node's exit continuing most nearly straight (non-reversing)
          const farPrev = pts[pts.length - 2]; // the branch node before the far node
          const farBearing = bearingOf(farPrev, [far.x, far.y]);
          let bestExit: GNodeExit | undefined;
          let bestDot = -Infinity;
          for (const exit of far.exits) {
            const d = bearingDot(farBearing, exit.bearing);
            if (d > 0 && d > bestDot) {
              bestDot = d;
              bestExit = exit;
            }
          }
          cur = bestExit ? bestExit.neighbor : null;
          if (!cur) return done(dir === "right" ? "ke ujung kanan" : "ke ujung kiri");
          curLevel = segLvl(branchPath[last], cur);
          continue; // junction already pushed — skip the fall-through push
        }
        // exit not set — trapped at the far end
        return done(`berakhir di P${branchExit!.farSw} — belum diatur`, undefined, true);
      } else if (reversed) {
        // branch behind (or none) + reversed = straight blocked
        push(node.x, node.y);
        return done(`berakhir di P${node.sw}`, undefined, true);
      }
    }

    push(node.x, node.y);
    // the open, non-reversing exit continuing most nearly straight
    const reversed = node.sw !== undefined && switches[node.sw] === "reversed";
    let bestExit: GNodeExit | undefined;
    let bestDot = -Infinity;
    for (const exit of node.exits) {
      if (exit.viaSwitchPort === "reversed" && !reversed) continue; // branch exit is gated
      const d = bearingDot(incBearing, exit.bearing);
      if (d > 0 && d > bestDot) {
        bestDot = d;
        bestExit = exit;
      }
    }
    incoming = cur;
    cur = bestExit ? bestExit.neighbor : null;
    if (!cur) {
      return done(dir === "right" ? "ke ujung kanan" : "ke ujung kiri");
    }
    curLevel = segLvl(incoming, cur);
  }
  return done("tidak dikenal", undefined, true);
};

// ---------------------------------------------------------------------------
// Route conflict: two routes conflict if any of their segments share a
// positive-length portion (collinear overlap or a proper crossing). Meeting at
// a single point (block boundary) is NOT a conflict. Shared with the engine
// via lib/geometry.
// ---------------------------------------------------------------------------

type SignalAspectDependencies = {
  signals: SignalDef[];
  normalDirectionByY: Record<number, Dir>;
  signalSections: { sig: string; lineY: number; lo: number; hi: number; pts?: LeveledPoint[] }[];
  signalOn: Record<string, boolean>;
  trainStates: TrainState[];
  trainHalfLen: number;
  routeOf: (id: string) => Route;
  forcedRed: (id: string) => boolean;
};

const trainOccupies = (
  trainStates: TrainState[],
  trainHalfLen: number,
  lineY: number,
  x1: number,
  x2: number,
  skip: number[] = [],
  pts?: LeveledPoint[]
): boolean =>
  trainStates.some((train) => {
    if (!train.spawned || train.done || skip.includes(train.idx)) {
      return false;
    }
    // horizontal fast path — identical to the pre-footprint interval test
    if (train.y === lineY) {
      return train.x - trainHalfLen < x2 && train.x + trainHalfLen > x1;
    }
    // general path: the train's body footprint vs the section's track polyline
    // (a train mid-crossover straddles both lines and occupies each)
    if (!pts || pts.length < 2) return false;
    return polylinesOverlap(footprintOf(train, trainHalfLen), pts);
  });

const calculateSignalAspect = (
  id: string,
  dependencies: SignalAspectDependencies,
  visited: Set<string> = new Set(),
  selfIdx?: number
): Aspect => {
  if (visited.has(id)) return "red";
  visited.add(id);
  const signal = dependencies.signals.find((candidate) => candidate.id === id)!;
  const normalDir = dependencies.normalDirectionByY[signal.lineY];
  if (normalDir && signal.dir === normalDir && dependencies.forcedRed(id)) {
    return "red";
  }
  const nextId = dependencies.routeOf(id).nextSignalId;
  const section = dependencies.signalSections.find((candidate) => candidate.sig === id);
  if (section) {
    const skip =
      selfIdx !== undefined
        ? [selfIdx]
        : !signal.block
          ? dependencies.trainStates
              .filter(
                (train) =>
                  train.spawned && !train.done && train.dir === signal.dir
              )
              .map((train) => train.idx)
          : [];
    if (
      trainOccupies(
        dependencies.trainStates,
        dependencies.trainHalfLen,
        signal.lineY,
        section.lo,
        section.hi,
        skip,
        section.pts
      )
    ) {
      return "red";
    }
  }
  if (signal.block) {
    return nextId
      ? calculateSignalAspect(nextId, dependencies, visited, selfIdx) === "red"
        ? "amber"
        : "green"
      : "green";
  }
  if (!dependencies.signalOn[id]) return "red";
  const route = dependencies.routeOf(id);
  if (route.blocked) return "red";
  const next = nextId;
  return next
    ? calculateSignalAspect(next, dependencies, visited, selfIdx) === "red"
      ? "amber"
      : "green"
    : "green";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DispatchingTable({
  dispatch = BEKASI_TAMBUN_CIBITUNG_DISPATCH,
}: { dispatch?: DispatchRuntime } = {}) {
  const {
    map: DISPATCH_MAP,
    scenario: DISPATCH_SCENARIO,
    notificationPolicy: NOTIFICATION_POLICY,
    journeys: JOURNEYS,
    signalSections: SIGNAL_SECTIONS,
    meetsByTrain: MEETS_BY_TRAIN,
    movement: MOVEMENT_DEFINITION,
  } = dispatch;

  // Phase 7 presentation mode: grid layouts keep the graph-paper chrome and
  // snapped train hops; schematic layouts render free-form from the geometry.
  const PRESENTATION = DISPATCH_MAP.presentation;
  const IS_SCHEMATIC = PRESENTATION.kind === "schematic";
  const SCHEMATIC_VIEWBOX = IS_SCHEMATIC ? PRESENTATION.viewBox : undefined;
  const STATION_SHAPES = PRESENTATION.stationShapes ?? [];
  const CONTROL_SCALE = PRESENTATION.controlScale ?? 1;
  const SIGNAL_SCALE = CONTROL_SCALE * (PRESENTATION.signalScale ?? 1);
  const POINT_SCALE = CONTROL_SCALE * (PRESENTATION.pointScale ?? 1);
  // Train marker geometry follows the same scale as the signal/point controls.
  // The body is authored in CELL units (the sim's footprint unit), but a dense
  // layout draws its tracks far closer together than CELL, so an unscaled
  // marker spans several tracks and swallows the controls underneath it.
  // Purely visual — the engine's own footprint still uses CELL.
  // Same scaled group as the height, so an authored length is the length the
  // marker ends up drawn at. The engine's own trainHalfLen is untouched.
  const TRAIN_HALF_LEN =
    PRESENTATION.trainLength !== undefined
      ? PRESENTATION.trainLength / 2 / CONTROL_SCALE
      : DISPATCH_MAP.grid.cellSize * CONTROL_SCALE;
  // The body height is a layout knob: a dense layout can ask for exactly its
  // grid pitch so the marker fills a cell. The marker group is drawn with
  // scale(CONTROL_SCALE) at tick time, so the authored height is divided by
  // it here — trainHeight is the height the train ENDS UP drawn at on the map.
  const TRAIN_HALF_HEIGHT =
    PRESENTATION.trainHeight !== undefined
      ? PRESENTATION.trainHeight / 2 / CONTROL_SCALE
      : 11 * CONTROL_SCALE;
  // Same scaled group, so the authored size is likewise the size on the map.
  const TRAIN_FONT_SIZE =
    PRESENTATION.trainFontSize !== undefined
      ? PRESENTATION.trainFontSize / CONTROL_SCALE
      : 12 * CONTROL_SCALE;
  // a pure multiplier, so no scale correction is needed
  const TRAIN_ARROW_SCALE = PRESENTATION.trainArrowScale ?? 1;
  // A bendy body is opt-in presentation: layouts that say nothing keep the
  // historical rigid rotated box.
  const ARTICULATED_TRAINS = PRESENTATION.articulatedTrains === true;
  // The DRAWN half-length in map units. The engine protects a signal with its
  // own (possibly longer) footprint, so every placement path has to convert
  // between the two consistently — a mismatch shows up as the marker jumping
  // when it changes segment.
  const VISUAL_HALF_LEN = TRAIN_HALF_LEN * CONTROL_SCALE;
  // the visual grid pitch may differ from the sim CELL (a dense layout aligns
  // its grid with its own track pitch); labels every GRID_LABEL_STEP-th cell
  const GRID_PITCH = PRESENTATION.gridCellSize ?? DISPATCH_MAP.grid.cellSize;
  // Reservation trimming and release offset behind the train centre.
  // TRAIN_HALF_LEN includes a trailing safety buffer to prevent clicking a
  // turnout right as a train clears it; on dense schematic layouts (JNG)
  // reducing it by one cell wide (GRID_PITCH) keeps that buffer without
  // locking approach crossovers during a station dwell.
  const RESERVATION_REAR_OFFSET =
    IS_SCHEMATIC && PRESENTATION.trainLength !== undefined
      ? Math.max(VISUAL_HALF_LEN, TRAIN_HALF_LEN - GRID_PITCH)
      : TRAIN_HALF_LEN;
  // conflict "!" badge sits just past the marker's leading corner
  const EXCLAM_OFFSET: [number, number] = [
    TRAIN_HALF_LEN - 10 * CONTROL_SCALE,
    -TRAIN_HALF_HEIGHT - CONTROL_SCALE,
  ];
  // the graph-paper chrome draws in grid mode, and in schematic mode when the
  // layout asks for it (presentation.grid)
  const SHOW_GRID = !IS_SCHEMATIC || PRESENTATION.grid === true;
  const GRID_LABEL_STEP = PRESENTATION.gridLabelStep ?? 1;
  const GRID_OFFSET = PRESENTATION.gridOffset ?? [0, 0];
  const GRID_LABEL_SIZE = PRESENTATION.gridLabelSize ?? 11;
  // The point-cell dash/eraser strokes are authored against the sim CELL.
  // A layout whose visual grid is finer than CELL needs them scaled down, but
  // NOT by the same factor:
  //   - the white ERASER must shrink hard. It is drawn diagonally across the
  //     cell, so its width bites sideways into the solid straight it crosses
  //     (a 3.5-wide band cuts ~31% of a 16-unit cell vs ~8% of a 58-unit one)
  //     — that is the visible notch in the straight route.
  //   - the DASHED GHOST must stay legible. Shrinking it by the same ratio
  //     leaves a 0.55-wide hairline next to a 2-wide track, which stops
  //     reading as a dashed line at all.
  // Both are capped at 1 so a coarse grid keeps the authored Bekasi look.
  const CELL_RATIO = Math.min(1, GRID_PITCH / DISPATCH_MAP.grid.cellSize);
  // Safety distance is layout data, not display geometry. Bekasi retains its
  // historical CELL/3 clearance; dense schematics can author a tighter value.
  const FLANK_CLEARANCE = DISPATCH_MAP.interlocking?.flankClearance ?? DISPATCH_MAP.grid.cellSize / 3;
  // Route-setting policy is layout data; layouts that say nothing keep the
  // historical auto-set behaviour.
  const ROUTE_SETTING = DISPATCH_MAP.interlocking?.routeSetting ?? "auto";
  // Track that is drawn and connected but cannot carry traffic. Resolved to a
  // line Y once, so the route check is a plain interval test.
  const CLOSED_SPANS: ClosedSpan[] = (DISPATCH_MAP.outOfService ?? []).map((span) => {
    const main = DISPATCH_MAP.lines.mains.find((m) => m.trackGroupId === span.groupId);
    if (!main) {
      throw new Error(
        `outOfService names unknown track group "${span.groupId}".`
      );
    }
    return {
      groupId: span.groupId,
      lineY: main.lineY,
      fromX: Math.min(span.fromX, span.toX),
      toX: Math.max(span.fromX, span.toX),
      reason: span.reason,
    };
  });
  // ...but the eraser has a HARD FLOOR: the solid track it must hide is drawn
  // at a fixed strokeWidth of 2 (TRACK_STROKE, not scaled), so an eraser
  // narrower than that leaves black slivers down both sides of the dashed
  // ghost instead of erasing the leg. Floor it at the track width (plus a
  // hairline for the round cap) — that is the narrowest stroke that still
  // does its job.
  const ERASER_SCALE = Math.max(
    TRACK_STROKE + 0.25,
    3.5 * CELL_RATIO
  ) / 3.5;
  // the ghost tracks the pitch far more gently (square root), so a 3.6x finer
  // grid thins the dash ~1.9x instead of ~3.6x
  const DASH_SCALE = Math.sqrt(CELL_RATIO);

  const {
    diagramAriaLabel: DIAGRAM_ARIA_LABEL,
    grid: {
      cellSize: CELL,
      shift: SHIFT,
      width: RIGHT,
      rowCount: GRID_ROW_COUNT,
      gridBottomY: GRID_BOTTOM_Y,
      viewBox: GRID_VIEWBOX,
      ticks: GRID_TICKS,
    },
    lines: {
      normalDirectionByY: NORMAL_DIR,
      normalBearingByLineY: NORMAL_BEARING,
    },
    loops: {
      byGroupId: LOOPS_BY_GROUP_ID,
      lineYs: LOOP_LINE_YS,
      rejoinByLineY: LOOP_REJOIN_BY_LINE_Y,
    },
    bidirectionalByY: BIDIRECTIONAL_BY_Y,
    switches: {
      items: SWITCHES,
      coupled: COUPLED,
      controls: POINT_CONTROLS,
      initialState: INITIAL_SWITCHES,
    },
    signals: {
      items: SIGNALS,
      initialState: INITIAL_SIGNALS,
    },
    trackPaths: ALL_TRACKS,
    trafficArrowPoints: TRAFFIC_ARROW_POINTS,
    stations: {
      nameplates: STATIONS,
      cells: STATION_CELLS,
      platformCenterX: PLATFORM_CENTER_X,
    },
  } = DISPATCH_MAP;

  // With scenario.spawn.atTrackEdge, trains approach from just short of their
  // OWN line's end (buildJourney clamps the spawn there), and each marker is
  // clipped to that line's drawn extent here: nothing is ever shown over the
  // blank space between the frame/grid edge and where the track actually
  // begins — the body slides in piece by piece across the track end instead.
  // Coordinates are in the shifted diagram's space (hence the − SHIFT).
  const TRACK_CLIPS = DISPATCH_SCENARIO.spawn?.atTrackEdge === true
    ? JOURNEYS.map(({ plan }) => {
        const xs = Object.values(MOVEMENT_DEFINITION.nodes)
          .filter((n) => n.y === plan.start.y)
          .map((n) => n.x);
        return xs.length ? { lo: Math.min(...xs) - SHIFT, hi: Math.max(...xs) - SHIFT } : null;
      })
    : null;

  // Phase 5: protected-block section of each signal as a track polyline.
  const SECTION_PATHS = DISPATCH_MAP.sectionPaths as Record<string, LeveledPoint[]>;
  const SIGNAL_SECTIONS_PTS = SIGNAL_SECTIONS.map((section) => ({
    ...section,
    pts: SECTION_PATHS[section.sig],
  }));
  const codeOf = createSignalCodeLookup(DISPATCH_MAP.signals.items);

  const [switches, setSwitches] = useState<Record<number, SwitchState>>(INITIAL_SWITCHES);
  const [signalOn, setSignalOn] = useState<Record<string, boolean>>(INITIAL_SIGNALS);
  const [conflictNote, setConflictNote] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false); // bottom point & signal buttons hidden by default
  const [clickLog, setClickLog] = useState<string[]>([]); // debug click history
  const [debugOpen, setDebugOpen] = useState(false);

  /** Append a click entry to the debug log with the current simulation time. */
  const logClick = (msg: string) =>
    setClickLog((l) => [...l, `[${fmtTime(simRef.current)}] ${msg}`]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // entry→exit route request: shift-click a signal to route the last-clicked
  // signal TO it (policy-a auto route set over a chosen path)
  const routeFromRef = useRef<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  // apply the saved/system dark preference once, and keep <html> in sync
  useEffect(() => {
    const saved =
      typeof localStorage !== "undefined" ? localStorage.getItem("ppka-dark") : null;
    const pref = saved
      ? saved === "1"
      : typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDarkMode(pref);
    document.documentElement.classList.toggle("dark", pref);
  }, []);
  const toggleDark = () => {
    setDarkMode((v) => {
      const next = !v;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("ppka-dark", next ? "1" : "0");
      return next;
    });
  };
  const [timeScale, setTimeScale] = useState<TimeScale>(1);
  const [paused, setPaused] = useState(true); // frozen until a start time is chosen
  const [startModalOpen, setStartModalOpen] = useState(true);
  const [startTimeInput, setStartTimeInput] = useState("00:00");
  const [selectedTrain, setSelectedTrain] = useState<number | null>(null); // journey index
  const [selectedStation, setSelectedStation] = useState<string | null>(null); // station code
  const openStation = (code: string) => {
    setSelectedTrain(null);
    setSelectedStation(code);
  };
  const openTrain = (ti: number) => {
    setSelectedStation(null);
    setSelectedTrain((cur) => (cur === ti ? null : ti));
  };
  const [rosterOpen, setRosterOpen] = useState(false);
  const rosterScrollRef = useRef<HTMLDivElement>(null);
  const stationScrollRef = useRef<HTMLDivElement>(null);
  // Auto-scroll a just-opened panel to the row nearest the current sim time
  // (instead of starting at the top of the timetable).
  useEffect(() => {
    if (rosterOpen) {
      rosterScrollRef.current?.querySelector<HTMLElement>("[data-now]")?.scrollIntoView({ block: "center" });
    }
  }, [rosterOpen]);
  useEffect(() => {
    if (selectedStation !== null) {
      stationScrollRef.current?.querySelector<HTMLElement>("[data-now]")?.scrollIntoView({ block: "center" });
    }
  }, [selectedStation]);
  const [rosterTick, setRosterTick] = useState(0); // periodic refresh for the roster/card
  const frameCountRef = useRef(0);
  const selectedIdxRef = useRef<number | null>(null);
  selectedIdxRef.current = selectedTrain;
  // held-at-signal notification board (configured-duration holds) + susul warnings
  type Notice = {
    id: number;
    trainNo: string;
    message: string;
    since: number; // sim time the hold began (live duration = now − since)
    resolved: boolean;
    resolvedDuration?: number;
    kind?: "susul" | "countdown"; // susul warning (amber), departure countdown (blue), or a signal hold (red)
  };
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextNoticeIdRef = useRef(1);
  const [noticesFolded, setNoticesFolded] = useState(false); // collapse the board, keep its history
  // a fresh notice auto-reopens the board even if the user folded it
  useEffect(() => {
    if (notices.length > 0) setNoticesFolded(false);
  }, [notices.length]);
  // Simulation-time accumulator (trains will consume this) + direct DOM clock
  // updates so the display stays smooth without re-rendering the table 60×/s.
  const simRef = useRef(0);
  /** Relative-clock mode (dwell.relativeAnchors): trains materialize at the
   *  chosen start second with st.time = 0 and are fed REAL elapsed seconds;
   *  station dwells then last their scheduled duration. */
  const RELATIVE_CLOCK = DISPATCH_SCENARIO.dwell?.relativeAnchors === true;
  const spawnSimRef = useRef<number[]>([]);
  const lastTickRef = useRef<number[]>([]);
  // Per-train platform-dwell marker easing: which leg the ease was engaged on
  // and the waypoint it eases toward (leg −1 = none). See the marker
  // placement in the tick loop for why the lead must ramp, not toggle.
  const dwellEaseRef = useRef<{ leg: number; x: number }[]>([]);
  const clockRef = useRef<HTMLSpanElement>(null);
  const scaleRef = useRef<number>(1);
  scaleRef.current = paused ? 0 : timeScale; // keep the tick loop in sync with the selected scale
  const startModalOpenRef = useRef(true); // the start modal hides all trains until "Mulai"
  startModalOpenRef.current = startModalOpen;
  // Train movement state (mutated per tick) — markers move via direct DOM
  // updates; React re-renders only when a train's occupied section changes.
  const trainStatesRef = useRef<TrainState[]>(
    JOURNEYS.map((j, ti) => {
      const st = initTrain(
        j.plan,
        MOVEMENT_DEFINITION.nodes,
        j.plan.legs[0]?.speed ?? 0
      );
      st.idx = ti;
      st.actualArr = j.train.stops.map(() => null);
      return st;
    })
  );
  // Where the meets hold reads a partner's crossing time from — the live train
  // states during the tick, the pass-1 placement snapshot during initializeSim.
  const meetsReadRef = useRef<(partnerIdx: number, stopIdx: number) => number | null>(() => null);
  /** When may train `ti` leave `station` (absolute sim time, 0 = no hold)? */
  const meetsRelease = (ti: number, station: string): number => {
    const deps = MEETS_BY_TRAIN.get(ti)?.get(station);
    if (!deps) return 0;
    let release = 0;
    for (const d of deps) {
      const crossed = meetsReadRef.current(d.partnerIdx, d.meetStopIdx);
      // the partner hasn't crossed the platform yet (behind / late) — on a
      // single track it cannot pass the held train, so there is nothing to
      // wait for: the train leaves on its schedule and the partner follows
      const relNow = RELATIVE_CLOCK
        ? simRef.current - (spawnSimRef.current[0] ?? simRef.current)
        : simRef.current;
      if (crossed == null || crossed >= relNow) continue;
      release = Math.max(release, crossed + d.releaseOffset);
    }
    return release;
  };
  /** Engine hook: the meets hold for the leg the train currently runs. */
  const meetsHold = (st: TrainState, legs: LegPlan): number => {
    const leg = legs[Math.min(st.leg, legs.length - 1)];
    return leg.station ? meetsRelease(st.idx, leg.station) : 0;
  };
  const trainGroupRefs = useRef<(SVGGElement | null)[]>([]);
  const trainRectRefs = useRef<(SVGRectElement | null)[]>([]);
  const trainTextRefs = useRef<(SVGTextElement | null)[]>([]);
  const trainArrowRefs = useRef<(SVGPathElement | null)[]>([]);
  const trainBendyRefs = useRef<(SVGPathElement | null)[]>([]);
  const trainExclamRefs = useRef<(SVGGElement | null)[]>([]);
  const [occupancyTick, setOccupancyTick] = useState(0);
  const trainSectionKeyRef = useRef("");
  // Independent route reservations: created when the player clears a signal,
  // persist while a train uses them, and are consumed progressively by the train.
  type Reservation = { pts: LeveledPoint[]; nextSignalId?: string; lineY: number; nodePath?: string[] };
  const [reservations, setReservations] = useState<Record<string, Reservation>>({});
  const reservationsRef = useRef(reservations);
  reservationsRef.current = reservations;
  const reservationPathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const conflictReportedRef = useRef(false); // show the conflict warning only once per event
  // which journey index has consumed each signal's reservation — set when a
  // train passes the owning signal, so the route can be trimmed behind the
  // train's front and released when that train finishes its journey
  const reservedByRef = useRef<Record<string, number>>({});
  // distance from a point to the route polyline (the train's center vs the
  // reserved path — 0 while it is on the route)
  const distToPoly = (px: number, py: number, pts: LeveledPoint[]) => {
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
      best = Math.min(best, Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t)));
    }
    return best;
  };
  // The unpassed (still-protected) portion of a reservation, trimmed at the
  // front of the train that owns it. null = the owner finished its journey,
  // so the reservation should be released.
  const unpassedOf = (id: string, res: Reservation): LeveledPoint[] | null => {
    const ownerIdx = reservedByRef.current[id];
    const owner = ownerIdx !== undefined ? trainStatesRef.current[ownerIdx] : undefined;
    if (owner && owner.done) return null;
    const ownerDir = SIGNALS.find((s) => s.id === id)?.dir;
    // Trim at the train's REAR, not its nose: a cell stays reserved until the
    // whole body has left it. The offset is the DRAWN half-length — the
    // highlight hugs the visible tail instead of trailing an engine-footprint
    // margin behind it. (reservationAhead splits the polyline at the given
    // point and keeps the far side.)
    let fronts: { lineY: number; front: number }[] = [];
    if (owner && owner.spawned) {
      fronts = [
        { lineY: owner.y, front: owner.dir === "left" ? owner.x + RESERVATION_REAR_OFFSET : owner.x - RESERVATION_REAR_OFFSET },
      ];
    } else {
      // No claimed owner yet. A freshly set reservation must render IN FULL —
      // trimming against just any same-direction train lets a train on the
      // ADJACENT parallel track (32u away on JNG) cut the route to the stub
      // ahead of it, so a cleared signal appears to reserve only at the
      // platform. Only trains whose centre is essentially ON the polyline
      // (the same criterion ownership uses) may trim it.
      fronts = trainStatesRef.current
        .filter(
          (m) =>
            m.spawned &&
            !m.done &&
            m.dir === ownerDir &&
            distToPoly(m.x, m.y, res.pts) <= CELL / 3
        )
        .map((m) => ({ lineY: m.y, front: m.dir === "left" ? m.x + CELL : m.x - CELL }));
    }
    return reservationAhead(res.pts, fronts) ?? res.pts;
  };
  /** The VISIBLE highlight: only the route strictly AHEAD of the owner's nose
   *  is painted — the amber line is invisible over/behind the train body even
   *  though those cells stay reserved (freeing logic stays rear-based via
   *  unpassedOf). Same ownerless filtering as unpassedOf. */
  const visibleOf = (id: string, res: Reservation): LeveledPoint[] | null => {
    const ownerIdx = reservedByRef.current[id];
    const owner = ownerIdx !== undefined ? trainStatesRef.current[ownerIdx] : undefined;
    if (owner && owner.done) return null;
    const ownerDir = SIGNALS.find((s) => s.id === id)?.dir;
    let fronts: { lineY: number; front: number }[] = [];
    if (owner && owner.spawned) {
      fronts = [
        { lineY: owner.y, front: owner.dir === "left" ? owner.x - TRAIN_HALF_LEN : owner.x + TRAIN_HALF_LEN },
      ];
    } else {
      fronts = trainStatesRef.current
        .filter(
          (m) =>
            m.spawned &&
            !m.done &&
            m.dir === ownerDir &&
            distToPoly(m.x, m.y, res.pts) <= CELL / 3
        )
        .map((m) => ({ lineY: m.y, front: m.dir === "left" ? m.x - TRAIN_HALF_LEN : m.x + TRAIN_HALF_LEN }));
    }
    return reservationAhead(res.pts, fronts) ?? res.pts;
  };
  // latest ctx for the tick loop (mutated each render)
  const switchesRef = useRef(switches);
  switchesRef.current = switches;
  // Track-class speed caps, derived once: straight vs turnout vs fast zone.
  const segmentSpeeds = useMemo(
    () =>
      DISPATCH_SCENARIO.trackSpeeds
        ? buildSegmentLimits(DISPATCH_MAP.nodes, DISPATCH_SCENARIO.trackSpeeds)
        : undefined,
    []
  );
  const segmentSpeedsRef = useRef(segmentSpeeds);
  switchesRef.current = switches;
  const aspectOfRef = useRef<(id: string, selfIdx?: number) => Aspect>(() => "red");

  // Close the settings popover on Escape.
  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  /**
   * Start the simulation at a timetable time. Trains whose origin is still in
   * the future stay hidden; trains already in service are PLACED at their
   * schedule position for that time (80 km/h running + station recovery/dwell),
   * signals ignored — the interlocking takes over from there. Trains that
   * finished before the start time have already left the map.
   */
  const initializeSim = (sec: number) => {
    simRef.current = sec;
    const mkCtx = (): MoveCtx => ({
      ...MOVEMENT_DEFINITION,
      switches,
      aspectOf: aspectOfRef.current,
      ignoreSignals: true,
    });
    const place = (ctx: MoveCtx) => {
      JOURNEYS.forEach((j, ti) => {
        const st = trainStatesRef.current[ti];
        const plan = j.plan;
        if (sec < plan.originArr) {
          st.spawned = false;
          return;
        }
        st.spawned = true;
        spawnSimRef.current[ti] = sec;
        lastTickRef.current[ti] = sec;
        if (RELATIVE_CLOCK) {
          // fresh at the spawn edge with a zeroed clock — the approach runs
          // LIVE from tick one (no schedule interpolation, no teleport)
          return;
        }
        const travel = sec - st.originArr;
        // Cap schedule interpolation at the line entry for edge-spawned
        // journeys: with realistic leg speeds even a small pre-start window
        // would otherwise teleport the train deep into the throat (often on
        // top of a red signal, where it freezes). It enters from the visible
        // edge instead and runs the rest LIVE; its internal clock only
        // advances by distance actually covered, so absolute dwell anchors
        // still apply.
        let adv = travel;
        if (!st.done && plan.approach && plan.start.entryX !== undefined && adv > 0) {
          const v = Math.max(1e-9, plan.legs[0]?.speed ?? 1);
          const cap = Math.abs(plan.start.entryX - plan.start.x) / v;
          if (adv > cap) adv = cap;
        }
        if (!st.done) advanceTrain(st, adv, ctx, plan.legs);
        st.time = adv;
      });
    };
    // pass 1 — place with meets holds OFF so every partner's crossing time is
    // recorded; pass 2 re-places from scratch with the holds active, reading
    // the pass-1 crossings (a held train must sit at the meet station even
    // when a partner crossed late into its dwell window)
    place(mkCtx());
    const snapshot = trainStatesRef.current.map((st) => [...st.actualArr]);
    trainStatesRef.current = trainStatesRef.current.map((st, ti) => {
      const n = initTrain(
        JOURNEYS[ti].plan,
        MOVEMENT_DEFINITION.nodes,
        JOURNEYS[ti].plan.legs[0]?.speed ?? 0
      );
      n.idx = ti;
      n.actualArr = JOURNEYS[ti].train.stops.map(() => null);
      return n;
    });
    dwellEaseRef.current = JOURNEYS.map(() => ({ leg: -1, x: 0 }));
    meetsReadRef.current = (pi, si) => snapshot[pi]?.[si] ?? null;
    const ctx2 = mkCtx();
    ctx2.meetsHold = meetsHold;
    place(ctx2);
    // trains that left their origin before the start time get no live susul
    // warning (it would be stale the moment the panel opens). Same CENTER-based
    // crossing test as the live check.
    JOURNEYS.forEach((j, ti) => {
      const st = trainStatesRef.current[ti];
      if (MEETS_BY_TRAIN.has(ti) && st.spawned && !st.done) {
        const origin = j.train.stops[0].trackmark;
        const originX = PLATFORM_CENTER_X[origin];
        st.susulWarned = st.dir === "right" ? st.x > originX : st.x < originX;
      }
    });
    setPaused(false);
    setStartModalOpen(false);
  };

  // A ?start=HH:MM query param skips the picker (used by the e2e suite);
  // ?controls=1 unlocks the point & signal buttons (the e2e suite drives them).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const start = q.get("start");
    if (start) {
      const [h, m] = start.split(":").map(Number);
      initializeSim((h || 0) * 3600 + (m || 0) * 60);
    }
    if (q.get("controls") === "1") setShowControls(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulation clock: advances accumulated sim-time at the selected scale and
  // writes the display directly (no React re-render per frame). Trains advance
  // on the same accumulator; markers move via direct DOM updates and React
  // re-renders only when a train's occupied signal section changes.
  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      // clamp: a wall-clock jump backward (pauseAt, NTP, debugger) must never rewind the sim
      const dt = Math.max(0, ((now - last) / 1000) * scaleRef.current);
      last = now;
      simRef.current += dt;
      const el = clockRef.current;
      if (el) {
        const t = fmtTime(simRef.current);
        if (el.textContent !== t) {
          el.textContent = t;
          el.setAttribute("aria-label", `Waktu simulasi ${t}`);
        }
      }
      const ctx: MoveCtx = {
        ...MOVEMENT_DEFINITION,
        segmentLevels: DISPATCH_MAP.segmentLevels,
        // per-segment track-class caps (straight / turnout / fast zone) —
        // placement (initializeSim) deliberately omits these so scheduled
        // positioning ignores track classes
        segmentSpeeds: segmentSpeedsRef.current,
        switches: switchesRef.current,
        aspectOf: aspectOfRef.current,
        meetsHold,
        now: simRef.current,
        driverReactionSeconds: DISPATCH_SCENARIO.driver?.reactionSeconds ?? 0,
        stopFrameAtDwellArrival: RELATIVE_CLOCK,
      };
      // partner crossings come from the live states each tick
      meetsReadRef.current = (pi, si) => trainStatesRef.current[pi]?.actualArr[si] ?? null;
      // Continuous conflict failsafe: a MOVING train whose body overlaps any
      // other train is stopped with a conflict flag — a collision the signal
      // system should have prevented. Trains at REST (stopped at a signal, or
      // dwelling at a station per the schedule) tolerate an overlap — the sim
      // has no train-to-train spacing, so a queue at a signal or platform
      // naturally touches. Conflict stops are released here once the
      // overlapping train moves on or despawns. Also collects the trains in a
      // live conflict so each marker can show a "!" badge.
      const live = trainStatesRef.current.filter((m) => m.spawned && !m.done);
      const atRest = (m: TrainState): boolean => {
        if (m.stopped) return true;
        const plan = JOURNEYS[m.idx]?.plan;
        if (!plan) return false;
        const leg = plan.legs[Math.min(m.leg, plan.legs.length - 1)];
        const base = leg.departAt ?? 0;
        const meets = meetsRelease(m.idx, leg.station ?? "");
        return base > 0 || meets > 0 ? m.time < Math.max(base, meets) : false; // dwelling
      };
      // Two trains conflict only when their BODIES genuinely share track —
      // Phase 5: the footprint polylines overlap (horizontal fast path keeps
      // the old interval test; diagonals/curves use true body-overlap). This
      // removes the |Δy| < CELL/2 track-spacing fudge that was fragile at the
      // 57–59 px spacing and flagged opposite loop diagonals that never meet.
      const overlaps = (a: TrainState, b: TrainState) => bodiesOverlap(a, b, CELL);
      // Same line, same direction → this is a FOLLOW, not a collision: only
      // the REAR train stops (the leader may be a dwelling queue head or
      // simply ahead). Stopping both would deadlock them — each waits for the
      // other to clear, and two co-moving trains at track speed (e.g. spawned
      // together at a shared entry edge, like two EB trains on t1) would freeze
      // forever. The follower releases via the loop below once the leader
      // moves on. The leader is the frontmost in the travel direction; at a
      // spawn-coincidence tie (identical x) the earlier scheduled origin
      // leads, index as the deterministic fallback.
      const leaderOf = (a: TrainState, b: TrainState): TrainState => {
        if (a.x !== b.x) return (a.dir === "right" ? a.x > b.x : a.x < b.x) ? a : b;
        const aOrigin = JOURNEYS[a.idx]?.train.stops[0]?.arr ?? 0;
        const bOrigin = JOURNEYS[b.idx]?.train.stops[0]?.arr ?? 0;
        if (aOrigin !== bOrigin) return aOrigin < bOrigin ? a : b;
        return a.idx < b.idx ? a : b;
      };
      const conflictIdx = new Set<number>();
      let newConflict = false;
      let conflictPair: string | null = null;
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i];
          const b = live[j];
          if (!overlaps(a, b) || (atRest(a) && atRest(b))) continue; // tolerated queue
          // same line + same direction: a following move — stop the follower
          // only, the leader keeps its state (running, signal-held, dwelling)
          const follow = a.y === b.y && a.dir === b.dir;
          const leader = follow ? leaderOf(a, b) : null;
          if (follow) {
            // a following move: stop the follower only — the badge and toast
            // stay reserved for genuine collisions
          } else {
            conflictIdx.add(a.idx);
            conflictIdx.add(b.idx);
          }
          conflictPair = `${JOURNEYS[a.idx]?.train.train_no ?? "?"} vs ${JOURNEYS[b.idx]?.train.train_no ?? "?"}`;
          for (const t of [a, b]) {
            if (t === leader) continue; // the leader is free to run
            if (!atRest(t)) {
              t.stopped = true;
              t.stopReason = follow ? "queue" : "conflict";
              if (!follow) newConflict = true;
            }
          }
        }
      }
      if (newConflict && !conflictReportedRef.current) {
        conflictReportedRef.current = true;
        logClick(`⚠ conflict — two trains overlap on the track${conflictPair ? ` (${conflictPair})` : ""}`);
        setConflictNote("Konflik — dua kereta di jalur yang sama.");
        window.setTimeout(() => setConflictNote(null), 5000);
      }
      if (!newConflict) conflictReportedRef.current = false;
      for (const m of live) {
        if (
          m.stopped &&
          (m.stopReason === "conflict" || m.stopReason === "queue") &&
          !live.some((o) => o.idx !== m.idx && overlaps(o, m))
        ) {
          m.stopped = false;
          m.stopReason = null;
          if (RELATIVE_CLOCK) {
            // relative clock: resume from the train's own timeline, not the
            // absolute sim second (its anchors are materialization-relative)
            lastTickRef.current[m.idx] = simRef.current;
          } else {
            m.time = simRef.current - m.originArr; // absorb the frozen period
          }
        }
      }
      const sections = JOURNEYS.map((j, ti) => {
        const st = trainStatesRef.current[ti];
        const plan = j.plan;
        const g = trainGroupRefs.current[ti];
        const txt = trainTextRefs.current[ti];
        // nothing is spawned until the player picks a start time
        if (startModalOpenRef.current) {
          g?.setAttribute("visibility", "hidden");
          return "";
        }
        // finished its journey — despawned off the map
        if (st.done) {
          g?.setAttribute("visibility", "hidden");
          return "";
        }
        if (simRef.current < plan.originArr) {
          g?.setAttribute("visibility", "hidden");
          return "";
        }
        st.spawned = true;
        if (RELATIVE_CLOCK) {
          // Relative clock (dwell.relativeAnchors scenarios): feed the engine
          // real elapsed seconds each tick. The train runs its approach LIVE
          // from the spawn edge and its station dwells last their scheduled
          // DURATION — no first-tick mega-budget teleporting it to its hold
          // point. While stopped, time is frozen (no schedule consumed).
          const spawnedAt = spawnSimRef.current[ti];
          const last = Math.max(lastTickRef.current[ti] ?? spawnedAt, spawnedAt);
          if (st.stopped || st.done) {
            advanceTrain(st, 0, ctx, plan.legs);
            if (!st.stopped && !st.done) lastTickRef.current[ti] = simRef.current; // resume without a jump
          } else if (simRef.current > last) {
            advanceTrain(st, simRef.current - last, ctx, plan.legs);
            lastTickRef.current[ti] = simRef.current;
          }
        } else {
        // advance only the travel time since the origin (big sim jumps must not
        // let the train run before it materializes). While stopped, no travel
        // time is consumed — the engine only re-checks the release condition,
        // and on release the budget resets so the train resumes without a jump.
        const travel = Math.max(0, simRef.current - st.originArr); // = sim (originArr 0)
        if (st.stopped) {
          advanceTrain(st, 0, ctx, plan.legs);
          if (!st.stopped) st.time = travel; // absorb signal/junction stop time on release
        } else {
          const delta = travel - st.time;
          if (delta > 0 && !st.done) advanceTrain(st, delta, ctx, plan.legs);
          // st.time is advanced by the engine (movement + scheduled dwells)
        }
        }
        // Signal-pass consumption: signals the train's leading edge crossed
        // this tick lose their player clear (they stay red until re-clicked).
        // Reservations whose routes ENDED at the consumed signal are NOT freed
        // here — the consuming train's body is usually still inside their
        // cells. Instead the train CLAIMS them, and the progress logic below
        // frees each cell once its REAR has fully passed it.
        for (const pid of st.passedSignals) {
          const s = SIGNALS.find((x) => x.id === pid);
          if (!s) continue;
          if (!s.block && !s.ai) {
            // the train consumed this signal's clear — it now owns the
            // reservation, so the route can be trimmed/released by its progress
            if (reservationsRef.current[s.id]) reservedByRef.current[s.id] = ti;
            setSignalOn((o) => (o[s.id] ? { ...o, [s.id]: false } : o));
          }
          for (const [k, v] of Object.entries(reservationsRef.current)) {
            if (v.nextSignalId === s.id && reservedByRef.current[k] === undefined) {
              reservedByRef.current[k] = ti;
            }
          }
        }
        // Held-at-signal notifications: a train held past the configured threshold fires
        // a board notice; it resolves when the train moves again.
        if (st.stopped && st.stopReason === "signal") {
          if (st.holdSince === null) {
            st.holdSince = simRef.current;
            st.holdNotified = false;
          } else if (
            !st.holdNotified &&
            simRef.current - st.holdSince >
              NOTIFICATION_POLICY.heldAtSignalThresholdSeconds
          ) {
            st.holdNotified = true;
            const id = nextNoticeIdRef.current++;
            st.notificationId = id;
            setNotices((ns) =>
              [
                {
                  id,
                  trainNo: j.train.train_no,
                  message: `Ditahan di sinyal ${codeOf(st.stopSignalId ?? "")}`,
                  since: st.holdSince!, // non-null here: the hold began on an earlier tick
                  resolved: false,
                },
                ...ns,
              ].slice(0, NOTIFICATION_POLICY.boardLimit)
            );
          }
        } else if (st.holdSince !== null) {
          if (st.notificationId !== null) {
            const dur = Math.max(0, Math.round(simRef.current - st.holdSince));
            setNotices((ns) =>
              ns.map((x) => (x.id === st.notificationId ? { ...x, resolved: true, resolvedDuration: dur } : x))
            );
            st.notificationId = null;
          }
          st.holdSince = null;
          st.holdNotified = false;
        }
        // Susul warning: once a held train LEAVES its origin (BKST eastbound /
        // CIT westbound), tell the user the passing train is approaching — the
        // overtake at Tambun is on its way. One-shot per train. The CENTER must
        // cross the origin column: the front passes it on arrival (the marker
        // stops with its center at the platform), and originArr=0 trains start
        // already sitting on it.
        if (!st.susulWarned) {
          const origin = j.train.stops[0].trackmark;
          const originX = PLATFORM_CENTER_X[origin];
          const departed = st.dir === "right" ? st.x > originX : st.x < originX;
          if (departed) {
            st.susulWarned = true;
            const passers = (
              MEETS_BY_TRAIN.get(ti)?.get(NOTIFICATION_POLICY.susulMeetStation) ?? []
            ).map(
              (d) => JOURNEYS[d.partnerIdx].train.train_no
            );
            if (passers.length) {
              setNotices((ns) =>
                [
                  ...passers.map((p) => ({
                    id: nextNoticeIdRef.current++,
                    kind: "susul" as const,
                    trainNo: `KA ${p}`,
                    message: `sudah mendekati ${stationName(origin)}!`,
                    since: simRef.current,
                    resolved: false,
                  })),
                  ...ns,
                ].slice(0, NOTIFICATION_POLICY.boardLimit)
              );
            }
          }
        }
        // Departure countdown: any train dwelling at Tambun announces its
        // scheduled departure within the configured first threshold, then the SAME
        // notice flips at the urgent threshold (found by train no + kind — never a duplicate). It is
        // marked resolved once the train has left.
        const countdownPolicy = NOTIFICATION_POLICY.departureCountdown;
        const countdownStop = j.train.stops[countdownPolicy.stopIndex];
        if (
          countdownStop?.trackmark === countdownPolicy.station &&
          countdownStop.arr < countdownStop.dep
        ) {
          const leg = plan.legs[Math.min(st.leg, plan.legs.length - 1)];
          const atCountdownStation =
            leg.station === countdownPolicy.station && st.time < (leg.departAt ?? 0);
          const remaining = countdownStop.dep - simRef.current;
          const key = `KA ${j.train.train_no}`;
          if (
            atCountdownStation &&
            remaining > 0 &&
            remaining <= countdownPolicy.firstThresholdSeconds
          ) {
            const countdownSeconds =
              remaining <= countdownPolicy.urgentThresholdSeconds
                ? countdownPolicy.urgentThresholdSeconds
                : countdownPolicy.firstThresholdSeconds;
            const msg = `dijadwalkan berangkat ${countdownSeconds} detik lagi`;
            setNotices((ns) => {
              const existing = ns.find((x) => x.kind === "countdown" && x.trainNo === key);
              if (existing) {
                if (existing.message === msg) return ns;
                return ns.map((x) => (x.id === existing.id ? { ...x, message: msg } : x));
              }
              return [
                { id: nextNoticeIdRef.current++, kind: "countdown" as const, trainNo: key, message: msg, since: simRef.current, resolved: false },
                ...ns,
              ].slice(0, NOTIFICATION_POLICY.boardLimit);
            });
          } else if (remaining <= 0) {
            setNotices((ns) =>
              ns.map((x) =>
                x.kind === "countdown" && x.trainNo === key && !x.resolved
                  ? { ...x, resolved: true, resolvedDuration: 0 }
                  : x
              )
            );
          }
        }
        // keep reservation highlights in sync with the train's progress (per-cell).
        // The release must NOT depend on the path element existing — once the
        // owner despawns the render hides the path, so bail only on the visual.
        for (const [id, res] of Object.entries(reservationsRef.current)) {
          const el = reservationPathRefs.current[id];
          const ownerDir = SIGNALS.find((s) => s.id === id)?.dir;
          // the route's user: the recorded train. It is set ONCE, geometrically,
          // when the first same-direction train actually enters the route (a
          // train can divert onto a route without passing its signal). Another
          // train passing near the route must NEVER take the reservation over.
          const hadUser = reservedByRef.current[id] !== undefined;
          let userIdx: number | undefined = reservedByRef.current[id];
          let user = userIdx !== undefined ? trainStatesRef.current[userIdx] : undefined;
          if (hadUser && user && user.done) {
            // the train that used the route finished its journey — release
            delete reservedByRef.current[id];
            setReservations((r) => {
              if (!r[id]) return r;
              const { [id]: _, ...rest } = r;
              return rest;
            });
            continue;
          }
          if (!hadUser) {
            let bestD = Infinity;
            let bestIdx: number | undefined;
            trainStatesRef.current.forEach((m, i) => {
              if (!m.spawned || m.done || m.dir !== ownerDir) return;
              const d = distToPoly(m.x, m.y, res.pts);
              if (d < bestD) {
                bestD = d;
                bestIdx = i;
              }
            });
            // Ownership threshold must stay BELOW the track spacing (32 on
            // JNG): with CELL (58) a train on the ADJACENT parallel track is
            // within range and claims — trims, then releases — a route it
            // never runs over. A centre essentially ON the polyline is a user;
            // anything else is merely near it.
            if (bestIdx !== undefined && bestD <= CELL / 3) {
              reservedByRef.current[id] = bestIdx;
              userIdx = bestIdx;
              user = trainStatesRef.current[bestIdx];
            }
          }
          const end = res.pts[res.pts.length - 1];
          // "Fully passed" is judged at the train's REAR — releasing at the
          // nose would free cells the body still occupies. The offset is the
          // DRAWN half-length so the highlight hugs the visible tail.
          const rear = user ? (ownerDir === "left" ? user.x + RESERVATION_REAR_OFFSET : user.x - RESERVATION_REAR_OFFSET) : 0;
          const passedEnd = user
            ? ownerDir === "left"
              ? rear <= end[0]
              : rear >= end[0]
            : false;
          // the user left the route (diverged away) without finishing it
          const leftRoute = !!user && !user.done && distToPoly(user.x, user.y, res.pts) > CELL * 1.5;
          // A train physically ON a bidirectional loop has taken over the
          // protection: the loop sections now cover the whole track, so a train
          // anywhere on it reddens every loop signal (both directions). Release
          // the reservation as soon as the train is actually in the loop. The
          // loop is found by envelope (its own Y + x-range), not Y proximity —
          // two loops may share a Y.
          const onLoop =
            !!user &&
            !user.done &&
            Object.values(LOOPS_BY_GROUP_ID).some(
              (loop) =>
                Math.abs(loop.lineY - user.y) < 1 &&
                user.x >= loop.minX &&
                user.x <= loop.maxX
            );
          // release once the train using the route finished (above), its REAR
          // passed the far end, it diverged away, or it is physically in the
          // loop — points unlock, signals clear
          if (userIdx !== undefined && (passedEnd || leftRoute || onLoop)) {
            delete reservedByRef.current[id];
            setReservations((r) => {
              if (!r[id]) return r;
              const { [id]: _, ...rest } = r;
              return rest;
            });
            continue;
          }
          if (el) {
            const ahead = visibleOf(id, res);
            const d = ahead && ahead.length >= 2 ? "M" + ahead.map(([x, y]) => `${x},${y}`).join(" ") : "";
            if (el.getAttribute("d") !== d) el.setAttribute("d", d);
          }
        }
        // Render mode is presentation only. The engine always moves, stops,
        // reserves, and tests occupancy at its true continuous coordinates.
        // A grid (or a schematic that opts OUT of continuousTrains) merely
        // snaps the marker to its visual pitch, like Bekasi's cell-to-cell
        // motion. `GRID_PITCH` makes a dense schematic such as JNG use its
        // 16-unit graph-paper cells rather than the engine's 58-unit CELL.
        // A scheduled platform dwell is different from a signal hold: the
        // platform is authored for the TRAIN CENTRE, so do not apply the
        // operational-front compensation there. Otherwise EB trains drift
        // east to W–Z and WB trains drift west to S–V instead of occupying the
        // U–X platform.
        // A pass-through leg (corridor boundary) is never a dwell, however the
        // clock compares: its anchor IS the expected arrival, so the test is a
        // floating-point tie. Excluding it structurally keeps the boundary
        // from being treated as a platform stop.
        const renderLeg = plan.legs[Math.min(st.leg, plan.legs.length - 1)];
        const atPlatformDwell =
          st.stationDepartureHold ||
          (!st.stopped &&
            !renderLeg.passThrough &&
            renderLeg.departAt !== undefined &&
            st.time < renderLeg.departAt);
        // Platform-dwell marker EASING. The running marker leads the engine
        // centre by the engine-to-visual front difference so its nose tracks
        // the protection footprint, but a dwell parks the CENTRE on the
        // platform. Switching that lead off the instant the dwell starts
        // made the marker teleport BACK a cell at arrival (and forward again
        // at departure) on any layout whose visual and operational
        // half-lengths differ (JNG: 58 vs 32; Bekasi: equal, unaffected).
        // Instead the lead ramps to zero around the dwell waypoint: the drawn
        // marker glides onto the platform as the engine arrives and pulls
        // ahead again as it departs. `easeX` is that waypoint while the train
        // dwells at / is held at / departs the platform, or approaches one
        // whose dwell anchor is still ahead of the expected arrival (latched
        // per leg so a mid-approach speed change cannot flicker it off).
        // Ease ONLY where the engine will really stand still. `advanceTrain`
        // dwells on a strict `st.time < departAt`, so a waypoint whose anchor
        // equals the arrival (every pass-through boundary: `anchor = arr`)
        // is run straight through. Testing `<=` here engaged the ease on
        // those too, pulling the marker back by the full front compensation
        // at the boundary and then pushing it forward again — the one-cell
        // "glitch" at JNG-E/JNG-W. `dwellsAt` is the single source of truth.
        const easeState = dwellEaseRef.current[ti] ?? { leg: -1, x: 0 };
        let easeX: number | null = null;
        const dwellStopIdx = st.leg - 1 + (st.approach ? 0 : 1);
        const dwellsAt = (legIdx: number, arrival: number): boolean => {
          const l = plan.legs[legIdx];
          return !!l && !l.passThrough && l.departAt !== undefined && arrival < l.departAt;
        };
        const arrivedBeforeAnchor =
          st.leg > 0 &&
          st.actualArr[dwellStopIdx] != null &&
          dwellsAt(st.leg, st.actualArr[dwellStopIdx]!);
        if (arrivedBeforeAnchor) {
          easeX = plan.legs[st.leg - 1].waypointX;
        } else if (easeState.leg === st.leg) {
          easeX = easeState.x; // approach latch: keep easing once engaged for this leg
        } else {
          const expectedArr =
            st.time +
            Math.abs(renderLeg.waypointX - st.x) / Math.max(1e-6, renderLeg.speed);
          if (dwellsAt(st.leg + 1, expectedArr)) easeX = renderLeg.waypointX;
        }
        dwellEaseRef.current[ti] =
          easeX === null ? { leg: -1, x: 0 } : { leg: st.leg, x: easeX };
        const frontCompensation =
          MOVEMENT_DEFINITION.trainHalfLen - VISUAL_HALF_LEN;
        const leadFactor =
          easeX === null || frontCompensation <= 0
            ? 1
            : Math.min(1, Math.abs(st.x - easeX) / frontCompensation);
        const horizontal = st.segFrom[1] === st.segTo[1];
        const continuousMarker = IS_SCHEMATIC && PRESENTATION.continuousTrains;
        const markerPitch = continuousMarker ? CELL : GRID_PITCH;
        // Snap a horizontal marker's CENTRE to a vertical grid line, not a
        // cell centre. Its 4-cell JNG body then fills whole cells instead of
        // straddling five of them. Bekasi's origin is zero, so it retains its
        // historical coordinates exactly.
        const markerXOrigin = GRID_OFFSET[0];
        let rx = st.x;
        let ry = st.y;
        let ang = 0;
        if (continuousMarker) {
          const [fx, fy] = st.segFrom;
          const [tx, ty] = st.segTo;
          ang = (Math.atan2(ty - fy, tx - fx) * 180) / Math.PI;
        } else if (horizontal) {
          // The engine protects the signal using its own (possibly longer)
          // footprint. A shorter drawn marker must always be shifted toward
          // its direction of travel by the difference in half lengths — not
          // only while stopped. Otherwise it correctly fills AU–AX while held
          // at NE2, then jumps BACK one cell to AV–AY as soon as NE2 clears.
          // Bekasi remains unchanged because its visual and operational
          // half-lengths are equal. Near a platform dwell the shift EASES to
          // zero (leadFactor) so the marker glides onto the platform instead
          // of jumping back a cell when the dwell starts.
          const engineToVisualFront = frontCompensation * leadFactor;
          const visualCenter = st.x + (st.dir === "right" ? engineToVisualFront : -engineToVisualFront);
          const raw = (visualCenter + SHIFT - markerXOrigin) / markerPitch;
          const snapped = st.stopped
            ? st.dir === "right"
              ? Math.floor(raw)
              : Math.ceil(raw)
            : Math.round(raw);
          rx = markerXOrigin + snapped * markerPitch - SHIFT;
        } else {
          // Diagonals advance by one DISPLAY CELL on their dominant axis. On
          // JNG's 45-degree crossovers that is 16 in both x and y (rather than
          // a 16-unit Euclidean step, which would land between grid cells).
          const [fx, fy] = st.segFrom;
          const [tx, ty] = st.segTo;
          const dx = tx - fx;
          const dy = ty - fy;
          const len = Math.hypot(dx, dy) || 1;
          const dominantAxis = Math.max(Math.abs(dx), Math.abs(dy)) / len || 1;
          const diagonalPitch = markerPitch / dominantAxis;
          // Same visual-front compensation as the horizontal branch, eased
          // near a platform dwell (leadFactor). Without it the marker shifts
          // by the half-length difference at every straight/diagonal handover
          // and appears to jump BACKWARD as it enters a crossover.
          const progress =
            Math.hypot(st.x - fx, st.y - fy) + frontCompensation * leadFactor;
          const stepped = Math.min(len, Math.round(progress / diagonalPitch) * diagonalPitch);
          const t = stepped / len;
          rx = fx + dx * t;
          ry = fy + dy * t;
          ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        }
        // An articulated body is drawn in MAP space (it spans several segments
        // at different bearings, so it cannot live in the marker's own rotated
        // frame). The spine is an arc-length window on the train's own route,
        // centred on the DRAWN centre — so the nose bends into a thrown point
        // as soon as it reaches it, not a half-body later when the engine's
        // centre does.
        const rawSpine =
          ARTICULATED_TRAINS && !continuousMarker
            ? spineOf(st, [rx, ry], VISUAL_HALF_LEN, pathAhead(st, ctx, VISUAL_HALF_LEN))
            : null;
        const bendySpine = rawSpine ? withoutStraightJoints(rawSpine) : null;
        // A bend is only worth drawing while the body actually spans one. On
        // plain track the rigid box is identical and cheaper.
        const bendy = bendySpine !== null && bendySpine.length > 2;
        if (g) {
          // The bendy path carries its own map-space geometry, so the group
          // must not also rotate it; only the upright chrome is placed here.
          g.setAttribute(
            "transform",
            bendy
              ? `translate(${rx}, ${ry}) scale(${CONTROL_SCALE})`
              : `translate(${rx}, ${ry}) rotate(${ang}) scale(${CONTROL_SCALE})`
          );
          g.setAttribute("visibility", "visible");
          g.setAttribute("data-x", String(Math.round(rx)));
          g.setAttribute("data-y", String(Math.round(ry)));
          g.setAttribute("data-bendy", bendy ? "true" : "false");
        }
        // Marker color clues the train's state: green = stopped at a station
        // (scheduled dwell), red = held at a red signal, amber = waiting at a
        // junction for the route, blue = running.
        const leg = renderLeg;
        const dwelling = atPlatformDwell;
        const stopState: TrainStopState = st.stopped
          ? st.stationDepartureHold
            ? "station"
            : st.stopReason === "signal"
            ? "signal"
            : st.stopReason === "junction"
            ? "junction"
            : st.stopReason === "conflict"
            ? "conflict"
            : st.stopReason === "queue"
            ? "queue"
            : "moving"
          : dwelling
          ? "station"
          : "moving";
        const rect = trainRectRefs.current[ti];
        const c = TRAIN_COLORS[stopState];
        const stroke = selectedIdxRef.current === ti ? "#f59e0b" : c.stroke;
        if (rect) {
          if (rect.getAttribute("fill") !== c.fill) rect.setAttribute("fill", c.fill);
          if (rect.getAttribute("stroke") !== stroke) rect.setAttribute("stroke", stroke);
          // the straight box and the bendy body are alternatives, never both
          rect.setAttribute("visibility", bendy ? "hidden" : "visible");
        }
        const bendyEl = trainBendyRefs.current[ti];
        if (bendyEl) {
          bendyEl.setAttribute("visibility", bendy ? "visible" : "hidden");
          if (bendy) {
            // The spine is map-space; the group already applies translate+scale,
            // so express it in the group's own local frame.
            const local = bendySpine!.map(
              ([x, y]) => [(x - rx) / CONTROL_SCALE, (y - ry) / CONTROL_SCALE] as [number, number]
            );
            bendyEl.setAttribute("d", articulatedBodyPath(local, TRAIN_HALF_HEIGHT));
            if (bendyEl.getAttribute("fill") !== c.fill) bendyEl.setAttribute("fill", c.fill);
            if (bendyEl.getAttribute("stroke") !== stroke) bendyEl.setAttribute("stroke", stroke);
          }
        }
        // The number stays UPRIGHT for legibility, but like the arrow it
        // must stay ON the body while the marker bends: a rigid placement at
        // the group origin stops riding the body once it curves away from the
        // straight-through-centre chord. Anchor it on the spine's REAR
        // segment (midpoint of its last two points — remember the spine runs
        // nose-first BACKWARDS, so that is the tail end) in the group's local
        // frame; the arrow holds the nose, the number rides the rear body.
        if (txt) {
          if (bendy && bendySpine && bendySpine.length >= 2) {
            const [e1x, e1y] = bendySpine[bendySpine.length - 1];
            const [e2x, e2y] = bendySpine[bendySpine.length - 2];
            const mx = ((e1x + e2x) / 2 - rx) / CONTROL_SCALE;
            const my = ((e1y + e2y) / 2 - ry) / CONTROL_SCALE;
            txt.setAttribute("transform", `translate(${mx}, ${my})`);
          } else {
            txt.setAttribute("transform", bendy ? "" : `rotate(${-ang})`);
          }
        }
        // Direction must be encoded ONCE. Whenever the group is rotated to face
        // the travel direction, local +x already IS that direction, so the arrow
        // must use the right-pointing shape; flipping it as well would cancel the
        // rotation and point the arrow backwards. Only an unrotated marker needs
        // the left-pointing shape to show a westbound train.
        const rotatedToTravel = ang !== 0 || !horizontal;
        const arrow = trainArrowRefs.current[ti];
        if (arrow) {
          // A bendy marker rotates the ARROW ALONE, so it must follow the
          // NOSE, not the centre: while the front is on a thrown crossover
          // but the centre is still on the straight, `ang` is still 0 and a
          // centre-derived rotation keeps the arrow pointing straight for up
          // to half a body length. The glyph is authored hugging the LEADING
          // EDGE (it spans +x only), so rotating it about the marker centre
          // would swing it clean off the bent body. Instead ANCHOR it on the
          // spine's leading segment so its TIP lands just inside the nose,
          // oriented onto the travel direction. Everything happens in the
          // group's LOCAL frame (map → local is a divide by CONTROL_SCALE,
          // matching how the articulated body path is expressed); spineOf
          // builds the spine nose-first but running BACKWARDS, so travel
          // direction = spine[1] → spine[0].
          let leadAng: number | null = null;
          let anchorLX = 0;
          let anchorLY = 0;
          if (bendy && bendySpine && bendySpine.length >= 2) {
            const [nx, ny] = bendySpine[0];
            const [bx, by] = bendySpine[1];
            const nlx = (nx - rx) / CONTROL_SCALE;
            const nly = (ny - ry) / CONTROL_SCALE;
            const blx = (bx - rx) / CONTROL_SCALE;
            const bly = (by - ry) / CONTROL_SCALE;
            const segLen = Math.hypot(nlx - blx, nly - bly);
            if (segLen > 1e-9) {
              leadAng = (Math.atan2(nly - bly, nlx - blx) * 180) / Math.PI;
              const ux = (nlx - blx) / segLen;
              const uy = (nly - bly) / segLen;
              // how far the glyph reaches forward of its own origin
              const axial = Math.min(TRAIN_ARROW_SCALE, ARROW_MAX_SCALE);
              const tipDist = ARROW_TIP_FRAC * TRAIN_HALF_LEN * axial;
              anchorLX = nlx - ux * tipDist;
              anchorLY = nly - uy * tipDist;
            }
          }
          if (leadAng !== null) {
            arrow.setAttribute("d", arrowRight(TRAIN_HALF_LEN, TRAIN_ARROW_SCALE));
            arrow.setAttribute(
              "transform",
              `translate(${anchorLX}, ${anchorLY}) rotate(${leadAng})`
            );
          } else {
            arrow.setAttribute(
              "d",
              !rotatedToTravel && st.dir === "left"
                ? arrowLeft(TRAIN_HALF_LEN, TRAIN_ARROW_SCALE)
                : arrowRight(TRAIN_HALF_LEN, TRAIN_ARROW_SCALE)
            );
            arrow.setAttribute("transform", "");
          }
        }
        // Conflict badge: "!" on every train involved in a live conflict
        const exclam = trainExclamRefs.current[ti];
        if (exclam) {
          exclam.setAttribute("visibility", conflictIdx.has(st.idx) ? "visible" : "hidden");
          exclam.setAttribute(
            "transform",
            bendy
              ? `translate(${EXCLAM_OFFSET[0]}, ${EXCLAM_OFFSET[1]})`
              : `translate(${EXCLAM_OFFSET[0]}, ${EXCLAM_OFFSET[1]}) rotate(${-ang})`
          );
        }
        return occupiedSections(st, SIGNAL_SECTIONS_PTS, CELL);
      });
      const key = sections.join(",");
      if (key !== trainSectionKeyRef.current) {
        trainSectionKeyRef.current = key;
        setOccupancyTick((t) => t + 1);
      }
      // periodic refresh for the roster/timetable panel (~2×/s)
      if (++frameCountRef.current % 30 === 0) setRosterTick((t) => t + 1);
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
    // a reservation locks its points even after the train passed the signal
    // (the clear is consumed but the route stays reserved while the train uses
    // it) — but only the UNPASSED portion locks: once the train's front has
    // passed a junction, its points are free to re-throw
    const onRoute = SIGNALS.find((sig) => {
      if (sig.block) return false;
      const res = reservations[sig.id];
      if (!res) return false;
      const ahead = unpassedOf(sig.id, res);
      return ahead ? ahead.some(([x, y]) => x === sw.x && y === sw.y) : false;
    })?.id;
    if (onRoute) return onRoute;
    // flank protection: a point not on the route whose branch would foul it is
    // locked in the non-fouling position while an active route protects itself
    for (const sig of SIGNALS) {
      if (sig.block) continue;
      const res = reservations[sig.id];
      if (!res?.nodePath) continue;
      const flanks = flankPoints(
        { pts: res.pts, nodePath: res.nodePath, requiredSwitches: {}, exitSignalId: "" },
        DISPATCH_MAP.nodes,
        FLANK_CLEARANCE
      );
      if (flanks.includes(swId)) return sig.id;
    }
    return undefined;
  };

  const coupledWith = (id: number): number[] => COUPLED.find((g) => g.includes(id)) ?? [id];

  /** A coupled pair is locked when either end is locked by a route. */
  const isLocked = (id: number): boolean => coupledWith(id).some((gid) => lockedBy(gid) !== undefined);

  const toggleSwitch = (id: number) => {
    const group = coupledWith(id);
    const owner = group.map((gid) => lockedBy(gid)).find((o) => o !== undefined);
    if (owner) {
      const name = group.length > 1 ? `P${group.join("+P")}` : `P${group[0]}`;
      setConflictNote(`${name} terkunci oleh reservasi ${codeOf(owner)} — ubah ${codeOf(owner)} menjadi merah dulu.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${name} × terkunci oleh ${codeOf(owner)}`);
      return; // locked under a route
    }
    const newState = switches[id] === "normal" ? "reversed" : "normal";
    setSwitches((s) => {
      const next = { ...s };
      for (const gid of group) next[gid] = newState; // coupled ends move together
      return next;
    });
    logClick(`${group.length > 1 ? `P${group.join("+P")}` : `P${group[0]}`} → ${newState === "reversed" ? "BELOK" : "LURUS"}`);
  };

  /**
   * Clear a signal (on/off). Turning on is refused if the points are not set for
   * the route, or if the route would overlap an opposite-direction reservation.
   */
  const toggleSignal = (id: string, exitId?: string) => {
    if (exitId) {
      // explicit route request: release the entrance's current route (if any)
      // and (re)set it to the requested exit
      setSignalOn((o) => (o[id] ? { ...o, [id]: false } : o));
      setReservations((r) => {
        if (!r[id]) return r;
        const { [id]: _, ...rest } = r;
        return rest;
      });
      delete reservedByRef.current[id];
      logClick(`${codeOf(id)} → rute ke ${codeOf(exitId)}`);
      // fall through to the normal route-set with the exit constraint
    } else if (signalOn[id]) {
      setSignalOn((o) => ({ ...o, [id]: false }));
      setReservations((r) => {
        const { [id]: _, ...rest } = r;
        return rest;
      });
      delete reservedByRef.current[id];
      logClick(`${codeOf(id)} → MERAH`);
      return;
    }
    // A train may have consumed the clear (light red) while the route is still
    // reserved behind it. Releasing the reservation and immediately trying the
    // clear makes re-signalling a line a train has passed a single click: if
    // the route is still set the signal re-lights; if the points now block it,
    // the reservation is freed and the clear is refused (stays red).
    if (reservations[id]) {
      setReservations((r) => {
        const { [id]: _, ...rest } = r;
        return rest;
      });
      delete reservedByRef.current[id];
      // fall through to the normal clear path
    }
    const sig = SIGNALS.find((s) => s.id === id)!;
    // route search (policy b — manual points): find a feasible path to a
    // same-direction exit signal. A route that needs to move an UNLOCKED point
    // is refused with the same "wesel belum diatur" message as before; a route
    // needing a locked point is simply not found.
    const found = findRoute({
      entranceId: sig.id,
      entrance: sig,
      signals: SIGNALS,
      graph: DISPATCH_MAP.nodes,
      switches,
      // a route request replaces the entrance's OWN reservation, so its locks
      // must not constrain the search
      isLocked: (sw) => {
        const owner = lockedBy(sw);
        return owner !== undefined && owner !== id;
      },
      ...(exitId ? { exitSignalId: exitId } : {}),
    });
    if (!found) {
      const note = exitId
        ? `${codeOf(sig.id)} tidak bisa dibuka — tidak ada rute ke ${codeOf(exitId)}.`
        : `${codeOf(sig.id)} tidak bisa dibuka — tidak ada rute.`;
      setConflictNote(note);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${codeOf(sig.id)} × tidak bisa dibuka (tidak ada rute${exitId ? ` ke ${codeOf(exitId)}` : ""})`);
      return; // stay red
    }
    // Out-of-service track: the road may be set correctly, but the line itself
    // cannot carry traffic. Distinct from a wrongly-set point — no amount of
    // point moving fixes it — so it keeps the "jalur tidak bisa dilewati"
    // wording and names the reason.
    const closed = closedSpanOnRoute(found, CLOSED_SPANS);
    if (closed) {
      setConflictNote(
        `${codeOf(sig.id)} tidak bisa dibuka — jalur tidak bisa dilewati${closed.reason ? ` (${closed.reason})` : ""}.`
      );
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(
        `${codeOf(sig.id)} × rute tidak bisa terbentuk (jalur ${closed.groupId} tidak bisa dilewati)`
      );
      return; // stay red
    }
    if (exitId && found.exitSignalId !== exitId) {
      setConflictNote(`${codeOf(sig.id)} tidak bisa dibuka — tidak ada rute ke ${codeOf(exitId)}.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${codeOf(sig.id)} × tidak bisa dibuka (tidak ada rute ke ${codeOf(exitId)})`);
      return;
    }
    // A route needs points that are not set the way the search wants. Which of
    // the two standing policies applies is layout data, not a special case:
    //   auto   — the interlocking throws them for you (Bekasi, the default);
    //   manual — the signal is refused until the user sets them (JNG).
    // "Inactive track" needs no authored flag: a track is unreachable exactly
    // when the points as they stand do not lead there.
    const requiredSwitches = Object.keys(found.requiredSwitches);
    if (requiredSwitches.length > 0 && ROUTE_SETTING === "manual") {
      // Name the points that are set the wrong way, so the user knows what to
      // move rather than hunting the throat. Derived from the route's own
      // required moves, and reported by CONTROL (the thing on screen) — a
      // coupled pair is one lever, so it must be named once.
      // A control with no proper name falls back to a "sw NN" label; show it
      // as "Wesel NN" so every entry reads the same way to the user.
      const nameOf = (label: string): string =>
        /^sw\s/i.test(label) ? label.replace(/^sw\s*/i, "Wesel ") : label;
      const wrong = Array.from(
        new Set(
          requiredSwitches.map((id) => {
            const swId = Number(id);
            const control = POINT_CONTROLS.find((c) => c.ids.includes(swId));
            return control?.label ?? `P${swId}`;
          })
        )
      );
      const wanted = (label: string): string => {
        const control = POINT_CONTROLS.find((c) => c.label === label);
        const swId = control
          ? requiredSwitches.map(Number).find((id) => control.ids.includes(id))
          : Number(label.replace(/^P/, ""));
        return found.requiredSwitches[swId as number] === "reversed"
          ? "BELOK"
          : "LURUS";
      };
      const detail = wrong.map((w) => `${nameOf(w)} harus ${wanted(w)}`).join(", ");
      setConflictNote(
        `${codeOf(sig.id)} tidak bisa dibuka — posisi wesel salah: ${detail}.`
      );
      window.setTimeout(() => setConflictNote(null), 4000);
      logClick(`${codeOf(sig.id)} × posisi wesel salah (${detail})`);
      return; // stay red — the user must set the points
    }
    if (requiredSwitches.length > 0) {
      const moves: Record<number, SwitchState> = {};
      for (const key of requiredSwitches) {
        const swId = Number(key);
        const position = found.requiredSwitches[swId];
        for (const gid of coupledWith(swId)) moves[gid] = position;
      }
      const moveDesc = Object.entries(moves)
        .map(([k, v]) => `P${k} ${v === "reversed" ? "BELOK" : "LURUS"}`)
        .join(", ");
      setSwitches((s) => ({ ...s, ...moves }));
      logClick(`${codeOf(sig.id)} → wesel diatur otomatis: ${moveDesc}`);
    }
    // flank protection — auto-set fouled flanks to the non-fouling position;
    // a flank locked against the route is refused
    const flanks = flankPoints(found, DISPATCH_MAP.nodes, FLANK_CLEARANCE);
    for (const flank of flanks) {
      if (switches[flank] !== "reversed") continue;
      if (isLocked(flank)) {
        setConflictNote(`${codeOf(sig.id)} tidak bisa dibuka — wesel P${flank} terkunci di posisi berbahaya.`);
        window.setTimeout(() => setConflictNote(null), 3000);
        logClick(`${codeOf(sig.id)} × tidak bisa dibuka (flank P${flank} terkunci)`);
        return; // stay red
      }
      setSwitches((s) => ({ ...s, [flank]: "normal" }));
      logClick(`${codeOf(sig.id)} → flank P${flank} diatur LURUS`);
    }
    const prospective = {
      d: "M" + found.pts.map(([x, y]) => `${x},${y}`).join(" "),
      note: "",
      nextSignalId: found.exitSignalId,
      pts: found.pts,
      blocked: false,
    };
    // A route cannot be set into track a train PHYSICALLY occupies — a wrong-way
    // or opposing move into the occupied section would meet it head-on. The
    // train approaching/stopped at THIS signal (on its line, behind it, moving
    // in its direction) is the route's user — it is not an obstacle.
    const routeOccupied = trainStatesRef.current.some((m) => {
      if (!m.spawned || m.done) return false;
      const approaching =
        m.y === sig.lineY && m.dir === sig.dir && (sig.dir === "right" ? m.x < sig.x : m.x > sig.x);
      if (approaching) return false;
      // body on the route's track — the threshold must stay BELOW the track
      // spacing (57 px between the upper loop at y=148 and the bottom line at
      // y=205), or a train parked on the loop would read as sitting on the
      // bottom line's routes
      if (distToPoly(m.x, m.y, prospective.pts) < CELL / 3) return true;
      // a train on a bidirectional loop can enter the main/top line through the
      // loop's rejoin point — but only once it is actually NEAR that point. A
      // train parked on the loop (dwelling for an overtake, e.g. at Tambun's
      // column while the express runs the main line) must not block the through
      // signals, or the express could never pass.
      const loop = Object.values(LOOPS_BY_GROUP_ID).find(
        (l) => Math.abs(l.lineY - m.y) < 1 && m.x >= l.minX && m.x <= l.maxX
      );
      if (loop) {
        const rejoinX = m.dir === "right" ? loop.rejoin.rightX : loop.rejoin.leftX;
        const rejoinY = loop.rejoin.mainLineY;
        if (Math.abs(m.x - rejoinX) < 2 * CELL && distToPoly(rejoinX, rejoinY, prospective.pts) < CELL) {
          return true;
        }
        return false;
      }
      return false;
    });
    if (routeOccupied) {
      setConflictNote(`${codeOf(sig.id)} tidak bisa dibuka — ada kereta di rute.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${codeOf(sig.id)} × tidak bisa dibuka (ada kereta di rute)`);
      return; // stay red
    }
    const clash = SIGNALS.find((other) => {
      if (other.id === id || other.block || other.dir === sig.dir) return false;
      const otherRes = reservations[other.id];
      // compare against the UNPASSED portion of the other reservation (the train
      // using it has already left the passed cells), so a route can be set on
      // track a train has moved past. null (owner despawned) = stale — the tick
      // loop is about to release it, so don't block on it here.
      let otherRoute: LeveledPoint[] | null | undefined;
      if (otherRes) {
        otherRoute = unpassedOf(other.id, otherRes);
      } else if (signalOn[other.id]) {
        otherRoute = routeOf(other.id).pts;
      }
      return otherRoute ? routesOverlap(prospective.pts, otherRoute) : false;
    });
    if (clash) {
      setConflictNote(`${codeOf(sig.id)} tidak bisa dibuka — rutenya berimpit dengan reservasi ${codeOf(clash.id)}.`);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${codeOf(sig.id)} × berimpit dengan ${codeOf(clash.id)}`);
      return; // stay red
    }
    setSignalOn((o) => ({ ...o, [id]: true }));
    delete reservedByRef.current[id]; // fresh reservation, no owner yet
    setReservations((r) => ({
      ...r,
      [id]: {
        pts: prospective.pts,
        nextSignalId: prospective.nextSignalId,
        lineY: sig.lineY,
        nodePath: found.nodePath,
      },
    }));
    // log the aspect it will light with (green unless the next signal is red)
    const nextAsp = prospective.nextSignalId ? aspectOf(prospective.nextSignalId) : "green";
    logClick(`${codeOf(id)} → ${nextAsp === "red" ? "KUNING" : "HIJAU"}`);
  };

  /**
   * Derived aspect: red when off, when the route is not set (points blocked), or
   * when a conflicting route is set; green only if the next same-direction signal
   * is also green; amber (caution) when it is not. No next signal = open line = green.
   * Block signals are always active and simply mirror the next signal.
   */
  const routeOf = (id: string) =>
    walkRoute(SIGNALS.find((s) => s.id === id)!, switches, DISPATCH_MAP);

  /**
   * Wrong-direction operation: x-intervals on a main line that a cleared route
   * currently reserves against the normal traffic direction.
   */
  const wrongWaySpans = (y: number): [number, number][] => {
    const normal = NORMAL_BEARING[y];
    if (!normal) return [];
    const spans: [number, number][] = [];
    for (const sig of SIGNALS) {
      if (sig.block) continue;
      // the wrong-way protection comes from the RESERVED route (not the clear),
      // so the corridor stays held red even after the leading train consumed
      // the signal's clear
      const res = reservations[sig.id];
      if (!res) continue;
      const pts = res.pts;
      for (let i = 0; i + 1 < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[i + 1];
        // a reserved segment on this line whose travel bearing opposes the
        // group's normal bearing is running against the flow
        if (y1 === y2 && y1 === y) {
          const segBearing = bearingOf([x1, y1], [x2, y2]);
          if (bearingDot(segBearing, normal) < 0) {
            spans.push([Math.min(x1, x2), Math.max(x1, x2)]);
          }
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
    // a bidirectional main may be used both ways — the wrong-way protection
    // does not force its signals red
    if (BIDIRECTIONAL_BY_Y[sig.lineY]) return false;
    const spans = wrongWaySpans(sig.lineY);
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

  const aspectOf = (
    id: string,
    visited: Set<string> = new Set(),
    selfIdx?: number
  ): Aspect =>
    calculateSignalAspect(
      id,
      {
        signals: SIGNALS,
        normalDirectionByY: NORMAL_DIR,
        signalSections: SIGNAL_SECTIONS_PTS,
        signalOn,
        trainStates: trainStatesRef.current,
        trainHalfLen: MOVEMENT_DEFINITION.trainHalfLen,
        routeOf,
        forcedRed,
      },
      visited,
      selfIdx
    );
  aspectOfRef.current = (id: string, selfIdx?: number) => aspectOf(id, undefined, selfIdx); // keep the tick loop's aspect lookup current

  // ---- timetable awareness: per-train info for the card + roster (Indonesian) ----
  const stationName = (code: string) =>
    DISPATCH_MAP.stations.namesByCode[code] ?? code;
  /** Resolve a virtual boundary code (JNG-W/JNG-E) to the real neighbour
   *  station name from the train's own neighbourBefore/neighbourAfter. */
  const stopName = (train: { neighborBefore?: string | null; neighborAfter?: string | null; stops: { trackmark: string }[] }, idx: number) => {
    const s = train.stops[idx];
    if ((s.trackmark === "JNG-W" || s.trackmark === "JNG-E") && idx === 0 && train.neighborBefore)
      return train.neighborBefore;
    if ((s.trackmark === "JNG-W" || s.trackmark === "JNG-E") && idx === train.stops.length - 1 && train.neighborAfter)
      return train.neighborAfter;
    return stationName(s.trackmark);
  };
  const fmtDur = (sec: number) => {
    const a = Math.abs(sec);
    const m = Math.floor(a / 60);
    const s = Math.round(a % 60);
    const parts: string[] = [];
    if (m > 0) parts.push(`${m} mnt`);
    if (s > 0) parts.push(`${s} dtk`);
    return parts.join(" ") || "0 dtk";
  };
  /** Delay vs the schedule at the train's current schedule point. Positive =
   *  late, negative = early. At a station it is departure-facing: on time while
   *  the train can still leave per its scheduled departure; late once held past it. */
  const trainInfo = (ti: number) => {
    const st = trainStatesRef.current[ti];
    const j = JOURNEYS[ti];
    if (!st || !j) return null;
    const { train, plan } = j;
    const stops = train.stops.map((s, i) => {
      // For pass-through boundary stops (arr == dep), show the scheduled time
      // as the actual — these are virtual markers, the train passes through
      // on schedule. For real platform stops, show the engine-clock arrival.
      const isPass = s.arr_actual === s.dep_actual;
      return {
        name: stopName(train, i),
        arrLabel: s.arr_actual,
        depLabel: s.dep_actual,
        actual: isPass ? s.arr_actual : st.actualArr[i],
        meets: s.meets,
      };
    });
    const dirOrigin = stopName(train, 0);
    const dirDest = stopName(train, train.stops.length - 1);
    const dirLabel = plan.start.dir === "right" ? `ke timur · ${dirOrigin} → ${dirDest}` : `ke barat · ${dirOrigin} → ${dirDest}`;
    const leg = plan.legs[Math.min(st.leg, plan.legs.length - 1)];
    // slip at the most recent reached stop
    // Use plan.schedArr (engine-clock arrival) so relativeAnchors scenarios
    // compare actualArr (engine clock) against the rebased schedule, not the
    // absolute midnight time.
    let slip = 0;
    let lastReached = -1;
    let atStopIdx: number | null = null;
    for (let i = st.actualArr.length - 1; i >= 0; i--) {
      if (st.actualArr[i] != null) {
        // Skip pass-through boundary stops (arr == dep): their actualArr is
        // the approach travel time, not a real arrival. Counting it as slip
        // would show every freshly-spawned train as "terlambat".
        const isPassThrough = train.stops[i].arr === train.stops[i].dep;
        if (isPassThrough) continue;
        slip = st.actualArr[i]! - (plan.schedArr[i] ?? train.stops[i].arr);
        lastReached = i;
        break;
      }
    }
    // departure-facing: dwelling that can still leave on time reads as on time
    const reached = lastReached >= 0;
    const dwellStation = st.leg > 0 ? train.stops[st.leg - 1]?.trackmark ?? null : null;
    const meetsRel = dwellStation ? meetsRelease(ti, dwellStation) : 0;
    const schedDepart = leg.departAt ?? 0;
    const effectiveDepart =
      leg.departAt !== undefined || meetsRel > 0 ? Math.max(schedDepart, meetsRel) : undefined;
    const dwelling = st.leg > 0 && effectiveDepart !== undefined && st.time < effectiveDepart;
    if (dwelling) atStopIdx = st.leg - 1;
    let status: string;
    let delay: string;
    let delaySec = slip;
    if (st.done) {
      status = "Selesai";
      delay = "—";
    } else if (st.stopped) {
      if (st.stopReason === "signal") status = `Ditahan sinyal ${codeOf(st.stopSignalId ?? "")}`;
      else if (st.stopReason === "junction") status = "Menunggu wesel";
      else if (st.stopReason === "conflict") status = "Konflik — kereta bertabrakan";
      else if (st.stopReason === "queue") {
        // Show the train's current location: between which two stations it is.
        const nextStation = stopName(train, Math.min(st.leg, train.stops.length - 1));
        const prevStation = st.leg > 0 ? stopName(train, st.leg - 1) : stopName(train, 0);
        status = `Mengikuti — antara ${prevStation} dan ${nextStation}`;
      }
      else status = "Berhenti";
      // held past its scheduled departure at a station → late; otherwise the slip
      // Only applies when the train has reached a real (non-pass-through) stop
      // — a pass-through boundary has departAt=0, so st.time>0 is always true,
      // which would show every approaching train as "terlambat".
      const reachedPlatform =
        lastReached >= 0 && train.stops[lastReached].arr !== train.stops[lastReached].dep;
      if (reachedPlatform && st.leg > 0 && leg.departAt !== undefined && st.time > leg.departAt) {
        delaySec = Math.max(slip, st.time - leg.departAt);
        delay = `terlambat ${fmtDur(delaySec)}`;
      } else {
        delay =
          !reached || slip === 0
            ? "tepat waktu"
            : slip < 0
            ? `awal ${fmtDur(slip)}`
            : `terlambat ${fmtDur(slip)}`;
      }
    } else if (dwelling) {
      const heldPastBook = meetsRel > schedDepart && st.time > schedDepart;
      if (heldPastBook) {
        // still held by a meet after the book departure — visibly late
        const partners = (MEETS_BY_TRAIN.get(ti)?.get(dwellStation!) ?? [])
          .map((d) => JOURNEYS[d.partnerIdx].train.train_no)
          .join(", ");
        status = `Menunggu susul ${partners} di ${stationName(dwellStation!)}`;
        delaySec = Math.max(slip, st.time - schedDepart);
        delay = `terlambat ${fmtDur(delaySec)}`;
      } else {
        const meetDeps = dwellStation ? (MEETS_BY_TRAIN.get(ti)?.get(dwellStation) ?? null) : null;
        const partners = meetDeps ? meetDeps.map((d) => JOURNEYS[d.partnerIdx].train.train_no).join(", ") : "";
        status = partners
          ? `Berhenti di ${stopName(train, st.leg - 1)} · susul ${partners}`
          : `Berhenti di ${stopName(train, st.leg - 1)}`;
        delay = "tepat waktu";
        delaySec = 0;
      }
    } else {
      status = "Berjalan";
      const nextName = stopName(train, Math.min(st.leg, train.stops.length - 1));
      delay =
        !reached || slip === 0
          ? "tepat waktu"
          : slip < 0
          ? `awal ${fmtDur(slip)} · menunggu jadwal di ${nextName}`
          : `terlambat ${fmtDur(slip)}`;
    }
    return { no: train.train_no, name: train.name, dirLabel, stops, status, delay, delaySec, atStopIdx, dest: dirDest };
  };

  /** Trains calling at a station, sorted by scheduled arrival — the station timetable. */
  const stationSchedule = (code: string) =>
    JOURNEYS.map((j, ti) => {
      const idx = j.train.stops.findIndex((s) => s.trackmark === code);
      if (idx < 0) return null;
      const stop = j.train.stops[idx];
      const st = trainStatesRef.current[ti];
      const info = st && st.spawned && !st.done ? trainInfo(ti) : null;
      return {
        no: j.train.train_no,
        name: j.train.name,
        arr: stop.arr,
        arrLabel: stop.arr_actual,
        depLabel: stop.dep_actual,
        actual: st?.actualArr[idx] ?? null,
        meets: stop.meets,
        active: !!info,
        atStation: info?.atStopIdx === idx,
        status: info ? (info.atStopIdx === idx ? "berhenti di stasiun" : info.status) : null,
        delay: info ? info.delay : null,
      };
    })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => a.arr - b.arr);

  const cellX0 = (sw: Sw, cellSize: number) =>
    Math.floor((sw.x - GRID_OFFSET[0]) / cellSize) * cellSize + GRID_OFFSET[0];
  const cellY0 = (sw: Sw, cellSize: number) =>
    Math.floor((sw.y - GRID_OFFSET[1]) / cellSize) * cellSize + GRID_OFFSET[1];

  // The straight leg, as drawn when it IS set. Normally the full horizontal
  // across the cell. At an inverted point the compiler publishes the diagonal's
  // normal half, so add the common half back: the whole diagonal is in use.
  const straightPath = (sw: Sw, cellSize: number) =>
    sw.straightPath
      ? `${sw.straightPath} ${commonHalf(sw, cellSize)}`
      : `M${cellX0(sw, cellSize)} ${sw.lineY} H${cellX0(sw, cellSize) + cellSize}`;

  // The half of an inverted point's diagonal on the far side of the node from
  // the straight leg. Mirroring the normal half through the node reconstructs it
  // without the renderer having to know the diagonal's slope.
  const commonHalf = (sw: Sw, cellSize: number) => {
    const match = /L(-?[\d.]+) (-?[\d.]+)$/.exec(sw.straightPath ?? "");
    if (!match) return "";
    const towardNode = Number(match[1]) === sw.x && Number(match[2]) === sw.y;
    const other = towardNode
      ? /^M(-?[\d.]+) (-?[\d.]+)/.exec(sw.straightPath!)
      : match;
    if (!other) return "";
    return `M${sw.x} ${sw.y} L${2 * sw.x - Number(other[1])} ${2 * sw.y - Number(other[2])}`;
  };

  // The leg that is NOT set: ghosted. When the point is reversed the straight is
  // idle, when it is normal the branch is. Erasing only as far as the node is
  // what makes the idle leg read as a stub -- and is why the common half of an
  // inverted point is never ghosted: every route uses it, whatever the setting.
  const inactivePath = (sw: Sw, reversed: boolean, cellSize: number) =>
    reversed
      ? (sw.straightPath ??
        (sw.dashSide === "left"
          ? `M${cellX0(sw, cellSize)} ${sw.lineY} H${sw.x}`
          : `M${sw.x} ${sw.lineY} H${cellX0(sw, cellSize) + cellSize}`))
      : sw.branch;

  return (
    <div className="w-full max-w-[2000px]">
      {/* Time controls — fixed top-left: simulation clock + speed scale */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 shadow-sm">
        <span
          ref={clockRef}
          role="timer"
          aria-label="Waktu simulasi 00:00:00.00"
          className="font-mono text-sm font-medium tabular-nums text-slate-700"
        >
          00:00:00.00
        </span>
        <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Lanjutkan simulasi" : "Jeda simulasi"}
          aria-pressed={paused}
          title={paused ? "Lanjutkan" : "Jeda"}
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
            paused
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          {paused ? "▶ Play" : "❚❚ Pause"}
        </button>
        <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
        <div role="group" aria-label="Skala waktu" className="flex items-center gap-1">
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
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleDark}
          aria-label={darkMode ? "Mode terang" : "Mode gelap"}
          title={darkMode ? "Light mode" : "Dark mode"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors cursor-pointer hover:border-slate-400 hover:text-slate-800"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-expanded={settingsOpen}
          aria-label="Pengaturan"
          title="Pengaturan"
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
              className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
              role="dialog"
              aria-label="Pengaturan"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Tombol kontrol</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Tampilkan tombol wesel &amp; sinyal di bawah tabel
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showControls}
                  aria-label="Tampilkan tombol kontrol"
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
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-600">Warna kereta</p>
                <ul className="mt-1.5 space-y-1 text-xs text-slate-500">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-3 w-8 rounded-sm border border-blue-600 bg-blue-200" aria-hidden="true" />
                    berjalan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-3 w-8 rounded-sm border border-emerald-600 bg-emerald-200" aria-hidden="true" />
                    berhenti di stasiun (sesuai jadwal)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-3 w-8 rounded-sm border border-red-600 bg-red-200" aria-hidden="true" />
                    ditahan di sinyal merah
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-3 w-8 rounded-sm border border-amber-600 bg-amber-200" aria-hidden="true" />
                    menunggu di persilangan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-3 w-8 rounded-sm border border-red-900 bg-red-500" aria-hidden="true" />
                    konflik (dua kereta di jalur yang sama)
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <svg
        viewBox={
          SCHEMATIC_VIEWBOX
            ? `${SCHEMATIC_VIEWBOX.minX} ${SCHEMATIC_VIEWBOX.minY} ${SCHEMATIC_VIEWBOX.width} ${SCHEMATIC_VIEWBOX.height}`
            : `${GRID_VIEWBOX.minX} ${GRID_VIEWBOX.minY} ${RIGHT + GRID_VIEWBOX.widthPadding} ${GRID_VIEWBOX.height}`
        }
        className="w-full h-auto"
        role="img"
        aria-label={DIAGRAM_ARIA_LABEL}
      >
        {/* Full-width graph-paper grid, 58px cells (incl. the EXT-cell extensions)
            — grid mode, or schematic layouts that opt into the chrome */}
        {SHOW_GRID && (
        <g stroke="#e7e7e7" strokeWidth={1}>
          {Array.from({ length: Math.round(RIGHT / GRID_PITCH) + 1 }, (_, i) => (
            <line key={`v${i}`} x1={GRID_OFFSET[0] + i * GRID_PITCH} y1={GRID_OFFSET[1]} x2={GRID_OFFSET[0] + i * GRID_PITCH} y2={GRID_BOTTOM_Y} />
          ))}
          {Array.from({ length: Math.round((GRID_BOTTOM_Y - GRID_OFFSET[1]) / GRID_PITCH) + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={GRID_OFFSET[1] + i * GRID_PITCH} x2={RIGHT} y2={GRID_OFFSET[1] + i * GRID_PITCH} />
          ))}
        </g>
        )}

        {/* Grid references — letters (columns A..AO) across the top/bottom, numbers 1–6 down the sides */}
        {SHOW_GRID && (
        <g>
          {/* ticks at column boundaries */}
          {Array.from({ length: Math.round(RIGHT / GRID_PITCH) + 1 }, (_, i) => (
            <g key={`ct${i}`} stroke="#cbd5e1" strokeWidth={1}>
              <line x1={GRID_OFFSET[0] + i * GRID_PITCH} y1={GRID_OFFSET[1] - GRID_TICKS.size} x2={GRID_OFFSET[0] + i * GRID_PITCH} y2={GRID_OFFSET[1]} />
              <line x1={GRID_OFFSET[0] + i * GRID_PITCH} y1={GRID_BOTTOM_Y} x2={GRID_OFFSET[0] + i * GRID_PITCH} y2={GRID_BOTTOM_Y + GRID_TICKS.size} />
            </g>
          ))}
          {/* ticks at row boundaries */}
          {Array.from({ length: Math.round((GRID_BOTTOM_Y - GRID_OFFSET[1]) / GRID_PITCH) + 1 }, (_, i) => (
            <g key={`rt${i}`} stroke="#cbd5e1" strokeWidth={1}>
              <line x1={-GRID_TICKS.size} y1={GRID_OFFSET[1] + i * GRID_PITCH} x2={0} y2={GRID_OFFSET[1] + i * GRID_PITCH} />
              <line x1={RIGHT} y1={GRID_OFFSET[1] + i * GRID_PITCH} x2={RIGHT + GRID_TICKS.size} y2={GRID_OFFSET[1] + i * GRID_PITCH} />
            </g>
          ))}
          {/* column letters and row numbers (every GRID_LABEL_STEP-th cell) */}
          <g fontSize={GRID_LABEL_SIZE} fontWeight={500} fill="#64748b" textAnchor="middle">
            {Array.from({ length: Math.round(RIGHT / GRID_PITCH) }, (_, i) => {
              if (i % GRID_LABEL_STEP !== 0) return null;
              const x = GRID_OFFSET[0] + i * GRID_PITCH + GRID_PITCH / 2;
              const letter = colsName(i / GRID_LABEL_STEP);
              return (
                <g key={`c${i}`}>
                  <text x={x} y={GRID_TICKS.topColumnLabelY}>
                    {letter}
                  </text>
                  <text x={x} y={GRID_TICKS.bottomColumnLabelY}>
                    {letter}
                  </text>
                </g>
              );
            })}
            {Array.from({ length: Math.round((GRID_BOTTOM_Y - GRID_OFFSET[1]) / GRID_PITCH) }, (_, i) => {
              if (i % GRID_LABEL_STEP !== 0) return null;
              const y = GRID_OFFSET[1] + i * GRID_PITCH + GRID_PITCH / 2 + 4;
              return (
                <g key={`r${i}`}>
                  <text x={GRID_TICKS.leftRowLabelX} y={y}>
                    {i / GRID_LABEL_STEP + 1}
                  </text>
                  <text x={RIGHT + GRID_TICKS.rightRowLabelOffsetX} y={y}>
                    {i / GRID_LABEL_STEP + 1}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
        )}

        {/* Shifted original diagram — everything below uses the original coordinates
            and is moved right by SHIFT to leave room for the left extension */}
        <g transform={`translate(${SHIFT}, 0)`}>
          <defs>
            {SWITCHES.map((sw) => (
              <clipPath key={sw.id} id={`cell-${sw.id}`}>
                <rect
                  x={cellX0(sw, GRID_PITCH)}
                  y={cellY0(sw, GRID_PITCH)}
                  width={GRID_PITCH}
                  height={GRID_PITCH}
                />
              </clipPath>
            ))}
            {TRACK_CLIPS?.map((clip, ti) =>
              clip ? (
                <clipPath key={`track-clip-${ti}`} id={`track-clip-${ti}`}>
                  {/* full-height band over the line's drawn extent only */}
                  <rect x={clip.lo} y={-10000} width={clip.hi - clip.lo} height={20000} />
                </clipPath>
              ) : null
            )}
          </defs>

          {/* Station platform cells — tinted footprint under the tracks (grid mode) */}
          {!IS_SCHEMATIC && (
          <g>
            {STATION_CELLS.map((st) =>
              st.cells.map((c) => {
                const [x, y] = cellOrigin(c, DISPATCH_MAP.grid);
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
          )}

          {/* All tracks — always solid black outside of point cells */}
          <g stroke="#000" strokeWidth={TRACK_STROKE} strokeLinecap="round" fill="none">
            {ALL_TRACKS.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Out-of-service track: still drawn, because it physically exists
              and the schematic should show it — but greyed, and crossed at the
              end where traffic would enter it. Painted OVER the black track so
              no compiled geometry has to be filtered. */}
          {CLOSED_SPANS.map((span) => {
            // the cross marks the open end — the side traffic approaches from
            const crossX = span.toX;
            const arm = 7;
            return (
              <g key={`closed-${span.groupId}-${span.fromX}`} aria-hidden="true">
                <line
                  x1={span.fromX}
                  y1={span.lineY}
                  x2={span.toX}
                  y2={span.lineY}
                  stroke="#ffffff"
                  strokeWidth={TRACK_STROKE + 2}
                  strokeLinecap="butt"
                />
                <line
                  x1={span.fromX}
                  y1={span.lineY}
                  x2={span.toX}
                  y2={span.lineY}
                  stroke="#9ca3af"
                  strokeWidth={TRACK_STROKE}
                  strokeLinecap="butt"
                />
                <g stroke="#b91c1c" strokeWidth={2} strokeLinecap="round">
                  <line x1={crossX - arm} y1={span.lineY - arm} x2={crossX + arm} y2={span.lineY + arm} />
                  <line x1={crossX - arm} y1={span.lineY + arm} x2={crossX + arm} y2={span.lineY - arm} />
                </g>
              </g>
            );
          })}

          {/* Flyover crossings — the lower line is gapped and the upper track
              carries a bridge glyph (two piers). Level crossings only exist at
              different grade levels, so grid layouts have none. */}
          {DISPATCH_MAP.levelCrossings.map((crossing, i) => {
            const [px, py] = crossing.point;
            const { dx, dy } = crossing.direction;
            // perpendicular (for the piers)
            const nx = -dy;
            const ny = dx;
            // a small white pane erases both strokes at the crossing point
            return (
              <g key={`flyover-${i}`}>
                <rect x={px - 8} y={py - 8} width={16} height={16} fill="#ffffff" />
                {/* the upper track re-drawn through the gap */}
                <line x1={px - dx * 12} y1={py - dy * 12} x2={px + dx * 12} y2={py + dy * 12} stroke="#000" strokeWidth={2} />
                {/* bridge piers — two short ticks perpendicular to the track */}
                <g stroke="#000" strokeWidth={2} strokeLinecap="round">
                  <line x1={px - nx * 11 - dx * 4} y1={py - ny * 11 - dy * 4} x2={px - nx * 11 + dx * 4} y2={py - ny * 11 + dy * 4} />
                  <line x1={px + nx * 11 - dx * 4} y1={py + ny * 11 - dy * 4} x2={px + nx * 11 + dx * 4} y2={py + ny * 11 + dy * 4} />
                </g>
              </g>
            );
          })}

        {/* Per-cell inactive routes: dashed, clipped to the point's own cell.
            The white pass is an ERASER: it hides the solid track under the
            inactive leg so only the dashed ghost shows. Its width is authored
            against the sim CELL, so on a dense layout (a much finer GRID_PITCH)
            an unscaled eraser chews a visible notch out of the straight it
            crosses — a 3.5-wide diagonal band cuts ~31% of a 16-unit cell but
            only ~8% of a 58-unit one. Scale it with the pitch so the nick stays
            proportionally the same as on the grid layouts.

            PAINT ORDER MATTERS: this layer must sit ABOVE the solid black
            tracks (it erases them) but BELOW the amber reservation that
            follows. Drawn after the reservation, each point's white eraser +
            dashed ghost cut a notch through the highlighted active route — the
            inactive leg is the lower-priority information and must never
            obstruct the route the player just set.

            The eraser is a fat white stroke that STARTS at the switch node,
            which sits ON the through track — so its round cap always spills
            sideways onto the straight, nicking it. Erasing cannot be made
            surgical enough by tuning the width alone, so when the straight is
            the ACTIVE leg (point normal) it is simply re-drawn in black on top
            of the eraser. The through route then stays unbroken by
            construction, whatever the eraser geometry does. */}
        {SWITCHES.map((sw) => {
          const reversed = switches[sw.id] === "reversed";
          const d = inactivePath(sw, reversed, GRID_PITCH);
          // the straight through this cell, at the switch's own line
          const throughD = straightPath(sw, GRID_PITCH);
          // The inactive leg's white eraser starts right on the junction, so
          // it necessarily crosses the ACTIVE leg. Restore that active leg
          // after the ghost: normal = through straight, reversed = branch.
          // The amber reservation renders in the following layer, so it still
          // stays above both this repair and the inactive ghost.
          const activeD = reversed ? sw.branch : throughD;
          return (
            <g key={sw.id} clipPath={`url(#cell-${sw.id})`}>
              <path
                d={d}
                stroke="#ffffff"
                strokeWidth={3.5 * ERASER_SCALE}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={d}
                stroke="#cbd5e1"
                strokeWidth={2 * DASH_SCALE}
                strokeDasharray={`${5 * DASH_SCALE} ${4 * DASH_SCALE}`}
                strokeLinecap="round"
                fill="none"
              />
              {/* Restore the active physical leg over the inactive ghost. */}
              <path
                d={activeD}
                stroke="#000"
                strokeWidth={TRACK_STROKE}
                strokeLinecap="round"
                fill="none"
              />
            </g>
          );
        })}

        {/* Reserved routes (amber) — independent of the signal aspect; only the
            unpassed portion of each reservation stays highlighted (per-cell).
            The tick loop keeps the paths in sync with the train's progress. */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          {Object.entries(reservations).map(([id, res]) => {
            const ahead = visibleOf(id, res);
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
          {TRAFFIC_ARROW_POINTS.map((points) => (
            <polygon key={points} points={points} />
          ))}
        </g>

        {/* Stations — grid mode: merged-cell name plates (e.g. Bekasi Timur at
            E3–F3); schematic mode: authored platform shapes at their coordinates */}
        {STATIONS.map((st) => {
          // A station may own SEVERAL platform faces (an island between two
          // tracks is one platform serving both), so every shape with this
          // code is drawn — not just the first one found.
          const shapes = STATION_SHAPES.filter((s) => s.code === st.code);
          if (IS_SCHEMATIC && shapes.length > 0) {
            return (
              <g
                key={st.code}
                onClick={() => openStation(st.code)}
                className="cursor-pointer"
                aria-label={`Jadwal stasiun ${st.name}`}
              >
                {shapes.map((shape, i) => {
            const w = shape.length;
            const h = shape.width ?? 10;
            const gap = shape.offset ?? 8;
            const barY = shape.side === "down" ? shape.y + gap : shape.y - gap - h;
            // square corners are just a zero radius; the label detaches from
            // the bar only when the layout asks it to
            const radius = shape.corner === "square" ? 0 : h / 2;
            const labelY =
              shape.labelY ?? barY + (shape.side === "down" ? h + 14 : -6);
            return (
              <g key={i}>
                <rect
                  x={shape.x - w / 2}
                  y={barY}
                  width={w}
                  height={h}
                  rx={radius}
                  fill="#94a3b8"
                  stroke={selectedStation === st.code ? "#f59e0b" : "#334155"}
                  strokeWidth={selectedStation === st.code ? 3 : 2}
                />
                {shape.label !== false && (
                  <text
                    x={shape.x}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={13}
                    fontWeight={700}
                    fill="#334155"
                    pointerEvents="none"
                  >
                    {st.name}
                  </text>
                )}
              </g>
            );
                })}
              </g>
            );
          }
          return (
            <g
              key={st.code}
              onClick={() => openStation(st.code)}
              className="cursor-pointer"
              aria-label={`Jadwal stasiun ${st.name}`}
            >
              <rect
                x={st.x}
                y={st.y}
                width={st.w}
                height={st.h}
                rx={6}
                fill="#94a3b8"
                stroke={selectedStation === st.code ? "#f59e0b" : "#334155"}
                strokeWidth={selectedStation === st.code ? 3 : 2.5}
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
          );
        })}

        {/* Trains — block markers on the track with their train number and a
            direction arrow on the side they travel toward. The tick loop moves
            them via direct transform updates for smooth motion. */}
        {JOURNEYS.map(({ train, plan }, ti) => {
          const right = plan.start.dir === "right";
          return (
            <g
              key={train.train_no}
              clipPath={TRACK_CLIPS ? `url(#track-clip-${ti})` : undefined}
            >
              <g
                data-train={train.train_no}
                aria-label={`Train ${train.train_no} ${train.name}, ${right ? "eastbound" : "westbound"}`}
                onClick={() => openTrain(ti)}
                className="cursor-pointer"
                ref={(el) => {
                  trainGroupRefs.current[ti] = el;
                }}
                transform="translate(-1000, -1000)"
                visibility="hidden"
              >
              <rect
                ref={(el) => {
                  trainRectRefs.current[ti] = el;
                }}
                x={-TRAIN_HALF_LEN}
                y={-TRAIN_HALF_HEIGHT}
                width={2 * TRAIN_HALF_LEN}
                height={2 * TRAIN_HALF_HEIGHT}
                rx={5 * CONTROL_SCALE}
                fill="#bfdbfe"
                stroke="#2563eb"
                strokeWidth={1.5 * CONTROL_SCALE}
              />
              {/* Articulated body — used INSTEAD of the rect while the train
                  spans a junction, so it bends along the rails it occupies.
                  Mitred joints keep it pointy; the two are never both shown. */}
              {ARTICULATED_TRAINS && (
                <path
                  ref={(el) => {
                    trainBendyRefs.current[ti] = el;
                  }}
                  data-train-body="articulated"
                  fill="#bfdbfe"
                  stroke="#2563eb"
                  strokeWidth={1.5 * CONTROL_SCALE}
                  strokeLinejoin="round"
                  visibility="hidden"
                />
              )}
              {/* direction arrow — rotates with the box on diagonals so it always
                  points along the track in the travel direction (updated per segment) */}
              <path
                ref={(el) => {
                  trainArrowRefs.current[ti] = el;
                }}
                d={
                  right
                    ? arrowRight(TRAIN_HALF_LEN, TRAIN_ARROW_SCALE)
                    : arrowLeft(TRAIN_HALF_LEN, TRAIN_ARROW_SCALE)
                }
                stroke="#1e3a8a"
                // the stroke grows with the glyph, else a bigger arrow reads thin
                strokeWidth={2 * CONTROL_SCALE * TRAIN_ARROW_SCALE}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                pointerEvents="none"
              />
              {/* conflict warning badge — red circle with "!" on every train
                  involved in a live conflict (counter-rotates to stay upright) */}
              <g
                ref={(el) => {
                  trainExclamRefs.current[ti] = el;
                }}
                transform={`translate(${EXCLAM_OFFSET[0]}, ${EXCLAM_OFFSET[1]})`}
                visibility="hidden"
                pointerEvents="none"
              >
                <circle
                  r={8 * CONTROL_SCALE}
                  fill="#dc2626"
                  stroke="#ffffff"
                  strokeWidth={1.5 * CONTROL_SCALE}
                />
                <text
                  y={4.5 * CONTROL_SCALE}
                  textAnchor="middle"
                  fontSize={13 * CONTROL_SCALE}
                  fontWeight={900}
                  fill="#ffffff"
                >
                  !
                </text>
              </g>
              <text
                ref={(el) => {
                  trainTextRefs.current[ti] = el;
                }}
                x={0}
                // baseline sits a third of the cap height below the centre
                y={TRAIN_FONT_SIZE / 3}
                textAnchor="middle"
                fontSize={TRAIN_FONT_SIZE}
                fontWeight={800}
                fill="#1e3a8a"
                pointerEvents="none"
              >
                {train.train_no}
              </text>
              </g>
            </g>
          );
        })}

        {/* Point buttons — one per switch; a single mid-crossover button per coupled pair. */}
        {POINT_CONTROLS.map((ctl) => {
          const id = ctl.ids[0];
          const reversed = switches[id] === "reversed";
          const locked = isLocked(id);
          const cs = POINT_SCALE; // handles may shrink further than the trains
          const r = (ctl.coupled ? 12 : 10) * cs;
          // the circle label: the PCx name for the JNG-style coupled groups,
          // else the concatenated ids (Bekasi's "78"); the font is fitted to
          // the circle so it never spills (the small controlScale circles
          // would otherwise overflow with 4-digit concatenated ids)
          const labelText = ctl.coupled
            ? ctl.label.startsWith("PC")
              ? ctl.label
              : `${ctl.ids[0]}${ctl.ids[1]}`
            : String(ctl.ids[0]);
          const baseFont = ctl.coupled ? 9 : 11;
          const fitFont = Math.min(baseFont, ((r / cs) * 2 * 1.45) / Math.max(1, labelText.length));
          return (
            <g
              key={ctl.onSwitchId !== undefined ? `${ctl.label}-${ctl.onSwitchId}` : ctl.ids.join("-")}
              transform={`translate(${ctl.x}, ${ctl.y})`}
              className={`group select-none focus:outline-none ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
              role="button"
              aria-pressed={reversed}
              aria-disabled={locked}
              aria-label={`Wesel ${ctl.coupled ? ctl.ids.map((i) => `P${i}`).join("+") : ctl.ids[0]} (${ctl.label}), ${reversed ? "belok" : "lurus"}${locked ? ", terkunci" : ""}`}
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
                r={(ctl.coupled ? 16 : 14) * cs}
                fill="none"
                stroke={locked ? "#ef4444" : "#16a34a"}
                strokeWidth={1.5 * cs}
                strokeDasharray={locked ? "3 3" : undefined}
                className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
              />
              <circle
                r={r}
                fill={reversed ? "#16a34a" : "#ffffff"}
                stroke={reversed ? "#15803d" : "#94a3b8"}
                strokeWidth={2 * cs}
              />
              {locked && (
                <text y={-r - 4 * cs} textAnchor="middle" fontSize={11 * cs} pointerEvents="none">
                  🔒
                </text>
              )}
              <text
                y={4 * cs}
                textAnchor="middle"
                fontSize={fitFont * cs}
                fontWeight={700}
                fill={reversed ? "#ffffff" : "#475569"}
                pointerEvents="none"
              >
                {labelText}
              </text>
            </g>
          );
        })}

        {/* Signals — 3-aspect (green top, yellow middle, red bottom, railway order).
            AI-controlled entry signals are hidden from view (logic-only). */}
        {SIGNALS.map((sig) => {
          if (sig.ai) return null; // invisible — AI-controlled, not player-facing
          const aspect = aspectOf(sig.id);
          const passive = sig.block === true; // ai signals never render here
          const up = sig.mount === "up";
          const cs = SIGNAL_SCALE; // signals may shrink further than the points
          const headTop = up ? -50 * cs : 6 * cs;
          const lamps = [up ? -38 * cs : 18 * cs, up ? -26 * cs : 30 * cs, up ? -14 * cs : 42 * cs];
          const lit = [aspect === "green", aspect === "amber", aspect === "red"];
          const colors = ["#22c55e", "#eab308", "#ef4444"];
          return (
            <g
              key={sig.id}
              transform={`translate(${sig.x}, ${sig.y})`}
              className={passive ? "select-none" : "group cursor-pointer select-none focus:outline-none"}
              role={passive ? undefined : "button"}
              aria-pressed={passive ? undefined : aspect !== "red"}
              aria-label={`Signal ${codeOf(sig.id)} (${sig.label}), aspect ${aspect}${sig.block ? ", automatic block" : ""}`}
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
                  <rect x={-14 * cs} y={up ? -54 * cs : -4 * cs} width={28 * cs} height={58 * cs} rx={8 * cs} fill="transparent" />
                  <rect
                    x={-14 * cs}
                    y={up ? -54 * cs : -4 * cs}
                    width={28 * cs}
                    height={58 * cs}
                    rx={8 * cs}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={1.5 * cs}
                    className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                  />
                </>
              )}
              {/* post */}
              <line x1={0} y1={0} x2={0} y2={up ? -6 * cs : 6 * cs} stroke="#334155" strokeWidth={3 * cs} />
              {/* head */}
              <rect x={-9 * cs} y={headTop} width={18 * cs} height={44 * cs} rx={5 * cs} fill="#ffffff" stroke="#334155" strokeWidth={1.5 * cs} />
              {/* lit lamp glow */}
              {lit[0] && <circle cx={0} cy={lamps[0]} r={9 * cs} fill={colors[0]} opacity={0.35} />}
              {lit[1] && <circle cx={0} cy={lamps[1]} r={9 * cs} fill={colors[1]} opacity={0.35} />}
              {lit[2] && <circle cx={0} cy={lamps[2]} r={9 * cs} fill={colors[2]} opacity={0.35} />}
              {/* lamps */}
              <circle cx={0} cy={lamps[0]} r={5 * cs} fill={lit[0] ? colors[0] : "#64748b"} />
              <circle cx={0} cy={lamps[1]} r={5 * cs} fill={lit[1] ? colors[1] : "#64748b"} />
              <circle cx={0} cy={lamps[2]} r={5 * cs} fill={lit[2] ? colors[2] : "#64748b"} />
              {/* label */}
              <text
                x={13 * cs}
                y={headTop + 26 * cs}
                textAnchor="start"
                fontSize={10 * cs}
                fontWeight={600}
                fill="#64748b"
                pointerEvents="none"
              >
                {codeOf(sig.id)}
              </text>
            </g>
          );
        })}

        </g>
      </svg>

      {/* Control buttons (hidden by default — show them in Settings) */}
      <div className="mt-6">
        {showControls && (
        <div className="flex flex-wrap justify-center gap-2">
          {POINT_CONTROLS.filter(
            // a handle-per-switch group has one control per point but is still ONE
            // lever, so the button list shows it once
            (ctl, index, all) =>
              ctl.onSwitchId === undefined ||
              all.findIndex((other) => other.label === ctl.label) === index
          ).map((ctl) => {
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
                className={`${
                  CONTROL_SCALE < 1 ? "px-1.5 py-0.5 text-[11px]" : "px-3 py-1.5 text-sm"
                } rounded-full font-medium border transition-colors ${
                  locked
                    ? "bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed"
                    : reversed
                    ? "bg-green-100 border-green-300 text-green-800 cursor-pointer"
                    : "bg-white border-slate-300 text-slate-600 hover:border-slate-400 cursor-pointer"
                }`}
              >
                {name} · {reversed ? "BELOK" : "LURUS"}
                {locked && " 🔒"}
              </button>
            );
          })}
          {SIGNALS.map((sig) => {
            if (sig.ai) return null; // hidden — AI-controlled
            const aspect = aspectOf(sig.id);
            const label = aspect === "green" ? "HIJAU" : aspect === "amber" ? "KUNING" : "MERAH";
            if (sig.block) {
              return (
                <button
                  key={sig.id}
                  type="button"
                  disabled
                  title={`${sig.label} — ${sig.block ? "otomatis, mengikuti sinyal berikutnya" : "dikendalikan AI"}`}
                  className={`${
                    CONTROL_SCALE < 1 ? "px-1.5 py-0.5 text-[11px]" : "px-3 py-1.5 text-sm"
                  } rounded-full font-medium border cursor-default ${
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
                onClick={(e) => {
                  const shift = (e as React.MouseEvent).shiftKey;
                  if (shift && routeFromRef.current) {
                    // shift-click: route the last-clicked signal TO this one
                    toggleSignal(routeFromRef.current, sig.id);
                  } else {
                    toggleSignal(sig.id);
                    routeFromRef.current = sig.id;
                  }
                }}
                aria-pressed={aspect !== "red"}
                title={routeFromRef.current ? `Shift-klik: rute dari ${codeOf(routeFromRef.current)} ke ${codeOf(sig.id)}` : undefined}
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
        <p className="mt-8 pb-6 text-center text-xs text-slate-400">
          Dibuat biar tau mana yg UX nya lebih enak oleh A Keep
        </p>
        {conflictNote && (
          <div
            role="alert"
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          >
            {conflictNote}
          </div>
        )}

        {/* Start-time picker — shown on first load; the sim stays frozen until a
            time is chosen. Trains already in service are placed per their schedule. */}
        {startModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-80 rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-800">Waktu mulai</h2>
              <p className="mt-1 text-xs text-slate-500">
                Mulai pada waktu tertentu dalam jadwal. Kereta yang sudah beroperasi
                ditempatkan sesuai posisi jadwalnya; sistem interlocking mengambil alih
                setelahnya.
              </p>
              <input
                type="time"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["00:00", "06:00", "12:00", "18:00"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStartTimeInput(t)}
                    className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800 cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  const [h, m] = startTimeInput.split(":").map(Number);
                  initializeSim((h || 0) * 3600 + (m || 0) * 60);
                }}
                className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 cursor-pointer"
              >
                Mulai
              </button>
            </div>
          </div>
        )}

        {/* Roster toggle — the timetable panel button under the time controls */}
        <button
          type="button"
          onClick={() => setRosterOpen((v) => !v)}
          aria-pressed={rosterOpen}
          className="fixed left-4 top-16 z-50 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors cursor-pointer hover:border-slate-400 hover:text-slate-800"
        >
          {rosterOpen ? "Tutup daftar" : "Daftar kereta"}
        </button>

        {/* Timetable roster — active trains with status + delay (Indonesian) */}
        {rosterOpen && (
          <div className="fixed left-4 top-24 z-50 flex max-h-[70vh] w-80 flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-sm font-semibold text-slate-700">Kereta Aktif</p>
              <p className="text-xs text-slate-400">{JOURNEYS.length} KA</p>
            </div>
            <div ref={rosterScrollRef} className="overflow-auto">
              {(() => {
                // the active train whose origin is nearest the current sim time
                let best = -1;
                let bestD = Infinity;
                JOURNEYS.forEach((j, ti) => {
                  const st = trainStatesRef.current[ti];
                  if (!st || !st.spawned || st.done) return;
                  const d = Math.abs(j.train.stops[0].arr - simRef.current);
                  if (d < bestD) { bestD = d; best = ti; }
                });
                const nowTarget = best;
                return JOURNEYS.map((j, ti) => {
                  const st = trainStatesRef.current[ti];
                  if (!st || !st.spawned || st.done) return null;
                  const info = trainInfo(ti);
                  if (!info) return null;
                  return (
                    <button
                      key={j.train.train_no}
                      type="button"
                      onClick={() => openTrain(ti)}
                      data-now={ti === nowTarget ? "true" : undefined}
                    className={`flex w-full items-center gap-2 border-b border-slate-50 px-4 py-2 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                      selectedTrain === ti ? "bg-amber-50" : ""
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        st.stopped && st.stopReason === "conflict"
                          ? "bg-red-600"
                          : st.stopped && st.stopReason === "queue"
                          ? "bg-amber-500"
                          : st.stopped
                          ? "bg-red-400"
                          : info.atStopIdx !== null
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-800">{j.train.train_no}</span>
                      <span className="block truncate text-xs text-slate-500">{info.status}</span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        info.delay.startsWith("terlambat")
                          ? "text-red-600"
                          : info.delay.startsWith("awal")
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {info.delay}
                    </span>
                  </button>
                );
                });
              })()}
            </div>
          </div>
        )}

        {/* Train info card — click a marker or a roster row to inspect its timetable */}
        {selectedTrain !== null && (() => {
          const info = trainInfo(selectedTrain);
          if (!info) return null;
          const now = fmtTime(simRef.current);
          return (
            <div className="fixed right-4 top-16 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-slate-800">{info.no}</p>
                  <p className="text-xs text-slate-500">{info.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">{info.dirLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTrain(null)}
                  aria-label="Tutup"
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                <span className="font-semibold">{info.status}</span>
                <span className="text-slate-400"> · jam sim {now}</span>
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${
                  info.delay.startsWith("terlambat") ? "text-red-600" : info.delay.startsWith("awal") ? "text-amber-600" : "text-slate-500"
                }`}
              >
                {info.delay}
              </p>
              <table className="mt-3 w-full text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="pb-1 text-left font-medium">Stasiun</th>
                    <th className="pb-1 text-right font-medium">Tiba</th>
                    <th className="pb-1 text-right font-medium">Berangkat</th>
                    <th className="pb-1 text-right font-medium">Aktual</th>
                  </tr>
                </thead>
                <tbody>
                  {info.stops.map((s, i) => (
                    <tr key={i} className={info.atStopIdx === i ? "text-slate-800" : "text-slate-500"}>
                      <td className="py-1">
                        {s.name}
                        {s.meets && s.meets.length > 0 && (
                          <span className="ml-1 text-[10px] font-semibold text-purple-600">
                            susul {s.meets.map((m) => m.with).join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-right tabular-nums">{s.arrLabel}</td>
                      <td className="py-1 text-right tabular-nums">{s.depLabel}</td>
                      <td className="py-1 text-right tabular-nums">
                        {s.actual != null
                          ? typeof s.actual === "number"
                            ? fmtTime(s.actual)
                            : s.actual
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Station timetable — click a nameplate to inspect the trains at a station */}
        {selectedStation !== null && (() => {
          const rows = stationSchedule(selectedStation);
          const now = simRef.current;
          return (
            <div className="fixed right-4 top-16 z-50 flex max-h-[70vh] w-96 flex-col rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                <p className="text-sm font-semibold text-slate-700">Jadwal {stationName(selectedStation)}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-400">jam sim {fmtTime(now)}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedStation(null)}
                    aria-label="Tutup"
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div ref={stationScrollRef} className="overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-slate-400">
                      <th className="px-3 py-1.5 text-left font-medium">Kereta</th>
                      <th className="px-2 py-1.5 text-right font-medium">Tiba</th>
                      <th className="px-2 py-1.5 text-right font-medium">Berangkat</th>
                      <th className="px-3 py-1.5 text-right font-medium">Aktual / Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      // nearest scheduled arrival to the current sim time
                      const isNow = Math.abs(r.arr - simRef.current) < 240;
                      return (
                      <tr
                        key={r.no}
                        onClick={() => openTrain(JOURNEYS.findIndex((j) => j.train.train_no === r.no))}
                        data-now={isNow ? "true" : undefined}
                        className={`border-t border-slate-50 cursor-pointer hover:bg-slate-50 ${
                          r.atStation ? "bg-green-50" : ""
                        }`}
                      >
                        <td className="px-3 py-1.5 font-semibold text-slate-800">
                          {r.no}
                          {r.meets && r.meets.length > 0 && (
                            <span
                              title={`Susul ${r.meets.map((m) => m.with).join(", ")}`}
                              className="ml-1.5 rounded bg-purple-100 px-1 py-0.5 text-[9px] font-semibold text-purple-700"
                            >
                              susul
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.arrLabel}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.depLabel}</td>
                        <td className="px-3 py-1.5 text-right">
                          {r.atStation ? (
                            <span className="font-semibold text-green-700">{r.delay}</span>
                          ) : r.actual != null ? (
                            <span className="tabular-nums text-slate-500">{fmtTime(r.actual)}</span>
                          ) : r.active ? (
                            <span className="text-blue-600">{r.status}</span>
                          ) : r.arr < now ? (
                            <span className="text-slate-400">lewat</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Notification board — live queue of trains held at a signal >30 s +
            susul warnings. Folds to the header (history kept); the trash clears. */}
        {notices.length > 0 && (
          <div
            data-board="notifications"
            className="fixed left-1/2 top-4 z-50 w-80 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur-sm dark:bg-slate-800/90"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <p className="text-sm font-semibold text-slate-700">Notifikasi</p>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {notices.filter((x) => !x.resolved).length}
                </span>
                <button
                  type="button"
                  onClick={() => setNotices([])}
                  aria-label="Bersihkan notifikasi"
                  title="Bersihkan notifikasi"
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  🗑
                </button>
                <button
                  type="button"
                  onClick={() => setNoticesFolded((v) => !v)}
                  aria-label={noticesFolded ? "Bentangkan notifikasi" : "Lipat notifikasi"}
                  title={noticesFolded ? "Bentangkan" : "Lipat"}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  {noticesFolded ? "⌄" : "⌃"}
                </button>
              </div>
            </div>
            {/* compact height; the visual-test mask box stays deterministic */}
            {!noticesFolded && (
            <div className="h-40 overflow-auto">
              {notices.map((n) => {
                const dur = n.resolved ? (n.resolvedDuration ?? 0) : Math.max(0, Math.round(simRef.current - n.since));
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 border-b border-slate-50 px-4 py-1.5 ${n.resolved ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        n.kind === "susul"
                          ? "bg-amber-100 text-amber-700"
                          : n.kind === "countdown"
                          ? "bg-blue-500 text-white"
                          : n.resolved
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {n.kind === "susul" ? "!" : n.resolved ? "✓" : ""}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${n.resolved ? "text-slate-500 line-through" : "text-slate-800"}`}>
                        {n.trainNo}
                      </p>
                      <p className="text-xs text-slate-600">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
                      {n.kind === "susul" || n.kind === "countdown" ? "" : fmtDur(dur)}
                    </span>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* Debug click log — collapsible, copyable for reporting issues */}
        <div className="fixed bottom-4 left-4 z-50">
          {debugOpen && (
            <div className="mb-2 w-96 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-600">Click log (oldest first)</p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(clickLog.join("\n"))}
                    disabled={clickLog.length === 0}
                    className="rounded px-2 py-0.5 text-[11px] font-medium border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-40 cursor-pointer"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setClickLog([])}
                    disabled={clickLog.length === 0}
                    className="rounded px-2 py-0.5 text-[11px] font-medium border border-slate-300 text-slate-600 hover:border-slate-400 disabled:opacity-40 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {clickLog.length === 0 ? (
                <p className="text-xs text-slate-400">No clicks yet — interact with points &amp; signals.</p>
              ) : (
                <ol className="space-y-0.5 font-mono text-[11px] leading-snug text-slate-700">
                  {clickLog.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setDebugOpen((o) => !o)}
            aria-expanded={debugOpen}
            aria-label="Log klik"
            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <span aria-hidden="true">🐛</span> Debug log
            {clickLog.length > 0 && (
              <span className="rounded-full bg-slate-200 px-1.5 text-[10px] font-bold text-slate-700">
                {clickLog.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
