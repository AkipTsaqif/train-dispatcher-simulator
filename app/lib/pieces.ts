// ---------------------------------------------------------------------------
// Piece vocabulary v1 (Phase 9 Step 4) — track / crossover / terminus.
//
// Enough vocabulary to express a throat. Pieces are placed in space; the
// assembler joins them by port coincidence (app/lib/piece-assembly.ts) and
// derives the TopologyDefinition IR.
//
// DECLARATION vs REFERENCE — the rule that makes this worth doing.
// PLAN-phase-9 says "the author never types an edge id". Read against the
// problem it names, that means the author never types a REFERENCE: today a
// single switch costs three edge-end references that must stay consistent with
// edges declared hundreds of lines earlier, and it is those cross-references
// that rot. A piece therefore NAMES WHAT IT OWNS (its own edge id, its own end
// node ids) and never names what it points at. A crossover does not reference
// the tracks it joins — it is placed where they are, and the join follows from
// the geometry. So the dangling-reference class is gone, while ids stay
// author-controlled and reviewable in a diff.
//
// Not yet vocabulary (Step 5): signals, platforms, loops, flyovers, and block
// sections. Until then `assemblePieces` takes them as an explicit `passthrough`
// so a piece set can express a COMPLETE layout and be proven against the
// checked-in IR now, rather than after the whole vocabulary lands.
// ---------------------------------------------------------------------------

import type {
  Dir,
  TopologyBlockSection,
  TopologyDefinition,
  TopologyGeometryVertex,
  TopologyNode,
  TopologyPoint,
  TopologySignal,
  TopologySwitch,
  TrackEdge,
  TrackRole,
  StationStopPoint,
  SwitchControlGroup,
  TrackGroup,
} from "./topology";

/** A plain running line between two points. Owns one edge. */
export type TrackPiece = {
  kind: "track";
  /** The edge id this piece owns. */
  id: string;
  groupId: string;
  role?: TrackRole;
  from: TopologyPoint;
  to: TopologyPoint;
  /** Node id at each end. A free end becomes a boundary node under this name. */
  fromNode: string;
  toNode: string;
  normalDirection?: Dir;
  level?: number;
  /** Intermediate geometry (e.g. a loop's shoulders), excluding the endpoints. */
  via?: readonly TopologyGeometryVertex[];
  renderSlots: readonly number[];
  /** Why this piece deviates from the drawing, per the plan's `intent` field. */
  intent?: string;
};

/**
 * A diverging connection between two tracks: one edge plus the switches at
 * each end. Placed where the tracks are; it references neither by id.
 */
export type CrossoverPiece = {
  kind: "crossover";
  id: string;
  groupId: string;
  role?: TrackRole;
  from: TopologyPoint;
  to: TopologyPoint;
  via?: readonly TopologyGeometryVertex[];
  renderSlots: readonly number[];
  /** The switch at each end of this connection. */
  switches: readonly {
    id: number;
    /** Which end of THIS piece the switch sits at. */
    end: "from" | "to";
    initialState: "normal" | "reversed";
    controlGroupId: string;
    dashSide: "left" | "right";
    label: string;
  }[];
  intent?: string;
};

/**
 * A track end that genuinely ends — no through axis. Phase 8's problem solved
 * by vocabulary rather than by a generator sweep.
 */
export type TerminusPiece = {
  kind: "terminus";
  /** The node id at the terminating end. */
  nodeId: string;
  point: TopologyPoint;
  intent?: string;
};

export type Piece = TrackPiece | CrossoverPiece | TerminusPiece;

/** The parts that have no vocabulary yet (Step 5 removes this). */
export type Passthrough = {
  signals?: readonly TopologySignal[];
  blockSections?: readonly TopologyBlockSection[];
  stationStopPoints?: readonly StationStopPoint[];
  controlGroups?: readonly SwitchControlGroup[];
  /**
   * `legacyNodeOrder` is a compatibility artifact whose order is authored, not
   * geometric (the ladder interleaves loop midpoints between main nodes), so
   * it stays explicit rather than being guessed.
   */
  legacyNodeOrder?: readonly string[];
  /** Track-group metadata (normalDirection, bidirectional) by group id. */
  groupMeta?: Record<string, { normalDirection?: Dir; bidirectional?: boolean; role?: TrackRole }>;
};

