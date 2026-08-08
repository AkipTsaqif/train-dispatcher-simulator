// Scenario for Jatinegara (stub operating rules — first cut).

import type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export const JATINEGARA_SCENARIO: DispatchScenarioDefinition = {
  id: "jatinegara-default",
  name: "Jatinegara default",
  speed: { runKmh: 60, segmentKm: {} },
  dwell: { holdUntilScheduledDepartureByStation: { JNG: true }, minimumStopSeconds: 60 },
  priority: { commuterServiceName: "Commuter", commuterPenalty: 1e9 },
  spawn: { coincidenceWindowSeconds: 60, clearanceSignalCount: 1, clearanceFallbackSeconds: 30 },
  meet: { clearanceSignalCount: 2, clearanceFallbackSeconds: 30 },
  routing: {
    defaultLineByDirection: { right: "t1", left: "t2" },
  },
  notifications: {
    boardLimit: 40,
    heldAtSignalThresholdSeconds: 30,
    susulMeetStation: "JNG",
    departureCountdown: { station: "JNG", stopIndex: 1, firstThresholdSeconds: 30, urgentThresholdSeconds: 15 },
  },
};
