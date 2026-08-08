// Scenario for the flyover fixture (Phase 6).

import type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export const FLYOVER_FIXTURE_SCENARIO: DispatchScenarioDefinition = {
  id: "flyover-fixture-default",
  name: "Flyover fixture default",
  speed: { runKmh: 80, segmentKm: {} },
  dwell: { holdUntilScheduledDepartureByStation: {}, minimumStopSeconds: 0 },
  priority: { commuterServiceName: "Commuter", commuterPenalty: 1e9 },
  spawn: { coincidenceWindowSeconds: 60, clearanceSignalCount: 1, clearanceFallbackSeconds: 30 },
  meet: { clearanceSignalCount: 1, clearanceFallbackSeconds: 30 },
  notifications: {
    boardLimit: 40,
    heldAtSignalThresholdSeconds: 30,
    susulMeetStation: "B",
    departureCountdown: { station: "B", stopIndex: 1, firstThresholdSeconds: 30, urgentThresholdSeconds: 15 },
  },
};
