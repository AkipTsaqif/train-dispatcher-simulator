// Scenario for Jatinegara (stub operating rules — first cut).

import type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export type { DispatchScenarioDefinition } from "../lib/dispatch-scenario";

export const JATINEGARA_SCENARIO: DispatchScenarioDefinition = {
  id: "jatinegara-default",
  name: "Jatinegara default",
  speed: { runKmh: 60, segmentKm: {}, minUnitsPerSecond: 2.5 },
  // Real-world JNG track classes (user-provided): G→Y = 900 m over 288 units
  // → 3.125 m/unit; straights on t1–t4 (y 496/464/432/400), t6 (336) and t7
  // (304) = 60 km/h; any turnout/crossover = 30. East of column AC (x=464)
  // the scale is AC→BA = 900 m over 384 units → 2.34375 m/unit; t1–t4 run
  // 120 km/h there, everything else east of AC is 30.
  trackSpeeds: {
    metresPerUnit: 900 / 288,
    straightKmhByY: { 496: 60, 464: 60, 432: 60, 400: 60, 336: 60, 304: 60 },
    turnoutKmh: 30,
    east: {
      x: 464,
      metresPerUnit: 900 / 384,
      straightKmhByY: { 496: 120, 464: 120, 432: 120, 400: 120 },
    },
  },
  // relativeAnchors: timetable anchors are stored as absolute clock times,
  // but a spawned train's clock (st.time) counts from ITS materialization.
  // Rebasing the anchors onto that clock keeps station dwells correct for
  // trains that originate mid-morning.
  dwell: { holdUntilScheduledDepartureByStation: { JNG: true }, minimumStopSeconds: 60, relativeAnchors: true },
  priority: { commuterServiceName: "Commuter", commuterPenalty: 1e9 },
  spawn: { coincidenceWindowSeconds: 60, clearanceSignalCount: 1, clearanceFallbackSeconds: 30, atTrackEdge: true },
  meet: { clearanceSignalCount: 2, clearanceFallbackSeconds: 30 },
  driver: { reactionSeconds: 5 },
  // Per-train-type speed ceilings (km/h). The track-class segment limits
  // still apply on top, so a krl on a 60 km/h west-zone straight still runs
  // at 60, but on a 120 km/h east-zone straight it is capped at 95.
  trainTypeSpeedKmh: {
    krl: 95,
    freight: 80,
    kirim_rangkaian: 90,
    local: 90,
    // null and intercity: no entry → run at track speed (120 km/h)
  },
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
