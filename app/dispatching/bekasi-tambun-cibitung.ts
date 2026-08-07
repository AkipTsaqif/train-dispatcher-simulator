import scheduleData from "../../data/schedule.json";
import {
  createDispatchRuntime,
  type DispatchDefinition,
} from "../lib/dispatch-runtime";
import type { ScheduleEntry } from "../lib/train-engine";
import { BEKASI_TAMBUN_CIBITUNG_MAP } from "../maps/bekasi-tambun-cibitung";
import { BEKASI_TAMBUN_CIBITUNG_SCENARIO } from "../scenarios/bekasi-tambun-cibitung";

const enabledTrainNumbers = process.env.NEXT_PUBLIC_ENABLED_TRAINS
  ? new Set(process.env.NEXT_PUBLIC_ENABLED_TRAINS.split(","))
  : null;

export const BEKASI_TAMBUN_CIBITUNG_DEFINITION: DispatchDefinition = {
  map: BEKASI_TAMBUN_CIBITUNG_MAP,
  scenario: BEKASI_TAMBUN_CIBITUNG_SCENARIO,
  schedule: scheduleData as ScheduleEntry[],
  enabledTrainNumbers,
};

export const BEKASI_TAMBUN_CIBITUNG_DISPATCH = createDispatchRuntime(
  BEKASI_TAMBUN_CIBITUNG_DEFINITION
);
