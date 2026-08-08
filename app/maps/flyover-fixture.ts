// Map assembly for the flyover fixture (Phase 6). Not wired into the UI.

import {
  compileTopology,
  type Bearing,
  type Dir,
  type GNode,
  type PointControl,
  type SignalDef,
  type Sw,
  type SwitchState,
} from "../lib/topology";
import type {
  DispatchMapDefinition,
  Station,
  StationCell,
} from "../lib/dispatch-map";
import { FLYOVER_FIXTURE_TOPOLOGY } from "../topologies/flyover-fixture";

export type {
  Bearing,
  Dir,
  GNode,
  PointControl,
  SignalDef,
  Sw,
  SwitchState,
  Station,
  StationCell,
  DispatchMapDefinition,
} from "../lib/dispatch-map";

const CELL = 50;

const COMPILED = compileTopology(FLYOVER_FIXTURE_TOPOLOGY);

// schematic-mode stations: authored platform shapes (not grid cells)
const STATIONS: Station[] = [
  { code: "A", name: "Alpha", x: 1400, y: 89, w: 116, h: 58 },
  { code: "B", name: "Beta", x: 400, y: 205, w: 116, h: 58 },
];

export const FLYOVER_FIXTURE_MAP: DispatchMapDefinition = {
  id: "flyover-fixture",
  name: "Flying junction over the middle line (fixture)",
  diagramAriaLabel: "Fixture: level-1 ramp over the middle main without a flat crossing",
  grid: {
    cellSize: CELL,
    extensionCells: 2,
    cutLeftColumns: 0,
    shift: 0,
    width: 1700,
    rowCount: 8,
    gridBottomY: 300,
    viewBox: { minX: -60, minY: -30, widthPadding: 120, height: 330 },
    ticks: { size: 6, topColumnLabelY: -20, bottomColumnLabelY: 300, leftRowLabelX: -40, rightRowLabelOffsetX: 14 },
  },
  lines: {
    topY: 89,
    bottomY: 205,
    mains: COMPILED.lines.mains.map((main) => ({
      trackGroupId: main.trackGroupId,
      lineY: main.lineY,
      normalBearing: main.normalBearing,
      name: main.trackGroupId,
    })),
    normalDirectionByY: COMPILED.lines.normalDirectionByY,
    normalBearingByLineY: COMPILED.lines.normalBearingByLineY,
  },
  loops: COMPILED.loops,
  switches: COMPILED.switches,
  nodes: COMPILED.nodes,
  signals: COMPILED.signals,
  trackPaths: COMPILED.trackPaths,
  sectionPaths: COMPILED.sectionPaths,
  segmentLevels: COMPILED.segmentLevels,
  levelCrossings: COMPILED.levelCrossings,
  presentation: {
    kind: "schematic",
    viewBox: { minX: -60, minY: -40, width: 1820, height: 340 },
    continuousTrains: true,
    stationShapes: [
      { code: "A", x: 1400, y: 89, side: "down", length: 200 },
      { code: "B", x: 400, y: 205, side: "up", length: 200 },
    ],
  },
  trafficArrowPoints: [],
  stations: {
    nameplates: STATIONS,
    cells: [],
    namesByCode: Object.fromEntries(STATIONS.map((station) => [station.code, station.name])),
    platformCenterX: COMPILED.stationPlatformCenterX,
  },
  compatibility: COMPILED.compatibility,
};
