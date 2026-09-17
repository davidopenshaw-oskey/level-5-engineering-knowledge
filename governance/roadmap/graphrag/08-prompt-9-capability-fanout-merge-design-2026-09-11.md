# Prompt 9 — capability-fanout PRD generation: merge-logic design

Written 2026-09-11, before implementation, per this project's own documentation discipline (design written down before code). Real architecture for the 3-step shape settled in `01-findings-and-open-questions-2026-09-10.md` §10 conclusion 2: fan out generation by affected capability/module (fixes Gap B — evidence dilution), then collate into the template's fixed sections.

## 1. Real deviations from the prompt's literal description, found once inside the actual code

The prompt says to confirm every detail against real code, not memory. Two real things didn't match the assumed shape:

- **No second `SELECT DISTINCT module` query is needed.** `mcp-server/db/search.ts`'s `SearchResult` already carries `module` per row (`search.ts:73`). The routing pass's "group fact_ids by module" step is just `new Set(results.map(r => r.module))` over the same one `search()` call's results — no separate Postgres round-trip.
- **`walk_cluster`/`get_graph_neighbors` stay globally unfiltered, not module-scoped.** This is a deliberate design choice, not an oversight — see §3.

## 2. Routing pass (Step 1)

One `search()` call, `limit=150` (matching the reranking pilot's scale, `market-research/02-...md`), **no module filter, no LLM call** — pure Postgres vector search, already free relative to LLM spend. Distinct `module` values across the 150 results are the candidate capabilities.

Two real, deliberate bounds, both env-overridable (same convention as `MAX_TURNS`/`RESULT_LIMIT` elsewhere in this codebase):

- `CAPABILITY_MIN_FACTS` (default 3): a module needs at least this many facts in the routing pool to become its own capability call. Without this, one stray, weakly-related hit at rank #148 would trigger a full LLM synthesis pass for a module the request barely touches — real, avoidable cost for no real evidence gain.
- `CAPABILITY_MAX_CAPABILITIES` (default 5): hard cap on how many capability calls one run can fan out to, sorted by strength (see below) and truncated. Protects against a genuinely broad request (touching 8+ modules) turning into 8+ LLM calls without an explicit decision to allow that.

**Capability order** is deterministic and evidence-grounded, not arbitrary: modules are ordered by the vector distance of their *best* (lowest-distance) contributing fact in the routing pool. This same order is used later for merge concatenation order (§4), so the collated document reads most-relevant-capability-first.

## 3. Per-capability synthesis (Step 2) — what gets module-scoped and what doesn't

Each candidate module gets its own `ai.generate()` call, sequential (not parallel — see §5), each with:

- Its **own** `search_facts` tool, scoped to that module only (`search()`'s new optional third `moduleFilter` param, `mcp-server/db/search.ts`). This is the real fix for the "shared top-k crowds out other capabilities" restatement of Gap A the prompt itself named.
- Its **own** `walk_cluster`/`get_graph_neighbors` tools, **left completely unfiltered** — same behavior as the one-hit baseline. This is the one real, deliberate divergence from a literal "restrict everything to that module" reading, and it matters for the exact case this design exists to fix: in the real Q1a finding (`facts-serving-strategy/15-...md`), the Angular UI-binding fact (`angular_template_attribute`, module `features`) is only reachable from the backend `model_property` fact (module `building`) via a real, cross-module `FIELD_BINDING` edge. If graph traversal were also module-scoped, the "building" capability's own synthesis call could never see the Angular fact at all — reintroducing Gap A one level down, for the exact mechanism this design is supposed to preserve. The tool's own description text (sent to the model) says this explicitly: neighbors may belong to a different module, and citing them is expected when they genuinely support a claim about *this* capability's own code.
- A **capability contract** appended to the system prompt (same persona, `mcp-server/skills/prd/skill.md`, unchanged) naming: which module this call is scoped to; the full list of the template's headings/kinds (same shape as `renderTemplateContract`); and an explicit instruction to produce content **only** for headings this capability's own evidence actually supports — omit any heading with nothing grounded to say. This is what makes each capability's output a genuine partial `GenerationOutput`, not a forced full one.
- Its own fresh `seenFactIds` dedup set (not shared across capability calls) — each capability call is its own real conversation; the anti-repeat-search memoization (`atomic-prd-agent.ts`'s existing rationale) applies within one conversation, not across the whole run.
- A smaller `MAX_TURNS` (`CAPABILITY_MAX_TURNS`, default 20 — generous relative to the low-freedom experiment's 10, since this isn't a hard search-budget instruction, just a safety cap; overridable the same way).

## 4. Merge step (Step 3) — the one genuinely new piece, per content kind

Each capability produces a partial `GenerationOutput` (a subset of the template's headings). Before merging, each partial section is validated against the template: unknown headings are dropped (logged, not fatal — an off-template heading from one capability call shouldn't abort a whole run when the other capabilities' output is fine), and a heading whose `content.kind` doesn't match the template's declared kind for that heading is also dropped (logged) rather than merged, since the kind-specific merge functions below assume the kind is already correct. **Fail-closed is preserved where it matters**: this leniency is at the per-capability-partial layer only; the final merged `GenerationOutput` still goes through `checkFabrication`/`checkTemplateConformance` unchanged, and those still throw hard on any real problem (a fabricated citation, or a wrong final heading set).

The merged output **always contains all of the template's `llmHeadings`, in template order** — this is what lets `checkTemplateConformance` run unchanged on the result. A heading no capability had anything grounded to say about renders as genuinely empty content (an empty list, empty cited-list, empty prose string) — an honest "no capability-specific evidence" signal, not a fabricated placeholder, consistent with this codebase's existing "never invent, prefer honest absence" discipline (`validators.ts`'s own framing).

Per-kind merge rules, applied per heading, iterating capabilities in the §2 strength order:

- **`prose`**: concatenate each contributing capability's `text` as its own paragraph (`\n\n`-joined). If more than one capability contributes, each paragraph is prefixed `**{module}:** ` so a reader can tell which capability a paragraph came from — a single contributor gets no prefix (the common case shouldn't carry unnecessary attribution noise).
- **`list`**: concatenate `items` across capabilities in order, then drop exact-duplicate item strings (trimmed, case-sensitive), keeping the first occurrence. `checkable` is taken from the template's own declared value for that heading (fixed, not something a capability can override).
- **`cited-list`**: concatenate `items` across capabilities in order. Drop an item only if it's an exact duplicate of one already collected — same `claim` text **and** the same `evidenceIds` set (order-insensitive) — a narrow rule, since two capabilities independently making a related but differently-phrased claim about the same heading is real, useful signal, not noise. Citation numbering itself needs no new logic: `assembleDocument`'s existing `buildCitationNumbering` already numbers fact_ids in the order claims appear in the final, merged `sections` array — unchanged.
- **`user-stories`**: concatenate `items` across capabilities, then drop exact-duplicate `(actor, goal, reason)` triples (trimmed).

## 5. Why sequential, not parallel, capability calls

Two real reasons, both already documented elsewhere in this codebase, not new reasoning invented for this task:

1. **The real, confirmed Vertex quota ceiling** (`mcp-direction/...`, `project_adr007_mcp_agent_pivot` memory): `gemini-3.5-flash`'s `global_generate_content_requests_per_minute_per_project_per_base_model` is a real, measured 5/min, no per-model override. Running capability calls in parallel wouldn't make the run faster — it would just make every call contend for the same 5/min ceiling simultaneously and multiply 429-retry churn, not add real throughput.
2. **Genkit tool-registration behavior, checked directly in `node_modules/@genkit-ai/core/lib/registry.js`**: `defineTool` calling `registerAction` with an already-used tool name (`search_facts`, reused identically across every capability call so the persona's own tool-name references in `skill.md` stay accurate) logs `ERROR: ... already has an entry in the registry. Overwriting` but does not throw — safe under sequential execution (each `ai.generate()` call is handed its own tool objects directly, not resolved by a concurrent registry lookup), not proven safe under concurrent execution, and not worth the risk to prove out for this first build.

## 6. Cost aggregation

`RunMeta`/`assembleDocument` are reused unchanged (per the prompt's own instruction). The capability-fanout script builds one aggregate `RunMeta`: `toolCallCounts` and `tokenUsage` are summed across all capability calls (token-usage summation is valid since `computeApproxCost`'s formula, `pricing.ts`, is linear in each token count); `turnsUsed` is the sum of each capability's own turn count; `snapshotFreshness`/`factRepoMap` are computed once, the same way as today, from the union of every capability's `extractRealFactIds()` result (called once per capability response, unioned). One live `fetchVertexAiPricing()` lookup (free, not LLM spend) is reused for the whole run's cost total, same as today.

## 7. What this design does not attempt

- No change to `assembleDocument`, `validators.ts`, or `section-content.ts` — confirmed reusable unchanged, per §4/§6 above.
- No new document type / no change to the routing decision for which template a request uses — this only changes how the *generation* step is internally structured for a given template.
- Reranking (`market-research/02-...md`) is not built here — routing still uses plain top-150 vector search, not a reranked pool. Out of scope for this task, flagged, not silently assumed done.
