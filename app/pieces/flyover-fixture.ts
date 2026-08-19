// Flyover fixture, authored as PIECES (Phase 9 Step 5).
//
// Acceptance: npm run diff:ir -- flyover-fixture pieces:flyover-fixture
//
//   lineA (y=89):   aL ────────── s1(1000) ────────── aR
//   lineM (y=147):  mL ─────────────────────────────── mR
//   ramp (level 1):          s1 ──(over lineM)── s2
//   lineB (y=205):  bL ────────── s2(600) ────────── bR
//
// The graded link is the whole point: the ramp crosses lineM's geometry at
// (800,147) but carries level 1, so the ports never join and the tracks
// neither connect nor conflict. The author writes `level: 1` on one piece —
// no other piece mentions the crossing at all.

import { assemblePieces, type PieceSet } from "../lib/pieces";

const section = (signalId: string) => `section-${signalId}`;

export const FLYOVER_FIXTURE_PIECES: PieceSet = {
  pieces: [
    // line A, split at the ramp's upper junction
    { kind: "track", id: "lineA-east", groupId: "lineA", from: [1600, 89], to: [1000, 89], fromNode: "aR", toNode: "s1", normalDirection: "left", renderSlots: [0] },
    { kind: "track", id: "lineA-west", groupId: "lineA", from: [1000, 89], to: [100, 89], fromNode: "s1", toNode: "aL", normalDirection: "left", renderSlots: [1] },

    // the middle main, passed OVER — it knows nothing about the ramp
    { kind: "track", id: "lineM", groupId: "lineM", from: [100, 147], to: [1600, 147], fromNode: "mL", toNode: "mR", normalDirection: "left", renderSlots: [2] },

    // line B, split at the ramp's lower junction
    { kind: "track", id: "lineB-east", groupId: "lineB", from: [1600, 205], to: [600, 205], fromNode: "bR", toNode: "s2", normalDirection: "left", renderSlots: [3] },
    { kind: "track", id: "lineB-west", groupId: "lineB", from: [600, 205], to: [100, 205], fromNode: "s2", toNode: "bL", normalDirection: "left", renderSlots: [4] },

    // the viaduct: a graded link from line A down onto line B
    {
      kind: "crossover",
      id: "ramp",
      groupId: "ramp",
      level: 1,
      from: [1000, 89],
      to: [600, 205],
      renderSlots: [5],
      switches: [
        { id: 1, end: "from", initialState: "normal", controlGroupId: "g1", dashSide: "left", label: "ramp west" },
        { id: 2, end: "to", initialState: "normal", controlGroupId: "g2", dashSide: "right", label: "ramp east" },
      ],
    },

    { kind: "platform", stationCode: "A", groupId: "lineA", x: 1400 },
    { kind: "platform", stationCode: "B", groupId: "lineB", x: 400 },

    // signals placed by position on their own line
    { kind: "signal", id: "A1", groupId: "lineA", x: 1300, facing: "toward-to", mount: "up", label: "line A east", protectedBlockSectionId: section("A1") },
    { kind: "signal", id: "A2", groupId: "lineA", x: 300, facing: "toward-to", mount: "up", label: "line A west", protectedBlockSectionId: section("A2") },
    { kind: "signal", id: "M1", groupId: "lineM", x: 900, facing: "toward-from", mount: "up", label: "line M", protectedBlockSectionId: section("M1") },
    { kind: "signal", id: "B1", groupId: "lineB", x: 1300, facing: "toward-to", mount: "up", label: "line B east", protectedBlockSectionId: section("B1") },
    { kind: "signal", id: "B2", groupId: "lineB", x: 300, facing: "toward-to", mount: "up", label: "line B west", protectedBlockSectionId: section("B2") },
    // The ramp is DIAGONAL, so an x does not identify the point exactly; the
    // positional `at` form pins the authored offset without an edge-id
    // reference.
    { kind: "signal", id: "R1", groupId: "ramp", at: { edgeIndex: 0, segmentIndex: 0, offset: 164.46 }, facing: "toward-to", mount: "up", label: "ramp", protectedBlockSectionId: section("R1") },
  ],
  passthrough: {
    groupMeta: {
      lineA: { role: "main", normalDirection: "left" },
      lineM: { role: "main", normalDirection: "left" },
      lineB: { role: "main", normalDirection: "left" },
      ramp: { role: "crossover" },
    },
    controlGroups: [
      { id: "g1", switchIds: [1], coupled: false },
      { id: "g2", switchIds: [2], coupled: false },
    ],
    blockSections: [
      { id: section("A1"), signalId: "A1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineA-east", from: { kind: "signal", signalId: "A1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "lineA-west", from: { kind: "edge-end", end: "from" }, to: { kind: "signal", signalId: "A2" } }] },
      { id: section("A2"), signalId: "A2", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineA-west", from: { kind: "signal", signalId: "A2" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
      { id: section("M1"), signalId: "M1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineM", from: { kind: "signal", signalId: "M1" }, to: { kind: "edge-end", end: "from" } }], legacyOpenEnd: "west" },
      { id: section("B1"), signalId: "B1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineB-east", from: { kind: "signal", signalId: "B1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "lineB-west", from: { kind: "edge-end", end: "from" }, to: { kind: "signal", signalId: "B2" } }] },
      { id: section("B2"), signalId: "B2", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineB-west", from: { kind: "signal", signalId: "B2" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
      { id: section("R1"), signalId: "R1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "ramp", from: { kind: "signal", signalId: "R1" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
    ],
    legacyNodeOrder: ["aL", "aR", "s1", "mL", "mR", "bL", "bR", "s2"],
  },
};

export const FLYOVER_FIXTURE_ASSEMBLED = assemblePieces(FLYOVER_FIXTURE_PIECES);
