// Scenario for the 3-main fixture — includes a routing policy so the
// selection paths (explicit line, scenario policy, direction fallback) are
// each exercised by scripts/verify-three-main.ts.

import type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export const THREE_MAIN_FIXTURE_SCENARIO: DispatchScenarioDefinition = {
  id: "three-main-fixture-default",
  name: "Three-main fixture default",
  speed: { runKmh: 80, segmentKm: {} },
  dwell: { holdUntilScheduledDepartureByStation: {}, minimumStopSeconds: 0 },
  priority: { commuterServiceName: "Commuter", commuterPenalty: 1e9 },
  spawn: { coincidenceWindowSeconds: 60, clearanceSignalCount: 1, clearanceFallbackSeconds: 30 },
  meet: { clearanceSignalCount: 1, clearanceFallbackSeconds: 30 },
  routing: {
    // leftbound journeys default to M3 unless the timetable says otherwise
    defaultLineByDirection: { left: "M3" },
  },
  notifications: {
    boardLimit: 40,
    heldAtSignalThresholdSeconds: 30,
    susulMeetStation: "B",
    departureCountdown: { station: "B", stopIndex: 1, firstThresholdSeconds: 30, urgentThresholdSeconds: 15 },
  },
};
