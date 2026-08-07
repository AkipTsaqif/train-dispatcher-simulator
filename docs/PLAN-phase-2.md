# Phase 2 — N parallel main lines + runtime line selection

## Goal

Support layouts with **more than two parallel main running lines** (e.g. a
quadruple-track corridor) by replacing the hard-coded two-main `topY`/`bottomY`
model with a set of main track groups and a per-journey line-selection
function. **Depends on Phase 1** (direction is a bearing, so "leftbound main"
and "rightbound main" are no longer the only two slots).

## General / non-technical summary

Today the simulator knows exactly two tracks: an "up" line and a "down" line,
and it picks one purely from the train's direction of travel. A bigger station
has many parallel lines (slow, fast, relief, goods). This phase teaches the
system to hold any number of parallel main lines and to decide, for each train,
which line it actually runs on — based on its schedule and the layout, not just
"left or right."

## Current-state analysis

The two-main hardcode (verified):

- `app/lib/dispatch-runtime.ts`
  - `journeyLineY(...)`: `dir === "left" ? map.lines.topY : map.lines.bottomY`.
  - `spawnClearanceGap(...)`: `dir === "right" ? map.lines.bottomY : map.lines.topY`.
  - `prepareMeetDependencies(...)`: `journeyLineY(partner...)` again.
- `app/maps/bekasi-tambun-cibitung.ts`
  - `DispatchMapDefinition.lines: { topY, bottomY, normalDirectionByY }`.
- `app/lib/topology.ts` compiler builds `normalDirectionByY` for **all** main
  groups already (no count check) — it just only ever has two today, and the
  runtime only ever reads two.

So the compiler is mostly ready; the work is the **runtime selection** and the
**map contract**.

## Technical design

### 2.1 Map contract: mains as a list

Change `DispatchMapDefinition.lines` from `{topY, bottomY, normalDirectionByY}`
to:
```ts
lines: {
  /** Every main running line, one entry per main track group. */
  mains: {
    trackGroupId: string;
    lineY: number;                 // compatibility Y (horizontal layouts)
    normalBearing: Bearing;        // from Phase 1
    /** For UI grouping / labeling, e.g. "up fast", "down slow". */
    name?: string;
  }[];
  normalDirectionByY: Record<number, Dir>; // legacy derived view (Bekasi)
};
```
Keep `topY`/`bottomY` as **deprecated derived getters** for the current
two-main layout so `dispatch-runtime` can be migrated incrementally and the
Bekasi snapshot stays stable. New code must not use them.

### 2.2 Line selection per journey

Replace `journeyLineY` with a selection function:
```ts
selectMainLine(stops, map, scenario): { trackGroupId: string; lineY: number }
```
Selection policy (in order of precedence):
1. **Explicit per-stop track assignment.** Extend `ScheduleStop` with an
   optional `line?: string` (a main `trackGroupId` or line `name`). If the
   timetable says which line, use it. (Timetable data change is allowed here —
   it's additive/optional.)
2. **Scenario default rule.** Add to `DispatchScenarioDefinition` an optional
   `routing.defaultLineByDirection` or a `selectLine` policy hook
   (scenario-injected, consistent with the dependency-injection convention).
3. **Fallback (current behavior).** The single main whose normal bearing
   matches the journey direction; if exactly two, this is exactly today's
   top/bottom choice.

The function must be **total** (always returns a line) and **deterministic**.
Put it in `dispatch-runtime.ts` and unit-probe it.

### 2.3 Spawn clearance and meet dependencies

`spawnClearanceGap` and `prepareMeetDependencies` currently call
`journeyLineY`. Repoint them at `selectMainLine(...).lineY`. Their per-line
signal filters (`signal.lineY === lineY && signal.dir === dir`) already work
for any line once `lineY` and the Phase 1 bearing are correct — verify the
bearing-aware `dir` derivation from Phase 1 is used.

### 2.4 Interlocking / rendering

- `normalDirectionByY` keeps working per-line; with N mains each line Y is
  present, so wrong-way logic generalizes automatically once it reads the
  per-line entry (Phase 1 already made this bearing-aware; confirm).
- Rendering: N mains just means N horizontal track groups; the compiler already
  renders any number of edges. No rendering change needed as long as lines are
  horizontal (arbitrary schematics are Phase 7).

### 2.5 A second test layout

Add a **minimal 3-main fixture** to prove the capability, as a new composition
(NOT wired into the UI): e.g. `app/topologies/three-main-fixture.ts` +
map/scenario/dispatching modules, plus `scripts/verify-three-main.ts`. This is
a synthetic layout (three parallel mains, one crossover pair), small enough to
hand-verify. It must pass `compileTopology` and produce sensible journeys for a
toy timetable.

## Steps

1. Extend `DispatchMapDefinition.lines` to the `mains` list (keep deprecated
   `topY`/`bottomY`). Update the Bekasi map to populate `mains` from its two
   groups.
2. Add optional `line` to `ScheduleStop`; add scenario routing policy hook.
3. Implement `selectMainLine` in `dispatch-runtime.ts`; repoint
   `journeyLineY`, `spawnClearanceGap`, `prepareMeetDependencies`.
4. Verify Bekasi baseline is byte-identical (`verify:bekasi`). Extend the
   snapshot to cover `lines.mains`.
5. Author the 3-main fixture composition + `scripts/verify-three-main.ts`;
   assert counts and that a train assigned to each main gets the right lineY.
6. Static gates + a probe showing three trains on three different mains.

## Acceptance criteria

- [ ] `DispatchMapDefinition.lines.mains` holds all main groups; `topY`/`bottomY`
      remain only as deprecated derived views.
- [ ] `selectMainLine` is total + deterministic, honors explicit timetable
      `line`, then scenario policy, then direction fallback.
- [ ] No production code path reads `topY`/`bottomY` except the deprecated
      compatibility shim.
- [ ] Bekasi baseline byte-identical; `tsc`/`build`/`test:e2e`/`probe:meets`
      pass.
- [ ] 3-main fixture compiles, its verifier passes, and a probe shows trains on
      three distinct mains (proving >2 mains work).

## Open assumptions

- The timetable schema change (`line` on a stop) is additive and optional, so
  `data/schedule.json` needs no edit for Bekasi. If a future layout needs
  per-*leg* (not per-stop) line changes mid-journey, that's a routing concern
  deferred to Phase 4 (route search).
- All mains are still horizontal in this phase (unique Y per main). Non-
  horizontal mains ride on Phase 1 bearings and are fully exercised in Phase 6/7.
- Wrong-way operation on N mains is assumed to "just work" from the per-line
  normal bearing; if the span-union logic has two-line assumptions, note and
  fix within this phase (it's still horizontal, so it should generalize).

## Out of scope

- Crossovers between non-adjacent mains, ladders, or multi-path routing
  (Phase 4). Independent loops (Phase 3). Anything non-horizontal beyond what
  Phase 1 enabled.
