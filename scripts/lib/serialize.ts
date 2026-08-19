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
//
// FLOAT NORMALIZATION. Full float64 precision makes a baseline
// TOOLCHAIN-DEPENDENT: the same computation can differ in the last binary
// digit across JS engine versions, so a runtime upgrade turns `verify-layout`
// red with 1-ULP noise and no behavior change (observed: 16 bearing dx/dy
// lines, max relative deviation 1.6e-16, after moving to bun 1.3.10 /
// node 24). Every serialized number is therefore rounded to
// SNAPSHOT_PRECISION significant digits.
//
// Choosing 12: ULP noise is ~2.2e-16 relative, so 1e-12 sits four orders of
// magnitude above it — far enough to absorb engine drift, and far below any
// geometric change that could matter (map coordinates are integers; bearings
// are unit vectors, where 1e-12 is ~0.06 nanometres over a 60 km corridor).
// A real regression cannot hide under this rounding; ULP noise cannot survive
// it.
//
// Residual risk: a value sitting exactly on the 12th-digit rounding boundary
// could still flip between two representations under drift. That is a 1-line
// diff with an obviously-noise shape — not silent corruption.
// ---------------------------------------------------------------------------

/** Significant digits kept for every serialized number. See the note above. */
export const SNAPSHOT_PRECISION = 12;

/**
 * Round to SNAPSHOT_PRECISION significant digits, so engine-level ULP drift
 * cannot change the serialized text. Integers round-trip exactly (496 stays
 * 496, not "496.000000000"), and 0 / -0 / huge / tiny values are left to
 * JSON.stringify's own canonical form.
 */
const normalizeNumber = (value: number): number => {
  if (value === 0 || !Number.isFinite(value)) return value;
  return Number.parseFloat(value.toPrecision(SNAPSHOT_PRECISION));
};

type Tagged =
  | { $undefined: true }
  | { $inf: 1 | -1 }
  | { $nan: true }
  | { $set: Tagged[] }
  | { $map: [Tagged, Tagged][] }
  | { [key: string]: Tagged }
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
    return normalizeNumber(value);
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
