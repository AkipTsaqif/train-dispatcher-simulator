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
// Step 5 adds `loop` (a multi-edge chain attaching through switches at both
// ends), graded links (the flyover ramp: a link carrying `level`), `platform`
// and `signal`. Block sections stay in `passthrough` on purpose — the plan
// keeps them GLOBAL, since a piece can say where a signal is but cannot know
// what its section covers without solving a graph problem.
// ---------------------------------------------------------------------------

import type {
  Dir,
  SignalFacing,
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
  /** Grade level. A ramp passing OVER another line carries level > 0. */
  level?: number;
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

/**
 * A loop / siding: a chain of one or more edges leaving a running line and
 * rejoining it, through a switch at each outer end. The chain's INTERMEDIATE
 * nodes are named by the piece (they are its own), the outer ends attach by
 * position like a crossover.
 */
export type LoopPiece = {
  kind: "loop";
  groupId: string;
  role?: TrackRole;
  level?: number;
  /** Where the chain leaves the running line. */
  from: TopologyPoint;
  /** Chained segments in order; the last one's `to` rejoins a running line. */
  segments: readonly {
    id: string;
    to: TopologyPoint;
    /** Node id at this segment's far end. Required except on the last. */
    toNode?: string;
    via?: readonly TopologyGeometryVertex[];
    renderSlots: readonly number[];
  }[];
  switches: readonly {
    id: number;
    end: "from" | "to";
    initialState: "normal" | "reversed";
    controlGroupId: string;
    dashSide: "left" | "right";
    label: string;
  }[];
  intent?: string;
};

/** A station platform on one track. */
export type PlatformPiece = {
  kind: "platform";
  stationCode: string;
  /** The track group served. */
  groupId: string;
  /** Stop position along the line. */
  x: number;
  intent?: string;
};

/**
 * A signal protecting a block. Declares its GROUP and position, never an edge
 * id — the assembler resolves which edge and segment contains it.
 */
export type SignalPiece = {
  kind: "signal";
  id: string;
  code?: string;
  groupId: string;
  /** Position along the line. Resolved against the group's horizontal spans. */
  x?: number;
  /**
   * Explicit placement escape for a DIAGONAL run, where an x does not identify
   * a point unambiguously enough to round-trip exactly (the flyover ramp's
   * signal sits at a fractional coordinate). Positional within the group, so
   * still not an edge-id reference.
   */
  at?: { edgeIndex: number; segmentIndex: number; offset: number };
  facing: SignalFacing;
  mount: "up" | "down";
  label: string;
  block?: boolean;
  ai?: boolean;
  initialState?: boolean;
  protectedBlockSectionId: string;
  intent?: string;
};

/**
 * A whole running line, split automatically wherever a `link` lands on it.
 *
 * This is the piece that makes a real station tractable. Jatinegara's IR has
 * 90 edges, but an author should not write 90 of anything: the edges exist
 * only because a line must be cut at every junction. Here the author writes
 * the line ONCE, as its true drawn extent, and the cuts are derived from the
 * links that actually touch it.
 *
 * Ids follow the established convention so the result is diffable against the
 * generated file: nodes are `s{y}x{x}`, edges are `e-{group}-{x1}-{x2}`.
 */
export type LinePiece = {
  kind: "line";
  /** Track group id, e.g. "t1". */
  id: string;
  y: number;
  /** Drawn extent. Not extended to the map boundary. */
  from: number;
  to: number;
  role?: TrackRole;
  normalDirection?: Dir;
  bidirectional?: boolean;
  /** Boundary node names, west then east. Omitted ends are named `s{y}x{x}`. */
  endNodes?: { west?: string; east?: string };
  intent?: string;
};

/**
 * A diagonal connecting two lines. Becomes a one-edge track group.
 *
 * Whether each end is a SWITCH or a fixed track turn is derived, not
 * declared: an end landing in the INTERIOR of a line is a switch, an end
 * landing exactly at a line's extremity is a fixed turn. That single rule
 * accounts for Jatinegara's 29 diagonals having 58 ends but only 48 switches.
 */
export type LinkPiece = {
  kind: "link";
  /** Track group id, e.g. "xov1". */
  id: string;
  from: TopologyPoint;
  to: TopologyPoint;
  role?: TrackRole;
  level?: number;
  intent?: string;
};

export type Piece =
  | TrackPiece
  | CrossoverPiece
  | TerminusPiece
  | LoopPiece
  | PlatformPiece
  | SignalPiece
  | LinePiece
  | LinkPiece;

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
  /**
   * Which lever works each derived switch. Geometry decides WHERE a switch is
   * and which way it dashes; it cannot know which control group owns it, so
   * that stays authored - keyed by the derived switch number.
   */
  switchMeta?: SwitchMeta;
};

