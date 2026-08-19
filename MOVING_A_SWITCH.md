# Move a Switch

## Reason for existence

Use this guide when a switch (point) is in the wrong place on a pieces-authored
layout and needs to move. It covers the one edit that matters, the fallout the
tooling reports, and the three ways a move can go wrong silently.

Applies to layouts on the **pieces** path (`app/pieces/<slug>.ts`) — Jatinegara
today. Bekasi is on the legacy hand-authored IR path and is NOT covered here;
see [`ADDING_LAYOUTS.md`](ADDING_LAYOUTS.md) Path B.

Everything below was verified by performing the move and reverting it, not by
reading the code.

## The short version

1. Edit the `link` piece's coordinates in `app/pieces/jatinegara.ts`.
   **Move BOTH ends by the same delta**, or you change the crossover's slope.
2. Run `bun run verify:jatinegara`. It names any edge id the move invalidated.
3. Fix those ids in `app/pieces/jatinegara-data.ts`. Repeat until green.
4. Look at `/jng`. The verifier cannot see that a diagonal is the wrong shape.

Typical cost: **one line moved, a handful of edge ids renamed.**

## Step 1 — move the link

A switch is one end of a `link` (a diagonal). Find it in
`app/pieces/jatinegara.ts`:

```ts
{ kind: "link", id: "xov1", from: [112, 496], to: [144, 464] },
//                                ^^^^^^^^^^       ^^^^^^^^^^
//                                switch A         switch B
```

To **slide the whole crossover**, change both ends by the same delta:

```ts
{ kind: "link", id: "xov1", from: [80, 496], to: [112, 464] },   // both -32 in x
```

That is the entire physical edit. You do NOT touch edge ids, node ids,
`dashSide`, switch numbers, common/normal/reversed wiring, or render slots.
All of those are derived by `assemblePieces()`.

### Coordinate rules

The 8 track rows, west to east across the throat:

```
y=496 t1   y=464 t2   y=432 t3   y=400 t4
y=368 t5   y=336 t6   y=304 t7   y=272 t8
```

- **y must be a track row.** Anything else is a hard error (see Trap 1).
- **x must be a multiple of 16** (the JNG grid pitch).
- **Both deltas must be equal** to keep the diagonal at 45 degrees.

Reading coordinates off the drawing, in either direction:

```bash
bun run grid -- AG6        # AG6 = [528, 336]
bun run grid -- 528 336    # [528, 336] = AG6
```

An `~` in the answer means the coordinate is off-lattice — on JNG that means
it is wrong.

## Step 2 — let the verifier find the fallout

```bash
bun run verify:jatinegara
```

Moving a switch **re-cuts every line it touches**, so those edges are renamed.
Signals, station stops, and block sections still name edges by hand, so they go
stale. Assembly stops with the table, the record, and the dead id named:

```
error: passthrough.signals[0] (signal "NW1") references unknown edge "e-t1-32-112".
No assembled edge has that id — a geometry edit may have re-cut the line and renamed it.
```

## Step 3 — repair the edge ids

Fix them in `app/pieces/jatinegara-data.ts`. The naming rule is
`e-<lineId>-<westX>-<eastX>`, so the new names follow mechanically from the new
cut positions.

**Both ends re-cut their own line.** Moving `xov1` touched t1 (the `from`
end) AND t2 (the `to` end) — four renames, not two:

| line | before | after |
|---|---|---|
| t1 | `e-t1-32-112` | `e-t1-32-80` |
| t1 | `e-t1-112-336` | `e-t1-80-336` |
| t2 | `e-t2-32-144` | `e-t2-32-112` |
| t2 | `e-t2-144-176` | `e-t2-112-176` |

Keep each `sed` on a single line — a line-continuation inside the expression
fails with `unterminated address regex`:

```bash
sed -i 's/e-t1-32-112/e-t1-32-80/g; s/e-t1-112-336/e-t1-80-336/g; s/e-t2-32-144/e-t2-32-112/g; s/e-t2-144-176/e-t2-112-176/g' app/pieces/jatinegara-data.ts
```

