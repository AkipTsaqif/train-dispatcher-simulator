import { BEKASI_TAMBUN_CIBITUNG_DEFINITION } from "../dispatching/bekasi-tambun-cibitung";
import {
  buildJourney as buildJourneyWithRules,
  createTrains,
  spawnPriority as spawnPriorityWithRules,
  type GraphNodeLike,
  type JourneyPlan,
  type LineDir,
  type TrainStop,
} from "./train-engine";

export {
  advanceTrain,
  createTrains,
  fmtHms,
  hmsToSeconds,
  initTrain,
  occupiedSections,
  reservationAhead,
  signalSections,
} from "./train-engine";
export type {
  Aspect,
  GraphNodeLike,
  JourneyPlan,
  JourneyRules,
  LegPlan,
  LineDir,
  MoveCtx,
  ScheduleEntry,
  ScheduleStop,
  SignalLike,
  Train,
  TrainPriorityRules,
  TrainState,
  TrainStop,
} from "./train-engine";

const { scenario, schedule, enabledTrainNumbers } =
  BEKASI_TAMBUN_CIBITUNG_DEFINITION;

export const RUN_SPEED_KMH = scenario.speed.runKmh;
export const SEGMENT_KM = scenario.speed.segmentKm;

export const TRAINS = createTrains(schedule, enabledTrainNumbers ?? null);

/** Legacy selected-scenario priority adapter. Generic callers use train-engine. */
export const spawnPriority = (train: {
  train_no: string;
  train_name?: string;
  name?: string;
}): number => spawnPriorityWithRules(train, scenario.priority);

/** Legacy selected-scenario journey adapter. Generic callers use train-engine. */
export function buildJourney(
  stops: TrainStop[],
  platformX: Record<string, number>,
  lineY: number,
  nodes: Record<string, GraphNodeLike>,
  dir: LineDir
): JourneyPlan {
  return buildJourneyWithRules(stops, platformX, lineY, nodes, dir, {
    speed: scenario.speed,
    dwell: scenario.dwell,
  });
}
