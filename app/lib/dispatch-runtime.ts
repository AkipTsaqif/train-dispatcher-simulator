import { bearingDot, type Bearing, type Dir } from "./topology";
import type { DispatchMapDefinition } from "./dispatch-map";
import type { DispatchScenarioDefinition } from "./dispatch-scenario";
import {
  buildJourney,
  createTrains,
  fmtHms,
  spawnPriority,
  type JourneyPlan,
  type ScheduleEntry,
  type Train,
} from "./train-engine";

export type PlannedJourney = { train: Train; plan: JourneyPlan };
export type SignalSection = { sig: string; lineY: number; lo: number; hi: number };
export type MeetDependency = { partnerIdx: number; meetStopIdx: number; releaseOffset: number };

export type DispatchDefinition = {
  map: DispatchMapDefinition;
  scenario: DispatchScenarioDefinition;
  schedule: readonly ScheduleEntry[];
  enabledTrainNumbers?: ReadonlySet<string> | null;
};

type JourneyPreparationMap = Pick<
  DispatchMapDefinition,
  "stations" | "lines" | "signals" | "nodes"
>;

type JourneyPreparationScenario = Pick<
  DispatchScenarioDefinition,
  "speed" | "dwell" | "priority" | "spawn" | "routing" | "trackSpeeds"
>;

type MeetPreparationMap = Pick<
  DispatchMapDefinition,
  "stations" | "lines" | "signals"
>;

export type DispatchRuntime = {
  map: DispatchMapDefinition;
  scenario: DispatchScenarioDefinition;
  notificationPolicy: DispatchScenarioDefinition["notifications"];
  trains: Train[];
  journeys: PlannedJourney[];
  signalSections: SignalSection[];
  meetsByTrain: Map<number, Map<string, MeetDependency[]>>;
  movement: DispatchMapDefinition["compatibility"]["movement"] & {
    trainHalfLen: number;
  };
};

const journeyDir = (
  stops: Train["stops"],
  platformX: Record<string, number>
): Dir =>
  platformX[stops[stops.length - 1].trackmark] > platformX[stops[0].trackmark]
    ? "right"
    : "left";

/**
 * Select the main line a journey runs on. Total and deterministic — every
 * train gets a line. Precedence: explicit timetable `line` on a stop, then the
 * scenario routing policy, then the direction fallback (the main whose normal
 * bearing most matches the journey direction — with two mains this is exactly
 * the historical top/bottom choice).
 */
const selectMainLine = (
  stops: Train["stops"],
  map: Pick<JourneyPreparationMap, "stations" | "lines">,
  scenario: Pick<JourneyPreparationScenario, "routing">
): { trackGroupId: string; lineY: number } => {
  const resolve = (key: string): { trackGroupId: string; lineY: number } => {
    const byId = map.lines.mains.find((main) => main.trackGroupId === key);
    if (byId) return { trackGroupId: byId.trackGroupId, lineY: byId.lineY };
    const byName = map.lines.mains.find((main) => main.name === key);
    if (byName) return { trackGroupId: byName.trackGroupId, lineY: byName.lineY };
    throw new Error(`Unknown main line "${key}"`);
  };

  const explicit = stops.find((stop) => stop.line !== undefined)?.line;
  if (explicit) return resolve(explicit);

  const dir = journeyDir(stops, map.stations.platformCenterX);
  const policy = scenario.routing?.defaultLineByDirection?.[dir];
  if (policy) return resolve(policy);

  const directionBearing: Bearing =
    dir === "right" ? { dx: 1, dy: 0 } : { dx: -1, dy: 0 };
  let best: { trackGroupId: string; lineY: number } | undefined;
  let bestDot = -Infinity;
  for (const main of map.lines.mains) {
    const dot = bearingDot(directionBearing, main.normalBearing);
    if (dot > bestDot) {
      bestDot = dot;
      best = { trackGroupId: main.trackGroupId, lineY: main.lineY };
    }
  }
  if (!best) throw new Error("No main line available");
  return best;
};

