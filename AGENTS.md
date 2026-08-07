<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:layout-program-rules -->

# Layout-complexity program — standing rules

These rules persist across sessions. They govern any work under the multi-phase
layout-complexity program documented in `docs/` (see `docs/INDEX.md`).

- **Read `docs/STATUS.md` first.** Before starting any step of this program,
  read `docs/STATUS.md` to learn the current phase, current step, what's done,
  and what's next.
- **Update `docs/STATUS.md` immediately.** After finishing a step or making any
  nontrivial decision, update `docs/STATUS.md` right away (current phase/step,
  what's done, what's next, and append to the decisions log — including anything
  you rejected and why). Keep it under ~50 lines.
- **Run `/compact` yourself at the end of each phase or major step.** Do not
  wait for auto-compact to fire mid-task.
- **Don't guess from memory.** If `docs/STATUS.md` doesn't have enough detail to
  proceed, re-read the relevant `docs/PLAN-phase-N.md` before acting — do not
  reconstruct the plan from memory.
- Keep changes behavior-preserving for the existing Bekasi layout unless the
  active phase explicitly changes behavior; the Bekasi snapshot baseline
  (`scripts/baselines/`, added in Phase 0) must stay byte-identical.

<!-- END:layout-program-rules -->
