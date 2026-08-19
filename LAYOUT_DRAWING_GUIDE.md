# Drawing and Requesting a New Layout

## Purpose

Use this guide when you want to draw a railway layout in Draw.io and ask an agent to add it to this application.

The current Bekasi Timur–Tambun–Cibitung layout was based on `example-image.png`. That drawing clearly provides two horizontal main tracks, opposing running directions, two crossovers, an upper loop, and a lower loop. You can use the same process for other layouts.

A drawing is an excellent source for visible geometry. It does not, by itself, define every operational rule. Follow the process below so the agent does not silently guess.

## Files to provide

Create one directory for each layout:

```text
references/layouts/<layout-id>/
├── layout.drawio
├── layout.svg
└── notes.md
```

Provide both the original Draw.io file and an SVG export when possible.

Preferred formats:

1. **SVG** — best for exact coordinates, paths, and readable labels.
2. **Draw.io source** — preserves editable objects and connector endpoints.
3. **PDF** — acceptable when labels remain selectable.
4. **High-resolution PNG** — visually readable, but coordinates must be estimated.
5. **Public share link** — usable only when it does not require your account credentials.

Do not provide account credentials. Export the drawing if the share link requires authentication.

## How to prepare the Draw.io drawing

Use grid snapping and straight connectors. Make junctions unambiguous: lines that cross without connecting must look different from switches or connected junctions.

Add these labels directly to the drawing:

- station codes and names;
- switch IDs, such as `P1` and `P2`;
- signal IDs, such as `J1` and `B101`;
- left and right entry/exit arrows;
- normal traffic direction on each main track;
- coupled-switch notation, such as `P1 ↔ P2`;
- block IDs or visible block boundaries;
- tracks where trains can stop at each station;
- notes for intentional coordinate or rendering exceptions.

Recommended Draw.io layers:

1. Track geometry
2. Stations and stopping tracks
3. Switch IDs and coupling
4. Signals and directions
5. Block boundaries
6. Operating notes

## Information the drawing cannot safely define alone

Unless explicitly labeled, the agent must not infer:

- normal versus reversed switch state;
- initial switch positions;
- which switches are coupled;
- signal initial states;
- exact block ownership and boundaries;
- wrong-way operating policy;
- station tracks permitted for stopping;
- timetable, running speed, or dwell rules;
- train priority, spawn, meet, or notification rules;
- hidden behavior not visible in the drawing.

Describe these details in `notes.md`, or ask the agent to propose them and wait for your approval.

## Layout request template

Copy this template into `notes.md` and complete as much as possible:

```markdown
# New layout request

## Identity

Layout name:
Layout ID:
Drawing files:

Mode:
- [ ] Replace the current layout
- [ ] Add another layout
- [ ] Let users select between layouts

## Drawing

Drawing units or grid size:
Exact dimensions, if important:
Coordinates must match the drawing exactly: yes/no
Visible labels are authoritative: yes/no

## Main tracks

Top main normal direction:
Bottom main normal direction:
Left entry point:
Right entry point:
Wrong-way operation allowed: yes/no

## Stations

| Code | Name | Tracks where trains may stop |
|------|------|------------------------------|
|      |      |                              |

Station order from west/left to east/right:

## Switches

| ID | Location | Normal route | Reversed route | Initial state | Coupled with |
|----|----------|--------------|----------------|---------------|--------------|
|    |          |              |                |               |              |

## Signals

| ID | Location | Facing | Initial state | Block/AI signal | Protects |
|----|----------|--------|---------------|-----------------|----------|
|    |          |        |               |                 |          |

## Loops and crossovers

Describe where each loop leaves and rejoins a main line:

Describe each crossover:

## Block sections

Describe the track protected by each signal:

If block boundaries are not decided:
- [ ] Ask the agent to propose them and wait for approval.

## Operating rules

Running speed:
Minimum station dwell:
Priority rules:
Spawn/entry rules:
Meet or crossing rules:
Notification rules:

## Timetable

Timetable file:
Enabled trains:
Station codes in the timetable:

## Initial state

Initial switch positions:
Initially cleared signals:
Trains already on the layout:

## Acceptance criteria

Required routes:
Required conflict behavior:
Required visual details:
Known exceptions:
Anything that must remain identical to another layout:
```

## Ask for interpretation before implementation

Use this prompt first:

```text
Inspect references/layouts/<layout-id>/layout.drawio,
references/layouts/<layout-id>/layout.svg, and notes.md.

Do not implement anything yet.

First:
1. Identify every node, edge, crossover, loop, station, switch, and signal.
2. Produce exact coordinate and topology tables.
3. List everything the drawing does not define, including switch states,
   coupling, signal blocks, stopping tracks, and operating rules.
4. Mark every inferred value as an assumption.
5. Check whether the topology is supported by the current compiler.
6. Wait for my approval.
```

Review the resulting tables carefully. Correct the agent's interpretation before approving implementation.

## Approve implementation

After the interpretation is correct, use:

```text
The topology interpretation is approved.

Implement the layout according to app/ADDING_LAYOUTS.md.
Use the approved coordinate and topology tables as the source of truth.
Do not change movement or dispatch algorithms for this layout.
Stop if the drawing requires unsupported topology or if any operating rule
remains ambiguous.
```

## Current supported shape

The toolchain (Layout-Complexity Program, Phases 1–7) directly supports much
more than the original two-main corridor:

- **any number of parallel main tracks**, each with a normal direction and
  per-group line selection (a timetable may assign a `line`, or the scenario
  may route by direction);
- **per-edge travel bearings** — tracks are not required to be horizontal;
  curves and diagonals work end-to-end (routing, occupancy, conflict);
- **ordinary reciprocal crossovers** between any two lines;
- **loops and sidings** — single- or multi-edge, each with its OWN occupancy
  envelope (multiple loops may share a diagram Y and stay independent);
- **arbitrary junction throats** — graph-based route search finds a path
  entrance→exit, sets the points automatically, and protects flanks;
- **graded junctions / flyovers** — an edge may carry a `level`; edges that
  cross on the map at different levels neither connect nor conflict (a level-1
  ramp over a line, with the renderer drawing a gap + bridge glyph);
- **2-D train bodies** — occupancy and conflict use the train's true polyline
  footprint across segments, so long trains straddling a junction/curve are
  handled correctly;
- **presentation modes** — `grid` (the Bekasi graph-paper look, snapped hops)
  or `schematic` (free-form, continuous markers, authored platform shapes).

A new layout therefore works if it is built from ordinary two-way switches and
edges with the roles above. Still NOT directly supported — each needs a
separately approved topology-compiler or movement-engine change:

- three-way / single-slip / double-slip switches;
- terminal or reversing movements (a train must be able to pass through; no
  stub-end moves);
- pure vertical running edges;
- continuous elevation/gradient physics (grade is a discrete tier);
- per-train variable length (all bodies are currently `2 × cellSize`);
- runtime layout selection in the UI (a registry/router design is required;
  the app currently loads one concrete layout).

## Final checklist

Before telling the agent to implement, confirm that you have:

- [ ] supplied the Draw.io source and SVG export;
- [ ] labeled stations, switches, signals, directions, and entries/exits;
- [ ] described switch states and coupling;
- [ ] described or requested proposals for block boundaries;
- [ ] identified station stopping tracks;
- [ ] supplied timetable and operating rules;
- [ ] reviewed the agent's coordinate/topology interpretation;
- [ ] approved every assumption;
- [ ] confirmed whether the layout replaces, supplements, or must be selectable alongside the current layout.
