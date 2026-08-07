# Phase 6 — Graded junctions / flyovers + non-crossing converging edges

## Goal

Support **graded (flying) junctions** — where one line passes over another on a
viaduct and a connecting ramp joins them *without* a flat (diamond) crossing —
and generally any **non-horizontal, non-crossing converging/diverging edge**
geometry. This is the phase that actually unlocks "big station throat" topology.
**Depends on Phases 3 and 5** (multi-edge paths + 2-D occupancy) and through
them Phase 1 (bearings).

## General / non-technical summary

Real busy stations avoid flat crossings (where two tracks physically intersect
at grade, so only one train can use the crossing at a time) by sending one line
up and over another on a bridge, with ramps connecting them. On a flat
schematic map these look like lines that cross without connecting. Today the
system can't tell "crosses but connects" (a switch) from "crosses but doesn't
connect" (a flyover), and it assumed everything is flat and horizontal. This
phase teaches it 3-D-aware topology on a 2-D map: lines can cross without
interacting, and ramps can curve between levels.

## Current-state analysis

- Junctions are only ever reciprocal switch pairs between two mains (a
  crossover). There is no "connector edge that joins two lines at different
  levels and does not create a conflicting flat crossing."
- Conflict detection is purely geometric polyline overlap (`segsOverlap`). A
  flyover ramp that *visually* crosses another line would, after Phase 5, read
  as a body conflict — wrong, because it's a bridge. Need a **grade/level**
  dimension so crossing-without-connecting is not a conflict.
- `segsOverlap` treats any proper crossing as a conflict. For flyovers we must
  suppress conflicts between edges at different levels.
- Everything is still effectively one level (`y` in the schematic doubles as
  both "which track" and "where on the diagram").

## Technical design

### 6.1 Add a grade/level to edges

Add an optional `level: number` (default 0) to `TrackEdge` (or to geometry
vertices for ramps that change level). Two edges that geometrically cross but
have different `level` at the crossing point **do not conflict** and do not
connect. This is the flyover rule.

```ts
export type TrackEdge = {
  // ...existing fields
  /** Grade level. Edges that cross at different levels do not interact. */
  level?: number; // default 0
};
```

For a ramp (an edge that transitions level), allow per-vertex levels and
interpolate; a conflict exists only where the two edges' interpolated levels
match within a tolerance.

### 6.2 Connector edges

A flyover ramp is a connector edge (role may stay `crossover` or gain `ramp`)
linking a switch on one line to a switch on another, with a level profile that
clears the line it crosses. The reciprocal-switch rule already covers the
endpoints; the new part is (a) the level profile and (b) the crossing-suppress
logic. No new node kind is needed — the ramp's endpoints are ordinary switch
nodes.

### 6.3 Conflict suppression by level

Update `segsOverlap` callers (route overlap, body conflict) to take each
segment's level and skip conflict when the levels differ at the crossing. Keep
flat-crossing conflicts (same level) exactly as today. This is a targeted
change: thread a `level` through the segment pairs being tested.

`ADDING_LAYOUTS.md` currently forbids "arbitrary graph geometry"; this phase
formally extends the model to permit level-annotated non-crossing connectors.
Update the contract doc accordingly when this lands.

### 6.4 Occupancy across levels

Phase 5's footprint occupancy must also respect level: a train on a flyover
occupies the ramp's sections, not the line it passes over. Section polylines
carry their edge's level, and occupancy/conflict tests compare levels.

### 6.5 Movement across a ramp

With Phase 1 bearings and Phase 3 multi-edge paths, a train already traverses
curved/diagonal multi-edge routes. A ramp is just such a path with a level
profile; no engine change beyond level-aware occupancy. Verify a train can be
routed up a ramp, over, and down onto the other line (Phase 4 route search
finds it as a candidate path).

### 6.6 Test fixture

Author a **flyover fixture** (not UI-wired): two parallel mains plus a ramp
that carries one direction over the other main and down, so a move can switch
corridors without a flat crossing. Prove: (1) a train on the ramp does not
conflict with a train passing under it; (2) a route can be set through the
ramp; (3) occupancy on the ramp is its own sections. `scripts/verify-flyover.ts`.

## Steps

1. Add `level` to edges/vertices; thread through compiled geometry and section
   polylines.
2. Make `segsOverlap` (and its route/body callers) level-aware.
3. Make occupancy level-aware (Phase 5 integration).
4. Confirm route search (Phase 4) traverses ramps as multi-edge paths.
5. Bekasi baseline byte-identical (all Bekasi edges are level 0, so nothing
   changes); all e2e pass.
6. Flyover fixture + `verify-flyover`; probes for pass-under-no-conflict and
   ramp routing.
7. Static gates; update `ADDING_LAYOUTS.md` supported-shape section.

## Acceptance criteria

- [ ] Edges carry an optional grade `level`; crossing edges at different levels
      neither connect nor conflict.
- [ ] A train on a flyover ramp does not conflict with or occupy the line it
      passes over.
- [ ] A route can be set through a ramp connecting two lines at different
      levels.
- [ ] Bekasi baseline byte-identical; `tsc`/`build`/`test:e2e`/`probe:meets`
      pass; `verify-flyover` passes.
- [ ] `ADDING_LAYOUTS.md` updated to describe the new supported geometry.

## Open assumptions

- Level is modeled as a small integer/discrete tier, sufficient for "over vs
  under." True continuous gradient/elevation physics (climbing speed) is out of
  scope.
- Visual rendering of the flyover on the 2-D schematic (a bridge glyph, a break
  in the lower line) is a presentation concern; a minimal convention (render
  the crossing with a gap/bridge mark) is included, but full arbitrary-schematic
  rendering is Phase 7.
- Three-way / single-slip / double-slip switches are still not modeled; a
  flyover network is built from ordinary two-way switches + ramps. Slips are a
  possible follow-up noted here.

## Out of scope

- Continuous elevation/gradient physics. Slip switches. Tunnel/bridge
  infrastructure modeling beyond the conflict-suppression level.
