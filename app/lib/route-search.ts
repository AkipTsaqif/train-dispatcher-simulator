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

import type { Bearing, SwitchState } from "./topology";
import type { GraphNodeLike, LineDir } from "./train-engine";

export type RouteSearchSignal = {
  id: string;
  edge: [string, string]; // [behind, ahead] in the facing direction
  dir: LineDir;
  x: number;
  y: number;
};

export type FoundRoute = {
  pts: [number, number][]; // polyline from the entrance signal to the exit signal
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
  isClear?: (nodePath: string[], pts: [number, number][]) => boolean;
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
  const { entranceId, entrance, signals, graph, switches, isLocked, isClear } = input;
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
    from: [number, number],
    to: [number, number]
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

  const candidates: FoundRoute[] = [];

  const dfs = (
    nodeId: string | null,
    incoming: string | null,
    path: string[],
    pts: [number, number][],
    required: Record<number, SwitchState>,
    depth: number
  ): void => {
    if (depth > maxDepth) return;
    const fromPoint = pts[pts.length - 1];
    const toPoint = nodeId ? [graph[nodeId]?.x ?? fromPoint[0], graph[nodeId]?.y ?? fromPoint[1]] as [number, number] : null;

    // exit signal ahead on the incoming segment?
    const exitSig = toPoint ? exitSignalOnSegment(fromPoint, toPoint) : undefined;
    if (exitSig) {
      const exitPts = pts.concat([[exitSig.x, exitSig.y]]);
      const exitPath = nodeId ? path.concat([nodeId]) : path;
      if (!isClear || isClear(exitPath, exitPts)) {
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
      // node is complete (the legacy "ke ujung" open-line route)
      candidates.push({
        pts: pts.concat([[node.x, node.y]]),
        nodePath: path.concat([nodeId]),
        requiredSwitches: required,
        exitSignalId: "",
      });
      return;
    }
    for (const { exit, needMove } of choices) {
      const neighbor = graph[exit.neighbor];
      if (!neighbor) continue; // boundary — no exit signal before the edge
      if (path.includes(exit.neighbor)) continue; // no revisiting nodes
      const nextRequired = { ...required };
      if (needMove) nextRequired[node.sw!] = needMove;
      const nextPath = path.concat([nodeId]);
      const nextPts = pts.concat([[node.x, node.y]]);
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

const polylineLength = (pts: [number, number][]): number => {
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
      if (distToPolyline(prev, [n.x, n.y], route.pts) < foulingDistance) {
        flanks.add(node.sw);
        break;
      }
      prev = [n.x, n.y];
    }
  }
  return [...flanks];
};

const distToPolyline = (
  from: [number, number],
  to: [number, number],
  pts: [number, number][]
): number => {
  let best = Infinity;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len2 = dx * dx + dy * dy || 1;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const ex = x2 - x1;
    const ey = y2 - y1;
    const elen2 = ex * ex + ey * ey || 1;
    const t = Math.max(0, Math.min(1, ((from[0] - x1) * ex + (from[1] - y1) * ey) / elen2));
    const px = x1 + ex * t;
    const py = y1 + ey * t;
    // distance from the segment (from→to) to the polyline point
    const segT = Math.max(0, Math.min(1, ((px - from[0]) * dx + (py - from[1]) * dy) / len2));
    const sx = from[0] + dx * segT;
    const sy = from[1] + dy * segT;
    best = Math.min(best, Math.hypot(px - sx, py - sy));
  }
  return best;
};
