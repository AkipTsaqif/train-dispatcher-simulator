export type SwitchState = "normal" | "reversed";
export type Dir = "right" | "left";

export type Sw = {
  id: number;
  x: number;
  y: number;
  lineY: number;
  dashSide: "left" | "right";
  branch: string;
  label: string;
};

export type PointControl = {
  ids: number[];
  x: number;
  y: number;
  coupled: boolean;
  label: string;
};

export type GNode = {
  x: number;
  y: number;
  straight: Record<Dir, string | null>;
  branch?: Partial<Record<Dir, { path: string[]; farSw: number }>>;
  sw?: number;
};

export type SignalDef = {
  id: string;
  code?: string;
  x: number;
  y: number;
  lineY: number;
  dir: Dir;
  mount: "up" | "down";
  edge: [string, string];
  label: string;
  block?: boolean;
  ai?: boolean;
};

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
};

const CELL = 58;
const EXT = 10;
const CUT_LEFT = 3;
const SHIFT = (EXT - CUT_LEFT) * CELL;
const RIGHT = (21 + EXT * 2 - CUT_LEFT) * CELL;

const SWITCHES: Sw[] = [
  { id: 1, x: 326, y: 89, lineY: 89, dashSide: "right", branch: "M326 90 L438 205", label: "persilangan kiri, ujung atas" },
  { id: 2, x: 438, y: 205, lineY: 205, dashSide: "left", branch: "M326 90 L438 205", label: "persilangan kiri, ujung bawah" },
  { id: 3, x: 500, y: 89, lineY: 89, dashSide: "right", branch: "M500 89 L556 148", label: "lintas simpang atas, ujung barat" },
  { id: 4, x: 786, y: 89, lineY: 89, dashSide: "left", branch: "M730 148 L786 89", label: "lintas simpang atas, ujung timur" },
  { id: 5, x: 500, y: 205, lineY: 205, dashSide: "right", branch: "M500 205 L556 264", label: "lintas simpang bawah, ujung barat" },
  { id: 6, x: 788, y: 205, lineY: 205, dashSide: "left", branch: "M730 264 L788 205", label: "lintas simpang bawah, ujung timur" },
  { id: 7, x: 846, y: 205, lineY: 205, dashSide: "right", branch: "M846 205 L960 89", label: "persilangan kanan, ujung bawah" },
  { id: 8, x: 960, y: 89, lineY: 89, dashSide: "left", branch: "M846 205 L960 89", label: "persilangan kanan, ujung atas" },
];

const COUPLED: number[][] = [
  [1, 2],
  [7, 8],
];

const POINT_CONTROLS: PointControl[] = (() => {
  const coupledSet = new Set(COUPLED.flat());
  const controls: PointControl[] = [];
  for (const sw of SWITCHES) {
    if (coupledSet.has(sw.id)) continue;
    controls.push({ ids: [sw.id], x: sw.x, y: sw.y, coupled: false, label: sw.label });
  }
  for (const group of COUPLED) {
    const [a, b] = [SWITCHES.find((s) => s.id === group[0])!, SWITCHES.find((s) => s.id === group[1])!];
    controls.push({
      ids: [...group],
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      coupled: true,
      label: `${a.label.split(",")[0]}`,
    });
  }
  return controls.sort((a, b) => a.x - b.x);
})();

const NODES: Record<string, GNode> = {
  // top line (y=89) — traffic runs right → left
  tlL: { x: -SHIFT, y: 89, straight: { right: "p1", left: null } },
  p1: { x: 326, y: 89, sw: 1, straight: { right: "p3", left: "tlL" }, branch: { right: { path: ["p2"], farSw: 2 } } },
  p3: { x: 500, y: 89, sw: 3, straight: { right: "p4", left: "p1" }, branch: { right: { path: ["ul1", "ul2", "p4"], farSw: 4 } } },
  ul1: { x: 556, y: 148, straight: { right: "ul2", left: "p3" } },
  ul2: { x: 730, y: 148, straight: { right: "p4", left: "ul1" } },
  p4: { x: 786, y: 89, sw: 4, straight: { right: "p8", left: "p3" }, branch: { left: { path: ["ul2", "ul1", "p3"], farSw: 3 } } },
  p8: { x: 960, y: 89, sw: 8, straight: { right: "tlR", left: "p4" }, branch: { left: { path: ["p7"], farSw: 7 } } },
  tlR: { x: 1218 + EXT * CELL, y: 89, straight: { right: null, left: "p8" } },
  // bottom line (y=205) — traffic runs left → right
  blL: { x: -SHIFT, y: 205, straight: { right: "p2", left: null } },
  p2: { x: 438, y: 205, sw: 2, straight: { right: "p5", left: "blL" }, branch: { left: { path: ["p1"], farSw: 1 } } },
  p5: { x: 500, y: 205, sw: 5, straight: { right: "p6", left: "p2" }, branch: { right: { path: ["ll1", "ll2", "p6"], farSw: 6 } } },
  ll1: { x: 556, y: 264, straight: { right: "ll2", left: "p5" } },
  ll2: { x: 730, y: 264, straight: { right: "p6", left: "ll1" } },
  p6: { x: 788, y: 205, sw: 6, straight: { right: "p7", left: "p5" }, branch: { left: { path: ["ll2", "ll1", "p5"], farSw: 5 } } },
  p7: { x: 846, y: 205, sw: 7, straight: { right: "blR", left: "p6" }, branch: { right: { path: ["p8"], farSw: 8 } } },
  blR: { x: 1218 + EXT * CELL, y: 205, straight: { right: null, left: "p7" } },
};

