# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 9 — piece assembly (see `docs/PLAN-phase-9.md`). Phases 0–8
  are complete; Phase 9 was authored after the original 0–8 arc.
- **Current step:** pre-Step-1. A Jatinegara baseline snapshot was captured so
  Phase 9's rebuild of the JNG topology has a "before camera" to diff against.
- **Next action:** Step 1 — `scripts/diff-ir.ts` (structural IR diffing).
  Note Step 2 (terminating switches in the compiler) ALREADY LANDED with
  Phase 8 in `b08a98e` — `topology.ts` has `distinctPorts.size === 2`.

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
| 8 | Drawn-extent tracks (terminating switches) | **DONE** |
| 9 | Piece assembly (pieces → topology IR) | **ACTIVE** (Step 2 pre-landed in Phase 8) |

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
- (Post-program, Jatinegara request) New capabilities:
  - **Bidirectional mains** — a main track group may declare
    `bidirectional: true`; the compiled `lines.bidirectionalByY` (a top-level
    map key, kept OUT of the snapshot projection so the Bekasi baseline stayed
    byte-identical) exempts the wrong-way forced-red protection. Wrong-way
    trains still need an explicit `line` in the timetable (selectMainLine's
    fallback picks by normal direction).
  - **Multi-length platforms** — `stationStopXs` (per station, per track group)
    replaces the single-X-per-station throw with a per-track validation; the
    journey prep resolves each stop's X on the journey's own line via
    `buildJourney`'s `stopXFor`. Bekasi unchanged (its stations share one X).
  - **Jatinegara** (`app/topologies/jatinegara.ts`, generated from
    `app/schematic/jng_grid.svg` via `scripts/gen-jatinegara.py`): 8 full-width
    platform mains, 29 crossovers, 58 switches, 23 signals (NW/NE/XW/XE), 5
    bidirectional mains, per-track platform Xs (850/464/416/430/400). Stub
    timetable (J201/J102/J310). Schematic preview at `/jng`. verify-jatinegara
    (11 checks) + e2e. Deviations from the drawing: stub tracks 5-8 extended
    to the map boundaries so every junction keeps a through axis; each
    signal's block opens at its line end (exact throat blocks + a real
    timetable still to come).

- (Phase 8) Landed in `b08a98e` — terminating switches (common === normal), the
  generator regenerated at the drawn extents (13 mains, 10 terminating
  switches), non-loop open ends resolving to the track-group boundary instead
  of ±Infinity, and stub journeys within their tracks. Followed by ~11 JNG
  grid-rendering commits (graph-paper chrome, grid pitch/offset/labels, coupled
  PC naming, point-cell overlay, thrown-switch dashing).
