# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 3 — Independent loop/siding bounds, multi-loop, multi-edge
  loops.
- **Current step:** Not started. Phase 2 (N mains) is complete.
- **Next action:** Read `docs/PLAN-phase-3.md`, then create its branch and
  start step 1.

## Phase state

| Phase | Title | State |
|---|---|---|
| 0 | Contract extraction + baseline harness | **DONE** |
| 1 | Bearings (Dir → vectors) | **DONE** |
| 2 | N parallel mains + line selection | **DONE** |
| 3 | Independent/multi-edge loops | **IN PROGRESS (not started)** |
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
  ... (see commit history)
- 2026-08-07 — Phase 2 complete (same branch):
  - `DispatchMapDefinition.lines.mains` holds every main group
    (trackGroupId/lineY/normalBearing/name); `topY`/`bottomY` remain only as
    deprecated derived views.
  - `selectMainLine(stops, map, scenario)` is total + deterministic: explicit
    timetable `line` on a stop, then scenario `routing.defaultLineByDirection`,
    then the direction fallback (max dot with the main's normal bearing).
    `journeyLineY`/`spawnClearanceGap`/`prepareMeetDependencies` are repointed.
  - The compiled topology exposes `lines.mains`; `ScheduleStop`/`TrainStop`
    gained an optional `line`; the scenario gained an optional `routing` hook.
  - `three-main-fixture` composition (topology/map/scenario/dispatching) +
    `scripts/verify-three-main.ts` proves three parallel mains: explicit line,
    policy, and fallback all select the right lineY, and three trains land on
    three distinct mains.
  - Gates: tsc, build, e2e (47), probe:meets, probe:bearing, verify:three-main,
    verify:bekasi (byte-identical after the `lines.mains` projection extension).

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
- (Phase 2) The baseline was re-captured again for the added `lines.mains`
  projection — the only diff vs the Phase 1 baseline; everything else
  byte-identical.
- (Phase 2) `routing.defaultLineByDirection` is a partial Record so a policy
  may name just one direction.
- (Phase 2) `selectMainLine` resolves timetable/scenario keys by trackGroupId
  or line name; unknown keys throw (fail fast at composition time).

## Notes for the next worker

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, `npm run probe:bearing`, and per-phase
  `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a
  phase explicitly changes behavior (Phase 1's nodes/signal shape change was the
  one deliberate projection update).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
