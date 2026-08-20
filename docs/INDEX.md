# Layout-Complexity Program — Index

> **Scope note (verbatim):** "This project is NOT about simulating Clapham
> Junction. Clapham is only the reference point for complexity. The actual
> deliverable is a compiler/toolchain that supports arbitrary complex station
> layouts in general."

This program reworks the ppka-demo topology toolchain (compiler, runtime, train
engine, interlocking, and rendering contract) so it can represent **arbitrary
station layouts** rather than only the current two-main-line corridor with
crossovers and single-edge loops. Each phase is a self-contained PLAN file that
an LLM instance or a human can execute cold.

## Read first

- **`docs/STATUS.md`** — the living state of the program. Always read this
  before doing any work; update it immediately after any step or decision.
- **`ADDING_LAYOUTS.md`** — the current authoring contract. Several phases
  relax or replace parts of it; when a phase lands, update this contract to
  match the new supported shape.
- **`specs/tech-architecture/tech-stack.md`** — the codebase map.

## The constraint being removed (why this program exists)

The current model is a **1-D scalar simulation**: direction is the sign of Δx,
every line/loop has a unique horizontal Y, junctions are reciprocal switch-node
pairs between exactly two mains, block sections are x-intervals on one Y, and
trains occupy one segment at one Y. That is enough for Bekasi Timur–Tambun–
Cibitung and nothing bigger. The phases below generalize each of those
assumptions in a controlled order.

## Phases

| # | File | Goal | Depends on |
|---|------|------|-----------|
| 0 | [PLAN-phase-0.md](PLAN-phase-0.md) | Shared-contract extraction + equivalence baseline harness | — |
| 1 | [PLAN-phase-1.md](PLAN-phase-1.md) | Generalize direction: `Dir` (left/right) → per-edge bearings | 0 |
| 2 | [PLAN-phase-2.md](PLAN-phase-2.md) | N parallel main lines + runtime line selection | 1 |
| 3 | [PLAN-phase-3.md](PLAN-phase-3.md) | Independent loop/siding bounds, multi-loop, multi-edge loops | 1 |
| 4 | [PLAN-phase-4.md](PLAN-phase-4.md) | Graph-based route search (entry→exit) + flank protection | 1 |
| 5 | [PLAN-phase-5.md](PLAN-phase-5.md) | Per-edge 2-D occupancy + multi-segment train bodies | 1, 4 |
| 6 | [PLAN-phase-6.md](PLAN-phase-6.md) | Graded junctions / flyovers + non-crossing converging edges | 3, 5 |
| 7 | [PLAN-phase-7.md](PLAN-phase-7.md) | Arbitrary-schematic rendering (decouple geometry from the grid) | 6 |
| 8 | [PLAN-phase-8.md](PLAN-phase-8.md) | Drawn-extent tracks — **superseded by 9**; compiler half is 9 Step 2 | 7 |
| 9 | [PLAN-phase-9.md](PLAN-phase-9.md) | Piece assembly: authored pieces → topology IR (`compileTopology` unchanged) | 7 |
| 10 | [PLAN-phase-10.md](PLAN-phase-10.md) | Real throat block boundaries: replace the `legacyOpenEnd` approximation | 5 |

**Ordering rationale.** Phase 0 is pure preparation (no behavior change) and
unblocks everything. Phase 1 (bearings) is the keystone — every later phase
assumes direction is a vector, not a scalar. Phases 2 and 3 are independent of
each other but both sit on Phase 1. Phase 4 (route search) is independent of
2/3 and can run in parallel. Phase 5 (2-D occupancy) needs Phase 4's notion of
a *route* to define fouling. Phase 6 (flyovers) needs per-edge occupancy (5)
and multi-edge paths (3). Phase 7 (rendering) is last because it only matters
once the model can express layouts that no longer fit the spreadsheet grid.

You do **not** have to do all phases. Each phase leaves the system working and
the existing Bekasi layout passing. Stop wherever the layouts you actually want
are supported.

## How to use these plans

1. Read `docs/STATUS.md` to find the current phase and step.
2. Open that phase's `PLAN-phase-N.md`. Each has: goal, technical design,
   general summary, acceptance criteria, open assumptions.
3. Do the work in the phase's steps. Keep changes behavior-preserving unless
   the phase explicitly changes behavior.
4. Update `docs/STATUS.md` after every step and every nontrivial decision.
5. Run the phase's acceptance criteria before marking it done.

## Verification commands used throughout

```bash
npx tsc --noEmit          # type gate
npm run build             # prod build
npm run test:e2e          # Playwright e2e + visual regression (prod build, :3100)
npm run probe:meets       # engine probe (meets/susul holds)
bun scripts/verify-<layout>.ts   # per-phase layout verifier (added in Phase 0)
```

The e2e suite only exercises the runtime imported by
`app/components/dispatching-table.tsx`; for any composition the UI does not
select, prove it with a direct verifier (`scripts/verify-<layout>.ts`) instead.
