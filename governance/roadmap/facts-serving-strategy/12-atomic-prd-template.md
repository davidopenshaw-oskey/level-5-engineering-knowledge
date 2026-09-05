<!--
Atomic PRD template — draft, not yet wired into code (that's the next real
task: a small, fail-loud placeholder-substitution function, per the design
agreed in governance/roadmap/facts-serving-strategy/09-p2-build-tasklist.md
and the surrounding discussion). Editable here directly, without touching
code, on purpose — this shape is still being learned, not settled.

Placeholders ({{...}}) are literal, fixed tokens we control on both sides,
not a pattern being reverse-engineered out of free text -- see the "why
this is safe" discussion this template grew out of. Three come from the
three-layer split already proven in 08/10/11:
  {{layer1_business}}   -- PM's own words, untouched, no LLM involvement at all
  {{layer2_evidence}}   -- deterministic render of real search results + real citations, no LLM involvement
  {{layer3_technical}}  -- the one LLM-assisted call's structured output, rendered to text
  {{user_stories}}      -- corrected 2026-09-03: also produced by the Layer 3
                           call, not PM-only -- grounded in real actor/role
                           facts plus {{layer1_business}}'s own content, but
                           rendered up in Layer 1 since that's where a user
                           story belongs structurally. One LLM call, outputs
                           landing in two different places in this template.
  {{acceptance_criteria}} -- also from the Layer 3 call, checkable bullet
                           conditions grounded in the real evidence above it.
  {{constraints}}        -- also from the Layer 3 call, real hard boundaries
                           found in the evidence -- empty list rendered as
                           "none found", never invented to fill the section.

All four of these are single, list-holding placeholders, never one
placeholder per field -- a repeatable item (a story, a criterion, a
constraint) needs its whole rendered list handled as one finished string
before it reaches the template, not reassembled from per-field tokens.

  {{snapshot_freshness}} -- corrected 2026-09-03: originally three separate
                           slots ({{repo}}/{{commit_sha}}/{{extraction_date}})
                           forced into one fixed English sentence -- broke
                           the first time real evidence spanned more than
                           one repo (a real, confirmed case -- see
                           09-p2-build-tasklist.md's recurring-pincode
                           finding). Collapsed to one placeholder holding a
                           complete, already-formatted sentence fragment,
                           same rule as the four placeholders above.

This file's header comment is itself stripped out (along with any other
HTML comment) before a generated document is assembled -- see
assemble-prd.ts's own header for why: without that, this comment's own
illustrative {{name}} tokens would be mistaken for real insertion points
by a naive scanner, a real bug found and fixed the same day this comment
was written.

Everything else in this file is static structure the PM/team can edit
directly -- headers, section order, boilerplate -- without needing a code
change. Sections marked "NEW, 2026-09-03" are additions made after comparing
08/10/11 against real 2026 industry practice for AI-agent-consumed PRDs
(governance/roadmap/facts-serving-strategy/ -- see that day's conversation
for the sources) -- not yet tested against a real example the way the
three-layer core has been.
-->

# Atomic PRD — {{workflow_name}}

**Status:** {{status}}
**Requested by:** {{requester}}
**Snapshot freshness:** {{snapshot_freshness}} — see `governance/roadmap/facts-serving-strategy/06-scope-clarification-and-staleness-finding.md` for why this date matters and how quickly it can drift.

---

# LAYER 1 — Business

*(PM/PO's own words. No LLM involvement in this layer at all.)*

{{layer1_business}}

## User Stories (NEW, 2026-09-03)

*Atomic, one per real capability this workflow needs — format: "As a [actor], I want [goal], so that [reason]." Corrected 2026-09-03: NOT purely PM-authored — produced by the SAME LLM call as Layer 3 below (not a separate call), grounded in real evidence (actual actor/role facts already found — inhabitant types, RBAC roles, existing permission checks showing who currently can do what) plus whatever business context the PM already gave above, even though it renders here in Layer 1 rather than down with the rest of that call's output. Same "LLM proposes, human confirms" pattern as the rest of this document — a suggestion, not authoritative, until the PM reviews it. One placeholder holding the whole rendered list, matching every other layer in this template, not one placeholder per field (a single actor/goal/reason field set can't hold more than one story).*

{{user_stories}}

---

# LAYER 2 — Evidence

*(Deterministic render of real search results and real citations. No free LLM narrative in this layer — see the design discussion this template grew out of for why that matters specifically here.)*

{{layer2_evidence}}

---

# LAYER 3 — Technical Proposal

*(The one LLM-assisted call in this document. Non-binding — a starting point for a developer/agent to review against the current codebase, not an instruction. Grounded in Layer 2's evidence, produces nothing Layer 1/2 already covered.)*

{{layer3_technical}}

## Acceptance Criteria (NEW, 2026-09-03)

*Checkable, bullet-point conditions — not paragraphs. Written by the same LLM call as the technical proposal above, grounded in the real evidence in Layer 2, not invented independently of it.*

{{acceptance_criteria}}

## Constraints & Non-Negotiables (NEW, 2026-09-03)

*Real, hard boundaries found in the evidence — stated positively, not left to be inferred. E.g. "7 existing call sites perform an exhaustive check against 3 values; widening the type requires reviewing all 7, not just adding a case." Drawn from Layer 2's real findings, written by the Layer 3 call.*

{{constraints}}

## Phased Breakdown (NEW, 2026-09-03 — optional, only when the evidence suggests this isn't actually atomic)

*Most atomic PRDs shouldn't need this. Include only if Layer 3's own analysis finds the real scope is larger than one workflow — matches 2026 practice of keeping each phase to a bounded number of requirements rather than one large flat list.*

{{phased_breakdown}}

---

## Related Workflows
{{related_workflows}}

## Out of Scope
{{out_of_scope}}

## Confidence
Business Workflow: {{business_confidence}}
Technical Workflow: {{technical_confidence}}
Overall Confidence: {{overall_confidence}}
