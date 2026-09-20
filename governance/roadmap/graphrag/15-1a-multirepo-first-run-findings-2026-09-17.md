# 1a multi-repo (PGO + Cloud + iOS) fan-out — first-run findings

Real, first-time test, 2026-09-17. Business request: `mcp-server/test-questions/1a-adding-a-owner-non-resident-type.md` — explicitly names PGO (Angular), Cloud (Firebase), and the iOS Oskey app. Every prior capability-fanout test stayed within the TS repos; this is the first real run against a request that spans TS and Swift/iOS. Run via `capability-fanout-prd-agent.ts`, `skill.v3.md`, post-ADR-010 (fact_ref surrogate key). Genuinely new ground — reported as what actually happened, not compared against a prior baseline (none exists for this case).

Command, output, meta: `output/agent-runs/prds/test/2026-09-17-008-1a-ownernonresident-multirepo-first-run.{md,meta.json}`. Full run log: scratchpad `1a-multirepo-first-run.log` (138 lines).

## Headline numbers

- **Real cost: $0.3791** (flagged in advance as "similar order to today's earlier 2a fan-out run" — that was $0.2775; this landed a bit higher, same order of magnitude).
- Duration: 11m12s.
- 5/5 routed capabilities completed — **no failures this run** (unlike the earlier 2a fan-out, where 1 of 5 capabilities hit its turn cap). Tool calls per capability: organization 16, features 13, core 10, user 15, building 12 (66 total). Turns: 17, 14, 11, 16, 13 (71 total).
- 371 real `fact_ref`s seen across all capability calls.
- **Both mandatory validators passed** (`checkFabrication`, `checkTemplateConformance`) — zero `AMBIGUOUS_CITATION`/`FABRICATED_CITATION` errors, and the "Fabrication diagnostic" preview never printed for any capability.
- No `[fact_ref format warning]` ever logged — every `factRef` argument sent back by the model across all 66 tool calls was a well-formed 40-char hex string.

## (1) Did iOS/Swift evidence get pulled in? — No, and this was independently verified against live Postgres, not just read off the validator log

**The routed capabilities were `organization`, `features`, `core`, `user`, `building` — all real modules from the TS repos.** No Swift/iOS module made the top-5 routing cut. Confirmed directly from `factRepoMap` in the run's own meta.json: **all 371 real facts gathered this run came from exactly two repos — `firebase-oskey-dev` (297) and `angular-app-oskey-io` (74). Zero facts from `ios-oskey-dev` or any `swift-*` repo.**

