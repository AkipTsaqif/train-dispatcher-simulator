# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 1 — Bearings (`Dir` left/right → per-edge bearings).
- **Current step:** Not started. Phase 0 (contract extraction + baseline
  harness) is complete.
- **Next action:** Read `docs/PLAN-phase-1.md`, then create its branch and
  start step 1.

## Phase state

| Phase | Title | State |
|---|---|---|
| 0 | Contract extraction + baseline harness | **DONE** |
| 1 | Bearings (Dir → vectors) | **IN PROGRESS (not started)** |
| 2 | N parallel mains + line selection | blocked by 1 |
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
  - `app/lib/dispatch-map.ts` + `app/lib/dispatch-scenario.ts` hold the shared
    contracts; the Bekasi map/scenario modules re-export them; the runtime
    imports both from lib (layering inversion removed).
  - Equivalence harness: `scripts/lib/serialize.ts` (deterministic serializer),
    `scripts/lib/snapshot.ts` (shared projection), `scripts/snapshot-layout.ts`,
    `scripts/verify-layout.ts`, npm scripts `snapshot:bekasi`/`verify:bekasi`.
  - Baseline `scripts/baselines/bekasi-tambun-cibitung.snapshot.txt` committed
    BEFORE the extraction; `verify:bekasi` is byte-identical after it.
  - Gates: `tsc --noEmit`, `npm run build`, `test:e2e` (47), `probe:meets` — all pass.

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
- (Phase 0) `scripts/lib/snapshot.ts` imports the composition dynamically after
  setting the env, because the runtime reads it at module-load time.

## Notes for the next worker

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, and per-phase `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a
  phase explicitly changes behavior (none of 0–7 should change Bekasi behavior).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
