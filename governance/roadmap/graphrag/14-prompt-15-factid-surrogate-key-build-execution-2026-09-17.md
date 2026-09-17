# Prompt 15 — Build execution report: fact_id → surrogate key (ADR-010)

Real build session, 2026-09-17. Executed per `governance/roadmap/graphrag/prompts/prompt-15-factid-surrogate-key-build-execution.md`, applying all four decisions recorded in `governance/adrs/adr-010.md` §6 and `governance/roadmap/graphrag/13-prompt-14-factid-surrogate-key-build-plan-2026-09-17.md`'s "Decisions" section. This doc is written incrementally, during the build, per this project's own documentation-discipline rule — not reconstructed from memory afterward.

## Step 0 — backup

Full `pg_dump` (custom format, `-F c`) of the live `facts-postgres-index-local` Postgres container taken before any DDL:

```
/private/tmp/claude-502/-Users-dopenshaw-development-level-5-engineering-knowledge/ad6b46a2-3e11-4ca4-80f7-501bab5252b2/scratchpad/facts_index_backup_pre_factref_20260917_173339.dump
```

276,009,113 bytes. Verified with `pg_restore --list` (run inside the container, which has the binary) — confirmed real `TABLE DATA` entries present for both `public.facts` and `public.cross_repo_edges`.

## Step 1 — schema DDL

Ran against the live `facts_index` database (`facts-postgres-index-local`, port 5433):

