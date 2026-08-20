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
// and `signal`.
//
// Block sections were originally left in `passthrough` on the grounds that a
// piece cannot know what its section covers "without solving a graph problem".
// They are now DERIVED (see 7b): the walk is local to one track group - from a
// signal to the next same-facing signal on that group, or off the map edge if
// there is none - so no global solve is needed. A layout may still pass a
// table explicitly, and hand-authored IR does.
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
    /** Which leg diverges; see SwitchMeta.branch. Default "link". */
    branch?: "link" | "line";
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
  /**
   * Cut this diagonal in two at the given point, yielding `<id>` and `<id>b`.
   *
   * A switch can only sit at a link ENDPOINT, so a point partway along a
   * diagonal needs the diagonal split there. Authoring the halves by hand works
   * but makes moving that point a three-place edit whose parts must stay
   * collinear. Declaring the cut keeps the diagonal one piece: move `from`/`to`
   * and the halves follow.
   *
   * The point must lie strictly between the ends and on the line between them.
   */
  splitAt?: TopologyPoint;
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
   * that stays authored - keyed by `"<linkId>:<end>"`, the identity the author
   * already wrote on the `link` piece itself.
   */
  switchMeta?: SwitchMeta;
};

const pointKey = (p: TopologyPoint): string => `${p[0]}|${p[1]}`;

/** Node id convention for a point on a station grid. */
const gridNodeId = (x: number, y: number): string => `s${y}x${x}`;

/**
 * Per-switch metadata the geometry cannot supply (which lever works it).
 *
 * Keyed by `` `${linkId}:${end}` `` (end being "from" or "to") - NOT by the
 * derived switch number. The derived number is a position in a (line order,
 * x-ascending) walk, so any geometry edit that changes which endpoints are
 * interior, or their relative x order, silently renumbers every switch after
 * it and reattaches levers to the wrong physical point. `linkId:end` names the
 * piece the author actually wrote, so it cannot drift out of sync that way.
 */
