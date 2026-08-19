# Refactor: stable switch-control identity for JNG pieces

## Problem Statement

Moving a JNG point today costs far more than it should. Physical geometry is
one line (`app/pieces/jatinegara.ts`'s `link` endpoint), but `switchMeta` is
keyed by the DERIVED numeric switch id — a number computed by walking every
link endpoint in (line order, x-ascending) order and dropping the fixed
turns. Any geometry edit that changes which endpoints are interior vs.
extremity, or their relative x order, can silently renumber every switch
after the edit point. Since `switchMeta`, control groups, and the verifier's
expected counts all key off that number, a renumbering reattaches levers to
the wrong physical point with no error — a silent correctness bug, not a
build failure.

Separately, `JATINEGARA_LEGACY_NODE_ORDER` (74 hand-listed node ids) exists
"because the ladder interleaves loop midpoints" — a justification that does
not apply to JNG, which has no loops. It may be pure dead weight.

Block sections (`edgeRanges` naming every split edge in a span) are the
sharpest edge of the current pain — a mid-span split touches every section
crossing that span — but redesigning them is an engine-level change per
`ADDING_LAYOUTS.md`'s standing rule and needs separate approval. This
refactor does not touch them; it produces a scoped decision document instead.

## Solution

Rekey `SwitchMeta` from `Record<number, {...}>` to
`Record<string, {...}>` where the string key is `"<linkId>:<end>"` — an
identity the author already writes on the `link` piece itself, so it cannot
drift out of sync with a geometry edit the way a derived number can.

Scope, per the three explicit decisions this refactor implements:

1. **Geometry + operations only.** The assembler still derives *only*
   physical track splits and switch wiring. Signals, stop points, and block
   sections remain explicit, author-maintained operational data — this
   refactor does not add vocabulary for them.
2. **Stable identity is `linkId:end`.** Not a physical label, not the
   derived number. It survives reordering/renumbering because it names the
   piece the author wrote, not a position in a derived sequence.
3. **Block sections: investigate only.** A spike doc is produced with an
   explicit adopt/defer/reject recommendation. No schema change lands in this
   refactor.

`app/pieces/jatinegara.ts` is the only production consumer of `switchMeta`
today (flyover/loops/ladder/three-main fixtures declare switches inline on
`crossover`/`loop` pieces already, bypassing `switchMeta` entirely), so the
blast radius of the rekey is one type, one lookup site, and one data table.

## Commits

1. **Rekey the `SwitchMeta` type and its lookup in `app/lib/pieces.ts`.**
   Change `SwitchMeta = Record<number, {...}>` to
   `Record<string, {...}>`. In `expandLines`, the `ends` array already knows
   its owning `link` and which `end` ("from"/"to") it is — build the lookup
   key as `` `${link.id}:${end}` `` instead of `switchIdAt`'s numeric id, and
   look up `switchMeta[key]` instead of `switchMeta[id]`. The derived
   numeric switch `id` remains — it is still what `TopologySwitch.id` needs,
   still assigned by the existing (line order, x-ascending) walk — only the
   *lookup key into the author's table* changes.
   Error message on a missing key must name both the derived id and the
   `linkId:end` key, so a stale entry is diagnosable either way.
   → verify: `bunx tsc --noEmit` (no fixture calls `switchMeta` yet, so this
   compiles but nothing exercises the new path — that is commit 2).

2. **Rekey `app/pieces/jatinegara.ts`'s `switchMeta` table.** Replace each
   numeric key with its `linkId:end` per the mapping already derived and
   verified against the running code:
   ```
   1:xov1:from    2:xov5:from    3:xov6:to      4:xov23:to     5:xov25:to
   6:xov1:to      7:xov2:from    8:xov6:from    9:xov5:to     10:xov26:from
   11:xov21:to   12:xov23:from  13:xov22:to    14:xov25:from  15:xov2:to
   16:xov3:from  17:xov4:to     18:xov26:to    19:xov19:to    20:xov21:from
   21:xov20:to   22:xov22:from  23:xov24:from  24:xov28:from  25:xov4:from
   26:xov3:to    27:xov7:to     28:xov11:from  29:xov15:to    30:xov19:from
   31:xov16:to   32:xov20:from  33:xov24:to    34:xov27:from  35:xov28:to
   36:xov29:from 38:xov11:to    40:xov8:from   41:xov9:to     42:xov7:from
   43:xov10:from 44:xov14:to    46:xov9:from   47:xov8:to     48:xov12:from
   49:xov13:to   50:xov16:from  52:xov12:to
   ```
   Control-group ownership (`PC1`..`PC20`, `g29`/`g31`/`g34`/`g36`/`g43`/
   `g44`/`g49`/`g50`) and every `label` stay byte-for-byte the same as
   today — only the map's keys change, not its values.
   → verify: `bun run verify:jatinegara:baseline` — must stay byte-identical.
   This migration changes only the authoring key, never the compiled output,
   so ANY diff here is a mapping error, not an intended change.

3. **Fail loudly on an orphaned or mistyped `switchMeta` key.** After
   `expandLines` finishes assigning switch ids, assert every key in the
   author's `switchMeta` was consumed by some link+end during the walk;
   throw naming the unused key(s) if not. This turns "I renamed a link and
   forgot to update its lever" from a silent gap (switch left with no
   control group, caught late or not at all) into a build-time error.
   → verify: temporarily rename one `switchMeta` key in a scratch copy,
   confirm the new check throws naming it; `bun run verify:jatinegara` and
   `bun run verify:pieces` still pass on the real files.

