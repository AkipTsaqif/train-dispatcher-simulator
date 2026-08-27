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
- **Next action:** continue user-directed JNG layout editing. The former B–N
  plain approach was removed; old N and everything east translated left 12
  columns, making it new B while preserving short western signal approaches.
  PC22 was then shifted one grid column left as a coupled unit. JNG now uses
  a layout-specific flank clearance just under one grid interval so that PC22
  is not locked as a flank of NE2→XW4; connectivity, switch ids, and Bekasi
  stay frozen.
- **Real timetable landed.** `scripts/build-jng-schedule.ts` converts the
  168Railway working timetable (`data/timetable/stations/jatinegara.json`)
  into `app/dispatching/jatinegara-schedule.ts` — 46 real trains in the
  06:00–08:00 window, each a 3-stop ScheduleEntry (JNG-W/JNG/JNG-E or
  JNG-E/JNG/JNG-W). Corridor direction is derived from the prev/next
  neighbour (MTR/POK→eastbound/t1, KLD/BKS→westbound/t2); susul (overtake)
  remarks are parsed into `meets`. `jatinegara.ts` now imports the generated
  schedule instead of the hand-stubbed J201/J102/J310/J410. E2e tests updated
  to reference real train numbers; the J410 entryLine test is skipped (no real
  train uses entryLine). JNG baseline re-captured.
- **Inverted points are shipped.** `switchMeta` takes `branch: "line"` to
  invert which leg diverges, and `link.splitAt` cuts a diagonal so a point can
  sit mid-span. After western compaction, P57 sits at AU8 (single lever `g53`)
  and P59/P61 sit at each end of the flat `t5y` connector (coupled as `PC21`).
  Counts are now 51 switches / 21 coupled groups / 12 mains.

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

