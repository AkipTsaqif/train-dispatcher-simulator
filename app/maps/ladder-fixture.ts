// Map assembly for the ladder fixture (Phase 4). Not wired into the UI.

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
import { LADDER_FIXTURE_TOPOLOGY } from "../topologies/ladder-fixture";

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

const COMPILED = compileTopology(LADDER_FIXTURE_TOPOLOGY);

const STATIONS: Station[] = [
  { code: "A", name: "Alpha", x: 50, y: 160, w: 100, h: 40 },
  { code: "B", name: "Beta", x: 950, y: 160, w: 100, h: 40 },
];

const STATION_CELLS: StationCell[] = [
  { code: "A", cells: [{ col: "B", row: 2 }] },
  { code: "B", cells: [{ col: "T", row: 2 }] },
];

export const LADDER_FIXTURE_MAP: DispatchMapDefinition = {
  id: "ladder-fixture",
  name: "Ladder with two paths (fixture)",
  diagramAriaLabel: "Fixture: ladder with two parallel paths",
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
    topY: 200,
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
