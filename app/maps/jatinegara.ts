// Map assembly for Jatinegara (schematic mode). Not wired into the main UI.

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
import { JATINEGARA_TOPOLOGY } from "../topologies/jatinegara";

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

const COMPILED = compileTopology(JATINEGARA_TOPOLOGY);

const STATIONS: Station[] = [
  { code: "JNG", name: "Jatinegara", x: 330, y: 248, w: 130, h: 58 },
];

export const JATINEGARA_MAP: DispatchMapDefinition = {
  id: "jatinegara",
  name: "Jatinegara",
  diagramAriaLabel: "Meja pengatur Jatinegara: 8 jalur dengan lintas simpang",
  grid: {
    cellSize: 58,
    extensionCells: 2,
    cutLeftColumns: 0,
    shift: 0,
    width: 1160,
    rowCount: 10,
    gridBottomY: 540,
    viewBox: { minX: -20, minY: 230, widthPadding: 60, height: 300 },
    ticks: { size: 6, topColumnLabelY: 234, bottomColumnLabelY: 532, leftRowLabelX: 4, rightRowLabelOffsetX: -16 },
  },
  lines: {
    topY: 272,
    bottomY: 496,
    mains: COMPILED.lines.mains.map((main) => ({
      trackGroupId: main.trackGroupId,
      lineY: main.lineY,
      normalBearing: main.normalBearing,
      name: main.trackGroupId,
    })),
    normalDirectionByY: COMPILED.lines.normalDirectionByY,
    normalBearingByLineY: COMPILED.lines.normalBearingByLineY,
  },
  bidirectionalByY: COMPILED.lines.bidirectionalByY,
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
    viewBox: { minX: 0, minY: 240, width: 1160, height: 290 },
    continuousTrains: true,
    // keep the graph-paper chrome as a backdrop behind the free-form throat
    grid: true,
    // the 8 tracks sit 32 units apart (vs Bekasi's 59) — shrink the controls
    // to the map's pitch so signals/points/markers fit the dense throat
    controlScale: 0.55,
    stationShapes: [
      { code: "JNG", x: 850, y: 496, side: "down", length: 420 },
      { code: "JNG", x: 464, y: 464, side: "down", length: 192 },
      { code: "JNG", x: 464, y: 432, side: "down", length: 192 },
      { code: "JNG", x: 464, y: 400, side: "down", length: 192 },
      { code: "JNG", x: 416, y: 368, side: "down", length: 96 },
      { code: "JNG", x: 430, y: 336, side: "up", length: 128 },
      { code: "JNG", x: 400, y: 304, side: "up", length: 128 },
      { code: "JNG", x: 400, y: 272, side: "up", length: 128 },
    ],
  },
  trafficArrowPoints: [],
  stations: {
    nameplates: STATIONS,
    cells: [],
    namesByCode: Object.fromEntries(STATIONS.map((station) => [station.code, station.name])),
    platformCenterX: COMPILED.stationPlatformCenterX,
    stopXsByTrack: COMPILED.stationStopXs,
  },
  compatibility: COMPILED.compatibility,
};