const SIGNALS: SignalDef[] = [
  { id: "J1", x: 322, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "jalur bawah, arah kanan" },
  { id: "J2", x: 730, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p5", "p6"], label: "jalur bawah, kiri P6" },
  { id: "J3", x: 730, y: 264, lineY: 264, dir: "right", mount: "down", edge: ["ll1", "ll2"], label: "lintas simpang bawah, arah kanan" },
  { id: "J4", x: 1076, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "jalur atas, dua sel kanan P8" },
  { id: "J5", x: 558, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p4", "p3"], label: "jalur atas, kanan P3" },
  { id: "J6", x: 558, y: 148, lineY: 148, dir: "left", mount: "up", edge: ["ul2", "ul1"], label: "lintas simpang atas, arah kiri" },
  { id: "J7", x: 558, y: 264, lineY: 264, dir: "left", mount: "down", edge: ["ll2", "ll1"], label: "lintas simpang bawah, arah kiri" },
  // automatic block signals on the bottom-line approach (always mirror the next signal).
  // B101 is the smallest number and lies closest to J1 (J4); higher numbers reach further
  // left (G4, D4, A4).
  { id: "B101", x: 145, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, J4", block: true },
  { id: "B102", x: -29, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, G4", block: true },
  { id: "B103", x: -203, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, D4", block: true },
  { id: "B104", x: -377, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["blL", "p2"], label: "sinyal blok, A4", block: true },
  // top-line approach (right→left): blocks J2→G2→D2→A2. The A2 entry signal sits
  // at the map's west edge, ahead of B201 (red until the AI clears it) — so B201
  // mirrors it and defaults to amber.
  { id: "A2", x: -400, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal masuk, A2 (dikendalikan AI)", ai: true },
  { id: "B201", x: -377, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, A2", block: true },
  { id: "B202", x: -203, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, D2", block: true },
  { id: "B203", x: -29, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, G2", block: true },
  { id: "B204", x: 145, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["p1", "tlL"], label: "sinyal blok, J2", block: true },
  // top-line right approach: blocks AC2..AL2 nearest to J4. Displayed as
  // B201..B204 (internal ids stay unique — two sets share the same codes).
  { id: "B9", code: "B201", x: 1247, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AC2", block: true },
  { id: "B10", code: "B202", x: 1421, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AF2", block: true },
  { id: "B11", code: "B203", x: 1595, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AI2", block: true },
  { id: "B12", code: "B204", x: 1769, y: 89, lineY: 89, dir: "left", mount: "up", edge: ["tlR", "p8"], label: "sinyal blok, AL2", block: true },
  // bottom-line right exit: blocks AC4..AL4 — entry root is beyond the map, so no next
  // signal here and they all read green. Numbered away from the map (B109 = AC4 nearest).
  { id: "B109", x: 1247, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AC4", block: true },
  { id: "B108", x: 1421, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AF4", block: true },
  { id: "B107", x: 1595, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AI4", block: true },
  { id: "B106", x: 1769, y: 205, lineY: 205, dir: "right", mount: "down", edge: ["p7", "blR"], label: "sinyal blok, AL4", block: true },
];

const ALL_TRACKS: string[] = [
  // running-line extensions (EXT cells at the right end, EXT−CUT_LEFT at the left)
  `M${-SHIFT} 89 H64`, `M1162 89 H${1218 + EXT * CELL}`,
  `M${-SHIFT} 205 H62`, `M1162 205 H${1218 + EXT * CELL}`,
  "M64 89 H326", "M326 89 H500", "M500 89 H786", "M786 89 H960", "M960 89 H1162",
  "M62 205 H438", "M438 205 H500", "M500 205 H788", "M788 205 H846", "M846 205 H1162",
  "M326 90 L438 205",
  "M846 205 L960 89",
  "M500 89 L556 148", "M556 148 H730", "M730 148 L786 89",
  "M500 205 L556 264", "M556 264 H730", "M730 264 L788 205",
];

const INITIAL_SWITCHES: Record<number, SwitchState> = {
  1: "normal", 2: "normal", 3: "normal", 4: "normal",
  5: "normal", 6: "normal", 7: "normal", 8: "normal",
};

const INITIAL_SIGNALS: Record<string, boolean> = {
  J1: false,
  J2: false,
  J3: false,
  J4: false,
  J5: false,
  J6: false,
  J7: false,
};

const NORMAL_DIR: Record<number, Dir> = { 89: "left", 205: "right" };
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

const colIdx = (letters: string): number => {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

const PLATFORM_CENTER_X: Record<string, number> = Object.fromEntries(
  STATION_CELLS.map((station) => {
    const cols = station.cells.filter((cell) => cell.row === 2).map((cell) => colIdx(cell.col));
    return [station.code, ((Math.min(...cols) + Math.max(...cols) + 1) / 2) * CELL - SHIFT];
  })
);

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
    normalDirectionByY: NORMAL_DIR,
  },
  loops: {
    lineYs: new Set([148, 264]),
    minX: 500,
    maxX: 788,
    rejoinByLineY: {
      148: { leftX: 500, rightX: 786, mainLineY: 89 },
      264: { leftX: 500, rightX: 788, mainLineY: 205 },
    },
  },
  switches: {
    items: SWITCHES,
    coupled: COUPLED,
    controls: POINT_CONTROLS,
    initialState: INITIAL_SWITCHES,
  },
  nodes: NODES,
  signals: {
    items: SIGNALS,
    initialState: INITIAL_SIGNALS,
  },
  trackPaths: ALL_TRACKS,
  trafficArrowPoints: ["-396,83 -396,95 -406,89", "1788,199 1788,211 1798,205"],
  stations: {
    nameplates: STATIONS,
    cells: STATION_CELLS,
    namesByCode: Object.fromEntries(STATIONS.map((station) => [station.code, station.name])),
    platformCenterX: PLATFORM_CENTER_X,
  },
};
