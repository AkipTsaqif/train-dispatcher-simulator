# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 9 — piece assembly — **COMPLETE (all 7 steps)**. Phases 0–8
  were complete already; Phase 9 was authored after the original 0–8 arc.
- **Current step:** none. `scripts/gen-jatinegara.py` and the generated
  `app/topologies/jatinegara.ts` are DELETED; `/jng` renders from
  `app/pieces/jatinegara.ts` (13 lines + 29 links), byte-identical to the
  baseline captured before the port.
- **Next action:** reconcile `docs/PLAN-phase-10.md` and the JNG verifier with
  the implemented fixed-turn section walk. A section now continues through
  degree-2, switch-free vertices and stops before movable points; all functional
  gates pass and Bekasi remains frozen.
- **BI8 is no longer a prototype — inverted points are shipped.** `switchMeta`
  takes `branch: "line"` to invert which leg diverges, and `link.splitAt` cuts a
  diagonal so a point can sit mid-span. JNG has three inverted points: P57 at
  BI8 (single lever `g53`) and P59/P61 at each end of the flat `t5y` connector
  (coupled as `PC21`). Counts are now 51 switches / 21 coupled groups / 12 mains.

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
| 9 | Piece assembly (pieces → topology IR) | **DONE** (Step 2 pre-landed in Phase 8) |

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
  - **Jatinegara** (`app/pieces/jatinegara.ts`, authored as pieces since
    Phase 9; the generated topology was deleted in Step 7): 8 full-width
    platform mains (13 line pieces, since tracks 5-6 are drawn fragmented),
    29 crossovers, 48 switches + 10 fixed track turns, 23 signals
    (NW/NE/XW/XE), 5 bidirectional mains, per-track platform Xs
    (850/464/416/430/400). Stub timetable (J201/J102/J310). Schematic preview
    at `/jng`. verify-jatinegara (11 checks) + baseline + e2e. Extents match
    the drawing exactly (verified against the draw.io cell dump). Remaining
    approximation: each signal's block opens at its line end (exact throat
    blocks + a real timetable still to come).

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

- (Phase 9 Step 1) **IR diffing landed.** `scripts/lib/ir-diff.ts` +
  `scripts/diff-ir.ts` + `scripts/lib/ir-diff-selfcheck.ts`; gates
  `npm run verify:diff-ir` (26 self-checks), CLI `npm run diff:ir -- <a> <b>`.
  No production code touched. Diffs by IDENTITY per collection (not position),
  reporting added / removed / changed(with per-field before→after) and
  **reordered as a SEPARATE class** — that separation is what lets Steps 4-5
  demand an empty structural diff without being blocked by incidental
  ordering (PLAN-phase-9 allows ordering-only diffs "with a recorded reason";
  `--allow-reorder` exits 0 for that case). Content comparison reuses
  `serialize.ts`, so it inherits the float rounding and is toolchain-
  independent. Exit codes: 0 identical / 1 differences / 2 usage.
- (Phase 9 Step 1) Proven on real data, not just fixtures: re-running
  `gen-jatinegara.py` yields an IR-IDENTICAL result (so the differ is a valid
  Step 6 before/after camera), while a single flipped `dashSide` character in
  the 465-line generated file is pinpointed to `switches / changed / id 3 /
  dashSide "left" -> "right"` — exactly the defect class that the Post-Phase-8
  sweep found by hand on 24 switches. The self-check deliberately asserts the
  differ REPORTS change (a stub returning "identical" would make the Step 4-5
  acceptance gates pass vacuously) and that a duplicate id throws.
- (Phase 9 Step 2) **No code written — verified as already landed, not assumed.**
  `topology.ts` accepts a terminating switch (`common === normal`, so
  `distinctPorts.size === 2`) and still rejects a genuinely duplicated port set.
  Proven by mutating a ladder-fixture switch to be terminating (compiles) and
  to have all three ports identical (throws "duplicate ports").
  **Caveat for Step 6:** NO layout currently uses this capability — all 48 JNG
  switches have 3 distinct ports, because the generator turned the 10 stub ends
  into fixed track turns instead. So the terminating-switch path is supported
  but UNEXERCISED by any committed layout; Step 6's `terminus` pieces will be
  its first real user, and should not assume it is battle-tested.
