# Add a Dispatching Layout

## Reason for existence

Use this guide when a user asks to add, replace, or clone a railway dispatching layout. It keeps physical topology, SVG rendering, routing, movement, and scenario rules separated. Follow it before changing production code. For the human-facing drawing and request template, see [`../LAYOUT_DRAWING_GUIDE.md`](../LAYOUT_DRAWING_GUIDE.md).

## Non-negotiable boundaries

- Author physical topology once as a `TopologyDefinition` in `app/topologies/`.
- Generate graph nodes, SVG track paths, switch branches, signal coordinates, block intervals, loop/rejoin data, station centers, and movement descriptors with `compileTopology`.
- Never hand-author compatibility graph neighbors, SVG track `d` strings, switch branch strings, signal X/Y coordinates, signal-section intervals, loop tables, or platform-center X values in a map file.
- Never change movement, reservation, collision, interlocking, signal-aspect, notification, or journey algorithms to accommodate one layout. Stop and request a separately approved engine change if the compiler cannot represent the layout.
- Preserve exact coordinates and order. Do not round coordinates or reorder paths, nodes, signals, switches, or timetable rows without an explicit requirement.
- Follow current contract ownership: topology owns physical structure plus topology-coupled render/control annotations; maps own diagram/grid/station presentation; scenarios own the current operating configuration; `data/` owns timetables; and `app/dispatching/` selects dependencies. Do not redistribute these responsibilities as part of one layout addition without separate approval.

## Supported layout shape

The authoring contract is stricter than the compiler's current validation. A successful `compileTopology` call is necessary, not sufficient. A supported layout must satisfy all of these rules:

- exactly two main track groups exist: one horizontal leftbound group at `map.lines.topY` and one horizontal rightbound group at `map.lines.bottomY`; their Y coordinates are distinct;
- crossovers use reciprocal reversed switch ports;
- each loop is one logical edge, is physically attached through reciprocal switches at both ends to one main line, and has one compatibility Y distinct from every main and other loop Y;
- loop signal intervals use one global loop min/max envelope; layouts requiring independent loop occupancy bounds are unsupported;
- signals are placed by edge segment and offset;
- block sections are ordered ranges on one track group, and whole-loop ranges cover both physical endpoints rather than only naming every edge;
- stations use one or more edge placements that resolve to exactly one X coordinate.

The compiler does not independently prove every attachment, unique-Y, global-envelope, or full-range obligation above. Verify them in a layout-specific harness. Do not silently extend the model for vertical running, reversing paths, multi-edge loops, non-reciprocal junctions, independent loop bounds, or arbitrary graph geometry. Document the unsupported case and ask for approval first.

## Authoritative references

Read these files before implementation:

1. `app/lib/topology.ts` — topology types, compiler, and validation rules.
2. `app/topologies/bekasi-tambun-cibitung.ts` — canonical topology example.
3. `app/maps/bekasi-tambun-cibitung.ts` — compiled topology plus grid/presentation assembly.
4. `app/scenarios/bekasi-tambun-cibitung.ts` — operational-rule contract.
5. `app/dispatching/bekasi-tambun-cibitung.ts` — concrete composition boundary.
6. `app/lib/dispatch-runtime.ts` and `app/lib/train-engine.ts` — consumers; inspect but do not specialize for a layout.

## Phase 0: clarify the requested layout

Do not code until the user supplies or approves all of the following:

- layout ID, display name, and accessible diagram label;
- station codes, names, order, nameplate rectangles, and grid cells;
- operational nodes and exact coordinates;
- logical edges, geometry vertices, roles, and track-group membership;
- normal running direction for each main group;
- every switch ID, common/normal/reversed port, initial state, control group, coupling, label, and dash side;
- every signal ID, edge segment, offset, facing, mount, label, block/AI flags, and initial state;
- the protected block range for every signal;
- station stop placement on every track that can serve that station;
- render-only split points, path order, and any documented endpoint override;
- grid dimensions, view box, labels, arrows, and presentation coordinates;
- timetable source and enabled-train policy;
- speed, dwell, priority, spawn, meet, and notification rules;
- whether the new layout replaces the current layout or must be selectable at runtime.

If the source is an image or diagram, first produce a reviewable coordinate/topology table. Do not infer hidden switch states, block boundaries, or operating rules from appearance alone.

## Phase 1: handle the shared-contract caveat

`DispatchMapDefinition`, `Station`, and `StationCell` currently live in the concrete Bekasi map module. `DispatchScenarioDefinition` currently lives in the concrete Bekasi scenario module.

For the first additional layout, or for a replacement that will delete the Bekasi modules, propose a separate type-only preparation change:

