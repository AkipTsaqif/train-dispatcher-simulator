// Self-check for the IR differ (Phase 9 Step 1 gate).
//
// A differ is only useful if it reports change when change exists. A stub that
// always returns "identical" would make the Step 4-5 empty-diff acceptance
// gates pass vacuously — so this exercises each diff class against a real IR
// with a known mutation applied, and asserts BOTH that the mutation is caught
// and that nothing else is falsely reported.

import { diffIR, formatIRDiff } from "./ir-diff";
import type { TopologyDefinition } from "../../app/lib/topology";

let failures = 0;
const check = (name: string, cond: boolean, detail = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : `  — ${detail}`}`);
  if (!cond) failures++;
};

/** Structured deep clone; the IR is plain data, so JSON round-trip is exact. */
const clone = (ir: TopologyDefinition): TopologyDefinition =>
  JSON.parse(JSON.stringify(ir)) as TopologyDefinition;

const only = (diff: ReturnType<typeof diffIR>, collection: string) =>
  diff.collections.filter(
    (c) =>
      c.collection !== collection &&
      (c.added.length || c.removed.length || c.changed.length || c.reordered)
  );

export const selfCheck = async (): Promise<number> => {
  const { LADDER_FIXTURE_TOPOLOGY } = await import("../../app/topologies/ladder-fixture");
  const base = LADDER_FIXTURE_TOPOLOGY as TopologyDefinition;

  // 0. identity — a definition must not differ from itself.
  const identity = diffIR(base, base);
  check("identical IRs report identical", identity.identical);
  check("identical IRs are structurally identical", identity.structurallyIdentical);

  // 1. added — append a node.
  const withNode = clone(base);
  (withNode.nodes as unknown as unknown[]).push({
    id: "zz-added",
    point: [9999, 9999],
    kind: "boundary",
  });
  const added = diffIR(base, withNode);
  check("added node detected", !added.identical && !added.structurallyIdentical);
  check(
    "added node reported in nodes.added",
    added.collections.find((c) => c.collection === "nodes")?.added.join() === "zz-added"
  );
  check("added node does not disturb other collections", only(added, "nodes").length === 0,
    only(added, "nodes").map((c) => c.collection).join());

  // 2. removed — drop the last node (mirror of the above).
  const removed = diffIR(withNode, base);
  check(
    "removed node reported in nodes.removed",
    removed.collections.find((c) => c.collection === "nodes")?.removed.join() === "zz-added"
  );

  // 3. changed — move a node, and name the field that moved.
  const moved = clone(base);
  (moved.nodes as unknown as { point: number[] }[])[0].point = [-1, -1];
  const changed = diffIR(base, moved);
  const nodeDiff = changed.collections.find((c) => c.collection === "nodes");
  check("moved node detected as changed", nodeDiff?.changed.length === 1);
  check(
    "changed node names the differing field",
    nodeDiff?.changed[0]?.fields.some((f) => f.field === "point") === true,
    nodeDiff?.changed[0]?.fields.map((f) => f.field).join()
  );
  check("moved node reports no add/remove", (nodeDiff?.added.length ?? -1) === 0 && (nodeDiff?.removed.length ?? -1) === 0);

  // 4. reordered — same ids, different sequence. MUST be its own class, not
  //    added/removed/changed, or Steps 4-5 cannot accept ordering-only diffs.
  const shuffled = clone(base);
  (shuffled.nodes as unknown as unknown[]).reverse();
  const reordered = diffIR(base, shuffled);
  const reorderedNodes = reordered.collections.find((c) => c.collection === "nodes");
  check("reorder detected", !reordered.identical);
  check("reorder is NOT reported as structural", reordered.structurallyIdentical);
  check("reorder sets the reordered flag", reorderedNodes?.reordered === true);
  check(
    "reorder reports no add/remove/change",
    (reorderedNodes?.added.length ?? -1) === 0 &&
      (reorderedNodes?.removed.length ?? -1) === 0 &&
      (reorderedNodes?.changed.length ?? -1) === 0
  );

  // 5. every collection is actually covered — a KEYS entry that silently fails
  //    to extract an id would make that collection invisible to the differ.
  const collections = identity.collections.map((c) => c.collection);
  for (const name of [
    "nodes", "edges", "switches", "controlGroups", "signals",
    "trackGroups", "blockSections", "stationStopPoints", "legacyNodeOrder",
  ]) {
    check(`collection "${name}" is diffed`, collections.includes(name));
  }

  // 6. a non-empty diff must render a non-empty, readable report.
  const report = formatIRDiff(changed);
  check("report names the changed collection", report.includes("nodes:"));
  check("report states the verdict", report.includes("STRUCTURAL DIFFERENCES"));
  check(
    "identical report says IDENTICAL",
    formatIRDiff(identity).includes("IDENTICAL")
  );

  // 7. duplicate ids are a corrupt IR — fail loudly rather than silently
  //    diffing only the first occurrence.
  const duped = clone(base);
  (duped.nodes as unknown as unknown[]).push(duped.nodes[0]);
  let threw = false;
  try {
    diffIR(base, duped);
  } catch {
    threw = true;
  }
  check("duplicate id in an IR throws", threw);

  console.log(
    failures === 0 ? "\nALL SELF-CHECKS PASSED" : `\n${failures} SELF-CHECK(S) FAILED`
  );
  return failures === 0 ? 0 : 1;
};