const firstLegSpeed = (
  stops: Train["stops"],
  map: Pick<JourneyPreparationMap, "stations">,
  speed: DispatchScenarioDefinition["speed"]
): number => {
  const platformX = map.stations.platformCenterX;
  const from = platformX[stops[0].trackmark];
  const to = platformX[stops[1].trackmark];
  const km =
    speed.segmentKm[`${stops[0].trackmark}-${stops[1].trackmark}`] ??
    speed.segmentKm[`${stops[1].trackmark}-${stops[0].trackmark}`];
  const distUnits = Math.abs(to - from);
  return Math.max(
    speed.minUnitsPerSecond ?? 0,
    km ? (distUnits * speed.runKmh) / (km * 3600) : distUnits / Math.max(1, stops[1].arr - stops[0].dep)
  );
};

const spawnClearanceGap = (
  station: string,
  stops: Train["stops"],
  dir: Dir,
  map: Pick<JourneyPreparationMap, "stations" | "lines" | "signals">,
  scenario: Pick<JourneyPreparationScenario, "speed" | "spawn" | "routing">
): number => {
  const lineY = selectMainLine(stops, map, scenario).lineY;
  const platformX = map.stations.platformCenterX[station];
  const ahead = map.signals.items
    .filter(
      (signal) =>
        signal.lineY === lineY &&
        signal.dir === dir &&
        (dir === "right" ? signal.x > platformX : signal.x < platformX)
    )
    .sort((a, b) => (dir === "right" ? a.x - b.x : b.x - a.x));
  const clearanceSignal = ahead[scenario.spawn.clearanceSignalCount - 1];
  if (!clearanceSignal) return scenario.spawn.clearanceFallbackSeconds;
  return (
    Math.abs(clearanceSignal.x - platformX) /
    Math.max(1, firstLegSpeed(stops, map, scenario.speed))
  );
};

const prepareJourneys = (
  trains: Train[],
  map: JourneyPreparationMap,
  scenario: JourneyPreparationScenario
): PlannedJourney[] => {
  const platformX = map.stations.platformCenterX;
  const byStation: Record<string, Train[]> = {};

  for (const train of trains) {
    const station = train.stops[0].trackmark;
    if (!byStation[station]) byStation[station] = [];
    byStation[station].push(train);
  }

  for (const list of Object.values(byStation)) {
    const dir = journeyDir(list[0].stops, platformX);
    const gap = spawnClearanceGap(
      list[0].stops[0].trackmark,
      list[0].stops,
      dir,
      map,
      scenario
    );
    list.sort((a, b) => a.stops[0].arr - b.stops[0].arr);

    let i = 0;
    while (i < list.length) {
      const clusterStart = list[i].stops[0].arr;
      let j = i;
      while (
        j + 1 < list.length &&
        list[j + 1].stops[0].arr <=
          clusterStart + scenario.spawn.coincidenceWindowSeconds
      ) {
        j++;
      }
      if (j > i) {
        const cluster = list
          .slice(i, j + 1)
          .sort(
            (a, b) =>
              spawnPriority(a, scenario.priority) -
              spawnPriority(b, scenario.priority)
          );
        list.splice(i, j - i + 1, ...cluster);
      }
      i = j + 1;
    }

    let clearAt = -Infinity;
    for (const train of list) {
      const origin = train.stops[0];
      if (origin.arr < clearAt) {
        origin.arr = Math.round(clearAt);
        origin.arr_actual = fmtHms(origin.arr);
        origin.dep = Math.max(origin.dep, origin.arr);
        origin.dep_actual = fmtHms(origin.dep);
      }
      clearAt = Math.max(origin.dep, origin.arr) + gap;
    }
  }

  return trains.map((train) => {
    const line = selectMainLine(train.stops, map, scenario);
    // entryLine: the approach may spawn on a DIFFERENT line (e.g. enter on
    // t6 and cross onto the journey's t5 through the throat). Resolve it the
    // same way selectMainLine resolves an explicit `line`.
    const entryLineId = train.stops.find((stop) => stop.entryLine !== undefined)
      ?.entryLine;
    const entryMain = entryLineId
      ? map.lines.mains.find(
          (main) => main.trackGroupId === entryLineId || main.name === entryLineId
        )
      : undefined;
    if (entryLineId && !entryMain)
      throw new Error(`Unknown entry line "${entryLineId}"`);
    // multi-length platforms: resolve each stop's X on the journey's own line
    const stopXFor = (code: string): number =>
      map.stations.stopXsByTrack?.[code]?.[line.trackGroupId] ??
      platformX[code];
    return {
      train,
      plan: buildJourney(
        train.stops,
        platformX,
        line.lineY,
        map.nodes,
        journeyDir(train.stops, platformX),
        { speed: scenario.speed, dwell: scenario.dwell, spawn: { atTrackEdge: scenario.spawn.atTrackEdge === true }, trackSpeeds: scenario.trackSpeeds },
        stopXFor,
        entryMain?.lineY
      ),
    };
  });
};

