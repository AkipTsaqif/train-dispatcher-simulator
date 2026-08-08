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
  meets?: { type: string; with: string }[]; // planned overtake/crossing (susul)
  line?: string; // optional main-line assignment (trackGroupId or line name)
};

export type Train = {
  train_no: string;
  name: string;
  consist: string;
  stops: TrainStop[];
};

export type ScheduleStop = {
  station: string;
  arr_actual: string;
  dep_actual: string;
  meets?: { type: string; with: string }[];
  /** Optional main-line assignment: a trackGroupId or line name. */
  line?: string;
};

export type ScheduleEntry = {
  train_no: string;
  train_name: string;
  stops: ScheduleStop[];
};

export type TrainPriorityRules = {
  commuterServiceName: string;
  commuterPenalty: number;
};

export type JourneyRules = {
  speed: {
    runKmh: number;
    segmentKm: Record<string, number>;
  };
  dwell: {
    holdUntilScheduledDepartureByStation: Record<string, boolean>;
    minimumStopSeconds: number;
  };
};

export const hmsToSeconds = (hms: string): number => {
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s;
};

/** Convert a selected timetable into the movement engine's train model. */
export const createTrains = (
  schedule: readonly ScheduleEntry[],
  enabledTrainNumbers: ReadonlySet<string> | null = null
): Train[] =>
  schedule
    .filter((train) => !enabledTrainNumbers || enabledTrainNumbers.has(train.train_no))
    .map((train) => ({
      train_no: train.train_no,
      name: train.train_name,
      consist: "eksekutif",
      stops: train.stops.map((stop) => ({
        trackmark: stop.station,
        arr: hmsToSeconds(stop.arr_actual),
        arr_actual: stop.arr_actual,
        dep: hmsToSeconds(stop.dep_actual),
        dep_actual: stop.dep_actual,
        meets: stop.meets,
        ...(stop.line === undefined ? {} : { line: stop.line }),
      })),
    }));

export const fmtHms = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

/** Origin-platform priority — lower sorts first: non-commuters ahead of
 * commuters, then the smaller train number. */
export const spawnPriority = (
  train: { train_no: string; train_name?: string; name?: string },
  rules: TrainPriorityRules
): number =>
  ((train.train_name ?? train.name ?? "") === rules.commuterServiceName ? rules.commuterPenalty : 0) +
  (parseInt(train.train_no, 10) || 0);

// ---------------------------------------------------------------------------
// Movement engine
// ---------------------------------------------------------------------------

import { bearingDot, bearingOf, type Bearing, type GNodeExit } from "./topology";
import type { LeveledPoint } from "./topology";
import { footprintsOverlap, polylinesOverlap } from "./geometry";

export type LineDir = "right" | "left";
export type Aspect = "red" | "amber" | "green";

export type GraphNodeLike = {
  x: number;
  y: number;
  sw?: number;
  exits: GNodeExit[];
};

export type SignalLike = {
  id: string;
  x: number;
  y: number;
  dir: LineDir;
  bearing: Bearing;
  ai?: boolean;
};

export type MoveCtx = {
  nodes: Record<string, GraphNodeLike>;
  signals: SignalLike[];
  switches: Record<number, "normal" | "reversed">;
  aspectOf: (id: string, selfIdx?: number) => Aspect;
  trainHalfLen: number; // half the train marker length (for stops + occupancy)
  ignoreSignals?: boolean; // placement pass: position per schedule, no red-signal stops
  meetsHold?: (st: TrainState, legs: LegPlan) => number; // absolute sim time the train must wait until at its current station (0 = none)
  /** Grade level of every movement segment, keyed `${fromId}|${toId}` (both
   *  directions) — Phase 6 occupancy/conflict suppression. Absent → level 0. */
  segmentLevels?: Record<string, number>;
};