- move map contracts to `app/lib/dispatch-map.ts`;
- move the scenario contract to `app/lib/dispatch-scenario.ts`;
- update type imports in `app/lib/dispatch-runtime.ts`, `app/components/dispatching-table.tsx`, and every map/scenario module without changing runtime values;
- capture a baseline and write a direct comparison command or temporary harness before the extraction; there is no checked-in general equivalence command today;
- run the comparison, TypeScript, and build before authoring the new layout.

`app/lib/trains.ts` is a legacy adapter independently pinned to the Bekasi definition. Decide explicitly whether an additional layout leaves it pinned, a default-layout replacement migrates it, or a later change retires it. Verify all legacy exports if it changes.

Do not make every future layout permanently import its shared contract from another concrete layout. Do not combine this type extraction with topology behavior changes without explicit approval, and do not claim “existing equivalence checks” without naming a runnable command.

## Phase 2: create the canonical topology

There are two paths. **Pieces is the path for new layouts.** Hand-authored IR
is the legacy path Bekasi remains on.

### Path A - pieces (preferred, Phase 9)

Create `app/pieces/<layout-id>.ts` and export a `PieceSet`, then assemble it:

```ts
import { assemblePieces, type PieceSet } from "../lib/pieces";

export const NEW_LAYOUT_PIECES: PieceSet = {
  pieces: [
    // a whole running line at its TRUE DRAWN extent, cut automatically
    // wherever a link lands on it
    { kind: "line", id: "t1", y: 496, from: 32, to: 1120, normalDirection: "right" },
    { kind: "line", id: "t2", y: 464, from: 32, to: 1120, normalDirection: "left" },
    // a diagonal. Whether each end is a SWITCH or a fixed track turn is
    // derived: interior to a line => switch, at a line's extremity => turn.
    { kind: "link", id: "xov1", from: [112, 496], to: [144, 464] },
  ],
  switchMeta: {
    // geometry decides WHERE a switch is and which way it dashes; it cannot
    // know which lever owns it, so that stays authored. Key it by the link
    // endpoint you wrote above - NEVER by the derived switch number.
    "xov1:from": { controlGroupId: "PC1" },
  },
  passthrough: {
    // not geometric - no placement rule produces these
    controlGroups: [],
    signals: [],
    blockSections: [],
    stationStopPoints: [],
    // legacyNodeOrder is OPTIONAL and only needed when an existing layout's
    // node order must be preserved bit-for-bit. Omit it for a new layout;
    // placement order is the default.
  },
};

export const NEW_LAYOUT_ASSEMBLED = assemblePieces(NEW_LAYOUT_PIECES);
```

The rule that makes this safe: **a piece names what it OWNS, never what it
POINTS AT.** A link does not reference the lines it joins - it is placed where
they run, and the join follows from geometry. So you never write an edge id, a
node id, a switch's common/normal/reversed wiring, a render slot, or a
`dashSide`. Those are derived, which means they cannot drift out of sync.

`switchMeta` is the deliberate exception, and it follows the same rule. Its
key is `"<linkId>:<end>"` (`end` being `from` or `to`) - the identity you
already wrote on the `link` piece. It is NOT the derived switch number.
The number is a position in a (line order, x ascending) walk, so moving one
point can renumber every switch after it and silently reattach levers to the
wrong physical point; a `linkId:end` key moves with the piece instead. A key
that names no interior link endpoint is a hard error naming the key, so a
renamed link cannot quietly lose its lever.

Signals, stop points, and block sections stay explicit operational data and
still carry derived edge ids. Assembly preflights every one of those ids
against the assembled edges, so a mid-span geometry edit that re-cuts a line
fails at the assembly boundary naming the table and the stale id, rather than
compiling into a topology that is operationally wrong.

Other piece kinds: `track` (a single explicit edge), `crossover` (a link with
explicit switches), `terminus` (a stub end), `loop` (a chain leaving and
rejoining a line), `platform`, and `signal`. A `crossover` or `loop` may carry
`level` for a flyover - a graded link's ports never join the line it passes
over, so the crossing neither connects nor conflicts.

Pieces reject rather than guess. A link landing on no line, or two pieces
disagreeing about a shared point's node name, is a hard error naming the
coordinate.

### Reading coordinates off the drawing

Pieces are authored in raw coordinates, but a drawing is easier to read by
grid reference. `bun run grid` translates BOTH directions:

```
bun run grid -- AG6           # AG6 = [528, 336]
bun run grid -- 528 336       # [528, 336] = AG6
bun run grid -- --list        # every layout's pitch/offset/shift
bun run grid -- -l bekasi 0 89
```

