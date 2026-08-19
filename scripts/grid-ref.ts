// Translate between authored coordinates and the on-screen grid reference
// (column letters across the top/bottom, row numbers down the sides).
//
// Why this exists: when you read a position off the rendered diagram you get
// something like "AG6", but every layout file is authored in raw coordinates.
// Converting by hand needs three numbers that differ per layout, and getting
// one wrong puts a crossover on the wrong track.
//
// Nothing here is hard-coded per layout. The pitch, offset, label step, and
// shift are READ FROM THE MAP, so this cannot drift out of sync with what the
// component actually draws.
//
// Usage:
//   bun scripts/grid-ref.ts AG6                 # ref  -> coordinates
//   bun scripts/grid-ref.ts 528 336             # x y  -> ref
//   bun scripts/grid-ref.ts --layout bekasi H3  # pick a layout (default jng)
//   bun scripts/grid-ref.ts --list              # show every layout's grid
//   bun scripts/grid-ref.ts --self-check        # prove the mapping round-trips
//
// Exit codes: 0 ok | 1 self-check failed | 2 usage error

import type { DispatchMapDefinition } from "../app/lib/dispatch-map";

// ---------------------------------------------------------------------------
// Layout registry. Aliases are what a human actually types.
// ---------------------------------------------------------------------------
const LAYOUTS: Record<string, { module: string; aliases: readonly string[] }> = {
  jatinegara: { module: "../app/maps/jatinegara", aliases: ["jng", "jat"] },
  "bekasi-tambun-cibitung": {
    module: "../app/maps/bekasi-tambun-cibitung",
    aliases: ["bekasi", "bks", "btc"],
  },
};

const resolveLayoutId = (name: string): string => {
  const key = name.toLowerCase();
  if (LAYOUTS[key]) return key;
  for (const [id, meta] of Object.entries(LAYOUTS)) {
    if (meta.aliases.includes(key)) return id;
  }
  const known = Object.entries(LAYOUTS)
    .map(([id, m]) => `${id} (${m.aliases.join(", ")})`)
    .join("\n  ");
  throw new Error(`Unknown layout "${name}". Known layouts:\n  ${known}`);
};

/**
 * The grid geometry the component uses, resolved exactly as
 * dispatching-table.tsx resolves it.
 */
export type GridSpec = {
  layoutId: string;
  /** Visual grid pitch. Defaults to the sim cell size. */
  pitch: number;
  /** Grid origin (top-left of cell A1). */
  offset: readonly [number, number];
  /** A label is drawn every Nth cell. */
  labelStep: number;
  /**
   * Grid-mode diagrams translate the whole diagram right by this much, so
   * AUTHORED coordinates are not screen coordinates. Schematic layouts do not
   * shift, and this is 0 for them.
   */
  shift: number;
  /** Whether the grid chrome is drawn at all. */
  shown: boolean;
};

const gridSpecOf = (layoutId: string, map: DispatchMapDefinition): GridSpec => {
  const p = map.presentation;
  const isSchematic = p.kind === "schematic";
  return {
    layoutId,
    pitch: p.gridCellSize ?? map.grid.cellSize,
    offset: p.gridOffset ?? [0, 0],
    labelStep: p.gridLabelStep ?? 1,
    // Only grid-mode diagrams are translated; a schematic draws where authored.
    shift: isSchematic ? 0 : map.grid.shift,
    shown: !isSchematic || p.grid === true,
  };
};

const loadGridSpec = async (name: string): Promise<GridSpec> => {
  const layoutId = resolveLayoutId(name);
  const mod = await import(LAYOUTS[layoutId].module);
  const map = Object.values(mod).find(
    (v): v is DispatchMapDefinition =>
      typeof v === "object" && v !== null && "grid" in v && "presentation" in v
  );
  if (!map) throw new Error(`No DispatchMapDefinition exported from ${LAYOUTS[layoutId].module}`);
  return gridSpecOf(layoutId, map);
};

// ---------------------------------------------------------------------------
// Column letters: spreadsheet style, 0-based (A=0, Z=25, AA=26).
// Mirrors colsName/colIdx in app/components/dispatching-table.tsx.
// ---------------------------------------------------------------------------
export const columnName = (index: number): string => {
  let n = index;
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
};

