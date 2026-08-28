// Jatinegara, authored as PIECES (Phase 9 Step 6).
//
// This file REPLACES scripts/gen-jatinegara.py. It is the whole station as a
// human writes it: 13 running lines and 29 diagonals, at their true drawn
// extents. Everything else - 74 nodes, 90 edges, 48 switches, 42 track groups
// - is derived by assemblePieces().
//
// What is NOT here is the point. No edge ids, no node ids, no switch
// common/normal/reversed wiring, no render slots, no dashSide. Each of those
// was a place the generator could disagree with itself and a place a human
// editing by hand would get it wrong.
//
// The 8 track y-values, west to east across the throat:
//   y=496 t1   y=464 t2   y=432 t3   y=400 t4
//   y=368 t5   y=336 t6   y=304 t7   y=272 t8
// Tracks 5 and 6 are fragmented in the drawing; each fragment is its own line
// (t5ac, t5y, t6ab, t5ap, t6am) because that is what is actually drawn.
//
// Western compaction: old N and all geometry east of it moved left 12 columns
// to make new B; the prior B–N plain approach was intentionally discarded.
// Acceptance: compile + JNG verifier + reviewed baseline, not diff:ir (the
// retired generated JNG topology has no current source module).

import { assemblePieces, type PieceSet } from "../lib/pieces";
import {
	JATINEGARA_CONTROL_GROUPS,
} from "./jatinegara-data";

