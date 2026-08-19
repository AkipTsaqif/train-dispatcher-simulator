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
// Acceptance: npm run diff:ir -- jatinegara pieces:jatinegara

import { assemblePieces, type PieceSet } from "../lib/pieces";
import {
  JATINEGARA_BLOCK_SECTIONS,
  JATINEGARA_CONTROL_GROUPS,
  JATINEGARA_SIGNALS,
  JATINEGARA_STOP_POINTS,
  JATINEGARA_LEGACY_NODE_ORDER,
} from "./jatinegara-data";

export const JATINEGARA_PIECES: PieceSet = {
  pieces: [
    // --- running lines, at their true drawn extents ------------------------
    { kind: "line", id: "t1", y: 496, from: 32, to: 1120, normalDirection: "right", endNodes: { west: "n1", east: "n2" } },
    { kind: "line", id: "t2", y: 464, from: 32, to: 1120, normalDirection: "left", bidirectional: true, endNodes: { west: "n3", east: "n4" } },
    { kind: "line", id: "t3", y: 432, from: 32, to: 1120, normalDirection: "right", endNodes: { west: "n5", east: "n6" } },
    { kind: "line", id: "t4", y: 400, from: 32, to: 1120, normalDirection: "left", endNodes: { west: "n7", east: "n8" } },
    { kind: "line", id: "t5", y: 368, from: 336, to: 528, normalDirection: "left", bidirectional: true },
    { kind: "line", id: "t6", y: 336, from: 32, to: 592, normalDirection: "right", bidirectional: true, endNodes: { west: "n9" } },
    { kind: "line", id: "t7", y: 304, from: 32, to: 688, normalDirection: "left", bidirectional: true, endNodes: { west: "n10" } },
    { kind: "line", id: "t8", y: 272, from: 224, to: 528, normalDirection: "left", bidirectional: true, endNodes: { west: "n11" } },
    { kind: "line", id: "t5ap", y: 368, from: 1040, to: 1120, normalDirection: "right", endNodes: { east: "n12" } },
    { kind: "line", id: "t6am", y: 336, from: 1008, to: 1120, normalDirection: "right", endNodes: { east: "n13" } },
    { kind: "line", id: "t5ac", y: 368, from: 752, to: 976, normalDirection: "right", endNodes: { east: "n14" } },
    { kind: "line", id: "t5y", y: 368, from: 624, to: 656, normalDirection: "right", endNodes: { west: "n15" } },
    { kind: "line", id: "t6ab", y: 336, from: 688, to: 720, normalDirection: "right", endNodes: { east: "n16" } },

    // --- diagonals. An end landing INSIDE a line is a switch; an end
    // landing at a line extremity is a fixed track turn. 29 diagonals,
    // 58 ends, 48 switches - the other 10 are turns.
    { kind: "link", id: "xov1", from: [112, 496], to: [144, 464] },
    { kind: "link", id: "xov2", from: [176, 464], to: [208, 432] },
    { kind: "link", id: "xov3", from: [240, 432], to: [272, 400] },
    { kind: "link", id: "xov4", from: [240, 400], to: [272, 432] },
    { kind: "link", id: "xov5", from: [336, 496], to: [368, 464] },
    { kind: "link", id: "xov6", from: [336, 464], to: [368, 496] },
    { kind: "link", id: "xov7", from: [240, 336], to: [304, 400] },
    { kind: "link", id: "xov8", from: [176, 336], to: [208, 304] },
    { kind: "link", id: "xov9", from: [176, 304], to: [208, 336] },
    { kind: "link", id: "xov10", from: [304, 336], to: [336, 368] },
    { kind: "link", id: "xov11", from: [336, 400], to: [368, 368] },
    { kind: "link", id: "xov12", from: [304, 304], to: [336, 272] },
    { kind: "link", id: "xov13", from: [528, 272], to: [560, 304] },
    { kind: "link", id: "xov14", from: [528, 368], to: [560, 336] },
    { kind: "link", id: "xov15", from: [592, 336], to: [656, 400] },
    { kind: "link", id: "xov16", from: [624, 304], to: [720, 400] },
    { kind: "link", id: "xov17", from: [656, 368], to: [688, 336] },
    { kind: "link", id: "xov18", from: [688, 304], to: [752, 368] },
    { kind: "link", id: "xov19", from: [688, 400], to: [720, 432] },
    { kind: "link", id: "xov20", from: [752, 400], to: [784, 432] },
    { kind: "link", id: "xov21", from: [752, 432], to: [784, 464] },
    { kind: "link", id: "xov22", from: [816, 432], to: [848, 464] },
    { kind: "link", id: "xov23", from: [816, 464], to: [848, 496] },
    { kind: "link", id: "xov24", from: [880, 432], to: [912, 400] },
    { kind: "link", id: "xov25", from: [880, 464], to: [912, 496] },
    { kind: "link", id: "xov26", from: [624, 464], to: [656, 432] },
    { kind: "link", id: "xov27", from: [944, 400], to: [1008, 336] },
    { kind: "link", id: "xov28", from: [944, 432], to: [976, 400] },
    { kind: "link", id: "xov29", from: [1008, 400], to: [1040, 368] },
  ],

  // Which lever works each switch. Geometry decides WHERE a switch is and
  // which way it dashes; it cannot know which lever owns it.
  switchMeta: {
    1: { controlGroupId: "PC1" },
    2: { controlGroupId: "PC10" },
    3: { controlGroupId: "PC11" },
    4: { controlGroupId: "PC17" },
    5: { controlGroupId: "PC18" },
    6: { controlGroupId: "PC1" },
    7: { controlGroupId: "PC2" },
    8: { controlGroupId: "PC11" },
    9: { controlGroupId: "PC10" },
    10: { controlGroupId: "PC12" },
    11: { controlGroupId: "PC13" },
    12: { controlGroupId: "PC17" },
    13: { controlGroupId: "PC16" },
    14: { controlGroupId: "PC18" },
    15: { controlGroupId: "PC2" },
    16: { controlGroupId: "PC3" },
    17: { controlGroupId: "PC4" },
    18: { controlGroupId: "PC12" },
    19: { controlGroupId: "PC14" },
    20: { controlGroupId: "PC13" },
    21: { controlGroupId: "PC15" },
    22: { controlGroupId: "PC16" },
    23: { controlGroupId: "PC19" },
    24: { controlGroupId: "PC20" },
    25: { controlGroupId: "PC4" },
    26: { controlGroupId: "PC3" },
    27: { controlGroupId: "PC7" },
    28: { controlGroupId: "PC9" },
    29: { controlGroupId: "g29", label: "sw 29" },
    30: { controlGroupId: "PC14" },
    31: { controlGroupId: "g31", label: "sw 31" },
    32: { controlGroupId: "PC15" },
    33: { controlGroupId: "PC19" },
    34: { controlGroupId: "g34", label: "sw 34" },
    35: { controlGroupId: "PC20" },
    36: { controlGroupId: "g36", label: "sw 36" },
    38: { controlGroupId: "PC9" },
    40: { controlGroupId: "PC6" },
    41: { controlGroupId: "PC5" },
    42: { controlGroupId: "PC7" },
    43: { controlGroupId: "g43", label: "sw 43" },
    44: { controlGroupId: "g44", label: "sw 44" },
    46: { controlGroupId: "PC5" },
    47: { controlGroupId: "PC6" },
    48: { controlGroupId: "PC8" },
    49: { controlGroupId: "g49", label: "sw 49" },
    50: { controlGroupId: "g50", label: "sw 50" },
    52: { controlGroupId: "PC8" },
  },

  passthrough: {
    controlGroups: JATINEGARA_CONTROL_GROUPS,
    signals: JATINEGARA_SIGNALS,
    blockSections: JATINEGARA_BLOCK_SECTIONS,
    stationStopPoints: JATINEGARA_STOP_POINTS,
    legacyNodeOrder: JATINEGARA_LEGACY_NODE_ORDER,
  },
};

export const JATINEGARA_ASSEMBLED = assemblePieces(JATINEGARA_PIECES);
