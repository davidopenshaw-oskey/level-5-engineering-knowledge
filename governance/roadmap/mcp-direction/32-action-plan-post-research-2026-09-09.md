# Action plan — implementing ADR-009's refinements

Real, concrete next steps following `governance/adrs/adr-009.md` §2. Corrected 2026-09-09 (same session, caught before hand-off): the real intent is not five independent patches bolted onto the existing `skill.md`/`template.md` — it's cherry-picking the best real patterns found in the research and sketching what a genuinely **redesigned** PRD skill+template pair would look like, compared directly against the existing live pair, before touching anything. The five items below are the *ingredients* that sketch should draw from, not a punch list to work through independently.

## Priority 0 — Sketch a redesigned `skill.md` + `template.md` for the PRD document type, compared against the existing live pair

**This is the real first step, not the five items below done piecemeal.** Produce a genuine v2 draft of both files — informed by the ingredients in this doc, not a fresh invention — and put it side by side with the current `mcp-server/skills/prd/skill.md` + `template.md` for a real, deliberate comparison before deciding what actually replaces what.

**Concrete steps**:
1. Draft `skill.md` v2 and `template.md` v2 (as new files, e.g. `mcp-server/skills/prd/skill.v2.md` / `template.v2.md`, or wherever makes the side-by-side comparison easiest — not yet overwriting the live pair).
2. Pull in, deliberately, not incidentally: Anthropic's per-section "degrees of freedom" (Priority-3 ingredient below) to decide which sections stay strict vs. become agent-collated; the `[NEEDS CLARIFICATION: ...]` marker + its bounded-search pairing (Priorities 1 and 5); EARS-style Acceptance Criteria (Priority 4) if it earns its place once the sections are rethought, not assumed.
3. Real comparison against the existing pair: for each of the three `mcp-server/gold/` examples, would the v2 skill+template have produced a meaningfully different (and better) document? Reason about this directly against the real gold outputs already on disk — don't design in the abstract.
4. Only after that comparison, decide: full replacement, partial adoption, or "not yet, here's why."

## Ingredients for the Priority 0 sketch, real detail on each

### `[NEEDS CLARIFICATION: ...]` inline marker

Targets a real, twice-confirmed gap (the intercom PRD's unverified call-trigger claim went silently unmarked). Mirrors GitHub spec-kit's real wording: "mark all ambiguities... if the evidence doesn't confirm something, mark it, don't guess." Real open question for the sketch: soft instruction only, or a real code-level check in `atomic-prd-agent.ts` (count remaining markers, surface the count in the MetaData header — not necessarily fail-closed, since an honest "3 open questions" is a valid, not a broken, output).

### Bounded search effort, pairs with the marker above

Directly caused the real 47-tool-call spiral and contributed to the Vertex quota crash on the intercom case. A concrete, low-freedom rule for the redesigned skill: "after ~3-5 search attempts around one specific sub-question with no confident hit, stop searching it and mark it `[NEEDS CLARIFICATION]` rather than continuing."

### Per-section "degrees of freedom" (Anthropic's own framework)

The real lens for redesigning the template's section list itself, not just patching wording. Re-read the current four sections against Anthropic's high/medium/low tiers: likely `Acceptance Criteria` → low/medium freedom (consistency, testability matters); `Technical Proposal` → high freedom (context varies per request — this is where "let the agent collate findings into whatever a dev needs" actually gets designed, not just discussed).

### EARS-notation Acceptance Criteria

`WHEN [condition] THE SYSTEM SHALL [action]`. Real value (would have made the intercom PRD's unverified claim visibly incomplete), but decide in the sketch whether it's a wording nudge within the existing `list` kind, or genuinely needs a new `SectionContent` kind with condition/action fields — don't assume the bigger option is required until the wording-only version is tried against a real gold example.

### Evaluation-driven development for `mcp-server/gold/`

Separate from the skill+template redesign itself, but feeds Priority 0 step 3 directly: a small, hand-curated `expected_behavior` checklist per gold example (Anthropic's own shape: `{ query, expected_behavior: [...] }`), not the full cited-evidence set (too noisy under real non-determinism). Deliberately manual/HITL for now, per the user's explicit call — no comparison script yet.

## Blocking item, separate from the sketch itself

`governance/roadmap/mcp-direction/30-intercom-quota-blocker-pause-2026-09-09.md` — the real Vertex AI quota ceiling (5 req/min default, no `gemini-3.5-flash` override). Doesn't block *drafting* the v2 sketch, but blocks *real-running* it against the intercom case specifically, which is the case most likely to actually test whether the redesign helps.

## Also still open, unrelated to this plan

- Whether "impact analysis" becomes a real second skill+template pair (`mcp-server/skills/impact-analysis/`) — decide after the PRD redesign settles, not before; no point designing a second pair while the first is still being reconsidered.
- The tool-argument citation-fabrication fix (`31-...md`) is applied to the *current* `skill.md` but unconfirmed against the case that surfaced it, for the same quota reason — carry it forward into whatever v2 becomes, don't lose it in the redesign.
