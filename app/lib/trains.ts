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

// Fixed running speed between stations (real km/h) — faster than the schedule's
// implied speed, so trains arrive early and recover the reserve at stations
// (they still depart on the scheduled departure time).
const RUN_SPEED_KMH = 80;
// Real distances between adjacent stations (km), used to convert RUN_SPEED_KMH
// into map-units/second per leg (the map is schematic, so each leg converts
// via its own real length). Unknown pairs fall back to the schedule speed.
const SEGMENT_KM: Record<string, number> = {
  "BKST-TB": 4.4,
  "TB-CIT": 3.3,
};
// Station stop policy: passing trains (schedule arr == dep) run through; a
// station with switches can hold a train off the main line until its scheduled
// departure (the early 80 km/h arrival becomes recovery time there); every
// other station stops for a fixed dwell.
const SWITCH_HOLD_STATIONS: Record<string, boolean> = { TB: true };
const MIN_STOP_SECS = 30;

import scheduleData from "../../data/schedule.json";

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

export const hmsToSeconds = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

/** Trains are loaded from data/schedule.json; a few are enabled for testing. */
const ENABLED_TRAINS = new Set(["107B", "6082B", "30A", "2523"]);
type ScheduleStop = { station: string; arr_actual: string; dep_actual: string };
type ScheduleEntry = { train_no: string; train_name: string; stops: ScheduleStop[] };

export const TRAINS: Train[] = (scheduleData as ScheduleEntry[])
  .filter((t) => ENABLED_TRAINS.has(t.train_no))
  .map((t) => ({
    train_no: t.train_no,
    name: t.train_name,
    consist: "eksekutif",
    stops: t.stops.map((s) => ({
      trackmark: s.station,
      arr: hmsToSeconds(s.arr_actual),
      arr_actual: s.arr_actual,
      dep: hmsToSeconds(s.dep_actual),
      dep_actual: s.dep_actual,
    })),
  }));

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

export type SignalLike = { id: string; x: number; y: number; dir: LineDir; ai?: boolean };

export type MoveCtx = {
  nodes: Record<string, GraphNodeLike>;
  signals: SignalLike[];
  switches: Record<number, "normal" | "reversed">;
  aspectOf: (id: string, selfIdx?: number) => Aspect;
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
  stopReason: "signal" | "junction" | "conflict" | null;
  stopSignalId: string | null;
  done: boolean;
  spawned: boolean; // has the train materialized at its origin yet
  originArr: number; // sim time the train appears at its origin
  time: number; // absolute sim time the train has processed (movement + dwells)
  frontPrev: number | null; // leading-edge x before the current movement step
  passedSignals: string[]; // signals the leading edge crossed this tick
  idx: number; // journey index (the aspect's occupancy check skips the caller)
};

