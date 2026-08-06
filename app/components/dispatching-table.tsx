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
  spawnPriority,
  fmtHms,
  SEGMENT_KM,
  RUN_SPEED_KMH,
  type JourneyPlan,
  type Train,
  type TrainState,
  type MoveCtx,
  type LegPlan,
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

// Train direction arrows (local +x is the travel direction once the marker is
// rotated onto a diagonal segment, so the right-pointing shape is used there).
const ARROW_RIGHT = "M32,0 H41 M36,-4 L41,0 L36,4";
const ARROW_LEFT = "M-32,0 H-41 M-36,-4 L-41,0 L-36,4";

// Train marker color by state: blue = running, green = stopped at a station per
// the schedule (dwell), red = held at a red signal, amber = waiting at a junction.
const TRAIN_COLORS = {
  moving: { fill: "#bfdbfe", stroke: "#2563eb" },
  station: { fill: "#bbf7d0", stroke: "#16a34a" },
  signal: { fill: "#fecaca", stroke: "#dc2626" },
  junction: { fill: "#fde68a", stroke: "#d97706" },
  conflict: { fill: "#ef4444", stroke: "#450a0a" },
} as const;
type TrainStopState = keyof typeof TRAIN_COLORS;

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
  { id: 1, x: 326, y: 89, lineY: 89, dashSide: "right", branch: "M326 90 L438 205", label: "persilangan kiri, ujung atas" },
  { id: 2, x: 438, y: 205, lineY: 205, dashSide: "left", branch: "M326 90 L438 205", label: "persilangan kiri, ujung bawah" },
  { id: 3, x: 500, y: 89, lineY: 89, dashSide: "right", branch: "M500 89 L556 148", label: "lintas simpang atas, ujung barat" },
  { id: 4, x: 786, y: 89, lineY: 89, dashSide: "left", branch: "M730 148 L786 89", label: "lintas simpang atas, ujung timur" },
  { id: 5, x: 500, y: 205, lineY: 205, dashSide: "right", branch: "M500 205 L556 264", label: "lintas simpang bawah, ujung barat" },
  { id: 6, x: 788, y: 205, lineY: 205, dashSide: "left", branch: "M730 264 L788 205", label: "lintas simpang bawah, ujung timur" },
  { id: 7, x: 846, y: 205, lineY: 205, dashSide: "right", branch: "M846 205 L960 89", label: "persilangan kanan, ujung bawah" },
  { id: 8, x: 960, y: 89, lineY: 89, dashSide: "left", branch: "M846 205 L960 89", label: "persilangan kanan, ujung atas" },
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
  { id: "J1", x: 322, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "jalur bawah, arah kanan" },
  { id: "J2", x: 730, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p5", "p6"], label: "jalur bawah, kiri P6" },
  { id: "J3", x: 730, y: 264, lineY: 264, dir: "right", mount: "down", edge: ["ll1", "ll2"], label: "lintas simpang bawah, arah kanan" },
  { id: "J4", x: 1076, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "jalur atas, dua sel kanan P8" },
  { id: "J5", x: 558, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p4", "p3"], label: "jalur atas, kanan P3" },
  { id: "J6", x: 558, y: 148, lineY: 148, dir: "left", mount: "up", edge: ["ul2", "ul1"], label: "lintas simpang atas, arah kiri" },
  { id: "J7", x: 558, y: 264, lineY: 264, dir: "left", mount: "down", edge: ["ll2", "ll1"], label: "lintas simpang bawah, arah kiri" },
  // automatic block signals on the bottom-line approach (always mirror the next signal).
  // B101 is the smallest number and lies closest to J1 (J4); higher numbers reach further
  // left (G4, D4, A4).
  { id: "B101", x: 145, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, J4", block: true },
  { id: "B102", x: -29, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, G4", block: true },
  { id: "B103", x: -203, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, D4", block: true },
  { id: "B104", x: -377, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, A4", block: true },
  // top-line approach (right→left): blocks J2→G2→D2→A2. The A2 entry signal sits
  // at the map's west edge, ahead of B201 (red until the AI clears it) — so B201
  // mirrors it and defaults to amber.
  { id: "A2", x: -400, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal masuk, A2 (dikendalikan AI)", ai: true },
  { id: "B201", x: -377, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, A2", block: true },
  { id: "B202", x: -203, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, D2", block: true },
  { id: "B203", x: -29, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, G2", block: true },
  { id: "B204", x: 145, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, J2", block: true },
  // top-line right approach: blocks AC2..AL2 nearest to J4. Displayed as
  // B201..B204 (internal ids stay unique — two sets share the same codes).
  { id: "B9", code: "B201", x: 1247, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AC2", block: true },
  { id: "B10", code: "B202", x: 1421, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AF2", block: true },
  { id: "B11", code: "B203", x: 1595, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AI2", block: true },
  { id: "B12", code: "B204", x: 1769, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AL2", block: true },
  // bottom-line right exit: blocks AC4..AL4 — entry root is beyond the map, so no next
  // signal here and they all read green. Numbered away from the map (B109 = AC4 nearest).
  { id: "B109", x: 1247, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AC4", block: true },
  { id: "B108", x: 1421, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AF4", block: true },
  { id: "B107", x: 1595, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AI4", block: true },
  { id: "B106", x: 1769, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AL4", block: true },
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
const BOTTOM_LINE_Y = 205;

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
  { name: "Tambun", x: 986 - SHIFT, y: 0, w: 116, h: 58 }, // cells R1–J1, row 1
  { name: "Cibitung", x: 2030 - SHIFT, y: 116, w: 116, h: 58 }, // cells AJ3–AK3, row 3
];

type StationCell = { code: string; cells: { col: string; row: number }[] };
const STATION_CELLS: StationCell[] = [
  // B2–C2 and B4–C4 → BKST (Bekasi Timur)
  { code: "BKST", cells: [{ col: "B", row: 2 }, { col: "C", row: 2 }, { col: "B", row: 4 }, { col: "C", row: 4 }] },
  // R2–J2, R3–J3, R4–J4, R5–J5 → TB (Tambun)
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
// Journey direction: the top-line platform order decides — a train whose final
// stop is east of its first runs rightward, otherwise leftward.
const journeyDir = (stops: Train["stops"], platformX: Record<string, number>): Dir =>
  platformX[stops[stops.length - 1].trackmark] > platformX[stops[0].trackmark] ? "right" : "left";
// Each direction runs on its own line: westbound on the top (row 2), eastbound
// on the bottom (row 4).
const journeyLineY = (stops: Train["stops"], platformX: Record<string, number>): number =>
  journeyDir(stops, platformX) === "left" ? TOP_LINE_Y : BOTTOM_LINE_Y;

const JOURNEYS: { train: Train; plan: JourneyPlan }[] = (() => {
  // Spawn coincidence resolution: two trains due at the same origin platform
  // close together form a cluster; within it the higher-priority one goes
  // first (non-commuters ahead of stopping commuters, then smaller train
  // number — real dispatching holds the commuter at the previous station for
  // an additional/seasonal train). A later train may only spawn once the
  // previous departure is TWO SIGNALS ahead — a position-based platform
  // clearing, not a fixed clock gap.
  const trains = TRAINS.map((t) => t);
  const firstLegSpeed = (stops: Train["stops"], dir: Dir): number => {
    const from = PLATFORM_CENTER_X[stops[0].trackmark];
    const to = PLATFORM_CENTER_X[stops[1].trackmark];
    const km = SEGMENT_KM[`${stops[0].trackmark}-${stops[1].trackmark}`] ?? SEGMENT_KM[`${stops[1].trackmark}-${stops[0].trackmark}`];
    const distUnits = Math.abs(to - from);
    return km ? (distUnits * RUN_SPEED_KMH) / (km * 3600) : distUnits / Math.max(1, stops[1].arr - stops[0].dep);
  };
  // time for a departing train to be 2 signals ahead of the platform
  const twoSignalGap = (station: string, stops: Train["stops"], dir: Dir): number => {
    const lineY = dir === "right" ? BOTTOM_LINE_Y : TOP_LINE_Y;
    const platformX = PLATFORM_CENTER_X[station];
    const ahead = SIGNALS.filter(
      (s) => s.lineY === lineY && s.dir === dir && (dir === "right" ? s.x > platformX : s.x < platformX)
    ).sort((a, b) => (dir === "right" ? a.x - b.x : b.x - a.x));
    const second = ahead[1];
    if (!second) return 30; // fewer than 2 signals ahead — fallback
    return Math.abs(second.x - platformX) / Math.max(1, firstLegSpeed(stops, dir));
  };
  const SPAWN_WINDOW_SECS = 60; // arrivals this close are a coincidence cluster
  const byStation: Record<string, Train[]> = {};
  for (const t of trains) {
    const st = t.stops[0].trackmark;
    if (!byStation[st]) byStation[st] = [];
    byStation[st].push(t);
  }
  for (const list of Object.values(byStation)) {
    const dir = journeyDir(list[0].stops, PLATFORM_CENTER_X);
    const gap = twoSignalGap(list[0].stops[0].trackmark, list[0].stops, dir);
    list.sort((a, b) => a.stops[0].arr - b.stops[0].arr);
    // re-order coincident clusters by priority (in place)
    let i = 0;
    while (i < list.length) {
      const clusterStart = list[i].stops[0].arr;
      let j = i;
      while (j + 1 < list.length && list[j + 1].stops[0].arr <= clusterStart + SPAWN_WINDOW_SECS) j++;
      if (j > i) {
        const cluster = list.slice(i, j + 1).sort((a, b) => spawnPriority(a) - spawnPriority(b));
        list.splice(i, j - i + 1, ...cluster);
      }
      i = j + 1;
    }
    // space the platform: the next train spawns only when the previous
    // departure is 2 signals ahead
    let clearAt = -Infinity;
    for (const t of list) {
      const o = t.stops[0];
      if (o.arr < clearAt) {
        o.arr = Math.round(clearAt);
        o.arr_actual = fmtHms(o.arr);
        o.dep = Math.max(o.dep, o.arr);
        o.dep_actual = fmtHms(o.dep);
      }
      clearAt = Math.max(o.dep, o.arr) + gap;
    }
  }
  return trains.map((tr) => ({
    train: tr,
    plan: buildJourney(
      tr.stops,
      PLATFORM_CENTER_X,
      journeyLineY(tr.stops, PLATFORM_CENTER_X),
      NODES,
      journeyDir(tr.stops, PLATFORM_CENTER_X)
    ),
  }));
})();
// Bidirectional loop tracks (TB passing loops): the static next-signal span
// leaves the loop's middle unprotected (J7 covers [-∞,558], J3 covers [730,∞]),
// so a train in the middle reddened no loop signal. Widen every loop signal's
// section to the whole loop — a train anywhere on it reddens all directions.
const LOOP_LINE_YS = new Set([148, 264]);
const LOOP_X_MIN = 500;
const LOOP_X_MAX = 788;
const SIGNAL_SECTIONS = signalSections(
  SIGNALS.map((s) => ({ id: s.id, x: s.x, y: s.lineY, dir: s.dir }))
).map((s) =>
  LOOP_LINE_YS.has(s.lineY)
    ? { ...s, lo: Math.min(s.lo, LOOP_X_MIN), hi: Math.max(s.hi, LOOP_X_MAX) }
    : s
);

// ---------------------------------------------------------------------------
// Meets / susul: planned overtakes from the timetable. The held train may not
// leave the meet station until EVERY partner's leading edge has crossed the
// station platform AND is two signals clear — the same 2-signal principle used
// for spawn spacing. Partners not loaded (e2e train filters) drop the
// dependency. The release is expressed as an offset past the partner's recorded
// crossing time, computed from the partner's post-meet leg speed.
// ---------------------------------------------------------------------------
type MeetDep = { partnerIdx: number; meetStopIdx: number; releaseOffset: number };
const MEETS_BY_TRAIN: Map<number, Map<string, MeetDep[]>> = (() => {
  const out = new Map<number, Map<string, MeetDep[]>>();
  JOURNEYS.forEach((j, ti) => {
    j.train.stops.forEach((s, si) => {
      if (!s.meets?.length) return;
      const deps: MeetDep[] = [];
      for (const m of s.meets) {
        const pi = JOURNEYS.findIndex((o) => o.train.train_no === m.with);
        if (pi < 0) continue; // partner not loaded (test filter)
        const p = JOURNEYS[pi];
        const pStopIdx = p.train.stops.findIndex((o) => o.trackmark === s.trackmark);
        if (pStopIdx < 0) continue; // partner never calls at the meet station
        const platformX = PLATFORM_CENTER_X[s.trackmark];
        const pDir = journeyDir(p.train.stops, PLATFORM_CENTER_X);
        const pLineY = journeyLineY(p.train.stops, PLATFORM_CENTER_X);
        const ahead = SIGNALS.filter(
          (o) =>
            o.lineY === pLineY &&
            o.dir === pDir &&
            (pDir === "right" ? o.x > platformX : o.x < platformX)
        ).sort((a, b) => (pDir === "right" ? a.x - b.x : b.x - a.x));
        const second = ahead[1];
        const speed = p.plan.legs[Math.min(pStopIdx, p.plan.legs.length - 1)]?.speed ?? 1;
        deps.push({
          partnerIdx: pi,
          meetStopIdx: pStopIdx,
          releaseOffset: second ? Math.abs(second.x - platformX) / Math.max(1, speed) : 30,
        });
      }
      if (deps.length) {
        let byStation = out.get(ti);
        if (!byStation) out.set(ti, (byStation = new Map()));
        byStation.set(s.trackmark, deps);
      }
    });
  });
  return out;
})();

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
      return done(`ke ${hit.id}`, hit.id);
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
          return done(`berakhir di P${node.sw}`, undefined, true);
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
            return done(`ke ${hit2.id}`, hit2.id);
          }
          pts.push([n.x, n.y]);
        }
        const last = branchAhead.path.length - 1;
        const far = NODES[branchAhead.path[last]];
        if (switches[branchAhead.farSw] === "reversed") {
          // rejoin the other line and keep going in the same direction
          incoming = last >= 1 ? branchAhead.path[last - 1] : cur;
          cur = far.straight[dir];
          if (!cur) return done(dir === "right" ? "ke ujung kanan" : "ke ujung kiri");
          continue; // junction already pushed — skip the fall-through push
        }
        // exit not set — trapped at the far end
        return done(`berakhir di P${branchAhead.farSw} — belum diatur`, undefined, true);
      } else if (reversed) {
        // branch behind (or none) + reversed = straight blocked
        pts.push([node.x, node.y]);
        return done(`berakhir di P${node.sw}`, undefined, true);
      }
    }

    pts.push([node.x, node.y]);
    const next = node.straight[dir];
    incoming = cur;
    cur = next;
    if (!cur) {
      return done(dir === "right" ? "ke ujung kanan" : "ke ujung kiri");
    }
  }
  return done("tidak dikenal", undefined, true);
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
  const [signalOn, setSignalOn] = useState<Record<string, boolean>>({ J1: false, J2: false, J3: false, J4: false, J5: false, J6: false, J7: false });
  const [conflictNote, setConflictNote] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false); // bottom point & signal buttons hidden by default
  const [clickLog, setClickLog] = useState<string[]>([]); // debug click history
  const [debugOpen, setDebugOpen] = useState(false);

  /** Append a click entry to the debug log with the current simulation time. */
  const logClick = (msg: string) =>
    setClickLog((l) => [...l, `[${fmtTime(simRef.current)}] ${msg}`]);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  // held-at-signal notification board (>30 s holds)
  type Notice = {
    id: number;
    trainNo: string;
    message: string;
    since: number; // sim time the hold began (live duration = now − since)
    resolved: boolean;
    resolvedDuration?: number;
  };
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextNoticeIdRef = useRef(1);
  // Simulation-time accumulator (trains will consume this) + direct DOM clock
  // updates so the display stays smooth without re-rendering the table 60×/s.
  const simRef = useRef(0);
  const clockRef = useRef<HTMLSpanElement>(null);
  const scaleRef = useRef<number>(1);
  scaleRef.current = paused ? 0 : timeScale; // keep the tick loop in sync with the selected scale
  // Train movement state (mutated per tick) — markers move via direct DOM
  // updates; React re-renders only when a train's occupied section changes.
  const trainStatesRef = useRef<TrainState[]>(
    JOURNEYS.map((j, ti) => {
      const st = initTrain(j.plan, NODES, j.plan.legs[0]?.speed ?? 0);
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
      if (crossed == null || crossed >= simRef.current) continue;
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
  const trainExclamRefs = useRef<(SVGGElement | null)[]>([]);
  const [occupancyTick, setOccupancyTick] = useState(0);
  const trainSectionKeyRef = useRef("");
  // Independent route reservations: created when the player clears a signal,
  // persist while a train uses them, and are consumed progressively by the train.
  type Reservation = { pts: [number, number][]; nextSignalId?: string; lineY: number };
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
  const distToPoly = (px: number, py: number, pts: [number, number][]) => {
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
  const unpassedOf = (id: string, res: Reservation): [number, number][] | null => {
    const ownerIdx = reservedByRef.current[id];
    const owner = ownerIdx !== undefined ? trainStatesRef.current[ownerIdx] : undefined;
    if (owner && owner.done) return null;
    const fronts =
      owner && owner.spawned
        ? [{ lineY: owner.y, front: owner.dir === "left" ? owner.x - CELL : owner.x + CELL }]
        : trainStatesRef.current
            .filter((m) => m.spawned && !m.done && m.dir === SIGNALS.find((s) => s.id === id)?.dir)
            .map((m) => ({ lineY: m.y, front: m.dir === "left" ? m.x - CELL : m.x + CELL }));
    return reservationAhead(res.pts, fronts) ?? res.pts;
  };
  // latest ctx for the tick loop (mutated each render)
  const switchesRef = useRef(switches);
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
      nodes: NODES,
      signals: SIGNALS.map((s) => ({ id: s.id, x: s.x, y: s.lineY, dir: s.dir, ai: s.ai })),
      switches,
      aspectOf: aspectOfRef.current,
      trainHalfLen: CELL,
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
        const travel = sec - st.originArr;
        if (!st.done) advanceTrain(st, travel, ctx, plan.legs);
        st.time = travel;
      });
    };
    // pass 1 — place with meets holds OFF so every partner's crossing time is
    // recorded; pass 2 re-places from scratch with the holds active, reading
    // the pass-1 crossings (a held train must sit at the meet station even
    // when a partner crossed late into its dwell window)
    place(mkCtx());
    const snapshot = trainStatesRef.current.map((st) => [...st.actualArr]);
    trainStatesRef.current = trainStatesRef.current.map((st, ti) => {
      const n = initTrain(JOURNEYS[ti].plan, NODES, JOURNEYS[ti].plan.legs[0]?.speed ?? 0);
      n.idx = ti;
      n.actualArr = JOURNEYS[ti].train.stops.map(() => null);
      return n;
    });
    meetsReadRef.current = (pi, si) => snapshot[pi]?.[si] ?? null;
    const ctx2 = mkCtx();
    ctx2.meetsHold = meetsHold;
    place(ctx2);
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
        nodes: NODES,
        signals: SIGNALS.map((s) => ({ id: s.id, x: s.x, y: s.lineY, dir: s.dir, ai: s.ai })),
        switches: switchesRef.current,
        aspectOf: aspectOfRef.current,
        trainHalfLen: CELL,
        meetsHold,
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
      // Two trains conflict only when their BODIES share a track: the same
      // line, or the same segment (loop-entry diagonals). The old ±2-cell
      // square was wider than the track spacing (59 px — the lines sit at
      // y 89/148/205/264), so trains on different parallel tracks or their
      // diagonal approaches (e.g. one entering the lower loop while another is
      // held at the upper-loop signal) were falsely flagged as conflicting.
      const sameTrack = (a: TrainState, b: TrainState) =>
        (a.segFrom[0] === b.segFrom[0] &&
          a.segFrom[1] === b.segFrom[1] &&
          a.segTo[0] === b.segTo[0] &&
          a.segTo[1] === b.segTo[1]) ||
        Math.abs(a.y - b.y) < CELL / 2;
      const overlaps = (a: TrainState, b: TrainState) =>
        Math.abs(a.x - b.x) < 2 * CELL && sameTrack(a, b);
      const conflictIdx = new Set<number>();
      let newConflict = false;
      let conflictPair: string | null = null;
      for (let i = 0; i < live.length; i++) {
        for (let j = i + 1; j < live.length; j++) {
          const a = live[i];
          const b = live[j];
          if (!overlaps(a, b) || (atRest(a) && atRest(b))) continue; // tolerated queue
          conflictIdx.add(a.idx);
          conflictIdx.add(b.idx);
          conflictPair = `${JOURNEYS[a.idx]?.train.train_no ?? "?"} vs ${JOURNEYS[b.idx]?.train.train_no ?? "?"}`;
          for (const t of [a, b]) {
            if (!atRest(t)) {
              t.stopped = true;
              t.stopReason = "conflict";
              newConflict = true;
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
        if (m.stopped && m.stopReason === "conflict" && !live.some((o) => o.idx !== m.idx && overlaps(o, m))) {
          m.stopped = false;
          m.stopReason = null;
          m.time = simRef.current - m.originArr; // absorb the frozen period
        }
      }
      const sections = JOURNEYS.map((j, ti) => {
        const st = trainStatesRef.current[ti];
        const plan = j.plan;
        const g = trainGroupRefs.current[ti];
        const txt = trainTextRefs.current[ti];
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
        // Signal-pass consumption: signals the train's leading edge crossed this
        // tick lose their player clear (they stay red until re-clicked) and the
        // reservations whose routes ended there are released.
        for (const pid of st.passedSignals) {
          const s = SIGNALS.find((x) => x.id === pid);
          if (!s) continue;
          if (!s.block && !s.ai) {
            // the train consumed this signal's clear — it now owns the
            // reservation, so the route can be trimmed/released by its progress
            if (reservationsRef.current[s.id]) reservedByRef.current[s.id] = ti;
            setSignalOn((o) => (o[s.id] ? { ...o, [s.id]: false } : o));
          }
          setReservations((r) => {
            let changed = false;
            const out: Record<string, Reservation> = {};
            for (const [k, v] of Object.entries(r)) {
              if (v.nextSignalId === s.id) {
                changed = true;
                delete reservedByRef.current[k];
              } else out[k] = v;
            }
            return changed ? out : r;
          });
        }
        // Held-at-signal notifications: a train held at a signal for >30 s fires
        // a board notice; it resolves when the train moves again.
        if (st.stopped && st.stopReason === "signal") {
          if (st.holdSince === null) {
            st.holdSince = simRef.current;
            st.holdNotified = false;
          } else if (!st.holdNotified && simRef.current - st.holdSince > 30) {
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
              ].slice(0, 40)
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
            if (bestIdx !== undefined && bestD <= CELL) {
              reservedByRef.current[id] = bestIdx;
              userIdx = bestIdx;
              user = trainStatesRef.current[bestIdx];
            }
          }
          const end = res.pts[res.pts.length - 1];
          const front = user ? (ownerDir === "left" ? user.x - CELL : user.x + CELL) : 0;
          const passedEnd = user
            ? ownerDir === "left"
              ? front <= end[0]
              : front >= end[0]
            : false;
          // the user left the route (diverged away) without finishing it
          const leftRoute = !!user && !user.done && distToPoly(user.x, user.y, res.pts) > CELL * 1.5;
          // A train physically ON a bidirectional loop has taken over the
          // protection: the loop sections now cover the whole track, so a train
          // anywhere on it reddens every loop signal (both directions). Release
          // the reservation as soon as the train is actually in the loop.
          const onLoop = !!user && !user.done && (Math.abs(user.y - 148) < 1 || Math.abs(user.y - 264) < 1);
          // release once the train using the route finished (above), its front
          // passed the far end, it diverged away, or it is physically in the loop
          // — points unlock, signals clear
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
            const ahead = unpassedOf(id, res);
            const d = ahead && ahead.length >= 2 ? "M" + ahead.map(([x, y]) => `${x},${y}`).join(" ") : "";
            if (el.getAttribute("d") !== d) el.setAttribute("d", d);
          }
        }
        // render: straights snap to the nearest 2-cell span (grid-aligned hops);
        // diagonals (crossovers) follow the track continuously, rotated
        const horizontal = st.segFrom[1] === st.segTo[1];
        let rx = st.x;
        let ry = st.y;
        let ang = 0;
        if (horizontal) {
          // stopped trains snap BEHIND their raw position (floor eastbound /
          // ceil westbound) so the 2-cell marker never protrudes past the
          // signal or junction it is held at — a moving train rounds to the
          // nearest 2-cell span for grid-aligned hops
          const raw = (st.x + SHIFT) / CELL;
          const col = st.stopped
            ? (st.dir === "right" ? Math.floor(raw) : Math.ceil(raw)) - 1
            : Math.round(raw) - 1;
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
        // Marker color clues the train's state: green = stopped at a station
        // (scheduled dwell), red = held at a red signal, amber = waiting at a
        // junction for the route, blue = running.
        const leg = plan.legs[Math.min(st.leg, plan.legs.length - 1)];
        const dwelling = !st.stopped && leg.departAt !== undefined && st.time < leg.departAt;
        const stopState: TrainStopState = st.stopped
          ? st.stopReason === "signal"
            ? "signal"
            : st.stopReason === "junction"
            ? "junction"
            : st.stopReason === "conflict"
            ? "conflict"
            : "moving"
          : dwelling
          ? "station"
          : "moving";
        const rect = trainRectRefs.current[ti];
        if (rect) {
          const c = TRAIN_COLORS[stopState];
          if (rect.getAttribute("fill") !== c.fill) rect.setAttribute("fill", c.fill);
          const stroke = selectedIdxRef.current === ti ? "#f59e0b" : c.stroke;
          if (rect.getAttribute("stroke") !== stroke) rect.setAttribute("stroke", stroke);
        }
        if (txt) txt.setAttribute("transform", `rotate(${-ang})`);
        // Arrow points along the track: on horizontals the marker stays upright,
        // so it sits on the travel side (left for westbound, right for eastbound).
        // On diagonals the marker rotates so local +x = travel direction — use the
        // right-pointing shape there so it never points against the movement.
        const arrow = trainArrowRefs.current[ti];
        if (arrow) {
          arrow.setAttribute("d", horizontal && st.dir === "left" ? ARROW_LEFT : ARROW_RIGHT);
        }
        // Conflict badge: "!" on every train involved in a live conflict
        const exclam = trainExclamRefs.current[ti];
        if (exclam) {
          exclam.setAttribute("visibility", conflictIdx.has(st.idx) ? "visible" : "hidden");
          exclam.setAttribute("transform", `translate(48, -12) rotate(${-ang})`);
        }
        return occupiedSections(st, SIGNAL_SECTIONS, CELL);
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
    return SIGNALS.find((sig) => {
      if (sig.block) return false;
      // a reservation locks its points even after the train passed the signal
      // (the clear is consumed but the route stays reserved while the train uses
      // it) — but only the UNPASSED portion locks: once the train's front has
      // passed a junction, its points are free to re-throw
      const res = reservations[sig.id];
      if (!res) return false;
      const ahead = unpassedOf(sig.id, res);
      return ahead ? ahead.some(([x, y]) => x === sw.x && y === sw.y) : false;
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
  const toggleSignal = (id: string) => {
    if (signalOn[id]) {
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
    const prospective = walkRoute(sig, switches);
    if (prospective.blocked) {
      setConflictNote(`${codeOf(sig.id)} tidak bisa dibuka — wesel belum diatur (${prospective.note}).`);
      window.setTimeout(() => setConflictNote(null), 3000);
      logClick(`${codeOf(sig.id)} × tidak bisa dibuka (${prospective.note})`);
      return; // stay red
    }
    // A route cannot be set into track a train PHYSICALLY occupies — a wrong-way
    // or opposing move into the occupied section would meet it head-on. The
    // train approaching/stopped at THIS signal (on its line, behind it, moving
    // in its direction) is the route's user — it is not an obstacle.
    const routeOccupied = trainStatesRef.current.some((m) => {
      if (!m.spawned || m.done) return false;
      const approaching =
        m.y === sig.lineY && m.dir === sig.dir && (sig.dir === "right" ? m.x < sig.x : m.x > sig.x);
      if (approaching) return false;
      // body on the route's track
      if (distToPoly(m.x, m.y, prospective.pts) < CELL) return true;
      // a train on a bidirectional loop can enter the main/top line through the
      // loop's rejoin point — if that point (in its travel direction) lies on
      // this route, the train is in the route's way
      if (Math.abs(m.y - 148) < 1 || Math.abs(m.y - 264) < 1) {
        const upper = Math.abs(m.y - 148) < 1;
        const rejoinX = m.dir === "right" ? (upper ? 786 : 788) : 500;
        const rejoinY = upper ? 89 : 205;
        return distToPoly(rejoinX, rejoinY, prospective.pts) < CELL;
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
      let otherRoute: [number, number][] | null | undefined;
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
      [id]: { pts: prospective.pts, nextSignalId: prospective.nextSignalId, lineY: sig.lineY },
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
  const routeOf = (id: string) => walkRoute(SIGNALS.find((s) => s.id === id)!, switches);

  /**
   * Wrong-direction operation: x-intervals on a main line that a cleared route
   * currently reserves against the normal traffic direction.
   */
  const wrongWaySpans = (y: number, normalDir: Dir): [number, number][] => {
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
  const trainOccupies = (lineY: number, x1: number, x2: number, skip: number[] = []): boolean =>
    // body-based: a section is occupied while ANY part of the train overlaps it —
    // it clears only after the rear leaves. A train stopped AT a signal (front
    // touching the section edge) does not occupy the section beyond it. The
    // callers can exclude specific trains (a train must never stop at a signal
    // it reddens by its own presence).
    trainStatesRef.current.some((m) => {
      if (!m.spawned || m.done || m.y !== lineY || skip.includes(m.idx)) return false;
      return m.x - CELL < x2 && m.x + CELL > x1;
    });

  const aspectOf = (id: string, visited: Set<string> = new Set(), selfIdx?: number): Aspect => {
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
    // Occupancy: a train in the protected section (the static block between this
    // signal and the next same-direction signal on the line) holds it at red —
    // overriding a player clear and driving the block cascade behind the train.
    // The static section is used (not the route-derived next) so a diverted route
    // can't turn the section infinite.
    const section = SIGNAL_SECTIONS.find((s) => s.sig === id);
    if (section) {
      // The engine (selfIdx set) skips only the calling train — its own presence
      // must not stop it. The display (no selfIdx) skips the signal's OWN
      // direction trains (the ones it is cleared for / would proceed), so a loop
      // exit signal shows its clear while its train is still in the loop — the
      // opposing-direction signal still reads red from any train on the loop.
      // Block signals keep the full reddening (the cascade behind a train).
      const skip =
        selfIdx !== undefined
          ? [selfIdx]
          : !sig.block
          ? trainStatesRef.current.filter((m) => m.spawned && !m.done && m.dir === sig.dir).map((m) => m.idx)
          : [];
      if (trainOccupies(sig.lineY, section.lo, section.hi, skip)) {
        return "red";
      }
    }
    if (sig.block) {
      // automatic block signal: always active — amber when the next signal is RED,
      // green otherwise (amber or green next). Only the signal right before a red
      // shows amber; the ones behind it stay green.
      return nextId ? (aspectOf(nextId, visited, selfIdx) === "red" ? "amber" : "green") : "green";
    }
    if (!signalOn[id]) return "red";
    const route = routeOf(id);
    if (route.blocked) return "red"; // points not set for the route
    // green unless the next signal is red (1-2 blocks clear); amber if the next is red
    return nextId ? (aspectOf(nextId, visited, selfIdx) === "red" ? "amber" : "green") : "green";
  };
  aspectOfRef.current = (id: string, selfIdx?: number) => aspectOf(id, undefined, selfIdx); // keep the tick loop's aspect lookup current

  // ---- timetable awareness: per-train info for the card + roster (Indonesian) ----
  const stationName = (code: string) =>
    ({ BKST: "Bekasi Timur", TB: "Tambun", CIT: "Cibitung" } as Record<string, string>)[code] ?? code;
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
    const stops = train.stops.map((s, i) => ({
      name: stationName(s.trackmark),
      arrLabel: s.arr_actual,
      depLabel: s.dep_actual,
      actual: st.actualArr[i],
      meets: s.meets,
    }));
    const dest = stationName(train.stops[train.stops.length - 1].trackmark);
    const dirLabel = plan.start.dir === "right" ? `ke timur · menuju ${dest}` : `ke barat · menuju ${dest}`;
    const leg = plan.legs[Math.min(st.leg, plan.legs.length - 1)];
    // slip at the most recent reached stop
    let slip = 0;
    let lastReached = -1;
    let atStopIdx: number | null = null;
    for (let i = st.actualArr.length - 1; i >= 0; i--) {
      if (st.actualArr[i] != null) {
        slip = st.actualArr[i]! - train.stops[i].arr;
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
      else status = "Berhenti";
      // held past its scheduled departure at a station → late; otherwise the slip
      if (st.leg > 0 && leg.departAt !== undefined && st.time > leg.departAt) {
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
          ? `Berhenti di ${stationName(train.stops[st.leg - 1].trackmark)} · susul ${partners}`
          : `Berhenti di ${stationName(train.stops[st.leg - 1].trackmark)}`;
        delay = "tepat waktu";
        delaySec = 0;
      }
    } else {
      status = "Berjalan";
      const nextName = stationName(train.stops[Math.min(st.leg, train.stops.length - 1)].trackmark);
      delay =
        !reached || slip === 0
          ? "tepat waktu"
          : slip < 0
          ? `awal ${fmtDur(slip)} · menunggu jadwal di ${nextName}`
          : `terlambat ${fmtDur(slip)}`;
    }
    return { no: train.train_no, name: train.name, dirLabel, stops, status, delay, delaySec, atStopIdx, dest };
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
      <div className="fixed top-4 right-4 z-50">
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
              className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
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
        viewBox={`${-26} ${-22} ${RIGHT + 52} 401`}
        className="w-full h-auto"
        role="img"
        aria-label="Meja pengatur perjalanan kereta: dua jalur utama dengan persilangan, lintas simpang, dan sinyal"
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
            const ahead = unpassedOf(id, res);
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
        {STATIONS.map((st) => {
          const code =
            st.name === "Bekasi Timur" ? "BKST" : st.name === "Tambun" ? "TB" : st.name === "Cibitung" ? "CIT" : st.name;
          return (
            <g
              key={st.name}
              onClick={() => openStation(code)}
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
                stroke={selectedStation === code ? "#f59e0b" : "#334155"}
                strokeWidth={selectedStation === code ? 3 : 2.5}
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

        {/* Signals — 3-aspect (green top, yellow middle, red bottom, railway order).
            AI-controlled entry signals are hidden from view (logic-only). */}
        {SIGNALS.map((sig) => {
          if (sig.ai) return null; // invisible — AI-controlled, not player-facing
          const aspect = aspectOf(sig.id);
          const passive = sig.block === true; // ai signals never render here
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

        {/* Trains — block markers on the track with their train number and a
            direction arrow on the side they travel toward. The tick loop moves
            them via direct transform updates for smooth motion. */}
        {JOURNEYS.map(({ train, plan }, ti) => {
          const right = plan.start.dir === "right";
          return (
            <g
              key={train.train_no}
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
                x={-58}
                y={-11}
                width={116}
                height={22}
                rx={5}
                fill="#bfdbfe"
                stroke="#2563eb"
                strokeWidth={1.5}
              />
              {/* direction arrow — rotates with the box on diagonals so it always
                  points along the track in the travel direction (updated per segment) */}
              <path
                ref={(el) => {
                  trainArrowRefs.current[ti] = el;
                }}
                d={right ? ARROW_RIGHT : ARROW_LEFT}
                stroke="#1e3a8a"
                strokeWidth={2}
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
                transform="translate(48, -12)"
                visibility="hidden"
                pointerEvents="none"
              >
                <circle r={8} fill="#dc2626" stroke="#ffffff" strokeWidth={1.5} />
                <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={900} fill="#ffffff">
                  !
                </text>
              </g>
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
          );
        })}
        </g>
      </svg>

      {/* Control buttons (hidden by default — show them in Settings) */}
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
                        {s.actual != null ? fmtTime(s.actual) : "—"}
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

        {/* Notification board — live queue of trains held at a signal >30 s */}
        {notices.length > 0 && (
          <div
            data-board="notifications"
            className="fixed left-1/2 top-4 z-50 w-80 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
              <p className="text-sm font-semibold text-slate-700">Notifikasi</p>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {notices.filter((x) => !x.resolved).length}
                </span>
                <button
                  type="button"
                  onClick={() => setNotices([])}
                  aria-label="Bersihkan notifikasi"
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-56 overflow-auto">
              {notices.map((n) => {
                const dur = n.resolved ? (n.resolvedDuration ?? 0) : Math.max(0, Math.round(simRef.current - n.since));
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-2 border-b border-slate-50 px-4 py-2 ${n.resolved ? "opacity-50" : ""}`}
                  >
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        n.resolved ? "bg-green-500" : "animate-pulse bg-red-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${n.resolved ? "text-slate-500 line-through" : "text-slate-800"}`}>
                        {n.trainNo}
                      </p>
                      <p className="text-xs text-slate-600">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">{fmtDur(dur)}</span>
                  </div>
                );
              })}
            </div>
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
