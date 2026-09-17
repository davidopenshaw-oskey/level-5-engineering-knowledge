# Prompt 9 — real test results, Q1a case, 2026-09-13

Real, live runs (real Vertex AI spend, user-approved for the "full 5 capabilities" scope). Design doc: `08-prompt-9-capability-fanout-merge-design-2026-09-11.md`. Business request: `mcp-server/gold/business-requests/1a-ownernonresident.txt` (exact wording from `mcp-server/gold/evals/1a-ownernonresident.eval.json`).

## Run 1: fresh one-hit baseline — completed, real numbers

`PERSONA_FILE=mcp-server/skills/prd/skill.md`, `TEMPLATE_FILE=mcp-server/skills/prd/template.md` (today's plain, canonical pair — not the `v2` section-grouping experiment). Output: `output/agent-runs/prds/test/2026-09-13-001-1a-ownernonresident-onehit-baseline-prompt9.{md,meta.json}`.

| | Real result |
|---|---|
| Tool calls | 20 (15 `search_facts`, 4 `walk_cluster`, 1 `get_graph_neighbors`) |
| Turns | 21 of 100 |
| Duration | 6m 54s |
| Cost | $0.1983 |
| Validators | Both passed, 157 real fact_id(s) seen, 0 fabrications |
| Angular UI-binding fact (`angular_template_attribute\|...\|formControlName`, evidence #141) | **Gathered, not cited** — real, fresh reproduction of the exact Gap B finding from `facts-serving-strategy/15-...md` (2026-09-05) and the `v2` run (2026-09-10). The Technical Proposal cites a *different*, related fact about the same component (`getInhabitantTypeLabel`, #4) instead. |

**Real, honest note on cost/duration drift**: $0.1983 / 6m54s is roughly double the 2026-09-07 baseline ($0.0873/~1m) and the 2026-09-10 `v2` run ($0.0886/2m32s) on the identical query. Plausible real causes, not distinguished by this one run: corpus growth since 2026-09-05 (15,400 real intra-repo edges added 2026-09-11, more `search_facts`/`walk_cluster` evidence now reachable), and real 5 req/min Vertex quota backoff (this project's own confirmed, permanent constraint) adding wall-clock time without necessarily adding cost. Flagged, not resolved here — matches this project's own prior finding that run-to-run variance on this exact case is real and already documented (`mcp-direction/36-...md`).

## Run 2: capability-fanout, 5 capabilities — real, honest failure, not completed

Routing pass (free, Postgres-only, confirmed live before any LLM spend):

| Module | Facts in top-150 pool | Best vector distance |
|---|---|---|
| `features` | 53 | 0.7170 |
| `organization` | 26 | 0.7161 |
| `building` | 18 | 0.7237 |
| `user` | 13 | 0.7300 |
| `core` | 6 | 0.7269 |

(Real, honest note: `unit_management` also had 18 facts in the pool — tied with `building` — but didn't make the top-5-by-best-distance cut. A real, visible trade-off of ranking capabilities by best vector distance rather than by fact count; not a bug, a documented design choice, `08-...md` §2.)

**The `organization` capability call (processed first, per the strength ordering) never completed.** It made 20 real tool calls — repeatedly re-querying near-duplicate phrasings of `OSKBuildingUnitInhabitantType` / `owner` / `tenant` (`"OSKBuildingUnitInhabitantType"`, `"type OSKBuildingUnitInhabitantType"`, `"OSKBuildingUnitInhabitantType ="`, `"OSKBuildingUnitInhabitantType"` again at a higher limit) — then hit the code-enforced `maxTurns=20` backstop and aborted with `GenkitError: ABORTED: Exceeded maximum tool call iterations (20)`, before producing any structured output. The whole run crashed at that point (uncaught past the capability loop) — **no output `.md`/`.meta.json` was written**, and no further capabilities (`features`, `building`, `user`, `core`) ran.

**Real cost of the failed call is honestly unrecoverable from this run.** The crash happened before this script's own cost-computation step runs; the thrown error's `detail.response.usage` was truncated by Node's default console object-inspection depth in the captured log, not a real number this doc can report. Not guessed at here rather than presented with false precision — treat it as a real, non-zero, unrecovered cost roughly on the same order as the baseline's 20-tool-call run ($0.1983), since turn/tool-call counts are comparable, but this is an honest estimate, not a measured figure.

## Root cause, found directly from the real tool-call trace, not guessed

`OSKBuildingUnitInhabitantType` (the real type alias at the center of this whole case) lives in the `building` and `core` modules, not `organization`. The `organization` capability's `search_facts` tool is correctly scoped to `module='organization'` only (per the design) — so every rephrasing of the same query returned the same weak, off-target `organization`-module results, and the model kept trying new phrasings rather than concluding the concept simply isn't in its assigned module and moving on. **This is a real, previously-undocumented failure mode specific to module-scoped search, not present in the one-hit baseline** (where `search_facts` sees the whole corpus, so a query for `OSKBuildingUnitInhabitantType` succeeds immediately regardless of which "capability" a human would file it under).

The capability contract (`renderCapabilityContract`, `capability-fanout-prd-agent.ts`) never told the model this could happen, and — a real, distinct gap from the routing/merge design itself — never gave it the bounded-search-effort instruction the low-freedom experiment (`mcp-direction/40-...md`, this task's own required background reading #2) already proved works for exactly this class of runaway-search problem. That experiment's design had two layers: an *instructed* budget ("8 tool calls, self-counted, stop at 6") plus a *code-enforced* backstop (`MAX_TURNS=10`). This build only had the code-enforced backstop (`CAPABILITY_MAX_TURNS=20`) — the instructed half was missing, and the backstop alone doesn't prevent the waste, it only bounds it after the fact.

## Fix applied, not yet re-tested live

`renderCapabilityContract` now explicitly tells each capability call: (1) `search_facts` is scoped to this module only, and a concept that doesn't surface within a couple of differently-worded tries after real, targeted search likely belongs to a *different* capability call, not this one — stop searching for it and move on rather than exhausting the budget; (2) a real, numeric self-counted budget (6 `search_facts` calls before deciding to wrap up), mirroring the low-freedom experiment's own proven wording. `CAPABILITY_MAX_TURNS` left at 20 as the unchanged code-enforced backstop (not lowered) — the real fix is stopping *before* needing the backstop, not making the backstop tighter, since the eval case `1a-ownernonresident.eval.json` also explicitly requires the *plain* one-hit baseline not regress on tool-call budget when it doesn't need to (a legitimately broad capability should still be allowed to use real turns if its own evidence genuinely warrants it).

## Second real hardening applied, same session

A single capability exceeding its turn budget used to crash the *entire* run in `main()`, discarding every other already-completed (and already-paid-for) capability's evidence along with it — a real, separate waste risk from the root cause above, found while fixing it. `main()`'s per-capability loop now catches a single capability's failure, logs it plainly (`[capability FAILED, skipped]`), records it in the run's own `capabilityFanout.failedCapabilities` (never hidden), and continues with the rest — mirroring `withToolErrorTrapping`'s existing "recoverable failure surfaces, doesn't silently disappear, doesn't need to crash everything" discipline. The run now only fails closed entirely if *every* capability fails.

## Run 2, re-run with both fixes applied — real, decisive result on the citation question, real, honest partial failure on completion rate

Same business request, same persona, `CAPABILITY_MAX_CAPABILITIES=5` (user-approved, real spend). Output: `output/agent-runs/prds/test/2026-09-13-002-1a-ownernonresident-capability-fanout-prompt9-v2.{md,meta.json}`.

**2 of 5 capabilities still failed the same way** — `features` and `building`, the two modules that structurally own the case's core evidence, both hit `ABORTED: Exceeded maximum tool call iterations (20)` again. The bounded-search-effort instruction did not prevent this on either. Looking at `building`'s real tool-call trace (not guessed): it wasn't looping on meaningless punctuation variants — it pursued genuinely different real sub-concepts (unit-level, intercom-level, invitation-level, controller-level `inhabitantType` touchpoints), a legitimately broad amount of real exploration for a module with that much internal surface area, similar in scale to the *entire* one-hit baseline's own 20-tool-call budget, just concentrated into one capability. The instructed budget is evidently not strong enough on its own against a module that's genuinely this wide — an open item, not resolved by this session (see "What's still open" below).

**The second real hardening fix worked exactly as designed.** `organization` (succeeded first, 14 tool calls/15 turns) and `core`/`user` (ran after the two failures, 16 and 17 tool calls respectively) all completed and contributed real, merged content — the run did not crash, and real spend on those three capabilities was not wasted.

**The real, decisive, positive finding**: `organization`'s own capability call — via its unfiltered `walk_cluster`/`get_graph_neighbors` calls, exactly the mechanism `08-...md` §3 predicted — reached the exact same real fact_id as every prior baseline (`angular_template_attribute|features|.../create-organization-inhabitant.component.html|OSKCreateOrganizationInhabitantComponent|formControlName|#3`), **and this time it was cited**:

> Update the frontend dropdown in `OSKCreateOrganizationInhabitantComponent` to include the new `'ownerNonResident'` option, allowing Property Managers to select it when creating or inviting inhabitants. (see #6)

This is the first time, across every real run this whole investigation has produced (2026-09-05's original pipeline run, the 2026-09-10 `v2` sketch, and this same session's own fresh one-hit baseline above), that this specific fact has been cited rather than merely gathered. Gap B, for this specific real case, is closed here — reached indirectly, through a capability (`organization`) whose own module doesn't own the fact, via real graph traversal from its own evidence, not through the `features` capability that would have owned it directly (which failed to complete). A real, honest nuance: this closes the gap *despite* the two most obviously-relevant capabilities failing, not because of them succeeding — worth stating plainly rather than implying the mechanism worked the way it was expected to on the way in.

## Direct comparison, same case, same session, same day

| | One-hit baseline (Run 1) | Capability-fanout (Run 2, 3 of 5 capabilities completed) |
|---|---|---|
| Tool calls | 20 (15 search, 4 walk, 1 neighbor) | 47 (26 search, 17 walk, 4 neighbor) — summed across 3 completed capabilities; 2 more were attempted and failed, not counted here |
| Turns | 21 | 50 (15 + 17 + 18 across the 3 completed capabilities) |
| Duration | 6m 54s | 23m 51s |
| Cost | $0.1983 | $0.2055 |
| Validators | Both passed, 157 real fact_id(s), 0 fabrications | Both passed, 139 real fact_id(s), 0 fabrications |
| Angular UI-binding fact cited? | **No** — gathered (evidence #141), never cited | **Yes** — gathered and cited (evidence #6) |
| Completion | 1 of 1 calls completed | 3 of 5 capability calls completed; 2 failed (logged, not silently lost) |

**Real, honest reading**: cost is roughly a wash ($0.2055 vs. $0.1983 — the fanout run's *3 successful* capability calls cost about the same as the baseline's *1* full-corpus call). Wall-clock time is worse (23m51s vs. 6m54s), driven by real 5 req/min Vertex quota backoff compounding across more sequential calls plus two full-budget failed attempts before their own abort. Tool-call/turn volume roughly doubled or more — the opposite of the low-freedom experiment's own result on a single-section, single-capability call (6 tool calls vs. 26+) — because this design still asks each capability to cover all 4 template headings, not one narrow section; the low-freedom experiment's real efficiency gain came from narrowing by *section*, which `08-...md` §10 (background reading) already named as a distinct, still-uncombined axis from capability-fanout.

## What's still open, real and unresolved

- **The 2-of-5 capability failure rate is a real, unresolved reliability problem**, not a one-off. The instructed bounded-search-effort fix (§ above) measurably didn't work against a module with genuinely large internal surface area (`building`) or against `features` (not inspected as closely, same failure signature). A stronger fix — e.g., a real, code-enforced per-capability tool-call cap well below `maxTurns` that forces early output rather than relying on the model to self-regulate, or combining capability-fanout with the still-separate by-section decomposition axis so no single call ever needs to cover all 4 headings for a genuinely broad module — is a real, concrete next step, not implemented or tested here.
- **n=1 on the positive citation result**, same honest caveat this project's own prior work always attaches to a single run (`mcp-direction/40-...md`'s own "don't over-generalize from one run" section). A second real run could land differently, especially given real run-to-run variance already documented on this exact case (`mcp-direction/36-...md`).
- **Whether the positive result generalizes to a case where the target fact's *own* capability doesn't fail** is untested — this run's positive result came from a capability other than the one that structurally owns the fact. Worth a case where the "right" capability actually completes, to see whether direct ownership does even better, or whether cross-module graph reach is doing most of the real work regardless of which capability survives.

## Real gap found 2026-09-13, reviewing this doc after the fact

`RunMeta`/`meta.json` records `persona`/`personaPath` for a run but **never persists which `TEMPLATE_FILE` was actually used** — confirmed directly, no `templatePath` field exists anywhere in the schema. Confirming "which template did this specific run use" today requires trusting the invocation command, not the run's own recorded metadata — a real, small completeness gap worth fixing (add `templatePath` to `RunMeta` the same way `personaPath` already exists) before these skill/template comparisons keep happening across more runs.

## Round 2, same day: skill.v3.md / template.v2.md — real, user-requested re-run

The user asked to redo the same comparison against `mcp-server/skills/prd/skill.v3.md` + `template.v2.md` — a real, actively-developed persona (found in this same folder, written by a concurrent peer session; not built by this thread) that adds, on top of `v2`'s section-grouping: a hard, self-counted tool-call budget (rule 3: "the exact number is stated elsewhere in this conversation... if none is stated, treat 20 as the default"), a 70%-of-budget stop-and-write rule (rule 4), a per-sub-question retry cap (rule 5), and an `[NEEDS CLARIFICATION: ...]` honesty marker. **Run as-is, no code changes** (the user's own explicit choice) — no script currently states the real configured `MAX_TURNS`/`CAPABILITY_MAX_TURNS` number in the system prompt context, so both runs fell back to the persona's own stated default of 20.

### One-hit baseline, v3

`output/agent-runs/prds/test/2026-09-13-003-1a-ownernonresident-onehit-v3-prompt9.{md,meta.json}`. Real result: **24 tool calls, 25 turns, 1m51s, $0.1080** — cheaper and faster than the v1 baseline run earlier this same day ($0.1983/6m54s), despite more tool calls; no `[NEEDS CLARIFICATION]` fired (the real MAX_TURNS is 100, so the persona's assumed-20 default budget/70% stop rule never meaningfully bound this run in practice — turns=25 already exceeds the assumed default of 20 outright, suggesting the model didn't rigidly self-enforce a hard stop at the stated fallback either). **The core finding repeats exactly**: `angular_template_attribute|...|formControlName|#3` (evidence #185) is gathered again, and again **not cited** — the Technical Proposal cites `getInhabitantTypeLabel` (#7) and a second, related fact (#8) instead. This is the fourth independent one-hit run across this whole investigation (2026-09-05 pipeline run, 2026-09-10 `v2`, this session's fresh `v1`, now `v3`) to reproduce the identical Gap B miss — real, converging evidence that this is not a persona-wording problem, strengthening the case for a structurally different fix (capability-fanout) over further prompt iteration on the one-hit shape.

### Capability-fanout, v3 — real, different, and important result

`CAPABILITY_MAX_CAPABILITIES=5`, same routing pool as before (`organization`/`features`/`building`/`core`/`user`). **All 5 of 5 capabilities completed** this time — a real, direct confirmation that `skill.v3.md`'s bounded-search-effort rules fix the exact reliability problem found and left open in Round 1 (`features` and `building` both failed the turn cap twice with `skill.md`; both completed cleanly here, 15 and 11 tool calls respectively).

**CORRECTION, 2026-09-17 — the paragraph below this box was wrong. Not a fabrication. A real validator bug, found when the user directly challenged the claim and it was checked against live Postgres instead of trusted.** `createIntercomDisplayName` is a real, indexed `service_method` on `OSKBuildingIntercomService` — confirmed directly: `SELECT fact_id FROM facts WHERE fact_id LIKE '%createIntercomDisplayName%'` returns 8 real rows, including the exact call expression the run cited. The real fact_id, dumped byte-for-byte (`od -c`), contains **literal embedded newlines and indentation** — the real source method chain spans multiple lines and `ts-morph` captured it verbatim:
```
...inhabitants
                     .filter((inhabitant) => inhabitant.inhabitantType === 'tenant')
                     .map|createIntercomDisplayName|(inhabitant) => inhabitant.lastName.toUpperCase()|#1
```
What the model cited was the identical content with that internal whitespace collapsed onto one line — common, expected behavior for an LLM writing a multi-line string into a JSON field, not an invention. `checkFabrication`'s exact-string match (`validators.ts`) has no tolerance for that, so it rejected a real, correct citation as fabricated. **This is a real bug in shared, unchanged infrastructure** (`validators.ts`, used by both `atomic-prd-agent.ts` and `capability-fanout-prd-agent.ts`) — not fixed as part of this task, flagged here for whoever picks it up next: `checkFabrication` should compare real vs. cited fact_ids on some whitespace-normalized basis (e.g. collapse runs of whitespace to one space on both sides before comparing) rather than raw exact-string equality, since a real fact_id can legitimately contain source-derived newlines a model has no reliable way to reproduce verbatim in JSON. The risk direction matters: this bug produces false *rejections* of genuine citations, not false *acceptances* of invented ones — a real reliability cost, not a real fabrication-detection gap.

**Original claim, kept for the record per this project's own "mark superseded, don't delete" discipline — wrong, do not trust the "fabrication" framing below:**

~~The `building` capability's own tool-call trace shows it walked a real method, `_getIntercomInhabitantType` (`building_intercom_inhabitant.service.ts`), but its final citation invented a fully-detailed, plausible-looking sibling method that was never returned by any tool call this run... Not a transcription slip of a real fact — a genuinely fabricated call expression, syntactically plausible, attached to a made-up method name (`createIntercomDisplayName`) that doesn't appear anywhere in this run's real tool results.~~ **Wrong — see correction box above.** What did stay true: `checkFabrication` really did throw, the run really did produce no output, and real cost for this run is still honestly unrecoverable the same way as Round 1's first crash (the failure happens before this script's own cost-computation step runs).

**Real, honest reading, corrected**: this run's real story isn't `skill.v3.md` trading a completion problem for a fabrication problem — it's `skill.v3.md` achieving a clean 5-of-5 completion (the real, positive result this round was testing for) that then hit a **pre-existing, previously-undiscovered validator bug**, unrelated to which persona or template was in use. The `capability-fanout-prd-agent.ts` build is the first time this project has generated enough real, distinct multi-line fact_ids under citation pressure to surface it — plausibly a real, silent risk for the one-hit agent too, just not yet hit by a citation landing on a multi-line fact_id in any of this project's prior real runs.

### Updated real spend total, this session

$0.1983 (Round 1 baseline) + $0.2055 (Round 1 fanout, 3/5 completed) + $0.1080 (Round 2 baseline, v3) + an honestly-unmeasured amount from *two* separate uncosted crashes (Round 1's first fanout attempt, pre-resilience-fix; Round 2's fanout attempt, blocked by the `checkFabrication` false-positive above) — **$0.5118 measured**, plus two real, non-zero, unrecovered amounts.

## Honest status

- **The design's core mechanism is validated on one real, positive case**: module-scoped `search_facts` + unfiltered graph traversal + capability-fanout + merge closed the real, previously-documented Gap B citation miss on Q1a, via Round 1's `skill.md` run (cited through `organization`). Round 2's `skill.v3.md` run never reached a citable final document — not because of a real fabrication (corrected above), but because it hit the `checkFabrication` whitespace bug after a clean 5-of-5 capability completion.
- **The Gap B miss itself is now confirmed on four independent one-hit baseline runs** (2026-09-05, 2026-09-10 `v2`, this session's fresh `v1`, this session's `v3`) — strong, converging evidence it's structural (one big call diluting evidence), not a persona-wording problem persona iteration alone will fix.
- **Completion reliability (Round 1's timeout failures) and the `checkFabrication` whitespace bug (Round 2) are two separate, real, unresolved problems** — not, as first reported, two different failure modes of the same underlying flakiness. The timeout problem is about search behavior under module scoping; the validator bug is a pre-existing, previously-undiscovered exact-match brittleness against real multi-line fact_ids, unrelated to persona or template choice, and a real candidate for its own fix (normalize whitespace before comparing, both sides) before this design is dependable enough to run unattended.
- **A real, direct positive signal survived the correction**: `skill.v3.md` genuinely fixed Round 1's completion problem (5 of 5 capabilities, vs. 3 of 5) — that result stands.
- **Total real spend this session: $0.5118 measured**, plus two separate real, non-zero, honestly-unmeasured amounts lost to two different uncosted crashes (Round 1's first fanout attempt, pre-resilience-fix; Round 2's fanout attempt, blocked by the validator bug before cost computation).