export type SwitchMeta = Record<
  string,
  {
    controlGroupId: string;
    label?: string;
    initialState?: "normal" | "reversed";
    /**
     * Which leg diverges. Default "link": the usual point, where the running
     * line goes straight through and the diagonal is the branch.
     *
     * "line" INVERTS that. The two halves of a split diagonal are collinear and
     * become the through axis; the horizontal line that terminates here is the
     * branch. Physically ordinary - a stub trailing into a diagonal - but the
     * opposite of every other point, so the author must say so. The end must sit
     * at the line's extremity, since a line running THROUGH the point cannot be
     * the leg that diverges from it.
     */
    branch?: "link" | "line";
  }
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
  const authoredLinks = pieces.filter((p): p is LinkPiece => p.kind === "link");
  if (lines.length === 0 && authoredLinks.length === 0) return { pieces, groupMeta: undefined };

  // Apply `splitAt` first, so everything downstream sees ordinary two-ended
  // links and needs no knowledge of the cut.
  const links: LinkPiece[] = [];
  for (const link of authoredLinks) {
    if (!link.splitAt) {
      links.push(link);
      continue;
    }
    const [ax, ay] = link.from;
    const [bx, by] = link.to;
    const [cx, cy] = link.splitAt;
    // Collinear and strictly between: a cut off the diagonal would silently bend
    // it, which is the class of error this vocabulary exists to prevent.
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const between =
      cx > Math.min(ax, bx) && cx < Math.max(ax, bx) && cy > Math.min(ay, by) && cy < Math.max(ay, by);
    if (cross !== 0 || !between) {
      throw new Error(
        `link "${link.id}" splitAt (${cx},${cy}) is not strictly between its ends ` +
          `(${ax},${ay}) and (${bx},${by}) on the straight line joining them. ` +
          `A split point must lie ON the diagonal it cuts.`
      );
    }
    const { splitAt: _omit, ...rest } = link;
    links.push({ ...rest, id: link.id, from: link.from, to: link.splitAt });
    links.push({ ...rest, id: `${link.id}b`, from: link.splitAt, to: link.to });
  }

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
  const ends: { line: LinePiece; x: number; interior: boolean; key: string }[] = [];
  const validSwitchMetaKeys = new Set<string>();
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
      // Interior => a real switch. At the line's extremity => a fixed turn,
      // UNLESS the author declares an inverted point there (branch: "line"),
      // where the terminating line is exactly the leg that diverges.
      const key = `${link.id}:${end}`;
      const interior = p[0] > lo(line) && p[0] < hi(line);
      const invertedHere = switchMeta[key]?.branch === "line";
      if (invertedHere && interior) {
        throw new Error(
          `switch "${key}" at (${p[0]},${p[1]}) declares branch "line", but line ` +
            `"${line.id}" runs THROUGH that point. A line can only be the diverging ` +
            `leg where it ends - put the end at the line's extremity.`
        );
      }
      const isSwitch = interior || invertedHere;
      if (isSwitch) validSwitchMetaKeys.add(key);
      ends.push({ line, x: p[0], interior: isSwitch, key });
    }
  }
  const orphanedSwitchMetaKeys = Object.keys(switchMeta).filter(
    (key) => !validSwitchMetaKeys.has(key)
  );
  if (orphanedSwitchMetaKeys.length > 0) {
    throw new Error(
      `switchMeta contains orphaned key(s): ${orphanedSwitchMetaKeys.join(", ")}. ` +
        `Each key must name a real interior link endpoint as "<linkId>:<end>".`
    );
  }
  ends.sort((a, b) => lineOrder.get(a.line.id)! - lineOrder.get(b.line.id)! || a.x - b.x);
  // Keyed by link END, not by point: an inverted point has TWO link ends at the
  // same coordinate (the two halves of the split diagonal), and only the one the
  // author declared carries the lever. Keying by point would give both the same
  // id and derive the switch twice.
  const switchIdByEnd = new Map<string, number>();
  ends.forEach((e, i) => {
    if (e.interior) switchIdByEnd.set(e.key, i + 1);
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
      branch?: "link" | "line";
      label: string;
    }[] = [];
    for (const end of ["from", "to"] as const) {
      const p = link[end];
      const metaKeyEarly = `${link.id}:${end}`;
      const id = switchIdByEnd.get(metaKeyEarly);
      if (id === undefined) continue; // fixed track turn, not a point
      const other = end === "from" ? link.to : link.from;
      // Look the lever up by the AUTHORED identity, not the derived number:
      // the derived id still becomes `TopologySwitch.id`, but it is a position
      // in a walk and renumbers under geometry edits.
      const metaKey = metaKeyEarly;
      const meta = switchMeta[metaKey];
      if (!meta) {
        throw new Error(
          `switch ${id} ("${metaKey}") at (${p[0]},${p[1]}) has no control-group mapping`
        );
      }
      // The dash marks the DIVERGING leg, so it follows whichever leg that is.
      // Normally the diagonal: it dashes right when it heads east. For an
      // inverted point the branch is the terminating line, which runs away from
      // the point toward the far end of its own extent.
      const branchLine = lineAt(p)!;
      const dashSide =
        meta.branch === "line"
          ? p[0] === lo(branchLine)
            ? ("right" as const)
            : ("left" as const)
          : other[0] > p[0]
            ? ("right" as const)
            : ("left" as const);
      switches.push({
        id,
        end,
        initialState: meta.initialState ?? "normal",
        controlGroupId: meta.controlGroupId,
        dashSide,
        ...(meta.branch !== undefined ? { branch: meta.branch } : {}),
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
      // An INVERTED point swaps the roles: the two collinear halves of the split
      // diagonal are the through axis, and the terminating line is the branch.
      // Both legs are still DERIVED from what physically meets the point - only
      // which set is searched changes.
      if (sw.branch === "line") {
        const lineHere = tracks.filter(
          (t) => pointKey(t.from) === key || pointKey(t.to) === key
        );
        if (lineHere.length !== 1) {
          throw new Error(
            `Inverted switch ${sw.id} at (${point[0]},${point[1]}) needs exactly one ` +
              `terminating line as its branch, found ${lineHere.length}. A line running ` +
              `through the point cannot diverge from it.`
          );
        }
        const onward = crossovers.find(
          (o) => o.id !== c.id && (pointKey(o.from) === key || pointKey(o.to) === key)
        );
        if (!onward) {
          throw new Error(
            `Inverted switch ${sw.id} at (${point[0]},${point[1]}) has no continuing ` +
              `diagonal: its through axis is the OTHER half of the split link. Author ` +
              `both halves as separate links meeting at this point.`
          );
        }
        const branchEdge = lineHere[0];
        // Which diagonal half is the TRUNK is geometry, not authoring order. A
        // point diverges into two legs lying to the SAME side of it; the trunk
        // is the leg opposite. So the half on the branch's side is the straight,
        // and the half facing away is the common - the leg every route uses
        // whatever the point is set to.
        const endAt = (piece: { from: TopologyPoint; to: TopologyPoint }) =>
          pointKey(piece.from) === key ? ("from" as const) : ("to" as const);
        const awayX = (piece: { from: TopologyPoint; to: TopologyPoint }) =>
          (endAt(piece) === "from" ? piece.to : piece.from)[0] - point[0];
        const branchSign = Math.sign(awayX(branchEdge));
        const trunk = Math.sign(awayX(c)) === branchSign ? onward : c;
        const straight = trunk === c ? onward : c;
        switches.push({
          id: sw.id,
          nodeId,
          common: { edgeId: trunk.id, end: endAt(trunk) },
          normal: { edgeId: straight.id, end: endAt(straight) },
          reversed: { edgeId: branchEdge.id, end: endAt(branchEdge) },
          initialState: sw.initialState,
          controlGroupId: sw.controlGroupId,
          dashSide: sw.dashSide,
          branch: "line",
          label: sw.label,
        });
        continue;
      }

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

  // --- 7b. derive block sections from signal placement ----------------------
  // A signal's section runs from the signal to the NEXT same-facing signal on
  // the same track group; if there is none, the section runs off the map edge
  // and is flagged open on that side. That walk is the whole "graph problem"
  // an earlier note said a piece could not solve - it is local to one group,
  // so the assembler can do it and the author never writes an edge id.
  //
  // A layout may still hand the sections in via `passthrough.blockSections`;
  // an authored table wins, so hand-authored IR keeps working unchanged.
  const edgeLo = (edgeId: string): number =>
    Math.min(...edgeById.get(edgeId)!.geometry.map((v) => v.point[0]));
  const edgeHi = (edgeId: string): number =>
    Math.max(...edgeById.get(edgeId)!.geometry.map((v) => v.point[0]));
  const signalX = (s: TopologySignal): number => {
    const edge = edgeById.get(s.edgeId)!;
    const a = edge.geometry[s.segmentIndex].point;
    const b = edge.geometry[s.segmentIndex + 1].point;
    return a[0] + (b[0] > a[0] ? s.offset : -s.offset);
  };
  const signalGroup = (s: TopologySignal): string => edgeById.get(s.edgeId)!.trackGroupId;

  // --- walking past a fixed turn ------------------------------------------
  // A track group can end at a vertex that is NOT a decision point: two edges
  // meet, no switch sits there, so an approaching train has exactly one way to
  // go. Jatinegara's stub ends are like this (AG8 -> d-xov14, AG2 -> d-xov13):
  // the group changes, but nothing about the route is ambiguous.
  //
  // Section derivation used to stop dead at the group boundary, which made a
  // signal on such a vertex protect zero track even though the railway plainly
  // continues. We therefore keep walking while the continuation is forced, and
  // stop as soon as a real decision or a real end appears:
  //
  //   * a switch      -> which way the section runs is runtime point state
  //   * degree != 2   -> a dead end, or a fan-out we must not guess through
  //   * a signal      -> the next block starts here
  //
  // Only the first case is genuinely undecidable; the others are terminal by
  // definition. Nothing here consults switch position, so sections stay static.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const edgesByNode = new Map<string, TrackEdge[]>();
  for (const edge of edges) {
    for (const nodeId of [edge.from, edge.to]) {
      const list = edgesByNode.get(nodeId);
      if (list) list.push(edge);
      else edgesByNode.set(nodeId, [edge]);
    }
  }
  const switchByNode = new Set(switches.map((s) => s.nodeId));
  const signalNodeIds = new Set(
    signals
      .map((s) => {
        const x = signalX(s);
        const edge = edgeById.get(s.edgeId)!;
        const y = edge.geometry[0].point[1];
        return nodes.find((n) => n.point[0] === x && n.point[1] === y)?.id;
      })
      .filter((id): id is string => id !== undefined)
  );

  /**
   * From `nodeId`, having arrived along `viaEdgeId`, list the edges a section
   * may continue through without guessing. Empty when the section must stop.
   */
  const walkFixedTurns = (
    nodeId: string,
    viaEdgeId: string
  ): { edge: TrackEdge; enteredAt: "from" | "to" }[] => {
    const out: { edge: TrackEdge; enteredAt: "from" | "to" }[] = [];
    let currentNode = nodeId;
    let currentEdge = viaEdgeId;
    const visited = new Set<string>([viaEdgeId]);

    // bounded: each step consumes an edge, and no edge repeats
    for (let guard = 0; guard <= edges.length; guard += 1) {
      if (switchByNode.has(currentNode)) return out;
      if (out.length && signalNodeIds.has(currentNode)) return out;

      const here = edgesByNode.get(currentNode) ?? [];
      if (here.length !== 2) return out;

      const next = here.find((e) => e.id !== currentEdge);
      if (next === undefined || visited.has(next.id)) return out;

      visited.add(next.id);
      // we enter this edge at whichever of its ends we are standing on, which
      // is not implied by x-order once the track turns back on itself
      out.push({ edge: next, enteredAt: next.from === currentNode ? "from" : "to" });
      currentNode = next.from === currentNode ? next.to : next.from;
      currentEdge = next.id;
    }
    return out;
  };

  const deriveBlockSections = (): TopologyBlockSection[] =>
    signals.map((signal) => {
      const east = signal.facing === "toward-to";
      const groupId = signalGroup(signal);
      const group = trackGroups.find((g) => g.id === groupId)!;
      const x = signalX(signal);

      // nearest same-facing signal ahead, on this group only: a stub track's
      // section cannot span a throat gap into another group.
      const ahead = signals.filter(
        (o) =>
          o.id !== signal.id &&
          signalGroup(o) === groupId &&
          o.facing === signal.facing &&
          (east ? signalX(o) > x : signalX(o) < x)
      );
      const next = ahead.length
        ? ahead.reduce((p, c) =>
            (east ? signalX(c) < signalX(p) : signalX(c) > signalX(p)) ? c : p
          )
        : undefined;
      const nextLo = next ? edgeLo(next.edgeId) : undefined;
      const nextHi = next ? edgeHi(next.edgeId) : undefined;
      const ownLo = edgeLo(signal.edgeId);
      const ownHi = edgeHi(signal.edgeId);

      const covered = [...group.edgeIds]
        .filter((edgeId) => {
          const a = edgeLo(edgeId);
          const b = edgeHi(edgeId);
          return east
            ? a >= ownLo && (next === undefined || b <= nextHi!)
            : (next === undefined || a >= nextLo!) && b <= ownHi;
        })
        .sort((p, q) => (east ? edgeLo(p) - edgeLo(q) : edgeLo(q) - edgeLo(p)));

      // the group ran out with no signal ahead: follow any forced continuation
      // into the throat, so a signal on the group's last vertex still protects
      // the track the train will actually occupy.
      const continuation: { edge: TrackEdge; enteredAt: "from" | "to" }[] = [];
      if (next === undefined && covered.length) {
        const lastId = covered[covered.length - 1];
        const lastEdge = edgeById.get(lastId)!;
        const lastLo = edgeLo(lastId);
        const lastHi = edgeHi(lastId);
        // the open end is whichever node sits at the far side of travel
        const farPoint = east ? lastHi : lastLo;
        const endNodeId =
          nodeById.get(lastEdge.to)!.point[0] === farPoint ? lastEdge.to : lastEdge.from;
        continuation.push(...walkFixedTurns(endNodeId, lastId));
      }

      const orderedIds = [...covered, ...continuation.map((c) => c.edge.id)];
      const edgeRanges = orderedIds.map((edgeId, i) => {
        const isFirst = i === 0;
        const isLast = i === orderedIds.length - 1;
        const step = i >= covered.length ? continuation[i - covered.length] : undefined;
        // in-group edges run with x; a continuation edge is traversed from the
        // end we actually arrived at, which x-order does not imply once the
        // track turns.
        const entry = step ? step.enteredAt : east ? "from" : "to";
        const exit = step ? (step.enteredAt === "from" ? "to" : "from") : east ? "to" : "from";
        return {
          edgeId,
          from: isFirst
            ? ({ kind: "signal", signalId: signal.id } as const)
            : ({ kind: "edge-end", end: entry } as const),
          to:
            next !== undefined && isLast
              ? ({ kind: "signal", signalId: next.id } as const)
              : ({ kind: "edge-end", end: exit } as const),
        };
      });

      return {
        id: signal.protectedBlockSectionId,
        signalId: signal.id,
        coverage: "signal-to-boundary" as const,
        edgeRanges,
        ...(next === undefined ? { legacyOpenEnd: east ? ("east" as const) : ("west" as const) } : {}),
      };
    });

  const blockSections: TopologyBlockSection[] =
    passthrough.blockSections !== undefined
      ? [...passthrough.blockSections]
      : deriveBlockSections();

  // --- 8. preflight: every authored edge reference names a real edge --------
  // Signals, stop points and block sections stay author-maintained (they are
  // operations, not geometry), so they are the one place a hand-written edge
  // id survives. A mid-span geometry edit re-cuts a line and renames its
  // edges, which silently orphans those references — caught here, at the
  // assembly boundary, naming the table and the stale id, rather than as a
  // cryptic failure deep inside compileTopology (or not at all).
  const requireEdge = (edgeId: string, context: string) => {
    if (!edgeById.has(edgeId)) {
      throw new Error(
        `${context} references unknown edge "${edgeId}". ` +
          `No assembled edge has that id — a geometry edit may have re-cut the ` +
          `line and renamed it.`
      );
    }
  };

  (passthrough.signals ?? []).forEach((signal, i) => {
    requireEdge(signal.edgeId, `passthrough.signals[${i}] (signal "${signal.id}")`);
  });

  (passthrough.stationStopPoints ?? []).forEach((stop, i) => {
    requireEdge(
      stop.edgeId,
      `passthrough.stationStopPoints[${i}] (station "${stop.stationCode}")`
    );
  });

  blockSections.forEach((section, i) => {
    section.edgeRanges.forEach((range, j) => {
      requireEdge(
        range.edgeId,
        `blockSections[${i}].edgeRanges[${j}] (block section "${section.id}")`
      );
    });
  });

  return {
    nodes,
    edges,
    switches,
    controlGroups,
    signals,
    trackGroups,
    blockSections,
    stationStopPoints,
    legacyNodeOrder: [...(passthrough.legacyNodeOrder ?? nodes.map((n) => n.id))],
  };
};
