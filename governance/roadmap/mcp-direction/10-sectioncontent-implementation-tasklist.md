# `SectionContent` Migration — Implementation Tasklist

**Status:** Written 2026-09-06. **Steps 1-9 done and wired into the real pipeline, verified without spending on an LLM call:** `section-content.ts`, `template.ts`, `validators.ts` are real files (not throwaway), the real template (`templates/atomic-prd.template.md`) now declares 4 LLM-authored headings plus 3 reserved ones (`metadata`, `business-request`, `evidence-used` — the last one a real improvement over the pre-migration design, computed independently from real tool-call results rather than the model self-reporting its own evidence list), and `atomic-prd-agent.ts` is fully rewritten onto the generic contract. Before calling any of this done, the full assembly path (`assembleDocument` → `getSnapshotFreshness` → `writeOutput`) was run end-to-end with a hand-constructed `GenerationOutput` — real DB query, real markdown assembled correctly (including the reserved-heading injection), real `.md` **and** the new `.meta.json` audit-trail sidecar (§2.4) both written and inspected — then the smoke-test files and temporary exports used to run that check were removed. Whole-`pipeline` `npx tsc --noEmit` clean throughout. The persona file (Step 9) is rewritten onto the generic contract, with the old fixed-shape version kept as marked, superseded history rather than deleted. **Step 10 (the real regression check against Q1a/Q1b) is the only step not yet run — it's real, paid LLM spend, flagged for an explicit go-ahead before running, per this project's rule.**

Turns `adr-008.md` §2's Direction into concrete, sequenced build steps — same relationship `01-mcp-tool-server-tasklist.md` had to `adr-007.md`. Real answer to Decision A (§4 of that ADR): this migration is the next work, not deferred follow-on — the user explicitly chose to leave today's hardcoded `OUTPUT_SCHEMA` behind rather than run another verification pass on it.

**Scope, deliberately bounded**: Steps 1-10 are only what `adr-008.md` §2 actually calls for. Not in scope: Given/When/Then (§3, explicitly deferred), the `impact-analysis-agent`/`corpus-stability-agent` personas (§3, explicitly deferred), any verification-artifact hook on `cited-list` (§2.5 — guidance for later, no kind change now). **Step 11 is a real exception, added later by explicit user/peer approval** — a separate, related hardcoding problem the peer found while this file was already open, tracked here rather than a new doc because that's where the user asked for it, not because it's actually part of `adr-008`'s scope.

**Real design gap this tasklist closes, not yet pinned down in the ADR or the live discussion**: neither `08-...md` nor `adr-008.md` specifies an actual on-disk template *file format*, or exactly how a reserved (renderer-injected, never-LLM-authored) heading like `MetaData` is distinguished from an LLM-authored one in that file. Both are designed concretely below, as part of this tasklist, not assumed.

---

## Step 1 — The real `SectionContent` schema, properly typed

`08-...md`'s live-discussion sketch used a loose `content: string` per section — a simplification for the conversation, not the real shape `adr-008.md` §1c actually settled on (four distinct kinds). The real, buildable schema is a discriminated union, one generic schema for every document type:

```typescript
// pipeline/facts-postgres-index/mcp-server/agent-poc/section-content.ts
import { z } from "genkit";

export const SectionContentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("prose"), text: z.string() }),
  z.object({ kind: z.literal("list"), checkable: z.boolean(), items: z.array(z.string()) }),
  z.object({
    kind: z.literal("cited-list"),
    items: z.array(z.object({ claim: z.string(), evidenceIds: z.array(z.string()) })),
  }),
  z.object({
    kind: z.literal("user-stories"),
    items: z.array(z.object({ actor: z.string(), goal: z.string(), reason: z.string() })),
  }),
]);

// The schema Genkit's output:{schema} actually constrains generation with.
// Only covers LLM-authored sections -- reserved headings (MetaData, the raw
// business request) are never sent to the model as something to fill in;
// see Step 2's reservedHeading concept.
export const GenerationOutputSchema = z.object({
  sections: z.array(z.object({ heading: z.string(), content: SectionContentSchema })),
});

export type SectionContent = z.infer<typeof SectionContentSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
```

**Verification for this step**: `npx tsc --noEmit` clean. No runtime test possible in isolation — this is a type/schema definition only.

## Step 2 — Template file format and parser

**Real design decision, made here**: a template is a plain markdown file where every heading is immediately followed by one HTML comment declaring how it's filled — visible structure (headings, order) a PO staffer reads directly; the comment is invisible when rendered but simple to parse and copy from an example.

```markdown
<!-- pipeline/facts-postgres-index/mcp-server/agent-poc/templates/atomic-prd.template.md -->
# MetaData
<!-- reserved: metadata -->

# Business Request
<!-- reserved: business-request -->

# User Stories
<!-- kind: user-stories -->

# Technical Proposal
<!-- kind: cited-list -->

# Acceptance Criteria
<!-- kind: list checkable=true -->

# Constraints
<!-- kind: cited-list -->

# Evidence Used
<!-- reserved: evidence-used -->
```

**Added after this section was first drafted, during real implementation**: `evidence-used` as a third reserved heading, alongside `metadata` and `business-request` — computed directly from `extractRealFactIds()` (Step 4) rather than relying on the model to self-report a complete, correct evidence list. A real improvement over the pre-migration design, not just a port of it.

Two heading types, not one:
- **`reserved: <name>`** — never sent to the LLM as something to generate; the renderer injects real, code-computed content by name (a small registry, Step 7). `metadata` and `business-request` are the two needed now (matching what `renderMarkdown()`/`writeAgentOutput()` already inject today, just generalized instead of hardcoded).
- **`kind: <prose|list|cited-list|user-stories>`** (with `checkable=true|false` only for `list`) — LLM-authored; this is the subset that becomes `GenerationOutputSchema`'s expected heading list.

```typescript
// pipeline/facts-postgres-index/mcp-server/agent-poc/template.ts
import fs from "fs";

export interface TemplateSection {
  heading: string;
  reserved?: string;                                    // e.g. "metadata", "business-request"
  kind?: "prose" | "list" | "cited-list" | "user-stories";
  checkable?: boolean;                                  // only meaningful when kind === "list"
}

export interface ParsedTemplate {
  sections: TemplateSection[];                          // full order, reserved + generated
  llmHeadings: string[];                                // reserved excluded, real order preserved
}

const HEADING_RE = /^#\s+(.+)$/;
const RESERVED_RE = /^<!--\s*reserved:\s*([\w-]+)\s*-->$/;
const KIND_RE = /^<!--\s*kind:\s*(\w[\w-]*)(?:\s+checkable=(true|false))?\s*-->$/;

export function parseTemplate(path: string): ParsedTemplate {
  const lines = fs.readFileSync(path, "utf8").split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const sections: TemplateSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(HEADING_RE);
    if (!headingMatch) continue;
    const heading = headingMatch[1].trim();
    const directive = lines[i + 1];
    const reservedMatch = directive?.match(RESERVED_RE);
    const kindMatch = directive?.match(KIND_RE);

    if (reservedMatch) {
      sections.push({ heading, reserved: reservedMatch[1] });
    } else if (kindMatch) {
      sections.push({
        heading,
        kind: kindMatch[1] as TemplateSection["kind"],
        checkable: kindMatch[2] === "true",
      });
    } else {
      throw new Error(`[Fail-Closed] Template heading '${heading}' at ${path} has no recognized directive (expected <!-- reserved: ... --> or <!-- kind: ... --> on the following line).`);
    }
  }

  return {
    sections,
    llmHeadings: sections.filter(s => !s.reserved).map(s => s.heading),
  };
}
```

**Verification for this step**: a small real test — `parseTemplate("templates/atomic-prd.template.md")` against the real file from this step, confirm `llmHeadings` equals `["User Stories", "Technical Proposal", "Acceptance Criteria", "Constraints"]` (reordered 2026-09-06, real user request — see the eleventh addition below) and the three reserved headings are correctly excluded. Cheap, no LLM cost, run before moving on.

## Step 3 — The real PRD template, preserving today's proven document shape

The template above (Step 2's example) is the real one to ship — it maps directly onto the fields `atomic-prd-agent.ts` already produces and that Q1a/Q1b already verified: `technicalProposal`/`constraints` → `cited-list` (matches `adr-008.md` §1c's finding that both already share the identical `{claim, evidenceIds}` shape in real output), `userStories` → `user-stories`, `acceptanceCriteria` → `list checkable=true`. No new content shape, no lost structure — this step just makes the existing real shape into a template file rather than a hardcoded schema.

## Step 4 — Fabrication-check validator (mandatory, code, fail-closed)