- 2026-08-25 — **JNG spawn-follow fix (the J310/J410 t6 freeze)**: two
  trains sharing an entry line (J410 origin 06:02, J310 06:05, both spawned
  on t6) materialised at the same x and the old conflict failsafe stopped
  BOTH — a deadlock neither could clear. Semantics fix in the tick's overlap
  loop: same line + same direction is a FOLLOW, not a collision — only the
  REAR train stops (new `stopReason: "queue"`, amber body + roster dot,
  "Mengikuti" status; no "!" badge, no conflict toast). The leader is the
  frontmost in the travel direction; at a spawn-coincidence tie the earlier
  scheduled origin leads. Head-on/crossing overlaps keep both-stop collision
  semantics (Bekasi's opposite-direction refusal test unchanged). Engine:
  `advanceTrain` treats `queue` like `conflict` (tick-loop-released hold).
  This also fixes the general same-direction catch-up deadlock class. Gates:
  tsc, all 9 jatinegara + collision e2e green, verify-jatinegara ALL PASS;
  the 5 visual failures are the pre-existing win32→linux snapshot mismatch.
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
- (JNG, user-directed) **Bendy-marker arrow now follows the NOSE.** While an
  articulated body spans a thrown point but its centre is still on the
  straight, the old code rotated the arrow by `ang` (the CENTRE segment's
  bearing) — 0 on a horizontal, so the arrow kept pointing straight for up to
  half a body length (repro: /jng start 06:00, P22+P13 BELOK, NE2 KUNING,
  watch J102). Fix: when bendy, the arrow must follow the NOSE. Two traps:
  (1) `spineOf` builds the spine nose-first but running BACKWARDS
  (`spine[0] = at(noseS)`), so travel direction = spine[1] → spine[0] —
  using either segment unreversed points the arrow backwards.
  (2) The arrow glyph spans +x only (it hugs the leading edge by design), so
  rotating it about the marker centre swings it off the bent body entirely.
  Fix: anchor the glyph in the group's LOCAL frame (map ÷ CONTROL_SCALE) so
  its TIP lands just inside spine[0], rotated onto the travel direction
  there; beware map-vs-local unit mixing — TRAIN_HALF_LEN is local units,
  spine points are map units.
  Verified in-browser over your repro: 60/60 bendy frames with rotate(-135°)
  AND the transform-corrected arrow bbox overlapping the articulated body's
  bbox — direction and placement both correct; zero flipped/stuck/detached
  readings. Follow-up (same session): the train NUMBER had the same symptom
  while bendy — it sat rigidly at the group origin instead of riding the
  curving body. It now anchors on the spine's REAR segment midpoint (kept
  upright for legibility; arrow holds the nose, number rides the rear body).
  the body's bbox. (JNG, user-directed) **Trains now spawn at their TRACK's
  edge, not the grid edge** — opt-in `scenario.spawn.atTrackEdge`: with it,
  buildJourney clamps the approach spawn to the journey's own line extent
  (nodes on its lineY) instead of the global map edge, so J310 enters at
  x=32 where t6 actually starts instead of floating before column A
  (old spawn was x=-8993). Schedule-derived spawns already inside drawn
  track are kept. Bekasi does not set the flag → baseline byte-identical
  (verified); JNG snapshot diff is exactly the four journey plans.
  Follow-up (same session, user refinement): spawn should EMERGE piece by
  piece at the track end, not pop in there. buildJourney's atTrackEdge clamp
  now leaves a full MARGIN of lead-in short of the line's first drawn point,
  and the renderer clips each marker to its own line's drawn extent
  (per-train clipPath over [lineMinX, lineMaxX], shifted-diagram coords) —
  nothing renders over blank space; the body slides in nose-first across the
  track end (and symmetrically slides out at the far end). Verified live:
  J310 at data-x=-56 hits nothing (hidden), at data-x=+56 fully rendered.
  (JNG, user-reported) **Cleared entry signal reserved only a platform stub.**
  Clearing NW5→KUNING rendered the amber route as M336→400 (ahead of J410's
  front on the ADJACENT t5) instead of NW5's full x=112→400 route: both
  `unpassedOf`'s owner-less fallback and the tick loop's ownership claim
  treated ANY same-direction train within CELL (58u) of the polyline as "on
  the route" — and JNG's track spacing is 32u, so parallel-track trains
  qualified (trimming the render, claiming ownership, later releasing it).
  Fix: "on the route" now means centre within CELL/3 (~19u < spacing) in
  BOTH places; an unclaimed reservation renders in full until a real train
  is on it. Verified live: full M112→400 amber path immediately on click,
  no train required. Fix proven global: both sites are shared code, so every
  signal on every layout benefits; threshold scales with CELL.
  (JNG, user-reported) **J310 stopped at O–R instead of the U–X island**:
  the timetable stop X for JNG on t6 (pieces: x=238) disagreed with the
  DRAWN island platform graphic (stationShapes: x=360, spanning U–X).
  Moved the t6 platform piece to x=360 (flanks clear: XW6@320 behind,
  XE6@400 ahead, no points on t6); verifier expectations updated; JNG
  snapshot regenerated. NOTE: the 5 failing Bekasi visual snapshots were
  bisected — they fail identically with ALL component changes stashed, so
  they are pre-existing WIP drift, not caused by any of today's fixes.
  (JNG, user-requested) **Reservations now free only after the train's REAR
  fully clears each cell** (was: trimmed/released at the nose). Three sites:
  unpassedOf trims at centre−CELL (engine rear), passedEnd releases when the
  REAR passes the route end, and signal-pass consumption no longer deletes
  upstream reservations instantly — the consuming train CLAIMS them and the
  progress logic frees them cell by cell. Live probe: highlight trails the
  visible body conservatively (engine centre runs ~20u behind the drawn
  articulated body), never frees early. Suite: 50 passed + the same 5
  pre-existing visual failures.
  (JNG, user-requested refinements) **Closer freeing + hidden behind body +
  driver reaction**: trim/release offset moved from CELL(58) to the DRAWN
  half-length (TRAIN_HALF_LEN) so cells free right at the visible tail; a
  `visibleOf` helper now paints only the route strictly AHEAD of the nose
  (amber invisible over/behind the body — reservation itself unchanged,
  clash checks still use unpassedOf); scenario knob `driver.reactionSeconds`
  (JNG=5) holds a signal-stopped train ~5s after its signal clears before
  resuming — measured via ctx.now since st.time is frozen while stopped;
  reaction clock resets if the signal re-reddens. Live probe: amber starts
  at/past centre in 12/12 samples; clearance→movement = 5.2s. Bekasi keeps
  the default (0) so its behavior is preserved.
  (JNG, user-reported) **J310 crawled at 0.05–0.67 u/s** (Bekasi runs ~7):
  with an empty segmentKm table every leg speed degrades to distance ÷
  timetable gap, and the stub schedule's long gaps over short distances
  (worst: 32u over 600s) produce crawls. Added opt-in
  `speed.minUnitsPerSecond` floor (JNG=2.5): applied in buildJourney leg
  derivation + approach leg and dispatch-runtime firstLegSpeed; trains run
  at the floor and dwell until their scheduled departure. Bekasi absent →
  unchanged. Retuned two jatinegara bend-test fast-forwards (2:25→1:20,
  3:20→1:50) to the new speed. JNG snapshot regenerated; verifier ALL
  PASSED; suite 50 passed + same 5 pre-existing visual failures.
  (JNG, user-provided real-world speeds) **Track-class speed model**: new
  `trackSpeeds` scenario config + `buildSegmentLimits` + engine per-segment
  caps (MoveCtx.segmentSpeeds, min(plan speed, segment limit); TrainState
  .segLimitU set in setSegment). JNG: G→Y = 900m/288u (3.125 m/u);
  straights on t1-t4/t6/t7 = 60 km/h; ALL turnouts/crossovers = 30; t5+t8
  = 30 everywhere; east of column Y the scale is Y→AW = 900m/384u
  (2.34375 m/u) with t1-t4 = 120 km/h and everything else east = 30.
  Leg plan speeds become the layout max when trackSpeeds is present, so
  caps shape the actual run. Placement pass deliberately ignores caps.
  Bend tests rewritten to poll 1s clock steps (robust to speed changes).
  Live probe: east-zone ≈14-16 u/s (=120 km/h at eastern scale) vs station
  straights ≈5.3 and turnouts 2.7. Snapshot regenerated; verifier passed;
  suite unchanged (same 5 pre-existing).
  (JNG, user-reported mid-throat spawns) **Placement teleport fix**: at sim
  start the placement pass interpolated each train's approach by
  `sec − originArr` at realistic speeds → trains materialized deep in the
  throat (often on top of a red signal, freezing there). buildJourney now
  exposes `start.entryX` for atTrackEdge journeys and initializeSim caps the
  interpolation at that entry: trains enter from the visible track edge and
  run the rest live; internal clock only advances by covered distance so
  absolute dwell anchors still hold. Bekasi plans carry no entryX →
  untouched. Snap test now sets the NW1 route like a dispatcher (trains
  queue at red entry signals until routed). Live probe: all four trains
  slide in from their entries and hold at their first facing signal.
  (JNG, spawn/dwell clock fix — the real root cause of the frozen trains)
  **Symptoms**: trains teleported to hold points on the first tick and sat
  there with GREEN bodies forever, regardless of signal aspects. Root cause:
  buildJourney returns originArr=0 while timetable anchors were absolute
  seconds-of-day, so the tick loop computed a ~21600s travel budget and the
  engine burned it by insta-consuming every dwell. Fix (all gated on new
  scenario knob `dwell.relativeAnchors`, JNG only → Bekasi byte-identical):
  ① anchors rebased onto the train's own materialization clock so dwells
  last their scheduled DURATION (departAt now 0/600/602 not 21900/…);
  ② initializeSim places relative-clock trains fresh at their entry with
  st.time=0 (no schedule interpolation); ③ the live tick feeds REAL elapsed
  seconds per train (lastTickRef/spawnSimRef) instead of a travel budget;
  meetsRelease compares against rel-now. Signals stay ALL RED at start
  (user request — the seeded-clear experiment was fully reverted, including
  its test edits). Live probe: slide-in from edges → red-body holds at
  entry signals → run after dispatch → all four reach the platform island.
  Tests: grid-snap asserts Math.abs(x%16)==8 (entry x is negative); NW1 map-
  click sets J201's road; interactive/NE2/bend tests back to red-first flows. The 5
  failing visual snapshots are pre-existing
  WIP drift (proven by surgically reverting the fix and re-running —
  identical failures, 0 pixel delta attributable to the change).
