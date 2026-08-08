// ---------------------------------------------------------------------------
// Route search — explicit entry→exit path finding over the movement graph.
//
// The old model walked the track greedily following however the points were
// set. This module searches for a feasible path from an entrance signal to a
// same-direction exit signal, recording the switch positions the path needs.
// Policy (b): manual point control — a route may require setting an UNLOCKED
// point (reported in `requiredSwitches`), but never a locked one. Callers
// decide how to surface the required moves (refuse with the "points not set"
// message, or auto-set later).
// ---------------------------------------------------------------------------

import type { Bearing, LeveledPoint, SwitchState } from "./topology";
import type { GraphNodeLike, LineDir } from "./train-engine";

export type RouteSearchSignal = {
  id: string;
  edge: [string, string]; // [behind, ahead] in the facing direction
  dir: LineDir;
  x: number;
  y: number;
};

export type FoundRoute = {
  pts: LeveledPoint[]; // polyline from the entrance signal to the exit signal
  nodePath: string[];
  requiredSwitches: Record<number, SwitchState>;
  exitSignalId: string;
};

export type FindRouteInput = {
  entranceId: string;
  entrance: RouteSearchSignal;
  signals: RouteSearchSignal[];
  graph: Record<string, GraphNodeLike>;
  switches: Record<number, SwitchState>;
  isLocked: (sw: number) => boolean;
  /** Optional occupancy predicate — prune a segment when it is not clear. */
  isClear?: (nodePath: string[], pts: LeveledPoint[]) => boolean;
  /** Optional target exit signal — only routes ending there are returned. */
  exitSignalId?: string;
  /** Grade level of every movement segment, keyed `${fromId}|${toId}` —
   *  Phase 6 stamps route polylines so clash checks respect flyovers. */
  segmentLevels?: Record<string, number>;
  maxDepth?: number;
};

type ExitChoice = { exit: GraphNodeLike["exits"][number]; needMove: SwitchState | null };

/** The traversable exits from a node for a train arriving from `incoming`. */
const openExits = (
  node: GraphNodeLike,
  incoming: string | null,
  switches: Record<number, SwitchState>,
  isLocked: (sw: number) => boolean
): ExitChoice[] => {
  if (node.sw === undefined) {
    return node.exits.map((exit) => ({ exit, needMove: null }));
  }
  const sw = node.sw;
  const branchExit = node.exits.find((exit) => exit.viaSwitchPort === "reversed");
  const cameFromBranch = branchExit !== undefined && incoming === branchExit.neighbor;
  const reversed = switches[sw] === "reversed";
  const canMove = !isLocked(sw);
  const out: ExitChoice[] = [];
  for (const exit of node.exits) {
    const isBranchExit = exit.viaSwitchPort === "reversed";
    if (cameFromBranch) {
      // arriving via the branch edge — only the straight exits are usable and
      // only with the switch reversed (the branch arrival is set up that way)
      if (!isBranchExit) {
        if (reversed || canMove) {
          out.push({ exit, needMove: reversed ? null : "reversed" });
        }
      }
      continue;
    }
    if (isBranchExit) {
      // the branch exit is open when reversed (or unlockable + set reversed)
      if (reversed || canMove) {
        out.push({ exit, needMove: reversed ? null : "reversed" });
      }
    } else if (!reversed || canMove) {
      // the straight exits are open when normal (or unlockable + set normal);
      // a currently-reversed locked switch blocks them
      out.push({ exit, needMove: reversed ? "normal" : null });
    }
  }
  return out;
};

const exitSignalOn = (
  fromId: string | null,
  toId: string | null,
  dir: LineDir,
  entranceId: string,
  signals: RouteSearchSignal[]
): RouteSearchSignal | undefined => {
  if (!fromId || !toId) return undefined;
  // geometric segment lookup happens in the caller graph context — here we rely
  // on the caller passing the resolved node coordinates via the polyline, so
  // this helper is only used with the from/to coordinates provided separately.
  return undefined;
};

