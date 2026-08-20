# Proposal: a signal on an edge vertex should not break its block section

**Status:** IMPLEMENTED 2026-08-20 in `app/lib/topology.ts` (approved in
session). Both parts landed: the zero-delta guard and the terminus rejection
(open question resolved as option 1).
**Raised by:** JNG layout editing, 2026-08 (moving `XE5`–`XE8` east by 16).
**Blast radius:** one function in `app/lib/topology.ts`. Bekasi is unaffected
— see "Why Bekasi cannot see this".

> **Revision note.** An earlier draft of this document claimed the compiler
> "cannot determine the section's direction" when a range is zero-length, and
> recommended restructuring the derived ranges. That was wrong: the direction
> is computed from the signal itself and is already available at the failing
> line. The recommendation below is the opposite of the earlier one, and much
> smaller. The earlier analysis is preserved in "Rejected: restructure the
> ranges" so the reasoning is not repeated.

---

## Symptom

Placing a JNG signal exactly on an x where one edge ends and the next begins
fails at compile time:

```
Block section section-XE5 has no horizontal direction
```

Observed for `XE5` (t5 @ 512) and `XE8` (t8 @ 512), where 512 is the line's
terminus. **It is not a terminus-specific problem.** Moving `XE6` to x=544 —
an interior vertex on `t6` with 48 units of track beyond it — fails
identically. Any vertex triggers it.

## Mechanism

Edges are cut wherever a link foot lands, so `t5` is:

```
t5:   432 ──── 448 ──────────── 512
       edge A       edge B
```

A signal is stored as `edgeId` + `segmentIndex` + `offset`. The derivation
(`pieces.ts:872`) emits one range per covered edge and always starts range 0
at the signal, on the signal's own edge:

```ts
from: i === 0 ? { kind: "signal", signalId: signal.id }
              : { kind: "edge-end", end: east ? "from" : "to" },
```

If the signal sits on the vertex that *terminates* its own edge, range 0 spans
from the signal to a point the signal is already standing on — zero length:

```
XE6 @ x=544, facing east:
  range 0:  e-t6-400-544   signal(544) → edge-end "to"(544)   deltaX = 0   ← throws
  range 1:  e-t6-544-592   edge-end     → edge-end             deltaX = 48  (fine)
```

Validation (`topology.ts:874-881`) then does this per range:

```ts
directionForDelta(to[0] - from[0], `Block section ${section.id}`) !== placement.dir
```

and `directionForDelta` (`topology.ts:357`) throws when `deltaX === 0`.

### The key point: direction is never actually unknown

`placement.dir` is computed from the signal's own `facing` field, at
`topology.ts:801-805`, long before block sections are examined:

```ts
const facingBearing =
  signal.facing === "toward-to" ? bearingOf(geometryFrom, geometryTo)
                                : bearingOf(geometryTo, geometryFrom);
const dir = bearingToDir(facingBearing);
```

So the comparison at `:876` is **not** asking which way the section runs. It
already knows. It is a sanity check that the range does not *contradict* the
signal — it guards the error immediately below it, `reverses its signal
direction`, which exists for hand-authored layouts where a range could be
typed backwards.

A zero-length range cannot contradict anything. It has no direction to
disagree with. The crash is an artefact of `directionForDelta` being written
to return only `"left" | "right"`, with no representation for "no opinion".

## Why this is a defect, not a rule

A signal at an edge join is ordinary railway practice — a switch's clearance
point is exactly where you would site one. Nothing about the interlocking is
ambiguous: the section starts at the signal, runs east, and ends at the same
boundary it always did. The compiler rejects a valid layout because of how the
derivation happened to slice the range list.

The behaviour is also silently order-dependent on where the *assembler* cut
its edges, which is itself derived from link endpoints. Adding an unrelated
crossover elsewhere on a line can move a cut onto an existing signal's x and
break that signal retroactively, with an error naming neither the signal nor
the crossover.

## Why Bekasi cannot see this

The two layouts do not share the code path:

| | Jatinegara | Bekasi |
|---|---|---|
| Signal placement | `edgeId` + `offset` | `x`, `y`, `dir`, `bearing` |
| Block sections | **derived** (`deriveBlockSections`) | **hand-authored** (`topologies/bekasi-tambun-cibitung.ts:314`) |
| Section paths | compiled from the walk | pre-drawn `sectionPaths` |

Bekasi's ranges are written by hand:

```ts
block("J1", [
  range("bottom-west", atSignal("J1"), atEnd("to")),
  range("bottom-2-5",  atEnd("from"),  atEnd("to")),
  ...
])
```