**Re-run the verifier after every pass.** It reports ONE stale id at a time,
so a green run is the only proof you are finished. In the dry run above, the
first repair pass looked complete and the verifier immediately surfaced a
second line's worth of renames:

```
error: passthrough.stationStopPoints[10] (station "JNG-W")
references unknown edge "e-t2-32-144". ...
```

## Step 4 — full gate

```bash
bunx tsc --noEmit
bun run verify:jatinegara
bun run verify:pieces
bun run verify:bekasi                # must stay byte-identical
bun run verify:jatinegara:baseline   # WILL fail — see below
bun run test:e2e
```

`verify:jatinegara:baseline` compares against a captured snapshot, so **any
real move fails it. That is correct.** Once you have confirmed the new layout
is right, re-capture and record why in `docs/STATUS.md`:

```bash
bun run snapshot:jatinegara
```

`verify:bekasi` must never change. Bekasi does not go through pieces; if it
moves, something is wrong beyond your edit.

## What you do NOT need to touch

`switchMeta` maps a switch to the lever that works it:

```ts
"xov1:from": { controlGroupId: "PC1" },
```

It is keyed by the **link endpoint you wrote**, so moving a switch does not
require touching it. Confirmed across a real move: both PC1 levers stayed
attached and `dashSide` re-derived correctly.

Only edit it to deliberately change which lever owns a point, or when you
rename a link. A key naming no real interior endpoint is rejected:

```
switchMeta contains orphaned key(s): xov15:sideways.
Each key must name a real interior link endpoint as "<linkId>:<end>".
```

## Traps

These are the ways a move goes wrong. Only the first one is caught.

### Trap 1 — wrong y (CAUGHT, hard error)

An end must land on a line's y, within that line's drawn extent:

```
error: link "xov1" from end at (112,480) lands on no line.
Pieces join by position - place it where a line actually runs.
```

Mind the stub lines: `t5` only runs x=336..528, so a coordinate outside that
lands on nothing even at y=368.

### Trap 2 — moving one end only (SILENT)

Moving one end does not slide the crossover, it changes its **slope**:

```
move ONLY from, -32 in x
  d-xov1 geom: [[80,496],[144,464]]
  dx=64 dy=-32  ->  slope 0.500   (45 degrees would be 1.000)
```

All 29 JNG links are 45 degrees — 24 at dx=32, 4 at dx=64, 1 at dx=96.
**Nothing rejects a non-45 link.** It assembles, keeps 48 switches, and keeps
its levers. You only see it in the render.

Move one end deliberately only when reshaping the crossover, and keep both
deltas multiples of 32.

### Trap 3 — pushing one end past the other (SILENT)

Cross the ends over and the diagonal reverses, flipping both dash sides:

```
from x=176, to x=144   ->   PC1 levers: #1 dash=left  #6 dash=right
baseline               ->   PC1 levers: #1 dash=right #6 dash=left
```

Still 48 switches, no error. `dashSide` is derived from direction, so it
quietly inverts.

### Trap 4 — a link spanning two rows does not join the row between (SILENT)

A t1→t3 link crossing t2 mid-span:

```
node at [432,464]?  NONE - passes straight through t2
t2 cut at 432?      NO
```

It joins only at its two endpoints. That is correct for a flyover and is what
long links like `xov16` (dx=96, three rows) rely on — but it is wrong if you
meant a junction there.

## Why the verifier will not save you from traps 2–4

`verify:jatinegara` checks that each switch's `dashSide` **matches its branch
geometry**. It does not check that the geometry is what you intended. A
reshaped or reversed diagonal is self-consistent, so it passes.

Visual inspection of `/jng` is the check for those. Use `?start=HH:MM` to
dismiss the start modal.

## Related

- [`ADDING_LAYOUTS.md`](ADDING_LAYOUTS.md) — the authoring contract; pieces vocabulary, the grid translator, Path B for legacy IR.
- [`LAYOUT_DRAWING_GUIDE.md`](LAYOUT_DRAWING_GUIDE.md) — human-facing drawing and request template.
- [`docs/STATUS.md`](docs/STATUS.md) — current phase, decisions log, known-open items.
