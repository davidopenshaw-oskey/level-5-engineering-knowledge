# Build completion: cross-module signal (b) + exact-dup/substring query checks (c/d), 2026-09-20

Executes [10-build-plan-duplicate-search-queries-fix-2026-09-20.md](10-build-plan-duplicate-search-queries-fix-2026-09-20.md)
(itself following [09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md](09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md)).
All five phases built and run this session, in order, with explicit approval before each
real-spend step (Phase 3's calibration call, Phase 4's full run).

## What was built (Phases 0-2 — code, zero spend)

- **`mcp-server/db/search.ts`**: additive `opts.crossModuleMargin` param on `search()`. When set
  (with `moduleFilter`), reuses the already-computed embedding for one extra, cheap
  Postgres-only cross-module query and attaches `betterMatchOutsideModule: { module, distance }`
  to `SearchResponse` when the gap clears the margin. Zero additional Vertex spend; every
  existing caller (`atomic-prd-agent.ts`, `routeCapabilities()`) is unaffected (`opts` stays
  `undefined` for them).
- **`mcp-server/agent-poc/capability-fanout-prd-agent.ts`**: `makeCapabilityTools`'s
  `searchFacts` tool now carries a shared `triedQueries` structure behind:
  - **(c)** an exact-duplicate cache — a genuinely identical `(query, limit)` repeat is served
    from memory, skipping the real embedding call and Postgres query entirely (verified
    offline against the real 2026-09-19 trace: correctly catches calls 9/13/14, deleted temp
    script after).
  - **(d)** an advisory `substringOfPriorQuery` flag (unchanged in behavior from the original
    plan).
  - **(b)** the cross-module signal, escalating to a real, code-enforced hard refusal
    (`blocked: true`, no results) after firing twice for substring-related queries — new env
    vars `CAPABILITY_CROSS_MODULE_MARGIN` and `CAPABILITY_CROSS_MODULE_BLOCK_AFTER` (default 2,
    per review's literal "twice" decision).
  - Type-checked clean (`npx tsc --noEmit`) — zero new errors in either file.

## Phase 3 — real calibration (one real embedding call, approved)

Query `"OSKBuildingUnitInhabitantType"`, `moduleFilter="features"`:

| | distance |
|---|---|
| Best in-module (`features`) | 0.6343 (matches the 2026-09-19 trace exactly) |
| Best cross-module overall (`building`) | 0.5115 — gap 0.1228 |
| The actual doc-09 target fact itself (`core`) | 0.5489 — gap 0.0854 |

**Real, unplanned finding along the way**: the `building`-module result (fact_ref
`c16b07ded1487ab13b10f876753c4a304738ec79`) is a *second, distinct* fact also literally named
`OSKBuildingUnitInhabitantType`, different from the real doc-09 target
(`0634ae0ee6b3b8231c096522f7d38d1a847b4cc0`, `core`). A real symbol-ambiguity case, consistent
with this project's known cross-repo symbol-ambiguity theme (adr-008 discussion) — not
resolved or acted on here, just noted as found.

Set `CAPABILITY_CROSS_MODULE_MARGIN` default to **0.05** — comfortably below the smaller,
target-specific gap (0.0854), deliberately conservative given n=1. Documented in code
(`capability-fanout-prd-agent.ts`, `main()`) with the full real basis. Temp calibration script
deleted after use.

## Phase 4 — real full run (approved)

`FULL_DEBUG=true`, `skill.v3.md` + `template.v2.md`, `CAPABILITY_MAX_CAPABILITIES=5`, same
`1a-ownernonresident.txt` request. Output:
`output/agent-runs/prds/test/2026-09-20-001-1a-cross-module-fix-verification.{md,meta.json}`,
debug trace under `.../debug/2026-09-20-001-1a-cross-module-fix-verification/`.

### Headline real numbers

| | This run | Doc 07's comparable 5-capability run (Round 1) |
|---|---|---|
| Capabilities completed | 5 of 5 | 3 of 5 (2 crashed outright, pre-graceful-wrapup) |
| Duration | **6m 14s** | 23m 51s |
| Cost | **$0.5102** | $0.2055 (3 of 5 only) |
| Validators | Both passed, 839 real fact_ref(s) | Both passed, 139 real fact_ref(s) |

**Cost correction, stated plainly**: before this run I flagged an expected cost "comparable to
the ~$0.10-0.21 range measured across prior runs" — that estimate was wrong, drawn from smaller
or partial-completion runs. The real cost of a genuine 5-of-5 completion came in at **$0.5102**,
roughly 2.5x what I'd flagged. Correcting the record here rather than letting the earlier
estimate stand uncorrected.

### The mechanisms fired, live, for the first time

- **`betterMatchOutsideModule` fired 9 times** across the 5 capabilities — real, live
  confirmation the signal works outside calibration, not just on paper. Every capability
  chasing `"OSKBuildingUnitInhabitantType"` (`organization`, `features`, `building`, `user`)
  got flagged the real, measured `building` match (distance 0.5115, matching Phase 3's
  calibration number exactly) on its very first attempt.
- **The hard refusal never fired** (`blocked: 0` everywhere). Checked why, directly: each
  `betterMatchOutsideModule` firing this run was for a *different* underlying concept per
  capability (e.g. `features` got flagged once each for `"OSKBuildingUnitInhabitantType"`,
  `"owner"`, and `"tenant"` — three separate concepts, not three attempts at one). The
  escalation gate is scoped to substring-related repeats of the *same* concept, per its design
  — it correctly never triggered, rather than failing to trigger. Not yet observed live; the
  design remains unexercised end-to-end until a real run reproduces genuine same-concept
  repetition.
- **The exact-duplicate cache never got a chance to fire either** (`exactDuplicateOfPriorQuery: 0`
  everywhere) — no capability repeated any query verbatim this run at all. Already validated
  offline against the historical trace (doc 10's Phase 1 check); just not exercised live here.

### The real, positive, honestly-hedged headline finding

Every capability queried the literal string `"OSKBuildingUnitInhabitantType"` **exactly once**
this run — `organization`, `features`, `building`, `core`, `user` each show 1 occurrence, zero
repeats. The original 2026-09-19 case this whole investigation started from had `features`
querying that exact string **7 times** (lines 2, 9, 10, 11, 12, 13, 14 of that trace). This is
a sharp, real, directional match to what the fix targets — but **n=1**, and this run's model
sampling, corpus state, or simple variance could independently explain not repeating a query,
same honest caveat this project attaches to every single real run. Not proof of causation, a
real and consistent data point.

### The target fact: found, and cited

The real doc-09 target fact (`0634ae0ee6b3b8231c096522f7d38d1a847b4cc0`, `core`, type_alias
`OSKBuildingUnitInhabitantType`, `hosting/web-app/.../inhabitant-type.type.ts:12`) is **evidence
#35** in the final document — confirmed by matching the description string byte-for-byte
against `core`'s own raw tool-call trace (the rendered `.md` uses a readable
repo/module/path/symbol display, not the raw factRef, so this needed a direct cross-check, not
a simple grep). It's genuinely **cited**, not just gathered — `cite-35` anchors a real claim:
> "OSKBuildingUnitInhabitantType is a type alias representing the allowed inhabitant types,
> which currently include 'resident', 'owner', and 'tenant'."

**Honest attribution**: this citation is not itself direct evidence the cross-module fix
worked — `core` is the capability that structurally *owns* this fact, so its own
module-scoped `search_facts` would find it directly regardless of any cross-module signal.
This confirms capability-fanout's original Gap-B-closing mechanism (doc 07, Round 1) still
works, not that this session's specific fix moved the needle on it.

### No regression on the original Gap B test fact

`formControlName` (`angular_template_binding|features|.../create-organization-inhabitant.component.html|...|formControlName|#2`,
evidence #299) is present in the evidence list but **not cited** (no `cite-299` anchor) — same
"gathered, not cited" outcome as most prior baseline runs. Not a regression this fix caused;
this specific citation has only succeeded once across every real run this whole investigation
has produced (doc 07's Round 1, `skill.md`).

### Completion reliability: not solved by this fix, and not meant to be

4 of 5 capabilities (`organization`, `features`, `building`, `user`) still hit 21 turns
(`CAPABILITY_MAX_TURNS=20`, saved by the existing graceful-wrap-up fallback, not a crash); only
`core` finished within budget (20 turns exactly). Checked why, directly: their query traces
show genuinely broad, distinct real sub-question exploration (different services, components,
file names), not literal or near-literal repetition of one dead concept — the same
"genuinely broad module" pattern doc 07 already separately documented and left open as
unsolved. This fix targets query *repetition* on a *specific* concept; it was never expected to
fix a capability whose assigned module is real broad and needs more than 20 turns of genuinely
distinct exploration. Worth restating plainly rather than implying this run's still-high
turn-cap-hit rate is this fix's failure.

## Honest summary

- **Built and shipped, real-tested end-to-end**: (b)'s signal fires correctly and matches
  calibration exactly; (c)/(d) are implemented and offline-verified but weren't exercised live
  this run (no repeats occurred to catch); the hard-refusal escalation is implemented but
  remains genuinely unexercised end-to-end — no real run has yet reproduced the exact
  same-concept-twice pattern needed to trigger it.
- **The clearest real signal this fix is working**: zero literal repeats of the target
  identifier this run, vs. 7 in the original case — n=1, stated plainly, not proof.
- **Not solved, and out of scope**: the separate "genuinely broad module, needs more turns"
  completion problem (doc 07) — 4 of 5 capabilities still hit the turn cap this run, for
  real, legitimate exploration breadth, unrelated to this fix's target failure mode.
- **Real cost was materially higher than earlier flagged** ($0.51 vs. the ~$0.10-0.21 I stated
  before running) — corrected here, not glossed over.
- **n=1 throughout** — one calibration query, one full run. Real, honest evidence the fix
  behaves as designed; not a settled, statistically-confirmed result. A second real run on a
  different business request/identifier (still blocked on only one `.txt` request file
  existing) would be the natural next real test, not run here.

Doc 09's findings and doc 10's build plan are addressed by this build — see the top of each
for the pointer to this doc, per this project's mark-superseded-don't-rewrite discipline.

## Addendum, same day — real run with `GROUNDING_DOCS=true`

The Phase 4 run above did not set `GROUNDING_DOCS=true` (confirmed by absence of the
"Grounding docs enabled" log line) — matched the two comparable runs it was benchmarked
against, both of which also ran without it, so this wasn't a divergence from that comparison.
User asked directly afterward whether governance/persona grounding docs were included, then
asked for a second real run with them on. Ran it: same request/persona/template/fix code,
only `GROUNDING_DOCS=true` added. Output:
`output/agent-runs/prds/test/2026-09-20-002-1a-cross-module-fix-with-grounding-docs.{md,meta.json}`.

### Real cost/duration, both materially higher

| | Without grounding docs (main run) | With grounding docs |
|---|---|---|
| Duration | 6m 14s | **17m 22s** |
| Cost | $0.5102 | **$0.6726** |
| Input tokens | 295,885 | 418,002 (+41%) |

Consistent with the grounding docs (`Oskey Architecture.md` + `Oskey Personas and Authority
models.md`) being prepended in full to every one of the 5 capabilities' system prompts — real,
expected overhead, not a surprise given the mechanism.

### The escalation gate fired live, for the first time

Doc 11's main run above never triggered the hard refusal (`blocked: 0` everywhere) — this run,
**it fired 3 times** (once each in `features`, `organization`, `user`), and the
exact-duplicate cache fired live too (`features` and `core`, one hit each) — the first live
confirmation of both mechanisms end-to-end, not just calibration/offline-verified.

Traced `features`' actual block directly: query `"OSKBuildingUnitInhabitantType"` flagged
`betterMatchOutsideModule` (building, 0.5115) — 1st occurrence. Separately, query
`"ownerNonResident"` also independently flagged `betterMatchOutsideModule` (core, 0.7003) —
this is a *different* concept, not a repeat. Then query
`"OSKBuildingUnitInhabitantType ownerNonResident"` arrived — a compound phrase that, under the
pairwise substring-relatedness check, is related to *both* prior flagged queries (it literally
contains both as substrings) — pushing `flaggedRelatedCount` to 2 and triggering the block.
**Real, honest nuance found here, not anticipated in the build plan**: the design's
pairwise/non-transitive relatedness check caught a *combination* of two previously-flagged
single concepts merged into one compound query, not the "same phrase rephrased repeatedly"
pattern doc 09/10 was originally built around. Defensible — the compound query genuinely is
close to both flagged concepts — but a different shape of catch than expected, worth knowing
about rather than assuming the mechanism only ever fires the way it was designed to be
pictured.

**The model recovered cleanly after being blocked** — checked directly, not assumed:
`features` (which got blocked) went on to make more tool calls afterward and finished
*naturally* within budget (19 tool calls, 20 turns, `ranOutOfBudget: false`) — no sign of
confusion from the unfamiliar `blocked: true` response shape. `organization` and `user` (also
blocked once each) still needed the graceful wrap-up fallback, but for the same
genuinely-broad-module reason doc 07 already documented, not because the block itself caused
a problem — both continued making distinct, real tool calls after their block, same as before.

### Real, positive signal on the original Gap B citation

This run **cites** `angular_template_attribute|features|.../create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formControlName|#3`
(evidence #17) — the exact class of fact doc 07 named as its central "gathered but never cited"
finding, reproduced across every prior baseline run except one (Round 1, `skill.md`,
2026-09-13). The main Phase 4 run earlier today (no grounding docs) did **not** cite this same
kind of fact. A real, controlled, same-day, same-code, same-persona comparison — the only
variable changed was `GROUNDING_DOCS`. **n=1, stated plainly** — one run each way, real but not
statistically settled — but a genuinely notable data point given how consistently this
citation has failed across this whole investigation's history.

### Real, positive signal the grounding docs are genuinely being used, not just present

"Mon Foyer" (the specific real business rule the persona doc states — Owner Non Resident's
exclusion from Mon Foyer/intercom routing) appears **8 times** in the final document,
including inside `[NEEDS CLARIFICATION: ...]` markers that explicitly reference "the authority
models" by name (e.g. *"should ownerNonResident users be excluded from intercom routing and
'Mon Foyer' features as described in the authority models?"*). This is real, direct evidence
the grounding docs' content is still being meaningfully attended to deep into a long,
multi-capability conversation — the exact open question the code's own comment on
`groundingDocs` placement flagged as unresolved ("does NOT resolve whether the model still
meaningfully attends to this content... that's exactly what this test run exists to check").
Both mandatory validators still passed (`checkFabrication`/`checkTemplateConformance`) — the
grounding content is shaping judgment and honest-gap framing, not leaking into fabricated,
unverified citations.

### Honest summary of the addendum

- Real, materially higher cost (+32%) and duration (+178%) — a genuine tradeoff, not free.
- Two mechanisms (`blocked` escalation, exact-dup cache) fired live for the first time, with
  clean model recovery after the block.
- Two independent, positive, same-day, controlled signals in favor of `GROUNDING_DOCS=true`:
  the historically-hard formControlName citation succeeded, and the persona's specific
  business rule visibly shaped the output.
- **n=1 on both sides of this comparison** — real, but a single paired run, not a trend. Not a
  recommendation to flip `GROUNDING_DOCS` on by default from this alone; a real, concrete
  reason to test it again before deciding either way.

## Addendum 2, same day — a different, broader business request, real bug found live

User asked to run the same config again (`GROUNDING_DOCS=true`, same persona/template/fix
code) against a different, genuinely new business request:
`mcp-server/test-questions/1b-adding-a-owner-non-resident-type.md` — a real, more detailed,
multi-platform PRD request (web portal, cloud backend, iOS, Android Intercom, node-iot) rather
than the short one-liner `1a-ownernonresident.txt` every prior run in this whole investigation
used. This is the first real test of whether this fix generalizes beyond the single request
every doc 09/10/11 finding above was based on.

A free-ish routing preview (`routeCapabilities()` directly, one small embedding call) run
first: despite pulling facts from 5 repos (`firebase-oskey-dev`, `angular-app-oskey-io`,
`ios-oskey-dev`, `swift-cloud-kit-oskey-dev`, `android-intercom-oskey-io`), the top-5
*modules* routed to were identical to every prior run (`building`, `features`, `organization`,
`user`, `core`) — flagged before running so the real cost estimate wasn't a blind guess.

Output: `output/agent-runs/prds/test/2026-09-20-003-1b-owner-non-resident-multiplatform.{md,meta.json}`.

### Real cost/duration: notably higher again

| | 1a, no grounding docs | 1a, grounding docs | **1b, grounding docs** |
|---|---|---|---|
| Duration | 6m 14s | 17m 22s | **33m 13s** |
| Cost | $0.5102 | $0.6726 | **$1.1989** |
| Input tokens | 295,885 | 418,002 | **751,643** |

The 1b business request text itself is only ~5x longer than 1a's (2,035 vs. 410 bytes) — not
enough on its own to explain input tokens nearly doubling again. Not fully diagnosed here
(would need a real per-turn token breakdown to confirm), but the most likely real driver:
`walk_cluster`/`get_graph_neighbors` results are probably larger this run, since the broader
multi-repo request surfaces more real cross-repo edges (iOS/Swift/Android facts now genuinely
in the reachable graph) — each result accumulates into every subsequent turn's context. Stated
as the likely explanation, not confirmed by direct measurement.

### Real bug found live: the exact-dup cache can silently bypass the escalation gate

Traced `user`'s real query sequence directly (not inferred):

1. `"OSKBuildingUnitInhabitantType"` — executed, flagged `betterMatchOutsideModule` (building).
   1st occurrence for this concept cluster.
2. `"type OSKBuildingUnitInhabitantType"` — executed, also flagged (core, 0.4880). 2nd
   occurrence — `flaggedRelatedCount` now at the `crossModuleBlockAfter` threshold (2).
3. `"OSKBuildingUnitInhabitantType"` (again, verbatim, identical to #1) — **served from the
   exact-duplicate cache**, not blocked.
4. `"OSKBuildingUnitInhabitantType"` (again) — cache hit again.
5. `"OSKBuildingUnitInhabitantType"` (again) — cache hit again.
6. `"OSKBuildingUnitInhabitantType"` (again) — cache hit again.

Four more attempts at the exact same dead-end query, all served free from cache, **none ever
refused** — even though the escalation threshold had already been crossed by two genuinely
different phrasings before the repeats started. Root cause, checked directly against the
shipped code (`capability-fanout-prd-agent.ts`, `searchFacts` handler): the exact-duplicate
cache lookup runs *first*, before the escalation gate's `flaggedRelatedCount` check — so an
exact repeat of an already-answered query always takes the cache-hit branch and never reaches
the block logic, regardless of how many times that same underlying concept has already been
flagged. (c) and (b)'s escalation were designed together as one shared structure, per the
review that shaped doc 10's Phase 1/2 — but this specific interaction (a cache hit
short-circuiting *past* an already-crossed block threshold) wasn't anticipated in that design
or caught by the Phase 1 offline replay (which only tested relatedness/dedup mechanics against
the original, non-repeating-after-flagged 2026-09-19 trace).

**Real, honest impact assessment**: in this specific run, `user` still finished within budget
(19 turns, `ranOutOfBudget: false`) — the wasted turns didn't cause a failure this time. But
the gate's whole purpose is protecting the turn budget, not just Vertex spend, and this gap
means a capability that keeps asking the exact same already-flagged question indefinitely
would never be refused, just get free-but-still-turn-consuming answers every time — in a
run with less slack, this could plausibly be the exact mechanism that exhausts a budget the
fix was built to protect. **Not fixed here** — found live during real testing, not designed
around in advance; a real decision point on whether/how to fix (e.g., an exact-duplicate whose
underlying concept has already crossed the block threshold should replay the *blocked* outcome
instead of the cached *executed* one) before flagging it as resolved.

### Citations: consistent with the grounding-docs run above

Both previously-hard-to-hit facts are cited again, real and independently confirmed: the
target `core` type alias (evidence #35, `cite-34`-`38`) and the `formControlName` Gap B fact
(evidence #12, `cite-12`). "Mon Foyer" appears 15 times — this business request names the
Mon Foyer exclusion directly as a known constraint, so this isn't purely attributable to
grounding docs this time the way the prior run's citation was (that request didn't name Mon
Foyer at all).

### Honest summary of Addendum 2

- **Real bug found, live, not anticipated**: exact-dup caching can bypass an already-crossed
  escalation threshold. Real impact this run was limited (capability still finished in
  budget), but the failure mode is real and not yet fixed.
- Cost/duration keep climbing with request complexity — $1.20 and 33 minutes for this one,
  real numbers, not estimates.
- Citation behavior (target fact + Gap B fact both cited) held up on a genuinely different,
  broader, multi-platform business request — the first real test of this fix (and of
  capability-fanout's citation behavior generally) beyond the single request every prior doc
  in this thread was based on.