An author naturally starts a section on an edge that has length; a generator
has no such judgement. `J3`/`J6`/`J7` sitting happily at x=558/730 is
therefore **not** evidence that vertex placement is legal — it is evidence
that Bekasi never exercises the derivation. Bekasi can neither validate nor
refute this change.

## Recommendation: skip the direction comparison when the delta is zero

At `topology.ts:874-881`, treat a zero-length range as "no opinion" rather
than an error:

```ts
const delta = to[0] - from[0];
if (delta !== 0 && directionForDelta(delta, `Block section ${section.id}`) !== placement.dir) {
  throw new Error(`Block section ${section.id} reverses its signal direction`);
}
```

- The reversal guard is fully preserved: any range with real length is still
  checked against the signal, so a backwards hand-authored range still fails.
- Nothing is loosened, because a zero-length range carries no direction
  information to begin with — there is no malformed case being let through.
- `directionForDelta` keeps its current signature and its other caller
  (`:1140`, section path building) is unaffected; that site does not compare
  directions.
- The continuity check (`:872`, `has discontinuous edge ranges`) still runs,
  so a zero-length range cannot be used to smuggle in a gap.

### Consequence for the two cases

- **XE6 at an interior vertex (x=544)** — compiles. `section-XE6` covers
  544→592 via range 1; the empty range 0 is inert.
- **XE5/XE8 at a stub terminus (x=512)** — still needs a decision. There, the
  degenerate range is the *only* range, so the section becomes zero-length
  **overall**: a signal protecting nothing. This proposal does not silently
  legalise that. See "Open question" below.

## Open question: a signal at a terminus

A signal at the very end of a stub, facing the end, protects zero track.
That is arguably a genuine authoring error, not a compiler limitation. Under
the recommendation above it would compile — the ranges are individually
tolerated — which may be the wrong outcome.

Two defensible answers, and this should be decided explicitly rather than
inherited from whichever check happens to fire first:

1. **Reject it, with an honest message** — add a check that a
   `signal-to-boundary` section has non-zero total length, failing with
   something like `Block section section-XE5 protects zero track: signal XE5
   is at the end of track group t5`. Names the real problem.
2. **Allow it** as a legitimate "end of authority" marker, which then needs a
   defined meaning in the model (probably `legacyOpenEnd` with zero covered
   edges, which today's types cannot express).

Recommendation: **(1)**, because it is the smaller change and because nothing
in the current simulation consumes a zero-length section.

**Resolved as (1) and implemented.** A `signal-to-boundary` section whose
first range's `from` and last range's `to` share an x is rejected with:

```
Block section section-XE5 protects zero track within group t5: signal XE5 is at
that group's end, and section derivation does not cross the throat
```

The check runs after the per-range loop, so tolerating individual zero-length
ranges cannot smuggle in an empty section.

## Rejected: restructure the ranges

An earlier draft proposed dropping the degenerate leading range in
`deriveBlockSections`, so the section would begin at the next edge. This does
not work, and the reason is worth recording:

- `topology.ts:887` requires a `signal-to-boundary` section's first range to
  start at `{kind:"signal"}`. Dropping the range trades
  `has no horizontal direction` for `does not start at its signal`.
- `topology.ts:843` requires a signal anchor's `edgeId` to match the range's
  edge, so the anchor cannot simply be moved onto the next edge either.

Making that approach work would mean re-pointing the signal's `edgeId` to the
outgoing edge with `offset: 0`, or relaxing `:843` to accept an anchor at a
shared vertex — both far larger than the one-line guard recommended above,
and both changing what a signal's `edgeId` means.

## Rejected: reject vertex placement at authoring time

Adding a piece-preflight error ("signal XE6 sits on an edge join; offset it")
would produce a clearer message but would not *enable* a legitimate
placement. It also entrenches a restriction that only exists because of the
`directionForDelta` artefact. Worth reconsidering only if the recommendation
above is declined.

## Acceptance

- `XE6` at x=544 (interior vertex) compiles, and `section-XE6` covers
  544→592.
- A deliberately reversed hand-authored range still fails with
  `reverses its signal direction` — the guard is not weakened. Add a
  fixture case if none exists.
- The XE5/XE8 terminus case behaves per the resolved open question, with a
  message naming the terminus rather than `has no horizontal direction`.
- All 16 gates green, and the Bekasi snapshot **byte-identical** (Bekasi does
  not use the derivation, so this is a regression check, not a behaviour
  change).
- `verify:jatinegara:baseline` unchanged: no JNG signal currently sits on a
  vertex (verified — all 23 are clear), so a correct fix alters no existing
  output.

## Reproduction

```
# in app/pieces/jatinegara.ts, set signal XE6 x: 512 -> 544
bun run verify:grid-ref     # → Block section section-XE6 has no horizontal direction
```
