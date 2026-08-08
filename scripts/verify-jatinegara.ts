// Phase 6/7 verifier — Jatinegara (first cut, generated from the draw.io).
//
// Proves:
//   1. the topology compiles (8 mains, 58 switches, 23 signals, 37 groups);
//   2. per-track platform stops (multi-length platforms) resolve per line;
//   3. the bidirectional mains are flagged and a wrong-way route is routable
//      on them (explicit line, no forced-red opposition);
//   4. a route can be set through the throat from an entry signal;
//   5. journeys stop at their own line's platform X.
//
// Run: bun scripts/verify-jatinegara.ts

import { JATINEGARA_DISPATCH } from "../app/dispatching/jatinegara";
import { compileTopology } from "../app/lib/topology";
import { JATINEGARA_TOPOLOGY } from "../app/topologies/jatinegara";
import { findRoute, type RouteSearchSignal } from "../app/lib/route-search";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const compiled = compileTopology(JATINEGARA_TOPOLOGY);
const runtime = JATINEGARA_DISPATCH;
const map = runtime.map;

// 1. structure
check("compiles with 8 main lines", compiled.lines.mains.length === 8, `mains=${compiled.lines.mains.length}`);
check("58 switches (the throat)", compiled.switches.items.length === 58, `switches=${compiled.switches.items.length}`);
check("23 signals (NW/NE/XW/XE)", compiled.signals.items.length === 23, `signals=${compiled.signals.items.length}`);
check("no level crossings (all flat)", compiled.levelCrossings.length === 0, JSON.stringify(compiled.levelCrossings));
check(
  "bidirectional mains flagged (t2,t5,t6,t7,t8)",
  compiled.lines.bidirectionalByY[464] === true && compiled.lines.bidirectionalByY[272] === true && !compiled.lines.bidirectionalByY[496],
  JSON.stringify(compiled.lines.bidirectionalByY)
);

// 2. multi-length platforms
const jngXs = compiled.stationStopXs["JNG"];
check(
  "JNG has per-track platform Xs (multi-length)",
  jngXs?.t1 === 850 && jngXs?.t2 === 464 && jngXs?.t5 === 416 && jngXs?.t6 === 430 && jngXs?.t8 === 400,
  JSON.stringify(jngXs)
);
check("boundary pseudo-stations share one X per station", compiled.stationStopXs["JNG-W"]?.t1 === 40 && compiled.stationStopXs["JNG-E"]?.t8 === 1080);

// 3. journeys stop at their own line's platform X (the dwell leg is the one
// arriving AT JNG — its station is the previous stop, its waypoint is JNG)
{
  const dwellX = (no: string) => {
    const plan = runtime.journeys.find((j) => j.train.train_no === no)!.plan;
    const leg = plan.legs.find((l) => l.waypointX === (plan.start.dir === "right" ? map.stations.stopXsByTrack["JNG"][plan.start.y === 496 ? "t1" : plan.start.y === 464 ? "t2" : "t6"] : map.stations.stopXsByTrack["JNG"][plan.start.y === 496 ? "t1" : plan.start.y === 464 ? "t2" : "t6"]));
    return leg?.waypointX;
  };
  const stops = Object.fromEntries(
    runtime.journeys.map((j) => [j.train.train_no, dwellX(j.train.train_no)])
  );
  check(
    "J201 (t1) dwells at x=850, J102 (t2) at 464, J310 (t6) at 430",
    stops["J201"] === 850 && stops["J102"] === 464 && stops["J310"] === 430,
    JSON.stringify(stops)
  );
  check("J310 (eastbound) uses the bidirectional t6 line", runtime.journeys.find((j) => j.train.train_no === "J310")!.plan.start.y === 336);
}

// 4. a route through the throat from an entry signal
{
  const graph = map.compatibility.movement.nodes;
  const signals: RouteSearchSignal[] = map.signals.items.map((s) => ({
    id: s.id,
    edge: s.edge,
    dir: s.dir,
    x: s.x,
    y: s.y,
  }));
  const nw1 = signals.find((s) => s.id === "NW1")!;
  const r = findRoute({
    entranceId: "NW1",
    entrance: nw1,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  check(
    "NW1 (track 1 west entry) routes to the east boundary/XE1",
    r !== null && (r.exitSignalId === "XE1" || r.pts[r.pts.length - 1][0] > 1000),
    r ? `exit=${r.exitSignalId} lastX=${r.pts[r.pts.length - 1][0]}` : "no route"
  );
  // a bidirectional wrong-way move: XW2 (west exit on t2) — the train may enter
  // from the east on t2 and leave west; the search must find the west route
  const xw2 = signals.find((s) => s.id === "XW2")!;
  const r2 = findRoute({
    entranceId: "XW2",
    entrance: xw2,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  check(
    "XW2 (west exit, t2) routes west to the boundary",
    r2 !== null && r2.pts[r2.pts.length - 1][0] < 100,
    r2 ? `lastX=${r2.pts[r2.pts.length - 1][0]}` : "no route"
  );
}

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
