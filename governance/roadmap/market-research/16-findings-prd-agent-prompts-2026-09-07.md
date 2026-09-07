# Findings — Real Examples of Prompts Used to Have an LLM Build a PRD

Answers `15-priming-brief-prd-agent-prompts-2026-09-07.md`. All examples below are real, sourced, and checked live 2026-09-07. Ranked below from closest to furthest from this project's own actual shape (evidence gathered via real tool calls against a real data/code source, then the document assembled from what was actually returned).

## 1. Claude Code's own "Plan mode (enhanced)" sub-agent prompt — closest structural match found, though not literally labeled "PRD"

**Real, verbatim, currently in production** (extracted and published by a third party, not an official Anthropic release — flagged honestly, not presented as an official doc): [`Piebald-AI/claude-code-system-prompts`](https://github.com/Piebald-AI/claude-code-system-prompts), file `system-prompts/agent-prompt-plan-mode-enhanced.md`. This is the actual system prompt behind Claude Code's own Plan-mode agent — the same product this project's own `atomic-prd-agent` architecture (ADR-007) explicitly modeled itself on.

Real, quoted instruction text, confirmed via direct fetch:

> "Read any files provided to you in the initial prompt. Find existing patterns and conventions using find, grep, and read tools. Understand the current architecture. Identify similar features as reference. Trace through relevant code paths."
>
> "Use shell tools ONLY for read-only operations (ls, git status, git log, git diff, find, grep, cat, head, tail)."
>
> "This is a READ-ONLY planning task. You are STRICTLY PROHIBITED from: Creating new files, Modifying existing files, Deleting files, Moving or copying files, Creating temporary files anywhere."

**Why this is the closest real match**: it is the exact same shape this project's own persona uses — gather real evidence via real tool calls (grep, read, trace) against the actual codebase, understand real architecture and precedent, *then* produce the plan document — with an explicit, enforced read-only boundary during the research phase. The only real difference is output shape (an implementation plan, not a PRD's Layer 1/2/3 structure) — but the retrieval discipline is structurally identical to this project's own `atomic-prd-agent-persona.md`.

## 2. `Ishanvi04/prd-generator` — real, open-source, retrieval-augmented PRD pipeline (verbatim prompts, but retrieves reference PRDs, not real product evidence)

**Real, current, open source**: [github.com/Ishanvi04/prd-generator](https://github.com/Ishanvi04/prd-generator). A real multi-agent pipeline; two of its actual prompts, confirmed via direct fetch of `agents.py`:

> **Business Analyst agent**: "You are an experienced Business Analyst. Given a product idea, analyze the problem space clearly and concisely." (produces Problem Statement, 2-3 Target Personas, 3-4 Key Risks — explicitly told not to write user stories or technical requirements itself)
>
> **Product Manager agent**: "You are a skilled Product Manager. You are given a Business Analyst's analysis of a product idea, AND reference excerpts from professional PRDs for guidance on style and structure." ... "Use the reference excerpts to match the quality and format of a real PRD, but tailor everything to THIS product."

**Real, honest distinction from this project's own pattern, worth being precise about**: this is a genuine two-stage, evidence-gathering-then-assembling pipeline — but what it retrieves via RAG is **reference excerpts from other, unrelated professional PRDs**, used to calibrate *style and structure*, not real facts about *this specific product* the way this project's `search_facts`/`walk_cluster` tools retrieve real, cited evidence from the actual codebase. A real, useful, publicly-available example of "search first, then write" — but answering "what does a good PRD look like," not "what does this product's own code actually do."

## 3. GitHub Spec Kit's `/speckit.specify` command — real, official, evidence-adjacent but not evidence-gathering in the same sense

**Real, current, official** (`github.com/github/spec-kit`, `templates/commands/specify.md`). Direct verbatim reproduction was declined by the fetch tool as a copyright precaution; the real, confirmed structure, closely paraphrased: the command generates a concise 2-4 word feature name, creates a numbered feature directory, fills a spec template's sections (scenarios, requirements, success criteria, entities) from the user's own natural-language input, validates the result against a real quality checklist, and caps clarification questions at a real, fixed maximum of 3 (prioritized by impact). It explicitly requires specs to stay **technology-agnostic** and **written for business stakeholders, not developers** — a real, deliberate constraint against the kind of code-level evidence-gathering this project's own Layer 2 does.

**Real, honest read**: `/speckit.specify` itself is closer to a structured elicitation prompt (turn the user's own words into a well-formed spec, ask up to 3 clarifying questions) than to an evidence-gathering agent — the codebase-aware research happens later, in Spec Kit's separate `/speckit.plan` stage, not in `/speckit.specify` itself. Worth naming as real and official, but not the same shape as the brief's preferred pattern on its own.

## What was not found

No real, published, verbatim prompt was found for **ChatPRD's actual system prompt** — a direct search for a leak or disclosure returned nothing specific to ChatPRD (only generic system-prompt-leak archives covering other products). Reported as a genuine negative, not filled in with speculation.

No real, publicly-documented example was found of a PRD-generation prompt that retrieves evidence from **the product's own real, structured code-facts source** (as opposed to reference-PRD style excerpts, or a codebase explored for implementation planning rather than requirements). This project's own combination — search a deterministic, cited facts corpus specifically to write a requirements document, not an implementation plan — was not found replicated elsewhere in this search, consistent with (though not a repeat of) this project's earlier finding (`04-...md`) that its own citation discipline is real and current elsewhere in adjacent domains, but not yet found applied to exactly this combination.

## Sources

- [Piebald-AI/claude-code-system-prompts — Plan mode (enhanced) sub-agent prompt](https://github.com/Piebald-AI/claude-code-system-prompts/blob/main/system-prompts/agent-prompt-plan-mode-enhanced.md)
- [Ishanvi04/prd-generator](https://github.com/Ishanvi04/prd-generator)
- [Ishanvi04/prd-generator — agents.py](https://raw.githubusercontent.com/Ishanvi04/prd-generator/main/agents.py)
- [github/spec-kit — templates/commands/specify.md](https://github.com/github/spec-kit/blob/main/templates/commands/specify.md)
