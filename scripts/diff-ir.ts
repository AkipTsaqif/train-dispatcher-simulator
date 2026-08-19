// Structural diff of two topology IRs (Phase 9 Step 1).
//
// Usage:
//   bun scripts/diff-ir.ts <before> <after>   # compare two layouts' IRs
//   bun scripts/diff-ir.ts --self-check       # prove the differ detects change
//
// <before>/<after> are topology module names under app/topologies/ (e.g.
// "jatinegara", "ladder-fixture"), or paths to a module exporting one
// TopologyDefinition.
//
// Exit codes:  0 = identical | 1 = differences found | 2 = usage/load error
// `--allow-reorder` downgrades an ordering-only difference to success, per
// PLAN-phase-9.md ("may be accepted with a recorded reason").

import { diffIR, formatIRDiff } from "./lib/ir-diff";
import { selfCheck } from "./lib/ir-diff-selfcheck";
import type { TopologyDefinition } from "../app/lib/topology";

const args = process.argv.slice(2);

if (args.includes("--self-check")) {
  process.exit(await selfCheck());
}

const allowReorder = args.includes("--allow-reorder");
const positional = args.filter((a) => !a.startsWith("--"));

if (positional.length !== 2) {
  console.error("usage: bun scripts/diff-ir.ts <before> <after> [--allow-reorder]");
  console.error("       bun scripts/diff-ir.ts --self-check");
  process.exit(2);
}

/** Load the single TopologyDefinition exported by a topology module. */
const loadIR = async (ref: string): Promise<TopologyDefinition> => {
  const specifier = ref.includes("/") ? ref : `../app/topologies/${ref}`;
  let module: Record<string, unknown>;
  try {
    module = (await import(specifier)) as Record<string, unknown>;
  } catch (error) {
    console.error(`Cannot load topology "${ref}": ${(error as Error).message}`);
    process.exit(2);
  }
  const candidates = Object.entries(module).filter(
    ([, value]) =>
      value !== null &&
      typeof value === "object" &&
      Array.isArray((value as TopologyDefinition).nodes) &&
      Array.isArray((value as TopologyDefinition).edges) &&
      Array.isArray((value as TopologyDefinition).switches)
  );
  if (candidates.length !== 1) {
    console.error(
      `Expected exactly one TopologyDefinition export in "${ref}", found ${candidates.length}` +
        (candidates.length > 1 ? `: ${candidates.map(([k]) => k).join(", ")}` : "")
    );
    process.exit(2);
  }
  return candidates[0][1] as TopologyDefinition;
};

const [beforeRef, afterRef] = positional;
const diff = diffIR(await loadIR(beforeRef), await loadIR(afterRef));

console.log(`${beforeRef} -> ${afterRef}`);
console.log(formatIRDiff(diff));

if (diff.identical) process.exit(0);
if (diff.structurallyIdentical && allowReorder) {
  console.log("\nordering-only difference accepted (--allow-reorder)");
  process.exit(0);
}
process.exit(1);
