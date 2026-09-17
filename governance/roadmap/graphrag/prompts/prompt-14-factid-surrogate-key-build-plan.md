# Prompt 14 — Build plan for the fact_id → surrogate key change (ADR-010)

**Standing rule: never run `git add`/`git commit` in this session, under any circumstance. Writing to files is fine; committing is not your call — only the user commits.**

## Mode: plan only. Do not write code, do not modify the schema, do not run anything against Postgres, do not execute a migration. Produce a single plan document.

## Context — read in this order

1. `governance/adrs/adr-010.md` — the full decision, **including §6's addendum** (three real scope decisions: `generate-atomic-prd.ts` is decommissioned and out of scope; the `mcp-server/db/` vs `pipeline/facts-postgres-index/_shared/` fork stays live and undecided, so **both copies** need the change; the phase-02 `citation-validator.ts` layer is deliberately being kept, not dead code, and is therefore in scope).
2. `governance/roadmap/graphrag/12-prompt-13-factid-surrogate-key-code-inventory-findings-2026-09-17.md` — the real, verified file:line inventory. Independently spot-checked already (row counts, fork comment, skill.v3.md wording, citation-validator.ts parsing — all confirmed accurate against live Postgres/files). Treat it as ground truth; don't re-derive it.

## What the plan must cover — be concrete, make real recommendations, don't leave things open that you can reasonably decide

1. **Schema change**: exact DDL sketch — new column(s) on `facts` and `cross_repo_edges`, type/length, uniqueness constraint, index creation/re-pointing. Sketch only, not applied.
2. **Surrogate value design**: recommend a concrete hash approach (algorithm, which real input components feed it, truncation length) — stay consistent with the existing `boundedIdComponent()` SHA1 precedent (`pipeline/*/phase-01-ast-extraction/02-build-module-evidence.ts`) unless you have a real reason to diverge; say so if you do.
3. **Backfill approach** for the real existing data (68,902 `facts` rows + 17,195 `cross_repo_edges` rows, confirmed counts) — one-time script design (describe it, don't write it), sequencing (facts before edges, or one pass), and confirm it's a pure computation over existing `fact_id` text with no re-extraction needed.
4. **Generator-side changes**: how the 5 `stableFactId()`/`boundedIdComponent()` copies (byte-identical logic, 3 real thresholds: 2000/500/200) get updated so newly-extracted facts get the surrogate at generation time — recommend whether to consolidate into one shared generator now or keep 5 copies and just add the surrogate to each (the inventory found consolidation is low-risk but didn't decide it; you should). Include `04-build-resolved-graph.ts` (all 5 pipeline dirs) as a real consumer that threads `sourceCallFactId`/`targetFactId` through to `resolved-engineering-graph.json` — it needs the surrogate too.
5. **Loader-side changes**: `sync-facts.ts`, `build-cross-repo-edges.ts`, `build-intra-repo-edges.ts`, `build-form-field-lineage-edges.ts` — what changes at each real INSERT/UPSERT site (file:line, from the inventory §2).
6. **`mcp-server/` changes — both copies**: `mcp-server/db/{search,graph-traversal}.ts` AND `pipeline/facts-postgres-index/_shared/{search,graph-traversal}.ts` (the fork stays live, per ADR-010 §6 point 2 — both need the change independently). Also `validators.ts`, `atomic-prd-agent.ts`, `capability-fanout-prd-agent.ts`, `section-content.ts`, `src/index.ts` tool schemas. Use the inventory's (a)/(b)/(c) classification: (a) sites swap mechanically; (b) sites (display/citation text) don't change; (c) sites need a real design decision — **propose one for each**, specifically:
   - The fabrication near-miss diagnostic (`atomic-prd-agent.ts:762-765`) — a short opaque hash has no `|`-structure to split on. Recommend a real replacement approach (or a deliberate decision to drop the diagnostic), don't leave it open.
   - `citation-validator.ts`'s `split("|")` site (~line 190, angular/firebase/node-iot phase-02) — same kind of call, needed because this layer is being kept (ADR-010 §6 point 3), not dead code.
7. **Skill-file rewrite**: `mcp-server/skills/prd/skill.v3.md` has three separate instructions telling the model to copy `fact_id` "verbatim" into tool arguments and citations (lines ~34, ~37, ~60 per the inventory). Propose the actual replacement wording that matches a short-reference tool-argument shape instead of verbatim copying.
8. **Testing/verification approach**: what would prove the swap didn't silently break citation matching — recommend re-running the two known real test cases (1a "ownernonresident", 2a "resident departure date") and comparing against their existing baselines, plus anything else concrete you think is warranted.
9. **Sequencing**: the real order of operations across items 1-8 — what must happen before what (e.g. schema change before loader changes before generator changes before mcp-server changes, or some other real order), and what's safe to do in parallel.

## Output

Write to `governance/roadmap/graphrag/13-prompt-14-factid-surrogate-key-build-plan-<date>.md` (use today's real date; note the folder already has a `13-` used for this prompt file itself under `prompts/` — that's a different location, not a collision, but double check the numbered-doc folder for the next real number before writing since numbering has drifted before this session).

This is a plan for a human (the user) and a future build session to execute from — be concrete and decisive on judgment calls within your own reasonable authority, and explicitly flag only the few things that genuinely need the user's own call (e.g. anything with real, irreversible cost or ambiguity you can't resolve from the two reference docs).