export type TrainState = {
  x: number;
  y: number;
  dir: LineDir;
  segFrom: [number, number];
  segTo: [number, number];
  nxtNode: string | null; // node id at the end of the current segment
  incoming: string | null; // node the train arrived from (for branch logic)
  trail: { pt: [number, number]; level: number }[]; // points the center passed (bounded to body length)
  level: number; // grade level of the current segment (Phase 6)
  speed: number;
  leg: number;
  stopped: boolean;
  stopReason: "signal" | "junction" | "conflict" | null;
  stopSignalId: string | null;
  done: boolean;
  spawned: boolean; // has the train materialized at its origin yet
  originArr: number; // sim time the train appears at its origin
  approach: boolean; // journey has an off-map approach leg
  time: number; // absolute sim time the train has processed (movement + dwells)
  frontPrev: number | null; // leading-edge x before the current movement step
  passedSignals: string[]; // signals the leading edge crossed this tick
  actualArr: (number | null)[]; // actual sim time the front reached each scheduled stop
  holdSince: number | null; // sim time the current signal-hold began
  holdNotified: boolean; // a >30s hold notification was fired for this hold
  notificationId: number | null; // id of the fired notification (to resolve it)
  susulWarned: boolean; // the origin-departure susul warning was shown for this train
  idx: number; // journey index (the aspect's occupancy check skips the caller)
};

export type LegPlan = { waypointX: number; lineY: number; speed: number; departAt?: number; station?: string }[];

export type JourneyPlan = {
  originArr: number;
  approach: boolean; // has an off-map approach leg (scheduled origin time > 0)
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
  dir: LineDir,
  rules: JourneyRules
): JourneyPlan {
  const {
    speed: { runKmh, segmentKm },
    dwell: { holdUntilScheduledDepartureByStation, minimumStopSeconds },
  } = rules;
  const originX = platformX[stops[0].trackmark];
  const originArr = hmsToSeconds(stops[0].arr_actual);
  const edgeXs = Object.values(nodes).map((n) => n.x);
  const maxX = Math.max(...edgeXs); // map right edge (pre-shift coords)
  const minX = Math.min(...edgeXs); // map left edge (pre-shift coords)
  const MARGIN = 2 * 58; // ~2 cells off the map, so the train starts/ends out of frame

  // Per-leg running speed: the configured speed converted via each leg's real
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
      segmentKm[`${fromCode}-${toCode}`] ?? segmentKm[`${toCode}-${fromCode}`];
    const speed = km ? (distUnits * runKmh) / (km * 3600) : distUnits / secs;
    legInfo.push({ speed, travel: distUnits / speed });
  }
  // Expected timeline (running at the configured speed and stop policy) so
  // each dwell anchor is an absolute sim time. Departure anchor per station:
  //   • pass (arr == dep in the schedule): anchor = expected arrival (no stop)
  //   • station with switches: anchor = the scheduled departure (the early
  //     arrival is recovered there)
  //   • any other station: anchor = expected arrival + configured minimum stop
  const anchors: number[] = [];
  for (let i = 0; i < stops.length; i++) {
    const arr = i === 0 ? stops[0].arr : anchors[i - 1] + legInfo[i - 1].travel;
    const s = stops[i];
    anchors[i] =
      s.arr === s.dep
        ? arr
        : holdUntilScheduledDepartureByStation[s.trackmark]
          ? s.dep
          : arr + minimumStopSeconds;
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
      station: stops[i].trackmark,
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
    legs.unshift({ waypointX: originX, lineY, speed: Math.abs(spawnX - originX) / originArr, station: stops[0].trackmark });
  } else {
    spawnX = originX; // departs at 00:00 — no approach time, start at the platform
  }

  // Exit leg: after the final stop keep going at the last-leg speed and leave
  // the map at the far edge (the train is hidden once it gets there). The final
  // stop's configured minimum dwell anchor applies here.
  const lastSpeed = legs[legs.length - 1].speed;
  const exitX = dir === "left" ? minX - MARGIN : maxX + MARGIN;
  legs.push({ waypointX: exitX, lineY, speed: lastSpeed, departAt: anchors[stops.length - 1], station: stops[stops.length - 1].trackmark });

  // First node ahead of the (off-map) spawn — nearest junction in the travel direction.
  const first = Object.values(nodes)
    .filter((n) => n.y === lineY && (dir === "left" ? n.x < spawnX : n.x > spawnX))
    .sort((a, b) => (dir === "left" ? b.x - a.x : a.x - b.x))[0];
  const firstNode = first ? (Object.keys(nodes).find((k) => nodes[k] === first) ?? null) : null;
  // originArr = 0 → the train becomes visible immediately, approaching from off-map
  return { originArr: 0, approach: originArr > 0, start: { x: spawnX, y: lineY, dir, firstNode }, legs };
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
    trail: [],
    level: 0, // the approach leg is off-map (grade 0)
    speed,
    leg: 0,
    stopped: false,
    stopReason: null,
    stopSignalId: null,
    done: false,
    spawned: false,
    originArr: journey.originArr,
    approach: journey.approach,
    time: 0,
    frontPrev: null,
    passedSignals: [],
    actualArr: [],
    holdSince: null,
    holdNotified: false,
    notificationId: null,
    susulWarned: false,
    idx: -1,
  };
}

