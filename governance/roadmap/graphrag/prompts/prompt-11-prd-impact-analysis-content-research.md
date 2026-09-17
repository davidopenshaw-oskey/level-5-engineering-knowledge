# Prompt 11 — real-world content research: what should a PRD vs. an impact-analysis document actually contain

Copy everything below the line into a fresh Claude Code session. This is a pure research task (live web search/fetch), independent of and safe to run alongside prompt #9's capability-fan-out scaffolding — no shared files, no code changes here at all.

---

## Real context, so this doesn't re-derive from scratch

This project already researched the *retrieval/generation architecture* question once (`governance/roadmap/market-research/21-findings-agent-prd-template-vs-dynamic-structure-2026-09-09.md` — spec-kit, Kiro, Devin, fixed-vs-agent-determined structure). **That is not this task.** This task is about *document content*, not architecture: given the same underlying fact corpus, what should actually go inside a PRD versus an impact-analysis document — real sections, real content types, real differences between the two — not how the generation pipeline is wired.

The only real template that exists today (`mcp-server/skills/prd/template.md`) has one shape: User Stories / Technical Proposal / Acceptance Criteria / Constraints, plus reserved MetaData/Business-Request/Evidence-Used sections. It was bootstrapped once, early, from a generic traditional-PM template — never revisited against real practitioner sources. **Impact analysis has never been designed at all** — `governance/adrs/adr-006.md` §2b only names it as a plausible future task type, distinct from PRD scoping because ADR-005 already flagged it as answerable largely from the call-graph directly (blast radius, what's affected), with little or no LLM narrative needed for the core question — but nobody has actually specified what a real impact-analysis *document* should contain as output.

## Real questions to research, with live web search/fetch — cite and read primary sources, don't summarize from search snippets alone

1. **What do real, named companies/practitioners actually put in a PRD**, beyond the generic User-Stories/Acceptance-Criteria shape this project started with? Look for real, concrete PRD templates from named sources (product orgs, PM thought-leaders, tools like Notion/Linear/Aha's own published templates) — what sections recur, which ones this project's current template is missing, and whether "impact analysis" or "affected systems" ever appears as a PRD *section* versus its own separate document type in practice.

2. **What does a real, named "impact analysis" or "change impact" document actually contain**, in software/engineering contexts specifically (not generic business impact-analysis)? Look for real examples: blast-radius/affected-systems sections, risk/rollback considerations, dependency call-outs, migration/data considerations, who-needs-to-know call-outs. Named, real sources preferred over generic "best practice" listicles.

3. **Is there real, named precedent for a document that's *mostly* derived from a dependency/call graph rather than freeform narrative** — this project's own real advantage (per ADR-005, `cross_repo_edges` now has 15,400+ real intra-repo edges plus cross-repo edges) is that blast-radius/affected-systems content could be substantially deterministic (a real graph traversal) rather than LLM-synthesized prose. Look for real prior art on this specific pattern (dependency-graph-driven impact reports, e.g. in monorepo tooling, infra-as-code impact analysis, or similar) — is this a recognized pattern elsewhere, and if so, what does its *output shape* look like?

4. **Real, honest negative results are valuable too** — if a question above turns up nothing concrete/primary-sourced, say so plainly rather than padding the answer with generic paraphrasing, matching this project's own existing sourcing-rigor standard (see `21-...md`'s own "Note on sourcing rigor" section for the bar to match).

## What to actually produce

A real, dated findings doc under `governance/roadmap/market-research/` (following the numbering convention already established there), matching `21-...md`'s own citation/rigor style — a synthesis with real sources, not a proposal for what this project should do (that's a separate, later decision informed by this research, not this task's job). Flag clearly which findings are primary-sourced (fetched and read directly) versus secondary/aggregated, the same distinction `21-...md` already makes.

No code changes, no commits — this is a pure research/writing task.
