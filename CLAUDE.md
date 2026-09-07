# Working Rules for This Project

Real operational discipline, earned from actual session experience (2026-09-05/06), not generic best practice. These apply automatically, every session — no one should need to re-explain them.

## Git

- **Never run `git add`/`git commit` unless the user explicitly asks for one in that turn.** Writing to files is unrestricted and encouraged; committing is not the same action and is never inferred from momentum, however much documentation work just happened. If a natural checkpoint arrives, say so and ask — don't act on the judgment call unilaterally.
- The user manages commits themselves, at whatever cadence they choose. Expect that to mean more frequent, smaller, user-initiated commits than one commit per session.

## Session scope

- **Keep a session to one mode**: investigate, decide/document, or build. This project's sessions run long when they mix all three, and that's exactly when discipline (like the git rule above) tends to slip.
- **Prefer closing a session at a natural phase boundary** (investigation → decision, decision → build) over continuing into a new mode in the same conversation, especially once a real architectural decision has just been written down.
- **Before closing a session that will hand off to a new one, write a real hand-off note** — not generic ("catch up on prior work"), but specific: name the exact files to read, in what order, and the real open decisions still pending. Precedent: `governance/roadmap/facts-serving-strategy/16-session-handoff-2026-09-05.md`.
- Don't rely on self-detecting proximity to a context compaction — there's no reliable internal signal for this. The real mitigation is writing important findings to real files as they happen throughout a session, not saving it all for the end, so there's less at risk regardless of whether the boundary gets noticed in time.

## Documentation discipline

- **Write real findings to files as they happen**, not from memory at the end of a session. This project's own real, quantified results (retrieval experiments, verification numbers, root causes) only stayed trustworthy because they were recorded immediately, not reconstructed afterward.
- **Mark things superseded, don't rewrite or delete history.** When a direction changes, add a clear "superseded YYYY-MM-DD, see X" note on top of the old reasoning and leave the reasoning itself intact — a future reader needs to see *why* a prior decision made sense at the time, not just that it changed.
- **Every real initiative gets its own numbered roadmap folder and task doc** (see `governance/roadmap/facts-serving-strategy/`, `building-workflows/`, `market-research/`, `mcp-direction/` for the established pattern) — this is what makes smaller sessions and hand-offs actually work; a new session should be able to orient from the folder alone.
- New architectural decisions get a real ADR (`governance/adrs/`), not just a roadmap-folder note — and update `governance/adrs/README.md`'s catalog when adding one; it's easy to forget and it's already happened once.

## Testing and verification

- **Run cheap, real, bounded tests before scaling up.** Every genuinely useful finding this project has produced came from a small, real test against known cases first, not from reasoning in the abstract about what should work.
- **Keep a "before" baseline whenever testing a fix**, and compare directly — don't trust a fix worked just because it ran without error.
- **Delete temporary diagnostic scripts the moment their findings are written up.** Real findings belong in a doc; the script that produced them doesn't need to linger in the repo afterward.
- **Flag real spend (LLM calls, cloud costs) explicitly before running it**, every time, never buried inside a larger step.

## Memory vs. this file

This file is auto-loaded, every session, unconditionally — the right place for rules that must always apply. The project's memory system (`/Users/dopenshaw/.claude/projects/.../memory/`) is for project-specific facts, context, and feedback that inform judgment when relevant, but individual memory files are only read on-demand, not guaranteed loaded — don't rely on memory alone for something that must never be skipped.