- (Post-Phase-8 defect sweep) Three interaction bugs found by driving `/jng` in
  a real browser — the topology verifier passed throughout, because it only
  checked topology and never the render/control annotations:
  - **Train markers ignored `controlScale`.** The marker was hard-coded to
    `CELL` (116×22 units) while JNG's track pitch is 32, so each train covered
    ~3 tracks and physically blocked P44/P29 from being clicked. Markers now
    scale with `CONTROL_SCALE` like the signal/point controls. The direction
    arrow is authored as a FRACTION of the marker half-length (32/58, 41/58…)
    so Bekasi's hand-tuned geometry is reproduced exactly at `halfLen = CELL`
    and the visual baselines stayed unchanged.
  - **Trains painted over the controls.** The train group was the last child of
    the diagram, so any train parked on a point stole its clicks. The train
    block now renders BEFORE the point/signal controls (SVG paint order = DOM
    order); interactive chrome is always on top.
  - **Scissors point controls stacked.** A coupled control is placed at the
    mean of its two switches, and a scissors' two diagonals share a midpoint —
    so both controls landed on the same pixel and the one drawn last took every
    click (3 pairs, half of each scissors unthrowable). `compileTopology` now
    calls `separateCoincidentControls`, sliding each colliding control along
    its OWN diagonal (¼ of its span). Only genuine collisions move, so Bekasi
    (no scissors) stayed byte-identical.
  - **Generated `dashSide` was inverted on 24 of 48 switches** — the generator
    derived it from the line's normal direction instead of the branch's real
    geometry, so every switch whose branch runs against the flow drew its
    dashed stub on the wrong side. Now derived from the reversed edge's far
    endpoint. Regenerating touched ONLY those 24 `dashSide` values.
  - **Point-cell dash/eraser were unscaled too** (same bug class as the train
    marker). The inactive leg paints a white ERASER then a gray dashed ghost,
    clipped to the point's grid cell. The 3.5-wide eraser is authored against
    CELL=58; drawn diagonally it bites sideways into the solid straight it
    crosses — ~31% of a 16-unit JNG cell vs ~8% of a 58-unit Bekasi cell,
    which is the "gap in the straight route" the user saw. Fixed with TWO
    scales, not one: `ERASER_SCALE = min(1, GRID_PITCH / CELL)` shrinks the
    eraser hard (bite is now 9% on both layouts), while
    `DASH_SCALE = sqrt(CELL_RATIO)` thins the ghost only ~1.9x instead of
    ~3.6x — scaling the dash by the full ratio left a 0.55-wide hairline
    beside a 2-wide track that no longer read as a dashed line. Both capped at
    1, so Bekasi stays exactly as authored.
    The eraser also needs a HARD FLOOR at the track width: the solid track is
    drawn at a fixed `TRACK_STROKE = 2` (never scaled), so a sub-2 eraser left
    black slivers down both sides of the ghost instead of erasing the leg.
    `ERASER_SCALE = max(TRACK_STROKE + 0.25, 3.5 * CELL_RATIO) / 3.5` — at
    pitch 58 that is exactly the authored 3.5; below pitch ~40 it floors at
    2.25. Verified across pitches 4–80 that the eraser always covers the track
    and always stays wider than its own ghost.
  - **Paint order: the inactive ghost sat ABOVE the active route.** The
    per-point dashed leg rendered after the amber reservation, so each point's
    white eraser + ghost cut a notch through the highlighted route the player
    had just set — lower-priority information obstructing higher-priority.
    The layer now renders between the solid tracks and the reservation:
    tracks -> inactive ghost -> amber route -> trains -> controls. Two Bekasi
    visual baselines were refreshed (23 px and 21 px changed, 0.0025%); a
    pixel-transition audit confirmed the change is only `ghost/white -> amber`
    (route restored) and never the reverse.
    That reorder was necessary but NOT sufficient — the user still saw the
    ghost cutting the route. The eraser is a fat white stroke that STARTS at
    the switch node, and the node sits ON the through track, so its round cap
    always spills onto whichever leg is live; no width tuning fixes that.
    The cell now RE-DRAWS the active leg in black after the ghost
    (`activeD = reversed ? sw.branch : throughD`), so the set route is
    unbroken by construction in both states. Measured with a 4x pixel scan of
    every running line: zero interior breaks; the only remaining interruptions
    are the point-control circles and signal boxes that legitimately sit on
    the line. All 5 Bekasi visual baselines refreshed (≤ 0.035% of pixels,
    all track-repair greys).
  - Regression cover added: three `verify-jatinegara` checks (dashSide matches
    branch geometry, no two controls share a position, centres ≥ halo apart)
    and an e2e test that clicks all 28 controls at `?start=08:00` (trains sit
    over P44/P29 then, so it covers the paint-order bug too).
- (Post-Phase-8) `scripts/gen-jatinegara.py` read its cell dump from a
  hand-made `/tmp/jng_cells.json` that no longer existed — the generator was
  un-runnable. `scripts/extract-jng-cells.py` now rebuilds it from the draw.io
  XML embedded in the committed `app/schematic/jng_grid.svg`, and the generator
  invokes it automatically. Verified: regenerating with the OLD generator code
  reproduced the committed topology byte-for-byte.