export const columnIndex = (letters: string): number => {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

// ---------------------------------------------------------------------------
// The conversion. Coordinates address cell CENTRES, which is why the half
// pitch appears on both sides.
// ---------------------------------------------------------------------------

/**
 * Authored [x, y] -> grid reference, e.g. [528, 336] -> "AG6".
 *
 * An EXACT hit returns a bare ref. Anything off the lattice returns a ref
 * prefixed with `~` plus the fractional position, because rounding silently
 * would turn "your coordinate is 4px off" into a confidently wrong answer.
 *
 * Whether a layout's coordinates land on the lattice at all is a property of
 * the layout, not of this tool: Jatinegara was authored on its grid and every
 * endpoint lands exactly, while Bekasi's tracks sit at free-form Ys (89, 148,
 * 205, 264 against a 58-unit pitch) and only some of its signals are on a
 * column centre. For Bekasi the fractional form is the honest answer.
 */
export const toRef = (x: number, y: number, g: GridSpec): string => {
  const col = (x + g.shift - g.offset[0] - g.pitch / 2) / (g.pitch * g.labelStep);
  const row = (y - g.offset[1] - g.pitch / 2) / (g.pitch * g.labelStep) + 1;
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2));
  if (!Number.isInteger(col) || !Number.isInteger(row)) {
    return `~${columnName(Math.round(col))}${Math.round(row)} (off-lattice: col ${fmt(col)}, row ${fmt(row)})`;
  }
  return `${columnName(col)}${row}`;
};

/** True when [x, y] lands exactly on a labelled cell centre. */
export const isOnLattice = (x: number, y: number, g: GridSpec): boolean =>
  !toRef(x, y, g).startsWith("~");

/** Grid reference -> authored [x, y], e.g. "AG6" -> [528, 336]. */
export const fromRef = (ref: string, g: GridSpec): [number, number] => {
  const m = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`"${ref}" is not a grid reference (expected letters then digits, e.g. AG6)`);
  const x = g.offset[0] + columnIndex(m[1]) * g.pitch * g.labelStep + g.pitch / 2 - g.shift;
  const y = g.offset[1] + (Number(m[2]) - 1) * g.pitch * g.labelStep + g.pitch / 2;
  return [x, y];
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const usage = () => {
  console.log(`Translate between authored coordinates and grid references.

  bun scripts/grid-ref.ts <ref>              e.g. AG6   -> [528, 336]
  bun scripts/grid-ref.ts <x> <y>            e.g. 528 336 -> AG6
  bun scripts/grid-ref.ts --layout <name> …  default: jatinegara
  bun scripts/grid-ref.ts --list             show each layout's grid geometry
  bun scripts/grid-ref.ts --self-check       verify against real layout data

Layouts: ${Object.entries(LAYOUTS)
    .map(([id, m]) => `${id} (${m.aliases.join(", ")})`)
    .join(", ")}`);
};

const describe = (g: GridSpec) =>
  `${g.layoutId}: pitch ${g.pitch}, offset [${g.offset.join(", ")}], ` +
  `labelStep ${g.labelStep}, shift ${g.shift}${g.shown ? "" : " (grid not drawn)"}`;

