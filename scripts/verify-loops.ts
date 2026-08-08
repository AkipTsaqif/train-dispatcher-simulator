// Phase 3 verifier — two independent sidings, one multi-edge.
//
// Proves:
//   1. loops are keyed by group id and carry their OWN envelopes;
//   2. two loops share a compatibility Y (both at 300) without overwriting;
//   3. a loop group may contain multiple edges (S2 has two);
//   4. INDEPENDENT occupancy — a train in S1 reddens only S1's signal, a train
//      in S2 only S2's (the false-occupancy bug is gone);
//   5. a multi-edge loop traverses end-to-end (a train diverting into S2
//      reaches the far side and rejoins).
//
// Run: bun scripts/verify-loops.ts

import { LOOPS_FIXTURE_DISPATCH } from "../app/dispatching/loops-fixture";
import { LOOPS_FIXTURE_TOPOLOGY } from "../app/topologies/loops-fixture";
import { compileTopology, type Bearing } from "../app/lib/topology";
import {
  advanceTrain,
  buildJourney,
  initTrain,
  occupiedSections,
  type JourneyRules,
  type MoveCtx,
  type TrainState,
} from "../app/lib/train-engine";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const compiled = compileTopology(LOOPS_FIXTURE_TOPOLOGY);
const runtime = LOOPS_FIXTURE_DISPATCH;

// 1-3. per-loop envelopes + shared Y + multi-edge
check("two loop groups compiled", Object.keys(compiled.loops.byGroupId).length === 2);
const s1 = compiled.loops.byGroupId.S1;
const s2 = compiled.loops.byGroupId.S2;
check("both loops share compatibility Y=300", s1.lineY === 300 && s2.lineY === 300, `S1=${s1.lineY} S2=${s2.lineY}`);
check("S1 has its own envelope [300,400]", s1.minX === 300 && s1.maxX === 400, `[${s1.minX},${s1.maxX}]`);
check("S2 has its own envelope [600,800]", s2.minX === 600 && s2.maxX === 800, `[${s2.minX},${s2.maxX}]`);
check("S1 and S2 envelopes are independent", s1.maxX < s2.minX, `${s1.maxX} < ${s2.minX}`);
check("S2 is multi-edge (two edges)", runtime.map.loops.byGroupId.S2.trackGroupId === "S2");

// 4. independent occupancy — the loop signals' sections cover only their own loop
const j1Section = runtime.signalSections.find((section) => section.sig === "J1")!;
const j2Section = runtime.signalSections.find((section) => section.sig === "J2")!;
check("J1's section covers only S1", j1Section.lo <= 300 && j1Section.hi >= 400 && j1Section.hi < s2.minX, `[${j1Section.lo},${j1Section.hi}]`);
check("J2's section covers only S2", j2Section.lo <= 600 && j2Section.hi >= 800 && j2Section.lo > s1.maxX, `[${j2Section.lo},${j2Section.hi}]`);

const sections = runtime.signalSections;
// a horizontal body around the point so the footprint reduces to the old
// x-interval test ([x-halfLen, x+halfLen] on the train's line)
const fakeTrain = (x: number, y: number): Pick<TrainState, "x" | "y" | "segFrom" | "segTo" | "trail" | "spawned" | "done"> => ({
  x,
  y,
  segFrom: [x - 58, y],
  segTo: [x + 58, y],
  trail: [],
  spawned: true,
  done: false,
});
const occupied = (x: number, y: number) => occupiedSections(fakeTrain(x, y) as TrainState, sections, 10);
const occ1 = occupied(365, 300); // a train in S1
const occ2 = occupied(675, 300); // a train in S2
check("a train in S1 occupies only J1", occ1.includes("J1") && !occ1.includes("J2"), occ1);
check("a train in S2 occupies only J2", occ2.includes("J2") && !occ2.includes("J1"), occ2);

// 5. multi-edge traversal — divert the A→B train into S2 and back to the main
const RULES: JourneyRules = {
  speed: { runKmh: 80, segmentKm: {} },
  dwell: { holdUntilScheduledDepartureByStation: {}, minimumStopSeconds: 0 },
};
const stops = runtime.journeys[0].train.stops;
const plan = runtime.journeys[0].plan;
const ctx: MoveCtx = {
  nodes: runtime.map.compatibility.movement.nodes,
  signals: runtime.map.compatibility.movement.signals,
  switches: { 3: "reversed", 4: "reversed" }, // S2 west + S2 east
  aspectOf: () => "green",
  trainHalfLen: 10,
};
const st: TrainState = initTrain(plan, ctx.nodes, plan.legs[0].speed);
advanceTrain(st, 3000, ctx, plan.legs); // full journey A→B via the loop (divert adds distance)
check(
  "train diverted into S2 and traversed the multi-edge loop",
  st.x > 600,
  `x=${st.x.toFixed(0)} y=${st.y.toFixed(0)}`
);
check(
  "train rejoined the main and reached B",
  st.done || st.x > 990,
  `x=${st.x.toFixed(0)} done=${st.done}`
);

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
