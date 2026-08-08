export type SwitchState = "normal" | "reversed";
export type Dir = "right" | "left";

import { segmentCross } from "./geometry";

/**
 * A unit travel bearing. The current horizontal layouts use exactly (±1, 0);
 * the general case allows any (dx, dy) not both zero, so tracks no longer
 * have to be horizontal.
 */
export type Bearing = { dx: number; dy: number };

/** Unit bearing from one topology point to the next. */
export const bearingOf = (
  from: TopologyPoint | LeveledPoint,
  to: TopologyPoint | LeveledPoint
): Bearing => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) throw new Error("zero-length bearing");
  return { dx: dx / len, dy: dy / len };
};

/** Dot product of two bearings; >0 same general direction, <0 opposite. */
export const bearingDot = (a: Bearing, b: Bearing): number =>
  a.dx * b.dx + a.dy * b.dy;

/**
 * Legacy horizontal view of a bearing — the sign of dx. Throws only when a
 * horizontal answer is genuinely unavailable (pure vertical travel).
 */
export const bearingToDir = (b: Bearing): Dir => {
  if (b.dx > 0) return "right";
  if (b.dx < 0) return "left";
  throw new Error("bearing has no horizontal component");
};

export type Sw = {
  id: number;
  x: number;
  y: number;
  lineY: number;
  dashSide: "left" | "right";
  branch: string;
  label: string;
};

export type PointControl = {
  ids: number[];
  x: number;
  y: number;
  coupled: boolean;
  label: string;
};

export type GNodeExit = {
  neighbor: string; // next node id along this exit
  bearing: Bearing; // travel bearing leaving this node toward the neighbor
  viaSwitchPort?: "normal" | "reversed"; // switch-selected exit (reversed = the branch)
  branchPath?: string[]; // diverted exit: intermediate node ids toward the far switch
  farSw?: number; // far switch of a diverted exit
};

export type GNode = {
  x: number;
  y: number;
  sw?: number;
  exits: GNodeExit[]; // all physical ways out, each with its travel bearing
};

export type SignalDef = {
  id: string;
  code?: string;
  x: number;
  y: number;
  lineY: number;
  dir: Dir;
  bearing: Bearing; // facing bearing (derived from the edge segment)
  mount: "up" | "down";
  edge: [string, string];
  label: string;
  block?: boolean;
  ai?: boolean;
};

export type CompiledSignalSection = {
  sig: string;
  lineY: number;
  lo: number;
  hi: number;
};

export type CompiledMovementSignal = {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  bearing: Bearing;
  ai?: boolean;
};

export type TopologyPoint = readonly [number, number];
/** A geometry point that may carry a grade level (3rd element, default 0). */
export type LeveledPoint = [number, number, number?];
export type TopologyNodeKind = "boundary" | "switch";
export type TrackRole = "main" | "loop" | "crossover";
export type EdgeEndName = "from" | "to";

export type TopologyNode = {
  id: string;
  point: TopologyPoint;
  kind: TopologyNodeKind;
};

export type TopologyGeometryVertex = {
  point: TopologyPoint;
  compatibilityNodeId?: string;
};

export type RenderEndpointOverride = {
  from?: TopologyPoint;
  to?: TopologyPoint;
  reason: string;
};

export type TrackEdge = {
  id: string;
  from: string;
  to: string;
  geometry: readonly TopologyGeometryVertex[];
  role: TrackRole;
  trackGroupId: string;
  normalDirection?: Dir;
  /** Grade level (default 0). Two edges that geometrically cross at DIFFERENT
   *  levels neither connect nor conflict — the flyover/viaduct rule. A ramp
   *  edge that passes over another line carries level > 0. */
  level?: number;
  physicalDistance?: number;
  renderBreakpoints?: readonly TopologyPoint[];
  renderSlots: readonly number[];
  renderEndpointOverride?: RenderEndpointOverride;
};

export type TopologyEdgeEnd = {
  edgeId: string;
  end: EdgeEndName;
};

export type TopologySwitch = {
  id: number;
  nodeId: string;
  common: TopologyEdgeEnd;
  normal: TopologyEdgeEnd;
  reversed: TopologyEdgeEnd;
  initialState: SwitchState;
  controlGroupId: string;
  dashSide: "left" | "right";
  label: string;
};

export type SwitchControlGroup = {
  id: string;
  switchIds: readonly number[];
  coupled: boolean;
};

export type SignalFacing = "toward-from" | "toward-to";

export type TopologySignal = {
  id: string;
  code?: string;
  edgeId: string;
  segmentIndex: number;
  offset: number;
  facing: SignalFacing;
  mount: "up" | "down";
  label: string;
  block?: boolean;
  ai?: boolean;
  initialState?: boolean;
  protectedBlockSectionId: string;
};

export type TrackGroup = {
  id: string;
  role: TrackRole;
  edgeIds: readonly string[];
  normalDirection?: Dir;
  /** Bidirectional running: the line may be used (and signaled) both ways.
   *  Only meaningful for `main` role. Disables the wrong-way protection. */
  bidirectional?: boolean;
};

export type TopologyEdgeRangeEndpoint =
  | { kind: "signal"; signalId: string }
  | { kind: "edge-end"; end: EdgeEndName };

export type TopologyEdgeRange = {
  edgeId: string;
  from: TopologyEdgeRangeEndpoint;
  to: TopologyEdgeRangeEndpoint;
};

export type TopologyBlockSection = {
  id: string;
  signalId: string;
  coverage: "signal-to-boundary" | "whole-track-group";
  edgeRanges: readonly TopologyEdgeRange[];
  legacyOpenEnd?: "west" | "east";
};

export type StationStopPoint = {
  stationCode: string;
  edgeId: string;
  segmentIndex: number;
  offset: number;
};

export type TopologyDefinition = {
  nodes: readonly TopologyNode[];
  edges: readonly TrackEdge[];
  switches: readonly TopologySwitch[];
  controlGroups: readonly SwitchControlGroup[];
  signals: readonly TopologySignal[];
  trackGroups: readonly TrackGroup[];
  blockSections: readonly TopologyBlockSection[];
  stationStopPoints: readonly StationStopPoint[];
  legacyNodeOrder: readonly string[];
};

export type CompiledLoop = {
  trackGroupId: string;
  lineY: number; // representative compatibility Y (may be shared across loops)
  minX: number; // this loop's own envelope
  maxX: number;
  rejoin: { leftX: number; rightX: number; mainLineY: number };
};

