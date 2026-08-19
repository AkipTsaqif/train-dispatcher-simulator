// Phase 9 Step 4/5 acceptance — pieces reproduce the checked-in IR.
//
// PLAN-phase-9 requires "empty IR diff" against each fixture's hand-authored
// definition. This asserts that, and then something STRONGER: that the two
// definitions COMPILE to byte-identical output.
//
// Why both. The IR diff is the authoring-level check and gives a readable
// verdict per entity. But an ordering-only IR difference is explicitly
// allowed by the plan "with a recorded reason", and the only reason that
// should ever be accepted is that it cannot change behavior. Compiling both
// sides and comparing the serialized result PROVES that, rather than assuming
// it — so an ordering-only diff is accepted here if and only if the compiled
// output is identical.
//
// Run: bun scripts/verify-pieces.ts

import { diffIR, formatIRDiff } from "./lib/ir-diff";
import { serialize } from "./lib/serialize";
import { compileTopology, type TopologyDefinition } from "../app/lib/topology";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

const FIXTURES = [
  {
    name: "three-main-fixture",
    hand: async () =>
      (await import("../app/topologies/three-main-fixture")).THREE_MAIN_FIXTURE_TOPOLOGY,
    pieces: async () =>
      (await import("../app/pieces/three-main-fixture")).THREE_MAIN_FIXTURE_ASSEMBLED,
  },
  {
    name: "ladder-fixture",
    hand: async () => (await import("../app/topologies/ladder-fixture")).LADDER_FIXTURE_TOPOLOGY,
    pieces: async () => (await import("../app/pieces/ladder-fixture")).LADDER_FIXTURE_ASSEMBLED,
  },
  {
    name: "loops-fixture",
    hand: async () => (await import("../app/topologies/loops-fixture")).LOOPS_FIXTURE_TOPOLOGY,
    pieces: async () => (await import("../app/pieces/loops-fixture")).LOOPS_FIXTURE_ASSEMBLED,
  },
  {
    name: "flyover-fixture",
    hand: async () => (await import("../app/topologies/flyover-fixture")).FLYOVER_FIXTURE_TOPOLOGY,
    pieces: async () => (await import("../app/pieces/flyover-fixture")).FLYOVER_FIXTURE_ASSEMBLED,
  },
];

for (const fixture of FIXTURES) {
  const hand = (await fixture.hand()) as TopologyDefinition;
  const assembled = (await fixture.pieces()) as TopologyDefinition;

  const diff = diffIR(hand, assembled);

  check(`${fixture.name}: no entity added, removed, or changed`, diff.structurallyIdentical,
    formatIRDiff(diff));

  // The compiled comparison is the real proof — it is what the runtime sees.
  const compiledHand = serialize(compileTopology(hand));
  const compiledPieces = serialize(compileTopology(assembled));
  check(`${fixture.name}: compiles to byte-identical output`, compiledHand === compiledPieces);

  if (diff.identical) {
    check(`${fixture.name}: IR is identical including order`, true);
  } else {
    // Ordering-only is acceptable ONLY because the compiled output above is
    // identical; that is the "recorded reason" the plan asks for.
    const reordered = diff.collections.filter((c) => c.reordered).map((c) => c.collection);
    check(
      `${fixture.name}: ordering-only difference is behavior-neutral (${reordered.join(", ")})`,
      compiledHand === compiledPieces,
      "compiled output differs — ordering is NOT neutral here"
    );
  }
}

console.log(
  failures === 0 ? "\nALL PIECE ACCEPTANCE CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`
);
process.exit(failures === 0 ? 0 : 1);
