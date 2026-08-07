// Writes the canonical baseline snapshot for a layout. The snapshot is the
// "before camera" — commit it, then any refactor must produce a byte-identical
// snapshot via scripts/verify-layout.ts.
//
// Usage:
//   bun scripts/snapshot-layout.ts [layoutId]
// (layoutId defaults to "bekasi-tambun-cibitung")

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { baselinePath, buildSnapshot, LAYOUT_IDS } from "./lib/snapshot";

const layoutId = process.argv[2] ?? LAYOUT_IDS[0];

const run = async (): Promise<void> => {
  const snapshot = await buildSnapshot(layoutId);
  const outPath = baselinePath(layoutId);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, snapshot, "utf8");
  console.log(`snapshot written: ${outPath} (${snapshot.length} bytes)`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
