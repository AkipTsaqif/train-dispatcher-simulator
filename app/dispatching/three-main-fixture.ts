// Composition root for the 3-main fixture — a toy timetable of five trains:
//   T1 A→B on M1 (explicit), T2 B→A on M2 (explicit), T3 A→B on M3 (explicit),
//   T4 B→A no line (scenario policy → M3), T5 A→B no line (fallback → M2).
// Not wired into the UI; verified by scripts/verify-three-main.ts.

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { THREE_MAIN_FIXTURE_MAP } from "../maps/three-main-fixture";
import { THREE_MAIN_FIXTURE_SCENARIO } from "../scenarios/three-main-fixture";
import type { ScheduleEntry } from "../lib/train-engine";

const SCHEDULE: ScheduleEntry[] = [
  { train_no: "T1", train_name: "Fixture 1", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00", line: "M1" },
    { station: "B", arr_actual: "00:20:00", dep_actual: "00:20:00" },
  ]},
  { train_no: "T2", train_name: "Fixture 2", stops: [
    { station: "B", arr_actual: "00:00:00", dep_actual: "00:00:00", line: "M2" },
    { station: "A", arr_actual: "00:20:00", dep_actual: "00:20:00" },
  ]},
  { train_no: "T3", train_name: "Fixture 3", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00", line: "M3" },
    { station: "B", arr_actual: "00:20:00", dep_actual: "00:20:00" },
  ]},
  { train_no: "T4", train_name: "Fixture 4", stops: [
    { station: "B", arr_actual: "00:00:00", dep_actual: "00:00:00" },
    { station: "A", arr_actual: "00:20:00", dep_actual: "00:20:00" },
  ]},
  { train_no: "T5", train_name: "Fixture 5", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00" },
    { station: "B", arr_actual: "00:20:00", dep_actual: "00:20:00" },
  ]},
];

export const THREE_MAIN_FIXTURE_DEFINITION: DispatchDefinition = {
  map: THREE_MAIN_FIXTURE_MAP,
  scenario: THREE_MAIN_FIXTURE_SCENARIO,
  schedule: SCHEDULE,
  enabledTrainNumbers: null,
};

export const THREE_MAIN_FIXTURE_DISPATCH = createDispatchRuntime(
  THREE_MAIN_FIXTURE_DEFINITION
);
