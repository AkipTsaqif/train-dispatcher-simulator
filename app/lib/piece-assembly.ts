// ---------------------------------------------------------------------------
// Port join kernel — Phase 9 Step 3.
//
// Pieces connect by COINCIDENCE IN SPACE, not by id reference: the author
// places pieces, and this kernel connects the dots. That removes the whole
// class of dangling-reference bugs that `topology.ts` validation exists to
// catch, because the author never types an edge id.
//
// A port is a position plus an OUTWARD bearing (the direction you travel when
// LEAVING the piece through that port), a grade level, and its owning track
// group.
//
// Joining rules (PLAN-phase-9.md, "Ports and coincidence"):
//   • two ports at the same point and level with opposing bearings join into
//     one node;
//   • three or more at one point and level imply a SWITCH — the pair whose
//     bearings are most nearly collinear becomes common/normal, each remaining
//     port becomes a reversed leg;
//   • ports at the same point but DIFFERENT levels do not join (the existing
//     flyover rule — no new machinery needed);
//   • coincidence uses EXACT coordinates. No epsilon, no rounding, matching the
//     "preserve exact coordinates" contract in ADDING_LAYOUTS.md.
//
// Ambiguity is an ERROR, never a guess. Where the plan's risk section warns
// about "three ports meeting where the collinear pair is not obvious", this
// throws and names the point and the competing bearings.
//
// This module is deliberately piece-agnostic: it knows about ports and
// junctions only. Piece types (track/crossover/terminus/...) arrive in Step 4
// and are expressed in terms of the ports they emit.
// ---------------------------------------------------------------------------

import { bearingDot, type Bearing, type TopologyPoint } from "./topology";

export type Port = {
  /** Absolute map coordinate. Compared EXACTLY — see the header note. */
  point: TopologyPoint;
  /** Outward: the direction of travel when leaving the piece here. */
  bearing: Bearing;
  /** Grade level; ports at different levels never join. Default 0. */
  level?: number;
  /** Owning track group. */
  groupId: string;
  /** Author-facing label used in error messages (e.g. "track t1 east end"). */
  label: string;
};

/**
 * How a set of coincident ports resolves.
 *   • "free"    — one port: nothing to join, becomes a boundary node.
 *   • "through" — two opposing ports: a plain node.
 *   • "switch"  — three or more: a through axis plus diverging leg(s).
 */
export type JunctionKind = "free" | "through" | "switch";

export type Junction = {
  kind: JunctionKind;
  point: TopologyPoint;
  level: number;
  /** Every port meeting here, in input order. */
  ports: Port[];
  /**
   * For "switch": the two ports forming the through axis (most nearly
   * collinear pair) and the diverging leg(s). `common`/`normal` are the
   * through pair; `reversed` are the branches.
   */
  through?: [Port, Port];
  reversed?: Port[];
};

/**
 * Tie tolerance for switch inference ONLY — never for coincidence.
 *
 * Coincidence is exact (integer coordinates). But bearings are computed unit
 * vectors, so two genuinely-equivalent candidate axes can differ in the last
 * bits. This tolerance decides when two candidate through-axes are "equally
 * collinear" and therefore AMBIGUOUS. It is deliberately far above float noise
 * (~1e-16) and far below any real geometric distinction: at 1e-9 the two
 * candidates would have to agree to ~0.0026 degrees to be called a tie.
 */
export const COLLINEARITY_TIE_EPSILON = 1e-9;

const levelOf = (port: Port): number => port.level ?? 0;

/** Exact spatial key. Includes level, so grade-separated tracks never join. */
const junctionKey = (port: Port): string =>
  `${port.point[0]}|${port.point[1]}|${levelOf(port)}`;

const describe = (port: Port): string =>
  `${port.label} (group ${port.groupId}, bearing ${port.bearing.dx.toFixed(6)},${port.bearing.dy.toFixed(6)})`;

