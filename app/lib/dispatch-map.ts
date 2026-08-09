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
  /** schematic mode: train markers at true continuous position/bearing. */
  continuousTrains?: boolean;
  /** Scale for the signal/point/train controls (default 1) — a dense map with
   *  close track spacing shrinks the controls to match its pitch. */
  controlScale?: number;
  /** Schematic mode may still draw the graph-paper chrome (grid lines, column
   *  letters, row numbers) behind the free-form geometry. */
  grid?: boolean;
  /** Visual grid pitch for the graph-paper chrome (default = the map's cell
   *  size). A dense layout may want a finer grid that aligns with its own
   *  track pitch, without changing the simulation's CELL. */
  gridCellSize?: number;
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
