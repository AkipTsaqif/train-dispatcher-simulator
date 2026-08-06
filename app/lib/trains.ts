// ---------------------------------------------------------------------------
// Train model — schedule-driven movement engine (prototype).
//
// Trains move continuously along the track graph, cell-by-cell speed derived
// from the REAL schedule times. The engine:
//   • follows switch direction at junctions (diverts when points are thrown),
//   • stops at red signals (re-checks each tick and resumes when clear),
//   • stops when a junction's points block the way,
//   • finishes at the final stop's platform (or when the track runs out).
//
// Prototype: 107B "Senja Utama Yogyakarta" — westbound CIT → TB → BKST.
// ---------------------------------------------------------------------------

export type TrainStop = {
  trackmark: string;
  arr: number;
  arr_actual: string; // HH:MM:SS — the schedule time the engine uses
  dep: number;
  dep_actual: string;
};

export type Train = {
  train_no: string;
  name: string;
  consist: string;
  stops: TrainStop[];
};

export const TRAINS: Train[] = [
  {
    train_no: "107B",
    name: "Senja Utama Yogyakarta",
    consist: "eksekutif",
    stops: [
      { trackmark: "CIT", arr: 60, arr_actual: "00:01:00", dep: 60, dep_actual: "00:01:00" },
      { trackmark: "TB", arr: 180, arr_actual: "00:04:30", dep: 180, dep_actual: "00:04:30" },
      { trackmark: "BKST", arr: 360, arr_actual: "00:09:00", dep: 360, dep_actual: "00:09:00" },
    ],
  },
];

export const hmsToSeconds = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

// ---------------------------------------------------------------------------
// Movement engine
// ---------------------------------------------------------------------------

export type LineDir = "right" | "left";
export type Aspect = "red" | "amber" | "green";

export type GraphNodeLike = {
  x: number;
  y: number;
  straight: Record<LineDir, string | null>;
  branch?: Partial<Record<LineDir, { path: string[]; farSw: number }>>;
  sw?: number;
};

export type SignalLike = { id: string; x: number; y: number; dir: LineDir };

export type MoveCtx = {
  nodes: Record<string, GraphNodeLike>;
  signals: SignalLike[];
  switches: Record<number, "normal" | "reversed">;
  aspectOf: (id: string) => Aspect;
  trainHalfLen: number; // half the train marker length (for stops + occupancy)
};

export type TrainState = {
  x: number;
  y: number;
  dir: LineDir;
  segFrom: [number, number];
  segTo: [number, number];
  nxtNode: string | null; // node id at the end of the current segment
  incoming: string | null; // node the train arrived from (for branch logic)
  speed: number;
  leg: number;
  stopped: boolean;
  stopReason: "signal" | "junction" | null;
  stopSignalId: string | null;
  done: boolean;
  spawned: boolean; // has the train materialized at its origin yet
  originArr: number; // sim time the train appears at its origin
  advanced: number; // travel time already consumed (sim − originArr)
  frontPrev: number | null; // leading-edge x before the current movement step
  passedSignals: string[]; // signals the leading edge crossed this tick
};

export type LegPlan = { waypointX: number; lineY: number; speed: number }[];

export type JourneyPlan = {
  originArr: number;
  start: { x: number; y: number; dir: LineDir; firstNode: string | null };
  legs: LegPlan;
};

/**
 * Plan a journey: origin arrival time, start position + first node ahead, and
 * one leg per stop pair — each leg's speed spreads the scheduled time evenly
 * over the map cells (real-km timing regardless of map spacing).
 */
