# Prompt 13 — Code touch-point inventory for the fact_id → surrogate key change (ADR-010)

**Standing rule: never run `git add`/`git commit` in this session, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: investigation only. Do not write code, do not modify the schema, do not modify any pipeline or mcp-server file. Produce a findings document only.

## Context

Read `governance/adrs/adr-010.md` first — it is the decided direction and your reference document. Summary: `fact_id` (built from real source text, sometimes long and multi-line) is being replaced as the real identity/join key by a new, short, opaque surrogate reference (likely a content hash). The existing `fact_id` text stays exactly as-is, kept only as a display/citation label — no code should be written yet, this prompt is purely to find and list every place that needs to change once a build session starts.

Also read (for the real incidents driving this): `governance/roadmap/graphrag/11-fact-id-newline-reliability-finding-2026-09-17.md` and `10-case-2a-fanout-content-truncation-finding-2026-09-17.md`.

Already confirmed, do not re-derive: only 2 Postgres tables reference `fact_id` (`facts.fact_id` PK; `cross_repo_edges.source_fact_id`/`target_fact_id`), 3 existing indexes would be re-pointed, and in `mcp-server/` only one code site (`atomic-prd-agent.ts:762-763`, a diagnostic-only printout) parses `fact_id`'s internal structure — everything else treats it as an opaque string. You do not need to re-check these; treat them as ground truth from ADR-010.

## What you need to find (real, concrete, file:line — no guessing, no "likely")

### 1. Every place fact_id is *generated*
List every file across the pipeline (`pipeline/facts-postgres-index/` and any per-repo variants) that constructs a `fact_id` string — the ADR-010 discussion referenced roughly 5 duplicated `stableFactId()`/`boundedIdComponent()` copies (Angular, Firebase, Node-IoT, Kotlin, and possibly Swift), but the exact count and file paths were not re-confirmed for this prompt. Find and list every real copy, with file path and function name. Note which ones are truly identical logic vs. genuinely different (e.g. different thresholds) — this matters for whether they can consolidate into one shared generator later or need to stay separate.

### 2. Every place fact_id is *written to Postgres*
The actual INSERT/UPSERT statements that populate `facts.fact_id` and `cross_repo_edges.source_fact_id`/`target_fact_id` — file:line for each. Confirm whether these are the same files as #1 or separate loader scripts.

### 3. Every place fact_id is *read, compared, or passed as a tool argument* in `mcp-server/`
Specifically confirm and expand on what ADR-010 already found: `db/search.ts`, `db/graph-traversal.ts`, `agent-poc/validators.ts`, `agent-poc/atomic-prd-agent.ts`, `agent-poc/capability-fanout-prd-agent.ts`, `src/index.ts` (tool schemas). For each file, list every function/line that touches `fact_id`, and classify it as: (a) opaque equality/lookup use (safe to swap to the new column with no logic change), (b) display/citation use (should keep using the original `fact_id` text, unaffected), or (c) anything else you find that doesn't fit cleanly into (a) or (b) — flag these explicitly, don't force-fit them.

### 4. Existing repo pgVector data — how big is the backfill?
For each of the 9 already-loaded repos, get a real row count from `facts` and `cross_repo_edges` (`SELECT source_repo, count(*) FROM facts GROUP BY source_repo` or equivalent) — this scopes how large a one-time backfill script (computing the new surrogate for every existing row) would be. Do not write the backfill script — just report the real numbers.

### 5. Anything else genuinely touching fact_id you find while looking
If you find a real file/location touching `fact_id` not covered by #1-#3 (e.g. a test fixture, a gold-set file under `mcp-server/gold/`, a debug script), list it. Don't go looking beyond `pipeline/` and `mcp-server/` — those are the two real directories in scope.

## Output

Write findings to `governance/roadmap/graphrag/12-prompt-13-factid-surrogate-key-code-inventory-findings-<date>.md` (use today's real date). Structure it by the 5 numbered sections above, each with real file:line references — no summarizing away the specifics, this doc is what a future build session will work directly from.

Do not propose or write the actual migration/build plan — that's the next session's job, once this inventory is real and complete. If something is ambiguous or you're not sure whether a location is in scope, say so explicitly in the doc rather than guessing either way.
