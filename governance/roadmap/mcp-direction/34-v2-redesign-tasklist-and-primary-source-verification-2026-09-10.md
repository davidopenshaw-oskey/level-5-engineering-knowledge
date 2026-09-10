# V2 skill+template redesign — task list, grounded in primary sources — 2026-09-10

Real task list for ADR-009 §2 / `32-action-plan-post-research-2026-09-09.md`'s Priority 0 sketch. Written after reading all five hand-off documents in full and then fetching and reading the five primary sources `21-findings-...md` cites directly (Anthropic Skill-authoring best practices, GitHub spec-kit's `spec-driven.md`, Kiro's Requirements-First docs, Devin 2.1 blog, Devin DeepWiki docs) — not relying on the secondary report alone, per the user's explicit instruction. **Nothing has been built yet.** This is the plan to review before any file changes.

## Real corrections and sharpenings found by reading the primary sources directly

`21-findings-...md` is accurate everywhere it's checkable, with one real gap and several places the primary source is more specific than the secondary report captured. Both matter for how the v2 sketch should be written.

### 1. GitHub spec-kit's `/speckit.clarify` command — not found in the source fetched, flag as unconfirmed

`21-...md` states spec-kit has "a dedicated `/speckit.clarify` command [that] surfaces up to three targeted questions with suggested answers, folding the resolution back into the spec." Fetching `spec-driven.md` directly found the `[NEEDS CLARIFICATION: ...]` marker and the "no markers remain" quality gate confirmed verbatim, but **no mention of `/speckit.clarify` at all** — only `/speckit.specify`, `/speckit.plan`, `/speckit.tasks` are documented in that file. This doesn't mean the command doesn't exist (spec-kit is a real, multi-file open-source repo; it could live in a command reference page not fetched), but as of this check it's an unconfirmed claim, not a verified one. **Decision needed**: either spot-check spec-kit's actual command docs before citing this as precedent for a `/clarify`-style workflow step in v2, or drop it from the sketch's justification and rely only on the marker + gate (which are confirmed).

### 2. Anthropic's evaluation-driven development has a specific, more complete shape than `32-...md` currently scopes

The fetched best-practices doc gives an exact 5-step process — **run without the skill first to find real gaps, build exactly 3 evaluations targeting those gaps, establish a baseline, write minimal instructions, iterate against the baseline** — plus an exact JSON eval shape: `{skills, query, files, expected_behavior}`. `32-...md`'s Priority 0 step 3 currently only proposes comparing the v2 sketch's reasoning against the three existing `mcp-server/gold/` outputs — it doesn't include an explicit "baseline" run (v1 skill's actual output on the same query) to diff against. That's a real gap in the current plan, not a nitpick: without a baseline, "would v2 have been better" stays a reasoning exercise instead of a measured comparison. **Task**: adapt the eval shape to this project (v1's already-produced gold output *is* the baseline; no need to re-run "without a skill at all" since that's not this project's real comparison point) and write it down explicitly rather than leaving it implicit.

### 3. Anthropic's "degrees of freedom" framework is about procedural instruction specificity, not literally about document sections — the transfer to per-section template strictness is a deliberate adaptation, not a direct lift

The primary source's own worked examples are all about *how to write an instruction* (a code review process vs. an exact migration script), not about *how strict a template's output section should be*. The "Template pattern" section is the actually-directly-applicable piece — it already gives the exact two variants needed ("ALWAYS use this exact template structure" vs. "sensible default... adjust sections as needed"). **Task**: write the v2 sketch honestly as applying Anthropic's *Template pattern* (directly on-point) per section, informed by the degrees-of-freedom *lens* (bridge vs. open field) as the reasoning tool for choosing which variant — don't conflate the two as if Anthropic prescribed per-section document strictness directly.

### 4. Devin's DeepWiki — even the "agent-determined structure" product is bounded and declared, not unstructured

