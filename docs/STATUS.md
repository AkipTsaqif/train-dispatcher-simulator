# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** none — the program is COMPLETE (phases 0–7 all done).
- **Current step:** —.
- **Next action:** optional follow-ups (per-layout UI switching, pan/zoom,
  per-train lengths); otherwise the toolchain now supports arbitrary complex
  station layouts end-to-end.

## Phase state

| Phase | Title | State |
|---|---|---|
| 0 | Contract extraction + baseline harness | **DONE** |
| 1 | Bearings (Dir → vectors) | **DONE** |
| 2 | N parallel mains + line selection | **DONE** |
| 3 | Independent/multi-edge loops | **DONE** |
| 4 | Route search + flank protection | **DONE** |
| 5 | 2-D multi-segment occupancy | **DONE** |
| 6 | Flyovers / graded junctions | **DONE** |
| 7 | Arbitrary-schematic rendering | **DONE** |

Phases 2, 3, 4 are mutually independent (all need Phase 1) — can run in any order.

## Done

- 2026-08-07 — Program scoped; INDEX + PLAN-phase-0..7 + STATUS authored;
  standing rules added to AGENTS.md. No production code changed yet.
- 2026-08-07 — Phase 0 complete (branch `chore/phase-0-contract-extraction`):
  shared contracts in lib, equivalence harness + committed baseline,
  all gates green (see commit history for details).
- 2026-08-07 — Phase 1 complete (branch continues):
  ... (see commit history)
