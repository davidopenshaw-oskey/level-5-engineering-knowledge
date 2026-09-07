# Priming Brief — What Artifacts Are Product Teams Producing With AI, 2026/27 (Broader Pass)

**Purpose of this file:** hand this to a fresh Claude session as its first message (or tell it to read this file first). This is a deliberate second, wider pass — the first research round (`03-priming-brief-document-types-2026-09-06.md` / `04-findings-document-types-2026-09-06.md`) leaned heavily on dev/codegen-adjacent tooling (GitHub Spec Kit, ChatPRD, Cursor, Copilot, Devin, SWE-bench) because that's what its design question pointed at, and it came back with an honest negative: no real, specific, named product feature was found that generates a codebase-facts-driven impact analysis or risk assessment as its own document type. This round should widen the aperture — general AI-assisted product-team artifact types in 2026/27, not anchored to source-code generation at all. This is a research/report task — do not modify any file in this repository other than writing your own findings report (location at the bottom).

## Context — read first

1. `governance/roadmap/market-research/04-findings-document-types-2026-09-06.md` — the first pass's real findings, so this round doesn't re-tread the same ground. Note specifically what it *didn't* find (product-team-specific, facts-driven document types beyond PRDs and decision logs).
2. `governance/adrs/adr-007.md` — brief context on what this project's own agent layer is trying to produce.

## What to actually research

**Search live, on the open web, for real 2026/2027 information — do not answer from training knowledge alone.** Cite everything; if something isn't found, say so directly rather than padding with speculation.

This time, start from the **product management discipline itself**, not from dev tooling:

1. **Real, named AI features inside real 2026 PM tools** — Productboard, Aha!, Linear, Notion AI, Coda AI, Monday.com AI, and similar. What artifact types do they actually generate or assist with — roadmaps, OKR documents, feature briefs, prioritization scoring (RICE/ICE), customer-feedback synthesis, competitive analysis? Name the real product and the real feature, not a generic category.
2. **PRFAQ and similar "work backwards" formats** — Amazon's Press-Release/FAQ format is a real, named artifact type for product ideation predating AI; has it been meaningfully AI-assisted/automated in any real 2026 tool or documented practice? Real or not found — say which.
3. **Synthesis-from-research artifacts** — real 2026 tools/practices that turn raw customer interviews, support tickets, or usage data into a structured product artifact (a synthesis doc, a jobs-to-be-done map, a persona document). Is there a real, named category here, and does any of it draw from a *structured evidence source* the way this project's facts corpus does, or is it uniformly built from unstructured qualitative input?
4. **Real 2026 "state of product management + AI" surveys or reports** — is there a credible, real industry survey (not a single vendor's own marketing) naming which artifact types product teams are actually adopting AI for most, in 2026? A real ranked or prioritized list would be more useful here than another single-vendor case study.
5. **Direct follow-up to the first pass's honest negative:** search specifically and directly for "AI-generated impact analysis," "AI-generated risk assessment," or "codebase-aware product artifact" as its own phrase/category. Try to falsify the first pass's finding, not just confirm it — a second search sometimes surfaces something a first one missed. If it's still not found, that's itself a real, useful, reportable result (this project's own planned impact-analysis/corpus-stability personas would be more clearly ahead of the market, not just plausible).

## What a genuinely useful report looks like

For each of the five angles: name real products/practices/reports found, with sources, and be explicit about whether anything here is directly relevant to this project's own document-template design (the `SectionContent` kinds: prose / checkable-or-not list / cited-claim list / user-stories) or whether it's informative about the broader landscape without changing that specific design question. It's fine, and expected, for this round to be more about "what's the real product-management-with-AI landscape" than "what does it mean for our schema" — the first pass already did the schema-specific analysis; this one is deliberately broader.

**Save your findings to `governance/roadmap/market-research/06-findings-product-team-artifacts-<date>.md`** (create the file; don't overwrite this brief).