- (Phase 9 Step 3) **Port join kernel landed** — `app/lib/piece-assembly.ts`
  (`Port`, `joinPorts`, `overCrowdedJunctions`), gated by
  `npm run verify:piece-assembly` (23 checks). Pure and piece-agnostic: it
  classifies junctions (`free` / `through` / `switch`) but mints no ids and
  emits no IR — that is Step 4. Coincidence is EXACT (1 unit apart does not
  join); different levels never join (flyover rule, no new machinery); the
  through axis is the most-opposing pair and is chosen by geometry, not input
  order.
- (Phase 9 Step 3) Ambiguity handling, the plan's "never guess" rule: a
  symmetric crossing (two equally-collinear candidate axes) throws naming the
  point and BOTH candidates; ports meeting without opposing throw; a fan with
  no opposing pair throws "No through axis". `COLLINEARITY_TIE_EPSILON` = 1e-9
  is used ONLY to detect a tie between candidate axes, never for coincidence —
  it sits far above float noise (~1e-16) and far below any real distinction
  (two axes must agree to ~0.0026 degrees to count as tied).
- (Phase 9 Step 3) A junction with 2+ diverging legs is REPORTED
  (`overCrowdedJunctions`), not silently split: `TopologySwitch` has exactly
  one reversed port, so a real ladder must separate those switches along the
  track. Step 4 decides the policy.
- (Phase 9 Step 3) **Validated against the real Jatinegara throat, not just
  fixtures:** feeding the 180 ports derived from JNG's committed edges, the
  kernel independently produced 74 junctions — exactly matching the IR's 74
  nodes — and classified all 48 switch nodes correctly, with zero ambiguity
  errors and zero over-crowded junctions. Good evidence the coincidence model
  can express JNG's 29 crossovers before Step 6 commits to it.
- (Phase 9 Step 3) One test was WRONG and the kernel was right: an early "no
  through axis" case used bearings at +-61 degrees, which genuinely oppose
  (dot -0.53). Fixed to a true fan (all within 90 degrees). Worth remembering —
  "diverging" by eye is not the same as "not opposing" by dot product.
- (Phase 9 Step 4) **Piece vocabulary v1a landed** — `app/lib/pieces.ts`
  (`track` / `crossover` / `terminus` + `assemblePieces`), authored fixtures in
  `app/pieces/`, gated by `npm run verify:pieces`. Both `three-main-fixture`
  and `ladder-fixture` now assemble from pieces.
- (Phase 9 Step 4) **Resolved the plan's "the author never types an edge id"
  against Step 4's empty-IR-diff acceptance** — taken literally they conflict,
  because auto-derived ids could never match the checked-in fixtures. Reading
  it against the problem the plan actually names (a switch costs three
  edge-end REFERENCES that must track edges declared hundreds of lines away),
  the rule implemented is: **a piece names what it OWNS (declaration), never
  what it POINTS AT (reference)**. A crossover does not reference the tracks it
  joins — it is placed where they are and the join follows from geometry, so
  the six common/normal/reversed references in the ladder are now derived.
  Dangling references are impossible; ids stay reviewable in a diff.
- (Phase 9 Step 4) Acceptance is STRONGER than the plan's empty IR diff: both
  definitions are also COMPILED and their serialized output compared. The
  ladder's IR differs in node ORDER only (`EN EX SWa SWb` hand vs placement
  order), which the plan permits "with a recorded reason" — and the recorded
  reason is proof, not assertion: the compiled output is byte-identical
  (compiler ordering comes from `legacyNodeOrder`, which stays authored).
  `verify-pieces.ts` accepts an ordering-only diff IF AND ONLY IF the compiled
  output matches.
- (Phase 9 Step 4) The `terminus` path (Step 2's capability, previously unused
  by any layout) now has its first real user: a stub track ending at a
  crossover point correctly derives `common === normal`. Assembler error paths
  verified to actually fire — a crossover placed where no track runs, and two
  pieces disagreeing about a shared node's name, are both rejected with the
  offending coordinate named.
- (Phase 9 Step 4) `passthrough` still carries signals, block sections, station
  stops, control groups and `legacyNodeOrder` — these get vocabulary in Step 5.
  `legacyNodeOrder` may have to STAY authored: the ladder interleaves loop
  midpoints between main nodes, which no placement-derived order reproduces.
