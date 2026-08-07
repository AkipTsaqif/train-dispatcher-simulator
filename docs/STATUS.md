# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 0 — Shared-contract extraction + equivalence baseline.
- **Current step:** Not started. Program scaffolding (this file + PLAN files +
  AGENTS.md rules) was just written.
- **Next action:** Phase 0, step 1 — create branch `chore/phase-0-contract-extraction`,
  then build `scripts/lib/serialize.ts`, `scripts/snapshot-layout.ts`,
  `scripts/verify-layout.ts` (see PLAN-phase-0 §0.3).

## Phase state

| Phase | Title | State |
|---|---|---|
| 0 | Contract extraction + baseline harness | **IN PROGRESS (scaffolding done)** |
| 1 | Bearings (Dir → vectors) | blocked by 0 |
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

## Decisions log (decision — why)

- Phase order 0→1 first, then parallel 2/3/4 — Phase 0 is behavior-preserving
  prep; Phase 1 (bearings) is the keystone every later phase assumes.
- Rendering is the last phase (7) — it only matters once the model can express
  non-grid layouts; doing it earlier would churn.
- Scope is a *general* toolchain, not a Clapham sim — per user's scope note in
  INDEX.md. Clapham = complexity reference only.
- (pending Phase 0) `app/lib/trains.ts` stays pinned to Bekasi for now — its
  only consumer is the meets probe; migrate when a second layout exists.
- (pending Phase 0) Baseline train set must be fixed for reproducible snapshots —
  decide explicit `NEXT_PUBLIC_ENABLED_TRAINS` value in Phase 0 (see PLAN §0.3 /
  open assumptions).

## Notes for the next worker

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, and per-phase `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a phase
  explicitly changes behavior (none of 0–7 should change Bekasi behavior).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
