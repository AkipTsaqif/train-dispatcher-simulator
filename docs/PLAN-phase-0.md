# Phase 0 — Shared-contract extraction + equivalence baseline harness

## Goal

Make the layout-facing type contracts layout-agnostic and add a runnable
equivalence/verifier harness, so that every later phase can (a) add new layouts
without importing types from a concrete layout, and (b) prove a refactor did
not change behavior. **No runtime behavior changes in this phase.**

This is the "Phase 1: handle the shared-contract caveat" from
`ADDING_LAYOUTS.md`, plus the baseline harness that doc requires but which does
not yet exist as a checked-in command.

## General / non-technical summary

Right now the shared "shape" definitions (what a dispatch map is, what a
scenario is) live inside the Bekasi-specific files. Any new layout would have
to import its types from Bekasi, which is backwards. We move those shape
definitions into neutral library files, point everyone at the new home, and add
a small checker script that proves nothing about the running app changed. Think
of it as tidying the shared toolbox and adding a "before/after" snapshot camera
before we start rebuilding the engine.

## Technical design

### 0.1 Extract the shared contracts (type-only move)

Today:
- `DispatchMapDefinition`, `Station`, `StationCell` live in
  `app/maps/bekasi-tambun-cibitung.ts`.
- `DispatchScenarioDefinition` lives in `app/scenarios/bekasi-tambun-cibitung.ts`.
- `DispatchDefinition`, `DispatchRuntime`, `PlannedJourney`, `SignalSection`,
  `MeetDependency` live in `app/lib/dispatch-runtime.ts`.

Do:
1. Create `app/lib/dispatch-map.ts`. Move `DispatchMapDefinition`, `Station`,
   `StationCell` into it. It may import topology types from `app/lib/topology.ts`
   (`Dir`, `GNode`, `PointControl`, `SignalDef`, `Sw`, `SwitchState`,
   `CompiledTopology`). Keep the re-export of those topology types here so
   existing import sites keep working during the transition.
2. Create `app/lib/dispatch-scenario.ts`. Move `DispatchScenarioDefinition` into
   it. No imports needed (it is self-contained).
3. Update `app/maps/bekasi-tambun-cibitung.ts` to import the contracts from
   `../lib/dispatch-map` and re-export them (so `dispatching-table.tsx`'s
   existing import path keeps working during this phase; a later cleanup may
   repoint the component).
4. Update `app/scenarios/bekasi-tambun-cibitung.ts` to import from
   `../lib/dispatch-scenario` and re-export.
5. Update `app/lib/dispatch-runtime.ts` to import the two contracts from the
   new lib files instead of the concrete Bekasi modules. `dispatch-runtime.ts`
   currently imports `DispatchMapDefinition` from `../maps/bekasi-tambun-cibitung`
   and `DispatchScenarioDefinition` from `../scenarios/bekasi-tambun-cibitung` —
   repoint both to the lib files. This removes a layering inversion (a lib file
   importing from a concrete layout).

Constraint: **type-only.** Do not move, rename, or alter any runtime value
(the `BEKASI_TAMBUN_CIBITUNG_MAP`, `BEKASI_TAMBUN_CIBITUNG_SCENARIO`,
`BEKASI_TAMBUN_CIBITUNG_DEFINITION`, `BEKASI_TAMBUN_CIBITUNG_DISPATCH` consts
stay exactly where they are with exactly the same contents).

### 0.2 Decide the fate of `app/lib/trains.ts`

`app/lib/trains.ts` is a legacy adapter pinned to the Bekasi definition; its
only consumer is `probes/meets.probe.ts`. For this phase: **leave it pinned to
Bekasi.** Record the decision in `STATUS.md`. Do not migrate it to a generic
contract yet — that becomes relevant only when a second layout exists
(Phase 2+). Re-pointing its type imports to the new lib files is allowed if it
keeps `tsc` clean, but its *runtime binding to Bekasi* stays.

### 0.3 Build the equivalence/baseline harness

`ADDING_LAYOUTS.md` requires: for a replacement/refactor, capture old output
first and require **byte-identical compatibility projections**, using a
deterministic serializer that preserves property/array order and explicitly
represents `undefined`, ordered `Set` values, `Infinity`, and `-Infinity`
(plain JSON converts infinities to `null`).

