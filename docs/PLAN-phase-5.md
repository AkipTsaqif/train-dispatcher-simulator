# Phase 5 — Per-edge 2-D occupancy + multi-segment train bodies

## Goal

Model train occupancy as a **2-D body spanning multiple edges/segments** on the
track graph, rather than a point with a half-length on a single horizontal
line. This is what lets a long train correctly occupy a junction, a curve, and
two block sections at once — a prerequisite for flyovers (Phase 6) and for
correct fouling in complex throats. **Depends on Phases 1 and 4.**

## General / non-technical summary

Right now a train is treated as a dot with a little length around it, sitting on
one straight horizontal piece of track. The simulator checks "is this block
occupied?" by comparing x-ranges on a single line. A real long train can be
bent across a curve, hanging through a junction, or straddling two track
sections at once. This phase gives trains a true two-dimensional footprint that
follows the track wherever it goes, so occupancy and collision detection stay
correct on curved, junction-heavy layouts.

## Current-state analysis

- `TrainState` holds `x, y` (center), `segFrom`/`segTo` (current segment), and
  `dir`. The body is `x ± trainHalfLen` **on the current line only**.
- `occupiedSections(...)` returns sections whose `{lineY, lo, hi}` x-interval
  intersects the body interval — single-line.
- Conflict detection (`dispatching-table.tsx` tick): two trains conflict if
  `|a.x - b.x| < 2*CELL && sameTrack(a,b)` where `sameTrack` is "same segment
  or |Δy| < CELL/2." Horizontal/segment-equality based.
- `trainOccupies` (aspect calc): body interval vs section x-interval on one
  `lineY`.

All of these assume the body is a 1-D interval on one Y.

## Technical design

### 5.1 Represent the body as a polyline footprint

A train occupies the track polyline from its **front** back along the route it
has traversed for `2 * trainHalfLen` (its full length), possibly spanning
several segments (e.g. through a crossover it occupies both the diagonal and
the adjoining horizontal pieces). Compute the footprint by walking backward
from the front along the traversed node path for the body length.

The engine already tracks `segFrom`/`segTo`, `nxtNode`, `incoming`. Add a short
trailed history of recent segments (enough to cover the body length) so the
footprint can extend behind the current segment.

```ts
export type TrainFootprint = {
  polylines: [number, number][][];  // one per occupied segment, front→rear
  length: number;
};
export function footprintOf(st: TrainState, ctx): TrainFootprint
```

### 5.2 Occupancy = polyline intersection

Replace the x-interval section test with: a section is occupied if the train's
footprint polyline intersects the section's polyline (Phase 1 made sections
polyline-based) by more than a point (positive-length overlap), consistent with
the existing `segsOverlap` convention. For purely horizontal sections/segments
keep the fast x-interval path (Bekasi stays byte-identical).

`occupiedSections` returns the same comma-joined signal-id string for the
Bekasi fast path; the general path produces the same ids for the same physical
situations.

### 5.3 Conflict detection on footprints

Replace the `sameTrack` heuristic with genuine body-vs-body geometric overlap
on the footprint polylines (reuse `segsOverlap`-style logic), with the existing
"at rest tolerates overlap" rule preserved. This removes the `|Δy| < CELL/2`
track-spacing fudge (which the code comments already flag as fragile at 57–59
px spacing) and the special-casing for loop diagonals — two bodies conflict
iff their footprints genuinely share track.

### 5.4 Aspect occupancy

`trainOccupies` in the aspect cascade switches to footprint-vs-section-polyline
overlap. The `skip` (self) logic and the "non-block signals skip trains moving
in the signal's direction" rule are preserved.

### 5.5 Performance note

Footprint computation is per-train per-frame; sections/signals are a few dozen.
Polyline intersection is O(segments²) with tiny constants. Fine at current
scale; add a spatial index only if a profiler demands it.

## Steps

1. Add segment-trail history to `TrainState` (bounded to body length).
2. Implement `footprintOf`.
3. Rewrite `occupiedSections`, `trainOccupies`, and the tick conflict check to
   footprint-polyline overlap (horizontal fast path preserved).
4. Bekasi baseline byte-identical (occupancy decisions for the horizontal
   layout must be unchanged); all e2e pass, especially the conflict-failsafe
   and "no false-positive on queued trains" tests.
5. New probe: a train mid-crossover occupies both the diagonal and adjoining
   sections; a long train straddling two sections reds both; two trains on a
   curve conflict only on true overlap.
6. Static gates.

## Acceptance criteria

- [ ] Train occupancy is a multi-segment 2-D footprint, not a single-line
      interval.
- [ ] A train straddling a junction/curve occupies all sections its body
      physically covers.
- [ ] Conflict detection uses true body overlap (no `|Δy|` track-spacing fudge).
- [ ] Bekasi baseline byte-identical; `tsc`/`build`/`test:e2e`/`probe:meets`
      pass; conflict/occupancy e2e still green.
- [ ] New probes for straddle + curve-conflict pass.

## Open assumptions

- Body length is currently `2 * CELL` (one `trainHalfLen` each side) and uniform
  for all trains. This phase keeps uniform length; per-train length (from
  `consist`) is a small follow-up if wanted.
- The traversed-path history is only needed back as far as the body length;
  older history can be dropped (bounded memory).
- Wrong-way span logic (`wrongWaySpans`/`forcedRed`) stays on the reservation
  polylines, not the body footprint, so it is unaffected except where it reads
  occupancy; verify during implementation.

## Out of scope

- Per-train variable length/weight, acceleration curves, or braking distance.
  Track-circuit vs axle-counter occupancy modeling. These are fidelity features,
  not layout-complexity features.
