## Target

Jatinegara train-marker presentation: switch `/jng` from continuous marker placement to visual grid-cell snapping, without changing engine movement, stops, occupancy, or routing.

## Dependents (4)

- `app/components/dispatching-table.tsx`: chooses continuous vs snapped marker coordinates on every animation frame.
- `app/lib/dispatch-map.ts`: owns the shared `Presentation` contract.
- `app/maps/jatinegara.ts`: will opt into snapping at its 16-unit display-grid pitch.
- `app/maps/flyover-fixture.ts`: uses continuous placement and must remain so.

## Affected Stories

No `specs/release-plan.yaml` exists. This is user-directed Jatinegara presentation work, outside a numbered release story.

## Test Coverage

- `tests/dispatching-table.spec.ts`: JNG control and interaction coverage; add a marker-coordinate assertion for 16-unit snapping.
- `tests/dispatching-table.spec.ts`: flyover fixture checks continuous marker coordinates.
- `verify:jatinegara`, `verify:bekasi`, `probe:occupancy`, and `probe:meets`: guard topology, Bekasi equivalence, and unchanged operational movement.

## Risk: Medium

The component is shared by Bekasi, Jatinegara, and the flyover fixture, but the behavior can be selected entirely through optional presentation data and verified by existing fixtures.

## Recommended action

Add an optional visual snap-pitch to `Presentation`; JNG opts in at its 16-unit grid pitch. Keep `continuousTrains: true` authoritative for the flyover fixture and preserve the existing Bekasi branch verbatim.
