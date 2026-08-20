# Phase 10 — Real throat block boundaries

## Goal

Replace the `legacyOpenEnd` approximation with block sections that terminate
at a real, authored boundary — so that a section's extent is a fact about the
layout, not an artefact of where its track group happens to stop.

Success is measured on Jatinegara: 17 of 23 sections are currently
open-ended. Step 1's evidence shows **7 of those are genuinely wrong** (track
continues into the throat), 9 are correct (the map edge), and 1 is a dead
stub needing its own treatment. This phase fixes the 7 and names the 1.

## Problem being solved

`deriveBlockSections` (`app/lib/pieces.ts:836`) walks from a signal to the
next same-facing signal *on the same track group*. When there is no such
signal, the walk runs off the end of the group and the section is flagged
`legacyOpenEnd: "west" | "east"`.

That flag encodes "we don't know where this ends". Two consequences:

1. **It is wrong wherever track continues.** 7 of the 17 open ends have a
   crossover attached, so the train demonstrably goes somewhere:

   ```
   section-XE5  east  (528,368)  → d-xov14
   section-XE6  east  (592,336)  → d-xov15
   section-XE7  east  (688,304)  → d-xov18
   section-XE8  east  (528,272)  → d-xov13
   section-XW5  west  (336,368)  → d-xov10
   section-NE5  west  (1040,368) → d-xov29
   section-NE6  west  (1008,336) → d-xov27
   ```

   The other 9 genuinely reach the map edge (x=32 or x=1120) and are correct
   as open ends — those are where the railway actually leaves the diagram.
   One more (XW8, at t8's west tip) has nothing beyond it at all: a dead
   stub, which is neither a throat nor a map edge.

2. **It makes signal placement fragile.** A signal at a group's end produces
   a zero-length section. Commit `bcc2900` made that an explicit error rather
   than a confusing one, but the underlying cause is this phase's subject:
   the section *should* have continued into the throat.

This is a long-standing tracked item (`docs/STATUS.md:19`, `:198`, `:521`),
and it blocks the block-section-anchors spike
(`specs/archive/spikes/SPIKE-block-section-anchors.md`).

## Why it is not simply "keep walking"

Past a group's end the next edge is a crossover, and beyond that a **switch**.
A switch has `normal` and `reversed` branches:

```ts
{ id: 1, common: {...}, normal: {...}, reversed: {...}, initialState: "normal" }
```

Which branch a section covers depends on **point position**, which is runtime
state. A statically-derived section cannot cross a switch without either
choosing a branch arbitrarily or becoming dynamic. Both are wrong: block
sections are static infrastructure.

The railway's own answer is that **the section ends at a signal**, and a
throat has signals for exactly this reason. So the fix is to author the
missing boundary, not to compute a path through movable points.

## Non-goals

- Making block sections dynamic or switch-position-aware.
- Changing `coverage: "whole-track-group"` (loop) semantics.
- Touching Bekasi, whose sections are hand-authored and never derived.
- Re-opening switch numbering, `switchMeta`, or control-group identity.
- The JNG stub timetable (separate tracked item).
- Any change to movement/reservation/collision/interlocking algorithms.

## Design sketch (to be confirmed in Step 1)

Add a **boundary marker** to the piece vocabulary — a named point at which a
section terminates, authored positionally like signals and platforms:

```ts
{ kind: "boundary", id: "BE5", groupId: "t5", x: 528, facing: "toward-to" }
```

The derivation then walks: *signal → next same-facing signal on this group →
or next boundary marker → or (only if neither) the map edge.*

`legacyOpenEnd` survives only for the 9 ends that really are the map edge,
where it is correct rather than a fallback.

**Open question for Step 1:** whether a throat boundary is better modelled as
a real signal (it usually is one in practice — a starting/exit signal) rather
than a new piece kind. If so, Phase 10 becomes "author the missing throat
signals" and needs no new vocabulary at all. **Decide this from the real
Jatinegara throat before writing any code** — Phase 9's Step 6 premise was
stale and cost a day; re-derive from the draw.io dump
(`scripts/extract-jng-cells.py`) rather than from this document.

## Staged path

### Step 1 — decide the model, from the artefact  *(evidence gathered; decision open)*

The 17 open ends classify into **three** kinds, not two:

| kind | count | ends | correct treatment |
|---|---|---|---|
| map edge | 9 | XW2 XW3 XW4 XW6 XW7, XE1 XE2 XE3 XE4 | `legacyOpenEnd` is **correct** — the railway leaves the diagram |
| throat | 7 | NE5 NE6 XW5, XE5 XE6 XE7 XE8 | needs a real boundary — track continues via a crossover into a switch |
| dead stub | 1 | XW8 (224,272) | nothing beyond at all — `t8`'s west tip is a true buffer//stub end |

Each throat end leads directly into a switch:

```
section-XE5  (528,368) → d-xov14 → (560,336) SWITCH 44
section-XE6  (592,336) → d-xov15 → (656,400) SWITCH 29
section-XE7  (688,304) → d-xov18 → (752,368) turn
section-XE8  (528,272) → d-xov13 → (560,304) SWITCH 49
section-XW5  (336,368) → d-xov10 → (304,336) SWITCH 43
section-NE5 (1040,368) → d-xov29 → (1008,400) SWITCH 36
section-NE6 (1008,336) → d-xov27 → (944,400) SWITCH 34
```

This confirms the phase's premise — 7 sections really do stop short of where
the track goes — and **narrows it**: only 7 boundaries are needed, not 17,
and the dead stub (XW8) is a third case that neither a boundary nor a map
edge describes.

**Still to decide before Step 2** (requires the real signalling diagram, not
this repo's data): whether each of the 7 is terminated by an existing
physical signal at the throat — in which case author those signals and add no
vocabulary at all — or genuinely needs a new non-signal boundary marker.
Cross-check against the draw.io dump (`scripts/extract-jng-cells.py`) for
signal symbols near those 7 coordinates before choosing.

Also decide XW8: a buffer stop is arguably its own piece kind, and calling it
"open to the west" is as wrong as the throat cases.

### Step 2 — vocabulary + derivation
Implement whichever model Step 1 chose. `legacyOpenEnd` becomes map-edge-only.
Keep the derivation group-local; the boundary is what makes that correct.

### Step 3 — author JNG's throat boundaries
Add the 7 throat boundaries (and whatever XW8 resolves to). Expect the JNG baseline to change — this is the one
phase where that is intended. Re-capture and record why.

### Step 4 — verifier + acceptance
Extend `scripts/verify-jatinegara.ts` to assert each section ends at a named
boundary or the map edge, and that no section ends "because the group did".

### Step 5 — revisit the deferred spike
With boundaries real, re-evaluate `SPIKE-block-section-anchors.md`, which was
deferred pending exactly this.

## Risks

- **Baseline churn.** This phase rewrites JNG's compiled output. The baseline
  is the only proof JNG is correct, so Step 3 must re-capture deliberately,
  with the diff reviewed section by section — not regenerated blindly.
- **Bekasi must not move.** Its sections are hand-authored; `verify:bekasi`
  and the byte-identical snapshot are the guard.
- **Scope creep into interlocking.** If the design starts needing point
  positions, stop: that is the signal the model is wrong, not the engine.
- **Prerequisite.** `app/pieces/jatinegara.ts` must be green before Step 3;
  otherwise throat changes cannot be told apart from in-progress geometry
  edits. (At time of writing it is mid-edit with 4 verifier failures.)

## Rejected alternatives

- **Walk through switches, choosing `normal`.** Silently wrong whenever points
  are reversed, and makes a static artefact depend on runtime state.
- **Extend the stub lines so sections have length.** Tried during JNG editing:
  extending `t5`/`t8` promotes their fixed turns into switches needing levers
  (`xov13`/`xov14` feet sit exactly at the tips). Geometry cannot paper over a
  missing boundary.
- **Special-case stub ends.** Prohibited by the standing rule against
  layout-specific engine behaviour.

## Gate sequence

```bash
npx tsc --noEmit
npm run build
bun run verify:bekasi            # must stay byte-identical
bun run verify:jatinegara
bun run verify:jatinegara:baseline   # expected to change in Step 3 only
bun run verify:pieces
npm run test:e2e
```

Run by **exit code**, never by grepping output for FAIL/Error.
