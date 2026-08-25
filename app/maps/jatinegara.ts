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
	StationShape,
} from "../lib/dispatch-map";
import { JATINEGARA_ASSEMBLED as JATINEGARA_TOPOLOGY } from "../pieces/jatinegara";

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
	{ code: "JNG", name: "Jatinegara", x: 138, y: 248, w: 130, h: 58 },
];

// Traffic-flow arrows at the map boundaries, authored as grid cells. The
// POINTING DIRECTION IS NOT AUTHORED: it is read from the line's compiled
// normal bearing, so an arrow can never contradict the direction the
// simulation actually runs, and a later change of a line's normal direction
// moves the arrowhead with it.
// The GROUP is named, not just the row: row 2 carries both t8 (westbound) and
// t8am (eastbound), so a y alone cannot decide which way an arrow points.
const ARROW_CELLS: { x: number; group: string }[] = [
	{ x: 32, group: "t7" }, // B4
	{ x: 32, group: "t4" }, // B10
	{ x: 32, group: "t2" }, // B14
	{ x: 208, group: "t8" }, // M2
	{ x: 832, group: "t8am" }, // AZ2
	{ x: 896, group: "t6am" }, // BD6
	{ x: 896, group: "t5ap" }, // BD8
	{ x: 896, group: "t3" }, // BD12
	{ x: 896, group: "t1" }, // BD16
];

/**
 * A solid triangle pointing the way traffic flows on a named track group.
 * `half` is the half-height of its base; `len` is how far the tip projects
 * from the base, along the direction of travel.
 */
const arrowAt = (
	{ x, group }: { x: number; group: string },
	half = 5,
	len = 8,
): string => {
	const main = COMPILED.lines.mains.find((m) => m.trackGroupId === group);
	if (!main) {
		throw new Error(
			`No running line "${group}": a traffic arrow must sit on a main line.`,
		);
	}
	const { lineY: y } = main;
	const dx = Math.sign(main.normalBearing.dx);
	return `${x},${y - half} ${x},${y + half} ${x + dx * len},${y}`;
};

// Island platforms: one platform face serving a PAIR of tracks, drawn in the
// gap between them. The y is derived from the two compiled line positions, so
// a bar can never drift off its tracks if a row is later moved; only the pair
// and the x-span are authored.
const islandPlatform = (
	upper: string,
	lower: string,
	{ x, length, labelY }: { x: number; length: number; labelY?: number },
): StationShape => {
	const find = (group: string) => {
		const main = COMPILED.lines.mains.find((m) => m.trackGroupId === group);
		if (!main) {
			throw new Error(
				`No running line "${group}": an island platform must sit between two main lines.`,
			);
		}
		return main.lineY;
	};
	const upperY = find(upper);
	const lowerY = find(lower);
	const thickness = 10;
	// hang off the upper track and reach down to the midpoint between the two
	const gap = (Math.abs(lowerY - upperY) - thickness) / 2;
	return {
		code: "JNG",
		x,
		y: Math.min(upperY, lowerY),
		side: "down",
		length,
		offset: gap,
		corner: "square",
		...(labelY === undefined ? { label: false } : { labelY }),
	};
};

// The four island platforms, each between the pair of tracks it serves. Only
// the row-15 bar carries the station name; the rest are the same platform seen
// at other faces, so they stay unlabelled.
const ISLAND_PLATFORMS: StationShape[] = [
	islandPlatform("t7", "t8", { x: 360, length: 64 }), // row 3
	islandPlatform("t5", "t6", { x: 360, length: 64 }), // row 7
	islandPlatform("t3", "t4", { x: 360, length: 64 }), // row 11
	islandPlatform("t1", "t2", { x: 360, length: 64, labelY: 517 }), // row 15, named
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
		width: 928,
		rowCount: 10,
		gridBottomY: 540,
		viewBox: { minX: -20, minY: 230, widthPadding: 60, height: 300 },
		// the column letters sit OUTSIDE the grid: above its top line (240) and
		// below its bottom line (544); row numbers in the left/right gutters
		ticks: {
			size: 6,
			topColumnLabelY: 240,
			bottomColumnLabelY: 544,
			leftRowLabelX: -26,
			rightRowLabelOffsetX: 36,
		},
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
		// margins around the diagram for the grid reference (letters above/below
		// the grid, numbers left/right — outside, like the Tambun grid)
		viewBox: { minX: -40, minY: 222, width: 1016, height: 330 },
		// Keep engine movement continuous, but snap the DRAWN markers to this
		// 16-unit graph-paper lattice, like Bekasi. This is presentation only:
		// stops, occupancy, conflicts, and route release retain their true
		// continuous positions in the generic engine.
		// keep the graph-paper chrome as a backdrop behind the free-form throat.
		// The tracks sit at odd multiples of 16 (272..496) — a 16-unit grid pitch
		// whose y-offset is 8 mod 16 (248 here) puts every track through the cell
		// MIDDLE; the grid starts just above the top track so the row numbers run
		// 1..N from the top (like Tambun), with the letters outside the borders.
		grid: true,
		gridCellSize: 16,
		gridOffset: [8, 248],
		gridLabelSize: 7,
		// the 8 tracks sit 32 units apart (vs Bekasi's 59) — shrink the controls
		// to the map's pitch so signals/points/markers fit the dense throat
		controlScale: 0.55,
		signalScale: 0.75,
		pointScale: 0.75,
		// just under the 16-unit grid cell, so a train reads as occupying its row
		// while leaving the track visible above and below it
		trainHeight: 14,
		// four grid cells long (4 x 16). Visual only — the engine still uses
		// grid.cellSize for stopping points and occupancy.
		trainLength: 64,
		// the number grows with the marker, staying clear of the body edges
		trainFontSize: 8,
		// and the direction arrow grows with both, staying legible at this pitch
		trainArrowScale: 1.6,
		// A train crossing a thrown point straddles two bearings at once, so the
		// marker bends at the junction instead of staying a rigid rotated box.
		// Visual only — the engine's footprint is unchanged.
		articulatedTrains: true,
		stationShapes: ISLAND_PLATFORMS,
	},
	trafficArrowPoints: ARROW_CELLS.map((cell) => arrowAt(cell)),
	// This 11-unit clearance keeps the NE2→XW4 route's protection inside the
	// actual fouling envelope. It excludes PC22 at AH10 from the route through
	// AG10–AF10; its branch comes 11.31 units away, so it is adjacent but clear.
	// Manual point setting: a signal is refused while the points as they stand
	// do not form its route, so the user must set the road first. "Inactive
	// track" is emergent from the current point positions, never authored.
	interlocking: { flankClearance: 11, routeSetting: "manual" },
	// Track 4 and track 3 are not yet built west of H: the rails are on the
	// schematic, but no train may run there. XW4 with every point normal runs
	// straight into t4's closed length, so the user must set a road that avoids
	// it — PC7 (down to t6), or PC3+PC2 (across to t2; PC3 alone only reaches
	// t3, which is closed too).
	outOfService: [
		{
			groupId: "t4",
			fromX: 32,
			toX: 128,
			reason: "jalur dalam pembangunan",
		},
		{
			groupId: "t3",
			fromX: 32,
			toX: 128,
			reason: "jalur dalam pembangunan",
		},
	],
	stations: {
		nameplates: STATIONS,
		cells: [],
		namesByCode: Object.fromEntries(
			STATIONS.map((station) => [station.code, station.name]),
		),
		platformCenterX: COMPILED.stationPlatformCenterX,
		stopXsByTrack: COMPILED.stationStopXs,
	},
	compatibility: COMPILED.compatibility,
};
