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
    /** Floor for derived leg speeds (map units/second). Timetables whose
     *  scheduled gaps are long relative to inter-platform distances otherwise
     *  produce crawling legs (speed = distance ÷ gap). Trains running at the
     *  floor arrive early and dwell until their scheduled departure. Absent →
     *  no floor (schedule-derived speeds exactly as before). */
    minUnitsPerSecond?: number;
  };
  /** Real-world track-class speed model (mirrors TrackSpeedConfig in
   *  train-engine). When set, leg plan speeds become the layout maximum and
   *  the engine caps each segment: straights run at their line speed,
   *  turnouts/crossovers at turnoutKmh, and everything beyond `east.x` uses
   *  the eastern scale and limits. */
  trackSpeeds?: {
    metresPerUnit: number;
    straightKmhByY: Record<number, number>;
    turnoutKmh: number;
    east?: {
      x: number;
      metresPerUnit: number;
      straightKmhByY: Record<number, number>;
    };
  };
  dwell: {
    holdUntilScheduledDepartureByStation: Record<string, boolean>;
    minimumStopSeconds: number;
    /** Timetable anchors are absolute clock times; a spawned train's internal
     *  clock counts from its own materialization. true = rebase anchors onto
     *  that clock so station dwells last the scheduled DURATION, not until
     *  wall-clock anchor time (which for mid-day origins means hours). */
    relativeAnchors?: boolean;
  };
  priority: {
    commuterServiceName: string;
    commuterPenalty: number;
  };
  spawn: {
    coincidenceWindowSeconds: number;
    clearanceSignalCount: number;
    clearanceFallbackSeconds: number;
    /** Spawn relative to the journey's OWN line extent instead of the global
     *  map edge. For partial lines (fragmented/stub tracks that do not reach
     *  the map borders) the train enters at its track's edge rather than
     *  floating in blank space before the drawn track begins. */
    atTrackEdge?: boolean;
  };
  meet: {
    clearanceSignalCount: number;
    clearanceFallbackSeconds: number;
  };
  /** Optional routing policy: which main line a direction defaults to. */
  routing?: {
    defaultLineByDirection?: Partial<Record<"left" | "right", string>>; // trackGroupId or line name
  };
  /** Optional driver-behaviour knobs. reactionSeconds: after a held signal
   *  clears, the train waits this many SIM seconds before resuming — a stand-in
   *  for driver reaction time (0/absent = resume instantly). */
  driver?: {
    reactionSeconds?: number;
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
