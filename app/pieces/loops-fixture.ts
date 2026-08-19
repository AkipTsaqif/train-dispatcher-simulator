// Loops fixture, authored as PIECES (Phase 9 Step 5).
//
// Acceptance: npm run diff:ir -- loops-fixture pieces:loops-fixture
//
//   Main M (rightbound, y=200):  A ── SW1a ── SW1b ── SW2a ── SW2b ── B
//   Siding S1 (single edge, y=300):     SW1a ═════ SW1b
//   Siding S2 (TWO chained edges):                SW2a ══ S2h ══ SW2b
//
// S2 is the piece model's multi-edge test: one `loop` piece with two segments,
// switches only on the OUTER ends, and the intermediate joint (S2h) named by
// the loop that owns it.

import { assemblePieces, type PieceSet } from "../lib/pieces";

const section = (signalId: string) => `section-${signalId}`;

const main = (
  id: string,
  from: readonly [number, number],
  to: readonly [number, number],
  fromNode: string,
  toNode: string,
  slot: number
) =>
  ({
    kind: "track" as const,
    id,
    groupId: "M",
    from,
    to,
    fromNode,
    toNode,
    normalDirection: "right" as const,
    renderSlots: [slot],
  });

export const LOOPS_FIXTURE_PIECES: PieceSet = {
  pieces: [
    main("m0", [0, 200], [300, 200], "A", "SW1a", 0),
    main("m1", [300, 200], [400, 200], "SW1a", "SW1b", 1),
    main("m2", [400, 200], [600, 200], "SW1b", "SW2a", 2),
    main("m3", [600, 200], [800, 200], "SW2a", "SW2b", 3),
    main("m4", [800, 200], [1000, 200], "SW2b", "B", 4),

    // S1 — one edge dipping to y=300 and back
    {
      kind: "loop",
      groupId: "S1",
      from: [300, 200],
      segments: [
        {
          id: "s1",
          to: [400, 200],
          via: [
            { point: [350, 300], compatibilityNodeId: "s1m1" },
            { point: [380, 300], compatibilityNodeId: "s1m2" },
          ],
          renderSlots: [5, 6, 7],
        },
      ],
      switches: [
        { id: 1, end: "from", initialState: "normal", controlGroupId: "g1", dashSide: "left", label: "S1 west" },
        { id: 2, end: "to", initialState: "normal", controlGroupId: "g2", dashSide: "right", label: "S1 east" },
      ],
    },

    // S2 — TWO chained edges; S2h is the loop's own intermediate node
    {
      kind: "loop",
      groupId: "S2",
      from: [600, 200],
      segments: [
        {
          id: "s2a",
          to: [750, 300],
          toNode: "S2h",
          via: [{ point: [650, 300], compatibilityNodeId: "s2m" }],
          renderSlots: [8, 9],
        },
        { id: "s2b", to: [800, 200], renderSlots: [10] },
      ],
      switches: [
        { id: 3, end: "from", initialState: "normal", controlGroupId: "g3", dashSide: "left", label: "S2 west" },
        { id: 4, end: "to", initialState: "normal", controlGroupId: "g4", dashSide: "right", label: "S2 east" },
      ],
    },

    { kind: "platform", stationCode: "A", groupId: "M", x: 50 },
    { kind: "platform", stationCode: "B", groupId: "M", x: 850 },
  ],
  passthrough: {
    groupMeta: {
      M: { role: "main", normalDirection: "right" },
      S1: { role: "loop" },
      S2: { role: "loop" },
    },
    controlGroups: [
      { id: "g1", switchIds: [1], coupled: false },
      { id: "g2", switchIds: [2], coupled: false },
      { id: "g3", switchIds: [3], coupled: false },
      { id: "g4", switchIds: [4], coupled: false },
    ],
    // Signals sit on the loops' horizontal shoulders — a diagonal-adjacent
    // placement, so they use the positional `at` form (still no edge id).
    signals: [
      { id: "J1", edgeId: "s1", segmentIndex: 1, offset: 15, facing: "toward-to", mount: "up", label: "S1 loop", protectedBlockSectionId: section("J1") },
      { id: "J2", edgeId: "s2a", segmentIndex: 1, offset: 25, facing: "toward-to", mount: "up", label: "S2 loop", protectedBlockSectionId: section("J2") },
    ],
    blockSections: [
      { id: section("J1"), signalId: "J1", coverage: "whole-track-group", edgeRanges: [{ edgeId: "s1", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
      { id: section("J2"), signalId: "J2", coverage: "whole-track-group", edgeRanges: [{ edgeId: "s2a", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "s2b", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
    ],
    legacyNodeOrder: ["A", "SW1a", "s1m1", "s1m2", "SW1b", "SW2a", "s2m", "S2h", "SW2b", "B"],
  },
};

export const LOOPS_FIXTURE_ASSEMBLED = assemblePieces(LOOPS_FIXTURE_PIECES);
