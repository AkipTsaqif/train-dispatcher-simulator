// Composition root for the flyover fixture (Phase 6).

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { FLYOVER_FIXTURE_MAP } from "../maps/flyover-fixture";
import { FLYOVER_FIXTURE_SCENARIO } from "../scenarios/flyover-fixture";
import type { ScheduleEntry } from "../lib/train-engine";

const SCHEDULE: ScheduleEntry[] = [
  { train_no: "F1", train_name: "Fixture 1", stops: [
    { station: "A", arr_actual: "00:00:00", dep_actual: "00:00:00" },
    { station: "B", arr_actual: "00:30:00", dep_actual: "00:30:00" },
  ]},
];

export const FLYOVER_FIXTURE_DEFINITION: DispatchDefinition = {
  map: FLYOVER_FIXTURE_MAP,
  scenario: FLYOVER_FIXTURE_SCENARIO,
  schedule: SCHEDULE,
  enabledTrainNumbers: null,
};

export const FLYOVER_FIXTURE_DISPATCH = createDispatchRuntime(
  FLYOVER_FIXTURE_DEFINITION
);
