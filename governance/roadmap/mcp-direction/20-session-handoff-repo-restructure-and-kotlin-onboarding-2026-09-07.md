# Session Handoff — Repo Restructure + New Kotlin/Intercom Repo — 2026-09-07

**Purpose of this file:** a real, specific hand-off for a new session, written at a deliberate mode boundary — the prior session (documented in full in `19-session-handoff-2026-09-07.md`) was investigate/decide/document work culminating in a real milestone (the retry-waste failure mode fixed and validated three ways). This next session is real build/structural work — a different mode, on purpose, per this project's own session-scope discipline (`CLAUDE.md`). Two real, user-directed tasks, not yet started.

## Read first, in this order

1. **`19-session-handoff-2026-09-07.md`** — the prior session's full hand-off. Don't re-derive this context; it's already complete. Most relevant to *this* session specifically: the still-open items list (reproduced below, so this file doesn't require cross-referencing to be actionable).
2. **`08-sectioncontent-architecture-discussion-2026-09-06.md`**, "Repo-split question" section — the real reasoning that previously deferred moving `mcp-server/`: it currently imports `_shared/search.ts`/`_shared/graph-traversal.ts` directly as TypeScript functions, so relocating the folder alone just moves the coupling, it doesn't remove it. A real split needs `mcp-server/` to either own its own DB access or the shared code to become an installable package. That question was explicitly deferred "until a second real caller exists to define the right boundary" — Task 2 below is that caller arriving.
3. **`governance/roadmap/swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md`** — real, already-written anticipation of 9 classes of extraction problem for Swift/Kotlin, explicit about its own epistemic status (hypotheses from general language knowledge, not yet confirmed against a real repo). Its most recent addition (line 11) is directly relevant to Task 2: today's `search_facts` retry-waste fix is grounded in a character-frequency survey that is 100% TypeScript-corpus data — flagged as needing re-verification once a real Kotlin repo's `facts.description` values exist, not assumed to transfer.
4. **`governance/roadmap/market-research/08-findings-swift-kotlin-ast-extraction-2026-09-06.md`** — real, current tooling findings for Kotlin extraction specifically: the Kotlin Analysis API (K2-frontend-based, confirmed more foundational than lint tools — Detekt itself is built on it), `sourcegraph/scip-kotlin` as a real, named extraction-grade project, and the real SCIP polyglot-bridging pattern for getting a non-TypeScript extractor's output into this project's existing Node/Postgres pipeline.

## Task 1 — Move `mcp-server/` to repo root

**Real rationale**: deliberately deferred until a second real caller existed to define the right module boundary (see source #2 above). Task 2 (a new Kotlin/intercom repo needing the same MCP tool layer) is that second caller.

**Real, not-yet-answered design question this move needs to resolve, not just execute**: does `mcp-server/` get its own direct DB access (duplicating some of `_shared/search.ts`/`graph-traversal.ts`'s logic, or importing them as a real installable package), or does the shared code move first? Don't treat the folder move as purely mechanical — the real coupling question is the actual work.

**Already resolved, carry forward, don't re-litigate**: `mcp-server/config/` (its own self-contained Vertex AI config, `config.json` + `index.ts` loader) was deliberately built to *not* depend on the main pipeline's `config/llm-providers.json`, specifically anticipating this kind of split — a real precedent for how the rest of the move should probably go (own config, not reach into the parent pipeline's).

## Task 2 — New Kotlin/intercom repo, real access to edge devices

**Real motivation, already on record in two places**: `01-qa-vision-and-examples.md`'s own Example 2a explicitly scopes edge-device work as currently out of corpus reach ("The corpus cannot provide the PRD for the edge devices, but can suggest the work needed up to and the return from the node-iot repo"); the real `resident-departure-2a` PRD run (`2026-09-07-001-...md`) independently respected that exact boundary in its own output. A Kotlin/intercom repo closes that gap directly.

**Real, honest starting position**: nothing in `00-lessons-from-typescript-angular-extraction.md` is confirmed — it's anticipation, not findings. This project's own meta-lesson from that document (repeated for a reason): find real problems by running real extraction and hitting a real failure, not by reasoning from the doc in the abstract. Use it to know where to look first, not as a substitute for checking.

**Concrete first real check, cheap, before any extraction code is written**: does this new repo use SwiftUI/UIKit-equivalent dual-paradigm coexistence (Jetpack Compose vs. XML layouts + `findViewById`/ViewBinding — `00-...md` item 1), and does the Kotlin Analysis API (`08-findings-swift-kotlin-ast-extraction-2026-09-06.md`) actually resolve real types against this specific real codebase the way it's documented to elsewhere — verify directly, don't assume either.

## Real, still-open items carried forward from `19-...md`, not yet actioned

1. **`atomic-prd-agent-persona.md`** (the original, non-skills persona) still doesn't have the `search_facts` retry-waste fix — only `atomic-prd-agent-skills.md` does. If the original persona is ever used again, it's exposed to the same failure mode Steps 13/16 found.
2. **Real structural question, not decided**: should this project build a second, exact-match search tool alongside `search_facts`, matching how every real system checked (Cursor, Claude Code) pairs semantic + exact search? The wording fix works but the research itself says it's a partial answer.
3. **Two-tier `maxTurns`** — never built. Currently a flat 100, overridable via `MAX_TURNS` env var, no real policy for when a caller should raise or lower it.
4. **Supplier Activity run's cost/duration anomaly** ($0.69/3m46s on 17 calls vs. $0.08/2min on 29 calls for Resident Departure) — flagged, not investigated. Likely legitimate extended thinking-token spend, not confirmed.
5. **VS Code MCP integration** — walked through connecting the real, already-built `mcp-server/src/index.ts` to VS Code's native MCP client via `.vscode/mcp.json`. Offered, not confirmed or built.

## What this session should NOT do

Re-open Step 12 (User Stories thinness/actor-coverage) — still paused, still n=1/2, inconclusive, explicitly not touched further last session. Not this session's task unless the user redirects.
