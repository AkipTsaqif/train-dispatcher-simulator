import type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

// Re-export the shared contract so existing import sites keep working.
export type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export const BEKASI_TAMBUN_CIBITUNG_SCENARIO: DispatchScenarioDefinition = {
  id: "bekasi-tambun-cibitung-default",
  name: "Bekasi Timur–Tambun–Cibitung default timetable",
  speed: {
    runKmh: 80,
    segmentKm: {
      "BKST-TB": 4.4,
      "TB-CIT": 3.3,
    },
  },
  dwell: {
    holdUntilScheduledDepartureByStation: { TB: true },
    minimumStopSeconds: 30,
  },
  priority: {
    commuterServiceName: "Commuter Line Cikarang",
    commuterPenalty: 1e9,
  },
  spawn: {
    coincidenceWindowSeconds: 60,
    clearanceSignalCount: 2,
    clearanceFallbackSeconds: 30,
  },
  meet: {
    clearanceSignalCount: 2,
    clearanceFallbackSeconds: 30,
  },
  notifications: {
    boardLimit: 40,
    heldAtSignalThresholdSeconds: 30,
    susulMeetStation: "TB",
    departureCountdown: {
      station: "TB",
      stopIndex: 1,
      firstThresholdSeconds: 30,
      urgentThresholdSeconds: 15,
    },
  },
};
