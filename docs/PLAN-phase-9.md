# Phase 9 — Piece assembly (authored pieces → topology IR)

## Goal

Give the author a **piece vocabulary** that describes a layout the way it is
drawn — tracks, crossovers, platforms, termini, flyovers — and let an
**assembler** derive the `TopologyDefinition` from it. Pieces connect by port
coincidence in space, not by id reference: the author places pieces, the
assembler connects the dots.

`compileTopology` is not modified by this phase. `TopologyDefinition` stops
being the hand-authoring surface for new layouts and becomes an intermediate
representation (IR).

```
pieces  (new, app/pieces/<slug>.ts)
   ↓  assemblePieces()   — new, app/lib/piece-assembly.ts
TopologyDefinition (IR)
   ↓  compileTopology()  — UNCHANGED
CompiledTopology → runtime
```

## Problem being solved

Authoring a single switch today costs three edge-end references that must stay
consistent with edges declared hundreds of lines earlier:

```ts
{ id: 7, nodeId: "s464x176",
  common:   { edgeId: "e-t2-144-176", end: "to" },
  normal:   { edgeId: "e-t2-176-336", end: "from" },
  reversed: { edgeId: "d-xov2",       end: "from" }, ... }
```

Jatinegara has 58 switches and 29 crossovers, which is why
`scripts/gen-jatinegara.py` exists. The generator is table-driven, so every
decision it makes is a global sweep — e.g. *extend all 8 lines to the map
boundary so every junction keeps a through axis*. There is no place to express
an exception for one junction. Hand-editing the emitted `.ts` works until the
next regeneration overwrites it.

The deficiency is not compiler modularity. It is that **there is no vocabulary
for local intent.**

## Non-goals

- No change to `compileTopology`, `train-engine.ts`, `route-search.ts`, or any
  movement/reservation/interlocking algorithm.
- Bekasi is **not** ported. It stays on its hand-authored `TopologyDefinition`
  permanently, so `scripts/baselines/bekasi-tambun-cibitung.snapshot.txt` stays
  byte-identical by construction — nothing in Bekasi's path changes.
- No visual editor, no GUI. Pieces are TypeScript, reviewable in a diff.
- Block sections, route search, and flank protection stay globally derived.
  Piece-local authoring of section coverage is explicitly rejected (see
  Rejected alternatives).

## The piece model

### Ports and coincidence

Every piece exposes **ports**. A port is a position plus an outward bearing:

```ts
type Port = {
  point: TopologyPoint;   // absolute map coordinate
  bearing: Bearing;       // outward, i.e. leaving the piece
  level?: number;         // grade level, default 0
  groupId: string;        // owning track group
};
```

Joining rule, applied by the assembler:

- Two ports at the same point **and the same level** with opposing bearings
  (`bearingDot < 0`) join into one node.
- Three or more ports at one point and level imply a **switch**: the pair whose
  bearings are most nearly collinear becomes common/normal; each remaining port
  becomes a reversed leg. Ambiguity is an error, not a guess.
- Ports at the same point but **different levels** do not join. This is the
  existing flyover rule and needs no new machinery.
- Coincidence uses exact integer coordinates. No epsilon, no rounding — matching
  the existing "preserve exact coordinates" contract in `ADDING_LAYOUTS.md`.

The author never types an edge id. Ids are derived, which removes the entire
class of dangling-reference bugs that `topology.ts` validation currently exists
to catch.

### Vocabulary (v1)

| Piece | Declares | Assembler derives |
|---|---|---|
| `track` | line y, x-range, groupId, normal direction, bidirectional? | edge, geometry, render slot, boundary nodes at free ends |
| `crossover` | groupA, groupB, x-range, direction | 2 diverting edges, 4 switches, reciprocal reversed ports, control group |
| `platform` | station code, track groupId, x-range | `stationStopPoints`, platform length, stop x |
| `terminus` | track groupId, which end | terminating node; **Phase 8's problem solved by vocabulary** |
| `flyover` | groupId, x-range, level, ramp extents | leveled edges, level transitions |
| `signal` | groupId, x, facing, mount, flags | edge+segment+offset resolution, protected block section |
| `loop` | groupId, x-range, attach-to main group | loop edge, both-end reciprocal switches, envelope |

Every piece carries an optional `intent?: string`, following the precedent of
the mandatory `reason` on `RenderEndpointOverride`. Local deviations from the
drawing get recorded in the piece that causes them instead of in a header
comment.

### What stays global

Block sections, control-group coupling, flank protection and route search are
properties of the whole graph. A piece can say *where* a signal is; it cannot
know *what its section covers* without solving a graph problem. These remain
assembler-derived, with per-piece override available where the derivation is
wrong. Attempting to author them per-piece reintroduces exactly the
hand-maintenance burden this phase removes.

