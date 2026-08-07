# Phase 7 — Arbitrary-schematic rendering (decouple geometry from the grid)

## Goal

Decouple the visual rendering from the fixed spreadsheet grid (58-unit cells,
column letters A–AO, snapped 2-cell train hops) so that arbitrary station
schematics — curved, graded, non-uniform — render faithfully from their edge
geometry. **Depends on Phase 6** (the model can express such layouts; this phase
makes them look right). This is last because it only matters once layouts exist
that no longer fit the grid.

## General / non-technical summary

Today the map is drawn on a rigid graph-paper grid: tracks snap to cells,
stations are rectangular nameplates, and trains jump in two-cell hops. That's a
deliberate, charming simplification and it's perfect for the current corridor.
But a complex station schematic — with sweeping curves, flyover ramps, and many
converging lines — can't be drawn on that grid. This phase lets the picture be
driven by the actual track geometry, so the diagram matches the layout's true
shape, while keeping the grid look available for layouts that want it.

## Current-state analysis

- Grid constants in `DispatchMapDefinition.grid` (cellSize, shift, viewBox,
  ticks, column/row labels). The component renders grid lines, column letters
  A–AO, and row numbers.
- Track rendering uses compiled `trackPaths` (already geometry-driven — good).
- **Train markers snap to the grid**: horizontal moves round to the nearest
  2-cell span; diagonals advance in CELL steps and rotate. This is a visual
  choice, not a model constraint — the engine's `st.x/st.y` are continuous.
- Stations are nameplate rectangles + tinted grid cells
  (`STATIONS`, `STATION_CELLS`, `cellOrigin` from column letters).
- The interlocking visuals (signal heads at x/y, point buttons, reservation
  overlays) are already positioned by compiled coordinates, not the grid.

So the grid dependency is concentrated in: the grid chrome (lines/labels), the
train-marker snapping, and the station cell/nameplate presentation.

## Technical design

### 7.1 Make grid chrome optional / data-driven

Treat the grid (lines, column letters, row numbers, ticks) as a **presentation
layer** that a map may or may not declare. Add to `DispatchMapDefinition` a
`presentation` descriptor: either `{ kind: "grid", ...existing grid fields }`
or `{ kind: "schematic", viewBox, ... }` for a free-form diagram. Bekasi keeps
`kind: "grid"`.

### 7.2 Continuous train-marker rendering

Add a per-layout option to render train markers at their true continuous
`st.x/st.y` (with rotation from the segment bearing, which Phase 1 provides)
instead of the 2-cell snap. Keep the snap as the default for grid layouts (the
Bekasi e2e visual baselines depend on it); enable continuous mode for schematic
layouts. The marker's rotation already handles diagonals; generalize it to any
segment bearing.

### 7.3 Stations on a schematic

Generalize station presentation from "nameplate rectangle + tinted cells" to
"platform polygons/lines at authored coordinates." A schematic layout authors
platform shapes directly (points), not grid cells. Keep `Station`/`StationCell`
for grid layouts; add an optional `StationShape` for schematic ones. Station
stop points and `platformCenterX` already come from the compiler — for a
non-horizontal station, generalize the "center X" to a platform anchor **point**
and a bearing (which side the platform is on).

### 7.4 Flyover/bridge glyph (from Phase 6)

Define the visual convention for a level-crossing-without-connection (a gap in
the lower line plus a bridge mark, or a distinct ramp stroke). This is the one
genuinely new SVG primitive.

### 7.5 What stays

- Track/signal/point/reservation rendering is already coordinate-driven; no
  change beyond the new primitives.
- The grid mode remains fully supported and is the default for Bekasi.

## Steps

1. Add `presentation` descriptor to `DispatchMapDefinition`; gate grid chrome on
   `kind: "grid"`.
2. Add continuous-marker mode (bearing-rotated, true x/y) behind the
   presentation kind; keep snap for grid mode.
3. Add `StationShape` authoring for schematic layouts; generalize platform
   anchor to a point + bearing.
4. Add the bridge/flyover glyph primitive.
5. Bekasi baseline byte-identical; grid-mode visuals unchanged (visual e2e
   baselines pass).
6. Render one of the earlier fixtures (3-main or flyover) in schematic mode as a
   smoke test (a screenshot, not necessarily a committed baseline).
7. Static gates.

## Acceptance criteria

- [ ] A map can declare `kind: "schematic"` and render without the grid chrome.
- [ ] Train markers can render continuously at true position/bearing (grid snap
      remains for grid mode).
- [ ] Stations render from authored shapes in schematic mode; grid nameplate/
      cells unchanged for grid mode.
- [ ] A flyover crossing renders with a clear bridge/gap convention.
- [ ] Bekasi visual baselines (the 5 committed screenshots) pass unchanged;
      `tsc`/`build`/`test:e2e` pass.

## Open assumptions

- Schematic-mode visual output has no committed baselines initially (it renders
  synthetic fixtures); add baselines when a real schematic layout is authored.
- The grid mode is not deprecated — it remains the right choice for corridor
  layouts and is what Bekasi uses.
- Zoom/pan for very large schematics is likely needed eventually but is a
  separate UX feature, not required for this phase.

## Out of scope

- Pan/zoom/viewport management for huge layouts. Theming beyond the existing
  dark mode. Any change to the simulation model (this phase is presentation
  only).
