## Target
Edge-block spawn gating for `app/components/dispatching-table.tsx`: do not materialize a scheduled train at a Jatinegara track edge while the preceding train still occupies that entry block; preserve generic movement and queue behavior after materialization.

## Dependents (4)
- `app/page.tsx`: renders the shared `DispatchingTable`.
- `app/jng/page.tsx`: renders the shared `DispatchingTable` with Jatinegara runtime.
- `tests/dispatching-table.spec.ts`: browser-level coverage for both layouts and JNG spawning.
- `app/lib/train-engine.ts` / `app/lib/dispatch-runtime.ts`: provide journey plans, line coordinates, and train state fields consumed by the component.

## Affected Stories
- No `specs/release-plan.yaml` or epic capsules exist in this repository. This is a user-directed Phase 10 JNG operational refinement.

## Test Coverage
- `tests/dispatching-table.spec.ts`: covers delayed JNG edge spawn, NE2 holding, signal release, and existing queue conflict behavior.
- `scripts/verify-jatinegara.ts`: covers compiled JNG topology and schedule invariants.
- Added: deterministic JNG E2E regression proving 5037B remains hidden while 5509B occupies the t2 east approach, then enters from the edge only after 5509B's operational tail clears NE2.

## Risk: High
The shared dispatching table owns the live animation loop and the change affects materialization timing, occupancy, signal aspects, and both Bekasi and Jatinegara paths. Keep the rule opt-in through layout/scenario data so Bekasi remains behavior- and snapshot-compatible.

## Recommended action
Implemented through the existing opt-in `spawn.atTrackEdge` policy, deriving each entry gate from compiled line/direction/signal geometry. Retain the regression test and run the full layout/E2E gates before release.
