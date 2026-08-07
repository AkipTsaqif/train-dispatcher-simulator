import {
  compileTopology,
  type CompiledTopology,
  type Dir,
  type GNode,
  type PointControl,
  type SignalDef,
  type Sw,
  type SwitchState,
} from "../lib/topology";
import { BEKASI_TAMBUN_CIBITUNG_TOPOLOGY } from "../topologies/bekasi-tambun-cibitung";

export type {
  Dir,
  GNode,
  PointControl,
  SignalDef,
  Sw,
  SwitchState,
} from "../lib/topology";

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
    topY: number;
    bottomY: number;
    normalDirectionByY: Record<number, Dir>;
  };
  loops: {
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

const CELL = 58;
const EXT = 10;
const CUT_LEFT = 3;
const SHIFT = (EXT - CUT_LEFT) * CELL;
const RIGHT = (21 + EXT * 2 - CUT_LEFT) * CELL;

const COMPILED_TOPOLOGY = compileTopology(BEKASI_TAMBUN_CIBITUNG_TOPOLOGY);
const TOP_LINE_Y = 89;
const BOTTOM_LINE_Y = 205;

const STATIONS: Station[] = [
  { code: "BKST", name: "Bekasi Timur", x: 58 - SHIFT, y: 116, w: 116, h: 58 },
  { code: "TB", name: "Tambun", x: 986 - SHIFT, y: 0, w: 116, h: 58 },
  { code: "CIT", name: "Cibitung", x: 2030 - SHIFT, y: 116, w: 116, h: 58 },
];

const STATION_CELLS: StationCell[] = [
  { code: "BKST", cells: [{ col: "B", row: 2 }, { col: "C", row: 2 }, { col: "B", row: 4 }, { col: "C", row: 4 }] },
  { code: "TB", cells: [{ col: "R", row: 2 }, { col: "S", row: 2 }, { col: "R", row: 3 }, { col: "S", row: 3 }, { col: "R", row: 4 }, { col: "S", row: 4 }, { col: "R", row: 5 }, { col: "S", row: 5 }] },
  { code: "CIT", cells: [{ col: "AJ", row: 2 }, { col: "AK", row: 2 }, { col: "AJ", row: 4 }, { col: "AK", row: 4 }] },
];

export const BEKASI_TAMBUN_CIBITUNG_MAP: DispatchMapDefinition = {
  id: "bekasi-tambun-cibitung",
  name: "Bekasi Timur–Tambun–Cibitung",
  diagramAriaLabel: "Meja pengatur perjalanan kereta: dua jalur utama dengan persilangan, lintas simpang, dan sinyal",
  grid: {
    cellSize: CELL,
    extensionCells: EXT,
    cutLeftColumns: CUT_LEFT,
    shift: SHIFT,
    width: RIGHT,
    rowCount: 6,
    gridBottomY: 353,
    viewBox: { minX: -26, minY: -22, widthPadding: 52, height: 401 },
    ticks: {
      size: 6,
      topColumnLabelY: -9,
      bottomColumnLabelY: 370,
      leftRowLabelX: -13,
      rightRowLabelOffsetX: 14,
    },
  },
  lines: {
    topY: TOP_LINE_Y,
    bottomY: BOTTOM_LINE_Y,
    normalDirectionByY: COMPILED_TOPOLOGY.lines.normalDirectionByY,
  },
  loops: COMPILED_TOPOLOGY.loops,
  switches: COMPILED_TOPOLOGY.switches,
  nodes: COMPILED_TOPOLOGY.nodes,
  signals: COMPILED_TOPOLOGY.signals,
  trackPaths: COMPILED_TOPOLOGY.trackPaths,
  trafficArrowPoints: ["-396,83 -396,95 -406,89", "1788,199 1788,211 1798,205"],
  stations: {
    nameplates: STATIONS,
    cells: STATION_CELLS,
    namesByCode: Object.fromEntries(STATIONS.map((station) => [station.code, station.name])),
    platformCenterX: COMPILED_TOPOLOGY.stationPlatformCenterX,
  },
  compatibility: COMPILED_TOPOLOGY.compatibility,
};
