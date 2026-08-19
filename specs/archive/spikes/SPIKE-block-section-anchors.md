# SPIKE: semantic anchors for block sections

**Status:** investigation only — no code changed, no schema changed.
**Recommendation:** **DEFER** (see below). Adopting this is an engine-level
change under `ADDING_LAYOUTS.md`'s standing rule and needs separate approval.

## Question

`TopologyBlockSection.edgeRanges` names every split edge a section crosses.
Could it instead be expressed as semantic anchors (signal → signal, signal →
boundary) that the assembler resolves the way `SignalPiece.x` already resolves
to an edge + segment + offset?

## What the data actually says

Measured against the live assembled JNG topology, not estimated:

| Fact | Value |
|---|---|
| Block sections | 23 |
| Total `edgeRanges` entries | 92 |
| Ranges per section | min 1, max 9 |
| Sections spanning > 3 edges | 13 of 23 |
| `coverage` values used by JNG | `signal-to-boundary` only |
| Sections with `legacyOpenEnd` | 17 |
| Endpoint kind pairs in use | `signal→edge-end`, `edge-end→edge-end`, `edge-end→signal` |

The busiest mid-span edges are each referenced by **3 different sections**,
plus 2 signals and 1–2 stop points:

```
e-t3-272-656   sections NW3, XW3, XE3   signals XW3, XE3   stops JNG
e-t6-304-560   sections NW5, XW6, XE6   signals XW6, XE6   stops JNG
e-t8-336-528   sections NW7, XW8, XE8   signals XW8, XE8   stops JNG, JNG-E
```

So splitting one busy edge — exactly what adding a crossover mid-platform
does — invalidates **6+ authored records across 3 tables** for that edge
alone. That is the pain this spike is about, and it is real, not theoretical.

The shape of the 92 entries is also informative: the interior entries are all
`edge-end→edge-end`, i.e. pure "and then the whole of the next edge too".
**Only the two ends of a section carry semantic information.** ~69 of the 92
entries (the non-terminal ones) are mechanical consequences of where the line
happens to be cut — precisely the kind of derived data
`ADDING_LAYOUTS.md` says an author should never be writing.

## What an anchor model would look like

```ts
// sketch only — NOT proposed for implementation in this spike
type BlockSectionAnchor =
  | { kind: "signal"; signalId: string }
  | { kind: "group-boundary"; end: "west" | "east" };

type TopologyBlockSectionV2 = {
  id: string;
  signalId: string;
  coverage: "signal-to-boundary" | "whole-track-group";
  from: BlockSectionAnchor;   // replaces edgeRanges[0].from
  to: BlockSectionAnchor;     // replaces edgeRanges[n-1].to
  legacyOpenEnd?: "west" | "east";
};
```

The assembler would walk the track group from `from` to `to` and emit today's
`edgeRanges` unchanged, keeping `TopologyDefinition` and `compileTopology`
untouched. That is the appealing property: it could be a **pure
authoring-layer change**, like the `switchMeta` rekey just completed.

## What would have to change in `compileTopology`

Nothing, if the resolution happens in `app/lib/pieces.ts`. The existing
validation in `app/lib/topology.ts` (~lines 852–925) already enforces every
invariant the resolver would need to satisfy, and would become the natural
acceptance test for it:

- ranges stay within one track group (`leaves track group`)
- ranges are contiguous (`discontinuous edge ranges`)
- every range runs with the signal's direction (`reverses its signal direction`)
- `signal-to-boundary` starts at its own signal (`does not start at its signal`)
- `whole-track-group` covers exactly the loop group's edges and reaches both
  physical endpoints
- `legacyOpenEnd` agrees with signal direction

A resolver that produces byte-identical `edgeRanges` for all 23 JNG sections
and both loop-fixture sections would be proven correct by
`verify:jatinegara:baseline` + `verify:pieces` with no new test authoring —
the same proof strategy that worked for the `switchMeta` rekey.

## Does `whole-track-group` fit?

Yes, and more cleanly than `signal-to-boundary`. Checked against the loops
fixture:

```
section-J1  whole-track-group  1 range   ["s1"]
section-J2  whole-track-group  2 ranges  ["s2a","s2b"]
```

`whole-track-group` is *already* semantic — it means "the entire loop group",
and `topology.ts` validates it by comparing against `sourceGroup.edgeIds`
wholesale. Under an anchor model it needs no `from`/`to` at all; the coverage
tag alone determines the extent. This case is strictly simplified.

## Why DEFER rather than adopt

1. **The forcing problem is now much smaller.** This spike was scoped when a
   stale edge reference failed silently or cryptically. The preflight added in
   `refactor(pieces): preflight operational edge references` now fails at the
   assembly boundary naming the table, record, and stale id. The remaining
   cost of a mid-span split is *mechanical editing*, not *silent breakage* —
   a much weaker justification for an engine-adjacent change.
2. **`legacyOpenEnd` on 17 of 23 sections is unresolved.** It encodes JNG's
   known-open throat boundaries, which are separately tracked open work. An
   anchor model needs a real answer for "this section deliberately runs off
   the end of the modelled world", and designing that *before* the throat
   boundaries are settled risks encoding a workaround as vocabulary.
3. **JNG exercises only one of the two coverage modes.** Only `loops-fixture`
   uses `whole-track-group`, with 1–2 edges. Designing the anchor resolver
   against essentially one real consumer invites a shape that fits JNG rather
   than the general case.
4. **Sequencing.** The natural trigger is the first real mid-span geometry
   edit. At that point the cost is concrete and measurable rather than
   projected, and the preflight will name exactly which records needed
   touching — that list is better design input than this analysis.

## Adopt-if

Revisit — and treat as an approved candidate — when **any** of:

- JNG's throat block boundaries are resolved, giving `legacyOpenEnd` a
  definitive semantics.
- A second layout adopts pieces with non-trivial block sections, giving the
  resolver more than one real consumer.
- A real mid-span split is actually required, making the edit cost concrete.

## Rejected alternatives

- **Derive block sections entirely from signals** (no author input): rejected.
  Block boundaries are an operational policy decision, not a geometric
  consequence; this collides with the standing decision that signals, stops,
  and blocks stay explicit operational data.
- **Auto-repair stale `edgeId`s during assembly** (re-point to whichever edge
  now covers the old span): rejected outright. Silently rewriting operational
  policy to match a geometry edit is exactly the class of failure the
  preflight was added to prevent.

## Verification of this document's claims

Every number above was read from the running assembler, not inferred:

```
bun -e 'import { JATINEGARA_ASSEMBLED as A } from "./app/pieces/jatinegara"; ...'
bun -e 'import { LOOPS_FIXTURE_PIECES } from "./app/pieces/loops-fixture"; ...'
```

Validation line references are `app/lib/topology.ts` ~852–925 (section
validation) and ~195–212 (`TopologyEdgeRange` / `TopologyBlockSection` types).
