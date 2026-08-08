// Composition root for Jatinegara (stub timetable — real schedule to come).

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { JATINEGARA_MAP } from "../maps/jatinegara";
import { JATINEGARA_SCENARIO } from "../scenarios/jatinegara";
import type { ScheduleEntry } from "../lib/train-engine";

// Stub: one eastbound train on the t1 main, one westbound on the t2 main,
// one bidirectional move on t6 (wrong-way vs its normal flow — line explicit).
const SCHEDULE: ScheduleEntry[] = [
  {
    train_no: "J201", train_name: "Cakung 201",
    stops: [
      { station: "JNG-W", arr_actual: "06:00:00", dep_actual: "06:00:00" },
      { station: "JNG", arr_actual: "06:08:00", dep_actual: "06:10:00", line: "t1" },
      { station: "JNG-E", arr_actual: "06:20:00", dep_actual: "06:20:00" },
    ],
  },
  {
    train_no: "J102", train_name: "Bekasi 102",
    stops: [
      { station: "JNG-E", arr_actual: "06:00:00", dep_actual: "06:00:00" },
      { station: "JNG", arr_actual: "06:08:00", dep_actual: "06:10:00", line: "t2" },
      { station: "JNG-W", arr_actual: "06:20:00", dep_actual: "06:20:00" },
    ],
  },
  {
    train_no: "J310", train_name: "Pasar Senen 310",
    stops: [
      { station: "JNG-W", arr_actual: "06:05:00", dep_actual: "06:05:00" },
      { station: "JNG", arr_actual: "06:13:00", dep_actual: "06:15:00", line: "t6" },
      { station: "JNG-E", arr_actual: "06:25:00", dep_actual: "06:25:00" },
    ],
  },
  {
    // a stub-track train: platform 5 (y=368) ends at a throat junction — the
    // journey stays within t5's drawn extent (344..520)
    train_no: "J410", train_name: "Rajawali 410",
    stops: [
      { station: "JNG-E", arr_actual: "06:02:00", dep_actual: "06:02:00" },
      { station: "JNG", arr_actual: "06:10:00", dep_actual: "06:12:00", line: "t5" },
      { station: "JNG-W", arr_actual: "06:20:00", dep_actual: "06:20:00" },
    ],
  },
];

export const JATINEGARA_DEFINITION: DispatchDefinition = {
  map: JATINEGARA_MAP,
  scenario: JATINEGARA_SCENARIO,
  schedule: SCHEDULE,
  enabledTrainNumbers: null,
};

export const JATINEGARA_DISPATCH = createDispatchRuntime(JATINEGARA_DEFINITION);