export function buildJourney(
  stops: TrainStop[],
  platformX: Record<string, number>,
  lineY: number,
  nodes: Record<string, GraphNodeLike>,
  dir: LineDir
): JourneyPlan {
  const originX = platformX[stops[0].trackmark];
  const first = Object.values(nodes)
    .filter((n) => n.y === lineY && (dir === "left" ? n.x < originX : n.x > originX))
    .sort((a, b) => (dir === "left" ? b.x - a.x : a.x - b.x))[0];
  const legs: LegPlan = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const from = platformX[stops[i].trackmark];
    const to = platformX[stops[i + 1].trackmark];
    const secs = hmsToSeconds(stops[i + 1].arr_actual) - hmsToSeconds(stops[i].dep_actual);
    const distUnits = Math.abs(to - from); // platform spacing in map units
    legs.push({ waypointX: to, lineY, speed: distUnits / secs }); // units per sim-second
  }
  const firstNode = first ? (Object.keys(nodes).find((k) => nodes[k] === first) ?? null) : null;
  return { originArr: hmsToSeconds(stops[0].arr_actual), start: { x: originX, y: lineY, dir, firstNode }, legs };
}

export function initTrain(journey: JourneyPlan, nodes: Record<string, GraphNodeLike>, speed: number): TrainState {
  const s = journey.start;
  const target = s.firstNode ? nodes[s.firstNode] : undefined;
  return {
    x: s.x,
    y: s.y,
    dir: s.dir,
    segFrom: [s.x, s.y],
    segTo: target ? [target.x, target.y] : [s.x, s.y],
    nxtNode: s.firstNode,
    incoming: null,
    speed,
    leg: 0,
    stopped: false,
    stopReason: null,
    stopSignalId: null,
    done: false,
    spawned: false,
    originArr: journey.originArr,
    advanced: 0,
    frontPrev: null,
    passedSignals: [],
  };
}

/** Resolve the outgoing node from a junction, mirroring walkRoute's point rules. */
const resolveNode = (
  nodeId: string,
  dir: LineDir,
  incoming: string | null,
  ctx: MoveCtx
): { next: string } | { blocked: true } | { offmap: true } => {
  const node = ctx.nodes[nodeId];
  if (!node) return { offmap: true };
  if (node.sw !== undefined) {
    const reversed = ctx.switches[node.sw] === "reversed";
    const branchAhead = node.branch?.[dir];
    const cameFromBranch =
      incoming !== null && (node.branch?.right?.path[0] ?? node.branch?.left?.path[0]) === incoming;
    if (cameFromBranch) {
      if (!reversed) return { blocked: true };
    } else if (branchAhead && reversed) {
      return { next: branchAhead.path[0] };
    } else if (reversed) {
      return { blocked: true };
    }
  }
  const next = node.straight[dir];
  return next ? { next } : { offmap: true };
};

const setSegment = (st: TrainState, res: { next: string }, ctx: MoveCtx): void => {
  const fromId = st.nxtNode; // the node being left
  const target = ctx.nodes[res.next];
  st.segFrom = [st.x, st.y];
  st.segTo = target ? [target.x, target.y] : [st.x, st.y];
  st.nxtNode = res.next;
  st.incoming = fromId;
};

/**
 * Advance a train by `dt` sim-seconds within its current leg plan. The train
 * stops at red signals ahead (released when the aspect clears), diverts at
 * junctions per switch state, and finishes at the final waypoint or map edge.
 */
