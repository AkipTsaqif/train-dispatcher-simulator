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
import { findRoute, flankPoints, closedSpanOnRoute, type ClosedSpan, type RouteSearchSignal } from "../app/lib/route-search";

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
check("56 switches (10 stub ends are fixed turns; P58/P63/P65/P67 are inverted points)", compiled.switches.items.length === 56, `switches=${compiled.switches.items.length}`);
check("24 signals (NW/NE/XW/XE)", compiled.signals.items.length === 24, `signals=${compiled.signals.items.length}`);
check(
  "24 coupled point pairs (PC1..PC24) + 8 singles",
  (() => {
    const coupled = compiled.switches.controls.filter((c) => c.coupled);
    const singles = compiled.switches.controls.filter((c) => !c.coupled);
    const labelSet = new Set(coupled.map((c) => c.label));
    return (
      // PC21 draws a handle per switch, so count LEVERS (distinct labels), not handles
      labelSet.size === 24 &&
      singles.length === 8 &&
      [...labelSet].every((l) => /^PC\d+$/.test(l))
    );
  })(),
  `coupled=${compiled.switches.controls.filter((c) => c.coupled).length} singles=${compiled.switches.controls.filter((c) => !c.coupled).length}`
);
check(
  "the translated stub ends stay plain joins (no switch at Z8 / AC6 / Z2 / BF4)",
  compiled.nodes["s368x400"]?.sw === undefined && compiled.nodes["s336x448"]?.sw === undefined && compiled.nodes["s272x400"]?.sw === undefined && compiled.nodes["s304x496"]?.sw === undefined,
  "stub-end node still has a switch"
);
check(
  "stub tracks end at their translated drawn extents (t5 288..400, t6 B6..AC6, t8 B2..Z2)",
  compiled.nodes["s368x288"] !== undefined && compiled.nodes["s368x400"] !== undefined && compiled.nodes["s336x448"] !== undefined && compiled.nodes["s272x400"] !== undefined,
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
  "JNG has per-track platform Xs — all aligned to the drawn islands at 360",
  jngXs?.t1 === 360 && jngXs?.t2 === 360 && jngXs?.t5 === 360 && jngXs?.t6 === 360 && jngXs?.t8 === 360,
  JSON.stringify(jngXs)
);
check(
  "boundary stops translate with their reachable extent (t5 east 368, t8 west M2, t6 east 392, t1 west 72)",
  compiled.stationStopXs["JNG-E"]?.t5 === 368 && compiled.stationStopXs["JNG-W"]?.t8 === 216 && compiled.stationStopXs["JNG-E"]?.t6 === 392 && compiled.stationStopXs["JNG-W"]?.t1 === 72,
  JSON.stringify({ W: compiled.stationStopXs["JNG-W"], E: compiled.stationStopXs["JNG-E"] })
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
    "J201/J102/J310/J410 all dwell at the drawn island X=360",
    stops["J201"] === 360 && stops["J102"] === 360 && stops["J310"] === 360 && stops["J410"] === 360,
    JSON.stringify(stops)
  );
  check("J310 (eastbound) uses the bidirectional t6 line", runtime.journeys.find((j) => j.train.train_no === "J310")!.plan.start.y === 336);
  {
    const j410 = runtime.journeys.find((j) => j.train.train_no === "J410")!;
    check(
      "J410 enters on t6 from the west border (entryLine), crosses to t5 for its platform stops",
      j410.plan.start.y === 336 &&
        j410.plan.start.x <= 32 &&
        j410.plan.legs[0].waypointX === 296 && // JNG-W stop stays on t5
        j410.plan.legs[1].waypointX === 360, // JNG island on t5
      `start=(${j410.plan.start.x},${j410.plan.start.y}) waypoints=${j410.plan.legs.map((l) => l.waypointX).join("/")}`
    );
  }
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
  // at the terminating switch Z8; its route throws V (to t6) then W (to
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
    r3 !== null && r3.pts[r3.pts.length - 1][0] > 800 && r3.pts.some((p) => p[1] !== 368),
    r3 ? `lastX=${r3.pts[r3.pts.length - 1][0]} moves=${JSON.stringify(r3.requiredSwitches)}` : "no route"
  );
  check(
    "the XE5 dive needs only the real switches (P44 at AB6 + P29 at AD10 — the stub ends are fixed turns)",
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
    r4 === null || r4.pts[r4.pts.length - 1][0] < 800,
    r4 ? `lastX=${r4.pts[r4.pts.length - 1][0]}` : "no route"
  );

  // A thrown PC13 turns NE2 onto the XW4 route. PC22's branch reaches AH10,
  // adjacent to that route at AG10–AF10, but it does not foul it. JNG's
  // layout-specific clearance must keep PC22 free; the old global CELL/3
  // value incorrectly included both coupled ends as flanks.
  const ne2 = signals.find((s) => s.id === "NE2")!;
  const ne2Switches = { ...map.switches.initialState, 19: "reversed" as const, 30: "reversed" as const, 11: "reversed" as const, 20: "reversed" as const };
  const ne2Route = findRoute({
    entranceId: "NE2",
    entrance: ne2,
    signals,
    graph,
    switches: ne2Switches,
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  const oldFlanks = ne2Route ? flankPoints(ne2Route, graph, map.grid.cellSize / 3) : [];
  const jngFlanks = ne2Route ? flankPoints(ne2Route, graph, map.interlocking?.flankClearance ?? map.grid.cellSize / 3) : [];
  check(
    "NE2→XW4 excludes adjacent PC22 from its JNG flank clearance",
    ne2Route?.exitSignalId === "XW4" && oldFlanks.includes(31) && oldFlanks.includes(50) && !jngFlanks.includes(31) && !jngFlanks.includes(50),
    `exit=${ne2Route?.exitSignalId} old=${oldFlanks.join(",")} jng=${jngFlanks.join(",")}`
  );
  // NE4's candidate route passes through PC22 at AH10. The tighter JNG
  // clearance must not turn that neighbouring geometry into a PC22 flank of
  // either route; normal route/point locking still decides whether NE4 can be
  // cleared while NE2 remains reserved.
  const ne4 = signals.find((s) => s.id === "NE4")!;
  const ne4Route = findRoute({
    entranceId: "NE4",
    entrance: ne4,
    signals,
    graph,
    switches: ne2Switches,
    isLocked: () => false,
    segmentLevels: map.segmentLevels,
  });
  const ne4Flanks = ne4Route ? flankPoints(ne4Route, graph, map.interlocking?.flankClearance ?? map.grid.cellSize / 3) : [];
  // Manual point setting (interlocking.routeSetting). "Inactive track" is NOT
  // authored anywhere: a route is simply unformed while the points as they
  // stand do not lead to it. NE5→XW4 needs P36 reversed, so with every point
  // normal the signal must be refused; with P36 thrown the same route needs no
  // moves and clears. If this ever reports requiredSwitches={} on the first
  // call, the refusal has silently stopped happening.
  check(
    "JNG uses manual route setting",
    map.interlocking?.routeSetting === "manual",
    `routeSetting=${map.interlocking?.routeSetting}`
  );
  {
    const ne5 = signals.find((s) => s.id === "NE5")!;
    const routeWith = (switches: Record<number, "normal" | "reversed">) =>
      findRoute({
        entranceId: "NE5",
        entrance: ne5,
        signals,
        graph,
        switches,
        isLocked: () => false,
        segmentLevels: map.segmentLevels,
      });
    const unset = routeWith({ ...map.switches.initialState });
    const set = routeWith({ ...map.switches.initialState, 36: "reversed" });
    check(
      "NE5 needs P36 thrown first (refused in manual mode), then forms with no moves",
      unset?.requiredSwitches[36] === "reversed" &&
        set !== null &&
        Object.keys(set.requiredSwitches).length === 0 &&
        set.exitSignalId === unset?.exitSignalId,
      `unset=${JSON.stringify(unset?.requiredSwitches)} set=${JSON.stringify(set?.requiredSwitches)}`
    );
  }

  // No route may double back on itself. A signal clears for ONE direction of
  // travel, so every along-line step must make forward progress; a crossover
  // diagonal may move laterally but never backwards. This caught a real bug:
  // "dot > -0.8" accepted a backward 45-degree diagonal (-0.707), letting XE1
  // clear eastbound over PC17 set against it, and NE4 reach XW3 by running
  // east while signalled west.
  {
    const offenders: string[] = [];
    const trials: Record<number, "normal" | "reversed">[] = [
      {},
      { 12: "reversed", 4: "reversed" },
      { 10: "reversed", 18: "reversed" },
      { 19: "reversed", 30: "reversed", 11: "reversed", 20: "reversed" },
    ];
    for (const entrance of signals) {
      for (const over of trials) {
        const route = findRoute({
          entranceId: entrance.id,
          entrance,
          signals,
          graph,
          switches: { ...map.switches.initialState, ...over },
          isLocked: () => false,
          segmentLevels: map.segmentLevels,
        });
        if (!route) continue;
        const forward = entrance.dir === "right" ? 1 : -1;
        for (let i = 1; i < route.pts.length; i++) {
          const step = (route.pts[i][0] - route.pts[i - 1][0]) * forward;
          if (step < -1e-9) {
            offenders.push(
              `${entrance.id}(${entrance.dir}) ${route.pts[i - 1][0]}->${route.pts[i][0]}`
            );
          }
        }
      }
    }
    check(
      "no route ever reverses against the direction its signal was cleared for",
      offenders.length === 0,
      `${offenders.length}: ${offenders.slice(0, 5).join(", ")}`
    );
  }

  // Out-of-service track (map.outOfService). t4 and t3 are unbuilt west of H,
  // so XW4 with every point normal runs into closed track and must be refused.
  // The user's escapes are PC7 (to t6) or PC3+PC2 (to t2) — PC3 alone only
  // reaches t3, which is closed as well. This is authored real-world data:
  // no switch arrangement could imply it.
  {
    const spans: ClosedSpan[] = (map.outOfService ?? []).map((span) => {
      const main = map.lines.mains.find((m) => m.trackGroupId === span.groupId)!;
      return {
        groupId: span.groupId,
        lineY: main.lineY,
        fromX: Math.min(span.fromX, span.toX),
        toX: Math.max(span.fromX, span.toX),
      };
    });
    check(
      "t4 and t3 are authored out of service west of H",
      spans.length === 2 && spans.every((s) => s.fromX === 32 && s.toX === 128) &&
        spans.some((s) => s.groupId === "t4") && spans.some((s) => s.groupId === "t3"),
      JSON.stringify(spans)
    );
    const xw4 = signals.find((s) => s.id === "XW4")!;
    const routeVia = (over: Record<number, "normal" | "reversed">) =>
      findRoute({
        entranceId: "XW4",
        entrance: xw4,
        signals,
        graph,
        switches: { ...map.switches.initialState, ...over },
        isLocked: () => false,
        segmentLevels: map.segmentLevels,
      });
    const blockedOn = (over: Record<number, "normal" | "reversed">) => {
      const route = routeVia(over);
      return route ? closedSpanOnRoute(route, spans)?.groupId ?? null : "no-route";
    };
    check(
      "XW4 all-normal runs into closed t4 and is refused",
      blockedOn({}) === "t4",
      `blocked=${blockedOn({})}`
    );
    check(
      "PC3 alone only reaches t3, which is closed too",
      blockedOn({ 16: "reversed", 26: "reversed" }) === "t3",
      `blocked=${blockedOn({ 16: "reversed", 26: "reversed" })}`
    );
    check(
      "PC7 gives XW4 a clear road to t6",
      blockedOn({ 42: "reversed", 27: "reversed" }) === null,
      `blocked=${blockedOn({ 42: "reversed", 27: "reversed" })}`
    );
    check(
      "PC3+PC2 gives XW4 a clear road to t2",
      blockedOn({ 16: "reversed", 26: "reversed", 7: "reversed", 15: "reversed" }) === null,
      `blocked=${blockedOn({ 16: "reversed", 26: "reversed", 7: "reversed", 15: "reversed" })}`
    );
  }

  // NE4 exits at XW4. It previously reported XW3 via a route that ran EAST
  // from AG10 to AJ12 while signalled WEST — a reversal admitted by the old
  // "dot > -0.8" bearing test, which a backward 45-degree diagonal (-0.707)
  // passed. Routes are now required to make forward progress, so that
  // candidate is gone; see the no-reversal check below.
  check(
    "NE2 and NE4 candidates do not spuriously flank-lock PC22",
    ne4Route?.exitSignalId === "XW4" &&
      ne4Route.pts.some(([x, y]) => x === 544 && y === 400) &&
      !jngFlanks.includes(31) && !jngFlanks.includes(50) &&
      !ne4Flanks.includes(31) && !ne4Flanks.includes(50),
    `NE2=${ne2Route?.exitSignalId} flanks=${jngFlanks.join(",")} NE4=${ne4Route?.exitSignalId} flanks=${ne4Flanks.join(",")}`
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
