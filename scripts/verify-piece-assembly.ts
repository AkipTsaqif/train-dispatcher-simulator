// Phase 9 Step 3 verifier — the port join kernel.
//
// Proves the coincidence rules from PLAN-phase-9.md, INCLUDING the ambiguity
// error paths. Those matter most: the plan's risk section requires a hard
// error naming the point and competing bearings, "never guess" — a kernel that
// silently picked an axis would corrupt a layout in a way no downstream
// verifier could attribute.
//
// Run: bun scripts/verify-piece-assembly.ts

import {
  joinPorts,
  overCrowdedJunctions,
  type Port,
} from "../app/lib/piece-assembly";
import { bearingOf } from "../app/lib/topology";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

/** Assert a call throws, and that the message explains WHY. */
const throwsWith = (name: string, fn: () => unknown, ...needles: string[]) => {
  try {
    fn();
    check(name, false, "did not throw");
  } catch (error) {
    const message = (error as Error).message;
    const missing = needles.filter((n) => !message.includes(n));
    check(name, missing.length === 0, `message lacks ${missing.join(", ")}: ${message}`);
  }
};

const EAST = { dx: 1, dy: 0 };
const WEST = { dx: -1, dy: 0 };
const port = (p: Partial<Port> & Pick<Port, "point" | "bearing">): Port => ({
  groupId: "g",
  label: "port",
  ...p,
});

// --- 1. free ends ----------------------------------------------------------
{
  const j = joinPorts([port({ point: [0, 0], bearing: WEST, label: "lone" })]);
  check("a lone port is a free end", j.length === 1 && j[0].kind === "free");
}

// --- 2. two opposing ports join -------------------------------------------
{
  const j = joinPorts([
    port({ point: [100, 50], bearing: EAST, label: "A east" }),
    port({ point: [100, 50], bearing: WEST, label: "B west" }),
  ]);
  check("two opposing ports join into one through node", j.length === 1 && j[0].kind === "through");
  check("the through node keeps both ports", j[0].ports.length === 2);
}

// --- 3. same point, SAME direction is an error ----------------------------
// Both bearings pointing the same way means the pieces overlap rather than
// meet end-to-end. Silently joining them would fabricate a track.
throwsWith(
  "two ports that do not oppose are rejected",
  () =>
    joinPorts([
      port({ point: [0, 0], bearing: EAST, label: "A" }),
      port({ point: [0, 0], bearing: EAST, label: "B" }),
    ]),
  "do not oppose",
  "(0,0)"
);

// --- 4. different levels never join (the flyover rule) --------------------
{
  const j = joinPorts([
    port({ point: [800, 147], bearing: EAST, label: "ground", level: 0 }),
    port({ point: [800, 147], bearing: WEST, label: "ramp", level: 1 }),
  ]);
  check("same point at different levels does NOT join", j.length === 2, `got ${j.length} junction(s)`);
  check("both stay free ends", j.every((x) => x.kind === "free"));
}

// --- 5. exact coincidence: no epsilon -------------------------------------
{
  const j = joinPorts([
    port({ point: [100, 50], bearing: EAST, label: "A" }),
    port({ point: [101, 50], bearing: WEST, label: "B" }),
  ]);
  check("1 unit apart does NOT join (coincidence is exact)", j.length === 2);
}

// --- 6. three ports imply a switch ----------------------------------------
{
  // straight run east-west, plus a diverging leg to the north-east
  const diverge = bearingOf([0, 0], [40, -20]);
  const j = joinPorts([
    port({ point: [200, 100], bearing: EAST, label: "straight east" }),
    port({ point: [200, 100], bearing: WEST, label: "straight west" }),
    port({ point: [200, 100], bearing: diverge, label: "branch" }),
  ]);
  check("three coincident ports imply a switch", j.length === 1 && j[0].kind === "switch");
  const labels = (j[0].through ?? []).map((p) => p.label).sort();
  check(
    "the most-collinear pair becomes the through axis",
    labels.join("|") === "straight east|straight west",
    labels.join("|")
  );
  check(
    "the remaining port becomes the diverging leg",
    j[0].reversed?.length === 1 && j[0].reversed[0].label === "branch"
  );
}

// --- 7. the through axis is chosen by geometry, not input order -----------
{
  const diverge = bearingOf([0, 0], [40, -20]);
  const j = joinPorts([
    port({ point: [0, 0], bearing: diverge, label: "branch" }),   // listed FIRST
    port({ point: [0, 0], bearing: EAST, label: "straight east" }),
    port({ point: [0, 0], bearing: WEST, label: "straight west" }),
  ]);
  const labels = (j[0].through ?? []).map((p) => p.label).sort();
  check(
    "input order does not affect the inferred axis",
    labels.join("|") === "straight east|straight west",
    labels.join("|")
  );
}

