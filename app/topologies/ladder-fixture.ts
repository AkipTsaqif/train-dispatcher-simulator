// Phase 4 fixture — a ladder: an entrance with TWO valid paths (a main line
// and a passing loop) to two different exit signals. Proves findRoute chooses
// a free path among alternatives, and that flank points are detected.
//
//   approach ── SWa ── line1 (y=200) ── SWb ── exit
//                  └── line2 (y=300, loop) ──┘
//
// Entrance signal E1 on the approach; exit signals J1 (line1) and J2 (line2).

import type { TopologyDefinition } from "../lib/topology";

const section = (signalId: string) => `section-${signalId}`;

export const LADDER_FIXTURE_TOPOLOGY: TopologyDefinition = {
  nodes: [
    { id: "EN", point: [0, 200], kind: "boundary" },
    { id: "EX", point: [1000, 200], kind: "boundary" },
    { id: "SWa", point: [300, 200], kind: "switch" },
    { id: "SWb", point: [700, 200], kind: "switch" },
  ],
  edges: [
    { id: "approach", from: "EN", to: "SWa", geometry: [{ point: [0, 200] }, { point: [300, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [0] },
    { id: "line1", from: "SWa", to: "SWb", geometry: [{ point: [300, 200] }, { point: [700, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [1] },
    { id: "exit", from: "SWb", to: "EX", geometry: [{ point: [700, 200] }, { point: [1000, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [2] },
    { id: "line2", from: "SWa", to: "SWb", geometry: [{ point: [300, 200] }, { point: [450, 300], compatibilityNodeId: "l2m1" }, { point: [550, 300], compatibilityNodeId: "l2m2" }, { point: [700, 200] }], role: "loop", trackGroupId: "L2", renderSlots: [3, 4, 5] },
  ],
  switches: [
    { id: 1, nodeId: "SWa", common: { edgeId: "approach", end: "to" }, normal: { edgeId: "line1", end: "from" }, reversed: { edgeId: "line2", end: "from" }, initialState: "normal", controlGroupId: "ga", dashSide: "left", label: "ladder west" },
    { id: 2, nodeId: "SWb", common: { edgeId: "line1", end: "to" }, normal: { edgeId: "exit", end: "from" }, reversed: { edgeId: "line2", end: "to" }, initialState: "normal", controlGroupId: "gb", dashSide: "right", label: "ladder east" },
  ],
  controlGroups: [
    { id: "ga", switchIds: [1], coupled: false },
    { id: "gb", switchIds: [2], coupled: false },
  ],
  signals: [
    { id: "E1", edgeId: "approach", segmentIndex: 0, offset: 100, facing: "toward-to", mount: "up", label: "ladder entrance", protectedBlockSectionId: section("E1") },
    { id: "J1", edgeId: "line1", segmentIndex: 0, offset: 100, facing: "toward-to", mount: "up", label: "line 1 exit", protectedBlockSectionId: section("J1") },
    { id: "J2", edgeId: "line2", segmentIndex: 1, offset: 25, facing: "toward-to", mount: "up", label: "line 2 exit", protectedBlockSectionId: section("J2") },
  ],
  trackGroups: [
    { id: "M", role: "main", edgeIds: ["approach", "line1", "exit"], normalDirection: "right" },
    { id: "L2", role: "loop", edgeIds: ["line2"] },
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
  legacyNodeOrder: ["EN", "SWa", "l2m1", "l2m2", "SWb", "EX"],
};
