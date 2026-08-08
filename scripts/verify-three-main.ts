// Phase 2 verifier — the 3-main fixture.
//
// Proves layouts with more than two main running lines work:
//   1. compileTopology accepts three main groups;
//   2. the map exposes all three mains;
//   3. selectMainLine honors explicit timetable `line`, then the scenario
//      routing policy, then the direction fallback — five trains land on
//      three distinct mains (M1/M2/M3).
//
// Run: bun scripts/verify-three-main.ts

import { THREE_MAIN_FIXTURE_DISPATCH } from "../app/dispatching/three-main-fixture";
import { THREE_MAIN_FIXTURE_TOPOLOGY } from "../app/topologies/three-main-fixture";
import { compileTopology } from "../app/lib/topology";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const runtime = THREE_MAIN_FIXTURE_DISPATCH;

// 1-2. compile + the map exposes three mains
check("three-main topology compiles", compileTopology(THREE_MAIN_FIXTURE_TOPOLOGY).lines.mains.length === 3);
const mains = runtime.map.lines.mains;
check("map exposes three mains", mains.length === 3, `got ${mains.length}`);
const lineYOf = (trackGroupId: string) => mains.find((m) => m.trackGroupId === trackGroupId)?.lineY;
check("M1 at y=100", lineYOf("M1") === 100);
check("M2 at y=200", lineYOf("M2") === 200);
check("M3 at y=300", lineYOf("M3") === 300);

// 3. line selection — explicit / policy / fallback
const journeyLineY = (trainNo: string): number =>
  runtime.journeys.find((j) => j.train.train_no === trainNo)!.plan.legs[0].lineY;

check("T1 (explicit M1) runs y=100", journeyLineY("T1") === 100, `got ${journeyLineY("T1")}`);
check("T2 (explicit M2) runs y=200", journeyLineY("T2") === 200, `got ${journeyLineY("T2")}`);
check("T3 (explicit M3) runs y=300", journeyLineY("T3") === 300, `got ${journeyLineY("T3")}`);
check("T4 (no line, policy left→M3) runs y=300", journeyLineY("T4") === 300, `got ${journeyLineY("T4")}`);
check("T5 (no line, no policy for right, fallback→M2) runs y=200", journeyLineY("T5") === 200, `got ${journeyLineY("T5")}`);

// the acceptance's proof: three trains on three distinct mains
const distinct = new Set([journeyLineY("T1"), journeyLineY("T2"), journeyLineY("T3")]);
check("three trains run on three distinct mains", distinct.size === 3, `[${[...distinct]}]`);

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