It defaults to `jatinegara`; use `-l/--layout` for another (aliases `jng`,
`bekasi`, `bks`, ...). Each answer restates the grid geometry it used, so a
result from the wrong layout is visible rather than silently misleading.

A coordinate that is not on the lattice is FLAGGED, never rounded:

```
[0, 89] = ~H2 (off-lattice: col 6.50, row 2.03)
```

That matters because Bekasi's Ys are free-form while Jatinegara's are on a
pitch-16 lattice. A `~` result on a layout that should be on-lattice means
the coordinate is wrong, not that the tool is unsure.

Verify with an IR diff against a reference, if you have one:

```
npm run diff:ir -- <reference> pieces:<layout-id>
```

`app/pieces/jatinegara.ts` is the worked example: a 74-node, 90-edge, 48-switch
station written as 13 lines and 29 links.

### Path B - hand-authored IR (legacy)

Create `app/topologies/<layout-id>.ts` and export one `TopologyDefinition`.

```ts
import type { TopologyDefinition } from "../lib/topology";

export const NEW_LAYOUT_TOPOLOGY = {
  nodes: [],
  edges: [],
  switches: [],
  controlGroups: [],
  signals: [],
  trackGroups: [],
  blockSections: [],
  stationStopPoints: [],
  legacyNodeOrder: [],
} satisfies TopologyDefinition;
```

### Nodes and geometry

- Use stable, descriptive IDs.
- An edge's first and last geometry points must exactly equal its `from` and `to` node coordinates.
- Put an ID on an intermediate vertex only when a compatibility graph node is required.
- Include every operational and compatibility node exactly once in `legacyNodeOrder`.
- Keep `physicalDistance` undefined unless an approved engine change consumes it. Do not assume it changes running time today.

### Edges and rendering

- Assign each edge one role: `main`, `loop`, or `crossover`.
- Put every edge in exactly one continuous track group with the same role.
- Give main groups a `normalDirection`.
- Use `renderBreakpoints` only for visual splits that must not become movement nodes.
- Give every rendered fragment one unique `renderSlots` index. Across the layout, slots must be contiguous from zero with no duplicates.
- Use `renderEndpointOverride` only for a proven logical/rendered endpoint difference, and provide a precise `reason`.

### Switches

- The common, normal, and reversed ports must be three distinct edge ends incident to the switch node.
- A reversed crossover/loop edge must terminate at another switch whose reversed port points back through the same edge.
- Put every switch in exactly one control group.
- A coupled group contains at least two switches. Use `coupled: false` for an independent control.

### Signals and blocks

- Place signals with `edgeId`, `segmentIndex`, and exact scalar `offset`; do not calculate X/Y manually.
- Every signal must own exactly one protected block section, and every block section must refer back to that signal.
- Author block coverage as ordered, continuous, directed edge ranges on the signal's track group.
- A `signal-to-boundary` section starts at its owner signal and closes at a compatible signal or an explicitly declared `legacyOpenEnd`.
- A `whole-track-group` section is for a loop and must include its complete loop group from one physical endpoint to the other; edge-ID membership alone is not adequate evidence.
- Edge-range direction must match signal facing. An open range must reach the correct physical group boundary.

### Stations

- Add one stop placement for every track on which a train can stop at that station, including loop/diversion tracks.
- All placements for one station code must resolve to exactly the same X coordinate.
- Station codes must match timetable stop codes and scenario station-keyed rules.

`compileTopology(NEW_LAYOUT_TOPOLOGY)` must run without throwing before map assembly begins.

## Phase 3: assemble the map

Create `app/maps/<layout-id>.ts`.

- Compile the topology once at module initialization.
- Build a `DispatchMapDefinition` with layout metadata, grid, view box, ticks, main-line Y values, traffic arrows, station nameplates, and station grid cells.
- Set `lines.topY` to the leftbound main and `lines.bottomY` to the rightbound main. The current runtime selects those exact fields by train direction; additional or differently assigned main lines require an engine change.
- Assign `lines.normalDirectionByY`, `loops`, `switches`, `nodes`, `signals`, `trackPaths`, `stations.platformCenterX`, and `compatibility` directly from the compiled topology.
- Derive `stations.namesByCode` from the authored station nameplates.
- Do not copy a compiled compatibility value into a second authored constant.

Use `app/maps/bekasi-tambun-cibitung.ts` as the assembly pattern, not as a coordinate source.

## Phase 4: add scenario, timetable, and composition