// --- 8. AMBIGUITY IS AN ERROR (the plan's central safety rule) ------------
// A symmetric X: two straight axes crossing, neither more collinear. Guessing
// here would silently pick one of two valid-looking layouts.
throwsWith(
  "a symmetric crossing is rejected as ambiguous",
  () => {
    const ne = bearingOf([0, 0], [10, -10]);
    const sw = bearingOf([0, 0], [-10, 10]);
    return joinPorts([
      port({ point: [500, 500], bearing: EAST, label: "east" }),
      port({ point: [500, 500], bearing: WEST, label: "west" }),
      port({ point: [500, 500], bearing: ne, label: "north-east" }),
      port({ point: [500, 500], bearing: sw, label: "south-west" }),
    ]);
  },
  "Ambiguous switch",
  "(500,500)",
  "candidate A",
  "candidate B"
);

// --- 9. no through axis at all is an error -------------------------------
// A true FAN: three ports inside a 90-degree sector, so every pair has a
// positive dot and no pair is "straight through". Note the earlier draft of
// this test used bearings at +-61 degrees, which DO oppose (dot -0.53) — the
// kernel was right to accept those, and the test was wrong.
throwsWith(
  "three ports with no opposing pair are rejected",
  () => {
    const a = bearingOf([0, 0], [10, 0]);
    const b = bearingOf([0, 0], [10, 4]);
    const c = bearingOf([0, 0], [10, -4]);
    return joinPorts([
      port({ point: [7, 7], bearing: a, label: "a" }),
      port({ point: [7, 7], bearing: b, label: "b" }),
      port({ point: [7, 7], bearing: c, label: "c" }),
    ]);
  },
  "No through axis",
  "(7,7)"
);

// --- 10. error messages name the level for graded junctions --------------
throwsWith(
  "an error at level 1 names the level",
  () =>
    joinPorts([
      port({ point: [3, 4], bearing: EAST, label: "A", level: 1 }),
      port({ point: [3, 4], bearing: EAST, label: "B", level: 1 }),
    ]),
  "level 1"
);

// --- 11. a switch with 2+ diverging legs is surfaced, not silently split --
// TopologySwitch has exactly one reversed port, so this cannot compile as one
// switch; a real ladder separates them along the track.
{
  const up = bearingOf([0, 0], [40, -20]);
  const down = bearingOf([0, 0], [40, 20]);
  const j = joinPorts([
    port({ point: [10, 10], bearing: EAST, label: "east" }),
    port({ point: [10, 10], bearing: WEST, label: "west" }),
    port({ point: [10, 10], bearing: up, label: "branch up" }),
    port({ point: [10, 10], bearing: down, label: "branch down" }),
  ]);
  check("a 4-port junction still resolves a through axis", j[0].kind === "switch");
  check("two diverging legs are reported", j[0].reversed?.length === 2);
  check("overCrowdedJunctions flags it", overCrowdedJunctions(j).length === 1);
  check("a normal 3-port switch is NOT flagged", overCrowdedJunctions(
    joinPorts([
      port({ point: [0, 0], bearing: EAST, label: "e" }),
      port({ point: [0, 0], bearing: WEST, label: "w" }),
      port({ point: [0, 0], bearing: up, label: "b" }),
    ])
  ).length === 0);
}

// --- 12. independent junctions stay independent --------------------------
{
  const j = joinPorts([
    port({ point: [0, 0], bearing: EAST, label: "a1" }),
    port({ point: [0, 0], bearing: WEST, label: "a2" }),
    port({ point: [900, 0], bearing: EAST, label: "b1" }),
    port({ point: [900, 0], bearing: WEST, label: "b2" }),
  ]);
  check("separate points produce separate junctions", j.length === 2);
  check("each is a through node", j.every((x) => x.kind === "through"));
}

// --- 13. determinism: same input, same output ----------------------------
{
  const build = () => {
    const diverge = bearingOf([0, 0], [40, -20]);
    return joinPorts([
      port({ point: [0, 0], bearing: EAST, label: "e" }),
      port({ point: [0, 0], bearing: WEST, label: "w" }),
      port({ point: [0, 0], bearing: diverge, label: "b" }),
    ]);
  };
  check(
    "the kernel is deterministic",
    JSON.stringify(build()) === JSON.stringify(build())
  );
}

// --- 14. empty input is not an error -------------------------------------
check("no ports yields no junctions", joinPorts([]).length === 0);

console.log(
  failures === 0 ? "\nALL PIECE-ASSEMBLY CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