const pointKey = (p: TopologyPoint): string => `${p[0]}|${p[1]}`;

/** Node id convention for a point on a station grid. */
const gridNodeId = (x: number, y: number): string => `s${y}x${x}`;

/** Per-switch metadata the geometry cannot supply (which lever works it). */
export type SwitchMeta = Record<
  number,
  { controlGroupId: string; label?: string; initialState?: "normal" | "reversed" }
>;

/**
 * Lower `line` + `link` pieces into `track` + `crossover` pieces.
 *
 * Everything here is derivation the author would otherwise do by hand:
 *   - cut each line at every link endpoint that lands on it,
 *   - decide switch vs fixed track turn by interior-vs-extremity,
 *   - number switches by line order then x ascending,
 *   - derive dashSide from the diagonal's direction.
 *
 * A link endpoint that lands on NO line is an authoring error, reported with
 * its coordinate rather than silently dropped - a diagonal floating in space
 * is precisely the mistake this vocabulary should catch.
 */
const expandLines = (
  pieces: readonly Piece[],
  switchMeta: SwitchMeta
): { pieces: readonly Piece[]; groupMeta: Passthrough["groupMeta"] } => {
  const lines = pieces.filter((p): p is LinePiece => p.kind === "line");
  const links = pieces.filter((p): p is LinkPiece => p.kind === "link");
  if (lines.length === 0 && links.length === 0) return { pieces, groupMeta: undefined };

  // A `line` carries its own direction, so the author states it ONCE on the
  // piece rather than repeating it in a separate group table.
  const groupMeta: NonNullable<Passthrough["groupMeta"]> = {};
  for (const l of lines) {
    groupMeta[l.id] = {
      ...(l.role !== undefined ? { role: l.role } : { role: "main" as TrackRole }),
      ...(l.normalDirection !== undefined ? { normalDirection: l.normalDirection } : {}),
      ...(l.bidirectional !== undefined ? { bidirectional: l.bidirectional } : {}),
    };
  }

  const lineOrder = new Map(lines.map((l, i) => [l.id, i]));
  const lo = (l: LinePiece) => Math.min(l.from, l.to);
  const hi = (l: LinePiece) => Math.max(l.from, l.to);
  const lineAt = (p: TopologyPoint): LinePiece | undefined =>
    lines.find((l) => l.y === p[1] && p[0] >= lo(l) && p[0] <= hi(l));

  // --- switch numbering ------------------------------------------------------
  // EVERY diagonal end is numbered by (line order, then x ascending), and the
  // fixed turns are then dropped. Numbering before discarding - rather than
  // after - is what leaves gaps in the id sequence (Jatinegara has no switch
  // 37, 39, 45, or 51). That is load-bearing: switch ids appear in scenarios
  // and control-group tables, so renumbering them densely would silently
  // repoint every lever.
  const ends: { line: LinePiece; x: number; interior: boolean }[] = [];
  for (const link of links) {
    for (const end of ["from", "to"] as const) {
      const p = link[end];
      const line = lineAt(p);
      if (!line) {
        throw new Error(
          `link "${link.id}" ${end} end at (${p[0]},${p[1]}) lands on no line. ` +
            `Pieces join by position - place it where a line actually runs.`
        );
      }
      // Interior => a real switch. At the line's extremity => a fixed turn.
      ends.push({ line, x: p[0], interior: p[0] > lo(line) && p[0] < hi(line) });
    }
  }
  ends.sort((a, b) => lineOrder.get(a.line.id)! - lineOrder.get(b.line.id)! || a.x - b.x);
  const switchIdAt = new Map<string, number>();
  ends.forEach((e, i) => {
    if (e.interior) switchIdAt.set(pointKey([e.x, e.line.y]), i + 1);
  });

  // --- cut each line wherever a link lands on it -----------------------------
  const out: Piece[] = [];
  for (const line of lines) {
    const west = lo(line);
    const east = hi(line);
    const cuts = new Set<number>([west, east]);
    for (const link of links) {
      for (const end of ["from", "to"] as const) {
        const p = link[end];
        if (p[1] === line.y && p[0] > west && p[0] < east) cuts.add(p[0]);
      }
    }
    const nameFor = (x: number) =>
      x === west && line.endNodes?.west !== undefined
        ? line.endNodes.west
        : x === east && line.endNodes?.east !== undefined
          ? line.endNodes.east
          : gridNodeId(x, line.y);
    const xs = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++) {
      out.push({
        kind: "track",
        id: `e-${line.id}-${xs[i]}-${xs[i + 1]}`,
        groupId: line.id,
        from: [xs[i], line.y],
        to: [xs[i + 1], line.y],
        fromNode: nameFor(xs[i]),
        toNode: nameFor(xs[i + 1]),
        renderSlots: [],
      } as TrackPiece);
    }
  }

  // --- links become one-edge crossover groups --------------------------------
  for (const link of links) {
    const switches: {
      id: number;
      end: "from" | "to";
      initialState: "normal" | "reversed";
      controlGroupId: string;
      dashSide: "left" | "right";
      label: string;
    }[] = [];
    for (const end of ["from", "to"] as const) {
      const p = link[end];
      const id = switchIdAt.get(pointKey(p));
      if (id === undefined) continue; // fixed track turn, not a point
      const other = end === "from" ? link.to : link.from;
      const meta = switchMeta[id];
      if (!meta) {
        throw new Error(`switch ${id} at (${p[0]},${p[1]}) has no control-group mapping`);
      }
      switches.push({
        id,
        end,
        initialState: meta.initialState ?? "normal",
        controlGroupId: meta.controlGroupId,
        // A diagonal heading EAST from the point dashes right, else left.
        dashSide: other[0] > p[0] ? "right" : "left",
        label: meta.label ?? meta.controlGroupId,
      });
    }
    out.push({
      kind: "crossover",
      id: `d-${link.id}`,
      groupId: link.id,
      role: link.role ?? ("crossover" as TrackRole),
      ...(link.level !== undefined ? { level: link.level } : {}),
      from: link.from,
      to: link.to,
      renderSlots: [],
      switches,
    } as CrossoverPiece);
  }

  return {
    pieces: [...pieces.filter((p) => p.kind !== "line" && p.kind !== "link"), ...out],
    groupMeta,
  };
};


