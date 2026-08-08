// Quick diagnostic — what happens when a MAIN line gets a signal facing
// AGAINST its normal direction (a step toward bidirectional mains)?
//
// Takes the flyover fixture (three leftbound mains) and adds a RIGHT-facing
// signal A1r on the top main (y=89, normal left). Checks, in order:
//   1. does the compiler accept the opposite-facing signal + its block?
//   2. what direction/section does the compiled signal get?
//   3. selectMainLine for a train running against the normal flow;
//   4. route search from the wrong-way signal;
//   5. movement against the normal direction;
//   6. the wrong-way protection trigger (what forcedRed would see).
//
// Run: bun probes/bidirectional.probe.ts

import { FLYOVER_FIXTURE_TOPOLOGY } from "../app/topologies/flyover-fixture";
import { compileTopology, type TopologyDefinition } from "../app/lib/topology";
import { findRoute, type RouteSearchSignal } from "../app/lib/route-search";
import { advanceTrain, initTrain, type MoveCtx, type TrainState } from "../app/lib/train-engine";
import { bearingDot, bearingOf, type Bearing } from "../app/lib/topology";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

// clone the flyover topology and add an opposite-facing (right) signal A1r on
// the leftbound top main, protecting the track east of x=1400 to the boundary
const topology: TopologyDefinition = JSON.parse(JSON.stringify(FLYOVER_FIXTURE_TOPOLOGY));
(topology.signals as unknown[]).push({
  id: "A1r",
  edgeId: "lineA-east",
  segmentIndex: 0,
  offset: 200, // x = 1400
  facing: "toward-from", // toward aR (east) — AGAINST the group's normal "left"
  mount: "up",
  label: "line A bidirectional",
  protectedBlockSectionId: "section-A1r",
});
(topology.blockSections as unknown[]).push({
  id: "section-A1r",
  signalId: "A1r",
  coverage: "signal-to-boundary",
  edgeRanges: [
    { edgeId: "lineA-east", from: { kind: "signal", signalId: "A1r" }, to: { kind: "edge-end", end: "from" } },
  ],
  legacyOpenEnd: "east",
});

// 1. compiler acceptance
let compiled: ReturnType<typeof compileTopology>;
try {
  compiled = compileTopology(topology);
  check("the compiler ACCEPTS an opposite-facing signal on a main", true);
} catch (err) {
  check("the compiler ACCEPTS an opposite-facing signal on a main", false, String((err as Error).message));
  console.log(`\n${failures} PROBE(S) FAILED`);
  process.exit(1);
}

// 2. the compiled signal: direction + protected section
const a1r = compiled.signals.items.find((s) => s.id === "A1r")!;
const a1rSection = compiled.compatibility.signalSections.find((s) => s.sig === "A1r");
check(
  "A1r compiles as dir=right on y=89 (opposing the group's normal left)",
  a1r.dir === "right" && a1r.lineY === 89,
  `dir=${a1r.dir} y=${a1r.lineY}`
);
check(
  "A1r's protected section extends EAST (its own direction)",
  !!a1rSection && a1rSection.lo === 1400 && a1rSection.hi === Number.POSITIVE_INFINITY,
  JSON.stringify(a1rSection)
);
check(
  "the normal-direction signals (A1/A2) keep their WEST sections — both directions coexist",
  (() => {
    const a1 = compiled.compatibility.signalSections.find((s) => s.sig === "A1");
    const a2 = compiled.compatibility.signalSections.find((s) => s.sig === "A2");
    return !!a1 && !!a2 && a1.lo === 300 && a1.hi === 1300 && a2.hi === 300;
  })(),
  "A1/A2 sections shifted"
);

// FINDING: the flyover fixture's mains are authored east→west (aR→s1), the
// OPPOSITE of Bekasi's west→east convention, so the compiled normal bearing
// for the declared-left lineA/lineB points RIGHT. The compiler accepts it and
// the fixture's own verifier passes (it never reads the normal bearing), but
// the direction fallback and wrong-way protection would misbehave if the
// fixture were wired into the UI.
const declaredLeft = {
  group: "lineA",
  compiled: compiled.lines.normalBearingByLineY[89],
};
check(
  "FINDING — the fixture's lineA compiles normalBearing=right despite declaring normalDirection=left (authoring inversion)",
  declaredLeft.compiled.dx > 0,
  JSON.stringify(declaredLeft.compiled)
);

