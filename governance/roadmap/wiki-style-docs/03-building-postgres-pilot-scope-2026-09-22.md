# Firebase building module: Postgres-backed wiki pilot

Status: user selected `firebase-oskey-dev` / `building` as the first pilot. Investigation and generation have not yet been executed. This file records scope and recommended working practice, not feasibility findings.

## Budget update, 2026-09-22

The user has chosen a small, single-agent first pass for a ChatGPT Plus account. The revised investigation prompt limits work to a Postgres inventory; historical comparisons and generation remain deferred. Use the Terra handoff in `04-terra-handoff-2026-09-22.md`. The broader sequence below is future context, not the next task.

## Question

Can the current Postgres facts, embeddings, and graph support a complete, evidence-backed engineering wiki for this module? Which sections can scripts produce, which need model interpretation, and which lack sufficient evidence?

The earlier wiki scope's claim that only an HTML renderer is missing is a hypothesis to test. Correct citations do not establish coverage or prove that cited facts support the prose.

## Sequence and deliverables

1. Evidence inventory: inspect the live schema, enumerate the module's facts and submodules, inspect payloads and provenance, and measure inbound/outbound relationships. Compare available Phase 1 structural artifacts and historic engineering reports against the database. Deliver a reproducible findings report and section-to-evidence matrix.
2. Deterministic baseline: export a bounded evidence package and render structural reference content. Record omissions and extraction freshness. Do not let vector top-k results define module coverage.
3. Narrative comparison: use the same evidence package for model synthesis; separately evaluate whether tool-assisted expansion improves it. Keep HTML rendering separate from narrative generation. Record model/settings, input evidence, citations, cost, and elapsed time.
4. Review: check factual support, important omissions, graph validity, readability, and reproducibility. Decide whether to extend the pilot only after these results exist.

Start with step 1. Later steps are proposed sequencing, not completed work or a chosen production architecture. Historic reports are comparison material, not authoritative truth. Compare commit/run provenance; distinguish unavailable local artifacts from absent pipeline capabilities. Do not infer missing behavior from names.

## Environment known from this conversation

- Container: `local-pgvector`, image `pgvector/pgvector:pg16`.
- Database: `facts_index`, host connection `localhost:5433`, user `postgres`.
- Restored archive: `output/runs/db_backup/facts_index-2026-09-21.dump`.
- Restore verification: 69,005 facts, 17,649 edges, 24 extraction runs; pgvector 0.8.6. These are corpus totals, not building-module measurements. Recheck the live state before relying on them.
- No credentials should be copied into reports or prompts.

## Working practice recommendation

Use one session per coherent outcome, rather than restarting after a fixed number of minutes. A 30–60 minute checkpoint is a practical review cadence, not a product limit or model-quality threshold. Persist the evidence, decisions, unresolved questions, and next action before changing sessions.

Start with one agent for the inventory. An independent reviewer can later challenge the findings; parallel workers become useful only for bounded independent tasks with separate outputs. No parallel delegation has been requested or started by this plan.

For the coding/research assistant, GPT-6 Astra at medium reasoning is a reasonable initial choice for the evidence audit, with high reasoning reserved for difficult architectural reconciliation or review. Low reasoning is suitable for well-scoped mechanical edits. This is a workload recommendation, not a benchmark result. Official documentation lists Astra reasoning settings as low/medium/high/xhigh/max; the user's UI label “light” has not been independently mapped to an API setting.

Choose the eventual wiki-generation model separately. Establish an acceptable result with a capable model, then compare cheaper candidates on the same frozen evidence and evaluation criteria. Do not change model, retrieval, and prompt together when measuring a result.

For a Claude-to-Codex transition, carry durable project conventions explicitly into an appropriate AGENTS.md if needed; do not rely on another tool's remembered conversation. Keep task-specific detail here and in the investigation prompt rather than growing a universal instruction file. No AGENTS.md changes are part of this document.

## References

- [Wiki scope](00-scope-and-deepwiki-research-2026-09-18.md)
- [Preserved structural pipeline](02-hanging-todo-orphaned-phase1-structural-pipeline-2026-09-20.md)
- [Investigation prompt](prompts/prompt-2-building-postgres-evidence-audit.md)
- [Official Codex best practices](https://learn.chatgpt.com/guides/best-practices): outcome-focused sessions, scoped prompts, durable guidance, and reasoning effort.
- [Official Astra model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra): model and reasoning settings.
- [Official model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection): establish accuracy before optimizing cost/latency.