const selfCheck = async (): Promise<number> => {
  let failures = 0;
  const check = (name: string, ok: boolean, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  — ${detail}`}`);
    if (!ok) failures++;
  };

  // Jatinegara: every real piece endpoint must round-trip exactly. This is the
  // load-bearing check - it runs against the actual layout, not fixtures.
  const jng = await loadGridSpec("jatinegara");
  const { JATINEGARA_PIECES } = await import("../app/pieces/jatinegara");
  const points: [number, number][] = [];
  for (const piece of JATINEGARA_PIECES.pieces) {
    if (piece.kind === "link") points.push([...piece.from], [...piece.to]);
    else if (piece.kind === "line") points.push([piece.from, piece.y], [piece.to, piece.y]);
  }
  const broken = points.filter(([x, y]) => {
    const ref = toRef(x, y, jng);
    if (ref.startsWith("~")) return true;
    const [bx, by] = fromRef(ref, jng);
    return bx !== x || by !== y;
  });
  check(
    `jatinegara: all ${points.length} piece endpoints round-trip`,
    broken.length === 0,
    `${broken.length} failed, first ${JSON.stringify(broken[0])}`
  );

  // Known-good anchors, read off the rendered diagram.
  check("jatinegara: [528,336] is AG6", toRef(528, 336, jng) === "AG6", toRef(528, 336, jng));
  check("jatinegara: AG6 is [528,336]", JSON.stringify(fromRef("AG6", jng)) === "[528,336]");
  check("jatinegara: t1 (y=496) is row 16", toRef(32, 496, jng).endsWith("16"), toRef(32, 496, jng));

  // Bekasi exercises the shift path: its diagram is translated, so an
  // authored x is NOT a screen x. A layout with shift 0 would hide this bug.
  const bks = await loadGridSpec("bekasi");
  check("bekasi: grid geometry differs from jatinegara", bks.pitch !== jng.pitch || bks.shift !== jng.shift,
    `bekasi ${bks.pitch}/${bks.shift} vs jng ${jng.pitch}/${jng.shift}`);
  check("bekasi: shift is applied (non-zero)", bks.shift !== 0, `shift ${bks.shift}`);
  const probe: [number, number] = [bks.pitch / 2 - bks.shift, bks.pitch / 2];
  check(`bekasi: cell-A1 centre round-trips`, toRef(...probe, bks) === "A1", toRef(...probe, bks));
  check("bekasi: A1 maps back", JSON.stringify(fromRef("A1", bks)) === JSON.stringify(probe));
  // Bekasi's real geometry is NOT on the lattice - it is free-form within a
  // column grid. Assert that, so a future change that silently starts
  // rounding Bekasi coordinates is caught here.
  const { BEKASI_TAMBUN_CIBITUNG_DISPATCH } = await import(
    "../app/dispatching/bekasi-tambun-cibitung"
  );
  const sig = BEKASI_TAMBUN_CIBITUNG_DISPATCH.map.signals.items;
  const offLattice = sig.filter((s) => !isOnLattice(s.x, s.y, bks));
  check(
    `bekasi: off-lattice signals are flagged, not rounded (${offLattice.length}/${sig.length})`,
    offLattice.length > 0,
    "expected Bekasi's free-form Ys to be reported as off-lattice"
  );

  // Off-lattice coordinates must be reported, never silently rounded.
  check("off-centre coordinate is flagged", toRef(529, 336, jng).startsWith("~"), toRef(529, 336, jng));

  // Column letters roll over correctly past Z.
  check("column letters roll over (Z, AA, AO)",
    columnName(25) === "Z" && columnName(26) === "AA" && columnName(40) === "AO");
  check("column letters invert", [0, 25, 26, 40, 69].every((i) => columnIndex(columnName(i)) === i));

  console.log(failures === 0 ? "\nALL GRID-REF CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  return failures === 0 ? 0 : 1;
};

const main = async (): Promise<number> => {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    usage();
    return argv.length === 0 ? 2 : 0;
  }
  if (argv[0] === "--self-check") return selfCheck();
  if (argv[0] === "--list") {
    for (const name of Object.keys(LAYOUTS)) console.log(describe(await loadGridSpec(name)));
    return 0;
  }

  let layout = "jatinegara";
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--layout" || argv[i] === "-l") layout = argv[++i] ?? "";
    else rest.push(argv[i]);
  }
  const g = await loadGridSpec(layout);

  if (rest.length === 1) {
    const [x, y] = fromRef(rest[0], g);
    console.log(`${rest[0].toUpperCase()} = [${x}, ${y}]   (${describe(g)})`);
    return 0;
  }
  if (rest.length === 2) {
    const x = Number(rest[0]);
    const y = Number(rest[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.error(`Not a coordinate pair: ${rest.join(" ")}`);
      return 2;
    }
    console.log(`[${x}, ${y}] = ${toRef(x, y, g)}   (${describe(g)})`);
    return 0;
  }
  usage();
  return 2;
};

process.exit(
  await main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  })
);
