// Phase 1 probe — bearings make the engine non-horizontal.
//
// Proves:
//   1. the bearing primitives behave (bearingOf/bearingDot/bearingToDir),
//   2. a compiled DIAGONAL edge gives its nodes a diagonal exit bearing,
//   3. a train traverses the diagonal (x AND y move),
//   4. a red signal ON the diagonal stops the train (leading edge at the
//      signal) and releases it when the aspect clears.
//
// Run: bun probes/bearing.probe.ts

import {
  bearingDot,
  bearingOf,
  bearingToDir,
  compileTopology,
  type TopologyDefinition,
} from "../app/lib/topology";
import {
  advanceTrain,
  buildJourney,
  initTrain,
  type JourneyRules,
  type MoveCtx,
  type TrainState,
} from "../app/lib/train-engine";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

// 1. bearing primitives
{
  const b = bearingOf([0, 0], [3, 4]);
  check("bearingOf normalizes to a unit vector", Math.abs(b.dx - 0.6) < 1e-9 && Math.abs(b.dy - 0.8) < 1e-9, `${b.dx},${b.dy}`);
  check("bearingDot same direction > 0", bearingDot(b, b) > 0.99);
  check("bearingDot opposite < 0", bearingDot(b, { dx: -0.6, dy: -0.8 }) < -0.99);
  check("bearingToDir right", bearingToDir({ dx: 1, dy: 0 }) === "right");
  check("bearingToDir left (diagonal with -dx)", bearingToDir({ dx: -0.6, dy: 0.8 }) === "left");
}

// 2-4. a small diagonal fixture
const DIAG: TopologyDefinition = {
  nodes: [
    { id: "A", point: [0, 0], kind: "boundary" },
    { id: "B", point: [300, 150], kind: "boundary" },
  ],
  edges: [
    {
      id: "diag",
      from: "A",
      to: "B",
      geometry: [{ point: [0, 0] }, { point: [300, 150] }],
      role: "main",
      trackGroupId: "main",
      normalDirection: "right",
      renderSlots: [0],
    },
  ],
  switches: [],
  controlGroups: [],
  signals: [
    {
      id: "D1",
      edgeId: "diag",
      segmentIndex: 0,
      offset: 150,
      facing: "toward-to",
      mount: "up",
      label: "diagonal signal",
      protectedBlockSectionId: "section-D1",
    },
  ],
  trackGroups: [{ id: "main", role: "main", edgeIds: ["diag"], normalDirection: "right" }],
  blockSections: [
    {
      id: "section-D1",
      signalId: "D1",
      coverage: "signal-to-boundary",
      edgeRanges: [
        {
          edgeId: "diag",
          from: { kind: "signal", signalId: "D1" },
          to: { kind: "edge-end", end: "to" },
        },
      ],
      legacyOpenEnd: "east",
    },
  ],
  stationStopPoints: [],
  legacyNodeOrder: ["A", "B"],
};

const compiled = compileTopology(DIAG);
const aNode = compiled.nodes.A;
const diagBearing = aNode.exits[0]?.bearing;
// A(0,0) -> B(300,150): normalized (0.8944, 0.4472)
check(
  "diagonal node A exposes a diagonal exit bearing",
  !!diagBearing && Math.abs(diagBearing.dx - 0.894427) < 1e-3 && Math.abs(diagBearing.dy - 0.447214) < 1e-3,
  JSON.stringify(diagBearing)
);
const d1 = compiled.signals.items.find((s) => s.id === "D1")!;
check(
  "the signal on the diagonal carries the diagonal bearing",
  Math.abs(d1.bearing.dx - 0.894427) < 1e-3 && Math.abs(d1.bearing.dy - 0.447214) < 1e-3,
  JSON.stringify(d1.bearing)
);

const RULES: JourneyRules = {
  speed: { runKmh: 80, segmentKm: {} },
  dwell: { holdUntilScheduledDepartureByStation: {}, minimumStopSeconds: 0 },
};
const stops: import("../app/lib/train-engine").TrainStop[] = [
  { trackmark: "A", arr: 60, arr_actual: "00:01:00", dep: 60, dep_actual: "00:01:00" },
  { trackmark: "B", arr: 600, arr_actual: "00:10:00", dep: 600, dep_actual: "00:10:00" },
];
const plan = buildJourney(stops, { A: 0, B: 300 }, 0, compiled.nodes, "right", RULES);
const HALF = 10;
let aspect: "red" | "green" = "red";
const ctx: MoveCtx = {
  nodes: compiled.nodes,
  signals: compiled.compatibility.movement.signals,
  switches: {},
  aspectOf: () => aspect,
  trainHalfLen: HALF,
};
const st: TrainState = initTrain(plan, compiled.nodes, plan.legs[0].speed);

// let the train run — it must stop at the red diagonal signal D1 (arrives A at
// t=60, then runs the diagonal at ~0.62 u/s; D1 sits 150 units along it)
advanceTrain(st, 60 + 300, ctx, plan.legs);
const d1Point = { x: d1.x, y: d1.y };
const frontX = st.x + (diagBearing.dx * HALF);
const frontY = st.y + (diagBearing.dy * HALF);
const distToSignal = Math.hypot(frontX - d1Point.x, frontY - d1Point.y);
check("train stops with its leading edge at the red diagonal signal", st.stopped && distToSignal < 1, `stopped=${st.stopped} dist=${distToSignal.toFixed(2)} x=${st.x.toFixed(1)} y=${st.y.toFixed(1)}`);
check("train position moved off the horizontal axis (y != 0)", Math.abs(st.y) > 1, `y=${st.y.toFixed(1)}`);

// release: the aspect clears → the train resumes and reaches B
aspect = "green";
const xBefore = st.x;
advanceTrain(st, 600, ctx, plan.legs);
check("train resumes and advances past the signal once it clears", st.x > xBefore + 100, `x=${st.x.toFixed(1)}`);
check("train reached the far end (B at x=300)", st.done || st.x > 299, `x=${st.x.toFixed(1)} done=${st.done}`);

console.log(failures === 0 ? "\nALL PROBES PASSED" : `\n${failures} PROBE(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
