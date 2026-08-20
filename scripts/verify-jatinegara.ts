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
import { JATINEGARA_ASSEMBLED as JATINEGARA_TOPOLOGY } from "../app/pieces/jatinegara";
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
check("compiles with 12 main lines", compiled.lines.mains.length === 12, `mains=${compiled.lines.mains.length}`);
check("51 switches (10 stub ends are fixed turns; P57/P59/P61 are inverted points)", compiled.switches.items.length === 51, `switches=${compiled.switches.items.length}`);
check("23 signals (NW/NE/XW/XE)", compiled.signals.items.length === 23, `signals=${compiled.signals.items.length}`);
check(
  "21 coupled point pairs (PC1..PC21) + 9 singles",
  (() => {
    const coupled = compiled.switches.controls.filter((c) => c.coupled);
    const singles = compiled.switches.controls.filter((c) => !c.coupled);
    const labelSet = new Set(coupled.map((c) => c.label));
    return (
      // PC21 draws a handle per switch, so count LEVERS (distinct labels), not handles
      labelSet.size === 21 &&
      singles.length === 9 &&
      [...labelSet].every((l) => /^PC\d+$/.test(l))
    );
  })(),
  `coupled=${compiled.switches.controls.filter((c) => c.coupled).length} singles=${compiled.switches.controls.filter((c) => !c.coupled).length}`
);
check(
  "the stub ends are now plain joins (no switch at 528,368 / 608,336 / 528,272 / 688,304)",
  compiled.nodes["s368x528"]?.sw === undefined && compiled.nodes["s336x608"]?.sw === undefined && compiled.nodes["s272x528"]?.sw === undefined && compiled.nodes["s304x688"]?.sw === undefined,
  "stub-end node still has a switch"
);
check(
  "stub tracks end at their drawn extents (t5 336..528, t6 32..608, t8 224..528)",
  compiled.nodes["s368x336"] !== undefined && compiled.nodes["s368x528"] !== undefined && compiled.nodes["s336x608"] !== undefined && compiled.nodes["s272x528"] !== undefined,
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
    "XE5 (t5 stub exit) routes THROUGH the throat to the east boundary (a dive via the fixed turns + P44/P29)",
    r3 !== null && r3.pts[r3.pts.length - 1][0] > 1000 && r3.pts.some((p) => p[1] !== 368),
    r3 ? `lastX=${r3.pts[r3.pts.length - 1][0]} moves=${JSON.stringify(r3.requiredSwitches)}` : "no route"
  );
  check(
    "the XE5 dive needs only the real switches (P44 at 560,336 + P29 at 656,400 — the stub ends are fixed turns)",
    r3 !== null &&
      Object.keys(r3.requiredSwitches).every((k) => ![39, 45].includes(Number(k))) &&
      r3.requiredSwitches[44] === "reversed" && r3.requiredSwitches[29] === "reversed",
    r3 ? JSON.stringify(r3.requiredSwitches) : "no route"
  );
  // with the real switches locked, the dive is impossible — the search can
  // only end at the first blocked switch (a dead junction the signal cannot
  // clear; its walkRoute stays blocked and the aspect stays red)
  const r4 = findRoute({
    entranceId: "XE5",
    entrance: xe5,
    signals,
    graph,
    switches: { ...map.switches.initialState },
    isLocked: (sw) => true, // everything locked — the branches cannot be thrown
    segmentLevels: map.segmentLevels,
  });
  check(
    "XE5 with the throat switches locked cannot clear through the dive",
    r4 === null || r4.pts[r4.pts.length - 1][0] < 1000,
    r4 ? `lastX=${r4.pts[r4.pts.length - 1][0]}` : "no route"
  );
}