export type LegPlan = { waypointX: number; lineY: number; speed: number; departAt?: number }[];

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
  const originArr = hmsToSeconds(stops[0].arr_actual);
  const edgeXs = Object.values(nodes).map((n) => n.x);
  const maxX = Math.max(...edgeXs); // map right edge (pre-shift coords)
  const minX = Math.min(...edgeXs); // map left edge (pre-shift coords)
  const MARGIN = 2 * 58; // ~2 cells off the map, so the train starts/ends out of frame

  // Per-leg running speed: fixed RUN_SPEED_KMH converted via each leg's real
  // km (the map is schematic, so the same real speed maps to different
  // units/second per leg). Unknown station pairs fall back to the schedule
  // derived speed.
  const legInfo: { speed: number; travel: number }[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const fromCode = stops[i].trackmark;
    const toCode = stops[i + 1].trackmark;
    const from = platformX[fromCode];
    const to = platformX[toCode];
    const secs = stops[i + 1].arr - stops[i].dep; // scheduled travel time between stops
    const distUnits = Math.abs(to - from); // platform spacing in map units
    const km =
      SEGMENT_KM[`${fromCode}-${toCode}`] ?? SEGMENT_KM[`${toCode}-${fromCode}`];
    const speed = km ? (distUnits * RUN_SPEED_KMH) / (km * 3600) : distUnits / secs;
    legInfo.push({ speed, travel: distUnits / speed });
  }
  // Expected timeline (running at RUN_SPEED_KMH with the stop policy below) so
  // each dwell anchor is an absolute sim time. Departure anchor per station:
  //   • pass (arr == dep in the schedule): anchor = expected arrival (no stop)
  //   • station with switches: anchor = the scheduled departure (the early
  //     arrival is recovered there)
  //   • any other station: anchor = expected arrival + MIN_STOP_SECS
  const anchors: number[] = [];
  for (let i = 0; i < stops.length; i++) {
    const arr = i === 0 ? stops[0].arr : anchors[i - 1] + legInfo[i - 1].travel;
    const s = stops[i];
    anchors[i] =
      s.arr === s.dep ? arr : SWITCH_HOLD_STATIONS[s.trackmark] ? s.dep : arr + MIN_STOP_SECS;
  }

  const legs: LegPlan = [];
  for (let i = 0; i < stops.length - 1; i++) {
    legs.push({
      waypointX: platformX[stops[i + 1].trackmark],
      lineY,
      speed: legInfo[i].speed,
      // the dwell at this leg's start station ends at the anchor (for a pass
      // the train arrives at the anchor, so it does not wait)
      departAt: anchors[i],
    });
  }

  // Approach leg: the train enters from off the map and arrives at its origin
  // platform at the scheduled origin time. Prefer continuing at the first-leg
  // speed (smooth approach); clamp so the spawn is always beyond the map edge.
  let spawnX: number;
  if (originArr > 0) {
    const firstSpeed = legs[0]?.speed ?? 0;
    const rawSpawn = dir === "left" ? originX + firstSpeed * originArr : originX - firstSpeed * originArr;
    spawnX = dir === "left" ? Math.max(rawSpawn, maxX + MARGIN) : Math.min(rawSpawn, minX - MARGIN);
    legs.unshift({ waypointX: originX, lineY, speed: Math.abs(spawnX - originX) / originArr });
  } else {
    spawnX = originX; // departs at 00:00 — no approach time, start at the platform
  }

  // Exit leg: after the final stop keep going at the last-leg speed and leave
  // the map at the far edge (the train is hidden once it gets there). The final
  // stop's dwell anchor applies here (e.g. 30 s at a non-switch terminus).
  const lastSpeed = legs[legs.length - 1].speed;
  const exitX = dir === "left" ? minX - MARGIN : maxX + MARGIN;
  legs.push({ waypointX: exitX, lineY, speed: lastSpeed, departAt: anchors[stops.length - 1] });

  // First node ahead of the (off-map) spawn — nearest junction in the travel direction.
  const first = Object.values(nodes)
    .filter((n) => n.y === lineY && (dir === "left" ? n.x < spawnX : n.x > spawnX))
    .sort((a, b) => (dir === "left" ? b.x - a.x : a.x - b.x))[0];
  const firstNode = first ? (Object.keys(nodes).find((k) => nodes[k] === first) ?? null) : null;
  // originArr = 0 → the train becomes visible immediately, approaching from off-map
  return { originArr: 0, start: { x: spawnX, y: lineY, dir, firstNode }, legs };
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
    time: 0,
    frontPrev: null,
    passedSignals: [],
    idx: -1,
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
      if (ctx.aspectOf(st.stopSignalId, st.idx) !== "red") {
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
    } else if (st.stopReason === "conflict") {
      // a collision stop — the tick loop releases it once the overlapping
      // train has moved on or despawned
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
    // scheduled dwell: the train waits at this leg's start station until the
    // departure time (absolute sim clock) — no movement, but time passes
    if (leg.departAt !== undefined && st.time < leg.departAt) {
      const wait = leg.departAt - st.time;
      if (tRemaining <= wait) {
        st.time += tRemaining;
        tRemaining = 0;
        continue; // still within the dwell — stop processing this tick
      }
      st.time = leg.departAt;
      tRemaining -= wait;
    }

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
          !s.ai && // AI-controlled entry signals don't stop the automatic train
          (st.dir === "left" ? s.x < st.x - ctx.trainHalfLen : s.x > st.x + ctx.trainHalfLen)
        )
        .sort((a, b) => (st.dir === "left" ? b.x - a.x : a.x - b.x));
      const red = ahead.find((s) => ctx.aspectOf(s.id, st.idx) === "red");
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
    // Waypoint stop: the train stops at the station's column x on WHATEVER
    // track it currently runs on — a train diverted onto a loop or siding at
    // the station must still dwell there (the stop x comes from the schedule's
    // platform column; the y is the train's current line). Only a waypoint
    // AHEAD of the train counts — after a divert the leg can lag behind (the
    // diverted-away stations were skipped), and a behind waypoint must never
    // pull the train backward.
    const ahead = st.dir === "right" ? leg.waypointX > st.x : leg.waypointX < st.x;
    if (ahead) {
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
        // `>=` on the low end so a train released from a stop exactly AT the
        // signal (front == signal x) re-detects the pass and consumes a clear
        // set while it was standing there — otherwise the signal would stay
        // lit like an automatic block signal
        if (s.x >= lo && s.x <= hi && !st.passedSignals.includes(s.id)) st.passedSignals.push(s.id);
      }
    };

    if (!limit) {
      move(leg.speed * tRemaining);
      st.time += tRemaining;
      checkPass();
      tRemaining = 0;
      continue;
    }
    const tToLimit = near(limit) / leg.speed;
    if (tRemaining < tToLimit) {
      move(leg.speed * tRemaining);
      st.time += tRemaining;
      checkPass();
      tRemaining = 0;
      continue;
    }
    tRemaining -= tToLimit;
    st.time += tToLimit;
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
      // Track ran out at the map edge — jump to the EXIT leg (the schedule legs
      // may be stale after a divert) and keep going straight off the map to its
      // waypoint, which is always beyond the frame in the travel direction.
      st.leg = legs.length - 1;
      st.segFrom = [st.x, st.y];
      st.segTo = [legs[st.leg].waypointX, st.y];
      st.nxtNode = null;
      continue;
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