export const findRoute = (input: FindRouteInput): FoundRoute | null => {
  const { entranceId, entrance, signals, graph, switches, isLocked, isClear, exitSignalId, segmentLevels } = input;
  const dir = entrance.dir;
  const maxDepth = input.maxDepth ?? 32;
  const startNodeId = entrance.edge[1];
  const startNode = graph[startNodeId];
  if (!startNode) return null;
  const entrancePoint: [number, number] = [entrance.x, entrance.y];
  // the search only continues in the signal's general direction (bearing
  // continuity) — otherwise a loop's far end or a crossover can produce
  // 'wrong-way' alternative paths
  const entranceBearing: Bearing = dir === "right" ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
  // the exit must continue the signal's general direction — but a crossover
  // diagonal can have a small against-flow x-component, so only fully-opposite
  // exits (a loop's far end, dot < -0.8) are rejected
  const continues = (bearing: Bearing): boolean =>
    bearing.dx * entranceBearing.dx + bearing.dy * entranceBearing.dy > -0.8;

  // a same-direction signal sitting on the segment from→to (geometric check)
  const exitSignalOnSegment = (
    from: LeveledPoint,
    to: LeveledPoint
  ): RouteSearchSignal | undefined => {
    const lo = Math.min(from[0], to[0]);
    const hi = Math.max(from[0], to[0]);
    return signals.find(
      (s) =>
        s.id !== entranceId &&
        s.dir === dir &&
        lo < s.x &&
        s.x <= hi &&
        Math.abs(s.y - to[1]) < 1e-6
    );
  };

  const lvlOf = (a: string | null, b: string | null): number =>
    a && b && segmentLevels
      ? (segmentLevels[`${a}|${b}`] ?? segmentLevels[`${b}|${a}`] ?? 0)
      : 0;
  const leveled = (x: number, y: number, level: number): [number, number, number] => [x, y, level];

  const candidates: FoundRoute[] = [];

  const dfs = (
    nodeId: string | null,
    incoming: string | null,
    path: string[],
    pts: LeveledPoint[],
    required: Record<number, SwitchState>,
    depth: number
  ): void => {
    if (depth > maxDepth) return;
    const fromPoint = pts[pts.length - 1];
    const toPoint = nodeId ? [graph[nodeId]?.x ?? fromPoint[0], graph[nodeId]?.y ?? fromPoint[1]] as [number, number] : null;
    const segLevel = lvlOf(incoming, nodeId);

    // exit signal ahead on the incoming segment?
    const exitSig = toPoint ? exitSignalOnSegment(fromPoint, toPoint) : undefined;
    if (exitSig) {
      const exitPts = pts.concat([leveled(exitSig.x, exitSig.y, segLevel)]);
      const exitPath = nodeId ? path.concat([nodeId]) : path;
      if ((!isClear || isClear(exitPath, exitPts)) && (!exitSignalId || exitSig.id === exitSignalId)) {
        candidates.push({
          pts: exitPts,
          nodePath: exitPath,
          requiredSwitches: required,
          exitSignalId: exitSig.id,
        });
      }
      return;
    }
    if (!nodeId || !graph[nodeId]) return;

    const node = graph[nodeId];
    const choices = openExits(node, incoming, switches, isLocked).filter(({ exit }) =>
      continues(exit.bearing)
    );
    if (!choices.length) {
      // the track runs out here (map edge or a dead end) — the route to this
      // node is complete (the legacy "ke ujung" open-line route). Not valid
      // when a specific exit signal was requested.
      if (!exitSignalId) {
        candidates.push({
          pts: pts.concat([leveled(node.x, node.y, segLevel)]),
          nodePath: path.concat([nodeId]),
          requiredSwitches: required,
          exitSignalId: "",
        });
      }
      return;
    }
    for (const { exit, needMove } of choices) {
      const neighbor = graph[exit.neighbor];
      if (!neighbor) continue; // boundary — no exit signal before the edge
      if (path.includes(exit.neighbor)) continue; // no revisiting nodes
      const nextRequired = { ...required };
      if (needMove) nextRequired[node.sw!] = needMove;
      const nextPath = path.concat([nodeId]);
      const nextPts = pts.concat([leveled(node.x, node.y, segLevel)]);
      if (isClear && !isClear(nextPath, nextPts)) continue;
      dfs(exit.neighbor, nodeId, nextPath, nextPts, nextRequired, depth + 1);
    }
  };

  // seed: the first step walks from the entrance along its segment toward
  // edge[1], so treat the segment [entrance → edge[1]] as the start
  dfs(startNodeId, entrance.edge[0], [], [entrancePoint], {}, 0);

  if (!candidates.length) return null;

  // rank: fewest required point moves, then shortest polyline, then stable order
  candidates.sort((a, b) => {
    const movesA = Object.keys(a.requiredSwitches).length;
    const movesB = Object.keys(b.requiredSwitches).length;
    if (movesA !== movesB) return movesA - movesB;
    const lenA = polylineLength(a.pts);
    const lenB = polylineLength(b.pts);
    if (lenA !== lenB) return lenA - lenB;
    return 0;
  });
  return candidates[0];
};

