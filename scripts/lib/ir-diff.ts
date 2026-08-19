// ---------------------------------------------------------------------------
// Structural diff of two TopologyDefinitions (the compiler IR).
//
// Phase 9 Step 1. Authoring a layout from pieces means the IR is DERIVED, so
// the question "what did my one-line change actually do?" needs a fast, exact
// answer. A textual diff cannot give one: the assembler may legitimately emit
// the same graph with different collection ORDER, and a text diff drowns that
// in noise.
//
// So this diffs by IDENTITY, not by position:
//   • added / removed  — an entity id present on one side only;
//   • changed          — same id, different content (per-field detail);
//   • reordered        — SAME SET of ids, different sequence.
//
// PLAN-phase-9.md calls out that last class explicitly: ordering-only
// differences "are reported as a distinct class and may be accepted with a
// recorded reason". Keeping them separate is what lets Steps 4-5 demand an
// empty structural diff without being held hostage to incidental ordering.
//
// Content comparison reuses scripts/lib/serialize.ts, so it inherits the
// deterministic key sorting AND the float rounding that makes comparisons
// toolchain-independent (see SNAPSHOT_PRECISION there).
// ---------------------------------------------------------------------------

import { serialize } from "./serialize";
import type { TopologyDefinition } from "../../app/lib/topology";

export type FieldChange = { field: string; before: string; after: string };

export type EntityDiff = {
  collection: string;
  added: string[];
  removed: string[];
  changed: { id: string; fields: FieldChange[] }[];
  /** Same id set, different order. Ordering-only — see the header note. */
  reordered: boolean;
};

export type IRDiff = {
  collections: EntityDiff[];
  /** True when nothing at all differs, ordering included. */
  identical: boolean;
  /** True when no entity was added, removed, or changed. May still be reordered. */
  structurallyIdentical: boolean;
};

/** Stable identity for each IR collection. */
const KEYS = {
  nodes: (n: { id: string }) => n.id,
  edges: (e: { id: string }) => e.id,
  switches: (s: { id: number }) => String(s.id),
  controlGroups: (g: { id: string }) => g.id,
  signals: (s: { id: string }) => s.id,
  trackGroups: (g: { id: string }) => g.id,
  blockSections: (b: { id: string }) => b.id,
  // stationStopPoints have no id — identity is the placement itself.
  stationStopPoints: (p: {
    stationCode: string;
    edgeId: string;
    segmentIndex: number;
    offset: number;
  }) => `${p.stationCode}@${p.edgeId}[${p.segmentIndex}]+${p.offset}`,
} as const;

type CollectionName = keyof typeof KEYS;
const COLLECTION_NAMES = Object.keys(KEYS) as CollectionName[];

/** Per-field comparison so a "changed" entity says WHAT changed, not just that it did. */
const fieldChanges = (before: unknown, after: unknown): FieldChange[] => {
  const isPlain = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === "object" && !Array.isArray(v);
  if (!isPlain(before) || !isPlain(after)) {
    return [{ field: "(value)", before: serialize(before), after: serialize(after) }];
  }
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const out: FieldChange[] = [];
  for (const field of fields) {
    const b = serialize(before[field]);
    const a = serialize(after[field]);
    if (b !== a) out.push({ field, before: b, after: a });
  }
  return out;
};

const diffCollection = (
  collection: string,
  beforeItems: readonly unknown[],
  afterItems: readonly unknown[],
  keyOf: (item: never) => string
): EntityDiff => {
  const index = (items: readonly unknown[]) => {
    const map = new Map<string, unknown>();
    const order: string[] = [];
    for (const item of items) {
      const key = (keyOf as (i: unknown) => string)(item);
      if (map.has(key)) {
        throw new Error(`Duplicate ${collection} key in IR: ${key}`);
      }
      map.set(key, item);
      order.push(key);
    }
    return { map, order };
  };

  const before = index(beforeItems);
  const after = index(afterItems);

  const added = after.order.filter((k) => !before.map.has(k));
  const removed = before.order.filter((k) => !after.map.has(k));

  const changed: { id: string; fields: FieldChange[] }[] = [];
  for (const key of before.order) {
    if (!after.map.has(key)) continue;
    const b = before.map.get(key);
    const a = after.map.get(key);
    if (serialize(b) !== serialize(a)) changed.push({ id: key, fields: fieldChanges(b, a) });
  }

  // Ordering is only meaningful when the id SETS match; otherwise add/remove
  // already explains the sequence difference and flagging it too is noise.
  const sameSet = added.length === 0 && removed.length === 0;
  const reordered =
    sameSet && before.order.join("\u0000") !== after.order.join("\u0000");

  return { collection, added, removed, changed, reordered };
};

