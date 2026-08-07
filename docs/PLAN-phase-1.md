# Phase 1 — Generalize direction: `Dir` (left/right) → per-edge bearings

## Goal

Replace the scalar left/right notion of direction with a per-edge, per-point
**bearing/vector** model throughout the topology compiler, train engine, and
interlocking, so that tracks are not required to be horizontal and "direction
of travel" is a geometric property, not a hard-coded axis. **The Bekasi layout
must keep working byte-identically** (it is fully horizontal, so it is the
degenerate case).

This is the keystone phase: Phases 2–7 all assume direction is a vector.

## General / non-technical summary

Today the whole simulator assumes trains only ever go left or right along flat
horizontal lines. That assumption is baked into the type system (`Dir =
"left" | "right"`), the graph walker, the signal-aspect logic, and the train
mover. To support real stations — with diagonal approaches, curves, and
junctions that aren't neat left/right crossovers — we teach the system that
"which way am I going" is a direction arrow (a vector), not just "left" or
"right." Because the current layout is perfectly flat, it should behave exactly
as before; we're just making the engine capable of more.

## Current-state analysis (what to change)

The scalar assumption lives in these concrete places (verified against the
code):

- `app/lib/topology.ts`
  - `export type Dir = "right" | "left"`.
  - `GNode.straight: Record<Dir, string|null>` and
    `branch?: Partial<Record<Dir, {path, farSw}>>` — the movement graph is
    keyed by left/right.
  - `directionForDelta(deltaX, context): Dir` throws on `deltaX === 0` — this is
    the hard "no vertical" guard.
  - Signal `dir` is derived from the *facing* delta's x-sign only.
  - `CompiledTopology.lines.normalDirectionByY: Record<number, Dir>` — normal
    direction per line Y.
- `app/lib/train-engine.ts`
  - `LineDir = "right" | "left"`; `SignalLike.dir`; `MoveCtx`; `TrainState.dir`.
  - `resolveNode(nodeId, dir, incoming, ctx)` reads `node.straight[dir]` and
    `node.branch?.[dir]`.
  - Signal-ahead detection: `s.dir === st.dir && s.y === st.y` plus an x-side
    test (`s.x < st.x - halfLen` for left, `>` for right).
  - `occupiedSections`, `signalSections` produce `{sig, lineY, lo, hi}`
    x-intervals.
- `app/components/dispatching-table.tsx`
  - `walkRoute` walks `node.straight[dir]` / `branch[dir]`.
  - `NORMAL_DIR` (`normalDirectionByY`) drives wrong-way detection
    (`wrongWaySpans`, `forcedRed`) which assume collinear horizontal spans.

## Technical design

Introduce a bearing type and make the graph/section/signal models
bearing-aware, while keeping a **derived left/right view** for the parts of the
UI that are legitimately 2-state (e.g. which arrow glyph to draw).

### 1.1 New direction primitives (`app/lib/topology.ts`)

```ts
/** A unit-ish travel bearing. For the current horizontal layouts this is
 *  exactly (±1, 0); the general case allows any (dx, dy) not both zero. */
export type Bearing = { dx: number; dy: number };

export const bearingOf = (from: TopologyPoint, to: TopologyPoint): Bearing => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) throw new Error("zero-length bearing");
  return { dx: dx / len, dy: dy / len };
};

/** Dot product of two bearings; >0 same general direction, <0 opposite. */
export const bearingDot = (a: Bearing, b: Bearing): number =>
  a.dx * b.dx + a.dy * b.dy;
```

Keep `export type Dir = "right" | "left"` for backward compatibility, but stop
using it as the *storage* key for graph connectivity. Provide
`bearingToDir(b: Bearing): Dir` (sign of `dx`, throwing only if `dx === 0` **and**
the caller genuinely needs a horizontal answer) for the legacy/UI view.

### 1.2 Rework the movement graph to be bearing-keyed

The core change: a node no longer stores "the neighbor to my left/right." It
stores an **ordered list of exits, each with a bearing**, plus which exit the
active switch port selects.

Replace:
```ts
straight: Record<Dir, string|null>;
branch?: Partial<Record<Dir, { path: string[]; farSw: number }>>;
```
with:
```ts
export type GNodeExit = {
  neighbor: string;          // next node id along this exit
  bearing: Bearing;          // travel bearing leaving this node toward neighbor
  viaSwitchPort?: "normal" | "reversed"; // set when this exit is switch-selected
  branchPath?: string[];     // for a diverted exit: intermediate node ids
  farSw?: number;            // far switch of a branch exit
};
export type GNode = {
  x: number; y: number;
  sw?: number;
  exits: GNodeExit[];        // all physical ways out, with bearings
};
```

Compiler work: when building `graphNodes`, compute each exit's bearing from the
edge geometry (first segment leaving the node). For switch nodes, mark which
exit is normal vs reversed. A boundary node has one exit; a through node has
two (opposite bearings); a switch node has up to three (common-side in,
normal/reversed out).

`resolveNode` in the engine becomes: given the **incoming bearing** (the
bearing the train arrived on), pick the exit that (a) is open per the switch
state and (b) continues most nearly straight (maximize `bearingDot(incoming,
exit.bearing)` among open, non-reversing exits). This reproduces today's
straight/branch behavior for the horizontal case and generalizes to curves.