- (JNG, user-reported) **Platform-dwell marker jump fixed (render-only).**
  While running, the drawn marker leads the engine centre by the
  engine-to-visual front difference (58−32=26 on JNG) so its nose tracks the
  protection footprint, but the dwell parked the CENTRE on the platform — so
  the lead was switched OFF the instant the dwell started: the marker ran one
  cell past the platform, then teleported back (and would jump forward again
  at departure). Bekasi is immune (half-lengths equal → difference 0). Fix:
  the lead now RAMPS to zero around the dwell waypoint (`dwellEaseRef` in
  dispatching-table.tsx): the marker glides onto the platform as the engine
  arrives and pulls ahead again as it departs. Engine positions, occupancy,
  and both topology snapshots are untouched; probe-proven (rx 392→360 jump
  became a monotone glide, 0-cell jump at dwell start); JNG e2e 7/7, full
  suite 51 passed + the 5 pre-existing visual failures.
- **KNOWN BREAKAGE (pre-existing, uncommitted WIP): `verify:bekasi` FAILS.**
  The in-flight atTrackEdge work added `entryX?` to `plan.start`; the snapshot
  serializer encodes undefined as `{$undefined: true}`, so all 342 Bekasi
  journeys now serialize an entryX block (1026 lines) — a serialization-only
  delta, no behavior change. The JNG baseline was regenerated but Bekasi's
  was not. Repair choice (regenerate Bekasi baseline vs. omit undefined in
  the projection) is PENDING — user said leave it for now; whoever commits
  the atTrackEdge WIP must decide.