1. Create `app/scenarios/<layout-id>.ts`. Reuse an existing scenario only when station codes and every operating rule are intentionally identical.
2. Add or select a timetable whose rows satisfy `ScheduleEntry` from `app/lib/train-engine.ts`.
3. Ensure each stop's station code exists in the map.
4. Define `speed.segmentKm` for every adjacent station pair used by the timetable; reverse lookup is supported.
5. Create `app/dispatching/<layout-id>.ts` and assemble:
   - the map;
   - the scenario;
   - the timetable;
   - the enabled-train filter;
   - `createDispatchRuntime(...)`.

The UI currently imports one concrete runtime and Bekasi-owned types from `app/components/dispatching-table.tsx`. After the shared-contract extraction, a default-layout replacement changes the runtime import there and updates `app/lib/trains.ts` according to the explicit adapter decision above. An additional unselected composition does not exercise any UI, e2e, or legacy-adapter path. If users need multiple layouts selectable at runtime, stop and propose a registry/router/selection design; do not embed selection logic in the topology compiler or train engine.

## Phase 5: verification

### Direct layout verifier

A new composition is not tested merely because the repository builds. Add a committed `scripts/verify-<layout-id>.ts` or an equivalent test that directly imports both the new topology and dispatch composition. It must call `compileTopology`, instantiate the runtime, assert the expected counts/invariants below, and fail with a nonzero exit code.

Run it explicitly, replacing `new-layout` with the real slug:

```bash
LAYOUT_ID=new-layout
bun "scripts/verify-${LAYOUT_ID}.ts"
```

If the layout is UI-selected, add or parameterize e2e coverage so the test proves which runtime it loaded. The current Playwright suite exercises only the runtime imported by `dispatching-table.tsx`. Run `npm run probe:meets` as layout evidence only when `app/lib/trains.ts` selects that layout; otherwise add the meet checks to the direct verifier.

### Static gates

```bash
{
  git diff --name-only -z --diff-filter=ACMR HEAD -- 'app/**/*.ts' 'app/**/*.tsx'
  git ls-files --others --exclude-standard -z -- 'app/**/*.ts' 'app/**/*.tsx'
} | sort -zu | xargs -0 -r npx eslint
npx tsc --noEmit
npm run build
npm run test:e2e
```

If `dispatching-table.tsx` is touched, capture its pre-change ESLint output and require no new diagnostics because the file has a known pre-existing lint baseline. The e2e command counts as new-layout evidence only after the UI selects or routes to that layout.

### Required topology checks

Record actual counts, not “looks correct”:

- authored nodes, compatibility bend nodes, logical edges, rendered path fragments, track groups, switches, control groups, signals, block sections, and station placements;
- exactly one leftbound main at `topY` and one rightbound main at `bottomY`, with distinct Y coordinates;
- compiler rejection of duplicate IDs, missing endpoints, invalid switch ports, incomplete groups, out-of-range signals, invalid blocks, render-slot gaps, undocumented overrides, and station-X disagreement;
- graph reachability for every intended signal-to-boundary route under representative switch states;
- both switch states at every switch and every coupled remote-state combination;
- every block's closed/open extent and every loop's whole-group coverage;
- exact station X values on main and diversion tracks;
- representative `setSegment`, `reservationAhead`, signal-aspect, loop/rejoin, journey, and `initTrain` cases;
- coordinate precision with exact values; do not use rounded screenshot measurements as the source of truth.

### Visual and operational checks

Run `npm run dev`, open `http://localhost:3000`, and verify:

- the SVG path order and joins;
- normal and reversed point rendering;
- coupled controls and approach locking;
- signal placement, facing, initial state, and reserved-route drawing;
- wrong-way and conflict behavior;
- trains entering, crossing, looping, rejoining, stopping, and exiting without jumps;
- station nameplates/cells and traffic arrows;
- simulation at high speed without unexpected collisions or notifications.

For a replacement/refactor, capture the old output first and require byte-identical compatibility projections and static SVG unless the user approved a visible or behavioral change. Use a deterministic serializer that preserves property/array order and explicitly represents `undefined`, ordered `Set` values, `Infinity`, and `-Infinity`; plain JSON converts infinities to `null`. For a genuinely new layout, create an approved fixture table of expected coordinates, paths, routes, blocks, and station stops before implementation.

## Completion report

Before declaring the layout complete:

1. Show the diff.
2. List every changed file and explain its boundary.
3. Report all actual verification counts and command results.
4. Record unsupported cases, deliberate exceptions, and deviations in the project notes before summarizing them.
5. Confirm whether the layout replaces the current runtime or is selectable.
6. Confirm the working tree and commit/tag state requested by the user.
