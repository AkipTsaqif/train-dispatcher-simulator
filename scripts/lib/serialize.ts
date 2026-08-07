// ---------------------------------------------------------------------------
// Deterministic serializer for layout/runtime snapshots.
//
// The equivalence harness needs byte-identical output before and after a
// refactor. Plain JSON is not enough:
//   • object key order would follow insertion order (unstable),
//   • `undefined` becomes `null` or disappears,
//   • `Infinity` / `-Infinity` become `null`,
//   • `Set` / `Map` are not representable.
//
// This serializer canonicalizes values into a JSON-safe tagged structure with
// SORTED object keys and PRESERVED array/Set/Map iteration order, then pretty
// prints it. Functions are rejected (snapshots only project data — a function
// leaking into a projection is a bug).
// ---------------------------------------------------------------------------

type Tagged =
  | { $undefined: true }
  | { $inf: 1 | -1 }
  | { $nan: true }
  | { $set: Tagged[] }
  | { $map: [Tagged, Tagged][] }
  | Record<string, Tagged>
  | Tagged[]
  | string
  | number
  | boolean
  | null;

const toCanonical = (value: unknown): Tagged => {
  if (value === undefined) return { $undefined: true };
  if (typeof value === "number") {
    if (Number.isNaN(value)) return { $nan: true };
    if (value === Infinity) return { $inf: 1 };
    if (value === -Infinity) return { $inf: -1 };
    return value;
  }
  if (value instanceof Set) {
    return { $set: [...value].map(toCanonical) };
  }
  if (value instanceof Map) {
    return {
      $map: [...value.entries()].map(([k, v]) => [toCanonical(k), toCanonical(v)] as [Tagged, Tagged]),
    };
  }
  if (Array.isArray(value)) return value.map(toCanonical);
  if (typeof value === "function") {
    throw new Error(`Cannot serialize a function: ${String(value)}`);
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, Tagged> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = toCanonical((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value as Tagged;
};

/** Serialize any data value to a stable, diffable multi-line string. */
export const serialize = (value: unknown): string =>
  JSON.stringify(toCanonical(value), null, 2);