const at = (point: TopologyPoint, level: number): string =>
  `(${point[0]},${point[1]})${level === 0 ? "" : ` level ${level}`}`;

/**
 * Choose the through axis among 3+ coincident ports.
 *
 * The through pair is the one whose outward bearings most nearly oppose each
 * other (dot closest to -1): travelling in one and out the other is "straight
 * on". Every other port is a diverging leg.
 *
 * Throws when the best pair is not strictly better than the runner-up, or when
 * no pair opposes at all (no through axis exists).
 */
const inferSwitch = (
  ports: Port[],
  point: TopologyPoint,
  level: number
): { through: [Port, Port]; reversed: Port[] } => {
  const candidates: { a: number; b: number; dot: number }[] = [];
  for (let i = 0; i < ports.length; i++) {
    for (let j = i + 1; j < ports.length; j++) {
      candidates.push({ a: i, b: j, dot: bearingDot(ports[i].bearing, ports[j].bearing) });
    }
  }
  // most nearly collinear = most opposing = smallest dot
  candidates.sort((l, r) => l.dot - r.dot);
  const best = candidates[0];

  if (best.dot >= 0) {
    throw new Error(
      `No through axis at ${at(point, level)}: no two ports oppose each other. ` +
        `A junction needs a straight path through it. Ports:\n  ` +
        ports.map(describe).join("\n  ")
    );
  }

  const runnerUp = candidates.find((c) => c.a !== best.a || c.b !== best.b);
  if (runnerUp && Math.abs(runnerUp.dot - best.dot) <= COLLINEARITY_TIE_EPSILON) {
    throw new Error(
      `Ambiguous switch at ${at(point, level)}: two candidate through-axes are ` +
        `equally collinear (dot ${best.dot.toFixed(12)}). Cannot choose without guessing.\n` +
        `  candidate A: ${describe(ports[best.a])} <-> ${describe(ports[best.b])}\n` +
        `  candidate B: ${describe(ports[runnerUp.a])} <-> ${describe(ports[runnerUp.b])}\n` +
        `Disambiguate the geometry, or split this into separate junctions.`
    );
  }

  const through: [Port, Port] = [ports[best.a], ports[best.b]];
  const reversed = ports.filter((_, i) => i !== best.a && i !== best.b);
  return { through, reversed };
};

/**
 * Group ports by exact position+level and classify each meeting point.
 *
 * Pure: no ids are minted and no IR is emitted here — that is Step 4's job.
 */
export const joinPorts = (ports: readonly Port[]): Junction[] => {
  const groups = new Map<string, Port[]>();
  const order: string[] = [];
  for (const port of ports) {
    const key = junctionKey(port);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(port);
  }

  return order.map((key) => {
    const members = groups.get(key)!;
    const point = members[0].point;
    const level = levelOf(members[0]);

    if (members.length === 1) {
      return { kind: "free" as const, point, level, ports: members };
    }

    if (members.length === 2) {
      const dot = bearingDot(members[0].bearing, members[1].bearing);
      if (dot >= 0) {
        throw new Error(
          `Ports at ${at(point, level)} meet but do not oppose (dot ${dot.toFixed(12)}). ` +
            `Outward bearings must point away from each other to join.\n  ` +
            members.map(describe).join("\n  ")
        );
      }
      return { kind: "through" as const, point, level, ports: members };
    }

    const { through, reversed } = inferSwitch(members, point, level);
    return { kind: "switch" as const, point, level, ports: members, through, reversed };
  });
};

/**
 * A TopologySwitch has exactly ONE reversed port, so a junction with more than
 * one diverging leg cannot be represented as a single switch — a real ladder
 * places those switches at separate points. Surfaced separately from
 * `joinPorts` so Step 4 can decide the policy; reported, never silently split.
 */
export const overCrowdedJunctions = (junctions: readonly Junction[]): Junction[] =>
  junctions.filter((j) => j.kind === "switch" && (j.reversed?.length ?? 0) > 1);
