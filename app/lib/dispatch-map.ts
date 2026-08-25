// Shared map contracts — the shape of a dispatch map, independent of any
// concrete layout. Extracted from the Bekasi map module so new layouts do not
// have to import their types from a concrete layout.
//
// The topology types are re-exported here so existing import sites keep
// working during the transition.

import type {
  CompiledLoop,
  CompiledTopology,
  Bearing,
  Dir,
  GNode,
  PointControl,
  SignalDef,
  Sw,
  SwitchState,
  LeveledPoint,
  TopologyPoint,
} from "./topology";

// Re-export the topology types so existing import sites keep working during
// the transition.
export type {
  Bearing,
  Dir,
  GNode,
  GNodeExit,
  CompiledLoop,
  PointControl,
  SignalDef,
  Sw,
  SwitchState,
} from "./topology";

export type Station = {
  code: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type StationCell = {
  code: string;
  cells: { col: string; row: number }[];
};

/** A schematic-mode platform: authored coordinates, not grid cells. */
export type StationShape = {
  code: string;
  /** platform anchor point. */
  x: number;
  y: number;
  /** which side of the track the platform sits (perpendicular offset). */
  side: "up" | "down";
  /** platform length along the track axis. */
  length: number;
  /** platform thickness perpendicular to the track (default 10). */
  width?: number;
  /** gap between the track and the near face of the platform (default 8). */
  offset?: number;
  /** end shape: a rounded pill (default) or square corners. */
  corner?: "round" | "square";
  /**
   * Baseline for the station name. Omit to keep the label tucked against the
   * platform; set it to place the name independently — a bar drawn beside one
   * row often reads better with its name a row or two away.
   */
  labelY?: number;
  /**
   * Draw the station name on this shape (default true). A station with several
   * platform faces should name itself once, so the extra bars set this false.
   */
  label?: boolean;
};

/**
 * Presentation mode — Phase 7. Grid layouts keep the graph-paper chrome
 * (lines, column letters, row numbers, snapped train hops); schematic layouts
 * render free-form from the edge geometry.
 */
export type Presentation = {
  kind: "grid" | "schematic";
  /** schematic mode: full viewBox (grid mode uses grid.viewBox + width). */
  viewBox?: { minX: number; minY: number; width: number; height: number };
  /**
   * Schematic mode: draw train markers at their true continuous
   * position/bearing. Omit to snap markers to the layout's visual grid pitch
   * instead, while the engine itself still moves continuously in either mode.
   */
  continuousTrains?: boolean;
  /** Scale for the signal/point/train controls (default 1) — a dense map with
   *  close track spacing shrinks the controls to match its pitch. */
  controlScale?: number;
  /** Extra scale for SIGNALS only, multiplied onto controlScale (default 1).
   *  A signal head is tall next to a point circle, so a dense layout may
   *  want it smaller without shrinking the point handles too. */
  signalScale?: number;
  /** Extra scale for POINT CONTROL circles only, multiplied onto
   *  controlScale (default 1). Lets the handles shrink toward the grid
   *  pitch without also shrinking train markers. */
  pointScale?: number;
  /** Schematic mode may still draw the graph-paper chrome (grid lines, column
   *  letters, row numbers) behind the free-form geometry. */
  grid?: boolean;
  /** Visual grid pitch for the graph-paper chrome (default = the map's cell
   *  size). A dense layout may want a finer grid that aligns with its own
   *  track pitch, without changing the simulation's CELL. */
  gridCellSize?: number;
  /**
   * Drawn height of the train marker body, in map units and BEFORE
   * controlScale. Omit to keep the historical 22. A dense layout can set this
   * to its grid pitch so a train fills its cell exactly.
   *
   * Purely visual — the engine's own footprint is unchanged.
   */
  trainHeight?: number;
  /**
   * Drawn size of the train number, in map units. Omit to keep the historical
   * 12 * controlScale. Pairs with trainHeight: a marker grown to fill its cell
   * wants a number grown to match.
   */
  trainFontSize?: number;
  /**
   * Multiplier on the train's direction arrow, about the marker centre.
   * Omit for 1 (the historical Bekasi geometry). Values above 1 lengthen the
   * arrow and widen its barbs, and push the tail clear of the train number.
   */
  trainArrowScale?: number;
  /**
   * Drawn length of the train marker body, in map units. Omit to keep the
   * historical grid.cellSize * controlScale.
   *
   * Purely visual, like trainHeight: the ENGINE's footprint stays
   * grid.cellSize, so stopping points, occupancy, and conflicts are unchanged.
   */
  trainLength?: number;
  /**
   * Draw the train marker as an ARTICULATED body that follows the track
   * centre-line, so a train crossing a thrown point bends at the junction
   * instead of staying a rigid rotated box. Omit for the historical rigid
   * marker.
   *
   * Purely visual, like trainHeight/trainLength: the engine's footprint,
   * stopping points, occupancy, and conflicts are unchanged.
   */
  articulatedTrains?: boolean;
  /** Shift the graph-paper chrome by [dx, dy] (e.g. half a cell) so the
   *  tracks run through the cell MIDDLES instead of on the lines. */
  gridOffset?: [number, number];
  /** Font size of the grid reference (column letters / row numbers) — a fine
   *  grid needs smaller labels. Default 11 (the grid-mode size). */
  gridLabelSize?: number;
  /** Label a column/row every N grid cells (default 1) — keeps the letters/
   *  numbers readable when the grid pitch is much finer than the cells. */
  gridLabelStep?: number;
  /** schematic mode: authored platform shapes (grid mode uses cells). */
  stationShapes?: StationShape[];
};

export type DispatchMapDefinition = {
  id: string;
  name: string;
  diagramAriaLabel: string;
  grid: {
    cellSize: number;
    extensionCells: number;
    cutLeftColumns: number;
    shift: number;
    width: number;
    rowCount: number;
    gridBottomY: number;
    viewBox: { minX: number; minY: number; widthPadding: number; height: number };
    ticks: {
      size: number;
      topColumnLabelY: number;
      bottomColumnLabelY: number;
      leftRowLabelX: number;
      rightRowLabelOffsetX: number;
    };
  };
  lines: {
    /** Every main running line, one entry per main track group. */
    mains: {
      trackGroupId: string;
      lineY: number;
      normalBearing: Bearing;
      /** Bidirectional running — wrong-way protection exempt. */
      bidirectional?: boolean;
      /** UI grouping / labeling, e.g. "up fast", "down slow". */
      name?: string;
    }[];
    /** Deprecated two-main view — kept for the current layout only. */
    topY: number;
    bottomY: number;
    normalDirectionByY: Record<number, Dir>;
    normalBearingByLineY: Record<number, Bearing>;
  };
  /** Mains that may be used (and signaled) both ways — wrong-way protection
   *  exempt. Keyed by line Y (not projected into the baseline). */
  bidirectionalByY: Record<number, boolean>;
  loops: {
    byGroupId: Record<string, CompiledLoop>;
    /** Deprecated global views — kept in sync for the current layout. */
    lineYs: Set<number>;
    minX: number;
    maxX: number;
    rejoinByLineY: Record<number, { leftX: number; rightX: number; mainLineY: number }>;
  };
  switches: {
    items: Sw[];
    coupled: number[][];
    controls: PointControl[];
    initialState: Record<number, SwitchState>;
  };
  nodes: Record<string, GNode>;
  signals: {
    items: SignalDef[];
    initialState: Record<string, boolean>;
  };
  trackPaths: string[];
  /** Protected-block section of each signal as a track polyline (Phase 5).
   *  Points may carry a grade level (3rd element) — Phase 6. */
  sectionPaths: Record<string, LeveledPoint[]>;
  /** Grade level of every movement segment, keyed `${fromId}|${toId}`. */
  segmentLevels: Record<string, number>;
  /** Phase 7: map positions where edges cross at different grade levels. */
  levelCrossings: {
    point: TopologyPoint;
    upperLevel: number;
    direction: Bearing;
  }[];
  /** Phase 7: presentation mode (grid chrome vs free-form schematic). */
  presentation: Presentation;
  trafficArrowPoints: string[];
  /** Layout-authored clearance for flank protection. Defaults to one third of
   * `grid.cellSize`, preserving the original Bekasi behaviour. A dense
   * schematic may use a smaller value so an adjacent, non-fouling turnout is
   * not locked merely because its drawn geometry is compressed. */
  interlocking?: {
    flankClearance: number;
    /**
     * How a signal reacts when the route it needs is not yet formed by the
     * CURRENT point positions.
     *   "auto"   — the interlocking throws the required unlocked points itself,
     *              then clears. This is the historical Bekasi behaviour and
     *              stays the default.
     *   "manual" — the signal is refused; the user must set the points first.
     *              Nothing about reachability is authored: a track is simply
     *              unreachable when no point currently leads to it.
     */
    routeSetting?: "auto" | "manual";
  };
  /**
   * Track that is drawn and connected but CANNOT CARRY TRAFFIC — e.g. still
   * under construction, or closed for engineering work.
   *
   * This is a fact about the real world, so it is authored rather than
   * derived: no arrangement of points can tell you a line is unbuilt. It is
   * deliberately NOT part of the topology — connectivity, switch ids, and
   * compiled geometry are unchanged, so reopening a line is a one-line edit
   * and nothing downstream has to be recompiled.
   *
   * A route touching any closed span is refused. The renderer greys the span
   * and marks its open end with a cross.
   */
  outOfService?: {
    /** Track group the closed span belongs to, e.g. "t4". */
    groupId: string;
    /** Closed x-interval on that group, inclusive. */
    fromX: number;
    toX: number;
    /** Why it is shut — shown to the user. */
    reason?: string;
  }[];
  stations: {
    nameplates: Station[];
    cells: StationCell[];
    namesByCode: Record<string, string>;
    platformCenterX: Record<string, number>;
    /** Multi-length platforms: platform X per (station, track group). */
    stopXsByTrack: Record<string, Record<string, number>>;
  };
  compatibility: CompiledTopology["compatibility"];
};
