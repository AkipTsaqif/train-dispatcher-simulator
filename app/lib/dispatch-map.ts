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
      /** UI grouping / labeling, e.g. "up fast", "down slow". */
      name?: string;
    }[];
    /** Deprecated two-main view — kept for the current layout only. */
    topY: number;
    bottomY: number;
    normalDirectionByY: Record<number, Dir>;
    normalBearingByLineY: Record<number, Bearing>;
  };
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
  trafficArrowPoints: string[];
  stations: {
    nameplates: Station[];
    cells: StationCell[];
    namesByCode: Record<string, string>;
    platformCenterX: Record<string, number>;
  };
  compatibility: CompiledTopology["compatibility"];
};
