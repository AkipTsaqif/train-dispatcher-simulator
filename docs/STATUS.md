# Layout-Complexity Program — Status

> Living file. Read this first before any work. Update it immediately after any
> step or nontrivial decision. Keep under ~50 lines. Detail lives in
> `docs/PLAN-phase-N.md` — reference, don't duplicate.

## Current position

- **Active phase:** 10 (JNG schematic refinement & timetable ops) — **COMPLETE**.
  Phases 0–9 are all complete.
- **Current status:**
  - JNG layout: 13 mains, 56 switches (24 coupled pairs + 8 singles), 26 signals
    (incl. NW1A, XW2A, NE8), 4 island platforms. Left boundary extended by 4 cells
    (+64 units), giving a clean straight approach at column B (x=32).
  - Full 24-hour timetable: 410 stopping trains (192 eastbound, 218 westbound)
    converted from 168Railway working timetable data (`scripts/build-jng-schedule.ts`).
  - Line assignment: odd westbound non-KRL use Track 4 (row 10); odd westbound KRL use Track 2 (row 14); eastbound POK trains use Track 6 (row 6); other eastbound trains use Track 1 (row 16).
  - Relative clock & dwell: accurate timetable departure times, 24-hour simulation
    clock formatting in infoboxes, signal departure hold, and smooth multi-segment
    crossover traversal without ghost stops or teleports.
- **Next action:** User-directed layout/interaction refinements.

## Phase state

| Phase | Title | State |
|---|---|---|
| 0–8 | Core engine (bearings, multi-main, loops, routes, flyovers, schematic, terminating) | **DONE** |
| 9 | Piece assembly (PieceSet → assemblePieces → TopologyDefinition) | **DONE** |
| 10 | JNG schematic refinement, real 24h timetable, articulated train presentation | **DONE** |

## Key decisions & recent changes

- **2026-08-27:** Converted full 24h timetable (410 trains) with dynamic corridor approach times (~75s before platform arrival).
- **2026-08-27:** Added parity/type line policy: odd non-KRL → t4/row 10; westbound KRL → t2/row 14; eastbound POK → t6/row 6; other eastbound → t1/row 16.
- **2026-08-27:** Extended west boundary by 4 cells (+64 units; grid width 928→992, 62 columns ending at BJ).
- **2026-08-27:** Eliminated 1-second animation stutter by removing the 30-frame periodic React state setter (`rosterTick`). The simulation clock and train markers now animate purely via direct DOM mutation at a steady 60 FPS without periodic full-component re-renders.
- **2026-08-27:** Fixed t6 departure rendering: dwell lead compensation now ramps out over the first cells, preventing 256B from jumping 424→456; passed exit signals cannot re-trigger a red departure hold.
- **2026-08-27:** Added NW1A (O16) and XW2A (L14) signals (24 → 26 total).
- **2026-08-25:** Overlap on same line & direction converted to queue/follow (amber body, rear stops, leader runs).
- **Gates:** `verify:jatinegara` (34/34 checks), `verify:pieces`, `verify:piece-assembly`, `verify:grid-ref`, `verify:jatinegara:baseline`, and all 58 Playwright E2E tests (`test:e2e`) pass cleanly.
