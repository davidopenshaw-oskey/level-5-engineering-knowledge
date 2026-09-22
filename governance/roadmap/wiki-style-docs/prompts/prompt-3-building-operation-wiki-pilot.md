# Pilot: one building operation explained from Postgres

## Goal

Test whether Postgres facts and relationships can support a useful engineering-wiki explanation of one API operation in `firebase-oskey-dev` / `building`. Evaluate semantic usefulness, not pipeline completeness. Use one agent and keep the investigation bounded to conserve the user's ChatGPT Plus allowance.

## User clarification — governing assumptions

The sync under `pipeline/facts-postgres-index` has not been run for a while, and there are known missing edges in the backlog. The restored database is a historical snapshot.

The user explicitly authorizes assuming that a fully synced pipeline will provide near-100% completeness and resolved edges. Treat that as a working assumption, not a measured result. Do not use current snapshot omissions to reject the wiki architecture, diagnose extraction defects, or launch completeness investigations.

Do not invent the missing relationships. In the sample page, describe any relevant omission as “not established in this database snapshot.” Distinguish what was actually retrieved from what is expected after full sync. Do not run sync, extraction, embedding, or edge-rebuild scripts.

The question is: even assuming complete facts and edges, how much engineering meaning can we explain, and what still requires architecture/persona context?

## Existing context

Read only `governance/roadmap/wiki-style-docs/04-building-postgres-inventory-2026-09-22.md` initially. No need to reread the wider roadmap or investigate Pub/Sub gaps.

Local connection: Docker container `local-pgvector`, database `facts_index`, user `postgres`, PostgreSQL 16; host port 5433. Use read-only transactions and applicable sandbox permissions. Never output credentials or embedding vectors.

## Task

1. Choose one building API operation with a resolved HTTP edge and useful contract evidence. Inspect at most three candidates before selecting one; prefer an operation that illustrates more than a trivial lookup. State why it was chosen.
2. Gather a bounded evidence bundle: contract, request/response fields, handler, and direct relationships. Inspect schema only as needed. Start with at most 20 relevant facts and 10 edges; disclose limits and omissions rather than recursively exploring. Save reproducible SQL and compact evidence including fact references, file/line, and run/commit provenance.
3. Write a short engineering-wiki draft, aiming for 400–700 words: purpose supported by evidence, caller/entry point, inputs/outputs, evidenced behavior and collaborators, any evidenced permission checks, and explicit unknowns. Cite actual fact references. Reference existence alone does not prove that the associated prose is supported. Do not infer business intent or enforcement solely from symbol names or permission candidates.
4. Use only Postgres for this first draft to establish its independent explanatory value. Then identify specific questions that relevant architecture/persona excerpts could help answer in a later comparison. Do not load those documents yet. Separate snapshot/backlog gaps from semantic questions that structured code evidence does not answer; if the cause is uncertain, say so.
5. Assess readability and evidence sufficiency for this operation only. Do not claim module-wide coverage or broad architectural infeasibility from this bounded sample.

## Outputs and stopping point

Write the draft and short assessment to `governance/roadmap/wiki-style-docs/07-building-operation-wiki-pilot-<date>.md`. Save evidence and SQL in a clearly named supporting location under the same folder. The reader should be able to distinguish the draft itself from the investigator's assessment.

Aim for combined tool output below 6,000 tokens and individual outputs below 1,500 tokens. Aggregate/filter locally and return only useful fields; these are output-volume targets, not a guarantee of account usage. No subagents, project model API calls, new embeddings, HTML renderer, graph fixes, database mutations, or commits.

Stop after one operation. Report the draft location, what it successfully explains, and the smallest useful next comparison. The user will check usage before and after.
