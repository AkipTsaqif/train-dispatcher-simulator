// Composition root for the loops fixture — a single A→B train on the main.

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { LOOPS_FIXTURE_MAP } from "../maps/loops-fixture";
import { LOOPS_FIXTURE_SCENARIO } from "../scenarios/loops-fixture";
import type { ScheduleEntry } from "../lib/train-engine";

const SCHEDULE: ScheduleEntry[] = [
  { train_no: "T1", train_name: "Fixture 1", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00" },
    { station: "B", arr_actual: "00:30:00", dep_actual: "00:30:00" },
  ]},
];

export const LOOPS_FIXTURE_DEFINITION: DispatchDefinition = {
  map: LOOPS_FIXTURE_MAP,
  scenario: LOOPS_FIXTURE_SCENARIO,
  schedule: SCHEDULE,
  enabledTrainNumbers: null,
};

export const LOOPS_FIXTURE_DISPATCH = createDispatchRuntime(
  LOOPS_FIXTURE_DEFINITION
);