- (deferred by user) **J410 should eventually APPROACH VIA t6**: enter the map
  on t6 from the west border and cross onto t5 through the xov10 points,
  instead of materializing at t5's west end (column R). Requires routing the
  approach leg through the throat — an engine change, not yet designed. Do
  NOT treat the current column-R slide-in as final behavior.

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
  point on a slope. NE8 sits at AY4, the midpoint of `xov30` (offset 45.25).

- 2026-08-21 — Western compaction completed: the empty old B–N approach was
  removed, while the old N boundary and all geometry east of it moved left 12
  columns (now B). Western entry approaches remain before NW1/NW3/NW5/NW7;
  their map-edge stop stays 8 units inside B. Translated piece positions,
  station stops/shapes, grid width/viewBox, verifier expectations, and the JNG
  snapshot were all updated. Topology/connectivity and derived switch ids are
  unchanged; Bekasi remains byte-identical.
- 2026-08-21 — PC22 was moved left by one JNG grid column. It is the two ends
  of `xov16`, so both endpoints moved together: AC4→AB4 and AI10→AH10. The
  compiler and JNG verifier accept the move; its PC22 control-group mapping
  and switch identities remain intact.
- 2026-08-21 — Flank protection is now layout-configurable. Default behaviour
  remains Bekasi's `CELL / 3`; JNG sets an 11-unit clearance. This preserves
  route locks for NE2→XW4 through PC13/PC14 while excluding the adjacent but
  non-fouling coupled PC22 at AH10/AB4 (its branch stays 11.31 units clear).
  NE4's candidate route still passes PC22 at AH10, but neither candidate now
  spuriously treats PC22 as a flank; normal route/point locking decides any
  simultaneous-route conflict.
- 2026-08-21 — PC15, PC16, PC18, PC19, and PC20 each moved one grid column
  left, as coupled units (`xov20`, `xov22`, `xov24`, `xov25`, `xov28` moved
  whole). Controls now sit at AJ11, AM13, AP15, AP11, and AS11. Topology,
  switch ids, control groups, dashSides, and Bekasi are unchanged; the JNG
  baseline was re-captured.
