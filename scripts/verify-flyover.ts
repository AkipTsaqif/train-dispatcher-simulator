// Phase 6 verifier — the flyover (graded junction) fixture.
//
// Proves:
//   1. crossing edges at DIFFERENT grade levels neither connect nor conflict:
//      a train on the level-1 ramp does not conflict with a train on the line
//      it passes over (and the same geometry at level 0 WOULD conflict — the
//      level is what suppresses it);
//   2. occupancy is level-aware: a train on the ramp occupies the ramp's own
//      section but NOT the section of the line it crosses;
//   3. a route can be set through the ramp (Phase 4 search traverses the
//      level-1 connector as a multi-edge path);
//   4. route clash suppression: the ramp route and the under-line route do not
//      clash at different levels (and do at the same level);
//   5. the engine's footprint carries the ramp's grade level.
//
// Run: bun scripts/verify-flyover.ts

import { FLYOVER_FIXTURE_DISPATCH } from "../app/dispatching/flyover-fixture";
import { findRoute, type RouteSearchSignal } from "../app/lib/route-search";
import {
  bodiesOverlap,
  occupiedSections,
  footprintOf,
  type TrainState,
} from "../app/lib/train-engine";
import { routesOverlap, type LeveledPoint } from "../app/lib/geometry";
import { segsOverlap } from "../app/lib/geometry";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const runtime = FLYOVER_FIXTURE_DISPATCH;
const map = runtime.map;
const graph = map.compatibility.movement.nodes;
const signals: RouteSearchSignal[] = map.signals.items.map((s) => ({
  id: s.id,
  edge: s.edge,
  dir: s.dir,
  x: s.x,
  y: s.y,
}));
const HALF = 50;
// the exact ramp line s1(1000,89) → s2(600,205): y = 89 + (116/400)*(1000-x)
const rampY = (x: number) => 89 + (116 / 400) * (1000 - x);
const sections = runtime.signalSections.map((s) => ({
  ...s,
  pts: map.sectionPaths[s.sig] as LeveledPoint[] | undefined,
}));

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
    idx: -1,
  } as TrainState);

// ---------------------------------------------------------------------------
// setup sanity
// ---------------------------------------------------------------------------
{
  check("the ramp segment carries grade level 1", map.segmentLevels["s1|s2"] === 1 && map.segmentLevels["s2|s1"] === 1, JSON.stringify(map.segmentLevels["s1|s2"]));
  const r1Pts = map.sectionPaths["R1"];
  check(
    "the ramp's section polyline is stamped level 1 and spans the crossing",
    !!r1Pts && r1Pts[0][2] === 1 && r1Pts[1][2] === 1 && r1Pts.some((p) => p[0] < 810) && r1Pts.some((p) => p[0] > 810),
    JSON.stringify(r1Pts?.map((p) => p.map((v) => Math.round((v ?? 0) * 10) / 10)))
  );
}

// ---------------------------------------------------------------------------
// 1. pass-under-no-conflict: a train ON the ramp vs a train on line M beneath.
// The ramp crosses line M at (800,147) — the same geometry at level 0 is a
// diamond crossing and MUST conflict.
// ---------------------------------------------------------------------------
{
  const rampTrain = train(820, rampY(820), [1000, 89], [600, 205], [[1000, 89], [1100, 89]], 1);
  const underTrain = train(800, 147, [100, 147], [1600, 147], [[100, 147]], 0);
  check(
    "a train on the ramp does NOT conflict with a train passing under it (different levels)",
    !bodiesOverlap(rampTrain, underTrain, HALF),
    "ramp/under bodies conflicted despite different grade levels"
  );
  // control: the same crossing at the SAME level is a flat diamond — conflict
  const flatRampTrain = { ...rampTrain, level: 0, trail: rampTrain.trail.map((t) => ({ ...t, level: 0 })) };
  check(
    "…but the same geometry at the same level (a flat diamond crossing) DOES conflict",
    bodiesOverlap(flatRampTrain, underTrain, HALF),
    "flat crossing did not conflict"
  );
  // two trains on the same ramp still conflict (same level, same track)
  const rampTrain2 = train(790, rampY(790), [1000, 89], [600, 205], [[1000, 89], [1100, 89]], 1);
  check("two trains on the same ramp conflict", bodiesOverlap(rampTrain, rampTrain2, HALF));
}