/**
 * Resolve the outgoing node from a junction, mirroring walkRoute's point rules.
 * The selection is bearing-based: the exit that is open per the switch state
 * and continues most nearly straight (max bearing dot with the arrival
 * bearing) among non-reversing exits. The old straight/branch behavior for the
 * horizontal case is reproduced exactly.
 */
const resolveNode = (
  nodeId: string,
  incomingBearing: Bearing,
  incoming: string | null,
  ctx: MoveCtx
): { next: string } | { blocked: true } | { offmap: true } => {
  const node = ctx.nodes[nodeId];
  if (!node) return { offmap: true };
  if (node.sw !== undefined) {
    const reversed = ctx.switches[node.sw] === "reversed";
    const branchExit = node.exits.find((exit) => exit.viaSwitchPort === "reversed");
    const branchAhead =
      branchExit !== undefined && bearingDot(incomingBearing, branchExit.bearing) > 0;
    const cameFromBranch =
      incoming !== null && branchExit !== undefined && incoming === branchExit.neighbor;
    if (cameFromBranch) {
      if (!reversed) return { blocked: true };
    } else if (branchAhead && reversed) {
      return { next: branchExit!.neighbor };
    } else if (reversed) {
      return { blocked: true };
    }
  }
  // straight-through: the open, non-reversing exit continuing most nearly straight
  const reversed = node.sw !== undefined && ctx.switches[node.sw] === "reversed";
  let best: GNodeExit | undefined;
  let bestDot = -Infinity;
  for (const exit of node.exits) {
    if (exit.viaSwitchPort === "reversed" && !reversed) continue; // branch exit is gated
    const dot = bearingDot(incomingBearing, exit.bearing);
    if (dot > 0 && dot > bestDot) {
      bestDot = dot;
      best = exit;
    }
  }
  return best ? { next: best.neighbor } : { offmap: true };
};

const segmentLevelOf = (ctx: MoveCtx, fromId: string | null, toId: string | null): number => {
  if (!fromId || !toId || !ctx.segmentLevels) return 0;
  return ctx.segmentLevels[`${fromId}|${toId}`] ?? ctx.segmentLevels[`${toId}|${fromId}`] ?? 0;
};

const setSegment = (st: TrainState, res: { next: string }, ctx: MoveCtx): void => {
  const fromId = st.nxtNode; // the node being left
  const target = ctx.nodes[res.next];
  st.segFrom = [st.x, st.y];
  st.segTo = target ? [target.x, target.y] : [st.x, st.y];
  st.nxtNode = res.next;
  st.incoming = fromId;
  st.level = segmentLevelOf(ctx, fromId, res.next);
  // trail the passed point — the center's path, bounded to the body length
  st.trail.push({ pt: [st.segFrom[0], st.segFrom[1]], level: st.level });
  trimTrail(st, ctx.trainHalfLen * 3);
};

