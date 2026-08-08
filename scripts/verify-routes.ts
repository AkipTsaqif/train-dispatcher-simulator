// Phase 4 verifier — route search over a ladder with two paths + flank points.
//
// Proves:
//   1. findRoute returns a feasible path with the required switch settings;
//   2. when one path is occupied, findRoute chooses the free alternative;
//   3. flankPoints detects a fouling converging switch for a route.
//
// Run: bun scripts/verify-routes.ts

import { LADDER_FIXTURE_DISPATCH } from "../app/dispatching/ladder-fixture";
import { findRoute, flankPoints, type RouteSearchSignal } from "../app/lib/route-search";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const runtime = LADDER_FIXTURE_DISPATCH;
const graph = runtime.map.compatibility.movement.nodes;
const signals: RouteSearchSignal[] = runtime.map.signals.items.map((s) => ({
  id: s.id,
  edge: s.edge,
  dir: s.dir,
  x: s.x,
  y: s.y,
}));
const entrance = signals.find((s) => s.id === "E1")!;
const switches = { ...runtime.map.switches.initialState };

const search = (isClear?: (nodePath: string[], pts: import("../app/lib/topology").LeveledPoint[]) => boolean) =>
  findRoute({
    entranceId: "E1",
    entrance,
    signals,
    graph,
    switches,
    isLocked: () => false,
    isClear,
  });

// 1. default (both lines free, points normal) → the straight line1 path, no moves
const r1 = search();
check("default route exits at J1 (line1)", r1?.exitSignalId === "J1", r1?.exitSignalId);
check("default route needs no point moves", r1 !== null && Object.keys(r1.requiredSwitches).length === 0);

// 2. line1 occupied → the search must choose the free loop path (line2)
const line1Occupied = (nodePath: string[], pts: import("../app/lib/topology").LeveledPoint[]) =>
  !pts.some(([x, y]) => Math.abs(y - 200) < 1 && x > 300 && x < 700);
const r2 = search(line1Occupied);
check("with line1 occupied the route exits at J2 (line2)", r2?.exitSignalId === "J2", r2?.exitSignalId);
check(
  "the line2 route requires SWa reversed (the loop exit signal J2 ends it)",
  r2 !== null && r2.requiredSwitches[1] === "reversed" && r2.requiredSwitches[2] === undefined,
  JSON.stringify(r2?.requiredSwitches)
);

// 3. line2 occupied → back to the free line1
const line2Occupied = (nodePath: string[], pts: import("../app/lib/topology").LeveledPoint[]) =>
  !pts.some(([x, y]) => Math.abs(y - 300) < 1 && x > 350 && x < 650);
const r3 = search(line2Occupied);
check("with line2 occupied the route exits at J1 again", r3?.exitSignalId === "J1", r3?.exitSignalId);

// 4. flank points — a converging switch whose branch fouls the line1 route
const augmented = {
  ...graph,
  SWf: {
    x: 400,
    y: 100,
    sw: 9,
    exits: [
      { neighbor: "F", bearing: { dx: 0.447, dy: 0.894 }, viaSwitchPort: "reversed" as const, branchPath: ["F"], farSw: 9 },
    ],
  },
  F: { x: 450, y: 200, exits: [] },
};
const flanks = flankPoints(r1!, augmented, 50);
check(
  "flankPoints detects the fouling switch for the line1 route",
  flanks.includes(9),
  JSON.stringify(flanks)
);

console.log(failures === 0 ? "\nALL VERIFIER CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