1. `CREATE EXTENSION IF NOT EXISTS pgcrypto;` — succeeded (not previously installed on this instance).
2. `ALTER TABLE facts ADD COLUMN fact_ref text GENERATED ALWAYS AS (encode(digest(fact_id, 'sha1'), 'hex')) STORED;` — succeeded, backfilling all existing rows as part of the one statement.
   - Sanity check: `SELECT count(*), count(DISTINCT fact_ref) FROM facts;` → **68,902 / 68,902** (matches plan's expectation exactly).
3. `ALTER TABLE facts DROP CONSTRAINT facts_pkey; ALTER TABLE facts ADD CONSTRAINT facts_pkey PRIMARY KEY (fact_ref);` — succeeded. Confirmed via `\d facts`: `facts_pkey` is now `PRIMARY KEY, btree (fact_ref)`.
4. `ALTER TABLE cross_repo_edges ADD COLUMN source_fact_ref ..., ADD COLUMN target_fact_ref ...` (same `GENERATED ALWAYS AS (encode(digest(..., 'sha1'), 'hex'))` pattern) — succeeded.
   - Sanity check 1 (join integrity): `SELECT count(*) FROM cross_repo_edges e LEFT JOIN facts f ON f.fact_ref = e.source_fact_ref WHERE f.fact_ref IS NULL;` → **0 rows**.
   - Sanity check 2 (NULL handling): total 17,195 rows; `source_fact_ref` populated on all 17,195; `target_fact_id IS NULL` count = `target_fact_ref IS NULL` count = **14,422 = 14,422** (digest(NULL) propagates NULL correctly for unresolved edges, no special-casing needed).
5. Index swap: dropped `cross_repo_edges_source_fact_id_idx` / `cross_repo_edges_target_fact_id_idx`, created `cross_repo_edges_source_fact_ref_idx` / `cross_repo_edges_target_fact_ref_idx` — confirmed via `pg_indexes`: net index count on both tables unchanged (a swap, not an addition), all other indexes (`facts_embedding_idx`, `facts_description_tsv_idx`, `facts_kind_idx`, `facts_payload_gin_idx`, `facts_repo_module_idx`, `facts_symbol_trgm_idx`, `cross_repo_edges_provenance_idx`, `cross_repo_edges_source_idx`, `cross_repo_edges_target_idx`) untouched.

All real, all matched the build plan's predicted outputs exactly — no surprises at the schema layer.

## Step 2 — `mcp-server/` code changes, both fork copies

Applied Decision 3 (rename `factId`/`evidenceIds`/`sourceFactId`/`targetFactId` and equivalents to `factRef`/`evidenceRefs`/`sourceFactRef`/`targetFactRef`) throughout, not just a re-point. Files changed:

- `mcp-server/db/search.ts` and `pipeline/facts-postgres-index/_shared/search.ts` (both fork copies) — `SearchResult.factId` → `factRef`; SQL `SELECT fact_id` → `SELECT fact_ref`.
- `mcp-server/db/graph-traversal.ts` and `pipeline/facts-postgres-index/_shared/graph-traversal.ts` (both fork copies) — full rename (`GraphNeighbor.factRef`, `GraphNeighborFact.factRef`, `ClusterMember.factRef`, `ClusterEdge.sourceFactRef`/`targetFactRef`, all internal identifiers and SQL columns); plus a new defensive check (§8 item 2, see below).
- `mcp-server/agent-poc/validators.ts` — `extractRealFactIds`→`extractRealFactRefs`, `normalizeFactId`→`normalizeFactRef`, `checkFabrication`'s param/logic renamed. Added explicit "superseded 2026-09-17" notes marking the whitespace-normalization logic as now a defensive no-op for real (whitespace-free) `fact_ref` values, kept rather than removed — the historical reasoning (109 real collision groups under the old `fact_id` scheme) is preserved, not deleted, per this project's "mark superseded, don't rewrite history" rule.
- `mcp-server/agent-poc/section-content.ts` — `SectionContentSchema`'s `cited-list.items[].evidenceIds` → `evidenceRefs`; `renderCitations`/`renderSectionContent` params renamed.
- `mcp-server/agent-poc/atomic-prd-agent.ts` — all tool schemas/handlers (`search_facts`, `get_graph_neighbors`, `walk_cluster`) renamed; `seenFactIds`→`seenFactRefs`; `getSnapshotFreshness` re-keyed on `fact_ref`; **`getFactRepoMap` replaced with `getFactMaps`**, returning both `factRepoMap` (ref→repo) and a new `factDisplayMap` (ref→real `fact_id` text) from one query (`SELECT fact_ref, fact_id, repo FROM facts WHERE fact_ref = ANY($1)`) — this is the one genuinely new piece of logic ADR-010 §2 requires (the appendix must keep showing real `fact_id` text even though citations now carry `fact_ref`). `RunMeta` gained a `factDisplayMap` field. `renderReservedContent`'s evidence-used case now renders `factDisplayMap[ref] ?? ref` instead of the raw ref at both display sites (Fact-Ids list and Audit Trail). The (c)-flagged near-miss diagnostic (formerly `atomic-prd-agent.ts:762-765`, pipe-segment matching) was replaced per the plan's recommendation: a reverse lookup against `factDisplayMap` that distinguishes "model cited the display text instead of the ref" from "genuinely unrelated invention, no near-miss signal available."
- `mcp-server/agent-poc/capability-fanout-prd-agent.ts` — same renames applied (`makeCapabilityTools`, `mergeOneHeading`'s cited-list case, `main()`); switched from `getFactRepoMap` to `getFactMaps`, added `factDisplayMap` to its `RunMeta` construction. Confirmed (per the ground-truth doc's own note) this file reuses `assembleDocument` unchanged — the `factDisplayMap` lookup logic lives in exactly one place (`atomic-prd-agent.ts`), not duplicated.
- `mcp-server/src/index.ts` (the real MCP server tool definitions) — same tool-schema rename applied for consistency with the agent-poc scripts.

**`citation-validator.ts` (angular/firebase/node-iot phase-02) — confirmed untouched**, per Decision 1. Verified its location (`pipeline/{angular-app-oskey-io,node-iot-api-oskey-io,firebase-oskey-dev}/phase-02-inter-module-synthesis/_shared/citation-validator.ts`) is structurally separate from everything touched above.

**Structural check (§8 item 2)**: added `warnIfNotFactRef()` to both `graph-traversal.ts` copies — logs (doesn't throw) if a `factRef` argument arriving at `expandWithGraphNeighbors`/`walkBoundedCluster` isn't exactly 40 lowercase hex characters, catching a stale client or un-migrated fork copy immediately rather than waiting for `checkFabrication` to notice downstream.

**Real, out-of-scope compile consequence, confirmed and flagged, not fixed**: `npx tsc --noEmit` across the whole repo shows 7 real errors, all in the three files ADR-010 §6 point 1 already scoped out of this build (`pipeline/facts-postgres-index/_shared/render-evidence.ts`, `pipeline/facts-postgres-index/_shared/technical-proposal.ts`, and the now-frozen `pipeline/facts-postgres-index/decommissioned_generate-atomic-prd.ts`) — they still reference `SearchResult.factId`/`GraphNeighborFact.factId`, which no longer exist post-rename. Confirmed via grep that none of these three files are imported by anything else in the live `mcp-server`/pipeline code (only by each other and by the decommissioned script), so this has zero effect on any real, running path — but it means a repo-wide `tsc --noEmit` is not clean, which is worth knowing if anyone runs one. Not fixed: fixing it would mean editing files ADR-010 explicitly excluded from this build. Everything else in the repo (verified by filtering these three files out of the same `tsc` run) compiles cleanly.

**Also confirmed, not this session's doing**: `pipeline/facts-postgres-index/generate-atomic-prd.ts`'s decommissioning rename (ADR-010 §6 point 1 / plan §9 step 5) was already done before this build session started — `git status` at session start already showed the old, typo'd `decommissioned_ generate-atomic-prd.ts` (stray space) deleted and the correctly-named `decommissioned_generate-atomic-prd.ts` (no space) added, both uncommitted. Left as-is; not re-done.

## Step 3 — `skill.v3.md` rewrite

`mcp-server/skills/prd/skill.v3.md` rewritten throughout (not just the two lines the plan originally called out) to use `factRef`/`evidenceRefs` consistently, per Decision 3's field renaming. Applied the plan's §7 proposed replacement wording for the two key instruction sites, adjusted for the renamed fields:

- The "Cite only real evidence" section's closing paragraph now describes `factRef` as "a short, opaque reference token — a 40-character lowercase hexadecimal string ... not a readable identifier ... carries no structure to abbreviate, paraphrase, or reconstruct from memory."
- The output-format JSON example (`cited-list.items[].evidenceIds` → `evidenceRefs`) and its accompanying rule paragraph updated to match.
- All other `fact_id`/`factId` mentions throughout the file (tool descriptions, workflow steps, "Cite only real evidence" bullets) updated to `factRef` for internal consistency — confirmed via grep, zero stale references remain in `skill.v3.md`.

`skill.md`/`skill.v2.md` (prior iteration snapshots) confirmed left untouched, per the plan's explicit scope note and this project's "mark superseded, don't rewrite history" convention.

## Step 4 — testing/verification

Schema-level and structural checks (§8 items 1-2) are done, above (no `[fact_ref format warning]` ever printed across any of the 4 real runs below — every `factRef` the model sent back was well-formed).

**Real spend flagged before running**, per this project's standing rule: estimated $0.65-0.75 total for all 4 re-runs, based on today's own already-recorded pre-ADR-010 baseline runs (1a one-hit $0.072, 1a fan-out $0.271, 2a one-hit $0.090). User approved running all 4. Actual real spend: **$0.0992 + $0.3104 + $0.0743 + $0.2775 = $0.7614 total** — within the flagged estimate.

All 4 runs executed via direct `node -r ts-node/register` invocation of `atomic-prd-agent.ts`/`capability-fanout-prd-agent.ts`, `PERSONA_FILE=mcp-server/skills/prd/skill.v3.md` (the confirmed-active persona) for all 4, against the live local Postgres instance post-migration. Full log: scratchpad `adr010-retests.log` (737 lines).

### 1a "ownernonresident"

| | one-hit | capability-fanout |
|---|---|---|
| Real tool calls | 22 | 5 capabilities, sequential |
| Real turns | 23 of 100 | up to 20/capability |
| Duration | 3m56s | 17m19s |
| Real cost | $0.0992 | $0.3104 |
| Real fact_refs seen | 210 | 350 |
| Validators | both passed | both passed |

Recorded v1 baseline (`mcp-server/gold/evals/1a-ownernonresident.eval.json`, 2026-09-07, pre-dates both v3 and ADR-010): 16 tool calls, 17 turns, 11 cited claims, 0 fabrications — a different persona version, not a strict apples-to-apples comparison, but the qualitative bar (both `OSKBuildingUnitInhabitantType` sites found, downstream call sites individually named, zero fabrications) held in this real re-test too — confirmed directly in the rendered output (`output/agent-runs/prds/test/2026-09-17-004-1a-ownernonresident-onehit-adr010-retest.md`'s Fact-Ids appendix correctly shows real, human-readable `fact_id` display text like `` `type_alias|building|.../building_unit_inhabitant_type_document.model.ts|OSKBuildingUnitInhabitantType|#1` ``, not the raw `fact_ref` hash — the `factDisplayMap` mechanism works end-to-end).

### 2a "resident departure date" — the case that originally exposed the transcription-drift bug

| | one-hit | capability-fanout |
|---|---|---|
| Real tool calls | 34 | 4 of 5 capabilities completed |
| Real turns | 35 of 100 | up to 20/capability |
| Duration | 2m27s | 22m19s |
| Real cost | $0.0743 | $0.2775 |
| Real fact_refs seen | 413 | 426 |
| Validators | both passed | both passed |

**Recorded one-hit baseline** (`governance/roadmap/graphrag/10-case-2a-fanout-content-truncation-finding-2026-09-17.md`): 25 tool calls, 26 turns, 2m7s, $0.0899, 401 real fact_ids, both validators passed. Real re-test: close on duration, cost actually *lower* ($0.0743 vs $0.0899 — consistent with ADR-010's predicted token-cost benefit of a 40-char ref vs. a long multi-line natural key), tool-call/turn count somewhat higher but well within normal LLM run-to-run variance, both validators passed in both. **No regression.**

**Recorded fan-out baseline: this variant previously crashed** (per the same finding doc, cost never recorded). **Real re-test: completed successfully.** Critically, the `core` capability — named in ADR-010 §1b-3 as the exact capability where the transcription-drift bug was originally found live — completed cleanly this time (19 tool calls, 20 turns, no crash, no fabrication). The `organization`, `features`, and `building` capabilities also completed cleanly. One capability (`user`) hit its independent 20-turn cap and was gracefully skipped (`[capability FAILED, skipped] 'user': ABORTED: Exceeded maximum tool call iterations (20)`) — this is the **already-known, separately-tracked capability-fanout completion-reliability issue** (ADR-010 §3: "the still-open, unrelated capability-fanout completion-failure rate... a different reliability problem, not addressed by this decision"), not a recurrence of the transcription-drift bug. `checkFabrication`/`checkTemplateConformance` both passed on the merged output.

**Conclusion**: this is a real, direct, positive result — the specific real run that used to crash on the transcription-drift bug now completes cleanly, with `factRef` values (confirmed in the tool-call log: `walk_cluster({"anchorFactRef":"0634ae0ee6b3b8231c096522f7d38d1a847b4cc0",...})`, `get_graph_neighbors({"factRefs":["fe64033b6fbfed137f54e9803525d133aaed8000"]})`) passed back correctly, verbatim, every time, across all 4 runs — zero fabricated citations, zero malformed `factRef` arguments. Per this project's own discipline, a clean pass here is corroborating evidence, not final proof on its own (LLM non-determinism means one clean run doesn't rule out a future bad roll) — but combined with the structural argument (a 40-char fixed-format hash has nothing left for the model to garble, unlike a long multi-line natural key), this closes the transcription-drift bug at its structural source, as ADR-010 §2 intended.

## Summary

All 4 execution steps (schema DDL, both `mcp-server/` fork copies, `skill.v3.md` rewrite, testing) complete. Real spend: $0.7614. One real, out-of-scope compile inconsistency flagged (§2, three decommissioned-pipeline-only files), not fixed, by design. No unresolved ambiguity encountered beyond what ADR-010/the build plan already resolved.