/** Drop the oldest trail points beyond the bounded history length. */
const trimTrail = (st: TrainState, maxLen: number): void => {
  while (st.trail.length > 1) {
    let total = 0;
    for (let i = 1; i < st.trail.length; i++) {
      total += Math.hypot(
        st.trail[i].pt[0] - st.trail[i - 1].pt[0],
        st.trail[i].pt[1] - st.trail[i - 1].pt[1]
      );
    }
    if (total <= maxLen) break;
    st.trail.shift();
  }
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
      const res = resolveNode(st.nxtNode, bearingOf(st.segFrom, st.segTo), st.incoming, ctx);
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
    // scheduled dwell + meets/susul hold: the train waits at this leg's start
    // station until its scheduled departure — or until its overtaking partner
    // has cleared two signals past the station, whichever is later
    const meets = ctx.meetsHold ? ctx.meetsHold(st, legs) : 0;
    const departAt =
      leg.departAt !== undefined || meets > 0 ? Math.max(leg.departAt ?? 0, meets) : undefined;
    if (departAt !== undefined && st.time < departAt) {
      const wait = departAt - st.time;
      if (tRemaining <= wait) {
        st.time += tRemaining;
        tRemaining = 0;
        continue; // still within the dwell — stop processing this tick
      }
      st.time = departAt;
      tRemaining -= wait;
    }

    let limit: Limit | null = null;
    const near = (l: Limit) => Math.hypot(l.x - st.x, l.y - st.y);
    if (!ctx.ignoreSignals) {
      const segHorizontal = st.segFrom[1] === st.segTo[1];
      const segBearing = segHorizontal ? undefined : bearingOf(st.segFrom, st.segTo);
      const [fx, fy] = st.segFrom;
      const [tx, ty] = st.segTo;
      const dx = tx - fx;
      const dy = ty - fy;
      const segLen = Math.hypot(dx, dy) || 1;
      // signals ahead of the train's LEADING edge — a signal the front has just
      // passed is behind (even if the center still reads ahead of it) and must
      // not re-trigger a stop
      let ahead: SignalLike[];
      if (segHorizontal) {
        // horizontal fast path — identical to the pre-bearing behavior
        ahead = ctx.signals
          .filter(
            (s) =>
              s.dir === st.dir &&
              s.y === st.y &&
              !s.ai && // AI-controlled entry signals don't stop the automatic train
              (st.dir === "left"
                ? s.x < st.x - ctx.trainHalfLen
                : s.x > st.x + ctx.trainHalfLen)
          )
          .sort((a, b) => (st.dir === "left" ? b.x - a.x : a.x - b.x));
      } else {
        // projection path: a signal is ahead if it lies on the train's segment
        // (positive dot with the segment bearing) and past the leading edge
        // (parameter t along the segment)
        const len2 = dx * dx + dy * dy || 1;
        const tOf = (px: number, py: number) => ((px - fx) * dx + (py - fy) * dy) / len2;
        const tFront = tOf(st.x + (dx / segLen) * ctx.trainHalfLen, st.y + (dy / segLen) * ctx.trainHalfLen);
        ahead = ctx.signals
          .filter((s) => !s.ai && bearingDot(segBearing!, s.bearing) > 0 && tOf(s.x, s.y) > tFront)
          .sort((a, b) => tOf(b.x, b.y) - tOf(a.x, a.y));
      }
      const red = ahead.find((s) => ctx.aspectOf(s.id, st.idx) === "red");
      if (red) {
        // stop so the train's LEADING edge sits at the signal — the marker must
        // never protrude past a red signal
        if (segHorizontal) {
          const stopX = red.x - (st.dir === "left" ? -ctx.trainHalfLen : ctx.trainHalfLen);
          limit = { kind: "signal", x: stopX, y: red.y, sigId: red.id };
        } else {
          limit = {
            kind: "signal",
            x: red.x - (dx / segLen) * ctx.trainHalfLen,
            y: red.y - (dy / segLen) * ctx.trainHalfLen,
            sigId: red.id,
          };
        }
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
      // record the actual arrival at the scheduled stop this leg serves — with an
      // approach leg, leg k ends at stop k; without one, leg k ends at stop k+1
      const stopIdx = st.leg + (st.approach ? 0 : 1);
      if (stopIdx < st.actualArr.length) st.actualArr[stopIdx] = st.time;
      if (st.leg >= legs.length - 1) {
        st.done = true; // final destination reached
        return;
      }
      st.leg += 1; // pass through — next leg's speed applies to the remaining time
      continue;
    }
    // junction node
    const res = resolveNode(st.nxtNode!, bearingOf(st.segFrom, st.segTo), st.incoming, ctx);
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
      st.level = 0; // off-map exit leg
      st.trail.push({ pt: [st.segFrom[0], st.segFrom[1]], level: 0 });
      trimTrail(st, ctx.trainHalfLen * 3);
      continue;
    }
    setSegment(st, res, ctx);
  }
}

/**
 * A train's body footprint: the track polyline pieces its full length
 * (`2 * halfLen`) covers, from the FRONT (the leading edge on the current
 * segment) back through the traversed segment trail. Each piece is a straight
 * [start, end] polyline; the pieces are ordered front→rear. A body may span
 * several segments (e.g. a long train mid-crossover sits on the diagonal AND
 * the adjoining horizontals), so occupancy and conflict checks use these
 * polylines rather than an x-interval on one line.
 */
