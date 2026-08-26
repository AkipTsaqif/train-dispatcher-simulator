// Composition root for Jatinegara — REAL timetable (generated).

import { createDispatchRuntime, type DispatchDefinition } from "../lib/dispatch-runtime";
import { JATINEGARA_MAP } from "../maps/jatinegara";
import { JATINEGARA_SCENARIO } from "../scenarios/jatinegara";
import { JATINEGARA_SCHEDULE } from "./jatinegara-schedule";

export const JATINEGARA_DEFINITION: DispatchDefinition = {
  map: JATINEGARA_MAP,
  scenario: JATINEGARA_SCENARIO,
  schedule: JATINEGARA_SCHEDULE,
  enabledTrainNumbers: null,
};

export const JATINEGARA_DISPATCH = createDispatchRuntime(JATINEGARA_DEFINITION);