export type CompiledTopology = {
  lines: {
    mains: { trackGroupId: string; lineY: number; normalBearing: Bearing }[];
    normalDirectionByY: Record<number, Dir>;
    /** Phase 6+ bidirectional-running mains (wrong-way protection exempt). */
    bidirectionalByY: Record<number, boolean>;
    normalBearingByGroupId: Record<string, Bearing>;
    normalBearingByLineY: Record<number, Bearing>;
  };
  loops: {
    byGroupId: Record<string, CompiledLoop>;
    /** Deprecated global views — kept in sync for the current layout. */
    lineYs: Set<number>;
    minX: number;
    maxX: number;
    rejoinByLineY: Record<
      number,
      { leftX: number; rightX: number; mainLineY: number }
    >;
  };
  switches: {
    items: Sw[];
    coupled: number[][];
    controls: PointControl[];
    initialState: Record<number, SwitchState>;
  };
  nodes: Record<string, GNode>;
  signals: {
    items: SignalDef[];
    initialState: Record<string, boolean>;
  };
  trackPaths: string[];
  /** Protected-block section of each signal as a track polyline (Phase 5
   *  occupancy) — keyed by signal id; straight pieces for horizontal sections,
   *  the whole loop chain for loop signals. Phase 6: points carry an optional
   *  grade level (3rd tuple element) so occupancy respects flyovers. */
  sectionPaths: Record<string, LeveledPoint[]>;
  /** Grade level of every movement segment, keyed `${fromId}|${toId}` (both
   *  directions) — Phase 6 conflict/occupancy suppression. Derived from the
   *  topology edges; all-Bekasi edges are level 0 so nothing changes there. */
  segmentLevels: Record<string, number>;
  /** Phase 7: map positions where edges cross at different grade levels
   *  (a flyover over a line) — the renderer draws a gap in the lower line and
   *  a bridge glyph on the upper one. */
  levelCrossings: {
    point: TopologyPoint;
    upperLevel: number;
    /** direction of the UPPER track at the crossing (for the bridge glyph). */
    direction: Bearing;
  }[];
  /** Station platform X per (station, trackGroup) — multi-length platforms. */
  stationStopXs: Record<string, Record<string, number>>;
  stationPlatformCenterX: Record<string, number>;
  compatibility: {
    signalSections: CompiledSignalSection[];
    movement: {
      nodes: Record<string, GNode>;
      signals: CompiledMovementSignal[];
    };
  };
};

type EdgePath = {
  ids: string[];
  points: TopologyPoint[];
  level: number;
};

type CompiledSignalPlacement = {
  point: TopologyPoint;
  segment: readonly [string, string];
  dir: Dir;
};

const pointEquals = (left: TopologyPoint, right: TopologyPoint): boolean =>
  left[0] === right[0] && left[1] === right[1];

const pointOnSegment = (
  point: TopologyPoint,
  from: TopologyPoint,
  to: TopologyPoint
): boolean => {
  const cross =
    (point[0] - from[0]) * (to[1] - from[1]) -
    (point[1] - from[1]) * (to[0] - from[0]);
  if (Math.abs(cross) > 1e-9) return false;
  const dot =
    (point[0] - from[0]) * (to[0] - from[0]) +
    (point[1] - from[1]) * (to[1] - from[1]);
  if (dot <= 0) return false;
  const lengthSquared =
    (to[0] - from[0]) ** 2 + (to[1] - from[1]) ** 2;
  return dot < lengthSquared;
};

const indexUnique = <Item, Key extends string | number>(
  items: readonly Item[],
  keyOf: (item: Item) => Key,
  label: string
): Map<Key, Item> => {
  const index = new Map<Key, Item>();
  for (const item of items) {
    const key = keyOf(item);
    if (index.has(key)) throw new Error(`Duplicate ${label}: ${String(key)}`);
    index.set(key, item);
  }
  return index;
};

const edgeEndNodeId = (edge: TrackEdge, end: EdgeEndName): string =>
  end === "from" ? edge.from : edge.to;

