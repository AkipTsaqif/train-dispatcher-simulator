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

- **2026-08-28:** Edge-spawn admission will be gated by the first facing signal on each entry line. A train remains unmaterialized while an earlier train from the same edge/direction still occupies the approach block; the block is released only when that train's operational tail clears the first signal (for example, the t2 westbound block clears only after the tail passes NE2). This is opt-in through the existing `spawn.atTrackEdge` scenario policy, derives the gate from compiled signal geometry, and leaves Bekasi's legacy spawn behavior unchanged. A gate-delayed train starts its own clock when it is actually admitted, preventing a delayed-spawn teleport.
- **2026-08-28:** Fixed switch double-click requirement when switching stations from the launcher: initial `switches` state only contained Bekasi's switch IDs (1–8), leaving JNG switch IDs (e.g. 11, 20, 27, 42, 44, 48, 49, 52) `undefined`. `toggleSwitch` checked `switches[id] === "normal" ? "reversed" : "normal"`; because `undefined === "normal"` was false, the first click set it to `"normal"` (LURUS), requiring a second click to throw. Fixed by checking `const current = switches[id] ?? "normal"` and toggling `current === "reversed" ? "normal" : "reversed"`, plus synchronizing `switches` state to `currentDispatch.map.switches.initialState` via effect.
- **2026-08-28:** Polished turnout & switch contrast in dark mode: previously `.dark svg [stroke="#ffffff"]` remapped the white track eraser to `#94a3b8` (same as solid track), causing both active and inactive legs to appear solid. Updated `app/globals.css` so the turnout eraser maps to the dark canvas background (`#0f172a`), the inactive disconnected leg renders as a faint dark slate dash (`#334155`), active track shines in crisp slate (`#cbd5e1`), and point handles show distinct dark-slate normal vs glowing-green reversed states.
- **2026-08-28:** Preserved real timetable times for previous and next stations across all 410 trains: `build-jng-schedule.ts` now extracts the exact scheduled arrival and departure of the previous station (e.g. Bekasi 06:01:00/06:03:00 for KA 63B) and next station (e.g. Manggarai 06:24:00) from each train's JSON timetable, rather than overriding them with the JNG-75s approach estimate. The approach spawn time is carried via `spawn_time` on the boundary stop, so the infobox reflects the real timetable while the train materializes at the track edge on schedule.
- **2026-08-28:** Fixed delayed-spawn trains (e.g. 5509B at 06:00:00 start) jumping forward on spawn: `spawnSimRef` and `lastTickRef` were initialized to `0` instead of `undefined`. When 5509B's scheduled boundary time (06:01:45 = 21705s) arrived, the nullish coalescing `spawnSimRef[ti] ?? boundaryArr` read `0`, advancing 21705 seconds of elapsed time in a single frame and teleporting the train from east track edge (BH/BO14) to a red-signal stop behind NE2 (AY/AW14). Fixed by initializing to `undefined`, so delayed trains calculate dt strictly from their actual boundary time and enter live from the track edge. New E2E test added and passed.
- **2026-08-28:** Added approaching-train notification support for Jatinegara scenario: trains entering the corridor emit an approach warning (`"persiapan masuk stasiun jatinegara"`) on the notification board with an amber indicator, automatically resolving with duration when the train arrives at the platform. Configured via `notifications.notifyOnApproach: true` and `notifications.approachMessage` on `JATINEGARA_SCENARIO`.
- **2026-08-28:** Added clean initial landing page with station & start-hour selection launcher form. On fresh visit with no query params, the background is blank (no diagram/table), presenting station tiles (Jatinegara vs Bekasi–Tambun–Cibitung) and start-time picker/presets (`00:00`, `06:00`, `12:00`, `18:00`); clicking "Mulai" loads the chosen station and simulation start time. Added "Ganti Stasiun / Waktu Mulai" button in Settings popover to reopen the launcher anytime. Direct `?start=` query links continue to launch immediately for tests/bookmarks.
- **2026-08-27:** Converted full 24h timetable (410 trains) with dynamic corridor approach times (~75s before platform arrival).
- **2026-08-27:** Added parity/type line policy: odd non-KRL → t4/row 10; westbound KRL → t2/row 14; eastbound POK → t6/row 6; other eastbound → t1/row 16.
- **2026-08-27:** Extended west boundary by 4 cells (+64 units; grid width 928→992, 62 columns ending at BJ).
- **2026-08-27:** Eliminated 1-second animation stutter by removing the 30-frame periodic React state setter (`rosterTick`). The simulation clock and train markers now animate purely via direct DOM mutation at a steady 60 FPS without periodic full-component re-renders.
- **2026-08-27:** Fixed t6 departure rendering: dwell lead compensation now ramps out over the first cells, preventing 256B from jumping 424→456; passed exit signals cannot re-trigger a red departure hold.
- **2026-08-27:** Added NW1A (O16) and XW2A (L14) signals (24 → 26 total).
- **2026-08-25:** Overlap on same line & direction converted to queue/follow (amber body, rear stops, leader runs).
- **Gates:** `verify:jatinegara` (34/34 checks), `verify:pieces`, `verify:piece-assembly`, `verify:grid-ref`, `verify:jatinegara:baseline`, and all 58 Playwright E2E tests (`test:e2e`) pass cleanly.
