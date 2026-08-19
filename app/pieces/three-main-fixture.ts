// Three-main fixture, authored as PIECES (Phase 9 Step 4).
//
// Acceptance: assembling this must produce an IR structurally identical to the
// hand-authored app/topologies/three-main-fixture.ts. Verify with:
//   npm run diff:ir -- three-main-fixture ../pieces/three-main-fixture
//
//   M1  y=100  leftbound   A ───────────── B
//   M2  y=200  rightbound  A ───────────── B
//   M3  y=300  leftbound   A ───────────── B

import { assemblePieces, type PieceSet } from "../lib/pieces";

const section = (signalId: string) => `section-${signalId}`;

// Three parallel mains: same shape, different y and direction. As pieces this
// is a table, not 60 lines of node/edge/group triplication.
const MAINS = [
  { n: 1, y: 100, dir: "left" as const, signal: "S1", offset: 700, facing: "toward-from" as const, openEnd: "west" as const, end: "from" as const },
  { n: 2, y: 200, dir: "right" as const, signal: "S2", offset: 300, facing: "toward-to" as const, openEnd: "east" as const, end: "to" as const },
  { n: 3, y: 300, dir: "left" as const, signal: "S3", offset: 700, facing: "toward-from" as const, openEnd: "west" as const, end: "from" as const },
];

export const THREE_MAIN_FIXTURE_PIECES: PieceSet = {
  pieces: MAINS.map((m) => ({
    kind: "track" as const,
    id: `m${m.n}`,
    groupId: `M${m.n}`,
    from: [0, m.y] as const,
    to: [1000, m.y] as const,
    fromNode: `A${m.n}`,
    toNode: `B${m.n}`,
    normalDirection: m.dir,
    renderSlots: [m.n - 1],
  })),
  passthrough: {
    groupMeta: Object.fromEntries(
      MAINS.map((m) => [`M${m.n}`, { normalDirection: m.dir, role: "main" as const }])
    ),
    controlGroups: [],
    signals: MAINS.map((m) => ({
      id: m.signal,
      edgeId: `m${m.n}`,
      segmentIndex: 0,
      offset: m.offset,
      facing: m.facing,
      mount: "up" as const,
      label: `M${m.n} ${m.dir === "left" ? "westbound" : "eastbound"}`,
      protectedBlockSectionId: section(m.signal),
    })),
    blockSections: MAINS.map((m) => ({
      id: section(m.signal),
      signalId: m.signal,
      coverage: "signal-to-boundary" as const,
      edgeRanges: [
        {
          edgeId: `m${m.n}`,
          from: { kind: "signal" as const, signalId: m.signal },
          to: { kind: "edge-end" as const, end: m.end },
        },
      ],
      legacyOpenEnd: m.openEnd,
    })),
    stationStopPoints: MAINS.flatMap((m) => [
      { stationCode: "A", edgeId: `m${m.n}`, segmentIndex: 0, offset: 200 },
      { stationCode: "B", edgeId: `m${m.n}`, segmentIndex: 0, offset: 800 },
    ]),
    legacyNodeOrder: ["A1", "B1", "A2", "B2", "A3", "B3"],
  },
};

export const THREE_MAIN_FIXTURE_ASSEMBLED = assemblePieces(THREE_MAIN_FIXTURE_PIECES);
