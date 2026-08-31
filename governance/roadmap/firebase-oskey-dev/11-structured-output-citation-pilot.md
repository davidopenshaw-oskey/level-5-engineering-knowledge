# Structured-Output Citation Pilot — Stage 1 (Schema Design)

**Status:** Stage 1 of 4 (schema design only — no LLM calls, no code changes). See `10-module-level-production-cutover-plan.md` for the architecture this pilot sits inside; this doc doesn't change that architecture, only how one call's citations are produced and parsed.

## Why

Three real, distinct citation-malformation bugs surfaced in one evening testing `gemini-3.7-flash` (tasks.md item 27) — a bundled-citation shape, a bare-single-backtick shape, and a stray-character variant of the first that broke the initial fix. Each was invisible to the exact-pattern regex check that predated it, because the entire citation mechanism is free-text convention (backtick-wrapped markers embedded in prose) parsed after the fact, not something the API can enforce. All three providers this pipeline uses (Gemini, Anthropic, OpenAI) already support schema-enforced structured output natively — confirmed against each provider's own official documentation, not assumed. This pilot tests whether moving citations specifically (not the whole document) into a schema-enforced structure eliminates this bug class by construction.

## Scope decision: citations only, not the whole document

Prose sections (Executive Summary, Architectural Observations, etc.) don't need restructuring — a paragraph is a paragraph, there's no "malformed" version of ordinary prose the way there is for a citation marker. Only the citation mechanism is the fragile part, so only it changes. Confidence tags (**Confirmed**/**Inferred**/**Unknown**) also stay as plain inline text — they're three fixed words that have never been observed to malform, unlike citations.

This does mean the *whole* API response has to be schema-shaped (Gemini's `responseSchema` and OpenAI's `strict: true` constrain the entire response, not a fragment of it) — so prose sections become string fields within one JSON object, not free-floating markdown. That's a real, visible change in shape, but not in content: every field below maps 1:1 to a section the current contract (`contracts/03-module-level-synthesis.md`) already asks for.

## The schema

```json
{
  "type": "object",
  "properties": {
    "moduleWide": {
      "type": "object",
      "properties": {
        "executiveSummary": { "type": "string" },
        "architecturalPosition": { "type": "string" },
        "ownershipConclusion": { "type": "string" },
        "crossCuttingPermissionsRisks": { "type": "string" },
        "architecturalObservations": { "type": "string" },
        "crossCuttingRisksOpenQuestions": { "type": "string" }
      },
      "required": [
        "executiveSummary", "architecturalPosition", "ownershipConclusion",
        "crossCuttingPermissionsRisks", "architecturalObservations", "crossCuttingRisksOpenQuestions"
      ]
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Exact submodule name as given in the fact table's submodule column." },
          "summary": { "type": "string" },
          "primaryResponsibilities": { "type": "string" },
          "dataOwnership": { "type": "string" },
          "notablePermissionsObservations": { "type": "string", "description": "Empty string if nothing genuinely stands out for this capability -- do not pad with generic content." },
          "openQuestions": { "type": "string" }
        },
        "required": ["name", "summary", "primaryResponsibilities", "dataOwnership", "openQuestions"]
      }
    },
    "citations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "marker": { "type": "integer", "description": "The bracketed number used in prose, e.g. 7 for [7]. Unique across the whole response." },
          "kind": { "type": "string", "enum": ["fact-id", "file-line"] },
          "factId": { "type": "string", "description": "Required when kind is fact-id. The short reference exactly as given, e.g. F123 -- never a range, never more than one." },
          "file": { "type": "string", "description": "Required when kind is file-line. The fact's real file column value, unabbreviated." },
          "lines": { "type": "string", "description": "Required when kind is file-line. E.g. '38-49' or '112'." }
        },
        "required": ["marker", "kind"]
      }
    }
  },
  "required": ["moduleWide", "capabilities", "citations"]
}
```

**Deliberately not using JSON Schema's `if`/`then` to enforce "`factId` required when `kind` is `fact-id`"**: keeps the schema simpler and more likely to be well-supported across all three providers' structured-output implementations, which don't necessarily support the same JSON Schema feature subset. That conditional gets validated in our own post-processing code instead (same place citation-validator.ts already does real validation work today) — a malformed citation object still can't happen structurally (missing `marker`/`kind` is impossible), it just means "this specific citation didn't resolve," which is exactly the same fail-loud shape the pipeline already uses everywhere else.

## What the contract instructions need to change to

The current contract's "Citing evidence inline" section (lines 21-25 of `03-module-level-synthesis.md`) describes backtick-wrapped inline markers. Under the schema, this becomes:

- In any prose field, reference evidence with a plain bracketed number: `...enforces v1.org.buildings.create [7]...`. Numbers are assigned by the model as it writes, starting at 1, unique across the whole response (not per-section, not per-capability).
- Every number used anywhere in prose must have exactly one corresponding entry in the top-level `citations` array. Every entry in `citations` must be referenced by at least one prose field (no orphan citations — same spirit as the current "don't invent claims" principle, applied to evidence bookkeeping).
- The fact-ID vs. file-line choice rule is unchanged from today's contract (fact-ID preferred when the claim comes from one specific fact; file+line for a code location spanning several related facts or an unwieldy `id`).

## Open questions for Stage 2 (the real call), not resolved here

1. **Prose quality under schema constraint** — the real unknown this pilot exists to answer. Untested whether Architectural Observations/cross-cutting risk framing stays as sharp under a schema-constrained call as free-form generation.
2. **Real token-count delta against the current baseline** — elevated to an explicit go/no-go criterion (not just a curiosity) after realizing the current baseline already uses compact short-ID citations, so the marginal savings from bracket markers may be smaller than JSON's own field-name overhead. Needs the now-fixed `thinkingTokens` tracking (tasks.md item 28) for a complete picture, not just `outputTokens`.
3. **Gemini's `propertyOrdering`** — the SDK's structured-output config supports controlling the order fields are generated in, which can affect quality (e.g., does writing `crossCuttingPermissionsRisks` before or after all capabilities' own sections change what it can meaningfully compare?). Not yet verified whether this matters in practice for this schema shape.
4. **Anthropic's exact mechanism for `claude-sonnet-5`** — confirmed native structured outputs exist for Sonnet 4.5/Opus 4.1 specifically; not yet confirmed whether `claude-sonnet-5` (this pipeline's actual configured model, presumably newer) uses that same native path or needs the tool-use fallback. Only matters if the pilot ever extends past Gemini.

## Target for Stage 2

Firebase's `tasks` module — smallest real module in the corpus (1 capability, `_module_root`), cheapest possible real test, already production-connected. One real call, `responseSchema` set to the schema above, output-format section of the contract swapped for the bracketed-marker instructions above. No pipeline wiring yet — inspect the raw response by hand against the three open questions before building anything.
