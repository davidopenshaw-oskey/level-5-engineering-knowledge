# Prompt 9 — build and test capability-scoped PRD generation

Copy everything below the line into a fresh Claude Code session in this repo. This is the real destination the whole `graphrag/` investigation and today's cleanup batch (`stableFactId` bounding, intra-repo edges) were clearing the way for — read the background first, don't skip it. The concrete design below was worked out live, in discussion, before this prompt was written — it's not a starting proposal, it's the real, already-settled shape to build against.

**Standing rule: do not run `git add` or `git commit` under any circumstances.** Leave all changes uncommitted and report back — only the user commits, always.

---

## Background — read these first, in order

1. `governance/roadmap/graphrag/01-findings-and-open-questions-2026-09-10.md` §10 — the real, converged conclusion: the current one-hit PRD skill+template (gather evidence, write the whole document, one LLM call) has two known real failure modes — **Gap A** (a relevant fact never reaches the LLM's evidence at all — recall) and **Gap B** (the relevant fact *does* reach the LLM's evidence and it still doesn't get cited — judgment/dilution: `facts-serving-strategy/15-...md`'s Q1a case had the right Angular UI-binding fact sitting at evidence position #26, and the LLM's generated proposal never referenced it). Decompose generation by affected capability/module — a small, focused synthesis pass per capability — is the evidenced fix for Gap B.
2. `governance/roadmap/mcp-direction/40-technical-proposal-only-low-freedom-experiment-2026-09-10.md` — the one real, existing data point for narrow-scope generation (6 tool calls vs. 26+, a correctly-earned `[NEEDS CLARIFICATION]`). n=1 — a second real data point from this task is valuable, not required.
3. `market-research/02-findings-retrieval-architecture-2026-09-05.md` — reranking (retrieve wide, then narrow) was proven to fix Gap A, never shipped. Not this task's job to build, but the routing step below reuses the same retrieve-wide shape.

## The real, current architecture this builds on — confirmed already, don't re-investigate

**`mcp-server/agent-poc/atomic-prd-agent.ts` is the live, current entry point** (confirmed via recent git activity and recent gold/eval output — `pipeline/facts-postgres-index/generate-atomic-prd.ts` is the older, superseded path, don't build there). Read the real file in full before touching anything — key pieces already confirmed real and reusable, unchanged:

- **`assembleDocument()`** (line ~592) — already deterministic, real, reusable. Takes a `GenerationOutput` (sections + content, 4 content kinds: prose/list/cited-list/user-stories) and renders the final document (citation numbering, repo references, audit trail, cost). **This does not need to change.** The one-hit call today is a single `ai.generate({ tools: [searchFacts, getGraphNeighbors, walkCluster], output: { schema: GenerationOutputSchema }, maxTurns: 100 })` producing one `GenerationOutput` covering every section at once (line ~691) — **this is the only piece that becomes multiple, smaller calls.**
- `checkFabrication`/`checkTemplateConformance` (`validators.ts`) run once on the final `GenerationOutput` today — should still work unchanged on a merged result, worth confirming, not assuming.
- `facts` table has structured `module`/`submodule` columns already — the real substrate for capability identification, not something to invent.
- `cross_repo_edges` now has real `INTRA_REPO_CALL` data for 8 of 9 onboarded repos (15,400 real edges, committed 2026-09-11) plus existing `HTTP_API_CALL`/`PUBSUB_TOPIC_BINDING` edges.

## The real, concrete design to build — settled through discussion, build this shape

**1. Routing pass (cheap, Postgres-only, no LLM call)**: one bounded `search_facts` call against the business request (top ~100-150, same scale as the reranking pilot — *not* the whole corpus), then group the returned fact_ids by their real `module` column (`SELECT DISTINCT module FROM facts WHERE fact_id = ANY(...)`). The distinct modules found are the candidate capabilities for this request. This step's only job is answering "which modules does this request even touch" — not gathering the actual evidence.

**2. Per-capability synthesis (the new LLM calls)**: for each identified module, a separate, smaller `ai.generate()`-shaped call, scoped to that module only — its own `search_facts`/`walk_cluster` calls, filtered/restricted to that module, gathering its *own* proper evidence rather than reusing whatever fell into the routing pass's shared top-150. This matters for a real reason: sharing one global top-k across capabilities would recreate Gap A one level up (one capability's facts crowding out another's in a shared ranking). Each capability call produces a *partial* `GenerationOutput` — only the claims/content relevant to that capability, for whichever headings it has something real to say about.

**3. Merge step (new logic, the one genuinely new piece)**: combine each capability's partial `GenerationOutput` into one final `GenerationOutput` — per heading, concatenate/merge the partial content (e.g., all capabilities' `cited-list` items for "Technical Proposal" become one combined list) — before handing the merged result to the existing, unchanged `assembleDocument()`. Design and document exactly how merging works per content kind (`prose`/`list`/`cited-list`/`user-stories` each need their own real merge rule, not one generic one) — write this down before implementing.

## What to actually do

1. **Write the concrete merge-logic design down** (per content kind, per the point above) as a real, dated doc in `governance/roadmap/graphrag/` (numbered, following this folder's own convention) before implementing — this is real architecture, document it the way this project documents its others.
2. **Build a first, narrow, real implementation** of the 3-step shape above, inside/alongside `atomic-prd-agent.ts` — reuse `assembleDocument`/`validators.ts` unchanged, don't fork them.
3. **Test it for real against the Q1a "ownerNonResident" case** (`facts-serving-strategy/01-qa-vision-and-examples.md`, real prior baseline in `15-workflow-clustering-and-angular-ux-facts.md`) — the real test is whether the Angular UI-binding fact (previously found but never cited) actually gets cited this time. An honest negative result is a real, valuable finding, not a failure to hide.
4. **Compare directly against the existing one-hit baseline** for the same case: tool-call count, real cost, and the citation outcome above.
5. **Track real cost throughout** — check `pricing.ts` for real historical per-call costs before running anything new, report the real estimate before spending, then the real final cost against it.
6. **Leave all changes uncommitted.** Report your design doc, real test results, and real cost numbers plainly, per the standing rule above.

If the real current code doesn't match what's described here once you're actually in it, say so directly and adjust — this describes a real, discussed design, but confirm every detail against real, current code, not memory.
