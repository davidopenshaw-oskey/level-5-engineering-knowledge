# First pass: Firebase building Postgres inventory

Scope narrowed on 2026-09-22 to conserve the user's ChatGPT Plus allowance. This replaces the broader audit originally drafted here.

## Goal and context

Inventory evidence available for `firebase-oskey-dev` / `building` in Postgres for a future engineering wiki. The original Phase 2 narrative pipeline was superseded; the human-facing documentation goal remains. Whether Postgres can supply sufficient wiki evidence is unproven.

Use one agent. Follow applicable repository instructions. This prompt is self-contained: do not read the wider roadmap, old reports, source clones, or the earlier conversation for this first pass.

## Connection

Known local setup: Docker container `local-pgvector`, PostgreSQL 16, database `facts_index`, user `postgres`; host port `localhost:5433`. Prefer `docker exec ... psql` without exposing credentials. Request normal sandbox escalation if Docker access requires it.

Restored from `output/runs/db_backup/facts_index-2026-09-21.dump`. Prior corpus totals were 69,005 facts and 17,649 edges; these are context, not module measurements. Verify the live schema and relevant data.

## Bounded work

1. Inspect only the schemas of `facts`, `cross_repo_edges`, and `extraction_runs`. Use read-only database transactions for all inspection.
2. Count building facts by kind and submodule, embedding presence, and available run/commit provenance. Aggregate in SQL; never return embedding arrays or all fact rows.
3. Count direct edges incident to building facts in both directions. Join actual fact references; distinguish within-module, cross-module, and cross-repo edges, connection types, and resolution states. Check whether the other endpoint resolves. Count an edge only once in totals. Do not recursively expand the graph.
4. Inspect at most 12 representative facts across useful kinds and at most 6 edge examples. Select useful fields, bounded descriptions, and payload key names first; inspect full payloads only for a specific unanswered question. Record sample selection and any truncation. Do not infer behavior from names alone.
5. Write a preliminary section-to-evidence matrix: module/submodule inventory, interfaces, data structures, permissions, dependencies, and cross-repo interactions. Distinguish measured inventory from sampled content. Mark synthesis suitability as provisional; do not claim exhaustive semantic coverage or that Postgres alone is sufficient based on this sample.

## Resource discipline

Keep combined tool output aimed below 6,000 tokens, individual outputs below 1,500 tokens. These are output-volume targets, not a hard account-usage cap. Save detailed results to files if needed, then read only summaries. Run local SQL/scripts for aggregation instead of asking the model to process raw rows. No new embedding calls, project LLM calls, subagents, database changes, renderer, source-code investigation, historical artifact comparison, or commits.

## Deliverables and stopping point

Save reproducible SQL as `governance/roadmap/wiki-style-docs/building-inventory.sql` and findings as `governance/roadmap/wiki-style-docs/04-building-postgres-inventory-<date>.md` (aim for at most 800 words excluding tables/SQL). Include actual database identity, measurements, sample limits, plausible wiki sections, and specific unresolved questions.

Stop after this inventory and report the smallest worthwhile next check. Do not expand into the larger feasibility audit. If blocked, report the exact blocker without speculative findings. Keep the final response short. The user will compare their account usage meter before and after; you cannot observe or guarantee account consumption.