// ---------------------------------------------------------------------------
// 2. occupancy isolation: a train on the ramp occupies the RAMP section (R1)
// but NOT the section of the line it crosses (M1).
// ---------------------------------------------------------------------------
{
  const rampTrain = train(820, rampY(820), [1000, 89], [600, 205], [[1000, 89], [1100, 89]], 1);
  const occupied = occupiedSections(rampTrain, sections, HALF);
  const ids = occupied.split(",").filter(Boolean);
  check(
    "a train on the ramp occupies the ramp's own section (R1)",
    ids.includes("R1"),
    `occupied="${occupied}"`
  );
  check(
    "…and does NOT occupy the section of the line it crosses (M1)",
    !ids.includes("M1"),
    `occupied="${occupied}"`
  );
}

// ---------------------------------------------------------------------------
// 3. a route can be set through the ramp: A1 → s1 → ramp → s2 → line B → B2.
// ---------------------------------------------------------------------------
{
  const a1 = signals.find((s) => s.id === "A1")!;
  const viaRamp = findRoute({
    entranceId: "A1",
    entrance: a1,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  // the ranking picks the 0-move straight by default…
  check("A1 default route stays on line A (0 moves)", viaRamp?.exitSignalId === "A2" && Object.keys(viaRamp.requiredSwitches).length === 0, viaRamp?.exitSignalId);
  // …but with the ramp points thrown the search finds the level-1 connector path
  const rampRoute = findRoute({
    entranceId: "A1",
    entrance: a1,
    signals,
    graph,
    switches: { ...map.switches.initialState, 1: "reversed", 2: "reversed" },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  check(
    "with the ramp points set, A1 routes THROUGH the ramp to B2",
    rampRoute?.exitSignalId === "B2",
    rampRoute?.exitSignalId ?? "no route"
  );
  check(
    "the ramp route's polyline carries the level-1 segment",
    !!rampRoute && rampRoute.pts.some((p) => p[2] === 1),
    JSON.stringify(rampRoute?.pts.map((p) => p[2]))
  );
}

// ---------------------------------------------------------------------------
// 4. route clash suppression: the ramp route crosses the line-M route on the
// map; at different levels they do NOT clash, at the same level they do.
// ---------------------------------------------------------------------------
{
  const a1 = signals.find((s) => s.id === "A1")!;
  const rampRoute = findRoute({
    entranceId: "A1",
    entrance: a1,
    signals,
    graph,
    switches: { ...map.switches.initialState, 1: "reversed", 2: "reversed" },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  })!;
  const m1Route = findRoute({
    entranceId: "M1",
    entrance: signals.find((s) => s.id === "M1")!,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  })!;
  check(
    "the ramp route and the under-line route do NOT clash (different levels)",
    !routesOverlap(rampRoute.pts, m1Route.pts),
    "level-1 route clashed with the level-0 route"
  );
  const flatRampPts = rampRoute.pts.map((p) => [p[0], p[1], 0] as LeveledPoint);
  check(
    "…but the same route at the same level WOULD clash (flat diamond)",
    routesOverlap(flatRampPts, m1Route.pts),
    "flat route did not clash"
  );
}

// ---------------------------------------------------------------------------
// 5. the engine's footprint carries the ramp's grade level.
// ---------------------------------------------------------------------------
{
  const rampTrain = train(820, rampY(820), [1000, 89], [600, 205], [[1000, 89], [1100, 89]], 1);
  const footprint = footprintOf(rampTrain, HALF);
  check(
    "every footprint piece of the ramp train is stamped level 1",
    footprint.length > 0 && footprint.every((piece) => piece.every((p) => p[2] === 1)),
    JSON.stringify(footprint)
  );
}

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
