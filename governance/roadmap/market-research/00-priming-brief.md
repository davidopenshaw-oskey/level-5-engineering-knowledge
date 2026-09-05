# Priming Brief — 2026/27 State of the Art: AI-Native PRD/Product-Doc Generation

**Purpose of this file:** hand this to a fresh Claude session as its first message (or tell it to read this file first). That session should investigate how other companies/tools currently handle AI-assisted PRD/product-requirement generation, report back with real, cited findings, and flag where the results confirm or challenge the approach already underway in this repo. This is a research/report task — do not modify any file in this repository other than writing your own findings report (location suggested at the bottom).

## Context — what this project is doing, briefly

This repo (`level-5-engineering-knowledge`) builds a pipeline that extracts real facts from ~15-20 source-code repositories (via AST parsing, not LLM guessing) into a Postgres/pgvector index, builds a real cross-repo/cross-module call graph over those facts, and uses retrieval + an LLM synthesis call to generate "atomic PRDs" — impact analyses and technical proposals grounded in what the real codebase actually does today. A parallel, not-yet-built layer is adding a human-curated "workflow catalogue" (named business workflows, each backed by real graph-connected facts, drafted by an LLM but confirmed by a human before being trusted).

**Read these five files first, in this order, before searching anything — they're the real, current state, not a summary you should skip:**
1. `governance/adrs/adr-005.md` — the retrieval-strategy decision (graph traversal vs. RAG-over-facts vs. narrative synthesis, per downstream objective).
2. `governance/adrs/adr-006.md` — execution model (today: manual CLI scripts) and, most relevant to this research task, the **undecided product-facing interface** question: no PM/PO-facing trigger exists today for any of this.
3. `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md` — a real, honest account of a retrieval-precision problem found this project's own real testing (vector search doesn't reliably rank the single correct fact among many near-duplicates; a fix improved but didn't fully close the gap) and the recall-vs-precision reasoning that followed from it.
4. `governance/roadmap/building-workflows/01-workflow-seeding-tasklist.md` — the newest, most concrete design: how workflows get seeded (LLM drafts from real fact clusters only, never open-ended reasoning), reviewed by a human, and tagged for trust (`generationMethod`, `evidence_basis: fact_derived | human_asserted_out_of_system` for real business steps — like a verbal handover or a signed contract — that will never have a code fact behind them).
5. `governance/roadmap/facts-serving-strategy/01-qa-vision-and-examples.md` — the original, real product questions this whole effort is trying to answer (Section A).

## What to actually research

**Search live, on the open web, for real 2026/2027 information.** Do not answer from internal/training knowledge alone — vendor names, product features, and claimed capabilities in this space change fast and your own training data may be stale, incomplete, or describe a product that has since pivoted or been discontinued. Verify anything you report with a real, current source, and cite it.

Investigate how other companies and products currently tackle these specific, real problems — not "AI PRD writing" in the abstract, but these concrete angles, each tied to something this project has already found or left unresolved:

1. **Grounding/retrieval architecture.** How do AI-native product-requirement or spec-generation tools ground output in an actual, existing codebase (not a blank-page prompt)? Graph-based code intelligence, embeddings, hybrid search, something else? Do any of them report or solve the same recall-vs-precision problem this project found (the right fact existing in the index but not reliably ranking high enough to be used)?
2. **Human-in-the-loop discipline.** How do real tools structure "AI drafts, human confirms" for product documentation? Is there a real, named pattern for this, or does everyone do it ad hoc?
3. **Staleness/freshness over time.** How do tools keep AI-generated product docs in sync as the underlying code changes? Is there a real precedent for "refresh after merge, flag drift, prompt a human" (this project's own proposed Task 2), or does the industry handle this differently (e.g., regenerate everything on demand instead of maintaining a persistent catalogue)?
4. **Trust/provenance labeling.** Do any real tools visibly distinguish AI-generated vs. human-verified content to the end user, the way this project is trying to (`generationMethod`, `evidence_basis` fields)? Is there an emerging standard or convention for this, or is it still bespoke everywhere?
5. **Content that can't be grounded in code at all.** Real business workflows often include steps with no code representation (a signed contract, a verbal handover, an offline business decision). Does any real tool have an equivalent to this project's new `human_asserted_out_of_system` concept, or is this an underserved problem?
6. **The product-facing interface question ADR-006 leaves open.** How do PMs/POs actually *trigger* AI-assisted PRD generation in real tools today — a chat interface, a Jira/Linear/Notion integration, a Figma plugin, something else? This project has no answer yet; real precedent here would be directly load-bearing.
7. **Multi-repo, partial-coverage reality.** This project spans ~15-20 repos, several still missing key input (UX/Figma mapping) for weeks at a time. How do other tools handle enterprise codebases where data sources arrive unevenly across services/repos, rather than assuming a single, complete, uniform corpus from day one?

## What a genuinely useful report looks like

Not a generic survey. For each of the seven angles above: name real products/companies/approaches found (with sources), state plainly whether what you found **confirms** this project's current direction, **flags a real concern or gap**, or is **inconclusive** — and say why, concretely, not just "seems fine." If you find nothing real and current on a given angle, say so directly rather than padding it with speculation.

**Save your findings to `governance/roadmap/market-research/01-findings-<date>.md`** (create the file; don't overwrite this brief) so they can be reviewed and folded back into the main session's work afterward.