```typescript
// pipeline/facts-postgres-index/mcp-server/agent-poc/validators.ts
import type { GenerateResponse } from "genkit";
import type { GenerationOutput } from "./section-content";

// Every real fact_id actually returned by any tool call this run -- scans
// real tool RESPONSE payloads (not requests), across all three tools'
// real result shapes (SearchResult.factId, GraphNeighborFact.factId,
// ClusterMember.factId / ClusterEdge.sourceFactId+targetFactId).
export function extractRealFactIds(response: GenerateResponse<unknown>): Set<string> {
  const ids = new Set<string>();
  for (const message of response.messages) {
    for (const part of message.content) {
      if (!("toolResponse" in part) || !part.toolResponse) continue;
      const output = part.toolResponse.output;
      const collect = (value: unknown) => {
        if (Array.isArray(value)) { value.forEach(collect); return; }
        if (value && typeof value === "object") {
          for (const [key, v] of Object.entries(value)) {
            if ((key === "factId" || key === "sourceFactId" || key === "targetFactId") && typeof v === "string") ids.add(v);
            else collect(v);
          }
        }
      };
      collect(output);
    }
  }
  return ids;
}

export function checkFabrication(output: GenerationOutput, realFactIds: Set<string>): void {
  const fabricated: string[] = [];
  for (const section of output.sections) {
    if (section.content.kind !== "cited-list") continue;
    for (const item of section.content.items) {
      for (const id of item.evidenceIds) {
        if (!realFactIds.has(id)) fabricated.push(id);
      }
    }
  }
  if (fabricated.length > 0) {
    throw new Error(`[FABRICATED_CITATION] Cited fact_id(s) not present in this run's real tool results: ${fabricated.join(", ")}`);
  }
}
```

**Verification for this step**: a real unit-style check (no LLM call needed) — hand-construct a `GenerationOutput` with one real fact_id (from any already-known real case) and one fabricated one, confirm `checkFabrication` throws naming only the fabricated one.

## Step 5 — Template-conformance validator (mandatory, code, fail-closed)

```typescript
export function checkTemplateConformance(output: GenerationOutput, expectedHeadings: string[]): void {
  const actual = output.sections.map(s => s.heading);
  const mismatch = actual.length !== expectedHeadings.length || actual.some((h, i) => h !== expectedHeadings[i]);
  if (mismatch) {
    throw new Error(`[TEMPLATE_NONCONFORMANT] Expected headings in order [${expectedHeadings.join(", ")}], got [${actual.join(", ")}].`);
  }
}
```

Order-strict, not just presence-strict — a real, deliberate choice: a reordered document is a real conformance failure (reading flow matters), not cosmetic.

**Verification for this step**: same shape as Step 4 — hand-constructed matching and mismatching cases, confirm pass/throw behavior directly, no LLM cost.

## Step 6 — Generic section-content renderer

Replaces `atomic-prd-agent.ts`'s current per-field render functions (`renderUserStories`, `renderAcceptanceCriteria`, etc.) with one function that switches on `kind`:

```typescript
function renderSectionContent(content: SectionContent): string {
  switch (content.kind) {
    case "prose": return content.text;
    case "list": return content.items.map(i => content.checkable ? `- [ ] ${i}` : `- ${i}`).join("\n");
    case "cited-list": return content.items.map(i => `- ${i.claim} (see ${i.evidenceIds.join(", ")})`).join("\n");
    case "user-stories": return content.items.map(s => `- As a ${s.actor}, I want ${s.goal}, so that ${s.reason}.`).join("\n");
  }
}
```

**Real addition, after the first real Step 10 success, from real user feedback**: raw fact_ids inline (the shape above) are long and repeat across claims — hard for a human reviewer to scan. `cited-list` citations are now real, stable, document-wide numbers instead (`(see [#14](#evidence-14))`), assigned by a new `buildCitationNumbering()` in `atomic-prd-agent.ts` — same fact_id always gets the same number wherever it's cited, in the order claims actually appear reading top to bottom (not tool-call order), with duplicate fact_ids inside one claim's own citation list collapsed to a single reference rather than repeated. `renderSectionContent` gained an optional `citationNumberOf` lookup param for this — `cited-list` uses it when given, every other kind ignores it, and the function still works standalone (raw fact_ids) when no lookup is passed, so it stays testable in isolation. The `evidence-used` reserved section is now the numbered, anchored appendix these links point to — any fact_id the agent gathered but never actually cited in a claim still gets a number there (real, complete audit trail), just appended after the cited ones. Verified for real (no LLM cost) with a hand-constructed case exercising both real behaviors: the same fact_id cited by two different claims, and the same fact_id appearing twice within one claim's own evidenceIds — both correctly collapsed, no duplicate reference numbers anywhere in the rendered output.

Reuses the exact real rendering logic already proven in today's `renderMarkdown()` (the `- [ ]` / `(see ...)` / `As a...` shapes are unchanged) — this step is a restructuring, not a redesign of how a PRD actually reads.

**Second real readability fix, same day, from real user feedback on the numbered-citation demo file**: a tight, no-blank-line list of multi-clause claims read as a wall of text. `list` and `user-stories` items are now joined with a blank line between each (`"\n\n"`, not `"\n"`); `cited-list` additionally breaks the citation onto its own line within the bullet with a real `<br>` (not trailing whitespace — invisible and easy to lose in an edit/diff, `<br>` is explicit and portable across the GFM-compatible renderers this document is read in). Deliberately **not** applied to `MetaData` or `Evidence Used` — both are dense, scan-once reference blocks, not prose to read line by line, and the user was explicit these two stay exactly as they are. Verified for real, zero new LLM spend both times: re-rendered the same already-validated real output from the successful Q1a run through the updated code, twice (once for the numbering feature, once for this spacing fix), producing real demo files (`output/agent-runs/prds/test/2026-09-06-004-...` and `-005-...`) rather than re-running the agent.

**Third real fix, same day: a real bug the user caught by checking preview vs. raw markdown mode.** `MetaData`'s own key/value lines used a bare `"\n"` too — the exact same CommonMark gotcha as the citation line (a single newline inside one paragraph renders as a space, not a line break), so the whole block silently collapsed onto one run-together line in preview despite looking correctly separated in raw source. `MetaData`'s join changed to `"<br>\n"`, same real fix as the citation line, for the same reason. This is **not** a contradiction of the second fix's "leave MetaData as-is" instruction — that was about blank-line *spacing* (still tight, unchanged), this is about the lines actually rendering as separate lines at all (a correctness bug, not a spacing preference).

**Fourth real addition, same day, from real user feedback plus the user's own proposed resolution to a genuine ambiguity they spotted**: a return link from each `Evidence Used` entry back up to where it's actually cited in the body. Real complication, correctly identified by the user before it was raised as an issue: a fact cited by several different claims can't sensibly link back to all of them from one appendix row. Resolved exactly as the user suggested — first occurrence gets the anchor, nothing else. Implemented as a post-process scan (`injectFirstOccurrenceAnchors`) over the already-rendered body text, in real document reading order, rather than threading position state through the renderer: finds each `[#N](#evidence-N)` link, tags the first occurrence of each `N` with a real `<a id="cite-N">`, and records which numbers actually got tagged. `Evidence Used` entries for a cited number get a `[↩](#cite-N)` back-link; entries for a fact the agent gathered but never actually cited get none (there's nowhere real to link back to). Real implementation wrinkle: `Evidence Used`'s own back-links depend on knowing which numbers got a `cite-N` anchor, which isn't known until *after* the anchor-injection scan runs over the rest of the document — solved with a placeholder (`EVIDENCE_USED_PLACEHOLDER`) rendered in `Evidence Used`'s real template position on the first pass, swapped for the real content (now with back-links) after the scan completes. Verified for real, zero new LLM spend: re-rendered the same real, already-validated Q1a output a third time (`output/agent-runs/prds/test/2026-09-06-006-...`), confirmed anchors land only at first occurrence (e.g. a fact cited by two different claims gets exactly one `cite-N` anchor, at the earlier claim) and every cited entry in the appendix carries a working back-link.

**Real bug in the fourth addition, found and fixed within the hour, caught by the user comparing raw source to rendered preview**: the `cite-N` anchors were prepended at the absolute start of the line, ahead of the `- ` bullet marker. CommonMark requires `-` to be the literal first character on a line for it to be recognized as a list item at all — with `<a id="cite-1"></a><a id="cite-2"></a>` in front, that line stopped being a bullet entirely (rendered as a plain paragraph containing a stray literal `"- "`), while the very next real bullet line (no anchor prefix) started its own separate one-item list directly underneath it. Same real bug independently affected both `Technical Proposal` and `Constraints` (both `cited-list`) — matches exactly what the user described ("the 2nd item was bulletpointed below the first," "under constraints the bullet pointing very strange"). Fix: `injectFirstOccurrenceAnchors` now inserts the anchors *after* the leading `- `, not before it, so the bullet marker stays at the true start of the line. `Evidence Used`'s own `evidence-N` anchors were never affected — they were already written after the bullet marker from the start.

**Separately, a real bug in this session's own throwaway demo/backfill scripts, not in the production code path**: the demo re-renders (`004`, `005`, `006`) all showed an empty `Snapshot Freshness` line. Cause: each demo script's own quick `realFactIds` collector scanned for a `factId` object key — the shape real tool *responses* have — but `GenerationOutput` (the model's actual structured output) stores citations as plain `evidenceIds: string[]` arrays, a different shape, so the collector silently found nothing every time. Confirmed directly against the real, original `003` run's own `.meta.json` (a genuine agent run, not a demo re-render) that `getSnapshotFreshness` and its caller were already correct — real commit SHAs were captured there the whole time. Fixed in a corrected demo script (walks `evidenceIds` directly, the real shape) rather than production code, since production was never broken. Both fixes verified together, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-007-...`.

**Fifth real addition, same day, from a real user proposal**: repo references get their own scheme, separate from fact citations. The user proposed folding repos into the same `#N` sequence facts use (repos `#1`/`#2`, facts continuing from `#3`); real tradeoff raised and agreed before building: a shared sequence would make the same real business question number its facts differently run to run purely based on how many repos happened to be touched (an implementation detail leaking into what's meant to be a stable reference), and would force a reader to check the appendix just to know whether `#3` means a repo or a fact. Built instead as `R1`, `R2`... — its own `buildRepoNumbering()`, alphabetical by repo name (repos have no natural "first cited in body" order the way facts do, since they only ever appear in one place — the `Snapshot freshness` line). `Evidence Used` is now two real subsections under one heading (the template still only declares one reserved section here) — `### Repos` (`R1`, `R2`, full `repo@sha`, extracted date) and `### Fact-Ids` (`#1`, `#2`... exactly as already built, untouched). `MetaData`'s `Snapshot freshness` line became a small `<br>`-separated sub-list, one line per repo, each linking directly to its `Repos` entry (`[R1](#repo-1)`) — no first-occurrence scan needed for these, unlike fact citations, since a repo is only ever referenced from this one place. Verified for real, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-008-...`.

**Sixth real addition, same day, completing the return-link circuit the fourth addition started**: `Repos` entries had no return link at all — added `[↩](#cite-repo-N)`, pointing straight at the one real place a repo is ever referenced (`MetaData`'s `Snapshot freshness` line); no first-occurrence ambiguity to resolve here, unlike facts, since a repo is only ever cited from that one line.

**First attempt at the second part was wrong and reverted, real correction from the user**: initially read "also include it on the #n at beginning of sentence" as adding a visible `[#N](#evidence-N)` badge inside the `Technical Proposal` body at each fact's first occurrence. The user corrected this directly — the request was a **second return link on the `Evidence Used` entries themselves**, not any change to the body. Reverted `injectFirstOccurrenceAnchors` back to a bare, invisible `<a id="cite-N">` (its only job is being a link *target*). Instead, both `Repos` and `Fact-Ids` entries now carry two real, independent links to the same citation point: the bold label itself (`[**R1**](#cite-repo-1)`, `[**#1**](#cite-1)`) is now clickable, alongside the existing trailing `[↩]` — two ways to jump back from one entry, not a marker added to the body. For `Fact-Ids`, the label is only made a link when the fact was actually cited somewhere (`citedNumbers.has(n)`) — a gathered-but-never-cited fact has no `cite-N` anchor to point to, so its label stays plain text, same condition the existing `↩` already had to satisfy. Verified for real, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-010-...`.

**Seventh real bug, same day, caught by the user in a live preview**: `MetaData`'s two repo sub-lines used a leading `- `, and `Real tool calls made`/`Real run duration` — the two real lines immediately following — got visually absorbed underneath them, as if part of the repo list. Real cause, and a real correction to how this session had been reasoning about CommonMark all day: a line starting with `- ` **can interrupt a paragraph and start a genuine list even with no blank line before it** — this is specified CommonMark behavior, not the "mid-paragraph text stays mid-paragraph text" assumption every earlier fix in this section relied on. So the two repo lines really were forming a real two-item list, and the next two non-`-`-prefixed lines were absorbed as lazy-continuation text of that list's last item rather than rendering as their own lines — exactly what the user saw. Fixed by using a plain bullet character (`•`) instead of `-` for these two lines only — same visual indent, never a recognized block-level marker, so it can never interrupt anything. **Real, general lesson for this section, not just this one line**: anywhere a non-list line follows one starting with `-`/`*`/`+` with no blank line between them, that's a live risk of the same bug. Actually checked, not just flagged: `grep -n '<br>\n'` across every render function in this feature finds exactly two real occurrences, both in the `MetaData` renderer — the repo sub-lines (now `•`, fixed) and the outer metadata-lines join (safe, since none of `Status`/`Persona`/`Model`/`Real tool calls made`/`Real run duration` start with a list marker). `cited-list`'s own `<br>` (`claim<br>(see ...)`) is embedded in one single string with no real newline character in the source, so it was never structurally at risk the same way — confirmed by reading the actual render code, not assumed. Verified for real, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-011-...`.

**Eighth real addition, same day, closing the real recommendation first made in `05-poc-demo-and-documentation-plan.md`**: real token usage and a real approximate cost, both added to `MetaData`. Token usage was already fully captured in `response.usage` and every `.meta.json` sidecar — this just renders it. Cost is the real, previously-unverified part: per explicit direction, queried the live **Cloud Billing Catalog API** (`cloudbilling.googleapis.com`) rather than hand-maintaining a price table. Real research done before writing any pricing code, not assumed: found the real Vertex AI service (`C7E2-9256-1C43`), confirmed its SKU granularity is genuinely fine enough to answer the exact question `05-...md` flagged as open — separate real SKUs exist per modality (text/audio/image/video), per direction (input/output), and per caching state, for `gemini-3.5-flash` specifically: Text Input `$1.50`/1M tokens, Text Output `$9.00`/1M tokens, Text Input Caching `$0.15`/1M tokens (real, live prices, confirmed 2026-09-06). One real, decisive finding resolving the "unverified" flag directly: **no separate SKU exists for "thinking" tokens** on this model — they bill at the plain output rate, confirmed by checking directly (searched the full real SKU list for a thinking-specific `gemini 3.5 flash` entry, found none). Separately confirmed from real usage data, not assumed, that `cachedContentTokens` is a **subset** of `inputTokens`, not additive (`inputTokens + outputTokens + thoughtsTokens === totalTokens` held exactly on real data) — the cost formula in `pricing.ts`'s `computeApproxCost()` depends on this.

New file `pricing.ts`: `fetchVertexAiPricing(modelLabel, location)` lists the real SKU catalog (paginated, ~8,700 real SKUs total) and matches exactly one confident SKU per input/output/cache kind — deliberately narrow (excludes Batch/Flex/Priority/Off-Peak/Lite/Tuned/Image/Video/Audio variants), and **fails closed to `null`** if zero or more than one SKU matches, never silently guessing a wrong price. `modelLabel` ("3.5 Flash") is a new, explicit `pricingLabel` field in `config/config.json` — deliberately **not** auto-derived from `model` ("gemini-3.5-flash"), since the real catalog's own naming isn't a clean, guessable transform (confirmed directly: even Google's own SKU descriptions have real inconsistent capitalization, e.g. "Gemini 2.5 Flash Ga Text Output" — a stray lowercase "Ga"). When the live lookup fails or the SKU match isn't confident, the relevant line reads "unavailable" rather than a silently-wrong number. Verified for real: a real (free, non-LLM) Catalog API call, checked against real usage data from the actual successful Q1a run, matched a hand-computed check to the cent (`$0.6134`) before being wired into the real pipeline — zero new LLM spend for any of this, in `output/agent-runs/prds/test/2026-09-06-012-...`.

**Ninth real addition, same day, from real user feedback on the layout**: three real changes to how the eighth addition renders. (1) Dropped "Real" from four `MetaData` labels (`Tool calls made`, `Run duration`, `Token usage`, and the renamed cost label below) — `MetaData`'s own status/persona/model lines never carried that prefix either, so this makes the block internally consistent, not a new convention. (2) Relabeled `Real approx. cost` to `Approx. document cost` — clearer about what's actually being estimated (this one document's generation, not anything broader). (3) The long caveat text moved out of `MetaData` entirely into a real fourth `Evidence Used` subsection, `### Cost` — same forward-link-from-MetaData (`[$0.6134](#cost-detail)`) / return-link-back (`[↩](#cite-cost)`) pattern already used for `Repos` and `Fact-Ids`, so `MetaData` stays a short, scannable dollar figure and the full "what this does and doesn't include" lives in the appendix alongside the rest of the document's real methodology. `### Cost` always renders, even when the lookup failed (matching how `Repos`/`Fact-Ids` never silently disappear either) — shows a real "not available this run" message rather than omitting the section. Verified for real, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-013-...`.

**Tenth real addition, same day, closing a real gap the user caught: the cost citation had no date/time grounding it to a specific pricing period.** Checked the real API response directly before adding anything, per the user's own instruction ("check if that exists in the call return") rather than assuming a call-timestamp was the only option: every SKU's `pricingInfo` entry carries a real `effectiveTime` field (confirmed `"2026-09-06T07:00:00Z"` on all three real SKUs this feature uses) — Google's own authoritative record of when that price took effect, a genuinely better citation than "when this run happened to call the API." `pricing.ts`'s `fetchVertexAiPricing()` now returns `pricingEffectiveTime` (the latest of the three real SKUs' effective times, in the real — if unlikely — case they ever diverge; falls back to the current time only if the API stops returning `effectiveTime` at all, which has never been observed). Threaded through as a new `pricingEffectiveTime: string | null` field on `RunMeta`, rendered in the `### Cost` section: *"computed from real-time pricing (live Cloud Billing Catalog API lookup, prices effective as of 2026-09-06 07:00 UTC)"*. Verified for real, zero new LLM spend, in `output/agent-runs/prds/test/2026-09-06-014-...`.

**Eleventh real addition, same day, from a real user request: `User Stories` moved before `Technical Proposal` in reading order.** Real, direct demonstration of the whole point of a template-driven document — this is a template-only change, zero code touched. Swapped the two headings' order in `templates/atomic-prd.template.md`; `parseTemplate()`'s `llmHeadings` (and, downstream, `renderTemplateContract()`'s instruction to the model, and `checkTemplateConformance()`'s validation) all update automatically from that one file. Verified both real halves separately, zero new LLM spend: (1) the generation-time contract the model would see, confirmed via `renderTemplateContract()` against the real reordered file; (2) the render-time order, confirmed by re-rendering the same already-validated real Q1a output through the new template — `assembleDocument()` looks up each section's content by heading name from the template's own order, not by array position in the model's raw output, so reordering the template alone was sufficient (`output/agent-runs/prds/test/2026-09-06-015-...`).

## Step 7 — Reserved-heading injection

A small registry, not a special case hardcoded per name:

```typescript
const RESERVED_HEADING_RENDERERS: Record<string, (ctx: RenderContext) => Promise<string>> = {
  "metadata": async (ctx) => renderMetadataBlock(ctx),        // real: snapshot freshness, persona/model version, tool-call counts -- same data writeAgentOutput() already computes
  "business-request": async (ctx) => ctx.businessRequest,     // real: the raw PM-authored input text, verbatim, never LLM-touched
};
```

Real invariant to enforce (a genuine risk if missed, not a style preference): reserved headings must never appear in `expectedHeadings` (Step 5) or be sent to the model as part of the persona's expected output — only `llmHeadings` from Step 2's parse goes into the generation contract. Assembly (Step 8) interleaves reserved and generated sections back into the template's real, full declared order.

## Step 8 — Wire it into `atomic-prd-agent.ts`, add the JSON sidecar

Replace today's hardcoded `OUTPUT_SCHEMA`/`renderMarkdown`/`writeAgentOutput` with the template-driven path: parse the template once, generate against `GenerationOutputSchema` + the persona (Step 9), run both validators (Steps 4-5) immediately after generation and before any file write, assemble reserved + generated sections in template order (Step 7), render (Step 6), then write two real files per run — the `.md` (unchanged real convention, `output/agent-runs/prds/`) and a `.meta.json` sidecar next to it carrying the same persona/model-version/tool-call-count/snapshot-freshness data as real structured JSON, not only interpolated into markdown prose. This is `adr-008.md` §2.4's audit-trail hook — same write, same already-computed data, no new tracking.

**Real addition, during Step 10's regression check**: `durationMs` (real wall-clock time, `Date.now()` captured at the very start of `main()` through to just before writing) added to `RunMeta` and rendered in the MetaData block alongside token/tool-call counts — user's own real motivation: a runtime figure proactively surfaces latency/lag in the system the same way the token/cost figures already do, and it would have been one more real signal on top of the search-term pattern when Q1a's persona bug caused it to spiral. Cheap (`Date.now()` at start and end, one subtraction), no new tracking infrastructure — same shape as everything else in this sidecar.

## Step 9 — Update the persona file

`atomic-prd-agent-persona.md`'s process guidance (breadth-vs-depth judgment, `walk_cluster` hub-truncation caution, "report both, never merge" on symbol ambiguity, cite `fact_id`s verbatim in backticks) is real, tested, and schema-independent — carries over unchanged. Its **Output** section currently names the old hardcoded fields (`technicalProposal`, `userStories`, etc.) directly; rewrite it to describe the generic contract instead — "fill in whichever sections the template names, using the content kind it declares for each" — so the persona file itself no longer hardcodes one document type's field names. This is the concrete, real test of ADR-007's original claim finally landing: a second document type should cost a new template + persona, not new code in this file.

**Real bug found and fixed during Step 10's regression check, not during this step's own drafting** — real enough to belong here, since it's specifically about this file. The first rewrite kept real engineering meta-commentary in the persona text itself (a "migrated 2026-09-06 (`adr-008.md`)..." note, a whole "real history, superseded" paragraph, doc/tasklist cross-references) — because the persona file *is* the literal system prompt (`fs.readFileSync`, sent verbatim), every one of those words is something the model reasons over, not just a note for a human reader. Real, observed consequence: two independent Q1a runs after the migration both spiralled into searching for `"adr-008"`, `"atomic-prd-agent"`, `"template"`, `"verification"`, `"PRD"` — literal strings lifted straight out of that meta-commentary — instead of converging on the real business question, both exhausting the 25-turn cap with no answer produced. User's own words on this, worth keeping verbatim: *"a persona file is a persona file. it does not include non relevant notes that belong in our roadmaps and task lists."* Fixed by stripping the persona down to pure task instructions — no doc references, no ADR numbers, no migration history — and moving that same historical content here instead, where it belongs. A cheap, real addition made to the persona at the same time, directly addressing the failure mode: an explicit instruction that every `search_facts` query must trace back to the actual business request, never to a term that "looks familiar."

**Real, general lesson, not specific to this one file**: persona/system-prompt files need a different writing discipline than every other doc in this project. Rich "why" commentary is a real strength everywhere else in this codebase — inside a system prompt it's a liability, since the model reads every word as something it might need to act on.

## Step 10 — Regression check against the known-good real cases (flag before running)

**Real, paid LLM spend — flag explicitly before running, per this project's rule.** Re-run the same real Q1a and Q1b business requests already proven in `06-step6-real-verification-q1a-q1b-2026-09-06.md` through the migrated system, and diff the real evidence found (not necessarily identical prose, model output isn't deterministic at `temperature: 0.2` — but the same real `fact_id`s, the same real Angular components, the same real options for Q1b) against the already-backfilled `output/agent-runs/prds/test/2026-09-06-001-...md`/`-002-...md`. This is a **regression check on the migration itself**, not a re-validation of business content the user already said isn't needed — worth being explicit about that distinction before asking for the go-ahead to spend on it.

**Real, in order, what this step actually found (three real runs, not one clean pass):**

1. **First real run: `ABORTED`, 25-turn cap hit, no output.** Real cause found afterward, not assumed: the persona file (Step 9's rewrite) contained real engineering meta-commentary — `adr-008.md`, `atomic-prd-agent`, `template`, doc/tasklist cross-references — sent verbatim as the system prompt. Two independent runs both spiralled into searching for those literal strings (`"adr-008"`, `"template"`, `"verification"`, `"PRD"`) instead of the real business question. User's correction, kept verbatim: *"a persona file is a persona file. it does not include non relevant notes that belong in our roadmaps and task lists."* Fixed by stripping the persona to pure task instructions (real diff preserved in git history) and moving the removed history into Step 9 above, where it belongs. General lesson: system-prompt files need a different writing discipline than every other doc in this project — commentary that's a strength everywhere else is a liability here, since the model reads every word as something it might act on.
2. **Second real run, after the persona fix: converged in 19 real, entirely on-topic tool calls (meta-search spiral confirmed gone) — but produced one invented heading (`"Impact Analysis"`) instead of the real four the template requires.** `checkTemplateConformance` (Step 5) caught it and failed closed correctly — **nothing was written to disk**, confirmed directly. Real root cause: nothing in the actual prompt ever told the model which headings/kinds the template requires — `GenerationOutputSchema`'s `heading` field is a bare `z.string()`, unconstrained, and the (now-generic) persona correctly never names document-specific headings either. A real gap in this step's own original Step 8 wiring, not a persona problem this time.
3. **Fix**: `template.ts` gained `renderTemplateContract(template)`, building the real required-headings-and-kinds list from the parsed template at run time, appended to the system prompt alongside the static persona in `atomic-prd-agent.ts` — dynamic, per-run, per-template content, deliberately kept out of the static persona file so it stays generic. Verified for real (no LLM cost) against the actual template file before spending again: produces the correct 4-line contract, in the right order, with the right kinds.

## Step 11 — `mcp-server/`'s own Vertex AI config (real, separate concern, added by real approval 2026-09-06 — not part of `adr-008.md`'s scope, tracked here per the user/peer's own choice rather than a new doc)

**Real finding, flagged by the peer session while this file was open:** `atomic-prd-agent.ts` hardcodes `PROJECT_ID`/`LOCATION`/`MODEL` as flat, unoverridable constants — the exact "hardcoded to what's in front of you" pattern the `RESULT_LIMIT` lesson and `adr-007`/`adr-008` have been about all session. Inconsistent within the same file: `pool()` two lines below already reads DB config as `process.env.PG_HOST ?? "localhost"` — env var with a fallback — while the Vertex AI values sit as plain constants right above it.

**Real, deliberate scoping decision, not a shared config reuse:** `config/llm-providers.json` already has an identical `gemini-default` entry, with a mature `llm-adapter.ts` pattern reading it — reusing it was considered and rejected. `mcp-server/` is a real candidate for independent GCP hosting (Cloud Run) separate from the on-merge pipeline eventually regardless of today's decision; reaching into the main pipeline's `config/` from what's likely to become a separately-deployed unit recreates exactly the cross-boundary coupling `08-...md`'s repo-split note already flagged ("a real split needs the MCP server to own its own DB access") — same principle, applied to config. `config/llm-providers.json`'s `gemini-default` entry and `_shared/technical-proposal.ts`'s own separate hardcoded copy are both explicitly **untouched** by this step — different system, out of scope, and the literal value duplication between the two is real but acceptable (independently configurable, currently pointing at the same project by coincidence, not shared config).

**Real shape, approved 2026-09-06 (two amendments to the original proposal — `temperature` added, folder location moved to match this repo's own `config/` convention)**. **Implemented and verified 2026-09-06 — with one real bug found and fixed along the way**: the loader was first named `config.ts`, same basename as `config.json` in the same directory. `require("./config")` resolved to the `.json` file, not the `.ts` one — `loadMcpServerConfig` came back `undefined` at runtime despite a clean `tsc` pass (a type-check can't catch a module-resolution collision). Confirmed directly (`node -e "require.resolve(...)"`, not assumed) before fixing: renamed the loader to `index.ts`, which resolves cleanly from the folder path with no collision. Both the default-from-file path and every env-var override were re-verified for real afterward.

```json
// pipeline/facts-postgres-index/mcp-server/config/config.json
{
  "_note": "Vertex AI project/region/model/temperature for every script under mcp-server/. Real, working values as of 2026-09-06 -- verify against the current Vertex AI catalog before trusting them permanent. Override any field via env var without editing this file (e.g. for a future production project) -- see index.ts.",
  "vertexAI": {
    "projectId": "test-ai-oskey-io",
    "location": "global",
    "model": "gemini-3.5-flash",
    "temperature": 0.2
  }
}
```

```typescript
// pipeline/facts-postgres-index/mcp-server/config/index.ts -- named index.ts,
// not config.ts, specifically to avoid the module-resolution collision above
import fs from "fs";
import path from "path";

export interface McpServerConfig {
  vertexAI: { projectId: string; location: string; model: string; temperature: number };
}

let cached: McpServerConfig | null = null;

export function loadMcpServerConfig(): McpServerConfig {
  if (cached) return cached;
  const fileConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8")) as McpServerConfig;
  cached = {
    vertexAI: {
      projectId: process.env.MCP_VERTEX_PROJECT_ID ?? fileConfig.vertexAI.projectId,
      location: process.env.MCP_VERTEX_LOCATION ?? fileConfig.vertexAI.location,
      model: process.env.MCP_VERTEX_MODEL ?? fileConfig.vertexAI.model,
      temperature: process.env.MCP_VERTEX_TEMPERATURE ? Number(process.env.MCP_VERTEX_TEMPERATURE) : fileConfig.vertexAI.temperature,
    },
  };
  return cached;
}
```

`atomic-prd-agent.ts` real changes, three use sites: `const config = loadMcpServerConfig();` near the top; `vertexAI({ projectId: config.vertexAI.projectId, location: config.vertexAI.location })` (plugin init); `vertexAI.model(config.vertexAI.model)` + `config: { temperature: config.vertexAI.temperature }` (the `ai.generate()` call, replacing the old inline `0.2`); and `RunMeta`'s `model`/`projectId`/`location` fields (the `.meta.json` audit-trail sidecar, Step 8) now read from `config.vertexAI.*` too, so the real values a run actually used are recorded correctly regardless of any env-var override in effect that run.

**Done.** Implemented, the naming-collision bug found and fixed (above), both the default and every env-var-override path re-verified for real, whole-`pipeline` `tsc` clean. Confirmed by the user and peer before this code was touched, per that approval process.

---

## Step 12 — User Stories thinness investigation and persona addition

**Real question raised by the user after reviewing the reordered demo output (`015-...md`)**: the User Stories section looked light (2 short, mechanical stories) — should it be more complete, and if so, is the gap missing persona guidance or missing narrative context?

**Real, cheap check run first (no LLM cost)**: compared `013`/`014`/`015` (and `003` itself) directly — MD5-identical Technical Proposal and User Stories content, identical `durationMs` (220044) across all four, generatedAt minutes apart. Confirmed independently by the peer session running the same diff. **Finding**: these are not four independent generations — they're one real Q1a-v2 generation, re-rendered four times under different demo names to test formatting fixes for free. This comparison told us nothing about run-to-run variance; it was a self-comparison against clones, not evidence.

**Real comparison instead**: the two genuinely independent real runs on disk, `001` (Q1a, 2 stories, single actor "Property Manager") and `002` (Q1b, 3 stories, two actors — a second story for "System Administrator": *"I want directly assign a building unit to an ownerNonResident account, so that resolve administrative discrepancies or bypass onboarding when necessary"*). The model did diversify actors in `002`, exactly where the real tool-call evidence supported a second real path (an admin-bypass flow); `001`'s evidence never surfaced an equivalent second actor for its "add a type" business request.

**Peer's real reframe, adopted here**: Q1a's thinness may not be a defect at all — it may be legitimate evidence-following, the same shape already on record in `15-...md` Part A2 (a UI legitimately offering fewer options than its type allows is correct, not missing, when it's genuinely actor-scoped). The user's context-gap hypothesis (no access to `governance/reference-docs/` narrative docs) likely wouldn't make stories more *numerous* so much as more *precise* — real actor/authority names instead of a generic "Property Manager" — and is the only real way to know whether more actors genuinely exist for a given question, rather than guessing from evidence-shape alone.

**Decision, 2026-09-06 (user, after discussing both hypotheses)**: try the persona-guidance lever first — cheaper and lower-risk than scoping the reference-docs context work. Added a new step 5 to the persona's `## Process` (`atomic-prd-agent-persona.md`), between "cite only real evidence" and "be honest about gaps": explicit instruction to write a separate user story for every actor the *evidence itself* shows touching the behavior (not just the actor named in the request), while explicitly warning against inventing a second actor for variety or stretching a generic/hub node into a distinct story. Worded to diversify only when evidence supports it, per the peer's caution about invented-but-plausible actors — directly informed by the real `002` case (evidence-supported diversification) as the positive example and the fabrication-averse spirit of the rest of the persona as the guardrail.

**Real test run, 2026-09-06, real spend incurred, no output produced**: ran the persona-tweaked agent against the same Q1a-v2 business request (`WORKFLOW_NAME=add-ownernonresident-inhabitanttype-v2-persona-actors-test`). **Result: `ABORTED`, exceeded the 25-turn cap — nothing written to disk, no document to compare.** Real spend was incurred (25 real tool-call turns' worth of generation) with no output and no precise token/cost figure captured, since the run threw before reaching the point where usage is logged — worth being explicit about that rather than estimating a number that wasn't actually measured.

Real cause, from the actual tool-call trace (`/tmp/q1a-persona-actors-test.log`), not assumed: this run anchored differently than the original successful one. It walked outward from `checkInhabitantTypeAndDeleteAllInhabitantresident` (a cascading-deletion method, `['owner', 'tenant'].includes(...)`) rather than converging quickly on the frontend label-array path the original run found. It then spent 5 of its later turns on near-duplicate phrasings of the same query — `"inhabitantTypes"`, `"inhabitantTypes ="`, `"inhabitantTypes = ["`, `"inhabitantTypes:"`, `"inhabitantTypes create-organization-inhabitant.component.ts"` — never converging on the real `inhabitantTypes` array declaration the original run cited directly (fact_ids `#8`-`#12` in `003`/`015`).

**Genuinely unresolved, not yet root-caused**: two real, non-exclusive explanations, neither confirmed —
1. The new step-5 actor-coverage instruction plausibly nudged the model toward the deletion/admin-adjacent anchor first (looking for other actors touching the flow), which is the intended behavior but cost it the turns it needed to still find the original evidence.
2. Model non-determinism at `temperature: 0.2` alone — the original run wasn't guaranteed either, and this may be unrelated to the persona change at all.
Distinguishing these needs either a second real run (more spend, no stronger signal without a third for real confidence) or a look at why 5 near-identical `"inhabitantTypes"` phrasings all failed to surface a fact the original run found on a single try — a real search-relevance question independent of the persona change. Reported to the user rather than guessing further or spending again unprompted.

**Real, no-LLM-cost follow-up (user chose "investigate search relevance first" over retrying blind)**: ran the same 5 real `"inhabitantTypes"` query variants directly against `search()` (small real embedding spend, flagged before running, `test-search-relevance.ts`, deleted after use). Real result, and it changes the diagnosis:

| query | target found? |
|---|---|
| `"inhabitantTypes create-organization-inhabitant.component.ts"` | **yes — rank 18**, `confident: true` |
| `"inhabitantTypes"` | not in top 25 |
| `"inhabitantTypes ="` | not in top 25 |
| `"inhabitantTypes = ["` | not in top 25 |
| `"inhabitantTypes:"` | not in top 25 |

So the four bare/syntax-only variants were genuinely never going to work — pure vector search (by design, see `search.ts`'s own header) doesn't reward literal punctuation like trailing `=`/`[`/`:`, only real semantic content, and a bare `"inhabitantTypes"` alone isn't specific enough to reach a call-expression fact buried among many. Not a bug — expected behavior of the deliberately-kept-pure-vector design.

**But re-reading the real run's own tool-call order (`/tmp/q1a-persona-actors-test.log`) against this result surfaces the actual real cause of the abort, distinct from both hypotheses above**: the *first* of those 5 variants — `"inhabitantTypes create-organization-inhabitant.component.ts"` — was call **#16 of 25** in the real run, and per the table above it *did* return the target fact at rank 18, `confident: true`. The model had the real evidence it needed on that call and did not use it — instead it issued 4 more, narrower, syntax-only variants of the same query (calls #17, #18, #20, #21) that this test now shows could never have worked, then abandoned the thread entirely and burned its remaining turns on unrelated queries until the 25-turn cap hit. **Root cause of this abort: the model didn't trust/use a moderate-rank (18th of 25) but real, confident hit — not a persona actor-coverage side effect, and not a search-index gap.** Both original hypotheses (1: persona nudged it toward the deletion anchor: true, but not fatal on its own — the original run's evidence was still reachable from there and got found at #16; 2: pure non-determinism) are secondary to this — the real proximate cause is turn-budget waste after adequate evidence was already in hand, a behavior gap neither the persona nor the tool description currently addresses.

**Status, 2026-09-06 — paused, not abandoned.** User's own call, and the right one: one aborted run is a single data point, the same standard already applied to the User Stories thinness question itself (Step 12 above was paused for exactly this reason — `001`/`002` alone weren't enough either). Resume by running several more independent real Q1a-equivalent generations (different real business requests, not re-renders of cached output) before drawing any conclusion about whether the step-5 actor-coverage persona addition helps, hurts, or is neutral — real spend, to be flagged again at that time. The persona addition itself is left in place in the meantime (`atomic-prd-agent-persona.md`'s step 5); it is not reverted, since nothing found here shows it caused the abort (see Step 13's separate root cause).

## Step 13 — Real, separate finding: turn-budget waste on a moderate-rank confident hit (not a code bug, not a persona-actor-coverage side effect)

**What was found**: in the Step 12 test run, the model received a real `confident: true` search result containing the exact fact_id it needed, at rank 18 of 25, on tool call #16 of its 25-turn budget — then did not use it. It issued 4 more, narrower, syntax-only variants of the same query (`"inhabitantTypes ="`, `"inhabitantTypes = ["`, `"inhabitantTypes:"`, plus one combined with unrelated terms) that a direct, real test (`search()` called with each variant, small real embedding spend, flagged before running) confirms could never have worked — pure vector search doesn't reward trailing punctuation, only real semantic content. The model then abandoned that thread entirely and spent its remaining turns on unrelated queries until the real 25-turn cap (Genkit's `maxTurns`, a deliberate fail-closed safety limit) aborted the run with no output.

**Not a code defect** — `search()`, the tool wrapper, and the `maxTurns` cap all behaved exactly as designed and already verified. **Is a real behavioral gap**: neither the persona nor the `search_facts` tool description gives the model any guidance on when a result is "good enough" to stop searching, or warns against re-issuing near-duplicate punctuation-only query variants that vector search can't meaningfully distinguish between. Real, paid spend was lost to this specific pattern in this one run.

**Real, unresolved scope question, deliberately not answered here**: whether this is a systemic, recurring failure mode or a one-off from a single real run — n=1, same caution as Step 12. **No action taken on this finding yet** — documented first, per the user's explicit instruction, before any further real runs (of either Step 12's user-story question or this turn-budget question) are used to gather the data needed to tell the difference.

**Second real, independent run, 2026-09-06 — also ABORTED, n=2, but a different pattern this time.** Per the user's own plan ("document first and later we run more user story examples, then we have more data"), ran a genuinely new real business request: `01-qa-vision-and-examples.md` Example 2a (Resident Departure — add a departure date to the resident profile card, remove building/door access when it triggers, including the node-iot/edge-device leg), `WORKFLOW_NAME=resident-departure-2a`, real spend flagged before running. **Result: `ABORTED` again at the 25-turn cap, no output.**

The tool-call trace (`/tmp/resident-departure-2a.log`) does **not** show the same waste pattern as the first abort — no near-duplicate punctuation-only query retries. Instead, 25 turns of genuinely distinct, on-topic queries and `walk_cluster` calls across three real domains this request actually spans (Firebase resident/access-removal services, node-iot access-control-device/intercom publishing, and the Angular resident-details UI component) — still hadn't converged to a final answer when the cap hit; the Angular component anchor (a real, on-topic fact) was only reached on calls #24-26, right at the edge of the budget.

**Real, honest read**: this looks like the other real failure mode the codebase's own comment history already anticipated (`search.ts`'s `DEFAULT_RESULT_LIMIT` note: 25 was set as "real headroom" above GitHub Copilot's ~9-tool-call average for a harder-than-typical case) — a genuinely wide, real three-repo impact question may just need more than 25 turns to synthesize, independent of the Step 13 waste pattern above. Two real, independent generation attempts today (`add-ownernonresident-inhabitanttype-v2-persona-actors-test`, `resident-departure-2a`) have now both produced **zero output** — worth surfacing plainly rather than treated as two isolated one-offs, even though their proximate causes look different. **No action taken** — reporting to the user rather than raising `maxTurns` or changing anything unprompted.

**Cross-session follow-up analysis, 2026-09-06 (peer session, independently verified here against primary sources before recording)**:

1. **A real controlled comparison the two abort write-ups above didn't connect**: the *same* real Q1a business question ran successfully, start to finish, at the *same* `maxTurns=25`, under the *old* persona (Step 6's `001`). The only variable changed before the first abort (`add-ownernonresident-inhabitanttype-v2-persona-actors-test`) was the new step-5 actor-coverage instruction. Same question, same budget, persona changed, outcome flipped from success to total abort — the single best real evidence available connecting the persona change to *something*, even though (per the root-cause finding above) the proximate cause of that specific abort was turn-budget waste on near-duplicate query variants after an adequate hit, not the actor-coverage instruction directly forcing extra search.
2. **Checked the actual step-5 wording** (`atomic-prd-agent-persona.md:28`) for a stopping condition: it has none. It instructs the model to "consider every actor your evidence actually shows" and warns against inventing a second actor or stretching a generic hub node into a false one — real, useful fabrication guardrails — but says nothing about when evidence-gathering itself is sufficient. A plausible mechanism connecting this gap to the observed retry-waste: a model already holding a confident hit, told to be thorough about actor coverage with no defined stopping point, may read "thorough" as "re-verify via phrasing variants" rather than "look for a genuinely different actor" — it has no criterion for what kind of additional search actually satisfies "thoroughness." Not confirmed (n=1), but a specific, falsifiable causal story rather than an unattributed non-determinism guess.
3. **A second, separate, real gap found in the `resident-departure-2a` trace, verified directly against `/tmp/resident-departure-2a.log`**: tool calls #10-16 (`deleteIntercomEntryUser`, `OSKIntercomMessagePublisherService`, `OSKAccessMessagePublisherService`, `publishMessageAccessDeleteToACD`, the access-control-device controller `walk_cluster`, `"deleteAccess node-iot-api-oskey-io"`, `OSKAccessControlDeviceAccessPubSubPayloadDelete`) map real internal node-iot controller/pub-sub-payload detail — confirmed against `01-qa-vision-and-examples.md:40`'s own explicit scope line for this exact example, *"The corpus cannot provide the PRD for the edge devices, but can suggest the work needed up to and the return from the node-iot repo"* — i.e. past the business-declared boundary this question itself sets. The Angular side (the actual resident-details UI, the request's other real leg) was only reached at calls #22-24, too late in the budget to synthesize. Neither the persona nor the tool descriptions currently give the model any way to recognize a business-declared scope boundary and stop mapping depth past the interface, rather than treating adjacent internal detail as equally in-scope to explore exhaustively.
4. **The actionable common thread across both aborts**: neither run shows any sign of a "stop searching, write what you have" behavior before the hard cap — both behave as if search continues indefinitely until forcibly cut off, with no self-monitoring of remaining budget. Proposed, not yet applied: an explicit synthesis-budget reserve in the persona (e.g. "if you reach turn ~20 of 25 without enough to answer fully, stop searching now and write your best answer with what you've found, explicitly flagging what's missing"), consistent with the persona's existing honest-gap-reporting ethos. This converts today's binary success-or-zero-output failure mode into graceful degradation, and is worth doing regardless of how the retry-waste and scope-boundary causal questions above eventually resolve, since it protects against whatever *other* way a future run exhausts its budget.

**Status: documented, not actioned.** Same discipline as the rest of Step 12/13 — this needs a real user decision (change the persona wording again vs. gather more real runs first) before anything is applied, and is reported here rather than changed unprompted.

**External research requested, then a real, converged cross-session recommendation (2026-09-06)**: `governance/roadmap/market-research/14-findings-agentic-turn-budgets-2026-09-06.md` answers the maxTurns/stopping-condition questions above against real, current practice (Claude Code, Cursor, OpenHands, SWE-agent, Devin). Two independent sessions then read that brief and reasoned through it separately before comparing notes — both converged on the same ordering and most of the same reasoning, each catching a real gap the other's first pass missed:

1. **Verifiable stopping rule (prioritized first — cheap, addresses the actual root cause, no cost tradeoff).** The research's own strongest evidence (a real Commit0 eval: 6/16 instances at `max_iterations=500` never called finish, including one already at 100% pass) confirms more budget alone doesn't fix "doesn't recognize sufficiency" — Step 13's real root cause, distinct from the budget-exhaustion symptom. Refinement over OpenHands' own approach: push the nudge one level below persona prose, into the `search_facts` tool's own response text, injected right at the decision point rather than relying on the model recalling an instruction several turns later. **Second refinement, from comparing notes**: word it generally — "this result is confident and matches your query — if it answers the specific question you asked, use it and move to a different real question rather than rephrasing this one" — not narrowly keyed to the one punctuation-variant failure shape actually observed in this run, since a model could just as easily waste turns on synonym variants instead and slip past an overly literal rule. **Named architectural parallel**: this is the same code-enforced-not-just-prompt-recalled principle `adr-008.md` already established for fabrication/template-conformance checks, now applied to in-loop guidance instead of post-generation validation. **Noted for later, not now**: the persona has an analogous prompt-only pattern for `walk_cluster`'s `truncated` flag that could get the same in-tool-response treatment once this one is validated — a natural, cheap extension, not urgent.
2. **Two-tier `maxTurns` (right shape, real open question before building).** Should be invocation-level (the caller picks the tier), like Cursor's real mechanism, not mid-run auto-escalation — and the higher-tier number should come from re-running `resident-departure-2a` itself, not from guessing between the research's 50/75/100-ish range. **Real gap surfaced by comparing notes, not yet answered**: Example 2a's breadth was knowable in advance only because a human had already written "PGO+Firebase+node-iot+Angular all in scope" directly into `01-qa-vision-and-examples.md` — there is no real policy yet for a request that isn't pre-annotated with its own breadth. Two cheap options named, neither chosen: require the caller to declare it (simple, but relies on a human judgment call up front — exactly the kind of thing this whole research thread is about not trusting blindly), or a cheap heuristic over the request text itself (count distinct repo/domain keywords mentioned). Flagged so "the caller picks" doesn't quietly become "nobody picks, so it always defaults to 25" in practice.
3. **Cost-based budgeting (skip).** SWE-agent's own published rationale for going cost-based is explicitly cross-model step-count variance (Opus vs. GPT-4-Turbo use very different step counts for the same task) — this project runs one fixed model, so that rationale doesn't transfer, and building new per-turn cost instrumentation on top of Genkit's existing turn tracking wouldn't buy anything here.

**Status: still documented, not actioned.** Both sessions agree on the ordering and reasoning above; the user has not yet decided whether/how to build any of it — the exact tool-nudge wording, the tier-detection policy for (2), and the specific higher-tier number all remain real open decisions, not defaults to assume.

**Real, serious design constraint on the stopping-rule idea, raised by the user and verified directly before recording (2026-09-06)**: does "a `confident: true` result matching the queried field ends this search thread" risk stopping a future run before it gathers facts a continued search would have found? **Verified as a genuine risk, not hypothetical.** The *original successful* Q1a run's own Technical Proposal cites three fact_ids together for one finding — `#8`, `#9`, `#10` (`2026-09-06-015-...md` line 40: `getInhabitantTypeLabel` implemented in `OSKCreateOrganizationInhabitantComponent`, `OSKOrganizationInhabitantsListComponent`, and `OSKOrganizationInhabitantDetailsComponent`) — and `06-step6-real-verification-q1a-q1b-2026-09-06.md` (line 28-29) confirms this was **not** incidental top-K breadth from one search: the second and third sites were found via real, continued, self-directed exploration (15 total tool calls, including `walk_cluster`) *after* the first hit. A rule that stops a search thread on the first confident match would plausibly have cut this exact successful run off at `#8` and shipped a confidently thin answer — trading today's failure (wastes turns, zero output) for a worse, less visible one (stops early, ships an incomplete-but-confident answer with no sign anything's missing).

**The distinction that has to survive into the actual wording**: the four provably wasteful queries in the Step 13 log were cosmetic rephrasings of one identical target (`"inhabitantTypes"`, `"inhabitantTypes ="`, `"inhabitantTypes = ["`, `"inhabitantTypes:"` — confirmed dead-end by the direct `search()` test in Step 12). That is different from continuing to search for a different, structurally distinct real fact about the same finding (a sibling component, another call site, a related actor) — which is exactly what the successful run's `#9`/`#10` needed. The wording drafted so far ("move to a different real question rather than rephrasing this one") gestures at this but doesn't spell it out precisely enough to trust a model won't over-generalize "stop" into "stop searching entirely, I'm done."

**Concrete implication for whenever this is built, not yet done**: this needs a **second, different real validation test before shipping**, beyond "does it stop the wasteful-retry case" — also "does it still gather the full multi-fact evidence set on a case shaped like the real successful run, where the correct answer needed `#8` *and* `#9` *and* `#10`, not just the first one found." Shipping a version validated only against the wasteful-retry case would be trading a visible failure (zero output) for an invisible one (a confidently thin answer) — the worse outcome of the two.

## Step 14 — `PERSONA_FILE` override, and a third, different real crash: a near-miss fabricated `walk_cluster` anchor

**Real, small code change, made on request**: `PERSONA_PATH` was a hardcoded constant — no way to run the agent against any file but `atomic-prd-agent-persona.md`. Generalized to match the existing `TEMPLATE_FILE`/`BUSINESS_REQUEST_FILE` pattern already in `main()`: renamed to `DEFAULT_PERSONA_PATH`, added an optional `PERSONA_FILE` env var override (absolute or repo-relative), default unchanged. **Real bug caught in the same change**: `RunMeta.personaPath` was a separate hardcoded string literal a few dozen lines further down, never actually read from the resolved path — would have silently mis-recorded the audit trail (claiming the default persona was used even when an override was) on every future override. Fixed to `path.relative(PROJECT_ROOT, personaPath)`, the real resolved path. `npx tsc --noEmit` clean before running anything.

**Real test run, 2026-09-07**: user asked to re-run `resident-departure-2a` — the Step 13 case that aborted on genuine breadth — against a newly-authored alternative persona file, `atomic-prd-agent-skills.md` (same directory, more detailed tool-by-tool documentation, no step-5 actor-coverage clause, no other guidance from Step 12/13's still-undecided proposals). Real spend flagged before running.

**Result: a third, different real failure — not the 25-turn cap this time.** `walk_cluster` itself threw, at call #24 of what would likely have continued past 25 anyway: `[Fail-Closed] Graph edge(s) reference fact_id(s) not found in facts: call_expression|access_control_device/accesses|.../access_control_device_accesses_route.handler.ts|OSKLoggerController.default.info|anon|\`Pub/Sub: Processing 'delete' operation for device \${accessControlDeviceId}.\`|#1 -- edges may be stale relative to the current facts index.` — an intentional, existing fail-closed check in `graph-traversal.ts`'s `walkBoundedCluster` (verifies every fact_id the walk touches still exists in `facts` before returning; throws rather than silently dropping one).

**Root-caused directly against Postgres, not assumed — and it is not a stale-edge problem, the error message's own guess was wrong**: the fact_id the model passed as the `walk_cluster` anchor does not, and never did, exist — no edge references it, `cross_repo_edges` has zero rows matching it even under a broad `LIKE`. But a real fact_id exists that is **identical in every field except one**: real is `...access_control_device|src/v1/handlers/routes/...`, the model's anchor is `...access_control_device/accesses|src/v1/handlers/routes/...` — an extra `/accesses` spliced into the `module` field, character-for-character everything else the same (confirmed by direct string diff). The likely source: an unrelated real fact_id seen earlier in this same run's own results, `controller_method|access_control_device|src/v1/controllers/access_control_device_accesses.controller.ts|...` — a different fact, same module, whose *file path* contains `accesses`. The model appears to have blended a path fragment from one real fact into the module field of a different real fact_id when constructing this anchor, producing a plausible-looking but fabricated identifier neither the search index nor the facts table ever actually returned this way.

**Why this matters more than Steps 12/13**: this is the exact fabrication risk the persona's own "cite only real evidence, never invent a fact_id" instruction (and the mandatory, code-enforced `checkFabrication` validator) exists to prevent — but it happened as a **tool-call argument mid-run**, not in the model's final cited output, so `checkFabrication` (which only checks the final JSON's `evidenceIds` against fact_ids actually seen in tool *results*) never gets a chance to catch it — the walk_cluster fail-closed check caught it instead, by accident of also being a fail-closed design, not because anything was built to guard this specific path. **Real, honest positive**: the system did not silently return wrong or empty data for a fabricated anchor — it refused, loudly. **Real, honest negative**: it refused by throwing an uncaught exception that killed the entire `ai.generate()` call and lost the whole run's real spend, rather than surfacing the problem back to the model as a recoverable tool result (the way `search_facts`'s `confident: false` already does) so it could try again with a real anchor.

**Not yet decided — reported, not actioned**: whether `walk_cluster`'s tool wrapper should catch this specific fail-closed error and return it to the model as a structured, recoverable result instead of letting it propagate and kill the run — consistent with the Step 13 cross-session finding that this codebase already has a working precedent for code-enforced-not-prompt-recalled guidance (the `confident` flag), just not extended to this failure path yet. Whether the `atomic-prd-agent-skills.md` persona itself performs better or worse than `atomic-prd-agent-persona.md` on this business question remains **unanswered** — this run never reached a point where that comparison is possible.

**Third real attempt at the same business request, 2026-09-07 — user fixed a real typo in the new persona ("invert" → "invent") and asked to re-run, real spend flagged again.** `WORKFLOW_NAME=resident-departure-2a-skills-file-test-2`, `atomic-prd-agent-skills.md` (typo-fixed), otherwise identical inputs. **Result: `ABORTED` again — 25-turn cap, no output — but a clean abort this time, not a fabrication crash.** All 25 calls are distinct, on-topic queries (search + `walk_cluster` across scheduled-tasks, access-removal, node-iot access-control-device, and the Angular resident-details component) — no near-duplicate retries, no repeat of the fabricated-anchor pattern from the previous run. Given my honest assessment beforehand that the typo fix was unlikely to address the fabrication mechanism directly — this result is at least consistent with that: no fabrication occurred this time, but that could equally be this run simply not stumbling into the same blend-two-real-fact_ids situation, not evidence the added line prevented it. Can't distinguish those from n=1.

**Real, now-converging pattern across all three attempts at this one business request** (`resident-departure-2a`, old persona; `resident-departure-2a-skills-file-test`, new persona pre-typo-fix; `resident-departure-2a-skills-file-test-2`, new persona post-typo-fix): **0 for 3, across two different persona files.** Two of the three failed on genuine, non-repeating breadth exceeding the 25-turn cap; one failed on a one-off fabricated tool-call argument. The persona file being used does not appear to be the deciding factor for *this specific business request* — the common thread across all three is that a real, genuinely three-repo (PGO/Firebase + node-iot + Angular) impact question keeps needing more exploration than 25 turns provides, independent of which persona guides that exploration. This strengthens Step 13's two-tier-`maxTurns` recommendation specifically for requests shaped like this one, more than it says anything new about persona wording.

**Status: still fully documented, nothing built.** Real decision still open: whether to try `resident-departure-2a` a fourth time at a raised `maxTurns` (a real, cheap code change — a one-line cap increase, not the full two-tier design) to see whether this specific request would succeed given more room, before investing further in either persona file's wording.

**Real code change, 2026-09-07, user-directed**: `maxTurns` raised from 25 to 100 (`MAX_TURNS`, overridable via `process.env.MAX_TURNS`, same pattern as `BUSINESS_REQUEST_FILE`/`TEMPLATE_FILE`/`PERSONA_FILE`). Alongside it, real turn-cost accounting added to the audit trail, per the user's own real reasoning: *"it might not be how many repos, but how much code complexity in a business flow"* — worth measuring directly rather than assuming from repo count alone.

**Real distinction found and recorded, not assumed**: genkit's `maxTurns` counts real model round-trips (`currentTurn`, internal, incremented once per `generateActionTurn` call) — not the same number as tool calls, since one real turn can request several tools at once. Genkit doesn't expose `currentTurn` on the final `GenerateResponse`, so `turnsUsed` is reconstructed directly from `response.messages.filter(m => m.role === "model").length` (confirmed against genkit's own `model-types.d.ts` role schema: `"system" | "user" | "model" | "tool"`, one "model"-role message per real turn) — not estimated from tool-call count, which would have been a different, real number.

`RunMeta` gained `maxTurns` and `turnsUsed`; MetaData now renders `**Turns used:** N of 100` alongside the existing `Tool calls made` line, so every future run's real turn-cost is visible directly in the document, not just inferable from the raw log. `npx tsc --noEmit` clean before running anything further.

**Fourth real attempt at `resident-departure-2a`, 2026-09-07 — the first real success.** Same business request, same `atomic-prd-agent-skills.md` persona as the two prior attempts, only variable changed: `maxTurns` 25 → 100. **Result: converged and wrote a real document** (`2026-09-07-001-resident-departure-2a-maxturns100-test.md`), both mandatory validators passed, 446 real fact_ids seen. Real numbers, now measured directly rather than inferred: **`turnsUsed: 30` of 100** (29 real tool calls: 25 `search_facts`, 3 `walk_cluster`, 1 `get_graph_neighbors`), genuinely spanning all three real repos (`angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io` all appear in Snapshot Freshness) — confirming this was a real, not fabricated, cross-repo answer, matching the request's own declared scope. Real cost: $0.0744 (much lower than the original `add-ownernonresident` run's $0.6134 — this run's `thoughtsTokens` was 3,697 vs. that run's 62,916, and 113,615 of 118,788 input tokens were cache hits).

**Directly answers the user's own real hypothesis** ("it might not be how many repos, but how much code complexity in a business flow") **with a first real data point, not a guess**: this genuinely 3-repo request needed 30 turns / 29 tool calls to converge — real evidence that a 3-repo question isn't automatically 3x a 2-repo one's cost; the two prior 25-turn aborts on this exact request weren't proof the question was unanswerable, they were proof 25 was simply short of what this specific flow's real complexity needed. One data point, not a trend yet — the turn-cost field now exists precisely so more real runs build this comparison out rather than staying anecdotal.

**Also a new, real data point for the still-paused Step 12 (User Stories thinness)**: 2 user stories, single actor ("Property Manager") both times — no second actor surfaced, even under the `atomic-prd-agent-skills.md` persona, which carries none of `atomic-prd-agent-persona.md`'s step-5 actor-coverage clause. Consistent with the evidence-following hypothesis from Step 12 (peer session's reframe): this request's real evidence may just not contain a second actor, the same way Q1a's didn't — not yet conclusive (still needs the "genuinely searched and found only one" vs. "settled early" distinction Step 12 already flagged as unresolved), but doesn't contradict it either.

**Status: real progress, not closed.** The `maxTurns` lever is now validated as real and effective for this one request. The harder, still-open question — the verifiable stopping rule, so a run doesn't need a blunt 100-turn ceiling to avoid the Step 13 waste pattern on some *other* future request — remains exactly where the cross-session diagnosis left it: documented, not built.

## Step 15 — Evidence Used split: cited vs. audit trail, real user reaction to the 446/10 ratio

**Real user comparison, 2026-09-07**: user compared the new `maxTurns=100` success against `08-atomic-prd-example-resident-departure.md`, the older hand-traced example for this same business scenario (2026-09-03, pre-agent). Real findings from that comparison, both ways: the new document independently found and cited `OSKOrganizationResidentsService.deleteAppUserResident`/`_deleteNonAppUserResident` — resolving the old document's own self-flagged blind spot (it predates the `organization` module being synced into the facts index, and only found the older `unit_management`/`removeInhabitantFromUnit` path). The old document is richer in two real ways the new one lacks: it names a second actor ("Resident (departing)", vs. the new document's single "Property Manager"), and it explicitly flags the proposed change as the *first-ever* connection between the `unit_management`/`building` and `tasks` modules — "worth a deliberate architecture look" — a real caution the new document's Constraints never states, despite citing the same underlying task-scheduler facts.

**Real user reaction to the Evidence Used appendix itself**: 446 facts gathered, only 10 actually cited in the body. User's own framing, kept verbatim: *"the 10 i really like. they go straight to the point for a developer as guiders and pointers... I cannot trust this whole pipeline 100%, and a dev [should not] blindly follow an automated prd. but 446 is a lot of noise that fr[ea]ks people out."* Real, deliberate design tension: the uncited 436 are genuine audit trail (exactly what a skeptical reviewer needs to check what else the agent looked at — directly relevant given Step 14's real fabrication-adjacent finding), not noise to be deleted; but 446 items dumped inline overwhelms the primary reading document.

**Real fix, built and verified same day**: `renderReservedContent`'s `evidence-used` case now splits `Fact-Ids` into only the actually-cited entries (matches `citedNumbers`), and moves every gathered-but-uncited fact into a new `### Audit Trail` subsection wrapped in a collapsed `<details><summary>N fact(s) gathered but not cited in this document — click to expand</summary>...</details>` block — collapsed by default, one click to inspect, nothing deleted. Per explicit user request: audit trail entries render in `<sub>` (smaller text) and with real blank-line spacing between each bullet (`\n\n` join, not `\n`) — a deliberate, scoped exception to this document's existing rule that MetaData/Evidence-Used don't get the extra-spacing treatment, since a long uncited tail is exactly where scanability matters most.

**Verified for real, zero new LLM spend**: reused the real captured JSON from the `maxTurns=100` run (`generated-output.json`, extracted from its own log) plus the real fact list parsed back out of its already-written document, via the same temporary-export-then-revert backfill pattern used throughout this project (`assembleDocument`/`writeOutput` briefly exported, script run, exports reverted, script deleted). Confirmed correct: `Fact-Ids` shows exactly the 10 cited entries with return links; `Audit Trail` collapses the rest inside `<sub>` with blank-line spacing. One honest caveat, script-side only: the verification script's own regex-based text extraction mis-split 3 real fact_ids that themselves contain embedded backticks (real log-message snippets), undercounting the demo's Audit Trail by one (435 shown vs. the true 436) — a fidelity gap in the throwaway verification script's text-scraping, not in the shipped code, which operates on real structured JSON, never regex-parsed markdown. `npx tsc --noEmit` clean before and after.

**Real follow-up, same day**: user found even the collapsed, single flat 436-item Audit Trail hard to manage — a cloud/Firebase dev and an Angular dev each only care about their own repo, not one long shared list. Real, explicit request: title + description, then one expandable block per repo showing its fact count.

**Real fix**: added `getFactRepoMap(realFactIds)` — a genuinely new, separate real DB query (`SELECT fact_id, repo FROM facts WHERE fact_id = ANY($1)`), not inferred from the fact_id's file-path prefix, matching this project's "audit live state, not files" discipline applied here to grouping logic as much as to freshness checks. `RunMeta` gained `factRepoMap: Record<string, string>` (a plain object, not a `Map`, so it survives `JSON.stringify` into the `.meta.json` sidecar correctly — a `Map` would have silently serialized to `{}`). The Audit Trail now renders as a plain, always-visible description line ("N fact(s) gathered but not cited in this document — click a repo to expand") followed by one independently collapsible `<details><summary>repo (count)</summary>...</details>` block per repo — not one big collapsible wrapper containing sub-collapses, matching the user's own mockup exactly. Repos ordered to match the existing `Repos` subsection's R1/R2/R3 order (`ctx.repoNumbering`), not alphabetically, so the two subsections read consistently. Fail-closed if an uncited fact's repo is ever unknown (`factRepoMap` incomplete) — same philosophy as the rest of this file, refuse rather than guess or silently omit.

**Verified for real, real (cheap, free) DB spend only, zero LLM spend**: same temporary-export-then-revert pattern, this time also issuing one real `SELECT fact_id, repo FROM facts WHERE fact_id = ANY(...)` query against the live Postgres index for this run's real fact_ids (425 of 445 parsed fact_ids resolved — the remaining 20 hit the exact same known embedded-backtick text-scraping limitation as before, scoped out of this check rather than worked around, since it's the verification script's parsing at fault, not `getFactRepoMap` itself). Confirmed correct: three real, independently collapsible `<details>` blocks — `angular-app-oskey-io (61)`, `firebase-oskey-dev (303)`, `node-iot-api-oskey-io (51)` — summing to the real 415 total, ordered R1→R2→R3 matching Repos above. `npx tsc --noEmit` clean before and after; temporary export reverted, throwaway script and scratch files deleted.

## Step 16 — Live, real reconfirmation of Step 13's turn-waste pattern (killed, real spend, no output)

**Real fifth attempt, 2026-09-07**: user asked to run Example 1a (`WORKFLOW_NAME=ownernonresident-1a-maxturns100-test`) — the same business request as `add-ownernonresident-inhabitanttype-v2` from Steps 12-14 — under today's full current ruleset: `atomic-prd-agent-skills.md` persona, `maxTurns=100` default, real spend flagged before running. Purpose, per the user's own framing: not a new business question, a second real turn-cost/complexity comparison point under the same configuration that succeeded on Resident Departure.

**User noticed it was running long and asked directly; checked the live trace rather than guessing.** At 28 real tool calls, the run was reproducing the *exact* Step 13 waste pattern live: `"inhabitantTypes"`, `"inhabitantTypes ="`, `"inhabitantTypes = ["`, `"inhabitantTypes = create-organization-inhabitant.component.ts"`, `"inhabitantTypes create-organization-inhabitant.component.ts"`, `"inhabitantTypes organization-inhabitants-list.component.ts"`, `"inhabitantTypes organization-inhabitant-details.component.ts"`, `"inhabitantTypes = [ organization-inhabitant-details.component.ts"` — near-identical phrasings of the same query, back to back, the same real behavior first found in the very first `add-ownernonresident-inhabitanttype-v2-persona-actors-test` abort. **Real, direct confirmation that raising `maxTurns` to 100 does not fix this failure mode — it only gives it more room to happen before any hard cap intervenes, costing more real spend the longer it runs.** This is now n=2 for this specific waste pattern on this specific business request, independent of persona file (first occurrence was under `atomic-prd-agent-persona.md`'s step-5 addition; this one under `atomic-prd-agent-skills.md`, which has no such clause) — real evidence the pattern isn't tied to either persona's actor-coverage wording specifically.

**User's call, reported honestly rather than left running unattended**: stopped the job at 28 calls via `TaskStop`, real spend incurred with zero output and no captured token/cost figures (the process was killed mid-`generate()`, before the real usage data that only arrives with a completed or thrown response). Not resumed, not retried — this is exactly the still-undecided verifiable-stopping-rule question from the cross-session diagnosis, now with a second real, live occurrence on record rather than resolved by the `maxTurns` increase alone.

**Status: real, converging evidence, not yet actioned.** Two of this project's two real business requests (`add-ownernonresident-inhabitanttype-v2`, twice; contrast with `resident-departure-2a`, which converged cleanly at 30/100 once given room) show this waste pattern is real and repeatable specifically on the ownerNonResident question, independent of persona wording or `maxTurns` ceiling. The verifiable stopping rule (Step 13's research-backed recommendation, still "documented, not built") is the one lever that directly addresses this — raising the turn budget further would not.

---

## Step 17 — Real market research: how other products word this exact guidance (no code changes)

**Real research requested, 2026-09-07**, after Step 16's live reconfirmation of the retry-waste pattern: how do real, current AI coding agent products word tool descriptions/rules to prevent cosmetic query retries against a semantic-search tool? Findings written to `governance/roadmap/market-research/17-findings-semantic-search-retry-guidance-2026-09-07.md`, real citations throughout (Cursor, Windsurf/Cascade, Claude Code's own published prompts, one 2026 arXiv paper).

**Headline finding**: no real system says, in so many words, "don't retry semantic search with punctuation variants." Three independent real systems (Cursor, Windsurf, Claude Code) instead converge on a different, more fundamental pattern: state plainly what does and doesn't change a semantic-search result (meaning vs. exact-text mechanics), and give the model a **different tool or strategy to escalate to** once semantic search stops helping — not "reword and try again." Cursor's own real system prompt draws this explicitly: use `grep_search` (exact-match) "when we know the exact symbol/function name," reserving semantic search for concept-level questions. Claude Code's own real guidance is the same shape one level up: "if not confident you'll find it in the first few tries, use the Agent tool" — escalate, don't reformulate.

**The real, structural finding, more important than any single wording fix**: every real system checked has *both* a semantic-search tool and an exact/keyword-match tool, and its guidance is about choosing correctly between them. This project's `search_facts` is *purely* vector/semantic — there is no keyword/exact-match tool in the current three-tool surface (`search_facts`, `get_graph_neighbors`, `walk_cluster`) to escalate to. A persona-wording fix (Step 13/17's "state what does/doesn't move a result" idea) is real and adoptable regardless, but the research itself flags that it can only partially replicate what real systems achieve through genuine tool diversity — a separate, real, structural design question, explicitly out of this research's scope and not decided here.

**Not found**: no real, current, verbatim guidance at this level of detail from GitHub Copilot, Devin, SWE-agent, OpenHands, or Sourcegraph Cody — reported honestly as absent, not padded.

**Status: documented only, per explicit instruction — no code changes made.** Real, adoptable next steps named in the findings doc (tool-description wording informed by this project's own already-confirmed embedding mechanism; Windsurf-style positive guidance on what a *good* query looks like; the separate keyword-tool structural question) are all still open decisions, not yet actioned.

## Step 18 — Real character-frequency check, a language-robust wording fix, and a clean real before/after

**Real, cheap DB check requested before writing the fix**: sampled `facts.description` directly (1,268 real rows, `TABLESAMPLE`) to see what punctuation is actually in the indexed text, rather than reasoning abstractly. Real result: `/`, `_`, `-`, `.`, `:` are common (structural — file paths, module separators); `(`/`)` appear ~1,654 times (around file:line references); but `[`/`]` appear only 31 times each, `=` only 62 times, backticks only 4 — across 1,268 real descriptions. Confirms directly: the syntax the model kept guessing at (`inhabitantTypes = [`) essentially doesn't exist in what it's searching against — descriptions are written as prose (`"-- possible values: owner, tenant, resident"`), not literal code/array syntax.

**Real, explicit caution raised by the user before writing anything**: this character survey is TypeScript-repo-specific (`descriptionFor()`, the only description-generation logic that exists today) — once Kotlin/Swift/C++ repos are added, their extraction won't build descriptions the same way, and a rule hard-coded to today's character survey could go stale. Resolved by wording the fix around the **mechanism** (vector search matches meaning, not syntax, "regardless of the language a fact comes from") rather than baking in today's specific character list — true for TypeScript now, stays true once other languages exist, since it's a property of embedding-based search itself, not of any one language's description shape.

**Real fix applied by the user, verified by re-reading the file**: added one sentence to `atomic-prd-agent-skills.md`'s `search_facts` tool description (the only file changed): *"This tool matches by meaning, not exact code syntax — punctuation, brackets, and literal formatting tricks don't move the result regardless of the language a fact comes from; only genuinely different real-world wording helps."*

**Real, clean before/after test — same business request, same persona file (one sentence added), same `maxTurns=100` ceiling, nothing else changed.**

| | Before (Step 16, killed) | After (this fix) |
|---|---|---|
| Tool calls when stopped/finished | 28+ (still running, killed) | 16 (11 `search_facts`, 5 `walk_cluster`) |
| Turns used | N/A (killed before completion) | **17 of 100** |
| Retry-variant queries (`"inhabitantTypes ="`, `"inhabitantTypes = ["`, etc.) | Present, repeated | **None** |
| Outcome | No output, real spend lost | **Real document produced**, both validators passed, 166 real fact_ids seen |
| Cost / duration | Unknown (killed mid-flight) | $0.0873 / 1m 3s |

Output: `2026-09-07-004-ownernonresident-1a-tool-desc-fix-test.md`. One query in the new trace, `"['tenant', 'resident'].includes"`, looks superficially similar to the old bracket-guessing pattern but is meaningfully different: it's the literal `calleeExpression` text copied verbatim from a real fact the model had already retrieved (a legitimate "search using an exact phrase I now know exists" move), not a syntax guess invented from nothing.

**Status: real, positive, single-run result — same "n=1" caution applies as everywhere else in this file.** This is the cleanest before/after this investigation has produced (one sentence changed, everything else held constant, and the exact failure mode disappeared), but one clean run doesn't yet prove the fix generalizes beyond this one business request. Real next step, not yet done: run this fix against other real business requests (Resident Departure, a fresh one) to see if the improvement holds.

**Real regression check, 2026-09-07, same day**: user's own real caution — Resident Departure was already a strong success (Step 14); before trusting the fix, confirm it didn't regress the case that was already working. Re-ran the *exact same* business request as the original success — confirmed word-for-word identical to what was actually used that run (compared directly against the original output's own rendered `## Business Request` section, not re-copied from `01-qa-vision-and-examples.md`, which still carries small typos — "schedule taks facility" — the original run's input had already silently normalized), same persona file (now with Step 18's fix), same `maxTurns=100`.

**Result: no regression, remarkably close numbers.**

| | Original success (Step 14) | With the fix |
|---|---|---|
| Turns used | 30 of 100 | **30 of 100** (identical) |
| Total tool calls | 29 | 29 (identical) |
| All 3 repos touched | yes | yes |
| Duration | 2m 0s | 1m 56s |
| Cost | $0.0744 | $0.0828 |
| Real fact_ids seen | 446 | 463 |

Content quality held too, spot-checked directly: same two single-actor user stories, same real access-removal chain correctly cited in the Technical Proposal (`OSKAccessService.deleteAccessById` → `OSKAccessMessagePublisherService.publishMessageToAllACDs`). Output: `2026-09-07-005-resident-departure-2a-tool-desc-fix-regression-test.md`.

**Status: fix validated two ways now, both real.** It eliminated the retry-waste failure on `ownerNonResident` (Step 18 above) and left the already-working Resident Departure case completely unaffected — identical turn count, no quality drop. Still n=2 total (one fix, one regression check), not proof the fix generalizes to every future business request, but the strongest real evidence this investigation has produced so far.

**Third real validation, same day — a genuinely new business flow, not a repeat.** `01-qa-vision-and-examples.md` Example 6 (Supplier Activity tab — a new tab on the supplier record showing pincode door-open activity, filterable by building/door, searchable by staff name/email), `WORKFLOW_NAME=supplier-activity-tab-6-test`, same fixed persona, real spend flagged before running, watched live via `Monitor` this time (user's own request — "we are still in alpha mode," proactive tool-call-by-tool-call visibility rather than waiting for completion, so a bad run could be caught and killed early same as Step 16).

**Result: real, clean success.** 18 turns of 100, 17 tool calls (16 `search_facts`, 1 `walk_cluster`, **zero** `get_graph_neighbors` — not a gap, `walk_cluster` already subsumes single-hop lookups when a full outward walk is the better move, which it was here). No retry-spiral, no fabrication. Found and correctly cited the real `OSKSupplierStaffActivity` type (real fields: `buildingId`, `buildingName`, `doorId`, `doorName`, `firstName`, `lastName`, `email`, `activityType`, `timestamp`) and the real `OSKSupplierStaffActivityService.getAllActivities` method — output `2026-09-07-006-supplier-activity-tab-6-test.md`.

**One real, honest wrinkle, not a failure**: cost ($0.6859) and duration (3m 46s) were much higher than the other two fixed-persona runs (~$0.08, ~2min) despite *fewer* total tool calls (17 vs. 29) — a live, concrete counter-example to "more tool calls = more cost." The likely real driver is thinking-token spend during the extended `"getAllActivities"` hunt phase (visible live in the trace: `"getAllActivities angular"` → `"...suppliers.service.ts"` → `"supplier-getAllActivities"` → `"...index.ts"` → `"...supplierStaff/index.ts getAllActivities"`) — each individually a legitimate, genuinely-different real-context variation (not the fixed punctuation-retry pattern), but the *number* of legitimate variations it took to land the anchor is itself a real, different kind of cost driver worth tracking separately from turn/call count. Not investigated further this session — flagged for whoever picks up the turn-cost-vs-complexity thread next.

**Status: fix now validated three ways — two real successes on genuinely different business flows, one clean regression check on an already-working case, zero retry-spirals since the fix landed.** Real, still-open next step: apply the same tool-description sentence to `atomic-prd-agent-persona.md` (the original persona, still untouched by this fix — only `atomic-prd-agent-skills.md` has it) if that file is ever used again.

## Verification plan, summary

1. Steps 2, 4, 5 each get a cheap, no-LLM-cost check before moving on — same "cheap, real, bounded test before scaling up" discipline as the rest of this project.
2. Step 8's whole-pipeline wiring gets a full `npx tsc --noEmit` pass before Step 10 spends anything.
3. Step 10 is the real, decisive check — same real cases, same real corpus, now through the generalized system — and needs an explicit go-ahead given it's real spend.
