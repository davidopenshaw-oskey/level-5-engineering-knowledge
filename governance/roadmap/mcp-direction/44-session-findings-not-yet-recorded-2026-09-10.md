# Real findings from this session not yet captured elsewhere — 2026-09-10

Five real threads from this session's discussion that shaped later work but were never written down — captured now, at session close, per this project's own documentation discipline. Ordered as they happened.

## 1. The "series of skills" architecture discussion — real challenges raised, not yet resolved

Before building the low-freedom experiment (`40-...md`), the user proposed extending today's narrow-scope result into a real, designed series of skills — some extracting specific PRD evidence, some assembling it — possibly structured as multiple documents (mirroring Kiro/spec-kit's `requirements.md → design.md → tasks.md`) or one document with distinct pages (a HITL-facing page, an agentic-facing page).

Real challenges raised in that discussion, not yet acted on:
- **n=1 risk**: committing to "a series of skills" from one successful narrow-scope trial is premature — the real next step was one more narrow trial on a different section, not a whole pipeline.
- **"Extraction vs. assembly" may be the wrong axis.** This project's real assembly step (`assembleDocument`/`renderSectionContent`) is already solved and free (deterministic code, not an LLM call). What doesn't exist is a *cross-section consistency* pass (does Acceptance Criteria's claims line up with what Technical Proposal actually found) — genuinely different from formatting, and worth not conflating.
- **Real quota-amplification risk**: splitting one conversation into several separate per-section calls means more total `generateContent` requests against the same constrained 5/min bucket (`38-...md`) — could make the quota problem worse, not better, unless carefully sequenced.
- **Real caching-loss risk**: one continuous conversation benefits heavily from Vertex's implicit prefix caching (confirmed real, e.g. 74-94% of input tokens cached across today's runs). Separate per-section calls, each starting fresh, could lose much of that — untested, flagged as a real open question, not measured.
- **The "agentic page" question was never resolved cleanly** until the user's own later correction (item 4 below) settled it: the destination is a human developer, not a downstream coding agent — "months or years away from automated agentic coding," per the user directly. This resolves what a Devin-DeepWiki-style dual-page design would have been trying to serve.

**Real, agreed outcome**: park the multi-skill/multi-page architecture question. Keep the current single-document, human-facing PRD as the real scope. Use narrow-scope experiments (like `40-...md`) as the improvement mechanism, not a full pipeline redesign, until there's more than one real data point.

## 2. The `test-questions.md` benchmark proposal — real challenges raised, partially acted on

The user proposed running all real cases in `mcp-server/test-questions/test-questions.md` and building a benchmark suite from them. Real challenges raised:
- Running all 9 cases risks the same quota wall this session spent hours on, especially since 3 of them (items 3, 4, 5) have never been run.
- A benchmark built on one run per case can't separate a real effect from this project's own confirmed 2x+ run-to-run variance.
- The 9 items aren't uniformly ready: items "1" and "2" are informal early drafts of "1a"/"1c" and "2a"; item "6" already has a real baseline (`2026-09-07-006-supplier-activity-tab-6-test`); items 3, 4, 5 are genuinely untested.
- **Real, notable gap found**: the intercom case — described in `adr-009.md` as "the single most reliable real trigger this week for the classes of bugs actually worth finding" — isn't in `test-questions.md` at all. Worth adding as a permanent regression case; not yet done.

**Real, agreed outcome**: don't run all 9 at once. The precision pilot (items 3 and 5 below) used exactly this file's own "1"/"2" vague items as a real, already-existing precision-comparison resource, rather than inventing synthetic vague prompts — that part of the original proposal did get acted on, just narrowly.

## 3. Real, if limited, retrieval-consistency check against existing `output/agent-runs/prds/test/` data

Before running new live tests, the user asked whether existing data in `output/agent-runs/prds/test/` (56 files, 2.1MB) could answer "are we pulling the facts out correctly" for free. Found: 13 files from 2026-09-06 are genuinely independent real runs of the identical 1a business request, made while iterating on *rendering* features (citation links, cost display), not retrieval.