- 2026-08-21 — P34, P63, and P58 moved one grid column left. They are one
  chain, not three independent points: P34 is `xov27:from`, P63 is its
  `splitAt` inverted point, and P58 is `xov30:from`. `xov27` moved whole to
  AR10–AV6 (split AT8) and `xov30`'s west end followed, so the `t5ac` east
  extremity (752→736) and the `t6am` west extremity (784→768) moved with
  them, plus the JNG-E `t5ac` platform (744→728) that must sit on the line.
- 2026-08-21 — The BA2 fixed turn moved one column left to AZ2: `xov30`'s east
  end and the `t8am` west extremity both went 848→832. This also restores
  `xov30` to a true 45° diagonal (64×64 instead of 80×64), so the vertex
  signal NE8 stays at its authored midpoint offset and now renders at AX4.
- 2026-08-21 — P36 (`xov29:from`, single lever `g36`) and its fixed turn moved
  one column left: `xov29` went AV10→AU10 / AX8→AW8 whole, and the `t5ap` west
  extremity followed (800→784). The turn stays a plain join (no switch), and
  the t5ap platforms at 856/920 still sit on the line.
- 2026-08-21 — PC23 and PC24 each moved one column left as coupled units
  (`xov31` and `xov32` moved whole). Controls now sit at AX7 and BA7. Both
  land inside existing lines, so no extremity or platform edits were needed.
- 2026-08-21 — The AE4 turn, PC21's right lever, and the AI8 turn moved one
  column left. All three are `xov18`: its ends are the two turns and its
  `splitAt` is PC21's east inverted point. `xov18` moved whole to AD4–AH8
  (split AG7), so the `t7` east extremity (496→480), the `t5ac` west extremity
  (560→544), and `t5y`'s east end (544→528) followed. PC21's WEST lever
  stays at AC7, so the t5y connector is now 64 units long instead of 80. The
  JNG-E `t7` platform moved 488→472 to stay on the line.
- 2026-08-21 — PC19, P34, P63, P58, and the AZ2 turn all moved one column
  left: `xov24` whole (AO12–AQ10), `xov27` whole (AQ10–AU6, split AS8), and
  `xov30` whole (AU6–AY2). Extremities followed — `t5ac` east 736→720, `t6am`
  west 768→752, `t8am` west 832→816 — plus the JNG-E `t5ac` platform
  728→712. PC19's control is now at AO11 and NE8 renders at AW4. P34 and P58
  now sit at the same x as PC19's east lever and P63's diagonal respectively,
  keeping the whole east-throat chain rigid.
- 2026-08-21 — PC20, P36, and the AW8 turn moved TWO columns (32 units) left:
  `xov28` whole (AP12–AR10) and `xov29` whole (AS10–AU8), with the `t5ap` west
  extremity following 784→752. PC20's control is now at AQ11. t4 (y=400) now
  carries four consecutive points at AP10/AQ10/AR10/AS10 with no plain track
  between them — tight but legal; the verifier's control-spacing and
  signal-clearance checks still pass.
- 2026-08-21 — PC23 and PC24 moved another column left (`xov31`, `xov32`
  whole); controls now at AW7 and AZ7. P59 at AV6 is now adjacent to P58 at
  AU6, so the t6am stub between them is one interval with no plain track.
- 2026-08-21 — NE4, NE5, and NE6 moved two columns (32 units) left to AW10,
  BB8, and BB6. Signals are authored as an x along a track group, so these
  are pure `x` edits; each still resolves onto its own group's east edge and
  keeps its protected block section. Platforms were not touched, so NE5/NE6
  now sit west of the JNG-E t5ap/t6am stops at 920.
- 2026-08-21 — Eastern trim: the map now ends at BD instead of BF. All seven
  lines reaching the east edge went `to: 928 → 896` (t1..t4, t5ap, t6am,
  t8am), the six JNG-E boundary stops on those lines went 920→888, and the
  chrome shrank with them (`grid.width` 968→936, schematic viewBox width
  1048→1016). No switch, signal, or connectivity change — only plain track
  east of the throat was removed.
