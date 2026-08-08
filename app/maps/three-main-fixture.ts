// Map assembly for the 3-main fixture — proves the map contract holds any
// number of main lines (Phase 2). Not wired into the UI.

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
import { THREE_MAIN_FIXTURE_TOPOLOGY } from "../topologies/three-main-fixture";

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

const COMPILED = compileTopology(THREE_MAIN_FIXTURE_TOPOLOGY);

const STATIONS: Station[] = [
  { code: "A", name: "Alpha", x: 200, y: 60, w: 100, h: 40 },
  { code: "B", name: "Beta", x: 800, y: 60, w: 100, h: 40 },
];

const STATION_CELLS: StationCell[] = [
  { code: "A", cells: [{ col: "D", row: 2 }] },
  { code: "B", cells: [{ col: "R", row: 2 }] },
];

export const THREE_MAIN_FIXTURE_MAP: DispatchMapDefinition = {
  id: "three-main-fixture",
  name: "Three main running lines (fixture)",
  diagramAriaLabel: "Fixture: three parallel main running lines",
  grid: {
    cellSize: CELL,
    extensionCells: 2,
    cutLeftColumns: 0,
    shift: 0,
    width: 1000,
    rowCount: 8,
    gridBottomY: 400,
    viewBox: { minX: -60, minY: -30, widthPadding: 120, height: 430 },
    ticks: { size: 6, topColumnLabelY: -20, bottomColumnLabelY: 400, leftRowLabelX: -40, rightRowLabelOffsetX: 14 },
  },
  lines: {
    topY: 100,
    bottomY: 200,
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
  trafficArrowPoints: [],
  stations: {
    nameplates: STATIONS,
    cells: STATION_CELLS,
    namesByCode: Object.fromEntries(STATIONS.map((station) => [station.code, station.name])),
    platformCenterX: COMPILED.stationPlatformCenterX,
  },
  compatibility: COMPILED.compatibility,
};
