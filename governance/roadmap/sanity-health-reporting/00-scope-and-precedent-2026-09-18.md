# Scope capture — reviving phase-02 as dev-facing "ratification" reports, and finally scheduling ADR-005's sanity/health-report leg

Not started, not decided in detail — captured now, while fresh, per this project's own "write real findings to files as they happen" discipline. Two real ideas from the same conversation, tied together by real precedent already in this project's history.

## Idea 1 — dev-facing narrative reports so engineers can "ratify" AST extraction

Real motivation (user, 2026-09-18): if the old phase-02 per-module narrative reports were running again, they'd be easy to share with the actual developers who own each repo — giving them a readable, browsable account of what the extraction pipeline believes their code does, so they can confirm or correct it. Real, cited precedent: DeepWiki (deepwiki.com) — already independently researched and cited in this project's own `ADR-009` as real, primary-source evidence that Cognition's Devin ships exactly this kind of thing (auto-generated, browsable, per-repo documentation with agent-determined structure, not a fixed template).

**Correction, same day (2026-09-18) — the mechanism below was wrong, the goal wasn't.** ~~phase-02 already exists and ran successfully for `angular-app-oskey-io`/`firebase-oskey-dev`/`node-iot-api-oskey-io`... reviving it there is a bounded task, blocked mainly by `citation-validator.ts`'s known abbreviation-matching bug.~~ Checked DeepWiki's real architecture directly the same day: it generates wiki-style docs via an agentic system exploring a graph, the same shape as this project's own `capability-fanout-prd-agent.ts`, not phase-02's older deterministic-batch-synthesis pattern. Phase-02 is being decommissioned entirely (`governance/adrs/adr-010.md` §7, `[[project_phase02_reports_preserved]]`), not revived — it was also bespoke-per-repo (the same hardcoded anti-pattern `[[project_dynamic_pipeline_architecture_initiative]]` exists to fix) and already documented as too expensive, never finished. **The real path to this idea's actual goal (dev-facing narrative reports) is a new persona+template pair reusing the existing agentic PRD-generation infrastructure** — repo-agnostic already, no per-repo bespoke script needed for Kotlin/Swift/iOS either, unlike phase-02 would have required.

## Idea 2 — these reports should also surface structural/coverage gaps, not just narrative summaries

Real motivation (user, same conversation): today's `ios-oskey-dev` zero-cross-repo-edges finding (`governance/roadmap/dynamic-pipeline-architecture/01-...md`) was only discovered by accident, through a live PRD test failing to find iOS evidence. A dev-facing report generator should be able to catch this kind of gap directly and routinely, not rely on a downstream consumer stumbling into it.

**This is not a new idea — it's ADR-005's own, already-proposed, never-scheduled third leg.** Direct quote, `governance/adrs/adr-005.md`: *"Phase 2's whole-module, cross-cutting synthesis capability... may find its better-justified home as a **sanity/health report** generator (periodic or post-merge, whole-module scope, proactive flagging)."* That ADR already has a real, concrete precedent of its own: a 2026-09-06 update cites 42 real cross-repo `symbol_name`s found with genuinely divergent declared types (some real bugs, some naming collisions, some legitimate divergence) — the exact class of "the corpus's own internal consistency" finding this leg was meant to produce. As of ADR-005's last update (2026-09-11), this leg remains explicitly unscheduled.

**Today's zero-cross-repo-edges finding is the same class of gap as the 42-symbol finding** — both are real, corpus-level structural facts that a dedicated health-check pass would surface directly, rather than requiring a human or a downstream document-generation run to notice by chance.

## Real, concrete candidate checks for a future health-report pass (not exhaustive, not scoped in detail)

- Repos with zero cross-repo edges (today's iOS finding — would have caught this before the 1a multi-repo test needed to).
- Fact kinds that exist for some repos but have a suspicious zero-count for others where a comparable kind might reasonably be expected (the same pattern that led to finding Swift/Kotlin's missing integration-call kinds).
- Cross-repo symbol_name divergent-type findings (ADR-005's own already-cited real example, 42 real cases — never turned into an automated, repeatable check as far as this note can confirm).

## What this doc is not

Not a decision to build either idea now. Not a full scope/design doc — that's real, separate work for whenever this gets picked up. This is a capture of two real ideas and their real precedent, so neither gets lost or has to be re-derived from a future conversation transcript.