- 2026-08-21 — **Routes could double back on themselves.** `findRoute`'s bearing
  test was `dot > -0.8`, chosen so forward crossover diagonals pass — but a
  BACKWARD 45-degree diagonal scores -0.707 and passed too. So a signal cleared
  east could be routed west over a crossover: XE1 cleared with PC17 set against
  it (`656,496 -> 624,464`), NE4 reached XW3 by running east while signalled
  west, and Bekasi's J5 ran east over P1. Replaced with a requirement of
  forward progress along the running direction (lateral dx==0 still allowed).
  Two tests had ENSHRINED the bug and were retargeted, not deleted: the JNG
  verifier expected NE4=XW3, and the Bekasi E2E used J5's wrong-way route as a
  workaround (its own comment called it "wrong-way"). Added a JNG verifier
  check that no route reverses, over all signals x 4 point arrangements.
- 2026-08-21 — Out-of-service track added as `map.outOfService` (group + x
  span + reason). JNG closes t4 and t3 west of H (x 32–128) as "jalur dalam
  pembangunan". Unlike reachability, being unbuilt is a REAL-WORLD FACT no
  switch arrangement can imply, so it is authored — but deliberately kept OUT
  of the topology, leaving connectivity, switch ids, and compiled geometry
  untouched (reopening a line is a one-line edit). `closedSpanOnRoute` in
  route-search.ts refuses any route running along a closed span; the renderer
  greys it and crosses its open end. XW4 all-normal is refused; PC3 alone only
  reaches t3 (also closed); PC7, or PC3+PC2, give a clear road.
- 2026-08-21 — Route setting is now layout policy: `interlocking.routeSetting`
  is `"auto"` (default, Bekasi's historical auto-throw) or `"manual"`. JNG uses
  manual, so a signal whose route needs a point the user has not set is
  refused and the point is NOT moved for them. The refusal is specific and
  DERIVED from the route's required switch moves: `"posisi wesel salah: Wesel
  36 harus BELOK"` (with every wrong control named once, including coupled
  levers). A physically out-of-service span instead says `"jalur tidak bisa
  dilewati"`, because moving a point cannot fix it. REJECTED: authoring an
  `inactive` flag per track — reachability is already implied by switch
  positions plus connectivity, it is per-route rather than per-track (t5ac is
  unreachable from NE2 but live from XE5), and a second source of truth would
  need re-authoring on every point move. The E2E case was retargeted from auto
  to manual (NE5 needs P36; refused, then clears once thrown).
