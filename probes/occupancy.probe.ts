// Phase 5 probe — 2-D multi-segment occupancy + train-body conflict.
//
// Proves:
//   1. a train mid-crossover straddling the diagonal AND the top line occupies
//      the top-line section its rear still covers (the "adjoining section"),
//   2. a train entering a loop occupies BOTH the top-line section (its rear)
//      and the LOOP section — whose protected polyline includes the entry
//      diagonal (genuine 2-D occupancy, not an x-interval on one line),
//   3. a long train straddling two adjacent sections reds both,
//   4. train-body conflict is genuine footprint overlap: two trains on the
//      same diagonal conflict; two trains on parallel diagonals do not; the
//      horizontal fast path still uses the interval test.
//
// Run: bun probes/occupancy.probe.ts

import { BEKASI_TAMBUN_CIBITUNG_DISPATCH } from "../app/dispatching/bekasi-tambun-cibitung";
import {
  bodiesOverlap,
  occupiedSections,
  type TrainState,
} from "../app/lib/train-engine";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const { map, signalSections } = BEKASI_TAMBUN_CIBITUNG_DISPATCH;
const CELL = map.grid.cellSize; // 58 — also the train half length
const sections = signalSections.map((s) => ({
  ...s,
  pts: map.sectionPaths[s.sig] as [number, number][] | undefined,
}));

// a minimal live train state on a given segment + trail
const train = (
  x: number,
  y: number,
  segFrom: [number, number],
  segTo: [number, number],
  trail: [number, number][],
  level = 0
): TrainState =>
  ({
    x,
    y,
    dir: "left",
    segFrom,
    segTo,
    nxtNode: null,
    incoming: null,
    trail: trail.map((pt) => ({ pt, level })),
    level,
    speed: 0,
    leg: 0,
    stopped: false,
    stopReason: null,
    stopSignalId: null,
    done: false,
    spawned: true,
    originArr: 0,
    approach: false,
    time: 0,
    frontPrev: null,
    passedSignals: [],
    actualArr: [],
    holdSince: null,
    holdNotified: false,
    notificationId: null,
    susulWarned: false,
    signalClearedAt: null,
    segLimitU: null,
    idx: -1,
  } as TrainState);

// ---------------------------------------------------------------------------
// 1. mid-crossover straddle — the right crossover p8(960,89) → p7(846,205).
// The center sits on the diagonal with its rear still on the top line.
// ---------------------------------------------------------------------------
{
  const st = train(925, 130, [960, 89], [846, 205], [[960, 89], [1020, 89]]);
  const occupied = occupiedSections(st, sections, CELL);
  check(
    "mid-crossover train occupies the top-line section its rear covers (J4)",
    occupied === "J4",
    `occupied="${occupied}"`
  );
}

// ---------------------------------------------------------------------------
// 2. loop entry — a train at the loop throat (front on the entry diagonal,
// rear on the top line) occupies BOTH the top section and the loop section.
// ---------------------------------------------------------------------------
{
  const st = train(786, 89, [786, 89], [730, 148], [[786, 89], [900, 89]]);
  const occupied = occupiedSections(st, sections, CELL)
    .split(",")
    .sort()
    .join(",");
  check(
    "loop-entry train occupies the top section AND the loop section (J4,J6)",
    occupied === "J4,J6",
    `occupied="${occupied}"`
  );
}

// ---------------------------------------------------------------------------
// 3. a long train straddling two adjacent sections reds both — the J5/J4
// boundary sits at x=558 on the top line.
// ---------------------------------------------------------------------------
{
  const st = train(560, 89, [326, 89], [960, 89], [[326, 89]]);
  const occupied = occupiedSections(st, sections, CELL)
    .split(",")
    .sort()
    .join(",");
  check(
    "a long train straddling the J5/J4 boundary reds both sections",
    occupied === "J4,J5",
    `occupied="${occupied}"`
  );
  // sanity: the same body clear of the boundary occupies exactly one section
  const st2 = train(700, 89, [326, 89], [960, 89], [[326, 89]]);
  check("a body inside one section occupies exactly it", occupiedSections(st2, sections, CELL) === "J4", `occupied="${occupiedSections(st2, sections, CELL)}"`);
}

// ---------------------------------------------------------------------------
// 4. body conflict = genuine footprint overlap.
// ---------------------------------------------------------------------------
{
  // same diagonal (the right crossover p8(960,89)→p7(846,205), slope
  // (205-89)/(846-960) = -116/114), ~15 units apart → conflict. The centers
  // must sit exactly ON the diagonal or the parallel pieces stay offset.
  const yOn = (x: number) => 89 + (116 / 114) * (960 - x);
  const a = train(905, yOn(905), [960, 89], [846, 205], [[960, 89], [1020, 89]]);
  const b = train(890, yOn(890), [960, 89], [846, 205], [[960, 89], [1020, 89]]);
  check("two trains on the same diagonal conflict", bodiesOverlap(a, b, CELL), "parallel/diagonal bodies shared no track");
  check("…and it is symmetric", bodiesOverlap(b, a, CELL));

  // parallel diagonals — the upper loop entry (786,89)→(730,148) vs the lower
  // loop entry (788,205)→(730,264) — same x-range, never meeting
  const c = train(770, 105, [786, 89], [730, 148], [[786, 89], [820, 89]]);
  const d = train(772, 221, [788, 205], [730, 264], [[788, 205], [820, 205]]);
  check(
    "trains on parallel diagonals (upper vs lower loop entry) do NOT conflict",
    !bodiesOverlap(c, d, CELL),
    "parallel diagonal bodies falsely conflicted"
  );

  // horizontal fast path — same line, interval test
  const e = train(600, 89, [326, 89], [960, 89], [[326, 89]]);
  const f = train(640, 89, [326, 89], [960, 89], [[326, 89]]);
  const g = train(740, 89, [326, 89], [960, 89], [[326, 89]]);
  check("two bodies on the same line within 2·CELL conflict", bodiesOverlap(e, f, CELL));
  check("two bodies on the same line more than 2·CELL apart do not", !bodiesOverlap(e, g, CELL));
}

console.log(failures === 0 ? "\nALL PROBES PASSED" : `\n${failures} PROBE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
