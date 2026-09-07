# Session Handoff — 2026-09-07

**Landmark reached this session: the retry-waste failure mode (Steps 13/16) is fixed and validated three ways.** This is the real headline — everything else below is context, open threads, or smaller findings.

## Read first, in this order

1. **`governance/roadmap/mcp-direction/10-sectioncontent-implementation-tasklist.md`, Steps 12-18.** This is the real, complete record of today's work — the User Stories investigation (paused), the turn-budget-waste diagnosis (cross-session with `e2`), the `maxTurns` raise to 100, the Audit Trail redesign, and the actual fix + its three real validations. Read it in order; each step builds on the real finding before it.
2. **`governance/roadmap/mcp-direction/atomic-prd-agent-skills.md`** — the *active, currently favored* persona file. Compare against `atomic-prd-agent-persona.md` (the original) to see the real difference: the skills file has the fix (a sentence on `search_facts` explaining vector search matches meaning, not syntax); the original persona does **not** have this fix applied, even though it has its own separate addition (step 5, actor-coverage instruction, from Step 12).
3. **`governance/roadmap/market-research/17-findings-semantic-search-retry-guidance-2026-09-07.md`** — the real research (Cursor, Windsurf, Claude Code's own published prompts) that the fix's wording was based on. Also names a real, unresolved structural question: none of these systems solve this with wording alone, they all pair a semantic tool with an exact-match one. This project only has the semantic one.

## What's actually proven, with real numbers

Three real runs today, all under the fixed `atomic-prd-agent-skills.md`, all converged cleanly with no retry-spiral and no fabrication:

| Run | Business question | Turns | Cost | Notes |
|---|---|---|---|---|
| `2026-09-07-004-ownernonresident-1a-tool-desc-fix-test.md` | Add `ownerNonResident` inhabitant type | 17/100 | $0.087 | The exact case that failed twice before the fix (Steps 13, 16) |
| `2026-09-07-005-resident-departure-2a-tool-desc-fix-regression-test.md` | Resident Departure (already-working case) | 30/100 | $0.083 | Regression check — identical turn count to the pre-fix success, no quality drop |
| `2026-09-07-006-supplier-activity-tab-6-test.md` | New Supplier Activity tab | 18/100 | $0.686 | Genuinely new business flow, first real test of the fix on unseen ground — succeeded, but cost/duration were much higher despite *fewer* tool calls than the others (see Step 18's last entry — a real, unexplained cost-driver worth investigating separately) |

## Real, still-open decisions — none of these have been acted on

1. **Apply the same fix to `atomic-prd-agent-persona.md`.** Only the skills file has it. If the original persona (with its actor-coverage step 5) is ever used again, it needs the same `search_facts` sentence, or it'll still be exposed to the retry-waste pattern.
2. **The structural question from the market research**: should this project build a second, exact-match search tool alongside `search_facts`, matching how every real system checked (Cursor, Claude Code) pairs semantic + exact search? The wording fix is real and working, but the research itself says it's a partial answer — not decided, not scoped, not started.
3. **Two-tier `maxTurns`** (Step 13's original recommendation) — never built. `maxTurns` is currently a flat 100 for every run, overridable via `MAX_TURNS` env var but with no policy for when a caller should raise or lower it.
4. **Step 12 (User Stories thinness / actor-coverage) — still paused, still n=1/2, inconclusive.** Not touched again this session. If picked back up, needs several more independent real runs specifically targeting that question, not incidental data from other investigations.
5. **The cost/duration anomaly on the Supplier Activity run** (17 calls but $0.69 and 3m46s, vs. 29 calls for $0.08 and 2min on Resident Departure) — flagged, not investigated. Likely thinking-token spend during an extended but *legitimate* multi-angle search for one real symbol (`getAllActivities`) — worth a real look if turn-cost-vs-complexity becomes a live question again.
6. **Demo prep** (real, near-term, not urgent today): user has a POC demo in a few weeks. Discussed three real options — live CLI run, a simple local web page (textbox in, rendered doc out — not built, would need a thin Node/Express wrapper around the existing agent script), or walking through an already-generated document with no live run. Recommended a hybrid (web page as primary, pre-generated doc as safe fallback). Nothing built yet — pure discussion.
7. **VS Code MCP integration** — walked through how to connect the real, already-built `mcp-server/src/index.ts` (stdio transport, `@genkit-ai/mcp`) to VS Code 1.135.0's native MCP client via `.vscode/mcp.json`. Offered to create the config file; user hadn't confirmed before this session closed.

## Real, smaller findings from today, in case they matter later

- **`fact_id` is `text`, unbounded, no truncation** — confirmed directly against the schema. Anything that *looks* truncated (e.g., in a DB GUI's grid view) is a display artifact, not real data loss.
- **`search_facts` only ever compares the `embedding` column** (pgvector `<->` distance against `facts.description`'s pre-computed vector) — `fact_id`, `repo`, `module`, `kind` play no role in matching, only in what gets returned alongside a hit.
- **Real character survey of `facts.description`** (1,268-row sample): `/`, `_`, `-`, `.`, `:` are common (structural); `[`/`]`/`=`/backticks are rare (31, 31, 62, 4 occurrences respectively) — this is what grounded the fix's wording, and is explicitly TypeScript-repo-specific (flagged directly by the user) — will need re-checking once Kotlin/Swift/C++ repos are added, since their description-generation logic will differ.
- **`walk_cluster` can crash the whole run** on a fabricated anchor fact_id (Step 14) — a real, still-unaddressed gap: the tool throws an uncaught `[Fail-Closed]` error instead of returning a recoverable result the model could retry from, unlike `search_facts`'s `confident: false`. Not fixed this session, just documented.