- 2026-08-21 — JNG train markers now hop on the 16-unit display grid, like
  Bekasi, rather than sliding continuously. This is a PRESENTATION choice:
  `continuousTrains` is omitted on JNG, and the shared renderer snaps to the
  layout's visual `gridCellSize` (16), not the engine's 58-unit cell. The
  engine still runs continuously and retains true coordinates for stops,
  occupancy, conflicts, and reservations. The flyover fixture keeps
  `continuousTrains: true`; Bekasi's existing 58-unit snapped branch remains
  byte-identical. The marker centre snaps to JNG's VERTICAL grid lines (`x = 8
  mod 16`), letting its four-cell body occupy whole cells instead of straddling
  them. The visual marker also compensates for the engine's longer safety
  footprint when held: J102 at NE2 (AT14) now begins at AU14 rather than AV14,
  while its true operational stop and protection are unchanged. The same
  visual-front offset applies while running, too: clearing NE2 can never make
  J102 jump back east one cell as the engine transitions from stopped to
  running. E2E asserts both the 16-unit lattice hops, the NE2 hold (`x=776`),
  and no eastward jump after release. Turning markers are already derived from
  the compiled current segment rather than their cardinal train direction:
  thrown PC13 sends J102 through the 45° crossover at AM13–AO15 and it renders
  with `rotate(-135)` while stepping its 16-unit grid cells. E2E covers that
  visible rotation.
- 2026-08-22 — Train markers can now be ARTICULATED: `presentation.
  articulatedTrains` (JNG on, everything else off) draws the body as a mitred
  outline along the track centre-line, so a train straddling a thrown point
  bends at the junction instead of staying a rigid rotated box. The spine is
  walked from the marker's own visual front through the engine's existing
  segment + trail geometry, so the drawn shape cannot disagree with the
  simulated one; collinear joints are dropped, so plain track keeps the
  cheaper rect and the bend is never sticky. Engine footprint, stopping,
  occupancy, and conflicts are untouched. REJECTED: bending by rotating
  sub-boxes per segment (gaps/overlaps at the joint) and widening the marker
  into a curve (a schematic point is a hard angle, not a radius). NOTE: JNG's
  45° crossovers are shorter than the 64-unit marker, so a train there is
  bendy from entry to exit and never rigid mid-crossing — the old "rigid marker
  rotates on the diagonal" E2E was superseded by the bend test rather than
  kept as a false expectation.
- 2026-08-22 — The bend was appearing HALF A BODY LATE (it only looked bent
  once the tail neared the point). Cause: the engine only records nodes the
  train's CENTRE has passed (`trail`), and swaps `segFrom`/`segTo` at the
  centre too — so a nose already inside a thrown point is invisible to any
  spine built from history alone. Fix: `pathAhead()` in train-engine walks the
  route FORWARD from the current segment using the same `resolveNode` point
  logic (read-only, bounded to 16 hops), and the renderer now builds the body
  as an arc-length window on one continuous route polyline (trail + current
  segment + lookahead), locating the drawn centre by projection. That also
  fixed two artifacts from mixing snapped display coords with raw engine
  geometry: a bendy/rigid flicker mid-crossover, and the marker jumping
  BACKWARD one cell at the straight-to-diagonal handover — the diagonal branch
  was missing the visual-front compensation the horizontal branch already had
  (now shared as `VISUAL_HALF_LEN`).
- 2026-08-22 — JNG platform dwells appeared one/two cells beyond the island
  (J201/J310 around W–Z; J102 around S–V) after the signal-safe visual offset
  was added. Root cause: the renderer treated EVERY `departAt` dwell as if it
  were a signal hold and shifted the marker by the engine-vs-visual safety
  footprint. A scheduled station waypoint is already the TRAIN CENTRE at its
  authored platform X, so that offset is wrong there. The renderer now detects
  `atPlatformDwell` and uses zero front compensation for that state; signal
  holds and running trains retain the safety-front offset. Engine stop Xs stay
  unchanged (`JNG=360`), and an E2E asserts all four JNG services render at
  the drawn island centre.
- 2026-08-22 — JNG arrivals could show one cell beyond the platform, consume
  the exit signal, then teleport back for the dwell; with the exit red they
  could be held before the station and never enter the dwell. Cause: after
  reaching the station waypoint the engine reused the SAME animation-frame
  time budget on the next leg before the renderer got an arrival frame. On a
  compact platform the train nose is already at the exit signal, so that extra
  movement also consumed its clear and claimed the reservation. Live movement
  (`ctx.now`) now ends the frame at a waypoint whenever the next leg has a
  pending dwell. The next frame performs the dwell from the exact platform
  centre; the exit signal remains red/unconsumed and governs departure later.
  One-shot placement and meets probes deliberately keep carrying their budget.
  E2E checks arrival at U–X, 20 consecutive dwell seconds with no overrun, and
  a continued platform hold after booked departure while XE1 remains red.
- 2026-08-27 — JNG markers glitched one cell at the corridor BOUNDARY (not the
  platform). Cause: a pass-through stop (schedule `arr == dep`, e.g. JNG-W /
  JNG-E) gets `anchor = expected arrival`, so its `departAt` EQUALS the arrival
  time and the engine runs straight through on a strict `st.time < departAt`.
  The renderer instead compared times (`<=`, and a separate `<` for
  `atPlatformDwell`), so at the boundary the comparison was a floating-point
  tie: it read as a dwell, dropped the front compensation, and snapped the
  marker back one visual half-body (-32) with zero engine movement, then
  pushed it forward again. Fixed structurally — `LegPlan.passThrough` is set
  from `stops[i].arr === stops[i].dep` at journey build time, and both
  `atPlatformDwell` and the ease test exclude pass-through legs instead of
  comparing clocks. Real platform dwell/ease behaviour is unchanged (arrival
  still eases onto x=360, departure still ramps back out). Verified by A/B:
  toggling only this guard makes the -32 step appear/disappear, on an
  otherwise byte-identical build. E2E `"...never steps backward at a
  pass-through boundary"` sweeps the whole journey and fails without the fix.
  Note `probe:bearing` is RED on this tree and is PRE-EXISTING (it fails
  identically with all session changes stashed) — unrelated to this fix.