Do:
1. Create `scripts/lib/serialize.ts` — a deterministic serializer:
   - sorts object keys, preserves array order;
   - renders `undefined` as a distinct token (e.g. `{"$undefined":true}`),
     `Infinity` / `-Infinity` as `{"$inf":1}` / `{"$inf":-1}`, `NaN` distinctly;
   - renders `Set` as an ordered array of its iterated values tagged
     `{"$set":[...]}`; `Map` as `{"$map":[[k,v],...]}`;
   - handles the `CompiledTopology` / `DispatchRuntime` shapes (functions in the
     runtime — `aspectOf`, `meetsHold` — are *not* serialized; snapshot only
     data projections).
2. Create `scripts/snapshot-layout.ts` — imports a composition root (start with
   `app/dispatching/bekasi-tambun-cibitung.ts`), builds the runtime, and writes
   a canonical snapshot of the **data projections** to a file:
   - compiled topology compatibility outputs: `nodes`, `trackPaths`,
     `signals.items` (with resolved x/y/dir), `signalSections`, `loops`,
     `switches` (items/coupled/controls/initialState), `stationPlatformCenterX`;
   - runtime outputs: `journeys` (each train's leg plan: waypointX/lineY/speed/
     departAt/station per leg, originArr, start), `meetsByTrain` (as a sorted
     structure), `signalSections`, `movement.trainHalfLen`.
   - Output goes to `scripts/baselines/<layout-id>.snapshot.txt`.
3. Create `scripts/verify-layout.ts` — parameterized by layout import path;
   rebuilds the runtime, serializes identically, and `diff`s against the
   committed baseline; exit nonzero on any difference. Print a short
   human-readable diff summary (first N differing lines with paths).
4. Add npm scripts:
   - `"snapshot:bekasi": "bun scripts/snapshot-layout.ts"`
   - `"verify:bekasi": "bun scripts/verify-layout.ts bekasi-tambun-cibitung"`
5. Commit the baseline snapshot file. This is the "before" camera.

### 0.4 Prove equivalence for this phase's move

Run the snapshot **before** the 0.1 extraction (on the un-moved code), commit
it, then do the 0.1 move, then run `verify:bekasi`. The snapshot after the move
must be byte-identical to the one before. That proves the type extraction
changed nothing observable.

## Steps

1. `git status` clean; create a branch (e.g. `chore/phase-0-contract-extraction`).
2. Write `scripts/lib/serialize.ts`, `scripts/snapshot-layout.ts`,
   `scripts/verify-layout.ts`.
3. Run snapshot on current code → `scripts/baselines/bekasi-tambun-cibitung.snapshot.txt`. Commit.
4. Do the 0.1 type-only extraction.
5. Run `verify:bekasi` → must be byte-identical. If not, the move leaked a
   runtime change; fix until identical.
6. Run static gates: `npx tsc --noEmit`, `npm run build`, `npm run test:e2e`,
   `npm run probe:meets`.
7. Update `docs/STATUS.md` (mark Phase 0 done, log the `trains.ts` decision).

## Acceptance criteria

- [ ] `app/lib/dispatch-map.ts` and `app/lib/dispatch-scenario.ts` exist and
      hold the moved contracts; no concrete-layout file defines them anymore.
- [ ] `app/lib/dispatch-runtime.ts` imports the contracts from lib, not from a
      concrete layout module.
- [ ] `npx tsc --noEmit` passes.
- [ ] `scripts/baselines/bekasi-tambun-cibitung.snapshot.txt` is committed.
- [ ] `bun scripts/verify-layout.ts bekasi-tambun-cibitung` exits 0 and reports
      no diff against the committed baseline, **and** the baseline was captured
      before the extraction (proving the extraction was behavior-preserving).
- [ ] `npm run build`, `npm run test:e2e`, `npm run probe:meets` all pass.
- [ ] `STATUS.md` records the `trains.ts` decision.

## Open assumptions

- The composition root modules execute top-level side effects
  (`compileTopology(...)` at module init, `createDispatchRuntime(...)`). The
  snapshot/verify scripts import them directly and rely on that. If a later
  phase makes composition lazy, the scripts must call an explicit builder.
- `process.env.NEXT_PUBLIC_ENABLED_TRAINS` affects the built runtime (it filters
  the train set). For a stable baseline, the snapshot/verify scripts should set
  a fixed value (match the e2e suite: `107B,6082B,30A,2523`) or unset it
  explicitly so the baseline is reproducible. Decide and record in STATUS.md.
- Bun can import the TS modules under `app/` directly (it already does for
  `probes/meets.probe.ts`). No bundler step needed for the scripts.

## Out of scope

- Adding any new layout.
- Migrating `app/lib/trains.ts` off Bekasi.
- Changing any compiler, engine, runtime, or UI behavior.