The `.devin/wiki.json` schema is more specific than "the agent decides": each page requires a `title` and `purpose` up front, an optional `parent` for hierarchy, and the whole config is capped (30 pages / 80 enterprise, 100 total notes, 10k chars/note). This is a real, useful nuance for the v2 sketch: Devin's most "high freedom" real product is still bounded-and-declared per repo, not literally freeform. **Task**: when designing the "Technical Proposal" section (the candidate for high freedom per `32-...md`), model it on this — the agent proposes its own sub-structure, but within a stated bound (e.g., a max sub-section count, or a required "purpose" line per sub-section) rather than truly unstructured prose.

### 5. Devin's confidence-rating → merged-PR correlation has zero published methodology — treat as directional only, not evidence-grade

Confirmed verbatim: "no detailed methodology for this statistic — only the empirical finding." `21-...md` already flagged this as "unaudited," but it's worth restating plainly in the v2 sketch's own justification: cite it as the one piece of real-world signal that this class of mechanism matters, not as a number to target or replicate.

### 6. Kiro — confirmed honest negative, and a distinct alternative honesty mechanism worth naming

No uncertainty/clarification marker exists in Kiro's docs at all (matches `21-...md`). Separately, Kiro uses a "Refine" workflow — editing `design.md` re-propagates to dependent documents — which is a different kind of honesty-adjacent mechanism (iterative correction, not upfront flagging). Not proposing to adopt it, but worth naming in the sketch as a rejected alternative with a reason, rather than silently not mentioning Kiro's approach at all.

## Task list — Priority 0 sketch (nothing built yet)

1. **Spot-check the `/speckit.clarify` claim** (item 1 above) before the sketch cites it — either find the real doc confirming it or drop the claim and cite only the confirmed marker+gate mechanism.
2. **Define the v2 eval set first**, before drafting `template.md` v2 wording, per Anthropic's own "build evaluations before documentation" order:
   - For each of the 3 `mcp-server/gold/` cases, write `{query, files, expected_behavior}` using the real Anthropic shape (drop `skills` — not meaningful yet since there's one skill).
   - Treat each gold output as the baseline to diff against, not just eyeball.
3. **Draft `skill.md` v2 and `template.md` v2 as new files** (`mcp-server/skills/prd/skill.v2.md`, `template.v2.md`), incorporating:
   - Per-section strictness using Anthropic's actual Template pattern wording (strict-exact vs. sensible-default-adjust), reasoned per section via the bridge/field lens — not a new framework invented from scratch.
   - `[NEEDS CLARIFICATION: ...]` marker, carrying forward the confirmed spec-kit wording, paired with the bounded-search-effort rule already drafted in `32-...md`.
   - EARS-style Acceptance Criteria, tried first as wording-only within the existing `list` `SectionContent` kind (per `32-...md`'s own instruction not to assume the bigger schema change is needed).
   - "Technical Proposal" as the high-freedom section, bounded per the DeepWiki nuance (item 4) rather than left fully open-ended.
4. **Run the v2 draft's reasoning against the 3 gold cases' `expected_behavior` checklists** (from step 2) and against the existing v1 gold outputs as the real baseline — document, per case, whether v2 would have closed a real gap the intercom case exposed (the unmarked call-trigger claim) without regressing the two clean cases (1a, 2a).
5. **Write the comparison result as its own dated doc** (`35-...md` or next available number) — full replacement, partial adoption, or "not yet, here's why" — before touching the live `mcp-server/skills/prd/{skill.md,template.md}` pair.
6. **Carry forward, don't lose**: the tool-argument citation fix (`31-...md`) into whatever v2 becomes; it stays unverified against the intercom case until the Vertex quota blocker (`30-...md`) is separately resolved — that blocker gates *running* v2 against intercom, not drafting it.

## Explicitly not doing yet

Not touching the live `skill.md`/`template.md`. Not deciding the quota question (separate, already tracked in `30-...md`). Not starting a second skill+template pair (impact-analysis) — still correctly deferred per `32-...md`.
