// Phase 6 fixture — a flying junction: a level-1 ramp (viaduct) carries one
// corridor from the top main OVER the middle main and down onto the bottom
// main, WITHOUT a flat crossing. The ramp's geometry crosses the middle line
// on the map, but at a different grade level, so it neither connects nor
// conflicts with it.
//
//   lineA (y=89, westbound):   aL ────────────── s1(1000) ────────────── aR
//   lineM (y=147, westbound):  mL ───────────────────────────────────── mR
//   ramp  (level 1):                      s1 ──── (crosses lineM at 800,147) ──── s2
//   lineB (y=205, westbound):  bL ────────────── s2(600) ────────────── bR
//
// Signals: A1/A2 (line A), M1 (line M), B1/B2 (line B), R1 on the ramp.
// A train on the ramp must neither conflict with nor occupy a train on line M
// beneath it; a route must be settable through the ramp.

import type { TopologyDefinition } from "../lib/topology";

const section = (signalId: string) => `section-${signalId}`;

export const FLYOVER_FIXTURE_TOPOLOGY: TopologyDefinition = {
  nodes: [
    { id: "aL", point: [100, 89], kind: "boundary" },
    { id: "aR", point: [1600, 89], kind: "boundary" },
    { id: "s1", point: [1000, 89], kind: "switch" },
    { id: "mL", point: [100, 147], kind: "boundary" },
    { id: "mR", point: [1600, 147], kind: "boundary" },
    { id: "bL", point: [100, 205], kind: "boundary" },
    { id: "bR", point: [1600, 205], kind: "boundary" },
    { id: "s2", point: [600, 205], kind: "switch" },
  ],
  edges: [
    { id: "lineA-east", from: "aR", to: "s1", geometry: [{ point: [1600, 89] }, { point: [1000, 89] }], role: "main", trackGroupId: "lineA", normalDirection: "left", renderSlots: [0] },
    { id: "lineA-west", from: "s1", to: "aL", geometry: [{ point: [1000, 89] }, { point: [100, 89] }], role: "main", trackGroupId: "lineA", normalDirection: "left", renderSlots: [1] },
    { id: "lineM", from: "mL", to: "mR", geometry: [{ point: [100, 147] }, { point: [1600, 147] }], role: "main", trackGroupId: "lineM", normalDirection: "left", renderSlots: [2] },
    { id: "lineB-east", from: "bR", to: "s2", geometry: [{ point: [1600, 205] }, { point: [600, 205] }], role: "main", trackGroupId: "lineB", normalDirection: "left", renderSlots: [3] },
    { id: "lineB-west", from: "s2", to: "bL", geometry: [{ point: [600, 205] }, { point: [100, 205] }], role: "main", trackGroupId: "lineB", normalDirection: "left", renderSlots: [4] },
    // the viaduct ramp: level 1, from the top main down over the middle main
    { id: "ramp", from: "s1", to: "s2", geometry: [{ point: [1000, 89] }, { point: [600, 205] }], role: "crossover", trackGroupId: "ramp", level: 1, renderSlots: [5] },
  ],
  switches: [
    { id: 1, nodeId: "s1", common: { edgeId: "lineA-east", end: "to" }, normal: { edgeId: "lineA-west", end: "from" }, reversed: { edgeId: "ramp", end: "from" }, initialState: "normal", controlGroupId: "g1", dashSide: "left", label: "ramp west" },
    { id: 2, nodeId: "s2", common: { edgeId: "lineB-east", end: "to" }, normal: { edgeId: "lineB-west", end: "from" }, reversed: { edgeId: "ramp", end: "to" }, initialState: "normal", controlGroupId: "g2", dashSide: "right", label: "ramp east" },
  ],
  controlGroups: [
    { id: "g1", switchIds: [1], coupled: false },
    { id: "g2", switchIds: [2], coupled: false },
  ],
  signals: [
    { id: "A1", edgeId: "lineA-east", segmentIndex: 0, offset: 300, facing: "toward-to", mount: "up", label: "line A east", protectedBlockSectionId: section("A1") },
    { id: "A2", edgeId: "lineA-west", segmentIndex: 0, offset: 700, facing: "toward-to", mount: "up", label: "line A west", protectedBlockSectionId: section("A2") },
    { id: "M1", edgeId: "lineM", segmentIndex: 0, offset: 800, facing: "toward-from", mount: "up", label: "line M", protectedBlockSectionId: section("M1") },
    { id: "B1", edgeId: "lineB-east", segmentIndex: 0, offset: 300, facing: "toward-to", mount: "up", label: "line B east", protectedBlockSectionId: section("B1") },
    { id: "B2", edgeId: "lineB-west", segmentIndex: 0, offset: 300, facing: "toward-to", mount: "up", label: "line B west", protectedBlockSectionId: section("B2") },
    { id: "R1", edgeId: "ramp", segmentIndex: 0, offset: 164.46, facing: "toward-to", mount: "up", label: "ramp", protectedBlockSectionId: section("R1") },
  ],
  trackGroups: [
    { id: "lineA", role: "main", edgeIds: ["lineA-east", "lineA-west"], normalDirection: "left" },
    { id: "lineM", role: "main", edgeIds: ["lineM"], normalDirection: "left" },
    { id: "lineB", role: "main", edgeIds: ["lineB-east", "lineB-west"], normalDirection: "left" },
    { id: "ramp", role: "crossover", edgeIds: ["ramp"] },
  ],
  blockSections: [
    { id: section("A1"), signalId: "A1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineA-east", from: { kind: "signal", signalId: "A1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "lineA-west", from: { kind: "edge-end", end: "from" }, to: { kind: "signal", signalId: "A2" } }] },
    { id: section("A2"), signalId: "A2", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineA-west", from: { kind: "signal", signalId: "A2" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
    { id: section("M1"), signalId: "M1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineM", from: { kind: "signal", signalId: "M1" }, to: { kind: "edge-end", end: "from" } }], legacyOpenEnd: "west" },
    { id: section("B1"), signalId: "B1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineB-east", from: { kind: "signal", signalId: "B1" }, to: { kind: "edge-end", end: "to" } }, { edgeId: "lineB-west", from: { kind: "edge-end", end: "from" }, to: { kind: "signal", signalId: "B2" } }] },
    { id: section("B2"), signalId: "B2", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "lineB-west", from: { kind: "signal", signalId: "B2" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
    { id: section("R1"), signalId: "R1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "ramp", from: { kind: "signal", signalId: "R1" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "west" },
  ],
  stationStopPoints: [
    { stationCode: "A", edgeId: "lineA-east", segmentIndex: 0, offset: 200 },
    { stationCode: "B", edgeId: "lineB-west", segmentIndex: 0, offset: 200 },
  ],
  legacyNodeOrder: ["aL", "aR", "s1", "mL", "mR", "bL", "bR", "s2"],
};