// 3. the runtime's direction fallback (selectMainLine's policy, inlined): a
// train running RIGHT against all three leftbound mains
const map = compiled;
const fallback = (dir: "right" | "left") => {
  const directionBearing: Bearing = dir === "right" ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
  let best: { trackGroupId: string; lineY: number } | undefined;
  let bestDot = -Infinity;
  for (const main of map.lines.mains) {
    const dot = bearingDot(directionBearing, main.normalBearing);
    if (dot > bestDot) {
      bestDot = dot;
      best = { trackGroupId: main.trackGroupId, lineY: main.lineY };
    }
  }
  return best!;
};
const line = fallback("right");
check(
  "a rightbound train on all-leftbound mains falls back to the FIRST main (arbitrary) — wrong-way needs an explicit line",
  line.lineY === 89,
  `picked ${line.trackGroupId} y=${line.lineY}`
);

// 4. route search from the wrong-way signal
const graph = compiled.compatibility.movement.nodes;
const signals: RouteSearchSignal[] = compiled.signals.items.map((s) => ({
  id: s.id,
  edge: s.edge,
  dir: s.dir,
  x: s.x,
  y: s.y,
}));
const r = findRoute({
  entranceId: "A1r",
  entrance: signals.find((s) => s.id === "A1r")!,
  signals,
  graph,
  switches: { ...compiled.switches.initialState },
  isLocked: () => false,
  segmentLevels: compiled.segmentLevels,
});
check(
  "route search finds the wrong-way route to the east boundary",
  r !== null && r.pts.length >= 2 && r.pts[r.pts.length - 1][0] > 1500,
  JSON.stringify(r?.pts.map((p) => p[0]))
);

// 5. movement against the normal direction — a right-moving train on the
// leftbound main mechanically runs to the boundary (the engine never blocks it)
{
  const st: TrainState = initTrain(
    {
      originArr: 0,
      approach: false,
      start: { x: 1450, y: 89, dir: "right", firstNode: "aR" },
      legs: [
        { waypointX: 1600, lineY: 89, speed: 5 },
        { waypointX: 1650, lineY: 89, speed: 5 },
      ],
    },
    graph,
    5
  );
  const ctx: MoveCtx = {
    nodes: graph,
    signals: [],
    switches: {},
    aspectOf: () => "green",
    trainHalfLen: 50,
    ignoreSignals: true,
    segmentLevels: compiled.segmentLevels,
  };
  advanceTrain(st, 40, ctx, st.leg === 0 ? [{ waypointX: 1600, lineY: 89, speed: 5 }] : []);
  check(
    "a train runs RIGHT along the leftbound main without the engine blocking it",
    st.x > 1460,
    `x=${st.x.toFixed(1)}`
  );
}

// 6. the wrong-way protection trigger — what the component's wrongWaySpans
// would see IF the normal bearing were correct (the declared direction): the
// A1r route's segments oppose a leftbound line, so the protection fires.
{
  const normal: Bearing = { dx: -1, dy: 0 }; // the DECLARED leftbound normal
  const res = findRoute({
    entranceId: "A1r",
    entrance: signals.find((s) => s.id === "A1r")!,
    signals,
    graph,
    switches: { ...compiled.switches.initialState },
    isLocked: () => false,
    segmentLevels: compiled.segmentLevels,
  })!;
  const opposing = [];
  for (let i = 0; i + 1 < res.pts.length; i++) {
    const a = res.pts[i];
    const b = res.pts[i + 1];
    if (a[1] === b[1] && a[1] === 89) {
      const seg: Bearing = bearingOf([a[0], a[1]], [b[0], b[1]]);
      opposing.push(bearingDot(seg, normal));
    }
  }
  const anyOpposing = opposing.some((d) => d < 0);
  check(
    "a rightbound route on the leftbound main OPPOSES the normal — wrongWaySpans/forcedRed WILL fire and force every normal-direction signal on y=89 red while it is reserved",
    anyOpposing,
    `dots=${JSON.stringify(opposing.map((d) => Math.round(d * 100) / 100))}`
  );
}

console.log(failures === 0 ? "\nALL PROBES PASSED" : `\n${failures} PROBE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