- 2026-08-27 — Fixed amber reservation line re-lighting when train passed
  short route: when 5024C ran past `NW1A` (x=240), `NW1`'s reservation
  (`[[64, 496], [96, 496], [240, 496]]`) was still active awaiting rear-based
  release at x=282. `reservationAhead` used `bestDist > 58` cutoff to detect
  when no train was on a route; once the train's front was >58 units past the
  endpoint x=240, `bestDist > 58` falsely treated the route as having no
  train on it and returned the entire route in full amber. Fixed in
  `reservationAhead`: when the nearest train's front is past the route endpoint
  along the running direction, the remaining route ahead is collapsed to empty
  (`[[end, end]]`) instead of triggering the `bestDist > 58` full-route fallback.
  New E2E `"jatinegara NW1 reservation never re-lights after train passes"` passes.
- 2026-08-27 — Added two new signals in JNG layout: entry signal `NW1A` at
  O16 ([240, 496], on t1 facing eastbound) and exit signal `XW2A` at L14
  ([192, 464], on t2 facing westbound). Total signals are now 26 (4 NW, 5 NE,
  9 XW, 8 XE). Re-routed `NW1` to intermediate `NW1A` -> `XE1`, and `XW2` to
  `XW2A` -> west boundary. JNG baseline re-captured and verifiers updated.
- 2026-08-27 — Fixed `P8+P3 × terkunci oleh NW1` during platform 1 dwell:
  reduced the trailing reservation release offset on dense schematic layouts
  by one cell wide (`GRID_PITCH`, 16 units on JNG). `RESERVATION_REAR_OFFSET`
  keeps a trailing buffer behind running trains so turnouts cannot be clicked
  the moment the tail crosses them, but does not extend 58 units back onto
  approach crossovers during a 64-unit platform dwell. 5024C dwelling at
  platform 1 (x=360) now frees P3 at S16 (x=304), making PC11 clickable and
  reversable while maintaining proper approach locking during the run. New E2E
  `"jatinegara PC11 unlocks while 5024C dwells at platform 1"` passes.
- 2026-08-21 — Grid chrome trimmed to end at BF: `grid.width` 936→928. The
  column count is `round(grid.width / gridCellSize)`, so 936 drew 59 columns
  (last BG) while the track ends at BD. 928 draws 58 (last BF), keeping one
  spare column past the map edge for the boundary marks.
- 2026-08-26 — Real timetable converter landed.
  `scripts/build-jng-schedule.ts` reads the 168Railway working timetable
  (`data/timetable/`) and emits `app/dispatching/jatinegara-schedule.ts`.
  Each train becomes a 3-stop `ScheduleEntry`: boundary (JNG-W or JNG-E,
  arr==dep=neighbour dep time), JNG platform (real arr/dep), exit boundary
  (arr==dep=next neighbour arr time). Direction is derived from the corridor:
  prev neighbour MTR/POK→eastbound (t1), KLD/BKS→westbound (t2). Susul
  remarks (`DISUSUL <KA>`) are parsed into `meets`. The old stub schedule
  (J201/J102/J310/J410) is replaced; e2e tests reference real train numbers
  (5024C, 5509B). The J410 entryLine test is `.skip` — no real train uses
  entryLine, but the mechanism is still verifier-tested. JNG baseline
  re-captured (the old stub schedule's journey waypoints changed).


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
- **`verify:bekasi` is currently RED on the working tree (see decisions log).**
  It is a pre-existing, serialization-only delta from the uncommitted
  atTrackEdge WIP (entryX undefined blocks), not a regression of whatever you
  just changed — verify with `git stash` if unsure.