export function footprintOf(st: TrainState, halfLen: number): LeveledPoint[][] {
  const bodyLen = 2 * halfLen;
  const pieces: LeveledPoint[][] = [];
  const [fx, fy] = st.segFrom;
  const [tx, ty] = st.segTo;
  const dx = tx - fx;
  const dy = ty - fy;
  const segLen = Math.hypot(dx, dy) || 1;
  const ux = dx / segLen;
  const uy = dy / segLen;
  const front: [number, number] = [st.x + ux * halfLen, st.y + uy * halfLen];
  const currentLevel = st.level ?? 0;
  let remaining = bodyLen;
  // current segment: from the front back to its start
  const toStart = Math.hypot(st.x - fx, st.y - fy) + halfLen;
  if (toStart > 0 && segLen > 0) {
    if (remaining <= toStart) {
      pieces.push([
        [front[0], front[1], currentLevel],
        [front[0] - ux * remaining, front[1] - uy * remaining, currentLevel],
      ]);
      return pieces;
    }
    pieces.push([[front[0], front[1], currentLevel], [fx, fy, currentLevel]]);
    remaining -= toStart;
  }
  // the traversed trail, newest → oldest (the newest entry is the current
  // segment's start; the pieces continue straight back from there). The piece
  // between a (newer) and b (older) is the segment b→a — its level is b's
  // (stored when the train left that node).
  for (let i = st.trail.length - 1; i >= 1 && remaining > 0; i--) {
    const a = st.trail[i];
    const b = st.trail[i - 1];
    const d = Math.hypot(a.pt[0] - b.pt[0], a.pt[1] - b.pt[1]) || 1;
    if (remaining <= d) {
      pieces.push([
        [a.pt[0], a.pt[1], b.level],
        [
          a.pt[0] + ((b.pt[0] - a.pt[0]) / d) * remaining,
          a.pt[1] + ((b.pt[1] - a.pt[1]) / d) * remaining,
          b.level,
        ],
      ]);
      remaining = 0;
      break;
    }
    pieces.push([
      [a.pt[0], a.pt[1], b.level],
      [b.pt[0], b.pt[1], b.level],
    ]);
    remaining -= d;
  }
  return pieces;
}

/**
 * Whether two train bodies physically share track. Horizontal fast path (the
 * pre-footprint interval test — identical results on straight lines), and the
 * genuine polyline-overlap path for diagonals/curves.
 */
export function bodiesOverlap(a: TrainState, b: TrainState, halfLen: number): boolean {
  if (a.y === b.y) return Math.abs(a.x - b.x) < 2 * halfLen;
  return footprintsOverlap(footprintOf(a, halfLen), footprintOf(b, halfLen));}

/**
 * The signals whose protected sections the train's BODY currently overlaps —
 * a section is occupied from when the train's front enters it until the rear
 * leaves, so the signal behind stays red while the tail passes.
 * Returns the comma-joined ids ("" when nothing is occupied).
 */
export function occupiedSections(
  m: TrainState,
  sections: {
    sig: string;
    lineY: number;
    lo: number;
    hi: number;
    pts?: LeveledPoint[];
  }[],
  halfLen: number
): string {
  if (!m.spawned || m.done) return "";
  const footprint = footprintOf(m, halfLen);
  const allHorizontal = footprint.every(([a, b]) => a[1] === b[1]);
  if (allHorizontal && footprint.length > 0) {
    // horizontal fast path — identical to the pre-footprint x-interval test
    const y = footprint[0][0][1];
    const lo = Math.min(...footprint.map((p) => Math.min(p[0][0], p[1][0])));
    const hi = Math.max(...footprint.map((p) => Math.max(p[0][0], p[1][0])));
    return sections
      .filter((s) => s.lineY === y && lo < s.hi && hi > s.lo)
      .map((s) => s.sig)
      .join(",");
  }
  return sections
    .filter((s) => {
      const sectionPts =
        s.pts && s.pts.length >= 2
          ? s.pts
          : ([
              [s.lo, s.lineY],
              [s.hi, s.lineY],
            ] as [number, number][]);
      return polylinesOverlap(footprint, sectionPts);
    })
    .map((s) => s.sig)
    .join(",");
}

/**
 * The portion of a reservation route still ahead of the train using it — the
 * cells the train has passed return to normal, the unpassed ones stay lit.
 */
export function reservationAhead(
  pts: LeveledPoint[],
  fronts: { lineY: number; front: number }[]
): LeveledPoint[] | null {
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
  const out: LeveledPoint[] = [[x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]];
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