- (Phase 9 Step 5) **Piece vocabulary v1 complete** — added `loop` (a chain of
  segments attaching through switches at both OUTER ends only, intermediate
  joints named by the loop that owns them), `platform`, `signal`, and `level`
  on a link (the flyover ramp). All four fixtures now assemble from pieces and
  pass `npm run verify:pieces`: no entity added/removed/changed AND
  byte-identical compiled output, on three-main, ladder, loops, and flyover.
- (Phase 9 Step 5) Signals and platforms are placed by GROUP + x; the
  assembler resolves which edge and segment contains the point. That was the
  last edge-id reference an author wrote by hand. A diagonal run (the flyover
  ramp, whose signal sits at offset 164.46) cannot be identified by x alone, so
  a positional `at: {edgeIndex, segmentIndex, offset}` escape exists — still
  group-relative, still not an edge-id reference.
- (Phase 9 Step 5) The multi-edge loop (S2, two chained edges via S2h) proves
  the chain model: switches attach only at the outer ends, and an intermediate
  joint stays a plain node. Switch-point derivation was corrected accordingly —
  a node is a switch iff a link DECLARES a switch there, not merely because a
  link ends there (the earlier rule would have made S2h a switch).
- (Phase 9 Step 5) The graded link needed no new machinery, exactly as the plan
  predicted: the ramp carries `level: 1`, its ports never join lineM's, and no
  other piece mentions the (800,147) crossing at all.
- (Phase 9 Step 5) All four fixtures show the SAME ordering-only node
  difference (placement order vs authored order) and all four compile
  byte-identically — so node order in the IR is confirmed behavior-neutral,
  because the compiler takes its ordering from `legacyNodeOrder`, which stays
  authored in `passthrough`.
- (Phase 9 Step 5) `blockSections` deliberately REMAIN in `passthrough`, per
  the plan: sections are graph-global, and piece-local authoring was an
  explicitly rejected alternative. `legacyNodeOrder` and `controlGroups` also
  stay authored.
- (Phase 9 Step 6) **Jatinegara is now authored as pieces.** 13 `line` + 29
  `link` pieces produce all 74 nodes, 90 edges, 48 switches, 42 track groups.
  Compiled output is byte-identical to the pre-port baseline, so the
  switchover changed nothing observable.
- (Phase 9 Step 6) **The plan's Step 6 premise was STALE.** It said to fix
  stub tracks 5-8 being "extended to the map boundaries". Phase 8 (`b08a98e`)
  had already fixed that. Verified against the draw.io cell dump
  (`scripts/extract-jng-cells.py`): all 8 tracks match the drawing exactly,
  including the fragmented tracks 5 and 6 (`t5ac`/`t5y`/`t6ab`/`t5ap`/`t6am`
  are the real drawn segments). So the port was a pure authoring-surface
  change and took the Step 4/5 acceptance bar instead. **Lesson: re-derive a
  plan's premise from the artefact before acting on it.**
- (Phase 9 Step 6) Two rules had to be reverse-engineered; the assembler
  failing loudly is what surfaced them. (a) Switch ids are assigned to ALL 58
  diagonal ends and the 10 fixed turns are dropped AFTER, which is why the
  sequence has gaps (no switch 37/39/45/51). Renumbering densely would
  silently repoint every lever, since switch ids appear in control-group
  tables and scenarios. (b) `dashSide` is the diagonal's direction — east
  dashes right, else left.
- (Phase 9 Step 6) `line`/`link` are sugar lowered into `track`/`crossover`
  before assembly, so there is exactly ONE join/switch/grouping path. A
  `link` end INTERIOR to a line is a switch; an end at a line's extremity is a
  fixed track turn — that one rule is what turns 29 diagonals (58 ends) into
  exactly 48 switches.
- (Phase 9 Step 7) **Generator retired.** `scripts/gen-jatinegara.py` and
  `app/topologies/jatinegara.ts` deleted. `scripts/extract-jng-cells.py` is
  RETAINED deliberately: it is the only way to recover what the draw.io source
  actually says, and it is what proved the Step 6 premise stale.
  `app/ADDING_LAYOUTS.md` Phase 2 now documents pieces as Path A (preferred)
  and hand-authored IR as Path B (legacy, Bekasi).
- (Phase 9 Step 7) JNG's acceptance is no longer a hand-vs-pieces IR diff
  (there is no hand file left) — it is `verify:jatinegara:baseline`, which
  compares the compiled runtime byte-for-byte against a baseline captured
  BEFORE the port. That baseline is now load-bearing: do not re-capture it
  without recording why.