## Staged path

Each step ends green on the full gate sequence. Steps 1–2 ship value before any
piece type exists.

### Step 1 — IR diffing

`scripts/diff-ir.ts`: structural diff of two `TopologyDefinition`s (added,
removed, changed nodes/edges/switches/signals/sections), reusing the
`snapshot-layout.ts` approach.

This comes first deliberately. Iterating on taste requires seeing what one
change did. Without it, a local generator is as opaque as the global one.

Gate: new `verify:diff-ir` self-check passes; no production code touched.

### Step 2 — terminating switches in the compiler

The compiler half of Phase 8, which is needed regardless of authoring surface:
support a track end that genuinely ends, with no through axis. This is a
`compileTopology` capability change and the one place this plan touches the
compiler.

Gate: `tsc --noEmit`, `build`, `test:e2e`, all four probes, `verify:bekasi`
byte-identical, `verify:jatinegara` 11/11.

### Step 3 — port join kernel

`app/lib/piece-assembly.ts` with `Port`, coincidence join, switch inference,
level separation. Pure function, no piece types yet. Unit-tested against
hand-built port sets, including the ambiguity error paths.

Gate: `tsc`, kernel tests, existing gates unchanged.

### Step 4 — `track` + `crossover` + `terminus`

Enough vocabulary to express a throat. Prove it on `ladder-fixture` and
`three-main-fixture`: assemble from pieces, diff the result against the
checked-in IR with `diff-ir`, require empty diff.

Gate: above, plus empty IR diff on both fixtures.

### Step 5 — `platform`, `signal`, `loop`, `flyover`

Completes v1. Prove `loops-fixture` and `flyover-fixture` the same way — empty
IR diff against their checked-in definitions.

Gate: above, plus empty IR diff on all four fixtures.

### Step 6 — port Jatinegara

Author `app/pieces/jatinegara.ts`. Its emitted IR need **not** match the current
generated file — the point is to fix the taste problems, including the stub
tracks 5–8 boundary extension, now expressible as `terminus` pieces.

Acceptance: `verify-jatinegara.ts`'s 11 checks become the acceptance test for
the assembler itself, updated for true drawn extents (6 tracks at each
boundary, 8 through the platforms).

Gate: full sequence, with `verify:jatinegara` re-pointed at the assembled IR.

### Step 7 — retire the generator, document the contract

Delete `scripts/gen-jatinegara.py`. Add a piece-authoring section to
`app/ADDING_LAYOUTS.md` describing pieces as the path for new layouts and the
hand-authored IR as the legacy path Bekasi remains on.

Gate: full sequence.

## Risks

**Switch inference ambiguity.** Three ports meeting where the collinear pair is
not obvious. Mitigation: hard error naming the point and the competing bearings,
with an explicit per-piece override to disambiguate. Never guess.

**Render slot stability.** Slots must be contiguous from zero with no
duplicates. Derived ordering must be deterministic across runs or diffs become
noise. Mitigation: sort by a stable key (level, y, x, groupId) and assert
contiguity in the assembler.

**Fixture IR drift.** Steps 4–5 demand byte-equal IR from a different authoring
route, which may prove impossible for incidental ordering reasons. Mitigation:
`diff-ir` compares structurally, not textually; ordering-only differences are
reported as a distinct class and may be accepted with a recorded reason.

**Scope creep into the compiler.** Any piece that seems to need a
`compileTopology` change is out of scope for this phase — stop and raise it, per
the existing engine-change rule in `ADDING_LAYOUTS.md`.

## Rejected alternatives

- **Fix `gen-jatinegara.py`.** Rejected: a table-driven emitter can only make
  global decisions; that is the root cause, not an implementation detail.
- **Hand-edit generated topology.** Rejected: lost on next regeneration.
- **Piece-authored block sections.** Rejected: sections are graph-global;
  per-piece authoring restores the hand-maintenance burden for 23 signals.
- **Port Bekasi to pieces.** Rejected: risks the byte-identical baseline for no
  benefit. Bekasi's hand-authored IR is permanent.
- **Piece vocabulary before IR diffing.** Rejected: without a fast
  change→diff→verdict loop, iteration on taste is not possible.
- **Executing Phase 8 as originally written.** Its authoring half edits a
  generator this phase deletes. The compiler half is kept as Step 2.

## Gate sequence

```
npx tsc --noEmit
npm run build
npm run test:e2e
bun scripts/verify-three-main.ts
bun scripts/verify-loops.ts
bun scripts/verify-routes.ts
bun scripts/verify-flyover.ts
npm run verify:bekasi      # must stay byte-identical
npm run verify:jatinegara  # 11 checks
```