### 1.3 Engine signal/occupancy model

- `SignalLike` gains `bearing: Bearing` (derived at compile time from facing);
  keep `dir` as a derived convenience for horizontal-only UI decisions.
- "Signals ahead" test: instead of `s.y === st.y && x-side`, use: signal is on
  the train's current segment **and** the signal's bearing has positive dot with
  the train's travel bearing **and** the signal lies ahead along the segment
  (project onto the segment direction, compare parameter `t`).
- `signalSections` / `occupiedSections`: keep `{sig, lineY, lo, hi}` for the
  horizontal fast path **but** add a general path: a section is an ordered list
  of edge ranges (the compiler already authors `TopologyEdgeRange`!). Expose a
  section's geometry as a polyline and test train-body overlap by projecting
  the body onto that polyline rather than a raw x-interval. For Bekasi the
  polyline is a single horizontal segment, so results are identical.

### 1.4 Interlocking (`dispatching-table.tsx`)

- `walkRoute`: follow `exits` by bearing continuity + switch state instead of
  `straight[dir]`/`branch[dir]`. The route polyline `pts` it already builds is
  bearing-agnostic, so `routesOverlap`/`segsOverlap` need no change.
- `NORMAL_DIR` (`normalDirectionByY`) is Y-keyed and horizontal-only. Introduce
  a per-track-group normal **bearing** in the compiled output
  (`normalBearingByGroupId`), and re-express `wrongWaySpans`/`forcedRed` in
  terms of "a reserved route segment whose bearing opposes the group's normal
  bearing" rather than "an x-interval running backwards." Keep the Y-keyed
  value as a derived view for the current layout so the existing wrong-way e2e
  tests pass unchanged.

### 1.5 What does NOT change

- `routesOverlap`, `segsOverlap` (pure 2-D geometry — already general).
- The rAF loop, reservation lifecycle, notification board (they consume
  positions/aspects, not the direction representation).
- Rendering of tracks (SVG paths already come from edge geometry).

## Steps

1. Add `Bearing`, `bearingOf`, `bearingDot`, `bearingToDir` to
   `app/lib/topology.ts` with unit-level probes.
2. Change `GNode` to the `exits` model; update the compiler's graph-building to
   populate exits + bearings. Keep producing the old `straight`/`branch` shape
   temporarily behind a compatibility flag if it helps stage the migration.
3. Update `train-engine.ts` `resolveNode` + signal-ahead + section projection to
   bearings.
4. Update `dispatching-table.tsx` `walkRoute`, and add `normalBearingByGroupId`
   to the compiled output; re-express wrong-way logic on bearings (keeping the
   Y-keyed derived view for Bekasi).
5. Re-run the Phase 0 baseline: `bun scripts/verify-layout.ts
   bekasi-tambun-cibitung` must be **byte-identical** (the compiled projections
   and journey plans must not change for the horizontal layout). Extend the
   snapshot to include the new `normalBearingByGroupId` so it is itself pinned.
6. Static gates: `tsc`, `build`, `test:e2e`, `probe:meets`.

## Acceptance criteria

- [ ] `Bearing` is the storage representation of direction in the movement
      graph; `Dir` remains only as a derived/UI view.
- [ ] `resolveNode` selects exits by switch state + bearing continuity (no
      `straight[dir]` lookup).
- [ ] Signal-ahead and section-occupancy tests use projection onto the segment/
      section polyline, not raw x-intervals (x-interval fast path may remain
      for purely horizontal sections).
- [ ] `directionForDelta` is no longer on any path that a non-horizontal edge
      would hit (it may still exist for legacy horizontal callers).
- [ ] `bun scripts/verify-layout.ts bekasi-tambun-cibitung` byte-identical.
- [ ] `tsc`, `build`, `test:e2e`, `probe:meets` all pass.
- [ ] A new probe constructs a small **non-horizontal** fixture (e.g. a diagonal
      edge) and shows a train traverses it and a signal on it stops/releases —
      proving the model is no longer horizontal-only.

## Open assumptions

- The interlocking's wrong-way rule can be re-expressed on bearings without
  changing Bekasi behavior. If the current x-interval span union turns out to
  have horizontal-only subtleties that don't map cleanly, keep Bekasi on the
  Y-keyed path and gate the general path behind "layout is non-horizontal,"
  then revisit in Phase 6.
- Switch "common/normal/reversed" port semantics stay; only the *exit
  selection* becomes bearing-based. A true multi-way (3-way) switch is **not**
  in this phase (see Phase 6 assumptions).
- Performance: the projection math is per-frame per train per signal; at the
  current scale (≤ a few dozen signals, a handful of trains) this is fine. No
  memoization work unless a profiler says otherwise.

## Out of scope

- Vertical *running* as a first-class feature (this phase removes the *throw*,
  and enables diagonal/curved geometry; pure vertical mains are still unusual
  and are exercised only via the flyover phase).
- More than two main lines (Phase 2), independent loops (Phase 3), route search
  (Phase 4), 2-D occupancy (Phase 5), flyovers (Phase 6).
