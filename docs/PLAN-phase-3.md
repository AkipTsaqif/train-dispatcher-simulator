# Phase 3 — Independent loop/siding bounds, multi-loop, multi-edge loops

## Goal

Remove the "one global loop envelope" and "one edge per loop" restrictions so a
layout can have **multiple independent loops/sidings**, each with its own
occupancy bounds, and loops made of **more than one edge**. **Depends on
Phase 1** (bearings). Independent of Phase 2.

## General / non-technical summary

A "loop" (passing loop or siding) lets a train pull off the main line so another
can pass. Today the system allows only the current layout's two loops, and it
lumps them together under one shared occupancy box — so a train in one loop can
falsely appear to occupy the other. It also requires each loop to be a single
straight piece of track. This phase gives every loop its own occupancy bounds
and lets a loop be built from several connected pieces, which is what real
station throats and yards look like.

## Current-state analysis (the restrictions, verified)

In `app/lib/topology.ts` `compileTopologyInternal`:
- `Loop group ${id} must contain one logical edge` — single-edge restriction.
- Loop bounds are computed as **one global envelope**:
  `loopMinX = Math.min(...loopPoints...)` / `loopMaxX = Math.max(...)` across
  **all** loop groups, then every loop-line signal section is extended to that
  global min/max. Two loops ⇒ each loop's signals cover both ⇒ false occupancy.
- `rejoinByLineY: Record<number, {leftX,rightX,mainLineY}>` is keyed by the
  loop's compatibility Y — two loops sharing a Y silently overwrite each other.
- A loop must rejoin "one main line" (`left[1] !== right[1]` throws otherwise).

In `app/components/dispatching-table.tsx`:
- `LOOP_REJOIN_BY_LINE_Y[loopLineY]` is used in the route-occupied check to
  decide when a train near a loop's rejoin point blocks the main. Keyed by Y.
- `onLoop` occupancy takeover checks `[...LOOP_LINE_YS].some(lineY => |user.y -
  lineY| < 1)` — Y-proximity, assumes distinct loop Ys and the global envelope.

## Technical design

### 3.1 Key loops by ID, not by Y

Introduce a loop identity and per-loop bounds:
```ts
export type CompiledLoop = {
  trackGroupId: string;
  lineY: number;                    // compatibility Y (may be shared now)
  minX: number; maxX: number;       // THIS loop's own envelope
  rejoin: { leftX: number; rightX: number; mainLineY: number };
};
// CompiledTopology.loops becomes:
loops: {
  byGroupId: Record<string, CompiledLoop>;
  // legacy views kept for Bekasi compatibility:
  lineYs: Set<number>;
  minX: number; maxX: number;                       // global envelope (deprecated)
  rejoinByLineY: Record<number, {...}>;             // deprecated, keep in sync
};
```
Compiler change: compute `minX/maxX` per loop group from that group's own
geometry, not globally. Signal-section extension for a loop-line signal uses
**its own loop's** envelope, not the global one.

This is the fix for the false-occupancy bug class and the silent-Y-overwrite
bug. Keep the deprecated global views byte-identical for Bekasi (which has the
two loops the global envelope was tuned for) so the baseline stays stable — but
mark them deprecated and make new consumers use `byGroupId`.

### 3.2 Allow shared loop Ys

Because loops are now keyed by group ID, two loops may share a compatibility Y.
Update the consumers that look up loops by Y (`LOOP_REJOIN_BY_LINE_Y`,
`onLoop`, route-occupied rejoin check) to look up by the loop the train/route
is actually on (derivable from the train's current edge/segment via the
compiled edge→group mapping) rather than by Y proximity.

### 3.3 Multi-edge loops

Remove the `edgeIds.length !== 1` throw for loop groups. A multi-edge loop is a
track group of role `loop` with several edges chained (`from`/`to`
continuity is already validated for all groups). Requirements:
- The loop still attaches to its main line at exactly two switch nodes (the
  first edge's `from` and the last edge's `to`), each reciprocal.
- The loop's "compatibility Y" is the Y of its horizontal running portion; a
  multi-edge loop may dip/curve, so derive the loop's representative lineY from
  its geometry's dominant horizontal segment, and validate uniqueness-of-
  rejoin (both ends rejoin the same main line Y).
- Block sections of coverage `whole-track-group` must cover the loop from one
  physical endpoint to the other across **all** its edges (the compiler already
  validates edge-ID membership + continuity; extend the endpoint-reach check to
  multi-edge).

### 3.4 Occupancy / interlocking consumers

- `occupiedSections` / section polylines: with per-loop envelopes, a loop
  section covers only its own loop. (Phase 1 made sections polyline-based;
  ensure the loop section polyline spans the loop's own edges.)
- The `onLoop` takeover and the rejoin-proximity block in `toggleSignal` must
  use the train's actual loop (by group) and that loop's own rejoin points.

### 3.5 Test fixture

Add a **two-loop / multi-edge-loop fixture** composition (not UI-wired) plus
`scripts/verify-loops.ts`: e.g. a main with two sidings at different stations
that happen to share a compatibility Y, and one siding built from two edges.
Prove: independent occupancy (a train in siding A does not red siding B's
signals), and a multi-edge loop traverses end-to-end.

## Steps

1. Add `CompiledLoop` and `loops.byGroupId` to the compiler; compute per-loop
   envelopes; keep deprecated global views in sync for Bekasi.
2. Extend loop-line signal-section extension to use the per-loop envelope.
3. Repoint UI/runtime loop lookups from Y-keyed to group-keyed.
4. Remove the single-edge loop throw; add multi-edge validation (rejoin same
   main, endpoint coverage).
5. Bekasi baseline byte-identical (the two Bekasi loops must produce the same
   per-loop and global envelopes as before).
6. Author the loops fixture + verifier; probes for independent occupancy and
   multi-edge traversal.
7. Static gates.

## Acceptance criteria

- [ ] Loops are keyed by track-group ID; each has its own `minX/maxX` envelope.
- [ ] Two loops may share a compatibility Y without overwriting each other.
- [ ] Loop groups may contain multiple edges (continuity + rejoin validated).
- [ ] A train in one loop does not affect another loop's signal occupancy
      (proven by the fixture probe).
- [ ] Bekasi baseline byte-identical; `tsc`/`build`/`test:e2e`/`probe:meets`
      pass; `verify-loops` passes.

## Open assumptions

- The "whole-loop block covers both physical endpoints" rule extends naturally
  to multi-edge loops (coverage = all edges, endpoint to endpoint). Confirm the
  existing `whole-track-group` validation generalizes; if it was single-edge
  tuned, adjust within this phase.
- A loop still rejoins **one** main line (both ends on the same main). A loop
  connecting two *different* mains is a different feature (that's a crossover/
  connection, arguably Phase 4/6) and is out of scope here.
- Bidirectional loops are already the norm (loop signals exist in both
  directions); this phase doesn't change that.

## Out of scope

- Yards/ladders with many parallel sidings and route choice between them
  (needs Phase 4 route search). Loops connecting two different mains.