This was checked live against Postgres, not assumed from the routing log alone (per this project's "verify fabrication claims against live data" discipline, applied here to a routing-gap claim instead):

- **The relevant iOS evidence genuinely exists.** `SELECT repo, count(*) FROM facts WHERE description ILIKE '%inhabitanttype%' OR fact_id ILIKE '%inhabitanttype%' GROUP BY repo` returns real, live counts: `firebase-oskey-dev` 101, `angular-app-oskey-io` 27, **`ios-oskey-dev` 19**, `swift-cloud-kit-oskey-dev` 11. `ios-oskey-dev` overall holds 25,458 real facts (the largest single repo in the corpus) — this is not a coverage gap in the sense of "iOS was never extracted."
- **`ios-oskey-dev`'s module for these facts is `"iOS App"`** — confirmed no collision with any TS repo's module names, so this isn't a routing bug caused by two repos sharing a module label.
- **Real, structural reason #1 the routing pass didn't surface it**: `routeCapabilities` ranks by best vector distance within one global top-150 pool for the whole query, then takes the top 5 modules. The 5 that won had best-distances 0.6881–0.6989, all in the TS repos, which also have far more raw hits for this query's wording (101+27 firebase/angular vs. 19 iOS) — iOS's real, relevant facts were outranked/outnumbered for this specific query, not absent.
- **Real, structural reason #2, independently confirmed and arguably the more important one**: `SELECT count(*) FROM cross_repo_edges e JOIN facts f1 ON f1.fact_ref = e.source_fact_ref JOIN facts f2 ON f2.fact_ref = e.target_fact_ref WHERE f1.repo = 'ios-oskey-dev' OR f2.repo = 'ios-oskey-dev'` → **0 rows.** `ios-oskey-dev` has **zero cross_repo_edges to or from any other repo in the entire corpus.** `get_graph_neighbors`/`walk_cluster` are deliberately unrestricted (not module-scoped, per the design doc) specifically so a capability could reach cross-repo evidence outside its own module — but there is no real edge for that mechanism to traverse into `ios-oskey-dev` at all, from any anchor, regardless of how the routing pass had gone. Even a perfect routing pass could not have produced an iOS citation here through the graph-walk path; only a direct `search_facts` hit landing in the iOS module could have, and none did for this query.

**This is a real, pre-existing data/graph-coverage gap, not a regression from this session's ADR-010 changes** (the fact_ref rename touches identity/lookup only, not what edges exist) and not a bug in the capability-fanout routing logic itself — it's what the real, current graph looks like for this repo pair. Worth flagging forward: if cross-repo linkage to iOS ever gets built (e.g. an `HTTP_API_CALL`-style edge from a Cloud endpoint to an iOS network client), this exact case would be the natural regression check.

## Honest handling of the gap — the model did not fabricate iOS behavior

Despite having zero real iOS evidence, the rendered document (`.../2026-09-17-008-....md`) never asserts an iOS-specific technical claim as fact without a citation. Acceptance Criteria correctly uses `[NEEDS CLARIFICATION: ...]` for every iOS-behavior SHALL clause it couldn't back with real evidence, e.g.:

> WHEN the iOS app displays the inhabitant type, THE SYSTEM SHALL [NEEDS CLARIFICATION: how should the iOS app visually represent the 'ownerNonResident' type to Property Managers and other users?]

> WHEN the iOS Oskey app receives an inhabitant of type 'ownerNonResident', THE SYSTEM SHALL [NEEDS CLARIFICATION: how should the iOS app render and handle permissions/flows for 'ownerNonResident' inhabitants?]

User Stories (not a cited-list kind, no evidence requirement) does mention iOS App users generically — expected and fine, not a citation-integrity concern. No Technical Proposal or Constraints claim (both `cited-list`, evidence-required) makes an iOS-specific assertion at all — consistent with there being no real iOS fact_ref in the pool to cite. This is the skill's "Honesty about gaps" behavior working as intended on a real, live case, not a hypothetical one.

## (2) Capability completion

All 5/5 completed within the 20-turn cap this run — no `[capability FAILED, skipped]` line anywhere in the log, unlike the earlier 2a fan-out (`user` capability timed out there). Non-determinism across runs; not evidence either way on the separately-tracked capability-completion-reliability issue, just worth recording as one clean data point.

## (3)/(4) Validators and real numbers — see headline numbers above. Both passed; full real tool-call/turn/cost breakdown captured in `capabilityFanout` block of the run's own meta.json.

## Bottom line

The fact_ref mechanism itself worked cleanly on real, new, multi-repo-worded input — no fabrication, no malformed references, no crash. The reason iOS evidence didn't appear is real and independently verified: it's a data/graph-coverage gap (zero cross-repo edges touching `ios-oskey-dev`), not a citation-integrity or routing-logic bug, and the system responded to that gap honestly (`[NEEDS CLARIFICATION]`) rather than by fabricating.

## Addendum, found afterward (2026-09-17, same day): raw fact_ref sometimes leaks into rendered claim prose — a real, narrow ADR-010 side effect, not caught in the original build verification

Prompted by the user directly comparing this report's `.md` against the earlier ADR-010 retest `.md` files and asking why they differed — this doc's rendered body contains raw 40-char hex strings inline inside Technical Proposal claim sentences, e.g.:

> ...This type is used across multiple models including `OSKOrganizationOnboardingInhabitant.inhabitantType` [d708d9f4c64d8686746e8ff4462f1cb25c24b13f], ...

**Root cause, confirmed by reading the rendering code and the run log, not assumed**: this is the model's own doing, not a rendering bug. `renderSectionContent`/`renderCitations` (`section-content.ts`) only ever append a `(see #N)` suffix after a claim; they never touch the claim string itself. The model is separately, voluntarily writing the raw `factRef` inline inside the `claim` field's free-text prose, in *addition* to correctly listing that same ref in `evidenceRefs` (which drives the proper numbered citation link). Every inline hash checked matches a real, correctly-cited `evidenceRefs` entry — this is redundant, not fabricated or broken.

**Correction (2026-09-18, caught by a peer session's spot-check, not self-caught)**: this addendum originally claimed "14 occurrences in this doc, 2/2/5/7 in the other four post-ADR-010 docs, 0 in the two pre-ADR-010 baselines" and called the phenomenon confirmed across all 5 post-ADR-010 docs. **That count was wrong.** My grep (`\b[0-9a-f]{40}\b` over the whole rendered file) also matches git commit SHAs — `atomic-prd-agent.ts:438` renders `` `${repo}@${commitSha}` `` in the Repos subsection of Evidence Used, and a commit SHA is also 40 lowercase hex characters, indistinguishable from a `factRef` by pattern alone. Restricting the search to text *before* the `## Evidence Used` heading (where commit SHAs live) gives the real counts:

- **004, 005, 006, 007 (the four ADR-010 retest docs): 0 real occurrences each.** The 2/2/5/7 I originally reported were entirely commit-SHA false positives from those docs' own Repos lines — the phenomenon did not occur in any of them.
- **008 (this doc, the multirepo run): 12 real occurrences, not 14.** Two of the original 14 were this doc's own commit-SHA lines (`angular-app-oskey-io@8345d222...`, `firebase-oskey-dev@00e1d9fd...`).

**Corrected claim**: as of today, this phenomenon has been observed in exactly **1 of 6 real post-ADR-010 runs** (this one), not "all 5 post-ADR-010 docs." The "old fact_id was too long/ugly to inline, the new short hash tempts the model to" theory is still plausible as an explanation for why it happened *here*, but with n=1 it is not the established pattern the original wording claimed — it's one real, confirmed instance, not a general regression rate. The zero-in-pre-ADR-010-baselines comparison stands (that check used a different, unaffected pattern — bracket-plus-pipe structure, not bare 40-hex — so it wasn't contaminated the same way), but the post-ADR-010 side of the comparison needs the corrected 1-of-6, not 5-of-5.

**Not caught in the original build verification** (`governance/roadmap/graphrag/14-prompt-15-factid-surrogate-key-build-execution-2026-09-17.md`) because that check confirmed the Fact-Ids *appendix* renders correctly via `factDisplayMap`, but never grepped claim *body* text for stray raw refs — a real gap in that verification pass, noted here rather than silently fixed after the fact.

**Assessment**: cosmetic, not a citation-integrity regression — no fabrication, no broken link, nothing the fail-closed validators should catch (there's nothing wrong to catch). Real, but rarer than first reported: one confirmed instance, not a consistent post-ADR-010 pattern. Worth a follow-up regardless: `skill.v3.md` could be strengthened to explicitly forbid inlining the raw `factRef` in claim prose (parallel to its existing "never confuse `factRef` with `description`" instruction) — not done in this session, flagged here as a genuine open item for a future prompt, with the real, corrected evidence base (1 instance) rather than the overstated one.
