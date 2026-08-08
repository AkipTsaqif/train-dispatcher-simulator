// Verifies a layout against its committed baseline snapshot. Exits nonzero on
// any difference and prints a short human-readable diff summary. Line endings
// are normalized so git's CRLF checkout does not false-fail.
//
// Usage:
//   bun scripts/verify-layout.ts <layoutId>

import { readFileSync } from "node:fs";
import { baselinePath, buildSnapshot, LAYOUT_IDS } from "./lib/snapshot";

const layoutId = process.argv[2];
if (!layoutId || !LAYOUT_IDS.includes(layoutId as (typeof LAYOUT_IDS)[number])) {
  console.error(`usage: bun scripts/verify-layout.ts <${LAYOUT_IDS.join(" | ")}>`);
  process.exit(2);
}

const normalize = (s: string): string => s.replaceAll("\r", "");

const run = async (): Promise<void> => {
  const actual = normalize(await buildSnapshot(layoutId));
  const expected = normalize(readFileSync(baselinePath(layoutId), "utf8"));

  if (actual === expected) {
    console.log(`verify ${layoutId}: OK — byte-identical to the committed baseline`);
    process.exit(0);
  }

  const expectedLines = expected.split("\n");
  const actualLines = actual.split("\n");
  const maxLines = Math.max(expectedLines.length, actualLines.length);
  let firstDiff = -1;
  for (let i = 0; i < maxLines; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      firstDiff = i;
      break;
    }
  }
  console.error(
    `verify ${layoutId}: FAIL — ${expectedLines.length} expected lines, ` +
      `${actualLines.length} actual lines, first difference at line ${firstDiff + 1}`
  );
  for (let i = Math.max(0, firstDiff - 2); i < Math.min(maxLines, firstDiff + 6); i++) {
    if (expectedLines[i] !== actualLines[i]) {
      console.error(`  - ${expectedLines[i] ?? "(end)"}`);
      console.error(`  + ${actualLines[i] ?? "(end)"}`);
    }
  }
  process.exit(1);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