- (Phase 9 prep) **Jatinegara baseline captured.** `LAYOUT_IDS` in
  `scripts/lib/snapshot.ts` now lists `jatinegara` alongside Bekasi (Bekasi
  stays FIRST — `snapshot-layout.ts` defaults to `LAYOUT_IDS[0]`, so
  `npm run snapshot:bekasi` keeps its meaning). Wrote
  `scripts/baselines/jatinegara.snapshot.txt` (136,840 bytes); it verifies
  byte-identical. Rationale: Phase 9 Step 6 deliberately CHANGES the JNG
  topology (true drawn extents), so git alone only preserves the old source
  text — the snapshot preserves the compiled RUNTIME for before/after diffing.
  This baseline is a reference point, NOT a frozen contract like Bekasi's:
  expect it to be re-captured at Step 6 with the diff recorded here.
- (Phase 9 prep) **`verify:bekasi` was failing at HEAD — pre-existing float
  drift, now FIXED.** Confirmed against pristine HEAD before changing anything:
  16 of 16,594 lines differed, ALL bearing `dx`/`dy`, max relative deviation
  1.6e-16 (under 1 ULP) — no structural or behavioral change. Cause: the
  baseline was captured under an older JS engine; the tree now runs bun 1.3.10
  / node v24.16.0, and float64 results can differ in the last binary digit
  across engine versions.
- (Phase 9 prep) **Fix chosen (option 2 of 2, user's call): round floats in the
  serializer**, not a plain baseline re-capture — it fixes the CLASS, so the
  next runtime upgrade cannot turn the gate red again. `scripts/lib/serialize.ts`
  now rounds every serialized number to `SNAPSHOT_PRECISION = 12` significant
  digits. Rationale for 12: ULP noise is ~2.2e-16 relative, so 1e-12 sits four
  orders of magnitude above the noise and far below any meaningful geometric
  change (coordinates are integers; bearings are unit vectors, where 1e-12 is
  ~0.06 nm over a 60 km corridor). A real regression cannot hide under it.
  Integers, 0/-0, and Infinity/NaN tagging are unaffected; rounding is
  idempotent.
- (Phase 9 prep) **Both baselines re-captured under the rounding serializer**
  (Bekasi 383,393 -> 375,936 bytes; Jatinegara 136,840 -> 135,861). This is a
  deliberate, one-time format refresh. Proven safe before committing to it:
  re-serializing the OLD runtime produced **zero structural differences** on
  both layouts (0 key/shape changes; 1766 Bekasi + 241 JNG numeric lines
  differing only in rounding, max 4.2e-12), and all four observed drift pairs
  converge to identical text. Verified immune afterwards: perturbing EVERY
  non-integer float in the projection by 1 ULP now yields 0 of 858 changed
  snapshot lines.
- (Phase 9 prep) Gates all green after the change: `tsc`, `verify:bekasi`
  (byte-identical again), `verify:jatinegara:baseline`, `verify:jatinegara`,
  verify three-main/loops/routes/flyover, and all four probes. NOT yet run:
  `npm run build` and `npm run test:e2e`.

## Notes for the next worker

- **Recurring bug class — check this first on any dense/schematic layout.**
  Several constants in `dispatching-table.tsx` are authored against the sim
  `CELL` (58) and silently break when a layout's visual pitch is much finer
  (JNG: `gridCellSize` 16, `controlScale` 0.55). Found so far: the train marker
  body/arrow/badge, and the point-cell dash + white eraser. When adding a
  layout with a small pitch, grep for bare numeric literals in the SVG render
  and ask whether each should scale by `CONTROL_SCALE` (chrome the user clicks)
  or by the grid ratio (marks tied to a cell). Verify by SCREENSHOT — the
  topology verifiers and the Bekasi baseline cannot catch any of it.

- Verification commands: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
  `npm run probe:meets`, `npm run probe:bearing`, and per-phase
  `bun scripts/verify-<layout>.ts`.
- Bekasi baseline must stay **byte-identical** through every phase unless a
  phase explicitly changes behavior (Phase 1's nodes/signal shape change was the
  one deliberate projection update).
- If this file lacks enough detail to act, re-read the relevant
  `docs/PLAN-phase-N.md` — do not reconstruct from memory.