- (Phase 9) e2e: 46 pass, 5 visual snapshots fail. PRE-EXISTING and unrelated
  — Windows-canonical PNGs vs Linux, all on `/` (Bekasi), which Phase 9 never
  touched (`verify:bekasi` stays byte-identical).
- (Post-Phase-9) **`scripts/grid-ref.ts`** translates between authored
  coordinates and on-screen grid references (`npm run grid -- AG6`, or
  `npm run grid -- 528 336`; `-l bekasi` to switch layout). Grid geometry is
  READ FROM THE MAP (`presentation.gridCellSize/gridOffset/gridLabelStep` and
  `grid.shift`), never hardcoded, so it cannot drift from what the component
  draws. Gated by `npm run verify:grid-ref`.
- (Post-Phase-9) The two layouts differ in ways worth remembering: JNG is
  pitch 16 / offset [8,248] / shift 0 and every piece endpoint lands EXACTLY
  on a cell centre (84/84 round-trip). Bekasi is pitch 58 / offset [0,0] /
  **shift 406** — its diagram is translated, so an authored x is not a screen
  x — and its tracks sit at free-form Ys (89/148/205/264), so all 24 signals
  are off-lattice. The tool reports off-lattice positions as `~M4 (col 12.05,
  row 4.03)` rather than rounding, since a rounded ref would be confidently
  wrong.

## Refactor progress

- 2026-08-19 — Stable switch-control identity: `switchMeta` is now keyed by
  the authored link endpoint (`xov15:to`), not the derived numeric switch
  position. The numeric `TopologySwitch.id` remains unchanged for runtime
  compatibility. Orphaned or mistyped keys now fail at assembly with the key
  named in the error. JNG's compiled and runtime baselines remain byte-identical.
-  2026-08-19 — Removed JNG's hand-authored `legacyNodeOrder`. Unlike the
  ladder fixture, JNG's placement-derived node order is already exactly the
  historical 74-node order, proven before removal; the compiled/runtime
  baseline remains byte-identical.
-  2026-08-19 — Block sections are now DERIVED in `assemblePieces`, not
  authored. The retired Python generator computed them from signal placement
  alone (walk to the next same-facing signal on the same track group; none =>
  map edge => `legacyOpenEnd`), so the "graph problem" that kept them in
  passthrough was local to one group all along. All 23 JNG sections and 92
  edgeRanges reproduce byte-identically. `legacyOpenEnd` is a computed
  fallback, NOT authored data - boundary signals would replace it.
-  2026-08-19 — Signals (23) and platforms (34) authored positionally as an
  `x` along a track group. With block sections derived, JNG now has ZERO
  hand-written edge ids and a switch move is a one-line edit.
-  2026-08-19 — Block-section anchors spiked and DEFERRED
  (`specs/archive/spikes/SPIKE-block-section-anchors.md`). ~69 of JNG's 92
  `edgeRanges` entries are mechanical, so the idea is sound, but the new
  preflight removed the silent-failure motivation and `legacyOpenEnd` (17 of
  23 sections) needs the throat boundaries resolved first. Revisit on a real
  mid-span split or a second pieces layout with real block sections.
-  2026-08-19 — Piece assembly now preflights the explicit operational edge
  references (signals, station stops, and block ranges) against the assembled
  edge set. A geometry edit that re-cuts a line now fails at the authoring
  boundary with the stale table/id/context named, instead of a cryptic later
  compiler failure. The operational tables remain explicit by decision.

-  2026-08-20 — Engine change (approved): a signal may now sit on an edge
  vertex. `topology.ts` skips the direction comparison when a range's deltaX
  is 0 - such a range carries no direction and so cannot contradict the
  signal, whose `dir` is already authoritative from its own `facing`. The
  comparison was only ever a reversal guard, and that guard is unchanged for
  ranges with real length (verified by fixture). Separately, a
  `signal-to-boundary` section that is zero-length OVERALL is rejected: a
  signal at a group's end protects nothing, and tolerating the per-range case
  must not legalise that. The message names the GROUP-LOCAL scope, because
  the track usually does continue into the throat - this is the same
  approximation as `legacyOpenEnd`, not a claim that the layout is wrong.
  Rationale + rejected alternatives in
  `specs/PROPOSAL-zero-length-leading-range.md`.