export function advanceTrain(st: TrainState, dt: number, ctx: MoveCtx, legs: LegPlan): void {
  if (st.done) return;
  st.passedSignals = [];
  st.frontPrev = st.dir === "left" ? st.x - ctx.trainHalfLen : st.x + ctx.trainHalfLen;

  // release checks while stopped
  if (st.stopped) {
    if (st.stopReason === "signal" && st.stopSignalId) {
      if (ctx.aspectOf(st.stopSignalId) !== "red") {
        st.stopped = false;
        st.stopReason = null;
        st.stopSignalId = null;
      }
    } else if (st.stopReason === "junction" && st.nxtNode) {
      const res = resolveNode(st.nxtNode, st.dir, st.incoming, ctx);
      if (!("blocked" in res)) {
        st.stopped = false;
        st.stopReason = null;
        setSegment(st, res as { next: string }, ctx);
      }
    } else {
      st.stopped = false;
      st.stopReason = null;
    }
    if (st.stopped) return;
  }

  // time-budget loop: the train may cross several limits (nodes, waypoints)
  // within one tick, carrying the remaining time across each arrival.
  let tRemaining = dt;
  let guard = 0;
  while (tRemaining > 0 && !st.done && !st.stopped && guard++ < 200) {
    const leg = legs[Math.min(st.leg, legs.length - 1)];
    st.speed = leg.speed;

    // closest limit ahead: red signal | junction node | leg waypoint
    type Limit = { kind: "signal" | "node" | "waypoint"; x: number; y: number; sigId?: string };
    let limit: Limit | null = null;
    const near = (l: Limit) => Math.hypot(l.x - st.x, l.y - st.y);
    if (st.segFrom[1] === st.segTo[1]) {
      // signals ahead of the train's LEADING edge — a signal the front has just
      // passed is behind (even if the center still reads ahead of it) and must
      // not re-trigger a stop
      const ahead = ctx.signals
        .filter((s) =>
          s.dir === st.dir &&
          s.y === st.y &&
          (st.dir === "left" ? s.x < st.x - ctx.trainHalfLen : s.x > st.x + ctx.trainHalfLen)
        )
        .sort((a, b) => (st.dir === "left" ? b.x - a.x : a.x - b.x));
      const red = ahead.find((s) => ctx.aspectOf(s.id) === "red");
      if (red) {
        // stop so the train's LEADING edge sits at the signal — the marker must
        // never protrude past a red signal
        const stopX = red.x - (st.dir === "left" ? -ctx.trainHalfLen : ctx.trainHalfLen);
        limit = { kind: "signal", x: stopX, y: red.y, sigId: red.id };
      }
    }
    if (st.nxtNode && ctx.nodes[st.nxtNode]) {
      const n = ctx.nodes[st.nxtNode];
      const l: Limit = { kind: "node", x: n.x, y: n.y };
      if (!limit || near(l) < near(limit)) limit = l;
    }
    if (st.y === leg.lineY) {
      const l: Limit = { kind: "waypoint", x: leg.waypointX, y: st.y };
      if (!limit || near(l) < near(limit)) limit = l;
    }

    const move = (dist: number) => {
      const dx = st.segTo[0] - st.segFrom[0];
      const dy = st.segTo[1] - st.segFrom[1];
      const len = Math.hypot(dx, dy) || 1;
      st.x += (dx / len) * dist;
      st.y += (dy / len) * dist;
    };

    // Segment-aware pass detection: after ANY position change on a horizontal
    // segment, record the signals whose x the leading edge crossed. This works
    // even when a single tick jumps the train across a whole section and onto
    // another line (e.g. a crossover diversion).
    const front = () => (st.dir === "left" ? st.x - ctx.trainHalfLen : st.x + ctx.trainHalfLen);
    const checkPass = () => {
      const f = front();
      const lo = Math.min(st.frontPrev ?? f, f);
      const hi = Math.max(st.frontPrev ?? f, f);
      st.frontPrev = f;
      if (st.segFrom[1] !== st.segTo[1]) return; // diagonal — no signals there
      const lineY = st.segFrom[1];
      for (const s of ctx.signals) {
        if (s.dir !== st.dir || s.y !== lineY) continue;
        if (s.x > lo && s.x <= hi && !st.passedSignals.includes(s.id)) st.passedSignals.push(s.id);
      }
    };

    if (!limit) {
      move(leg.speed * tRemaining);
      checkPass();
      tRemaining = 0;
      continue;
    }
    const tToLimit = near(limit) / leg.speed;
    if (tRemaining < tToLimit) {
      move(leg.speed * tRemaining);
      checkPass();
      tRemaining = 0;
      continue;
    }
    tRemaining -= tToLimit;
    st.x = limit.x;
    st.y = limit.y;
    checkPass();
    if (limit.kind === "signal") {
      st.stopped = true;
      st.stopReason = "signal";
      st.stopSignalId = limit.sigId ?? null;
      return;
    }
    if (limit.kind === "waypoint") {
      if (st.leg >= legs.length - 1) {
        st.done = true; // final destination reached
        return;
      }
      st.leg += 1; // pass through — next leg's speed applies to the remaining time
      continue;
    }
    // junction node
    const res = resolveNode(st.nxtNode!, st.dir, st.incoming, ctx);
    if ("blocked" in res) {
      st.stopped = true;
      st.stopReason = "junction";
      return;
    }
    if ("offmap" in res) {
      st.done = true; // track ran out
      return;
    }
    setSegment(st, res, ctx);
  }
}

