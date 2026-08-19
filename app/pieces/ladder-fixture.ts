// Ladder fixture, authored as PIECES (Phase 9 Step 4).
//
// Acceptance: assembling this must produce an IR structurally identical to the
// hand-authored app/topologies/ladder-fixture.ts. Verify with:
//   npm run diff:ir -- ladder-fixture pieces:ladder-fixture
//
//   approach ── SWa ── line1 (y=200) ── SWb ── exit
//                  └── line2 (y=300, loop) ──┘
//
// This is the piece model's first real test: the loop attaches through
// switches at BOTH ends. Note what the author does NOT write — the six
// edge-end references (common/normal/reversed x 2 switches) are derived from
// what physically meets at each point.

import { assemblePieces, type PieceSet } from "../lib/pieces";

const section = (signalId: string) => `section-${signalId}`;

export const LADDER_FIXTURE_PIECES: PieceSet = {
  pieces: [
    // --- the main line, split at the two switch points -------------------
    {
      kind: "track",
      id: "approach",
      groupId: "M",
      from: [0, 200],
      to: [300, 200],
      fromNode: "EN",
      toNode: "SWa",
      normalDirection: "right",
      renderSlots: [0],
    },
    {
      kind: "track",
      id: "line1",
      groupId: "M",
      from: [300, 200],
      to: [700, 200],
      fromNode: "SWa",
      toNode: "SWb",
      normalDirection: "right",
      renderSlots: [1],
    },
    {
      kind: "track",
      id: "exit",
      groupId: "M",
      from: [700, 200],
      to: [1000, 200],
      fromNode: "SWb",
      toNode: "EX",
      normalDirection: "right",
      renderSlots: [2],
    },

    // --- the passing loop -------------------------------------------------
    // Placed where the main line already runs, so it joins by position. Its
    // two switches are declared HERE, on the piece that creates them.
    {
      kind: "crossover",
      id: "line2",
      groupId: "L2",
      role: "loop",
      from: [300, 200],
      to: [700, 200],
      via: [
        { point: [450, 300], compatibilityNodeId: "l2m1" },
        { point: [550, 300], compatibilityNodeId: "l2m2" },
      ],
      renderSlots: [3, 4, 5],
      switches: [
        {
          id: 1,
          end: "from",
          initialState: "normal",
          controlGroupId: "ga",
          dashSide: "left",
          label: "ladder west",
        },
        {
          id: 2,
          end: "to",
          initialState: "normal",
          controlGroupId: "gb",
          dashSide: "right",
          label: "ladder east",
        },
      ],
    },
  ],
  passthrough: {
    groupMeta: {
      M: { role: "main", normalDirection: "right" },
      L2: { role: "loop" },
    },
    controlGroups: [
      { id: "ga", switchIds: [1], coupled: false },
      { id: "gb", switchIds: [2], coupled: false },
    ],
    signals: [
      { id: "E1", edgeId: "approach", segmentIndex: 0, offset: 100, facing: "toward-to", mount: "up", label: "ladder entrance", protectedBlockSectionId: section("E1") },
      { id: "J1", edgeId: "line1", segmentIndex: 0, offset: 100, facing: "toward-to", mount: "up", label: "line 1 exit", protectedBlockSectionId: section("J1") },
      { id: "J2", edgeId: "line2", segmentIndex: 1, offset: 25, facing: "toward-to", mount: "up", label: "line 2 exit", protectedBlockSectionId: section("J2") },
    ],
    blockSections: [
      { id: section("E1"), signalId: "E1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "approach", from: { kind: "signal", signalId: "E1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "line1", from: { kind: "edge-end", end: "from" }, to: { kind: "signal", signalId: "J1" } }] },
      { id: section("J1"), signalId: "J1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "line1", from: { kind: "signal", signalId: "J1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "exit", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
      { id: section("J2"), signalId: "J2", coverage: "whole-track-group", edgeRanges: [{ edgeId: "line2", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
    ],
    stationStopPoints: [
      { stationCode: "A", edgeId: "approach", segmentIndex: 0, offset: 50 },
      { stationCode: "B", edgeId: "exit", segmentIndex: 0, offset: 50 },
    ],
    // Authored, not geometric: the loop midpoints interleave between the main
    // nodes, which no derivation from placement would reproduce.
    legacyNodeOrder: ["EN", "SWa", "l2m1", "l2m2", "SWb", "EX"],
  },
};

export const LADDER_FIXTURE_ASSEMBLED = assemblePieces(LADDER_FIXTURE_PIECES);