**Real result, with the user's own caveat attached** (these are "bug iterations," not a designed trial — treat as suggestive, not reliable): across the 6 runs that used the newer citation-numbering format, all 14 real cited fact_ids appeared in every one of those 6 runs. The very first run (pre-citation-numbering, mid-bugfix) was missing 2 of those 14 — a real, small, visible inconsistency even in this imperfect dataset. **Not treated as a real benchmark result** — the user's correction that this is unreliable, incidental data stands; a real version of this check needs deliberately-designed, spaced-out repeat runs against a known-stable skill version, not repurposed debugging byproduct.

## 4. Two real corrections from the user, late in the session — recalibrate how to read `40-...md` through `43-...md`

- **Cost/token deltas are a HITL trip-wire, not a benchmark metric.** Their only real value: if a human reviewer sees an unusually large jump in a document's cost or token use, that's a cheap signal something may have gone wrong (retries, excessive searching) worth a second look — not a number to optimize or compare rigorously between runs. `43-...md`'s cost/token comparisons should be read with this in mind, not as findings in their own right.
- **The system's real job is surfacing real, cited evidence as candidates for a developer to inspect — not producing an autonomously-correct technical design.** Directly stated: "we are months or years away from automated agentic coding." This reframes the pair-2 "cron job vs. `OSKTaskSchedulerService`" finding (`42-...md`) more precisely: the real failure isn't that the proposed design was wrong (that's the developer's call either way) — it's that the cited evidence didn't point the reader toward the actually-relevant real code to go inspect. Pointing, not deciding, is the real success criterion.

## 5. Claim-evidence-support check — proposed, examined with real examples, then explicitly decided against

Following finding 2 in `43-...md` (nothing checks whether a claim's cited evidence actually supports the claim), an embedding-similarity-based check was proposed: embed claim text and cited fact descriptions, flag low-similarity pairs as candidates for review. Reuses `gemini-embedding-2` (a separate, high-quota bucket, no pressure on the constrained 5/min generative bucket).

**Real examples pulled directly from Postgres to test the idea**, from the pair-2 vague run (`42-...md`):
- **Bad case (the one already found)**: claim about a "scheduled ... cron job" cited `service_method ... deleteResident -- returns: Promise<...>` — no topical overlap at all, a check would plausibly catch this.
- **A claim held up as a "good" contrast**: *"revokes building accesses via `OSKBuildingAccessesController.default.deletePerUser` and `OSKUserAccessesController.default.deleteAllAccessesPerBuilding`"* — cited two real `call_expression` facts each naming one of those two methods.

**The real, decisive challenge, from the user**: the "good" example only proves each individual fact is real and topically on-point — it says nothing about whether the *relationship* the claim asserts (both calls happening together, in that order, as one coherent access-revocation flow) is actually true. A building-removal PRD could legitimately call these two methods in this combination for a good reason, or the claim's "and" could be gluing together two unrelated, independently-reachable code paths — text similarity cannot tell the difference, because that answer lives in the real call graph (`cross_repo_edges`, the same structure `walk_cluster` traces), not in prose descriptions.

**Real, final conclusion — decided against, not just left as a good idea for later**: an embedding-similarity check would only ever catch the narrow case (wildly unrelated citations, like the cron example) — never the more common, more dangerous case (individually-real facts wrongly stitched into a claimed relationship). Worse: a passing similarity score on a *relational* claim would read as false reassurance, exactly the wrong outcome given the system's real job (finding 4 above) is to hand a developer real starting points, not a pre-verified narrative. **Not building this.** The system's real, honest guarantee stays exactly where it already is (every cited fact_id is real, `checkFabrication`) — the narrative connecting facts is the agent's synthesis, and verifying it is the human's job, by design, not a gap to automate away.