/**
 * Assemble pieces into a TopologyDefinition.
 *
 * Node ids come from the pieces' own end names; a point named by more than one
 * piece must be named CONSISTENTLY, which is checked rather than assumed —
 * two pieces disagreeing about a shared node is exactly the authoring mistake
 * this vocabulary is meant to make impossible.
 */
export const assemblePieces = ({
  pieces: authored,
  passthrough = {},
  switchMeta = {},
}: PieceSet): TopologyDefinition => {
  // `line`/`link` are sugar over `track`/`crossover`: lower them first so
  // there is exactly ONE join, switch, and grouping path to reason about.
  const expanded = expandLines(authored, switchMeta);
  const pieces = expanded.pieces;
  const tracks = pieces.filter((p): p is TrackPiece => p.kind === "track");
  const termini = pieces.filter((p): p is TerminusPiece => p.kind === "terminus");
  const loops = pieces.filter((p): p is LoopPiece => p.kind === "loop");
  const platforms = pieces.filter((p): p is PlatformPiece => p.kind === "platform");
  const signalPieces = pieces.filter((p): p is SignalPiece => p.kind === "signal");

  // A loop is a chain of links sharing the crossover machinery: each segment
  // becomes a link, and the outer ends carry the switches. Flattening here
  // keeps one join/switch path for both shapes.
  const loopLinks: CrossoverPiece[] = loops.flatMap((loop) => {
    const outerLast = loop.segments.length - 1;
    return loop.segments.map((seg, index) => {
      const from = index === 0 ? loop.from : loop.segments[index - 1].to;
      const isOuter = index === 0 || index === outerLast;
      return {
        kind: "crossover" as const,
        id: seg.id,
        groupId: loop.groupId,
        role: loop.role ?? ("loop" as TrackRole),
        ...(loop.level !== undefined ? { level: loop.level } : {}),
        from,
        to: seg.to,
        via: seg.via,
        renderSlots: seg.renderSlots,
        // switches live on the OUTER ends only; an intermediate joint is a
        // plain node, not a point.
        switches: isOuter
          ? loop.switches.filter(
              (s) => (s.end === "from" && index === 0) || (s.end === "to" && index === outerLast)
            )
          : [],
        _loopIntermediateNode: index < outerLast ? loop.segments[index].toNode : undefined,
      } as CrossoverPiece & { _loopIntermediateNode?: string };
    });
  });

  const crossovers: CrossoverPiece[] = [
    ...pieces.filter((p): p is CrossoverPiece => p.kind === "crossover"),
    ...loopLinks,
  ];

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
  // A loop's INTERMEDIATE joints are its own nodes, so it names them.
  for (const link of loopLinks) {
    const name = (link as CrossoverPiece & { _loopIntermediateNode?: string })
      ._loopIntermediateNode;
    if (name !== undefined) claim(link.to, name, `loop ${link.id}`);
  }

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
      ...(c.level !== undefined ? { level: c.level } : {}),
      renderSlots: c.renderSlots,
    })),
  ];

  // --- 2b. derive render slots where the author left them empty -------------
  // Slots must be contiguous from zero. Ordering follows the established
  // convention: track groups in declaration order, then crossover groups,
  // each edge in ascending x. An author writing `line`/`link` never numbers
  // these; a piece that DID declare slots keeps them.
  if (edges.some((e) => e.renderSlots.length === 0)) {
    const groupSeq: string[] = [];
    for (const e of edges) if (!groupSeq.includes(e.trackGroupId)) groupSeq.push(e.trackGroupId);
    const ordered = [...edges].sort((a, b) => {
      const ga = groupSeq.indexOf(a.trackGroupId);
      const gb = groupSeq.indexOf(b.trackGroupId);
      if (ga !== gb) return ga - gb;
      return a.geometry[0].point[0] - b.geometry[0].point[0];
    });
    let next = 0;
    const assigned = new Map<string, number[]>();
    for (const e of ordered) {
      assigned.set(e.id, e.renderSlots.length > 0 ? [...e.renderSlots] : [next]);
      next++;
    }
    for (let i = 0; i < edges.length; i++) {
      edges[i] = { ...edges[i], renderSlots: assigned.get(edges[i].id)! };
    }
  }

  // --- 3. switch nodes ------------------------------------------------------
  // A node is a switch iff a crossover ends there; every other named point is
  // a boundary. Derived from placement, never declared twice.
  const switchPoints = new Set<string>();
  for (const c of crossovers) {
    for (const sw of c.switches) switchPoints.add(pointKey(c[sw.end]));
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
  for (const link of loopLinks) {
    if ((link as CrossoverPiece & { _loopIntermediateNode?: string })._loopIntermediateNode) {
      emitNode(link.to);
    }
  }

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

      // A loop link may itself be the through axis when a chain attaches to
      // another chain, so consider both plain tracks and loop links.
      const throughCandidates = [
        ...tracks.map((t) => ({ id: t.id, from: t.from, to: t.to })),
        ...loopLinks
          .filter((l) => l.id !== c.id)
          .map((l) => ({ id: l.id, from: l.from, to: l.to })),
      ];
      const arriving = throughCandidates.filter((t) => pointKey(t.to) === key);
      const leaving = throughCandidates.filter((t) => pointKey(t.from) === key);

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
  // Explicit passthrough.groupMeta wins over metadata derived from a `line`.
  const meta = { ...(expanded.groupMeta ?? {}), ...(passthrough.groupMeta ?? {}) };
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

  // --- 7. resolve platform / signal placements ------------------------------
  // A platform or signal declares its GROUP and an x; the assembler finds
  // which edge and segment actually contains that point. This is the last
  // edge-id reference the author used to write by hand.
  const edgeById = new Map(edges.map((e) => [e.id, e]));
  const resolveOnGroup = (
    groupId: string,
    x: number,
    context: string
  ): { edgeId: string; segmentIndex: number; offset: number } => {
    const group = trackGroups.find((g) => g.id === groupId);
    if (!group) throw new Error(`${context} names unknown track group "${groupId}"`);
    for (const edgeId of group.edgeIds) {
      const edge = edgeById.get(edgeId)!;
      for (let i = 0; i < edge.geometry.length - 1; i++) {
        const a = edge.geometry[i].point;
        const b = edge.geometry[i + 1].point;
        const lo = Math.min(a[0], b[0]);
        const hi = Math.max(a[0], b[0]);
        if (x < lo || x > hi || lo === hi) continue;
        return { edgeId, segmentIndex: i, offset: Math.abs(x - a[0]) };
      }
    }
    throw new Error(
      `${context} at x=${x} falls on no segment of track group "${groupId}". ` +
        `Place it where the line actually runs.`
    );
  };

  const stationStopPoints: StationStopPoint[] = [
    ...(passthrough.stationStopPoints ?? []),
    ...platforms.map((p) => ({
      stationCode: p.stationCode,
      ...resolveOnGroup(p.groupId, p.x, `platform ${p.stationCode}`),
    })),
  ];

  const signals: TopologySignal[] = [
    ...(passthrough.signals ?? []),
    ...signalPieces.map((s) => {
      const group = trackGroups.find((g) => g.id === s.groupId);
      if (!group) throw new Error(`signal ${s.id} names unknown track group "${s.groupId}"`);
      const placement =
        s.at !== undefined
          ? {
              edgeId: group.edgeIds[s.at.edgeIndex],
              segmentIndex: s.at.segmentIndex,
              offset: s.at.offset,
            }
          : resolveOnGroup(s.groupId, s.x!, `signal ${s.id}`);
      return {
        id: s.id,
        ...(s.code !== undefined ? { code: s.code } : {}),
        ...placement,
        facing: s.facing,
        mount: s.mount,
        label: s.label,
        ...(s.block !== undefined ? { block: s.block } : {}),
        ...(s.ai !== undefined ? { ai: s.ai } : {}),
        ...(s.initialState !== undefined ? { initialState: s.initialState } : {}),
        protectedBlockSectionId: s.protectedBlockSectionId,
      };
    }),
  ];

  return {
    nodes,
    edges,
    switches,
    controlGroups,
    signals,
    trackGroups,
    blockSections: [...(passthrough.blockSections ?? [])],
    stationStopPoints,
    legacyNodeOrder: [...(passthrough.legacyNodeOrder ?? nodes.map((n) => n.id))],
  };
};
