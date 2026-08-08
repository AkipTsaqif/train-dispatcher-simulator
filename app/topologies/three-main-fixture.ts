// Phase 2 fixture — three parallel main running lines (M1/M2/M3) with a toy
// timetable, proving layouts with more than two mains work. Not wired into the
// UI; verified by scripts/verify-three-main.ts.
//
//   M1  y=100  leftbound   A ───────────── B
//   M2  y=200  rightbound  A ───────────── B
//   M3  y=300  leftbound   A ───────────── B

import type { TopologyDefinition } from "../lib/topology";

const section = (signalId: string) => `section-${signalId}`;

export const THREE_MAIN_FIXTURE_TOPOLOGY: TopologyDefinition = {
  nodes: [
    { id: "A1", point: [0, 100], kind: "boundary" },
    { id: "B1", point: [1000, 100], kind: "boundary" },
    { id: "A2", point: [0, 200], kind: "boundary" },
    { id: "B2", point: [1000, 200], kind: "boundary" },
    { id: "A3", point: [0, 300], kind: "boundary" },
    { id: "B3", point: [1000, 300], kind: "boundary" },
  ],
  edges: [
    {
      id: "m1",
      from: "A1",
      to: "B1",
      geometry: [{ point: [0, 100] }, { point: [1000, 100] }],
      role: "main",
      trackGroupId: "M1",
      normalDirection: "left",
      renderSlots: [0],
    },
    {
      id: "m2",
      from: "A2",
      to: "B2",
      geometry: [{ point: [0, 200] }, { point: [1000, 200] }],
      role: "main",
      trackGroupId: "M2",
      normalDirection: "right",
      renderSlots: [1],
    },
    {
      id: "m3",
      from: "A3",
      to: "B3",
      geometry: [{ point: [0, 300] }, { point: [1000, 300] }],
      role: "main",
      trackGroupId: "M3",
      normalDirection: "left",
      renderSlots: [2],
    },
  ],
  switches: [],
  controlGroups: [],
  signals: [
    { id: "S1", edgeId: "m1", segmentIndex: 0, offset: 700, facing: "toward-from", mount: "up", label: "M1 westbound", protectedBlockSectionId: section("S1") },
    { id: "S2", edgeId: "m2", segmentIndex: 0, offset: 300, facing: "toward-to", mount: "up", label: "M2 eastbound", protectedBlockSectionId: section("S2") },
    { id: "S3", edgeId: "m3", segmentIndex: 0, offset: 700, facing: "toward-from", mount: "up", label: "M3 westbound", protectedBlockSectionId: section("S3") },
  ],
  trackGroups: [
    { id: "M1", role: "main", edgeIds: ["m1"], normalDirection: "left" },
    { id: "M2", role: "main", edgeIds: ["m2"], normalDirection: "right" },
    { id: "M3", role: "main", edgeIds: ["m3"], normalDirection: "left" },
  ],
  blockSections: [
    { id: section("S1"), signalId: "S1", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "m1", from: { kind: "signal", signalId: "S1" }, to: { kind: "edge-end", end: "from" } }], legacyOpenEnd: "west" },
    { id: section("S2"), signalId: "S2", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "m2", from: { kind: "signal", signalId: "S2" }, to: { kind: "edge-end", end: "to" } }], legacyOpenEnd: "east" },
    { id: section("S3"), signalId: "S3", coverage: "signal-to-boundary", edgeRanges: [{ edgeId: "m3", from: { kind: "signal", signalId: "S3" }, to: { kind: "edge-end", end: "from" } }], legacyOpenEnd: "west" },
  ],
  stationStopPoints: [
    { stationCode: "A", edgeId: "m1", segmentIndex: 0, offset: 200 },
    { stationCode: "B", edgeId: "m1", segmentIndex: 0, offset: 800 },
    { stationCode: "A", edgeId: "m2", segmentIndex: 0, offset: 200 },
    { stationCode: "B", edgeId: "m2", segmentIndex: 0, offset: 800 },
    { stationCode: "A", edgeId: "m3", segmentIndex: 0, offset: 200 },
    { stationCode: "B", edgeId: "m3", segmentIndex: 0, offset: 800 },
  ],
  legacyNodeOrder: ["A1", "B1", "A2", "B2", "A3", "B3"],
};
