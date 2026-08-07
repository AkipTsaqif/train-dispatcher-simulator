# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 2 — N parallel main lines + runtime line selection.
- **Current step:** Not started. Phase 1 (bearings) is complete.
- **Next action:** Read `docs/PLAN-phase-2.md`, then create its branch and
  start step 1.

## Phase state

| Phase | Title | State |
|---|---|---|
| 0 | Contract extraction + baseline harness | **DONE** |
| 1 | Bearings (Dir → vectors) | **DONE** |
| 2 | N parallel mains + line selection | **IN PROGRESS (not started)** |
| 3 | Independent/multi-edge loops | blocked by 1 |
| 4 | Route search + flank protection | blocked by 1 |
| 5 | 2-D multi-segment occupancy | blocked by 1, 4 |
| 6 | Flyovers / graded junctions | blocked by 3, 5 |
| 7 | Arbitrary-schematic rendering | blocked by 6 |

Phases 2, 3, 4 are mutually independent (all need Phase 1) — can run in any order.

## Done

- 2026-08-07 — Program scoped; INDEX + PLAN-phase-0..7 + STATUS authored;
  standing rules added to AGENTS.md. No production code changed yet.
- 2026-08-07 — Phase 0 complete (branch `chore/phase-0-contract-extraction`):
  shared contracts in lib, equivalence harness + committed baseline,
  all gates green (see commit history for details).
- 2026-08-07 — Phase 1 complete (branch continues):
  - `Bearing` primitives (`bearingOf`/`bearingDot`/`bearingToDir`) in
    `app/lib/topology.ts`; `GNode` is now exits-based (`exits: GNodeExit[]` with
    `bearing`, `viaSwitchPort`, `branchPath`, `farSw`) instead of
    `straight`/`branch`; signals carry a compiled `bearing`.
  - `resolveNode` (engine) and `walkRoute` (component) select exits by switch
    state + bearing continuity (max dot among open, non-reversing exits),
    reproducing the old straight/branch behavior exactly for the horizontal case.
  - Signal-ahead keeps the horizontal fast path and adds a segment-projection
    path (parameter-t along the segment) for diagonal travel.
  - Wrong-way protection re-expressed on bearings
    (`normalBearingByLineY` derived from the compiled per-group normal bearing);
    the Y-keyed `normalDirectionByY` derived view is kept.
  - The main-group horizontal check is relaxed (diagonal mains now compile);
    the per-line derived views stay nominal for them.
  - `probes/bearing.probe.ts` proves a train traverses a diagonal edge and a
    red signal on it stops/releases. Gates: tsc, build, e2e (47),
    probe:meets, probe:bearing — all pass.
  - Baseline re-captured for the new nodes/signals shape + added `lines`
    projection (see decisions log); `verify:bekasi` byte-identical after.

## Decisions log (decision — why)

- Phase order 0→1 first, then parallel 2/3/4 — Phase 0 is behavior-preserving
  prep; Phase 1 (bearings) is the keystone every later phase assumes.
- Rendering is the last phase (7) — it only matters once the model can express
  non-grid layouts; doing it earlier would churn.
- Scope is a *general* toolchain, not a Clapham sim — per user's scope note in
  INDEX.md. Clapham = complexity reference only.
- (Phase 0) `app/lib/trains.ts` stays pinned to Bekasi — its only consumer is
  `probes/meets.probe.ts`; migrate when a second layout exists (Phase 2+).
- (Phase 0) Snapshot env policy: the scripts force `NEXT_PUBLIC_ENABLED_TRAINS`
  to empty BEFORE importing the composition, so the baseline covers the full
  342-train set regardless of the shell — strongest equivalence coverage.
- (Phase 1) The baseline was re-captured as part of Phase 1: `GNode`'s serialized
  shape changed (straight/branch → exits with bearings) and `SignalDef` gained
  `bearing`, plus the snapshot now pins `lines`. The behavior-bearing
  projections (trackPaths, signalSections, loops, switches, journeys,
  meetsByTrain) are byte-identical; the only diffs were the nodes shape, the
  signal bearings, and the new lines section.
- (Phase 1) `resolveNode` keeps the exact branch-arrival/divert/blocked rules
  from the old code (the plan's pure max-dot sketch does not reproduce the
  horizontal divert behavior) — bearings drive the exit selection, the incoming
  node id disambiguates branch arrivals.

## Notes for the next worker

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, `npm run probe:bearing`, and per-phase
  `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a
  phase explicitly changes behavior (Phase 1's nodes/signal shape change was the
  one deliberate projection update).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
