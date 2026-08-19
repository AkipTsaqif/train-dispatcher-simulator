// ---------------------------------------------------------------------------
// Shared snapshot projection for the layout-equivalence harness.
//
// Both snapshot-layout.ts (writes the baseline) and verify-layout.ts (diffs
// against it) must project the SAME slices in the SAME order — that is what
// makes a before/after refactor provably behavior-preserving. The projections
// are data only: topology compatibility outputs and runtime outputs. No
// functions, no UI state.
//
// Env policy (recorded in docs/STATUS.md): the composition root reads
// NEXT_PUBLIC_ENABLED_TRAINS at import time, so we force it to an empty value
// here BEFORE the dynamic import. That yields the full 342-train set
// regardless of the shell environment — deterministic, and the strongest
// equivalence coverage (every journey and every meets dependency).
// ---------------------------------------------------------------------------

import { serialize } from "./serialize";
import type { DispatchRuntime } from "../../app/lib/dispatch-runtime";

// NOTE: the FIRST entry is the default for snapshot-layout.ts — keep Bekasi
// first so `npm run snapshot:bekasi` (no argument) keeps its meaning.
export const LAYOUT_IDS = [
  "bekasi-tambun-cibitung",
  "jatinegara",
] as const;

export const baselinePath = (layoutId: string): string =>
  `scripts/baselines/${layoutId}.snapshot.txt`;

const importLayoutRuntime = async (
  layoutId: string
): Promise<{ runtime: DispatchRuntime; exportedName: string }> => {
  if (!LAYOUT_IDS.includes(layoutId as (typeof LAYOUT_IDS)[number])) {
    throw new Error(`Unknown layout id: ${layoutId}`);
  }
  const module = await import(
    `../../app/dispatching/${layoutId}`
  );
  const exportedName = Object.keys(module).find((key) =>
    key.toUpperCase().endsWith("_DISPATCH")
  );
  if (!exportedName) {
    throw new Error(
      `No *_DISPATCH runtime export found in app/dispatching/${layoutId}.ts`
    );
  }
  return { runtime: module[exportedName] as DispatchRuntime, exportedName };
};

/** The canonical, deterministic projection of a layout runtime. */
const projectRuntime = (runtime: DispatchRuntime) => ({
  map: {
    nodes: runtime.map.nodes,
    lines: runtime.map.lines,
    trackPaths: runtime.map.trackPaths,
    signals: {
      items: runtime.map.signals.items,
      initialState: runtime.map.signals.initialState,
    },
    signalSections: runtime.signalSections,
    loops: runtime.map.loops,
    switches: {
      items: runtime.map.switches.items,
      coupled: runtime.map.switches.coupled,
      controls: runtime.map.switches.controls,
      initialState: runtime.map.switches.initialState,
    },
    stationPlatformCenterX: runtime.map.stations.platformCenterX,
  },
  runtime: {
    journeys: runtime.journeys.map((journey) => ({
      trainNo: journey.train.train_no,
      originArr: journey.plan.originArr,
      approach: journey.plan.approach,
      start: journey.plan.start,
      legs: journey.plan.legs,
    })),
    meetsByTrain: [...runtime.meetsByTrain.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([trainIdx, byStation]) => [
        trainIdx,
        [...byStation.entries()]
          .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
          .map(([station, deps]) => [station, deps]),
      ]),
    signalSections: runtime.signalSections,
    movement: runtime.movement,
    notificationPolicy: runtime.notificationPolicy,
  },
});

/** Set the env policy, import the layout, and return its serialized snapshot. */
export const buildSnapshot = async (layoutId: string): Promise<string> => {
  // force the full train set regardless of the shell environment
  process.env.NEXT_PUBLIC_ENABLED_TRAINS = "";
  const { runtime } = await importLayoutRuntime(layoutId);
  return serialize(projectRuntime(runtime)) + "\n";
};