4. **Drop `JATINEGARA_LEGACY_NODE_ORDER` from the passthrough, gated on
   proof.** Already verified: calling `assemblePieces` with that passthrough
   field omitted produces a `nodes` array identical byte-for-byte to the
   committed 74-entry list (checked directly against the running code before
   this plan was written). Remove the constant from
   `app/pieces/jatinegara-data.ts` and its passthrough entry in
   `app/pieces/jatinegara.ts`; the assembler's default (`nodes.map(n =>
   n.id)`, i.e. placement order) takes over.
   → verify: `bun run verify:jatinegara:baseline` byte-identical (this field
   feeds `legacyNodeOrder` in the IR, which is part of what the baseline
   projects) plus `bun run verify:jatinegara`.

5. **Preflight edge-reference validation in `assemblePieces`.** Before
   handing the assembled `TopologyDefinition` to the caller, check that
   every `passthrough.signals[].edgeId`, every
   `passthrough.blockSections[].edgeRanges[].edgeId`, and every
   `passthrough.stationStopPoints[].edgeId` names an edge that actually
   exists in the assembled `edges` array. Throw naming the offending id and
   which table it came from. This is what turns a mid-span geometry edit
   that silently orphans a signal reference into an error at the assembly
   boundary instead of a cryptic failure inside `compileTopology` (or, worse,
   a topology that compiles but is operationally wrong).
   → verify: scratch-edit one `edgeId` in a copy of
   `app/pieces/jatinegara-data.ts` to a nonexistent id, confirm the new
   preflight throws naming it and the table; real files still pass
   `bun run verify:jatinegara` and `bun run verify:pieces`.

6. **Docs.** Update `ADDING_LAYOUTS.md`'s Path A section to document
   `switchMeta` keyed by `linkId:end` (not by derived switch number) as the
   convention, and add a short note to `docs/STATUS.md`'s Notes-for-next-
   worker recording the numeric-id renumbering hazard this refactor closes.
   → verify: re-read both files for consistency; no runnable check.

7. **Spike: block-section anchors (non-code, decision only).** Write
   `specs/archive/spikes/SPIKE-block-section-anchors.md` examining whether
   `TopologyBlockSection.edgeRanges` (today: an ordered list naming every
   split edge in a span) could instead be expressed as
   signal-to-signal / signal-to-boundary anchors that the assembler resolves
   the same way `SignalPiece.x` already resolves to an edge+segment+offset.
   Cover: what would have to change in `compileTopology`'s section
   resolution (`app/lib/topology.ts`), whether `whole-track-group` loop
   coverage fits the same anchor model, and an explicit recommendation
   (adopt / defer / reject) with reasoning. Flag prominently that adopting
   this is an engine-level change under `ADDING_LAYOUTS.md`'s standing rule
   and needs separate approval before any implementation commit.
   → verify: `test -f specs/archive/spikes/SPIKE-block-section-anchors.md`.

Each commit leaves `bunx tsc --noEmit`, `bun run build`,
`bun run verify:bekasi` (byte-identical, unaffected throughout — Bekasi
never uses pieces), `bun run verify:pieces`, `bun run verify:jatinegara`, and
`bun run verify:jatinegara:baseline` green before the next commit starts.
`bun run test:e2e` runs at the end of the full sequence (commit 7 has no
code to test).

## Decision Document

- **Modules built/modified:** `app/lib/pieces.ts` (`SwitchMeta` type,
  `expandLines` lookup key, new preflight validation),
  `app/pieces/jatinegara.ts` (`switchMeta` table rekeyed),
  `app/pieces/jatinegara-data.ts` (`JATINEGARA_LEGACY_NODE_ORDER` removed),
  `ADDING_LAYOUTS.md`, `docs/STATUS.md` (documentation only).
- **Interface change:** `SwitchMeta = Record<number, {...}>` becomes
  `Record<string, {...}>`, key format `` `${linkId}:${end}` ``. This is a
  piece-authoring-surface type, not part of the compiled `TopologyDefinition`
  — `TopologySwitch.id` (the numeric id) is unaffected and still derived the
  same way it is today.
  The derivation algorithm for `TopologySwitch.id` itself is UNCHANGED — the
  (line order, x-ascending) walk stays exactly as-is. Only which map an
  author-facing table is keyed by changes.
- **Technical clarification:** verified directly against the running
  assembler (not assumed) that the `linkId:end → controlGroupId` mapping
  reproduces every one of JNG's 48 current switch assignments unchanged, and
  that dropping `legacyNodeOrder` from the passthrough reproduces the
  existing 74-entry `nodes` array byte-for-byte via placement order.
- **No other layout is affected.** Bekasi is hand-authored IR (Path B,
  never touches `pieces.ts`). The four fixtures
  (three-main/ladder/loops/flyover) declare `switches` inline on
  `crossover`/`loop` pieces and never populate `PieceSet.switchMeta`, so the
  type/lookup change is inert for them — `bun run verify:pieces`'s existing
  byte-identical-compiled-output checks are the proof, not a new test.
- **Schema changes:** none to `TopologyDefinition` or `compileTopology`.
  This refactor is entirely within the piece-authoring layer
  (`app/lib/pieces.ts` and the JNG piece files).

## Testing Decisions

- No new test files. Existing gates are the right coverage because they
  already assert the property that matters: the COMPILED output, not the
  authoring surface, must be unchanged. `bun run verify:jatinegara:baseline`
  (byte-identical runtime snapshot) is strictly stronger evidence for
  commits 2 and 4 than a new unit test would be, since it exercises the real
  compile → runtime path the fixtures use.
- Commits 3 and 5 (new error paths) are verified by a manual scratch-edit
  reproduction rather than a permanent test file, per the existing pattern
  in this codebase (`app/lib/pieces.ts`'s existing error paths — floating
  crossover end, conflicting node names — were verified the same way during
  Phase 9 Step 4, per `docs/STATUS.md`). Add a permanent
  `verify:piece-assembly`-style regression case only if a future worker
  actually breaks one of these paths by accident; premature negative-path
  test authoring was explicitly avoided elsewhere in this codebase's Phase 9
  work.
- Prior art: `scripts/verify-pieces.ts` (compiles both authoring surfaces,
  compares serialized output — the existing byte-identical-compilation
  pattern this refactor's commit-2/4 verification follows) and
  `scripts/verify-jatinegara.ts` (structural + render-annotation checks).

## Out of Scope

- Redesigning `TopologyBlockSection`/`edgeRanges` (commit 7 is a decision
  document only, per the third explicit user decision to investigate first).
- Adding `signal`/`platform`-style vocabulary that would let signals or
  stop points be re-expressed without an edge id (excluded per the first
  explicit user decision: geometry + operations, signals/stops stay manual).
- Renumbering `TopologySwitch.id` itself, or changing how it is derived.
- Any change to the four non-JNG fixtures or Bekasi.
- The pre-existing, separately tracked JNG throat-boundary and stub-timetable
  items noted in `docs/STATUS.md`.

## Further Notes

- The `linkId:end → switch id` mapping used in commit 2 was derived and
  cross-checked against the live assembler before this plan was written
  (not by inspection alone), so commit 2 is a direct table transcription,
  not new derivation work — reducing the chance of a transcription error
  that `verify:jatinegara:baseline` would then have to catch.