const serializePath = (from: TopologyPoint, to: TopologyPoint): string =>
  from[1] === to[1]
    ? `M${from[0]} ${from[1]} H${to[0]}`
    : `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;

const directionForDelta = (deltaX: number, context: string): Dir => {
  if (deltaX > 0) return "right";
  if (deltaX < 0) return "left";
  throw new Error(`${context} has no horizontal direction`);
};

const placementOnEdge = (
  edge: TrackEdge,
  segmentIndex: number,
  offset: number,
  context: string
): TopologyPoint => {
  const from = edge.geometry[segmentIndex]?.point;
  const to = edge.geometry[segmentIndex + 1]?.point;
  if (!from || !to) {
    throw new Error(`${context} has out-of-range segment ${segmentIndex}`);
  }
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (offset < 0 || offset > length) {
    throw new Error(`${context} has out-of-range offset ${offset}`);
  }
  if (dy === 0) return [from[0] + Math.sign(dx) * offset, from[1]];
  if (dx === 0) return [from[0], from[1] + Math.sign(dy) * offset];
  const ratio = length === 0 ? 0 : offset / length;
  return [from[0] + dx * ratio, from[1] + dy * ratio];
};

const compileRenderPaths = (edges: readonly TrackEdge[]): string[] => {
  const rendered: { slot: number; path: string }[] = [];
  for (const edge of edges) {
    const fragments: [TopologyPoint, TopologyPoint][] = [];
    const unusedBreakpoints = new Set(edge.renderBreakpoints ?? []);

    for (let index = 0; index < edge.geometry.length - 1; index++) {
      const from = edge.geometry[index].point;
      const to = edge.geometry[index + 1].point;
      const breakpoints = [...unusedBreakpoints]
        .filter((point) => pointOnSegment(point, from, to))
        .sort((left, right) => {
          const dx = to[0] - from[0];
          const dy = to[1] - from[1];
          const leftDistance =
            (left[0] - from[0]) * dx + (left[1] - from[1]) * dy;
          const rightDistance =
            (right[0] - from[0]) * dx + (right[1] - from[1]) * dy;
          return leftDistance - rightDistance;
        });
      for (const point of breakpoints) unusedBreakpoints.delete(point);
      const points = [from, ...breakpoints, to];
      for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
        fragments.push([points[pointIndex], points[pointIndex + 1]]);
      }
    }

    if (unusedBreakpoints.size) {
      throw new Error(`Edge ${edge.id} has a render breakpoint off its geometry`);
    }
    if (fragments.length !== edge.renderSlots.length) {
      throw new Error(
        `Edge ${edge.id} has ${fragments.length} render fragments but ${edge.renderSlots.length} slots`
      );
    }

    fragments.forEach(([logicalFrom, logicalTo], index) => {
      let from = logicalFrom;
      let to = logicalTo;
      const override = edge.renderEndpointOverride;
      if (override?.from && pointEquals(logicalFrom, edge.geometry[0].point)) {
        from = override.from;
      }
      if (
        override?.to &&
        pointEquals(logicalTo, edge.geometry[edge.geometry.length - 1].point)
      ) {
        to = override.to;
      }
      rendered.push({ slot: edge.renderSlots[index], path: serializePath(from, to) });
    });
  }

  rendered.sort((left, right) => left.slot - right.slot);
  rendered.forEach((fragment, index) => {
    if (fragment.slot !== index) {
      throw new Error(`Missing or duplicate render slot ${index}`);
    }
  });
  return rendered.map((fragment) => fragment.path);
};

const branchRenderPath = (edge: TrackEdge, end: EdgeEndName): string => {
  const index = end === "from" ? 0 : edge.geometry.length - 2;
  let from = edge.geometry[index].point;
  let to = edge.geometry[index + 1].point;
  const override = edge.renderEndpointOverride;
  if (override?.from && index === 0) from = override.from;
  if (override?.to && index + 1 === edge.geometry.length - 1) to = override.to;
  return serializePath(from, to);
};

const compileTopologyInternal = (definition: TopologyDefinition): CompiledTopology => {
  const nodesById = indexUnique(definition.nodes, (node) => node.id, "node ID");
  const edgesById = indexUnique(definition.edges, (edge) => edge.id, "edge ID");
  const switchesById = indexUnique(
    definition.switches,
    (topologySwitch) => topologySwitch.id,
    "switch ID"
  );
  const switchesByNode = indexUnique(
    definition.switches,
    (topologySwitch) => topologySwitch.nodeId,
    "switch node"
  );
  const groupsById = indexUnique(
    definition.trackGroups,
    (group) => group.id,
    "track-group ID"
  );
  const signalsById = indexUnique(
    definition.signals,
    (signal) => signal.id,
    "signal ID"
  );
  const blocksById = indexUnique(
    definition.blockSections,
    (section) => section.id,
    "block-section ID"
  );
  const controlGroupsById = indexUnique(
    definition.controlGroups,
    (group) => group.id,
    "control-group ID"
  );

  const compatibilityVertices = new Map<
    string,
    { edgeId: string; index: number; point: TopologyPoint }
  >();
  const edgePaths = new Map<string, EdgePath>();

  for (const edge of definition.edges) {
    const fromNode = nodesById.get(edge.from);
    const toNode = nodesById.get(edge.to);
    if (!fromNode || !toNode) {
      throw new Error(`Edge ${edge.id} has a missing endpoint`);
    }
    if (edge.geometry.length < 2) {
      throw new Error(`Edge ${edge.id} requires at least two geometry vertices`);
    }
    if (!pointEquals(edge.geometry[0].point, fromNode.point)) {
      throw new Error(`Edge ${edge.id} geometry does not start at ${edge.from}`);
    }
    if (
      !pointEquals(edge.geometry[edge.geometry.length - 1].point, toNode.point)
    ) {
      throw new Error(`Edge ${edge.id} geometry does not end at ${edge.to}`);
    }
    if (!groupsById.has(edge.trackGroupId)) {
      throw new Error(`Edge ${edge.id} has unknown track group ${edge.trackGroupId}`);
    }
    if (edge.renderEndpointOverride && !edge.renderEndpointOverride.reason.trim()) {
      throw new Error(`Edge ${edge.id} has an undocumented render override`);
    }

    const ids = edge.geometry.map((vertex, index) => {
      if (index === 0) return edge.from;
      if (index === edge.geometry.length - 1) return edge.to;
      const id = vertex.compatibilityNodeId;
      if (!id) return "";
      if (nodesById.has(id) || compatibilityVertices.has(id)) {
        throw new Error(`Duplicate compatibility node ID: ${id}`);
      }
      compatibilityVertices.set(id, { edgeId: edge.id, index, point: vertex.point });
      return id;
    });
    edgePaths.set(edge.id, {
      ids,
      points: edge.geometry.map((vertex) => vertex.point),
      level: edge.level ?? 0,
    });
  }

  // Phase 6: grade level of every movement segment — keyed both directions so
  // a train traversing either way finds its edge's level.
  const segmentLevels: Record<string, number> = {};
  for (const edge of definition.edges) {
    const path = edgePaths.get(edge.id)!;
    const level = edge.level ?? 0;
    for (let i = 0; i + 1 < path.ids.length; i++) {
      const a = path.ids[i];
      const b = path.ids[i + 1];
      if (!a || !b) continue; // interior vertices without a compatibility node id
      segmentLevels[`${a}|${b}`] = level;
      segmentLevels[`${b}|${a}`] = level;
    }
  }

  // Phase 7: level crossings — pairs of edges whose geometry crosses at
  // DIFFERENT grade levels (a viaduct over a line). The renderer erases the
  // lower line's stroke at the crossing and draws a bridge glyph on the upper.
  const levelCrossings: {
    point: TopologyPoint;
    upperLevel: number;
    direction: Bearing;
  }[] = [];
  {
    const edgeList = definition.edges;
    const seen = new Set<string>();
    for (let i = 0; i < edgeList.length; i++) {
      for (let j = i + 1; j < edgeList.length; j++) {
        const a = edgeList[i];
        const b = edgeList[j];
        if ((a.level ?? 0) === (b.level ?? 0)) continue; // same grade — not a bridge
        const pa = edgePaths.get(a.id)!.points;
        const pb = edgePaths.get(b.id)!.points;
        for (let k = 0; k + 1 < pa.length; k++) {
          for (let l = 0; l + 1 < pb.length; l++) {
            const p = segmentCross(
              [pa[k][0], pa[k][1]],
              [pa[k + 1][0], pa[k + 1][1]],
              [pb[l][0], pb[l][1]],
              [pb[l + 1][0], pb[l + 1][1]]
            );
            if (!p) continue;
            const key = `${Math.round(p[0])},${Math.round(p[1])}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const upperSeg =
              (a.level ?? 0) > (b.level ?? 0)
                ? [pa[k], pa[k + 1]]
                : [pb[l], pb[l + 1]];
            levelCrossings.push({
              point: p,
              upperLevel: Math.max(a.level ?? 0, b.level ?? 0),
              direction: bearingOf(upperSeg[0], upperSeg[1]),
            });
          }
        }
      }
    }
  }

  const allLegacyNodeIds = new Set([
    ...nodesById.keys(),
    ...compatibilityVertices.keys(),
  ]);
  if (
    definition.legacyNodeOrder.length !== allLegacyNodeIds.size ||
    definition.legacyNodeOrder.some((id) => !allLegacyNodeIds.has(id))
  ) {
    throw new Error("legacyNodeOrder must contain every operational and compatibility node exactly once");
  }
  if (new Set(definition.legacyNodeOrder).size !== definition.legacyNodeOrder.length) {
    throw new Error("legacyNodeOrder contains duplicate IDs");
  }

  for (const group of definition.trackGroups) {
    if (!group.edgeIds.length) throw new Error(`Track group ${group.id} is empty`);
    group.edgeIds.forEach((edgeId, index) => {
      const edge = edgesById.get(edgeId);
      if (!edge) throw new Error(`Track group ${group.id} has unknown edge ${edgeId}`);
      if (edge.trackGroupId !== group.id || edge.role !== group.role) {
        throw new Error(`Track group ${group.id} disagrees with edge ${edgeId}`);
      }
      if (
        edge.normalDirection !== undefined &&
        edge.normalDirection !== group.normalDirection
      ) {
        throw new Error(`Track group ${group.id} has inconsistent normal direction`);
      }
      const nextEdge = edgesById.get(group.edgeIds[index + 1]);
      if (nextEdge && edge.to !== nextEdge.from) {
        throw new Error(`Track group ${group.id} is discontinuous at ${edgeId}`);
      }
    });
  }
  for (const edge of definition.edges) {
    if (!groupsById.get(edge.trackGroupId)!.edgeIds.includes(edge.id)) {
      throw new Error(`Edge ${edge.id} is missing from track group ${edge.trackGroupId}`);
    }
  }

  const endNeighbor = (end: TopologyEdgeEnd, context: string): string => {
    const edge = edgesById.get(end.edgeId);
    const path = edgePaths.get(end.edgeId);
    if (!edge || !path) throw new Error(`${context} has unknown edge ${end.edgeId}`);
    if (edgeEndNodeId(edge, end.end) !== context) {
      throw new Error(`Edge ${edge.id}:${end.end} is not incident to ${context}`);
    }
    return end.end === "from" ? path.ids[1] : path.ids[path.ids.length - 2];
  };

  for (const topologySwitch of definition.switches) {
    const node = nodesById.get(topologySwitch.nodeId);
    if (!node || node.kind !== "switch") {
      throw new Error(`Switch ${topologySwitch.id} has invalid node ${topologySwitch.nodeId}`);
    }
    if (!controlGroupsById.has(topologySwitch.controlGroupId)) {
      throw new Error(`Switch ${topologySwitch.id} has unknown control group`);
    }
    const portKeys = [
      topologySwitch.common,
      topologySwitch.normal,
      topologySwitch.reversed,
    ].map((end) => `${end.edgeId}:${end.end}`);
    // Phase 8: a TERMINATING switch may share the common/normal port — the
    // track ends here and the only onward exit is the branch (reversed). The
    // common+normal pair must still be distinct from the reversed port.
    const distinctPorts = new Set(portKeys);
    const terminating = distinctPorts.size === 2;
    if (distinctPorts.size < 2) {
      throw new Error(`Switch ${topologySwitch.id} has duplicate ports`);
    }
    if (!terminating && distinctPorts.size !== 3) {
      throw new Error(`Switch ${topologySwitch.id} has duplicate ports`);
    }
    endNeighbor(topologySwitch.common, topologySwitch.nodeId);
    endNeighbor(topologySwitch.normal, topologySwitch.nodeId);
    endNeighbor(topologySwitch.reversed, topologySwitch.nodeId);

    const reversedEdge = edgesById.get(topologySwitch.reversed.edgeId)!;
    // the reversed edge belongs to a loop/crossover track group; the remote
    // switch sits at the OTHER attachment of the whole chain (for a multi-edge
    // loop the immediate far end is an intermediate node, not the switch)
    const loopGroup = groupsById.get(reversedEdge.trackGroupId)!;
    const groupEdges = loopGroup.edgeIds.map((edgeId) => edgesById.get(edgeId)!);
    const firstGroupEdge = groupEdges[0];
    const lastGroupEdge = groupEdges[groupEdges.length - 1];
    const remoteNodeId =
      edgeEndNodeId(firstGroupEdge, "from") === topologySwitch.nodeId
        ? edgeEndNodeId(lastGroupEdge, "to")
        : edgeEndNodeId(lastGroupEdge, "to") === topologySwitch.nodeId
        ? edgeEndNodeId(firstGroupEdge, "from")
        : null;
    if (remoteNodeId === null) {
      throw new Error(
        `Switch ${topologySwitch.id} is not at an end of track group ${loopGroup.id}`
      );
    }
    const remoteSwitch = switchesByNode.get(remoteNodeId);
    const remoteReversedEdge = remoteSwitch?.reversed
      ? edgesById.get(remoteSwitch.reversed.edgeId)
      : undefined;
    // Phase 8: a reversed edge may END at a plain node — a FIXED track turn
    // (like Tambun's T3 curve), not a controllable point. Only a switch at the
    // far end needs the reciprocal guarantee.
    if (
      remoteSwitch &&
      (!remoteReversedEdge ||
        remoteReversedEdge.trackGroupId !== loopGroup.id ||
        edgeEndNodeId(remoteReversedEdge, remoteSwitch.reversed.end) !== remoteNodeId)
    ) {
      throw new Error(
        `Switch ${topologySwitch.id} has no reciprocal remote switch on its reversed track`
      );
    }
  }

  const controlledSwitchIds = new Set<number>();
  for (const group of definition.controlGroups) {
    if (group.coupled && group.switchIds.length < 2) {
      throw new Error(`Coupled control group ${group.id} needs at least two switches`);
    }
    for (const switchId of group.switchIds) {
      const topologySwitch = switchesById.get(switchId);
      if (!topologySwitch || topologySwitch.controlGroupId !== group.id) {
        throw new Error(`Control group ${group.id} disagrees with switch ${switchId}`);
      }
      if (controlledSwitchIds.has(switchId)) {
        throw new Error(`Switch ${switchId} belongs to multiple control groups`);
      }
      controlledSwitchIds.add(switchId);
    }
  }
  if (controlledSwitchIds.size !== definition.switches.length) {
    throw new Error("Every switch must belong to one control group");
  }

  const signalPlacements = new Map<string, CompiledSignalPlacement>();
  const compiledSignals: SignalDef[] = definition.signals.map((signal) => {
    const edge = edgesById.get(signal.edgeId);
    const path = edgePaths.get(signal.edgeId);
    if (!edge || !path) throw new Error(`Signal ${signal.id} has unknown edge ${signal.edgeId}`);
    if (!blocksById.has(signal.protectedBlockSectionId)) {
      throw new Error(`Signal ${signal.id} has unknown protected block section`);
    }
    const point = placementOnEdge(
      edge,
      signal.segmentIndex,
      signal.offset,
      `Signal ${signal.id}`
    );
    const segmentFrom = path.ids[signal.segmentIndex];
    const segmentTo = path.ids[signal.segmentIndex + 1];
    if (!segmentFrom || !segmentTo) {
      throw new Error(`Signal ${signal.id} is not on a compatibility graph segment`);
    }
    const geometryFrom = edge.geometry[signal.segmentIndex].point;
    const geometryTo = edge.geometry[signal.segmentIndex + 1].point;
    const facingBearing =
      signal.facing === "toward-to"
        ? bearingOf(geometryFrom, geometryTo)
        : bearingOf(geometryTo, geometryFrom);
    const dir = bearingToDir(facingBearing);
    const segment: [string, string] =
      signal.facing === "toward-to"
        ? [segmentFrom, segmentTo]
        : [segmentTo, segmentFrom];
    signalPlacements.set(signal.id, { point, segment, dir });

    const compiled: SignalDef = {
      id: signal.id,
      ...(signal.code === undefined ? {} : { code: signal.code }),
      x: point[0],
      y: point[1],
      lineY: point[1],
      dir,
      bearing: facingBearing,
      mount: signal.mount,
      edge: segment,
      label: signal.label,
      ...(signal.block === undefined ? {} : { block: signal.block }),
      ...(signal.ai === undefined ? {} : { ai: signal.ai }),
    };
    return compiled;
  });

  const edgeRangePoint = (
    range: TopologyEdgeRange,
    endpoint: TopologyEdgeRangeEndpoint,
    sectionId: string
  ): TopologyPoint => {
    const edge = edgesById.get(range.edgeId);
    if (!edge) throw new Error(`Block section ${sectionId} has unknown edge ${range.edgeId}`);
    if (endpoint.kind === "edge-end") {
      return endpoint.end === "from"
        ? edge.geometry[0].point
        : edge.geometry[edge.geometry.length - 1].point;
    }
    const endpointSignal = signalsById.get(endpoint.signalId);
    const placement = signalPlacements.get(endpoint.signalId);
    if (!endpointSignal || !placement || endpointSignal.edgeId !== range.edgeId) {
      throw new Error(
        `Block section ${sectionId} has signal ${endpoint.signalId} off edge ${range.edgeId}`
      );
    }
    return placement.point;
  };

  const blockLegacyEndX = new Map<string, number>();
  for (const section of definition.blockSections) {
    const signal = signalsById.get(section.signalId);
    const placement = signalPlacements.get(section.signalId);
    if (!signal || !placement || signal.protectedBlockSectionId !== section.id) {
      throw new Error(`Block section ${section.id} disagrees with signal ${section.signalId}`);
    }
    if (!section.edgeRanges.length) {
      throw new Error(`Block section ${section.id} has no canonical edge ranges`);
    }

    const sourceEdge = edgesById.get(signal.edgeId)!;
    const sourceGroup = groupsById.get(sourceEdge.trackGroupId)!;
    let previousTo: TopologyPoint | undefined;
    for (const range of section.edgeRanges) {
      const edge = edgesById.get(range.edgeId);
      if (!edge || edge.trackGroupId !== sourceGroup.id) {
        throw new Error(`Block section ${section.id} leaves track group ${sourceGroup.id}`);
      }
      const from = edgeRangePoint(range, range.from, section.id);
      const to = edgeRangePoint(range, range.to, section.id);
      if (previousTo && !pointEquals(previousTo, from)) {
        throw new Error(`Block section ${section.id} has discontinuous edge ranges`);
      }
      if (
        directionForDelta(to[0] - from[0], `Block section ${section.id}`) !==
        placement.dir
      ) {
        throw new Error(`Block section ${section.id} reverses its signal direction`);
      }
      previousTo = to;
    }

    const firstRange = section.edgeRanges[0];
    const lastRange = section.edgeRanges[section.edgeRanges.length - 1];
    if (
      section.coverage === "signal-to-boundary" &&
      (firstRange.from.kind !== "signal" ||
        firstRange.from.signalId !== section.signalId)
    ) {
      throw new Error(`Block section ${section.id} does not start at its signal`);
    }
    if (section.coverage === "whole-track-group") {
      const rangeEdges = section.edgeRanges.map((range) => range.edgeId);
      if (
        sourceGroup.role !== "loop" ||
        rangeEdges.length !== sourceGroup.edgeIds.length ||
        sourceGroup.edgeIds.some((edgeId) => !rangeEdges.includes(edgeId))
      ) {
        throw new Error(`Block section ${section.id} does not cover its whole loop group`);
      }
      // the whole-loop ranges must reach from one physical endpoint of the loop
      // group to the other, across all its edges
      const groupFrom = edgesById.get(sourceGroup.edgeIds[0])!.geometry[0].point;
      const lastGroupEdge = edgesById.get(sourceGroup.edgeIds[sourceGroup.edgeIds.length - 1])!;
      const groupTo = lastGroupEdge.geometry[lastGroupEdge.geometry.length - 1].point;
      const firstRangeFrom = edgeRangePoint(section.edgeRanges[0], section.edgeRanges[0].from, section.id);
      const lastRangeTo = edgeRangePoint(
        section.edgeRanges[section.edgeRanges.length - 1],
        section.edgeRanges[section.edgeRanges.length - 1].to,
        section.id
      );
      const reachesEndpoints =
        (pointEquals(firstRangeFrom, groupFrom) && pointEquals(lastRangeTo, groupTo)) ||
        (pointEquals(firstRangeFrom, groupTo) && pointEquals(lastRangeTo, groupFrom));
      if (!reachesEndpoints) {
        throw new Error(`Block section ${section.id} does not reach the loop group's physical endpoints`);
      }
    }

    if (section.legacyOpenEnd) {
      const expectedSide = placement.dir === "right" ? "east" : "west";
      if (section.legacyOpenEnd !== expectedSide) {
        throw new Error(`Block section ${section.id} opens against its signal direction`);
      }
      const groupPoints = sourceGroup.edgeIds.flatMap((edgeId) =>
        edgesById.get(edgeId)!.geometry.map((vertex) => vertex.point)
      );
      const expectedBoundaryX =
        expectedSide === "east"
          ? Math.max(...groupPoints.map((point) => point[0]))
          : Math.min(...groupPoints.map((point) => point[0]));
      if (previousTo?.[0] !== expectedBoundaryX) {
        throw new Error(`Block section ${section.id} does not reach its open boundary`);
      }
      blockLegacyEndX.set(
        section.id,
        expectedSide === "east"
          ? Number.POSITIVE_INFINITY
          : Number.NEGATIVE_INFINITY
      );
    } else {
      if (lastRange.to.kind !== "signal") {
        throw new Error(`Block section ${section.id} has no closing signal`);
      }
      const nextPlacement = signalPlacements.get(lastRange.to.signalId)!;
      if (
        nextPlacement.dir !== placement.dir ||
        nextPlacement.point[1] !== placement.point[1]
      ) {
        throw new Error(`Block section ${section.id} closes at an incompatible signal`);
      }
      blockLegacyEndX.set(section.id, nextPlacement.point[0]);
    }
  }
  if (
    definition.blockSections.length !== definition.signals.length ||
    blockLegacyEndX.size !== definition.signals.length
  ) {
    throw new Error("Every signal must own exactly one block section");
  }

  const mainGroups = definition.trackGroups.filter((group) => group.role === "main");
  const mains: { trackGroupId: string; lineY: number; normalBearing: Bearing }[] = [];
  const normalDirectionByY: Record<number, Dir> = {};
  const bidirectionalByY: Record<number, boolean> = {};
  const normalBearingByGroupId: Record<string, Bearing> = {};
  const normalBearingByLineY: Record<number, Bearing> = {};
  for (const group of mainGroups) {
    if (!group.normalDirection) {
      throw new Error(`Main track group ${group.id} needs a normal direction`);
    }
    const firstEdge = edgesById.get(group.edgeIds[0])!;
    const lineY = firstEdge.geometry[0].point[1];
    // Phase 1: mains are no longer required to be horizontal — the per-line
    // derived views stay for the horizontal layouts (Bekasi), and diagonal
    // mains keep a nominal line Y from their first vertex.
    normalDirectionByY[lineY] = group.normalDirection;
    if (group.bidirectional) bidirectionalByY[lineY] = true;
    const fromPoint = firstEdge.geometry[0].point;
    const toPoint = firstEdge.geometry[1].point;
    const normalBearing =
      group.normalDirection === "right"
        ? bearingOf(fromPoint, toPoint)
        : bearingOf(toPoint, fromPoint);
    normalBearingByGroupId[group.id] = normalBearing;
    normalBearingByLineY[lineY] = normalBearing;
    mains.push({ trackGroupId: group.id, lineY, normalBearing });
  }

  const loopGroups = definition.trackGroups.filter((group) => group.role === "loop");
  const loopsByGroupId: Record<string, CompiledLoop> = {};
  const loopLineYs = new Set<number>();
  const rejoinByLineY: Record<
    number,
    { leftX: number; rightX: number; mainLineY: number }
  > = {};
  const loopPoints: TopologyPoint[] = [];
  for (const group of loopGroups) {
    const edges = group.edgeIds.map((edgeId) => edgesById.get(edgeId)!);
    const groupPoints = edges.flatMap((edge) =>
      edge.geometry.map((vertex) => vertex.point)
    );
    // representative compatibility Y: the longest horizontal segment across the
    // group (a multi-edge loop may dip/curve through ramps)
    const horizontalSegments = edges
      .flatMap((edge) =>
        edge.geometry
          .slice(0, -1)
          .map((vertex, index) =>
            [vertex.point, edge.geometry[index + 1].point] as const
          )
      )
      .filter(([from, to]) => from[1] === to[1]);
    if (!horizontalSegments.length) {
      throw new Error(
        `Loop group ${group.id} needs a horizontal running portion`
      );
    }
    let lineY = horizontalSegments[0][0][1];
    let bestLength = -1;
    for (const [from, to] of horizontalSegments) {
      const length = Math.abs(to[0] - from[0]);
      if (length > bestLength) {
        bestLength = length;
        lineY = from[1];
      }
    }
    // per-loop envelope from THIS group's own geometry
    const minX = Math.min(...groupPoints.map((point) => point[0]));
    const maxX = Math.max(...groupPoints.map((point) => point[0]));
    // the loop attaches at the first edge's `from` and the last edge's `to`,
    // both on the same main line
    const fromPoint = nodesById.get(edges[0].from)!.point;
    const toPoint = nodesById.get(edges[edges.length - 1].to)!.point;
    const left = fromPoint[0] <= toPoint[0] ? fromPoint : toPoint;
    const right = fromPoint[0] <= toPoint[0] ? toPoint : fromPoint;
    if (left[1] !== right[1]) {
      throw new Error(`Loop group ${group.id} does not rejoin one main line`);
    }
    loopsByGroupId[group.id] = {
      trackGroupId: group.id,
      lineY,
      minX,
      maxX,
      rejoin: {
        leftX: left[0],
        rightX: right[0],
        mainLineY: left[1],
      },
    };
    loopLineYs.add(lineY);
    // deprecated global view — last write wins for shared Ys
    rejoinByLineY[lineY] = {
      leftX: left[0],
      rightX: right[0],
      mainLineY: left[1],
    };
    loopPoints.push(...groupPoints);
  }
  const loopMinX = Math.min(...loopPoints.map((point) => point[0]));
  const loopMaxX = Math.max(...loopPoints.map((point) => point[0]));

  const signalSections: CompiledSignalSection[] = definition.signals.map((signal) => {
    const placement = signalPlacements.get(signal.id)!;
    const legacyEndX = blockLegacyEndX.get(signal.protectedBlockSectionId)!;
    let lo = Math.min(placement.point[0], legacyEndX);
    let hi = Math.max(placement.point[0], legacyEndX);
    // a loop-line signal's section covers ITS OWN loop's envelope, not a global
    // one — otherwise a train in one siding would falsely occupy another's.
    // An open loop end (legacy ±Infinity) resolves to the loop's own boundary.
    const signalEdge = edgesById.get(signal.edgeId);
    const ownGroup = signalEdge ? groupsById.get(signalEdge.trackGroupId) : undefined;
    const ownLoop = signalEdge ? loopsByGroupId[signalEdge.trackGroupId] : undefined;
    if (ownLoop) {
      lo = Math.min(lo, ownLoop.minX);
      hi = Math.max(hi, ownLoop.maxX);
      if (lo === Number.NEGATIVE_INFINITY) lo = ownLoop.minX;
      if (hi === Number.POSITIVE_INFINITY) hi = ownLoop.maxX;
    } else if (ownGroup) {
      // Phase 8: a stub track's open end resolves to ITS OWN group boundary
      // (the drawn extent) — not the map edge. Otherwise a stub signal's
      // legacy section would extend to ±Infinity and flag distant trains.
      const groupPoints = ownGroup.edgeIds.flatMap((edgeId) =>
        edgesById.get(edgeId)!.geometry.map((vertex) => vertex.point)
      );
      const groupMin = Math.min(...groupPoints.map((p) => p[0]));
      const groupMax = Math.max(...groupPoints.map((p) => p[0]));
      if (lo === Number.NEGATIVE_INFINITY) lo = groupMin;
      if (hi === Number.POSITIVE_INFINITY) hi = groupMax;
    }
    return { sig: signal.id, lineY: placement.point[1], lo, hi };
  });

  // Phase 5: the protected block of each signal as a track polyline — used for
  // genuine 2-D occupancy instead of x-intervals on one line. Each section's
  // canonical edge ranges give the physical track it protects: per range the
  // edge path between its from/to endpoints; whole-track-group (loop) sections
  // concatenate the whole chain (diagonals included).
  const subpathBetween = (
    points: TopologyPoint[],
    from: TopologyPoint,
    to: TopologyPoint
  ): TopologyPoint[] => {
    const tOf = (p: TopologyPoint): { i: number; t: number } => {
      let best = { i: 0, t: 0, d: Infinity };
      for (let i = 0; i + 1 < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[i + 1];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((p[0] - x1) * dx + (p[1] - y1) * dy) / len2));
        const px = x1 + dx * t;
        const py = y1 + dy * t;
        const d = (p[0] - px) ** 2 + (p[1] - py) ** 2;
        if (d < best.d) best = { i, t, d };
      }
      return best;
    };
    const a = tOf(from);
    const b = tOf(to);
    const [lo, hi] = a.i + a.t <= b.i + b.t ? [a, b] : [b, a];
    const interp = (p: { i: number; t: number }): TopologyPoint => {
      const [x1, y1] = points[p.i];
      const [x2, y2] = points[p.i + 1];
      return [x1 + (x2 - x1) * p.t, y1 + (y2 - y1) * p.t];
    };
    const out: TopologyPoint[] = [interp(lo)];
    for (let i = lo.i + 1; i <= hi.i; i++) out.push(points[i]);
    out.push(interp(hi));
    return out;
  };
  const sectionPaths: Record<string, LeveledPoint[]> = {};
  for (const section of definition.blockSections) {
    const pts: LeveledPoint[] = [];
    for (const range of section.edgeRanges) {
      const path = edgePaths.get(range.edgeId);
      if (!path) throw new Error(`Block section ${section.id} has unknown edge ${range.edgeId}`);
      const from = edgeRangePoint(range, range.from, section.id);
      const to = edgeRangePoint(range, range.to, section.id);
      const level = path.level;
      for (const p of subpathBetween(path.points, from, to)) {
        const last = pts[pts.length - 1];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push([p[0], p[1], level]);
      }
    }
    sectionPaths[section.signalId] = pts;
  }

  const graphNodePoint = (id: string): TopologyPoint => {
    const node = nodesById.get(id);
    if (node) return node.point;
    const vertex = compatibilityVertices.get(id);
    if (vertex) return vertex.point;
    throw new Error(`Unknown legacy graph node ${id}`);
  };

  const graphNodes: Record<string, GNode> = {};
  for (const nodeId of definition.legacyNodeOrder) {
    const point = graphNodePoint(nodeId);
    const topologySwitch = switchesByNode.get(nodeId);
    const exits: GNodeExit[] = [];

    const pushExit = (neighborId: string, extra: Partial<GNodeExit> = {}): void => {
      exits.push({
        neighbor: neighborId,
        bearing: bearingOf(point, graphNodePoint(neighborId)),
        ...extra,
      });
    };

    if (topologySwitch) {
      // the common and normal ports are the through axis (always open); the
      // reversed port is the switch-selected branch exit. A terminating switch
      // (common === normal, Phase 8) has no distinct normal port — the track
      // ends here and only the branch continues.
      pushExit(endNeighbor(topologySwitch.common, nodeId));
      const commonKey = `${topologySwitch.common.edgeId}:${topologySwitch.common.end}`;
      const normalKey = `${topologySwitch.normal.edgeId}:${topologySwitch.normal.end}`;
      if (commonKey !== normalKey) {
        pushExit(endNeighbor(topologySwitch.normal, nodeId), { viaSwitchPort: "normal" });
      }

      const reversedEdge = edgesById.get(topologySwitch.reversed.edgeId)!;
      const reversedPath = edgePaths.get(reversedEdge.id)!;
      // the branch path runs through the WHOLE loop chain to the far switch —
      // for a multi-edge loop the reversed edge alone ends at an intermediate
      const loopGroup = groupsById.get(reversedEdge.trackGroupId)!;
      const groupEdgeIds = loopGroup.edgeIds;
      const edgeIndex = groupEdgeIds.indexOf(reversedEdge.id);
      const atFrom = edgeEndNodeId(reversedEdge, "from") === topologySwitch.nodeId;
      let path: string[];
      if (edgeIndex === 0 && atFrom) {
        path = reversedPath.ids.slice(1);
        for (let i = 1; i < groupEdgeIds.length; i++) {
          path = path.concat(edgePaths.get(groupEdgeIds[i])!.ids.slice(1));
        }
      } else if (edgeIndex === groupEdgeIds.length - 1 && !atFrom) {
        path = reversedPath.ids.slice(0, -1).reverse();
        for (let i = groupEdgeIds.length - 2; i >= 0; i--) {
          path = path.concat(edgePaths.get(groupEdgeIds[i])!.ids.slice(0, -1).reverse());
        }
      } else {
        throw new Error(
          `Switch ${topologySwitch.id} is not at an end of loop group ${loopGroup.id}`
        );
      }
      const farNodeId = path[path.length - 1];
      const farSwitch = switchesByNode.get(farNodeId);
      // Phase 8: the far end may be a plain node (a fixed track turn) — the
      // branch is then always open; farSw is only set for a real far switch.
      pushExit(path[0], {
        viaSwitchPort: "reversed",
        branchPath: path,
        ...(farSwitch ? { farSw: farSwitch.id } : {}),
      });
    } else if (compatibilityVertices.has(nodeId)) {
      const vertex = compatibilityVertices.get(nodeId)!;
      const path = edgePaths.get(vertex.edgeId)!;
      pushExit(path.ids[vertex.index - 1]);
      pushExit(path.ids[vertex.index + 1]);
    } else {
      const incident = definition.edges.filter(
        (edge) => edge.from === nodeId || edge.to === nodeId
      );
      if (incident.length === 1) {
        // a map-edge boundary node
        const edge = incident[0];
        const path = edgePaths.get(edge.id)!;
        pushExit(
          edge.from === nodeId ? path.ids[1] : path.ids[path.ids.length - 2]
        );
      } else if (incident.length === 2) {
        // a through node where two edges meet (e.g. a multi-edge loop joint)
        for (const edge of incident) {
          const path = edgePaths.get(edge.id)!;
          pushExit(
            edge.from === nodeId ? path.ids[1] : path.ids[path.ids.length - 2]
          );
        }
      } else {
        throw new Error(
          `Boundary node ${nodeId} must have one incident edge`
        );
      }
    }

    graphNodes[nodeId] = topologySwitch
      ? { x: point[0], y: point[1], sw: topologySwitch.id, exits }
      : { x: point[0], y: point[1], exits };
  }

  const switchItems: Sw[] = definition.switches.map((topologySwitch) => {
    const node = nodesById.get(topologySwitch.nodeId)!;
    const reversedEdge = edgesById.get(topologySwitch.reversed.edgeId)!;
    return {
      id: topologySwitch.id,
      x: node.point[0],
      y: node.point[1],
      lineY: node.point[1],
      dashSide: topologySwitch.dashSide,
      branch: branchRenderPath(reversedEdge, topologySwitch.reversed.end),
      label: topologySwitch.label,
    };
  });
  const coupled = definition.controlGroups
    .filter((group) => group.coupled)
    .map((group) => [...group.switchIds]);
  const coupledSet = new Set(coupled.flat());
  const controls: PointControl[] = switchItems
    .filter((item) => !coupledSet.has(item.id))
    .map((item) => ({
      ids: [item.id],
      x: item.x,
      y: item.y,
      coupled: false,
      label: item.label,
    }));
  for (const group of definition.controlGroups.filter((item) => item.coupled)) {
    const groupSwitches = group.switchIds.map((id) => {
      const item = switchItems.find((candidate) => candidate.id === id);
      if (!item) throw new Error(`Control group ${group.id} has unknown switch ${id}`);
      return item;
    });
    controls.push({
      ids: [...group.switchIds],
      x: groupSwitches.reduce((sum, item) => sum + item.x, 0) / groupSwitches.length,
      y: groupSwitches.reduce((sum, item) => sum + item.y, 0) / groupSwitches.length,
      coupled: true,
      label: groupSwitches[0].label.split(",")[0],
    });
  }
  controls.sort((left, right) => left.x - right.x);

  const initialSwitchState: Record<number, SwitchState> = {};
  for (const topologySwitch of definition.switches) {
    initialSwitchState[topologySwitch.id] = topologySwitch.initialState;
  }
  const initialSignalState: Record<string, boolean> = {};
  for (const signal of definition.signals) {
    if (signal.initialState !== undefined) initialSignalState[signal.id] = signal.initialState;
  }

  // Phase 7+: station platforms may have DIFFERENT X positions per track
  // (multi-length platforms) — validated per (station, track group).
  const stationStopXs: Record<string, Record<string, number>> = {};
  const stationPlatformCenterX: Record<string, number> = {};
  for (const stop of definition.stationStopPoints) {
    const edge = edgesById.get(stop.edgeId);
    if (!edge) throw new Error(`Station ${stop.stationCode} has unknown edge ${stop.edgeId}`);
    const point = placementOnEdge(
      edge,
      stop.segmentIndex,
      stop.offset,
      `Station ${stop.stationCode}`
    );
    const byGroup = (stationStopXs[stop.stationCode] ??= {});
    const existing = byGroup[edge.trackGroupId];
    if (existing !== undefined && existing !== point[0]) {
      throw new Error(
        `Station ${stop.stationCode} placements do not share one X on track ${edge.trackGroupId}`
      );
    }
    byGroup[edge.trackGroupId] = point[0];
    // the primary X stays the FIRST authored stop (legacy single-X behavior)
    if (stationPlatformCenterX[stop.stationCode] === undefined) {
      stationPlatformCenterX[stop.stationCode] = point[0];
    }
  }

  const movementSignals: CompiledMovementSignal[] = compiledSignals.map((signal) => ({
    id: signal.id,
    x: signal.x,
    y: signal.lineY,
    dir: signal.dir,
    bearing: signal.bearing,
    ai: signal.ai,
  }));

  return {
    lines: {
      mains,
      normalDirectionByY,
      bidirectionalByY,
      normalBearingByGroupId,
      normalBearingByLineY,
    },
    loops: {
      byGroupId: loopsByGroupId,
      lineYs: loopLineYs,
      minX: loopMinX,
      maxX: loopMaxX,
      rejoinByLineY,
    },
    switches: {
      items: switchItems,
      coupled,
      controls,
      initialState: initialSwitchState,
    },
    nodes: graphNodes,
    signals: {
      items: compiledSignals,
      initialState: initialSignalState,
    },
    trackPaths: compileRenderPaths(definition.edges),
    sectionPaths,
    segmentLevels,
    levelCrossings,
    stationStopXs,
    stationPlatformCenterX,
    compatibility: {
      signalSections,
      movement: {
        nodes: graphNodes,
        signals: movementSignals,
      },
    },
  };
};

export const compileTopology = (
  definition: TopologyDefinition
): CompiledTopology => compileTopologyInternal(definition);
