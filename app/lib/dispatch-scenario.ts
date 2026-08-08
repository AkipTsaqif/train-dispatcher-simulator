// Shared scenario contract — the operating rules of a dispatch scenario,
// independent of any concrete layout. Extracted from the Bekasi scenario
// module so new layouts do not have to import their types from a concrete
// layout.

export type DispatchScenarioDefinition = {
  id: string;
  name: string;
  speed: {
    runKmh: number;
    segmentKm: Record<string, number>;
  };
  dwell: {
    holdUntilScheduledDepartureByStation: Record<string, boolean>;
    minimumStopSeconds: number;
  };
  priority: {
    commuterServiceName: string;
    commuterPenalty: number;
  };
  spawn: {
    coincidenceWindowSeconds: number;
    clearanceSignalCount: number;
    clearanceFallbackSeconds: number;
  };
  meet: {
    clearanceSignalCount: number;
    clearanceFallbackSeconds: number;
  };
  /** Optional routing policy: which main line a direction defaults to. */
  routing?: {
    defaultLineByDirection?: Partial<Record<"left" | "right", string>>; // trackGroupId or line name
  };
  notifications: {
    boardLimit: number;
    heldAtSignalThresholdSeconds: number;
    susulMeetStation: string;
    departureCountdown: {
      station: string;
      stopIndex: number;
      firstThresholdSeconds: number;
      urgentThresholdSeconds: number;
    };
  };
};