export const JATINEGARA_PIECES: PieceSet = {
	pieces: [
		// --- running lines, at their true drawn extents ------------------------
		{
			kind: "line",
			id: "t1",
			y: 496,
			from: 32,
			to: 960,
			normalDirection: "right",
			endNodes: { west: "n1", east: "n2" },
		},
		{
			kind: "line",
			id: "t2",
			y: 464,
			from: 32,
			to: 960,
			normalDirection: "left",
			bidirectional: true,
			endNodes: { west: "n3", east: "n4" },
		},
		{
			kind: "line",
			id: "t3",
			y: 432,
			from: 32,
			to: 960,
			normalDirection: "right",
			endNodes: { west: "n5", east: "n6" },
		},
		{
			kind: "line",
			id: "t4",
			y: 400,
			from: 32,
			to: 960,
			normalDirection: "left",
			endNodes: { west: "n7", east: "n8" },
		},
		{
			kind: "line",
			id: "t5",
			y: 368,
			from: 352,
			to: 464,
			normalDirection: "left",
			bidirectional: true,
		},
		{
			kind: "line",
			id: "t6",
			y: 336,
			from: 32,
			to: 512,
			normalDirection: "right",
			bidirectional: true,
			endNodes: { west: "n9" },
		},
		{
			kind: "line",
			id: "t7",
			y: 304,
			from: 32,
			to: 544,
			normalDirection: "left",
			bidirectional: true,
			endNodes: { west: "n10" },
		},
		{
			kind: "line",
			id: "t8",
			y: 272,
			from: 272,
			to: 464,
			normalDirection: "left",
			bidirectional: true,
			endNodes: { west: "n11" },
		},
		{
			kind: "line",
			id: "t5ap",
			y: 368,
			from: 816,
			to: 960,
			normalDirection: "right",
			endNodes: { east: "n12" },
		},
		{
			kind: "line",
			id: "t6am",
			y: 336,
			from: 816,
			to: 960,
			normalDirection: "right",
			endNodes: { east: "n13" },
		},
		{
			kind: "line",
			id: "t8am",
			y: 272,
			from: 880,
			to: 896,
			normalDirection: "right",
			endNodes: { east: "n17" },
		},
		{
			kind: "line",
			id: "t5ac",
			y: 368,
			from: 608,
			to: 784,
			normalDirection: "right",
			endNodes: { east: "n14" },
		},
		{
			kind: "line",
			// A flat connector at y=352, between the t5 and t6 rows. It CROSSES
			// xov15/16/18 without joining them: pieces join only at shared
			// endpoints, and none of those diagonals ends on this row.
			id: "t5y",
			y: 352,
			from: 528,
			to: 592,
			normalDirection: "right",
			endNodes: { west: "n15", east: "n16" },
		},

		// --- diagonals. An end landing INSIDE a line is a switch; an end
		// landing at a line extremity is a fixed track turn. 29 diagonals,
		// 58 ends, 48 switches - the other 10 are turns.
		{ kind: "link", id: "xov1", from: [160, 496], to: [192, 464] },
		{ kind: "link", id: "xov2", from: [208, 464], to: [240, 432] },
		{ kind: "link", id: "xov3", from: [256, 432], to: [288, 400] },
		{ kind: "link", id: "xov4", from: [256, 400], to: [288, 432] },
		{ kind: "link", id: "xov5", from: [336, 496], to: [368, 464] },
		{ kind: "link", id: "xov6", from: [336, 464], to: [368, 496] },
		{ kind: "link", id: "xov7", from: [256, 336], to: [320, 400] },
		{ kind: "link", id: "xov8", from: [208, 336], to: [240, 304] },
		{ kind: "link", id: "xov9", from: [208, 304], to: [240, 336] },
		{ kind: "link", id: "xov10", from: [320, 336], to: [352, 368] },
		{ kind: "link", id: "xov11", from: [336, 400], to: [368, 368] },
		{ kind: "link", id: "xov12", from: [336, 304], to: [368, 272] },
		{ kind: "link", id: "xov13", from: [464, 272], to: [496, 304] },
		{ kind: "link", id: "xov14", from: [464, 368], to: [496, 336] },
		// Split at AL7 [416, 352] for the inverted point at t5y's west end.
		{ kind: "link", id: "xov15", from: [512, 336], to: [576, 400], splitAt: [528, 352] },
		{ kind: "link", id: "xov16", from: [512, 304], to: [608, 400] },
		// Split at AG7 [528, 352] for the inverted point at t5y's east end.
		{ kind: "link", id: "xov18", from: [544, 304], to: [608, 368], splitAt: [592, 352] },
		{ kind: "link", id: "xov19", from: [592, 400], to: [624, 432] },
		{ kind: "link", id: "xov20", from: [624, 400], to: [656, 432] },
		{ kind: "link", id: "xov21", from: [640, 432], to: [672, 464] },
		{ kind: "link", id: "xov22", from: [672, 432], to: [704, 464] },
		{ kind: "link", id: "xov23", from: [688, 464], to: [720, 496] },
		{ kind: "link", id: "xov24", from: [704, 432], to: [736, 400] },
		{ kind: "link", id: "xov25", from: [720, 464], to: [752, 496] },
		{ kind: "link", id: "xov26", from: [544, 464], to: [576, 432] },
		// Split at AS8 so the inverted point P57 can sit mid-diagonal. The halves
		// are derived, so moving this link moves the point with it.
		{ kind: "link", id: "xov27", from: [752, 400], to: [816, 336], splitAt: [784, 368] },
		{ kind: "link", id: "xov30", from: [816, 336], to: [880, 272] },
		{ kind: "link", id: "xov31", from: [832, 336], to: [864, 368] },
		{ kind: "link", id: "xov32", from: [880, 368], to: [912, 336] },
		{ kind: "link", id: "xov28", from: [736, 432], to: [768, 400] },
		{ kind: "link", id: "xov29", from: [784, 400], to: [816, 368] },

		// --- signals. Positional: an x along a track group, resolved to an
		// edge+segment+offset by assemblePieces. NOT an edge-id reference, so a
		// switch move that re-cuts the line does not invalidate them.
		{ kind: "signal", id: "NW1", groupId: "t1", x: 128, facing: "toward-to", mount: "up", label: "NW1", protectedBlockSectionId: "section-NW1" },
		{ kind: "signal", id: "NW1A", groupId: "t1", x: 304, facing: "toward-to", mount: "up", label: "NW1A", protectedBlockSectionId: "section-NW1A" },
		{ kind: "signal", id: "NW3", groupId: "t3", x: 176, facing: "toward-to", mount: "up", label: "NW3", protectedBlockSectionId: "section-NW3" },
		{ kind: "signal", id: "NW5", groupId: "t6", x: 176, facing: "toward-to", mount: "up", label: "NW5", protectedBlockSectionId: "section-NW5" },
		{ kind: "signal", id: "NW7", groupId: "t8", x: 304, facing: "toward-to", mount: "up", label: "NW7", protectedBlockSectionId: "section-NW7" },
		{ kind: "signal", id: "NE2", groupId: "t2", x: 800, facing: "toward-from", mount: "up", label: "NE2", protectedBlockSectionId: "section-NE2" },
		{ kind: "signal", id: "NE4", groupId: "t4", x: 848, facing: "toward-from", mount: "up", label: "NE4", protectedBlockSectionId: "section-NE4" },
		{ kind: "signal", id: "NE5", groupId: "t5ap", x: 928, facing: "toward-from", mount: "up", label: "NE5", protectedBlockSectionId: "section-NE5" },
		{ kind: "signal", id: "NE6", groupId: "t6am", x: 928, facing: "toward-from", mount: "up", label: "NE6", protectedBlockSectionId: "section-NE6" },
		// On the xov30 diagonal at AW4 - its exact midpoint. A diagonal needs the
		// positional "at" escape because an x does not identify a point on it.
		{ kind: "signal", id: "NE8", groupId: "xov30", at: { edgeIndex: 0, segmentIndex: 0, offset: 45.25 }, facing: "toward-to", mount: "up", label: "NE8", protectedBlockSectionId: "section-NE8" },
		{ kind: "signal", id: "XW2", groupId: "t2", x: 384, facing: "toward-from", mount: "up", label: "XW2", protectedBlockSectionId: "section-XW2" },
		{ kind: "signal", id: "XW2A", groupId: "t2", x: 256, facing: "toward-from", mount: "up", label: "XW2A", protectedBlockSectionId: "section-XW2A" },
		{ kind: "signal", id: "XW3", groupId: "t3", x: 384, facing: "toward-from", mount: "up", label: "XW3", protectedBlockSectionId: "section-XW3" },
		{ kind: "signal", id: "XW4", groupId: "t4", x: 384, facing: "toward-from", mount: "up", label: "XW4", protectedBlockSectionId: "section-XW4" },
		{ kind: "signal", id: "XW5", groupId: "t5", x: 384, facing: "toward-from", mount: "up", label: "XW5", protectedBlockSectionId: "section-XW5" },
		{ kind: "signal", id: "XW6", groupId: "t6", x: 384, facing: "toward-from", mount: "up", label: "XW6", protectedBlockSectionId: "section-XW6" },
		{ kind: "signal", id: "XW7", groupId: "t7", x: 384, facing: "toward-from", mount: "up", label: "XW7", protectedBlockSectionId: "section-XW7" },
		{ kind: "signal", id: "XW8", groupId: "t8", x: 384, facing: "toward-from", mount: "up", label: "XW8", protectedBlockSectionId: "section-XW8" },
		{ kind: "signal", id: "XE1", groupId: "t1", x: 464, facing: "toward-to", mount: "up", label: "XE1", protectedBlockSectionId: "section-XE1" },
		{ kind: "signal", id: "XE2", groupId: "t2", x: 464, facing: "toward-to", mount: "up", label: "XE2", protectedBlockSectionId: "section-XE2" },
		{ kind: "signal", id: "XE3", groupId: "t3", x: 464, facing: "toward-to", mount: "up", label: "XE3", protectedBlockSectionId: "section-XE3" },
		{ kind: "signal", id: "XE4", groupId: "t4", x: 464, facing: "toward-to", mount: "up", label: "XE4", protectedBlockSectionId: "section-XE4" },
		{ kind: "signal", id: "XE5", groupId: "t5", x: 464, facing: "toward-to", mount: "up", label: "XE5", protectedBlockSectionId: "section-XE5" },
		{ kind: "signal", id: "XE6", groupId: "t6", x: 464, facing: "toward-to", mount: "up", label: "XE6", protectedBlockSectionId: "section-XE6" },
		{ kind: "signal", id: "XE7", groupId: "t7", x: 464, facing: "toward-to", mount: "up", label: "XE7", protectedBlockSectionId: "section-XE7" },
		{ kind: "signal", id: "XE8", groupId: "t8", x: 464, facing: "toward-to", mount: "up", label: "XE8", protectedBlockSectionId: "section-XE8" },

		// --- platforms. Same positional rule as signals: an x along a track
		// group, resolved by assemblePieces rather than named by edge id.
		{ kind: "platform", stationCode: "JNG", groupId: "t1", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t2", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t3", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t4", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t5", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t6", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t7", x: 424 },
		{ kind: "platform", stationCode: "JNG", groupId: "t8", x: 424 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t1", x: 136 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t1", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t2", x: 136 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t2", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t3", x: 136 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t3", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t4", x: 136 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t4", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t5", x: 360 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t5", x: 432 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t6", x: 136 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t7", x: 136 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t7", x: 536 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t8", x: 280 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t8", x: 392 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t5ap", x: 920 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t5ap", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t6am", x: 888 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t6am", x: 952 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t5ac", x: 632 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t5ac", x: 776 },
		{ kind: "platform", stationCode: "JNG-W", groupId: "t5y", x: 536 },
		{ kind: "platform", stationCode: "JNG-E", groupId: "t5y", x: 552 },
	],

	// Which lever works each switch. Geometry decides WHERE a switch is and
	// which way it dashes; it cannot know which lever owns it.
	switchMeta: {
		"xov1:from": { controlGroupId: "PC1" },
		"xov5:from": { controlGroupId: "PC10" },
		"xov6:to": { controlGroupId: "PC11" },
		"xov23:to": { controlGroupId: "PC17" },
		"xov25:to": { controlGroupId: "PC18" },
		"xov1:to": { controlGroupId: "PC1" },
		"xov2:from": { controlGroupId: "PC2" },
		"xov6:from": { controlGroupId: "PC11" },
		"xov5:to": { controlGroupId: "PC10" },
		"xov26:from": { controlGroupId: "PC12" },
		"xov21:to": { controlGroupId: "PC13" },
		"xov23:from": { controlGroupId: "PC17" },
		"xov22:to": { controlGroupId: "PC16" },
		"xov25:from": { controlGroupId: "PC18" },
		"xov2:to": { controlGroupId: "PC2" },
		"xov3:from": { controlGroupId: "PC3" },
		"xov4:to": { controlGroupId: "PC4" },
		"xov26:to": { controlGroupId: "PC12" },
		"xov19:to": { controlGroupId: "PC14" },
		"xov21:from": { controlGroupId: "PC13" },
		"xov20:to": { controlGroupId: "PC15" },
		"xov22:from": { controlGroupId: "PC16" },
		"xov24:from": { controlGroupId: "PC19" },
		"xov28:from": { controlGroupId: "PC20" },
		"xov4:from": { controlGroupId: "PC4" },
		"xov3:to": { controlGroupId: "PC3" },
		"xov7:to": { controlGroupId: "PC7" },
		"xov11:from": { controlGroupId: "PC9" },
		"xov15b:to": { controlGroupId: "g29", label: "sw 29" },
		"xov19:from": { controlGroupId: "PC14" },
		"xov16:to": { controlGroupId: "PC22", label: "PC22" },
		"xov20:from": { controlGroupId: "PC15" },
		"xov24:to": { controlGroupId: "PC19" },
		"xov27:from": { controlGroupId: "g34", label: "sw 34" },
		// INVERTED point at AU8: the diagonal runs straight through, the
		// terminating t5ac is the leg that diverges.
		"xov27:to": { controlGroupId: "g53", label: "sw 58", branch: "line" },
		// INVERTED point at AW6: the diagonal runs straight through to BM2, the
		// terminating t6am is the leg that diverges.
		"xov30:from": { controlGroupId: "g55", label: "sw 57", branch: "line" },
		"xov31:from": { controlGroupId: "PC23" },
		"xov31:to": { controlGroupId: "PC23" },
		"xov32:from": { controlGroupId: "PC24" },
		"xov32:to": { controlGroupId: "PC24" },
		// PC21: the two inverted points at each end of the flat t5y connector,
		// worked together so the whole path is set by one lever.
		"xov15:to": { controlGroupId: "PC21", label: "PC21", branch: "line" },
		"xov18:to": { controlGroupId: "PC21", label: "PC21", branch: "line" },
		"xov28:to": { controlGroupId: "PC20" },
		"xov29:from": { controlGroupId: "g36", label: "sw 36" },
		"xov11:to": { controlGroupId: "PC9" },
		"xov8:from": { controlGroupId: "PC6" },
		"xov9:to": { controlGroupId: "PC5" },
		"xov7:from": { controlGroupId: "PC7" },
		"xov10:from": { controlGroupId: "g43", label: "sw 43" },
		"xov14:to": { controlGroupId: "g44", label: "sw 44" },
		"xov9:from": { controlGroupId: "PC5" },
		"xov8:to": { controlGroupId: "PC6" },
		"xov12:from": { controlGroupId: "PC8" },
		"xov13:to": { controlGroupId: "g49", label: "sw 49" },
		"xov16:from": { controlGroupId: "PC22", label: "PC22" },
		"xov12:to": { controlGroupId: "PC8" },
	},

	passthrough: {
		controlGroups: JATINEGARA_CONTROL_GROUPS,
	},
};

export const JATINEGARA_ASSEMBLED = assemblePieces(JATINEGARA_PIECES);
