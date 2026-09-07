# Session Hand-off — 2026-09-06, MCP Tool Server Build

**Purpose of this file:** a new Claude session picking up the MCP server build should read this file first, then follow its pointers in order — not treat this file as the full record. Real reasoning lives in the numbered docs below.

## Read these, in this exact order, before writing any code

1. `governance/adrs/adr-007.md` — why this exists at all: the real chain of evidence (two failed hybrid-retrieval experiments, a decisive reranking test, a real code-genericity critique, and Gemini Enterprise's own 2026-09-05 custom-MCP-server announcement) that led to replacing hardcoded pipelines with a generic MCP tool layer + task-specific agent personas.
2. `governance/roadmap/mcp-direction/01-mcp-tool-server-tasklist.md` — the actual build plan. Steps 1-3 now include real, verified Genkit MCP API code and real Cloud Run deployment commands (checked directly against `genkit.dev` and Google's own Cloud Run codelab, 2026-09-06) — not narrative description to translate into code yourself.
3. `pipeline/facts-postgres-index/_shared/search.ts` and `pipeline/facts-postgres-index/_shared/graph-traversal.ts` — the real, already-tested logic the three MCP tools wrap. Read these directly; don't re-derive their behavior from the tasklist's summary of them.
4. `CLAUDE.md` (repo root) — operational rules for this project, written 2026-09-05/06 after a real mistake this session (unprompted commits). Applies automatically, but worth reading consciously once: **never run `git add`/`git commit` unless the user explicitly asks in that specific turn.**

## Where things actually stand

**Nothing has been built yet.** Everything above is direction and a verified plan, not implementation. The `pipeline/facts-postgres-index/mcp-server/` folder does not exist.

**Real prerequisite, not yet done:** `walkBoundedCluster()` (in `_shared/graph-traversal.ts`, built and reframed as a generic tool 2026-09-05) has never been run against real data. Before or as part of Step 1/2, test it against a known anchor — the natural one is `OSKCreateOrganizationInhabitantComponent`'s `inhabitantType` control fact (fact_id: `angular_template_attribute|features|hosting/web-app/src/app/features/portals/organization/features/entities/features/entity/features/properties/features/inhabitants/features/create-organization-inhabitant/create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formControlName|#3`), whose real downstream chain is already fully mapped by hand in `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md`. Real, unverified risk flagged in the code itself: `INTRA_REPO_CALL` fan-out (2,362 real edges) could make clusters explode in size before hitting the depth/size caps — check this directly, don't assume the caps are sufficient.

**Real design decision needed during Step 1, not yet made:** `_shared/search.ts`'s `search(query)` has no `limit` parameter today — `RESULT_LIMIT = 25` is a hardcoded module constant, already flagged as "tuned to fit two known examples," the exact anti-pattern ADR-007 exists to move away from. The tasklist's Step 1 code assumes `search()` gains an optional `limit` parameter so the agent controls how broad to search — this is real, small, necessary code work on `search.ts` itself, not just a wrapper concern.

**Not yet decided, doesn't block starting:** where the production Postgres instance lives (needed for Step 3, not Steps 1-2); the exact agent-persona file format (Step 5, first real attempt); whether `generate-atomic-prd.ts` and its siblings get formally deprecated or run in parallel during a transition.

## Real ideas recorded but not scheduled, worth knowing about even if not acting on them yet

`01-mcp-tool-server-tasklist.md`'s "candidate future work" section records four related ideas from this session's discussion: transparent divergence-flagging in agent output, a corpus-stability report persona (reconnects to `adr-005.md`'s long-deferred sanity/health-report leg), a human-feedback link on generated outputs, and occurrence-counting for persisted anomalies (with a real, flagged schema implication and an open lifecycle-states question). None are scheduled. Don't build these yet — they're recorded so they aren't lost, not because they're next.

## The real cross-repo ambiguity to be aware of, not to solve now

42 real cross-repo `TypeName.field` symbol_names have genuinely divergent declared types (`governance/roadmap/facts-serving-strategy/15-...md`). Deliberate decision, recorded in the tasklist: `walk_cluster` should surface both declarations when it hits one of these, clearly labeled by repo, never silently merge or guess — resolution is deferred to agent-layer judgment (which repo's declaration fits the real chain being walked), not solved statically in the tool. If Step 2's real test of `walk_cluster` actually hits one of these 42, that's a genuine, useful data point — note it, don't treat it as a bug to fix immediately.

## Suggested next steps, in order

1. Test `walkBoundedCluster()` for real (cheap, no LLM cost) before wrapping it in MCP.
2. Add the `limit` parameter to `search()`.
3. Build Step 1's three tools using the real code already in the tasklist.
4. Test locally over stdio (Step 2) against the existing `facts-postgres-index-local` docker-compose instance.
5. Only then move to containerization/deployment (Step 3) — that's real cloud spend and infrastructure, worth its own explicit checkpoint with the user before proceeding.