export type PieceSet = {
  pieces: readonly Piece[];
  passthrough?: Passthrough;
};

const pointKey = (p: TopologyPoint): string => `${p[0]}|${p[1]}`;

/**
 * Assemble pieces into a TopologyDefinition.
 *
 * Node ids come from the pieces' own end names; a point named by more than one
 * piece must be named CONSISTENTLY, which is checked rather than assumed —
 * two pieces disagreeing about a shared node is exactly the authoring mistake
 * this vocabulary is meant to make impossible.
 */
export const assemblePieces = ({ pieces, passthrough = {} }: PieceSet): TopologyDefinition => {
  const tracks = pieces.filter((p): p is TrackPiece => p.kind === "track");
  const crossovers = pieces.filter((p): p is CrossoverPiece => p.kind === "crossover");
  const termini = pieces.filter((p): p is TerminusPiece => p.kind === "terminus");

  // --- 1. node names by position -------------------------------------------
  const nameAt = new Map<string, string>();
  const claim = (point: TopologyPoint, name: string, by: string) => {
    const key = pointKey(point);
    const existing = nameAt.get(key);
    if (existing !== undefined && existing !== name) {
      throw new Error(
        `Conflicting node names at (${point[0]},${point[1]}): "${existing}" and "${name}" (from ${by})`
      );
    }
    nameAt.set(key, name);
  };
  for (const t of tracks) {
    claim(t.from, t.fromNode, `track ${t.id}`);
    claim(t.to, t.toNode, `track ${t.id}`);
  }
  for (const t of termini) claim(t.point, t.nodeId, `terminus ${t.nodeId}`);

  // A crossover end must land on a point some track already names, otherwise
  // it is floating in space — a silent no-op in the old hand-authored world.
  for (const c of crossovers) {
    for (const end of ["from", "to"] as const) {
      const point = c[end];
      if (!nameAt.has(pointKey(point))) {
        throw new Error(
          `Crossover "${c.id}" ${end} end at (${point[0]},${point[1]}) touches no track. ` +
            `Pieces join by position — place it where a track actually runs.`
        );
      }
    }
  }

  const nodeIdAt = (point: TopologyPoint): string => {
    const name = nameAt.get(pointKey(point));
    if (name === undefined) {
      throw new Error(`No node named at (${point[0]},${point[1]})`);
    }
    return name;
  };

  // --- 2. edges -------------------------------------------------------------
  const geometryOf = (
    from: TopologyPoint,
    to: TopologyPoint,
    via?: readonly TopologyGeometryVertex[]
  ): TopologyGeometryVertex[] => [{ point: from }, ...(via ?? []), { point: to }];

  const edges: TrackEdge[] = [
    ...tracks.map((t) => ({
      id: t.id,
      from: t.fromNode,
      to: t.toNode,
      geometry: geometryOf(t.from, t.to, t.via),
      role: t.role ?? ("main" as TrackRole),
      trackGroupId: t.groupId,
      ...(t.normalDirection ? { normalDirection: t.normalDirection } : {}),
      ...(t.level !== undefined ? { level: t.level } : {}),
      renderSlots: t.renderSlots,
    })),
    ...crossovers.map((c) => ({
      id: c.id,
      from: nodeIdAt(c.from),
      to: nodeIdAt(c.to),
      geometry: geometryOf(c.from, c.to, c.via),
      role: c.role ?? ("crossover" as TrackRole),
      trackGroupId: c.groupId,
      renderSlots: c.renderSlots,
    })),
  ];

  // --- 3. switch nodes ------------------------------------------------------
  // A node is a switch iff a crossover ends there; every other named point is
  // a boundary. Derived from placement, never declared twice.
  const switchPoints = new Set<string>();
  for (const c of crossovers) {
    switchPoints.add(pointKey(c.from));
    switchPoints.add(pointKey(c.to));
  }

  const nodes: TopologyNode[] = [];
  const emitted = new Set<string>();
  const emitNode = (point: TopologyPoint) => {
    const key = pointKey(point);
    if (emitted.has(key)) return;
    emitted.add(key);
    nodes.push({
      id: nodeIdAt(point),
      point,
      kind: switchPoints.has(key) ? "switch" : "boundary",
    });
  };
  for (const t of tracks) {
    emitNode(t.from);
    emitNode(t.to);
  }
  for (const t of termini) emitNode(t.point);

  // --- 4. switches ----------------------------------------------------------
  // The common/normal/reversed ports are DERIVED from what actually meets at
  // the point: the through pair comes from the tracks running through it, the
  // reversed leg is the crossover. This is the cross-reference triple the
  // author no longer writes.
  const switches: TopologySwitch[] = [];
  for (const c of crossovers) {
    for (const sw of c.switches) {
      const point = c[sw.end];
      const key = pointKey(point);
      const nodeId = nodeIdAt(point);

      const arriving = tracks.filter((t) => pointKey(t.to) === key);
      const leaving = tracks.filter((t) => pointKey(t.from) === key);

      if (arriving.length + leaving.length === 0) {
        throw new Error(`Switch ${sw.id} at (${point[0]},${point[1]}) has no track through it`);
      }
      if (arriving.length > 1 || leaving.length > 1) {
        throw new Error(
          `Switch ${sw.id} at (${point[0]},${point[1]}) has an ambiguous through axis: ` +
            `${arriving.length} arriving and ${leaving.length} leaving track(s). ` +
            `Split the track so exactly one runs into and one out of the switch.`
        );
      }

      // A terminating switch (Phase 8 / Step 2): the track ends here, so the
      // common and normal ports are the same and the only onward exit is the
      // branch. Expressed by vocabulary, not by a special case in a generator.
      const common =
        arriving.length === 1
          ? { edgeId: arriving[0].id, end: "to" as const }
          : { edgeId: leaving[0].id, end: "from" as const };
      const normal =
        leaving.length === 1
          ? { edgeId: leaving[0].id, end: "from" as const }
          : common;

      switches.push({
        id: sw.id,
        nodeId,
        common,
        normal,
        reversed: { edgeId: c.id, end: sw.end },
        initialState: sw.initialState,
        controlGroupId: sw.controlGroupId,
        dashSide: sw.dashSide,
        label: sw.label,
      });
    }
  }
  switches.sort((a, b) => a.id - b.id);

  // --- 5. track groups ------------------------------------------------------
  const groupOrder: string[] = [];
  const groupEdges = new Map<string, string[]>();
  for (const edge of edges) {
    if (!groupEdges.has(edge.trackGroupId)) {
      groupEdges.set(edge.trackGroupId, []);
      groupOrder.push(edge.trackGroupId);
    }
    groupEdges.get(edge.trackGroupId)!.push(edge.id);
  }
  const meta = passthrough.groupMeta ?? {};
  const trackGroups: TrackGroup[] = groupOrder.map((id) => {
    const m = meta[id] ?? {};
    const edgeIds = groupEdges.get(id)!;
    const role = m.role ?? edges.find((e) => e.id === edgeIds[0])!.role;
    return {
      id,
      role,
      edgeIds,
      ...(m.normalDirection ? { normalDirection: m.normalDirection } : {}),
      ...(m.bidirectional ? { bidirectional: m.bidirectional } : {}),
    };
  });

  // --- 6. control groups ----------------------------------------------------
  const controlGroups: SwitchControlGroup[] =
    passthrough.controlGroups !== undefined
      ? [...passthrough.controlGroups]
      : (() => {
          const byId = new Map<string, number[]>();
          const order: string[] = [];
          for (const s of switches) {
            if (!byId.has(s.controlGroupId)) {
              byId.set(s.controlGroupId, []);
              order.push(s.controlGroupId);
            }
            byId.get(s.controlGroupId)!.push(s.id);
          }
          return order.map((id) => ({
            id,
            switchIds: byId.get(id)!,
            coupled: byId.get(id)!.length > 1,
          }));
        })();

  return {
    nodes,
    edges,
    switches,
    controlGroups,
    signals: [...(passthrough.signals ?? [])],
    trackGroups,
    blockSections: [...(passthrough.blockSections ?? [])],
    stationStopPoints: [...(passthrough.stationStopPoints ?? [])],
    legacyNodeOrder: [...(passthrough.legacyNodeOrder ?? nodes.map((n) => n.id))],
  };
};
