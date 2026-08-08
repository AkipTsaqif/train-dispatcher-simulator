// Composition root for the ladder fixture.

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { LADDER_FIXTURE_MAP } from "../maps/ladder-fixture";
import { LADDER_FIXTURE_SCENARIO } from "../scenarios/ladder-fixture";
import type { ScheduleEntry } from "../lib/train-engine";

const SCHEDULE: ScheduleEntry[] = [
  { train_no: "T1", train_name: "Fixture 1", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00" },
    { station: "B", arr_actual: "00:30:00", dep_actual: "00:30:00" },
  ]},
];

export const LADDER_FIXTURE_DEFINITION: DispatchDefinition = {
  map: LADDER_FIXTURE_MAP,
  scenario: LADDER_FIXTURE_SCENARIO,
  schedule: SCHEDULE,
  enabledTrainNumbers: null,
};

export const LADDER_FIXTURE_DISPATCH = createDispatchRuntime(
  LADDER_FIXTURE_DEFINITION
);
