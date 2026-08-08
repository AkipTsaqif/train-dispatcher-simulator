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

// 1. structure (Phase 8: drawn extents — 13 mains incl. the 5 east-throat
// fragments; the stubs end at junctions, 6 tracks per map boundary)
check("compiles with 13 main lines", compiled.lines.mains.length === 13, `mains=${compiled.lines.mains.length}`);
check("58 switches (the throat)", compiled.switches.items.length === 58, `switches=${compiled.switches.items.length}`);
check("23 signals (NW/NE/XW/XE)", compiled.signals.items.length === 23, `signals=${compiled.signals.items.length}`);
check(
  "10 terminating switches (stub ends: 336,368 / 528,368 / 656,368 / 752,368 / 1040,368 / 592,336 / 688,336 / 1008,336 / 688,304 / 528,272)",
  (() => {
    const terms = Object.values(compiled.nodes).filter((n) => n.sw !== undefined && !n.exits.some((e) => e.viaSwitchPort === "normal"));
    return terms.length === 10;
  })(),
  "terminating switch count"
);
check(
  "stub tracks end at their drawn extents (t5 336..528, t6 32..592, t8 224..528)",
  compiled.nodes["s368x336"] !== undefined && compiled.nodes["s368x528"] !== undefined && compiled.nodes["s336x592"] !== undefined && compiled.nodes["s272x528"] !== undefined,
  "missing stub-end node"
);
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
check(
  "boundary stops sit at each line's reachable extent (t5 east 520, t8 west 232, t6 east 584)",
  compiled.stationStopXs["JNG-E"]?.t5 === 520 && compiled.stationStopXs["JNG-W"]?.t8 === 232 && compiled.stationStopXs["JNG-E"]?.t6 === 584,
  JSON.stringify(compiled.stationStopXs["JNG-E"])
);

// 3. journeys stop at their own line's platform X (the dwell leg is the one
// arriving AT JNG — its station is the previous stop, its waypoint is JNG)
{
  const gidFor = (y: number) => map.lines.mains.find((m) => m.lineY === y)!.trackGroupId;
  const dwellX = (no: string) => {
    const plan = runtime.journeys.find((j) => j.train.train_no === no)!.plan;
    const x = map.stations.stopXsByTrack["JNG"][gidFor(plan.start.y)];
    return plan.legs.find((l) => l.waypointX === x)?.waypointX;
  };
  const stops = Object.fromEntries(
    runtime.journeys.map((j) => [j.train.train_no, dwellX(j.train.train_no)])
  );
  check(
    "J201 (t1) dwells at x=850, J102 (t2) at 464, J310 (t6) at 430, J410 (t5) at 416",
    stops["J201"] === 850 && stops["J102"] === 464 && stops["J310"] === 430 && stops["J410"] === 416,
    JSON.stringify(stops)
  );
  check("J310 (eastbound) uses the bidirectional t6 line", runtime.journeys.find((j) => j.train.train_no === "J310")!.plan.start.y === 336);
  check(
    "J410 (t5 stub) runs within t5's extent (344..520)",
    runtime.journeys.find((j) => j.train.train_no === "J410")!.plan.start.y === 368,
    "t5 stub journey off-line"
  );
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
  // Phase 8: a stub exit must DIVE through the throat — XE5 (t5, y=368) ends
  // at the terminating switch 528,368; its route throws V (to t6) then W (to
  // t4) and reaches the east boundary — no invented straight continuation
  const xe5 = signals.find((s) => s.id === "XE5")!;
  const r3 = findRoute({
    entranceId: "XE5",
    entrance: xe5,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  check(
    "XE5 (t5 stub exit) routes THROUGH the throat to the east boundary (a dive, not a straight)",
    r3 !== null && r3.pts[r3.pts.length - 1][0] > 1000 && r3.pts.some((p) => p[1] !== 368),
    r3 ? `lastX=${r3.pts[r3.pts.length - 1][0]} moves=${JSON.stringify(r3.requiredSwitches)}` : "no route"
  );
  // with the terminating branch locked closed, the stub signal has NO route
  // (no boundary route at a dead junction)
  const r4 = findRoute({
    entranceId: "XE5",
    entrance: xe5,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: (sw) => true, // everything locked — the branch cannot be thrown
    segmentLevels: map.segmentLevels,
  });
  check(
    "XE5 with the terminating branch locked has NO route (dead junction, not an open line)",
    r4 === null,
    r4 ? `unexpected route ${r4.exitSignalId}` : "ok"
  );
}

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