// --- render/control annotations -------------------------------------------
// These are not topology, but they decide what the user can SEE and CLICK, so
// a passing topology with broken annotations still ships a broken table.
{
  // dashSide must follow the BRANCH's own geometry: it picks the side the
  // dashed inactive straight is drawn on when the point is thrown. Deriving it
  // from the line's normal direction inverted it on every switch whose branch
  // runs against the flow (24 of 48).
  const wrong = map.switches.items.filter((sw) => {
    const nums = sw.branch.match(/-?\d+(\.\d+)?/g)!.map(Number);
    const [x1, y1, x2, y2] = nums;
    const far =
      Math.hypot(x1 - sw.x, y1 - sw.y) > Math.hypot(x2 - sw.x, y2 - sw.y)
        ? [x1, y1]
        : [x2, y2];
    return (far[0] > sw.x ? "right" : "left") !== sw.dashSide;
  });
  check(
    "every switch's dashSide matches its branch geometry",
    wrong.length === 0,
    `${wrong.length} wrong: ${wrong.slice(0, 6).map((s) => `P${s.id}`).join(", ")}`
  );

  // A scissors crossover is two coupled pairs sharing a midpoint. If both
  // controls compute the same mean position they stack, and the one drawn last
  // takes every click — half the scissors becomes unthrowable.
  const controls = map.switches.controls;
  const seen = new Map<string, number>();
  for (const control of controls) {
    const key = `${Math.round(control.x)},${Math.round(control.y)}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const stacked = [...seen.entries()].filter(([, count]) => count > 1);
  check(
    "no two point controls share a position (scissors stay clickable)",
    stacked.length === 0,
    `${stacked.length} stacked at ${stacked.map(([k]) => k).join(" ")}`
  );

  // ...and they must be far enough apart that each centre is actually hittable
  // (the control halo is r=16*controlScale, so centres need > that diameter).
  const scale = map.presentation.controlScale ?? 1;
  const minGap = 2 * 8 * scale; // halo radius 8*scale each
  let tooClose = 0;
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      const d = Math.hypot(controls[i].x - controls[j].x, controls[i].y - controls[j].y);
      if (d < minGap) tooClose++;
    }
  }
  check(
    `point control centres are at least ${minGap.toFixed(1)} apart`,
    tooClose === 0,
    `${tooClose} pair(s) closer than ${minGap.toFixed(1)}`
  );

  // A signal and a point control are BOTH clickable, so the same halo rule
  // applies BETWEEN the two kinds - not just within each. A signal is drawn at
  // its cell centre and a switch sits on that same lattice, so a switch moved
  // into a signal's cell would put two hit targets on one spot and swallow the
  // signal's clicks. Geometry cannot decide which should yield: move the
  // switch back, or move the signal to a free cell.
  const edgeById = new Map(JATINEGARA_TOPOLOGY.edges.map((e) => [e.id, e] as const));
  const nodeById = new Map(JATINEGARA_TOPOLOGY.nodes.map((n) => [n.id, n] as const));
  const signalX = (s: (typeof JATINEGARA_TOPOLOGY.signals)[number]): number => {
    const edge = edgeById.get(s.edgeId)!;
    const a = edge.geometry[s.segmentIndex].point;
    const b = edge.geometry[s.segmentIndex + 1].point;
    return a[0] + (b[0] > a[0] ? s.offset : -s.offset);
  };
  const collisions: string[] = [];
  for (const signal of JATINEGARA_TOPOLOGY.signals) {
    const edge = edgeById.get(signal.edgeId)!;
    const sx = signalX(signal);
    const sy = edge.geometry[0].point[1];
    for (const sw of JATINEGARA_TOPOLOGY.switches) {
      const node = nodeById.get(sw.nodeId)!;
      const gap = Math.hypot(node.point[0] - sx, node.point[1] - sy);
      if (gap < minGap) {
        collisions.push(
          `${signal.id}(${sx},${sy}) vs P${sw.id}(${node.point[0]},${node.point[1]}) gap ${gap.toFixed(1)}`
        );
      }
    }
  }
  check(
    `no signal sits within ${minGap.toFixed(1)} of a point control (both stay clickable)`,
    collisions.length === 0,
    `${collisions.length}: ${collisions.slice(0, 4).join(" | ")}`
  );
}

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
