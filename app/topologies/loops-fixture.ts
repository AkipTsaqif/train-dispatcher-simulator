// Phase 3 fixture — two independent sidings that SHARE a compatibility Y
// (both at y=300), one of them (S2) built from TWO chained edges. Proves:
//   • each loop owns its own occupancy envelope (a train in S1 must not redden
//     S2's signals, and vice versa),
//   • two loops may share a Y without overwriting each other,
//   • a multi-edge loop traverses end-to-end.
//
//   Main M (rightbound, y=200):  A ── SW1a ── SW1b ── SW2a ── SW2b ── B
//   Siding S1 (single edge, y=300):     SW1a ═════ SW1b   (dips to y=300)
//   Siding S2 (two edges,  y=300):               SW2a ═════ SW2b

import type { TopologyDefinition } from "../lib/topology";

const section = (signalId: string) => `section-${signalId}`;

export const LOOPS_FIXTURE_TOPOLOGY: TopologyDefinition = {
  nodes: [
    { id: "A", point: [0, 200], kind: "boundary" },
    { id: "B", point: [1000, 200], kind: "boundary" },
    { id: "SW1a", point: [300, 200], kind: "switch" },
    { id: "SW1b", point: [400, 200], kind: "switch" },
    { id: "SW2a", point: [600, 200], kind: "switch" },
    { id: "S2h", point: [750, 300], kind: "boundary" },
    { id: "SW2b", point: [800, 200], kind: "switch" },
  ],
  edges: [
    { id: "m0", from: "A", to: "SW1a", geometry: [{ point: [0, 200] }, { point: [300, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [0] },
    { id: "m1", from: "SW1a", to: "SW1b", geometry: [{ point: [300, 200] }, { point: [400, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [1] },
    { id: "m2", from: "SW1b", to: "SW2a", geometry: [{ point: [400, 200] }, { point: [600, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [2] },
    { id: "m3", from: "SW2a", to: "SW2b", geometry: [{ point: [600, 200] }, { point: [800, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [3] },
    { id: "m4", from: "SW2b", to: "B", geometry: [{ point: [800, 200] }, { point: [1000, 200] }], role: "main", trackGroupId: "M", normalDirection: "right", renderSlots: [4] },
    // Siding S1 — a single edge dipping to y=300 (ramp, horizontal, ramp)
    { id: "s1", from: "SW1a", to: "SW1b", geometry: [{ point: [300, 200] }, { point: [350, 300], compatibilityNodeId: "s1m1" }, { point: [380, 300], compatibilityNodeId: "s1m2" }, { point: [400, 200] }], role: "loop", trackGroupId: "S1", renderSlots: [5, 6, 7] },
    // Siding S2 — TWO chained edges: a ramp+horizontal, then a ramp back up
    { id: "s2a", from: "SW2a", to: "S2h", geometry: [{ point: [600, 200] }, { point: [650, 300], compatibilityNodeId: "s2m" }, { point: [750, 300] }], role: "loop", trackGroupId: "S2", renderSlots: [8, 9] },
    { id: "s2b", from: "S2h", to: "SW2b", geometry: [{ point: [750, 300] }, { point: [800, 200] }], role: "loop", trackGroupId: "S2", renderSlots: [10] },
  ],
  switches: [
    { id: 1, nodeId: "SW1a", common: { edgeId: "m0", end: "to" }, normal: { edgeId: "m1", end: "from" }, reversed: { edgeId: "s1", end: "from" }, initialState: "normal", controlGroupId: "g1", dashSide: "left", label: "S1 west" },
    { id: 2, nodeId: "SW1b", common: { edgeId: "m1", end: "to" }, normal: { edgeId: "m2", end: "from" }, reversed: { edgeId: "s1", end: "to" }, initialState: "normal", controlGroupId: "g2", dashSide: "right", label: "S1 east" },
    { id: 3, nodeId: "SW2a", common: { edgeId: "m2", end: "to" }, normal: { edgeId: "m3", end: "from" }, reversed: { edgeId: "s2a", end: "from" }, initialState: "normal", controlGroupId: "g3", dashSide: "left", label: "S2 west" },
    { id: 4, nodeId: "SW2b", common: { edgeId: "m3", end: "to" }, normal: { edgeId: "m4", end: "from" }, reversed: { edgeId: "s2b", end: "to" }, initialState: "normal", controlGroupId: "g4", dashSide: "right", label: "S2 east" },
  ],
  controlGroups: [
    { id: "g1", switchIds: [1], coupled: false },
    { id: "g2", switchIds: [2], coupled: false },
    { id: "g3", switchIds: [3], coupled: false },
    { id: "g4", switchIds: [4], coupled: false },
  ],
  signals: [
    { id: "J1", edgeId: "s1", segmentIndex: 1, offset: 15, facing: "toward-to", mount: "up", label: "S1 loop", protectedBlockSectionId: section("J1") },
    { id: "J2", edgeId: "s2a", segmentIndex: 1, offset: 25, facing: "toward-to", mount: "up", label: "S2 loop", protectedBlockSectionId: section("J2") },
  ],
  trackGroups: [
    { id: "M", role: "main", edgeIds: ["m0", "m1", "m2", "m3", "m4"], normalDirection: "right" },
    { id: "S1", role: "loop", edgeIds: ["s1"] },
    { id: "S2", role: "loop", edgeIds: ["s2a", "s2b"] },
  ],
  blockSections: [
    { id: section("J1"), signalId: "J1", coverage: "whole-track-group", edgeRanges: [{ edgeId: "s1", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
    { id: section("J2"), signalId: "J2", coverage: "whole-track-group", edgeRanges: [{ edgeId: "s2a", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "s2b", from: { kind: "edge-end", end: "from" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
  ],
  stationStopPoints: [
    { stationCode: "A", edgeId: "m0", segmentIndex: 0, offset: 50 },
    { stationCode: "B", edgeId: "m4", segmentIndex: 0, offset: 50 },
  ],
  legacyNodeOrder: ["A", "SW1a", "s1m1", "s1m2", "SW1b", "SW2a", "s2m", "S2h", "SW2b", "B"],
};