/**
 * The signals whose protected sections the train's BODY currently overlaps —
 * a section is occupied from when the train's front enters it until the rear
 * leaves, so the signal behind stays red while the tail passes.
 * Returns the comma-joined ids ("" when nothing is occupied).
 */
export function occupiedSections(
  m: TrainState,
  sections: { sig: string; lineY: number; lo: number; hi: number }[],
  halfLen: number
): string {
  if (!m.spawned || m.done) return "";
  const lo = m.x - halfLen;
  const hi = m.x + halfLen;
  return sections
    .filter((s) => s.lineY === m.y && lo < s.hi && hi > s.lo)
    .map((s) => s.sig)
    .join(",");
}

/**
 * The portion of a reservation route still ahead of the train using it — the
 * cells the train has passed return to normal, the unpassed ones stay lit.
 */
export function reservationAhead(
  pts: [number, number][],
  fronts: { lineY: number; front: number }[]
): [number, number][] | null {
  const distTo = (p: [number, number]) => {
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - x1) * dx + (p[1] - y1) * dy) / len2));
      const px = x1 + dx * t;
      const py = y1 + dy * t;
      const d = (p[0] - px) ** 2 + (p[1] - py) ** 2;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  // the train on this route = the front nearest the polyline — geometry-based,
  // so it keeps tracking through crossovers where the train's y differs
  let bestTrain: { lineY: number; front: number } | null = null;
  let bestDist = Infinity;
  for (const f of fronts) {
    const d = distTo([f.front, f.lineY]);
    if (d < bestDist) {
      bestDist = d;
      bestTrain = f;
    }
  }
  if (!bestTrain || bestDist > 58) return pts; // no train on this route — full route
  // split the polyline at the train's front; keep the far end
  const front: [number, number] = [bestTrain.front, bestTrain.lineY];
  let best = { d: Infinity, idx: 0, t: 0 };
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((front[0] - x1) * dx + (front[1] - y1) * dy) / len2));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const d = (front[0] - px) ** 2 + (front[1] - py) ** 2;
    if (d < best.d) best = { d, idx: i, t };
  }
  const { idx, t } = best;
  const [x1, y1] = pts[idx];
  const [x2, y2] = pts[idx + 1];
  const out: [number, number][] = [[x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]];
  for (let i = idx + 1; i < pts.length; i++) out.push(pts[i]);
  return out;
}

/** Static protected sections: between each signal and its nearest same-direction signal on the same line. */
export function signalSections(signals: SignalLike[]): { sig: string; lineY: number; lo: number; hi: number }[] {
  return signals.map((s) => {
    const next = signals
      .filter((o) => o.dir === s.dir && o.y === s.y && o.id !== s.id && (s.dir === "left" ? o.x < s.x : o.x > s.x))
      .sort((a, b) => (s.dir === "left" ? b.x - a.x : a.x - b.x))[0];
    const farX = next ? next.x : s.dir === "right" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    return { sig: s.id, lineY: s.y, lo: Math.min(s.x, farX), hi: Math.max(s.x, farX) };
  });
}