const prepareMeetDependencies = (
  journeys: PlannedJourney[],
  map: MeetPreparationMap,
  scenario: DispatchScenarioDefinition
): Map<number, Map<string, MeetDependency[]>> => {
  const out = new Map<number, Map<string, MeetDependency[]>>();
  const platformCenterX = map.stations.platformCenterX;

  journeys.forEach((journey, trainIdx) => {
    journey.train.stops.forEach((stop) => {
      if (!stop.meets?.length) return;
      const dependencies: MeetDependency[] = [];
      for (const plannedMeet of stop.meets) {
        const partnerIdx = journeys.findIndex(
          (other) => other.train.train_no === plannedMeet.with
        );
        if (partnerIdx < 0) continue;
        const partner = journeys[partnerIdx];
        const partnerStopIdx = partner.train.stops.findIndex(
          (otherStop) => otherStop.trackmark === stop.trackmark
        );
        if (partnerStopIdx < 0) continue;
        const platformX = platformCenterX[stop.trackmark];
        const partnerDir = journeyDir(partner.train.stops, platformCenterX);
        const partnerLineY = selectMainLine(partner.train.stops, map, scenario).lineY;
        const ahead = map.signals.items
          .filter(
            (signal) =>
              signal.lineY === partnerLineY &&
              signal.dir === partnerDir &&
              (partnerDir === "right"
                ? signal.x > platformX
                : signal.x < platformX)
          )
          .sort((a, b) =>
            partnerDir === "right" ? a.x - b.x : b.x - a.x
          );
        const clearanceSignal = ahead[scenario.meet.clearanceSignalCount - 1];
        const speed =
          partner.plan.legs[
            Math.min(partnerStopIdx, partner.plan.legs.length - 1)
          ]?.speed ?? 1;
        dependencies.push({
          partnerIdx,
          meetStopIdx: partnerStopIdx,
          releaseOffset: clearanceSignal
            ? Math.abs(clearanceSignal.x - platformX) / Math.max(1, speed)
            : scenario.meet.clearanceFallbackSeconds,
        });
      }
      if (dependencies.length) {
        let byStation = out.get(trainIdx);
        if (!byStation) {
          byStation = new Map();
          out.set(trainIdx, byStation);
        }
        byStation.set(stop.trackmark, dependencies);
      }
    });
  });

  return out;
};

export const createDispatchRuntime = (
  definition: DispatchDefinition
): DispatchRuntime => {
  const trains = createTrains(
    definition.schedule,
    definition.enabledTrainNumbers ?? null
  );
  const journeys = prepareJourneys(
    trains,
    definition.map,
    definition.scenario
  );

  return {
    map: definition.map,
    scenario: definition.scenario,
    notificationPolicy: definition.scenario.notifications,
    trains,
    journeys,
    signalSections: definition.map.compatibility.signalSections,
    meetsByTrain: prepareMeetDependencies(
      journeys,
      definition.map,
      definition.scenario
    ),
    movement: {
      ...definition.map.compatibility.movement,
      trainHalfLen: definition.map.grid.cellSize,
    },
  };
};