-  2026-08-20 — Phase 10 opened: real throat block boundaries
  (`docs/PLAN-phase-10.md`). Step 1 evidence classifies JNG's 17 open-ended
  sections into THREE kinds, not two: 9 map-edge (correct as open), 7 throat
  (wrong — track continues via a crossover into a switch: NE5 NE6 XW5 XE5
  XE6 XE7 XE8), and 1 dead stub (XW8 at t8's west tip, nothing beyond).
  So the fix needs 7 boundaries, not 17. Deliberately NOT decided yet:
  whether a throat boundary is an existing physical signal (author it, no new
  vocabulary) or a new marker kind — that needs the real signalling diagram,
  and Phase 9's stale-premise lesson says re-derive from the artefact before
  coding. Sections cannot simply "walk further": past a group's end lies a
  switch, and which branch a section covers is runtime point state, so a
  static section must end at an authored boundary.
- 2026-08-20 — Corrected throat geometry: BI8 is not a dead end. It is the
  midpoint of the BG10→BK6 diagonal (`xov27`), with the t5ac branch from AU8
  joining there. The topology-only prototype passed: split the diagonal at
  BI8, keep P34 at BG10 and BK6 as a fixed turn, and make t5ac the BI8 branch.
  No BI8 production layout or vocabulary change is in this checkpoint; control
  identity and label remain undecided.
- 2026-08-20 — Checkpoint the fixed-turn section walk before further BI8 work.
  The walk crosses only degree-2, switch-free vertices; section validation
  permits only that forced continuation and measures the boundary over all
  covered edges. All 15 functional gates and typecheck passed before the
  checkpoint; build/e2e are rerun immediately before commit and push.
- 2026-08-20 — Inverted points get their own vocabulary rather than a special
  case. `branch: "line"` declares WHICH leg diverges; everything else stays
  derived. Rejected hand-authoring the two halves of a split diagonal: it made a
  move a three-place edit whose parts had to stay collinear by hand, so
  `link.splitAt` performs the cut instead and a move is one line again.
- 2026-08-20 — An inverted point's TRUNK is derived from geometry, not from
  which link half the lever was authored on. A point diverges into two legs on
  the same side; the leg opposite is the common. Getting this backwards wired
  P57's always-used leg behind the `normal` port, which the dashes exposed.
- 2026-08-20 — `compileTopology`'s reciprocal-remote-switch check now asks
  whether the far switch has SOME port on the shared chain, not specifically its
  `reversed` port. An inverted point meets the chain on `common`; both are
  reciprocal. Bekasi and all four fixtures stayed byte-identical.
- 2026-08-20 — `controlGroup.handlePerSwitch` draws a coupled group as one
  handle per switch instead of one at the midpoint. Opt-in: a scissors' midpoint
  reads well, but PC21's points are 112 apart and its midpoint sat on empty
  track. Coupling already lived in `toggleSwitch`, so this is render-only.
- 2026-08-20 — Straightened the AM8→AS6 chain (`t5y`+`xov17`+`t6ab`) into one
  flat line at y=352. It crosses `xov15`/`xov16`/`xov18` WITHOUT joining them:
  pieces join only at shared endpoints and no diagonal ends on that row. One
  line means one berth per station, so the duplicate JNG-W/JNG-E pair was
  dropped and mains fell 13 → 12.
- 2026-08-20 — Signals and point handles get their OWN scale knobs.
  `presentation.signalScale` and `presentation.pointScale` multiply onto
  `controlScale` (both default 1, so Bekasi is untouched). JNG sets 0.75 for
  each: at pitch 16 a signal head spanned nearly two cells and the coupled
  circles overlapped. Rejected lowering `controlScale` itself — that also
  shrinks train markers, which are already correctly sized.
- 2026-08-20 — Switch ids are POSITIONAL, so adding a link renumbers every
  switch after it and silently detaches `controlGroup.switchIds`. The compiler
  catches it (`Control group gNN disagrees with switch N`), but the fix is
  manual. This bit three times in one session; the `linkId:end` lever keys are
  what keep it survivable.
- 2026-08-20 — A signal on a DIAGONAL needs the positional `at` escape
  (`{edgeIndex, segmentIndex, offset}`), not an `x`: an x does not identify a
  point on a slope. NE8 sits at BK4, the midpoint of `xov30` (offset 45.25).

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