/** Structurally diff two topology IRs. */
export const diffIR = (
  before: TopologyDefinition,
  after: TopologyDefinition
): IRDiff => {
  const collections = COLLECTION_NAMES.map((name) =>
    diffCollection(name, before[name], after[name], KEYS[name] as (i: never) => string)
  );

  // legacyNodeOrder is a bare string[] — a pure ordering artifact, so it is
  // reported as its own pseudo-collection rather than forced into KEYS.
  const beforeOrder = [...before.legacyNodeOrder];
  const afterOrder = [...after.legacyNodeOrder];
  const beforeSet = new Set(beforeOrder);
  const afterSet = new Set(afterOrder);
  collections.push({
    collection: "legacyNodeOrder",
    added: afterOrder.filter((id) => !beforeSet.has(id)),
    removed: beforeOrder.filter((id) => !afterSet.has(id)),
    changed: [],
    reordered:
      afterOrder.filter((id) => !beforeSet.has(id)).length === 0 &&
      beforeOrder.filter((id) => !afterSet.has(id)).length === 0 &&
      beforeOrder.join("\u0000") !== afterOrder.join("\u0000"),
  });

  const structurallyIdentical = collections.every(
    (c) => c.added.length === 0 && c.removed.length === 0 && c.changed.length === 0
  );
  const identical = structurallyIdentical && collections.every((c) => !c.reordered);

  return { collections, identical, structurallyIdentical };
};

/** Human-readable report. `maxPerClass` bounds runaway output. */
export const formatIRDiff = (diff: IRDiff, maxPerClass = 20): string => {
  const lines: string[] = [];
  for (const c of diff.collections) {
    const touched =
      c.added.length > 0 || c.removed.length > 0 || c.changed.length > 0 || c.reordered;
    if (!touched) continue;

    lines.push(`\n${c.collection}:`);
    const list = (label: string, ids: string[]) => {
      if (ids.length === 0) return;
      lines.push(`  ${label} (${ids.length}):`);
      for (const id of ids.slice(0, maxPerClass)) lines.push(`    ${id}`);
      if (ids.length > maxPerClass) {
        lines.push(`    ... and ${ids.length - maxPerClass} more`);
      }
    };
    list("added", c.added);
    list("removed", c.removed);

    if (c.changed.length > 0) {
      lines.push(`  changed (${c.changed.length}):`);
      for (const item of c.changed.slice(0, maxPerClass)) {
        lines.push(`    ${item.id}`);
        for (const f of item.fields.slice(0, 6)) {
          const oneLine = (s: string) => s.replace(/\s+/g, " ").slice(0, 100);
          lines.push(`      ${f.field}: ${oneLine(f.before)} -> ${oneLine(f.after)}`);
        }
        if (item.fields.length > 6) {
          lines.push(`      ... and ${item.fields.length - 6} more field(s)`);
        }
      }
      if (c.changed.length > maxPerClass) {
        lines.push(`    ... and ${c.changed.length - maxPerClass} more`);
      }
    }

    if (c.reordered) {
      lines.push("  REORDERED (same ids, different sequence — ordering-only)");
    }
  }

  if (lines.length === 0) return "IR diff: IDENTICAL (no structural or ordering differences)";

  const verdict = diff.identical
    ? "IDENTICAL"
    : diff.structurallyIdentical
      ? "ORDERING-ONLY (no entity added, removed, or changed)"
      : "STRUCTURAL DIFFERENCES";
  return `IR diff: ${verdict}${lines.join("\n")}`;
};