const polylineLength = (pts: LeveledPoint[]): number => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return total;
};

/**
 * Flank points for a route: switches not on the route whose reversed-edge
 * branch geometry would intersect the route polyline within a fouling distance
 * (`foulingDistance`). These must be locked in a non-fouling position while
 * the route is active.
 */
export const flankPoints = (
  route: FoundRoute,
  graph: Record<string, GraphNodeLike>,
  foulingDistance: number
): number[] => {
  const onRoute = new Set(route.nodePath);
  const routeNodePts = route.nodePath
    .map((nodeId) => graph[nodeId])
    .filter((node): node is GraphNodeLike => node !== undefined)
    .map((node) => [node.x, node.y] as [number, number]);
  const flanks = new Set<number>();
  for (const nodeId of Object.keys(graph)) {
    const node = graph[nodeId];
    if (node.sw === undefined || onRoute.has(nodeId)) continue;
    const branchExit = node.exits.find((exit) => exit.viaSwitchPort === "reversed");
    if (!branchExit?.branchPath) continue;
    // the branch geometry from this node through the branch path
    let prev: [number, number] = [node.x, node.y];
    for (const nid of branchExit.branchPath) {
      const n = graph[nid];
      if (!n) break;
      // the branch converges exactly ON a route junction node → that node's
      // own locking already neutralises it (a loop rejoin at a route switch)
      const touchesRouteNode = routeNodePts.some(
        ([rx, ry]) => pointSegDist([rx, ry], prev, [n.x, n.y]) < 1e-6
      );
      if (touchesRouteNode) break;
      // otherwise: does the branch segment come within fouling distance of the
      // route away from its own structure?
      let minDist = Infinity;
      for (let i = 0; i + 1 < route.pts.length; i++) {
        minDist = Math.min(minDist, segSegDist(prev, [n.x, n.y], route.pts[i], route.pts[i + 1]));
      }
      if (minDist < foulingDistance) {
        flanks.add(node.sw);
        break;
      }
      prev = [n.x, n.y];
    }
  }
  return [...flanks];
};

/** Distance from point p to the segment a→b. */
const pointSegDist = (
  p: LeveledPoint,
  a: LeveledPoint,
  b: LeveledPoint
): number => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
};

/** Minimum distance between two segments. */
const segSegDist = (
  a: LeveledPoint,
  b: LeveledPoint,
  c: LeveledPoint,
  d: LeveledPoint
): number => {
  let best = Infinity;
  for (const p of [a, b]) best = Math.min(best, pointSegDist(p, c, d));
  for (const p of [c, d]) best = Math.min(best, pointSegDist(p, a, b));
  // segment-segment crossing (the endpoints are outside each other)
  const cross = (o: LeveledPoint, p: LeveledPoint, q: LeveledPoint) =>
    (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const onSeg = (o: LeveledPoint, p: LeveledPoint, q: LeveledPoint) =>
    Math.min(o[0], p[0]) <= q[0] && q[0] <= Math.max(o[0], p[0]) &&
    Math.min(o[1], p[1]) <= q[1] && q[1] <= Math.max(o[1], p[1]);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return 0;
  }
  if (d1 === 0 && onSeg(a, b, c)) return 0;
  if (d2 === 0 && onSeg(a, b, d)) return 0;
  if (d3 === 0 && onSeg(c, d, a)) return 0;
  if (d4 === 0 && onSeg(c, d, b)) return 0;
  return best;
};