- 2026-08-07 — Phase 4 complete (same branch):
  - `app/lib/route-search.ts`: pure `findRoute` (entry→exit search over the
    movement graph with a direction filter + candidate ranking: fewest point
    moves, then shortest; boundary = a valid open-line route end) and
    `flankPoints` (switches not on the route whose branch fouls it).
  - `toggleSignal` now routes via `findRoute` (policy b — manual points): a
    route needing an unlocked point move is refused with the same "wesel belum
    diatur" message; a fouled flank (a flank point thrown against the route) is
    refused; the found route's polyline feeds the reservation lifecycle. The
    flank fouling distance is CELL/3 (CELL would false-flag adjacent parallel
    tracks 57 px away).
  - `lockedBy`/`isLocked` extend to flank points of active routes (locked in
    the non-fouling position).
  - Ladder fixture + `scripts/verify-routes.ts` prove multi-path choice (the
    free path is chosen when one line is occupied) and flank detection.
  - One intended behavior change: with a crossover thrown under a route, the
    route now follows the SHORTEST feasible path rather than greedily
    diverting through the thrown points (the phase's point). The conflict-toast
    + interacted visual baselines were refreshed; all functional assertions
    (including the exact refusal toasts) pass unchanged.
  - Gates: tsc, build, e2e (47), probe:meets, probe:bearing, verify:three-main,
    verify:loops, verify:routes, verify:bekasi (byte-identical).

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
- (Phase 3) The baseline was re-captured for the per-loop section resolution:
  the open-end infinities on J3/J6/J7 now resolve to each loop's own envelope
  (J3 [500,∞]→[500,788], J6 [-∞,788]→[500,786], J7 [-∞,788]→[500,788]) plus
  the added `loops.byGroupId` projection — the intended false-occupancy fix.
- (Phase 3) The reciprocal-switch + branch-path logic walks the loop CHAIN
  (not just the reversed edge) so multi-edge loops attach reciprocally at
  their two ends.
- (Phase 4, then switched at the user's request) Point-setting policy is now
  **(a) — auto route set**: clearing a signal throws the unlocked points its
  route needs (coupled pairs move together) and clears. A route into occupied
  track or with a locked flank is still refused. The original policy-(b)
  refusal tests were replaced by an auto-set test.
- (Phase 4) The route-search direction filter uses a -0.8 dot threshold: it
  rejects fully-opposite exits (a loop's far end) but allows crossover
  diagonals whose x-component is only slightly against the flow (needed for
  the wrong-way crossover routes).
- (Phase 4) The route choice is now the search's shortest feasible path — a
  thrown crossover no longer diverts a route that has a free straight path.
  This is a deliberate behavior improvement (the phase's core); the two visual
  baselines that showed route highlights were refreshed.
- (Phase 4) Flank fouling distance is CELL/3, not CELL — CELL is wider than
  the 57 px track spacing and would flag adjacent parallel tracks as flanks.
- (Phase 4) `verify-layout.ts` normalizes CRLF so a git checkout on Windows
  does not false-fail the byte-identical comparison.
- (Phase 4 follow-up, at the user's report) Flank detection refined: a branch
  that converges exactly ON a route junction node is no longer a flank — that
  node's own locking already neutralises it (e.g. the upper loop's far switch
  P4 is no longer locked by a main-line route through P3).
- (Phase 4 follow-up) Explicit entry→exit route request: click a signal, then
  SHIFT-click a target signal → the interlocking re-routes the entrance to
  that exit, auto-setting + locking its points (findRoute honours the target
  exit; the entrance's own reservation is released first; boundary routes are
  not valid for an exit-constrained request). e2e: shift-click routes the last
  signal to the clicked one.
- (Phase 5) Train occupancy is now a 2-D polyline body (`footprintOf`): the
  engine trails the segment points the center passes (bounded to the body
  length) and the body is the front→rear polyline over those segments. The
  compiler emits `sectionPaths` (each signal's protected block as a track
  polyline — straight for horizontal sections, the whole loop chain for loop
  signals); it is a NEW runtime key, deliberately NOT added to the snapshot
  projection, so the Bekasi baseline stayed byte-identical.
- (Phase 5) `occupiedSections`/`trainOccupies` use footprint-vs-section-polyline
  overlap with the horizontal fast path kept (identical x-interval results);
  the tick conflict check uses `bodiesOverlap` (fast path on equal y, genuine
  polyline overlap otherwise) — the |Δy| < CELL/2 track-spacing fudge and the
  segment-equality heuristic are gone. New probe: probe:occupancy (straddle,
  loop-entry J4+J6, J5/J4 straddle, same-diagonal conflict, parallel-diagonal
  non-conflict).
- (Phase 5) verify-loops' fake train gained a horizontal segment so the
  footprint reduces to the old interval test (its x/y occupancy assertions).
- (Phase 6) Edges carry an optional `level` (default 0). The compiler emits
  `segmentLevels` (every movement segment → its edge's level, both directions)
  and the section polylines are stamped per-range with their edge's level.
  `segsOverlap` suppresses crossing/overlap when the segments' levels differ
  (each point is stamped with the level of the segment INTO it, so a segment's
  level reads from its last point). All Bekasi edges are level 0 → the
  baseline stayed byte-identical.
- (Phase 6) The engine's train state carries its current segment level + per-
  trail-entry levels, so `footprintOf` pieces are stamped and body conflict /
  occupancy / route clash all respect grade automatically. `walkRoute` and
  `findRoute` stamp route polylines from `segmentLevels`.
- (Phase 6) New fixture + verifier: `flyover-fixture` (three westbound mains +
  a level-1 ramp over the middle one, crossing it at (800,147) on the map) +
  `verify-flyover` proves pass-under-no-conflict, the flat-diamond control
  case (same geometry at level 0 DOES conflict), ramp-only occupancy (R1 yes,
  M1 no), ramp routing (A1→B2 via the ramp), route-clash suppression, and
  level-1 footprint pieces. `ADDING_LAYOUTS.md` documents the graded-edge
  shape.
- (Phase 7) Maps declare `presentation: { kind: "grid" | "schematic" }`. The
  component gates the grid chrome (lines/letters/ticks) and station cells on
  grid mode, renders schematic `stationShapes` (authored platform bars) and
  continuous train markers (true x/y rotated to the segment bearing), and the
  compiler emits `levelCrossings` (positions where edges cross at different
  grades) which render as a gap in the lower line + bridge piers on the upper.
  Bekasi stays grid mode → its visual baselines pass unchanged.
- (Phase 7) The flyover fixture is the schematic smoke test: `app/schematic/`
  renders it with no grid chrome, platforms Alpha/Beta, the bridge glyph at
  (800,147), and continuous markers (e2e asserts all of it).

## Notes for the next worker

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, `npm run probe:bearing`, and per-phase
  `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a
  phase explicitly changes behavior (Phase 1's nodes/signal shape change was the
  one deliberate projection update).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
