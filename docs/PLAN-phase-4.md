# Phase 4 — Graph-based route search (entry→exit) + flank protection

## Goal

Replace "the route is whatever the points currently say" with **explicit route
setting**: the dispatcher requests a path from an entrance signal to an exit,
the interlocking searches the track graph for a free path, sets and locks every
point on it, proves flank protection, and only then allows the signal to clear.
**Depends on Phase 1** (bearings). Independent of Phases 2/3 but composes with
them.

## General / non-technical summary

Today, clearing a signal just "walks" the track from that signal, following
however the points happen to be set, and refuses only if a point blocks the way
or the path hits a conflicting reservation. That's fine for a simple corridor
where there's only ever one sensible path. A real station offers **multiple
paths** between the same entrance and exit (think ladder junctions and parallel
platform lines), and a real interlocking *chooses* a free path, *sets the
points for it*, and *protects the flanks* so a converging train can't sideswipe
the route at a switch. This phase adds that route-search-and-protect brain.

## Current-state analysis

- `walkRoute(sig, switches, map)` in `dispatching-table.tsx`: greedy forward
  walk following current point positions until the next same-direction signal
  or a blocked point. No alternatives, no point setting.
- `toggleSignal(id)`: refuses if `walkRoute` is `blocked`, if the route is
  occupied, or if it overlaps an opposite-direction reservation. Then sets
  `signalOn` + a reservation.
- `lockedBy`/`isLocked`: approach locking — a point is locked while a cleared
  route passes through it. Only the *unpassed* portion locks.
- There is **no notion of choosing points for a route**, no entry→exit request,
  and no **flank protection** (a point not on the route but positioned to let a
  converging move foul it is not considered).

## Technical design

### 4.1 Route search over the movement graph

Add a pure search in a new module `app/lib/route-search.ts` (or into
`train-engine.ts` if small). Input: entrance signal, the compiled movement
graph (nodes with bearing-keyed exits from Phase 1), current switch states,
current reservations/occupancy. Output: an ordered list of candidate paths
(node/edge sequences), each with the **required switch positions**.

Algorithm: DFS/BFS from the entrance signal's edge end, exploring open exits
(at a switch, an exit is traversable if the switch can be set to select it —
see 4.2), until reaching a same-direction exit signal (route complete) or a
boundary. Rank candidates (fewest point moves, then shortest). Return the best
feasible path plus the switch settings it needs.

```ts
export type RouteRequest = { entranceSignalId: string; exitSignalId?: string };
export type FoundRoute = {
  pts: [number, number][];                 // polyline (same as walkRoute builds)
  nodePath: string[];
  requiredSwitches: Record<number, SwitchState>; // points to set/lock
  exitSignalId: string;
};
export function findRoute(req, graph, switches, occupied): FoundRoute | null
```

### 4.2 Point setting policy

Decide (record in STATUS.md) between:
- **(a) Auto-set points on route request** — clearing a signal sets the points
  the chosen route needs (if not locked), like a real interlocking's "auto
  route set." This changes current UX (today the player sets points manually).
- **(b) Search constrained to current points, but report the needed change** —
  keep manual point control; the search only finds routes achievable without
  moving locked points, and if the best route needs a point moved, tell the
  user which. Closest to current behavior.

Default to **(b)** to stay behavior-compatible with Bekasi (manual point
throws remain the player's job), but design `findRoute` so (a) is a drop-in
later. The acceptance tests must not change the existing "wesel belum diatur"
refusal behavior for Bekasi.

### 4.3 Flank protection

A route is not safe unless points **adjacent** to it that could admit a
converging/fouling move are also locked in a protective position. Add to the
compiler/runtime a notion of **flank points** for a route: any switch not on
the route whose current position would allow a move that overlaps the route
polyline within a fouling distance. When a route is set, lock its flank points
in the non-fouling position (or refuse if a flank point is already locked
against the route by another reservation).

Implement flank detection geometrically first (a switch whose branch path would
intersect the route within `CELL` fouling distance) and note that a
topology-derived flank table is a later refinement.

### 4.4 Integrate with existing guards

- `toggleSignal` route-set path: call `findRoute` instead of `walkRoute` +
  manual blocked check. Keep the occupied-check and opposite-direction-overlap
  check, now applied to the *found* route. Add the flank check.
- `lockedBy`/`isLocked`: extend so a point is locked if it is on **or flank-
  protecting** any active route.
- Reservations already store `pts`; the found route's polyline feeds the same
  reservation lifecycle (trim/release) unchanged.

### 4.5 Multi-path test fixture

Author a **ladder / two-path fixture** (not UI-wired): an entrance signal with
two valid paths to two different exits (e.g. two platform lines). Prove:
`findRoute` returns the free path when one is occupied/reserved; points get
locked per the chosen path; a flank point prevents a fouling converging route.
`scripts/verify-routes.ts`.

## Steps

1. Write `findRoute` (search + required switches + candidate ranking) as a pure
   function with unit probes on small synthetic graphs.
2. Add flank-point detection + locking.
3. Rewire `toggleSignal` to use `findRoute`; keep Bekasi's refusal messages and
   manual-point UX (policy b).
4. Extend `lockedBy`/`isLocked` to flank points.
5. Bekasi baseline byte-identical; existing e2e (approach locking, wrong-way,
   bounded wrong-way, "wesel belum diatur") all pass unchanged.
6. Ladder fixture + `verify-routes`; probes for multi-path choice + flank
   locking.
7. Static gates.

## Acceptance criteria

- [ ] `findRoute` returns a feasible path + required switch settings, or null.
- [ ] Route setting chooses a free path among multiple when they exist.
- [ ] Flank points are locked for an active route; a fouling converging route is
      refused.
- [ ] Bekasi behavior unchanged (baseline identical; all current e2e pass,
      including the exact refusal toasts).
- [ ] Ladder fixture proves multi-path + flank; `verify-routes` passes.
- [ ] `tsc`/`build`/`test:e2e`/`probe:meets` pass.

## Open assumptions

- Point-setting policy (a) vs (b) is a product decision. Default (b)
  (manual points, search constrained) preserves Bekasi; flag to the user before
  implementing if (a) auto-set is desired, as it changes the UX and several e2e
  tests that throw points manually.
- Flank protection via geometry is a heuristic; a topology-derived flank table
  (compiler-computed fouling points) is more correct and is noted as a follow-
  up, not required for this phase.
- Route search is over the movement graph; with only switches as branches the
  search space is small (exponential in switches on the path but tiny in
  practice). No performance concern at expected scales.

## Out of scope

- Auto route set / route release by timetable (ARS). Stacked/sequential routes.
  Calling-on / shunt aspects. Overlap (overlap/swing-overlap) locking beyond
  basic flank. These are real-interlocking features to scope separately if
  wanted.
