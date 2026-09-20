# Build plan: cross-module signal (b) + exact-dup/substring query checks (c/d)

**Built and run 2026-09-20, same day — see [11-build-completion-duplicate-search-queries-fix-2026-09-20.md](11-build-completion-duplicate-search-queries-fix-2026-09-20.md)
for what was actually shipped and the real Phase 3/4 results.** This plan kept as-is below,
not rewritten, per this project's mark-superseded-don't-rewrite discipline.

Follow-up to [09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md](09-findings-duplicate-search-queries-capability-fanout-2026-09-20.md),
which established the root cause (module-scoped `search_facts` structurally can't find a
concept that lives in a different module) and confirmed all three candidate fixes fit the
`alreadyRetrieved` precedent (code computes an objective per-run fact, the tool description
explains it, the model's own persona judgment decides what to do). This doc is the decide-stage
build plan for (b), (c), and (d) together. **Nothing in this doc has been built or executed —
planning only, per explicit instruction.** Scope stays inside `capability-fanout-prd-agent.ts`
and its own tool definitions, with one flagged, additive exception in `search.ts` (Phase 2,
explained there) — `atomic-prd-agent.ts` is not touched.

**Revised 2026-09-20, same day, after review.** Review found the original technical design
solid (all line numbers/claims verified against the real file) but flagged two real gaps
against what was actually decided in discussion before this plan was first written. Both are
folded into Phase 1 and Phase 2 below — the two phases are now designed together, since the
review specifically called out that they share one structure (`triedQueries`) rather than
needing separate trackers. Phase 0/3/4/5 and the standing rules are unchanged in substance;
numbering below restarts at 1 within each phase (rather than running continuously across the
whole doc as the first version did) purely because Phase 1/2's item counts changed — not a
content change to those other phases.

## A note on the "backoff value" instruction

Read as: expose the margin/threshold that decides "how much better must another module's
match be before it counts as a real cross-module signal" as an overridable parameter, the
same `Number(process.env.<NAME> ?? default)` convention `capability-fanout-prd-agent.ts`
already uses for `CAPABILITY_ROUTING_LIMIT`, `CAPABILITY_MIN_FACTS`, `CAPABILITY_MAX_CAPABILITIES`,
and `CAPABILITY_MAX_TURNS` (all defined together in `main()`, lines 520-523). If "backoff
value" meant something else (e.g. a retry/backoff delay), flag that — this plan doesn't
introduce a new rate-limited call for (b) at all (see Phase 2), so there's nothing to back off
from on that reading. **Note this is now one of two new configurable parameters**, not the
only one — Phase 2 below adds a second, `CAPABILITY_CROSS_MODULE_BLOCK_AFTER`, for the
escalation gap raised in review (a repetition count, not a distance value).

## Decisions made before this plan

1. **(c)/(d) touch only `makeCapabilityTools`'s `searchFacts` tool** (`capability-fanout-prd-agent.ts:108-127`)
   — pure in-memory string comparison against a new per-capability array, same lifecycle as
   the existing `seenFactRefs` Set (fresh per `runCapability` call, passed in the same way).
   No DB, no LLM, no new spend.
2. **(b) needs one small, additive change to `search.ts`** — flagged explicitly as the one
   exception to "stay inside capability-fanout-prd-agent.ts", because `embedSearchQuery()` is
   only called from inside `search()` today, and computing a second, cross-module distance
   for the *same* embedding is impossible without either (i) exposing embedding reuse from
   `search.ts`, or (ii) calling `search()` a second time and paying for a second real Vertex
   embedding call. (ii) is rejected — silently doubling real API spend and quota pressure
   (this project's confirmed 5 req/min constraint) on every single `search_facts` call, in
   every capability, in every run, forever, is a real and disproportionate cost for a
   diagnostic signal. (i) is the smaller, additive, opt-in change: existing callers
   (`atomic-prd-agent.ts`'s tools, `routeCapabilities()`'s unfiltered Step 1 call) get a new
   optional parameter they simply don't pass, so their behavior is provably unchanged.
3. **The margin/threshold default is not guessed** — Phase 3 below calibrates it against the
   real, known 2026-09-19 case before picking a number, same discipline as `search.ts`'s own
   `VECTOR_DISTANCE_CONFIDENCE_THRESHOLD` (calibrated 2026-09-02 against real measured cases,
   not designed in the abstract).
4. **Revised in review, 2026-09-20 — not every new signal stays soft-only:**
   - **(c) exact-duplicate detection is a hard, deterministic shortcut**, not just an advisory
     flag computed after the fact. A genuinely identical `(query, limit)` pair is guaranteed
     to produce identical results, so it's served from an in-memory cache instead of
     re-running the real embedding call and Postgres query. This isn't "blocking" the model —
     it still gets a real, complete result — it's skipping guaranteed-redundant real work, and
     it directly reduces pressure on this project's confirmed 5 req/min embedding quota (the
     central cost concern already driving (b)'s design below).
   - **(b)'s cross-module signal escalates from advisory to a real, code-enforced hard
     refusal** after it fires twice for queries that are substring-related to each other (the
     same underlying concept, rephrased). `alreadyRetrieved` (soft signal) paired with
     `maxTurns` (hard, code-enforced stop) is the existing precedent for exactly this shape in
     this same file — a soft signal alone has already not reliably stopped the model twice
     (2026-09-13's original case, and the 2026-09-19 run doc 09 analyzed), so (b) gets its own
     hard backstop rather than relying on the model's own judgment indefinitely.
   - **(d)'s substring flag stays advisory-only, unchanged** — genuine ambiguity there (two
     substring-related queries aren't guaranteed to be a dead end the way an exact duplicate
     is), so it isn't given the same hard treatment as (c).

## Phase 0 — Baseline (no new work; already captured)

Doc 09 already is the real "before" baseline: the literal 14-call trace, which of those calls
are exact duplicates or substrings, and the confirmed absence of the target fact_ref/`module="core"`
anywhere in the `features` trace. No new snapshot needed before code changes — Phase 4's
regression check diffs against doc 09's numbers directly.

## Phase 1 — Shared `triedQueries` structure, (c)'s hard cache shortcut, (d)'s advisory flag

Designed together with Phase 2's escalation gate (review's explicit instruction), not as two
independent additions that happen to sit in the same function — both live in
`makeCapabilityTools()` (`capability-fanout-prd-agent.ts:108-173`).

1. Add new parameters to `makeCapabilityTools`:
   `makeCapabilityTools(moduleFilter, seenFactRefs, debugDir, triedQueries, crossModuleMargin, crossModuleBlockAfter)`
   — `triedQueries` is created fresh in `runCapability()` alongside `seenFactRefs` (same call
   site, same per-capability lifetime, line ~285-286); the two `crossModule*` values are
   threaded down from `main()` (Phase 2, step 5 below).
2. `triedQueries` is one shared structure carrying everything both (c)'s cache and (b)'s
   escalation counter need — this is the concrete answer to "design together, not as a fourth
   tracker":
   ```ts
   type TriedQueryOutcome =
     | { kind: "executed"; response: SearchResponse; crossModuleFlagged: boolean }
     | { kind: "blocked" };
   interface TriedQuery { query: string; limit?: number; outcome: TriedQueryOutcome }
   ```
3. Inside `searchFacts`'s handler (line 115-126), **first, before anything else** (before any
   real `search()` call): look for an exact `(query, limit)` match already in `triedQueries`.
   - **Found, `outcome.kind === "executed"`**: return the cached response directly — skip
     `search()`'s real embedding call and Postgres query entirely. Recompute only
     `alreadyRetrieved` per result against the current `seenFactRefs` (cheap, in-memory;
     correctly comes back `true` for every row now, since the first execution already added
     them to `seenFactRefs`). Force `exactDuplicateOfPriorQuery: true` and
     `substringOfPriorQuery: true` (trivially true for identical text) on the object returned;
     keep the cached `betterMatchOutsideModule` value verbatim (deterministic for the same
     real query and module, safe to reuse without recomputing).
   - **Found, `outcome.kind === "blocked"`**: replay the same hard-refusal response (Phase 2)
     directly — no new relatedness computation needed. This is what makes an exact repeat of
     an *already-blocked* query free too, not just a repeat of a successful one.
   - **Not found**: continue to step 4.
4. For a genuinely new `(query, limit)`, compute substring-relatedness against every prior
   entry (either direction, case-insensitive):
   ```ts
   const isRelated = (a: string, b: string) => {
     const x = a.toLowerCase(), y = b.toLowerCase();
     return x !== y && (x.includes(y) || y.includes(x));
   };
   const relatedPriorEntries = triedQueries.filter(t => isRelated(query, t.query));
   const substringOfPriorQuery = relatedPriorEntries.length > 0;
   ```
   This is the exact same input Phase 2's block-after-N gate needs — computed once here, used
   by both (d)'s flag and (b)'s escalation count.
5. No change needed to `debugTraceToolCall`/`debugLogToolCall` for either the cache-hit or
   blocked-response paths — both are called with whatever object gets returned, same as today.

**Offline acceptance check (no spend, no DB)**: a small, temporary script (deleted after use,
per this project's diagnostic-script-cleanup rule) replaying the 14 real query strings from
doc 09 through steps 3-4, confirming:
- Calls **9** and **13** are served from the exact-duplicate cache (identical to call 2's text).
- Call **14** is served from the exact-duplicate cache (identical to call 12's text) —
  regardless of whether call 12 itself ends up blocked by Phase 2's gate (see the worked
  example there): a blocked outcome is cached and replayed exactly like an executed one.
- Calls **10, 11, 12** are flagged `substringOfPriorQuery: true` against call 2.
- **Real design note, found while working this through against the actual trace, not assumed**:
  the relatedness check is direct/pairwise, not transitive clustering, and it's plain
  case-insensitive substring containment — which means call **1** (`"inhabitantType"`) is
  *also* directly substring-related to call 2 and everything after it (`"inhabitantType"` is
  literally contained in `"OSKBuildingUnitInhabitantType"`), even though doc 09's original
  by-hand count only checked calls 10/11/12/14 against call 2. This is worth confirming
  doesn't over-trigger Phase 2's escalation on short, generic early queries before trusting
  the chosen `crossModuleBlockAfter` default in practice — flagged here, checked for real in
  Phase 4, not asserted as fine on paper.

## Phase 2 — (b): cross-module signal, advisory then code-enforced hard refusal

### 2a. `search.ts` — additive, opt-in change (unchanged from the original design)

1. Extract the existing embedding call so it's computed once and can drive two queries. Add
   a new optional options parameter to `search()`:
   ```ts
   export async function search(
     query: string,
     limit?: number,
     moduleFilter?: string,
     opts?: { crossModuleMargin?: number }
   ): Promise<SearchResponse>
   ```
   Existing call sites (`routeCapabilities()`'s unfiltered Step 1 call, and any future
   unfiltered caller) pass nothing new — `opts` stays `undefined`, behavior is unchanged.
2. When `moduleFilter` **and** `opts?.crossModuleMargin` are both set, after the existing
   in-module query runs, issue one additional, cheap query reusing the *same* already-computed
   `embedding` value (no second `embedSearchQuery()` call, so zero additional real API spend):
   ```sql
   SELECT module, embedding <-> $1::vector AS distance
     FROM facts WHERE embedding IS NOT NULL AND module != $3
     ORDER BY distance LIMIT 1
   ```
   (params: `[embedding, moduleFilter]`, reusing `$1`/`$3` positionally as needed). This only
   needs the single best cross-module row, not a full result set.
3. Compare the in-module best distance (`results[0]?.vectorDistance`) against the cross-module
   best distance. If the cross-module distance is real, defined, and **lower by at least
   `opts.crossModuleMargin`**, attach a new top-level field to `SearchResponse`:
   ```ts
   betterMatchOutsideModule?: { module: string; distance: number } | null;
   ```
4. This is the one place this plan touches shared infrastructure. Flagged explicitly per the
   task's scoping instruction — the alternative (duplicating `search()`'s embedding+SQL logic
   directly inside `capability-fanout-prd-agent.ts` to avoid touching `search.ts` at all) was
   considered and rejected: it would fork logic `search.ts`'s own header already says drifts
   easily from its Postgres pipeline counterpart, doubling that risk inside `mcp-server/`
   itself. The chosen shape is additive and default-off, so `atomic-prd-agent.ts` and every
   other existing caller is provably unaffected — worth the user's explicit sign-off before
   Phase 2 actually gets built, given the task's "don't touch beyond capability-fanout" framing.

### 2b. `capability-fanout-prd-agent.ts` — two configurable parameters, and the escalation gate

5. Two new env-var-backed constants in `main()`, alongside the existing capability config
   block (lines 520-523):
   ```ts
   const CROSS_MODULE_MARGIN = Number(process.env.CAPABILITY_CROSS_MODULE_MARGIN ?? <TBD — Phase 3>);
   const CROSS_MODULE_BLOCK_AFTER = Number(process.env.CAPABILITY_CROSS_MODULE_BLOCK_AFTER ?? 2);
   ```
   `CROSS_MODULE_BLOCK_AFTER`'s default of **2** is not a guess — it's the literal number
   decided in review ("after it happens TWICE"). `CROSS_MODULE_MARGIN` still needs real
   calibration (Phase 3), since it's a distance value, not a count — the two parameters need
   different kinds of justification and shouldn't be conflated.
6. Both threaded down through `runCapability(opts)` → `makeCapabilityTools(...)` per Phase 1
   step 1.
7. In `searchFacts`'s handler, for a genuinely new query that reaches this point (i.e. not an
   exact duplicate — Phase 1 steps 3-4 already ran):
   ```ts
   const flaggedRelatedCount = relatedPriorEntries.filter(
     t => t.outcome.kind === "executed" && t.outcome.crossModuleFlagged
   ).length;
   if (flaggedRelatedCount >= crossModuleBlockAfter) {
     const blocked = {
       confident: false,
       results: [],
       blocked: true,
       blockedReason:
         "This concept has now been flagged twice as belonging to a different module; " +
         "this tool will not run further searches for it this call. If it's critical, " +
         "write [NEEDS CLARIFICATION] and move on.",
     };
     triedQueries.push({ query, limit, outcome: { kind: "blocked" } });
     debugTraceToolCall(debugDir, moduleFilter, "search_facts", { query, limit }, blocked);
     return blocked;
   }
   ```
   Below the threshold, call `search()` (passing `{ crossModuleMargin }` per Phase 2a), compute
   `betterMatchOutsideModule`, push
   `{ query, limit, outcome: { kind: "executed", response, crossModuleFlagged: !!betterMatchOutsideModule } }`
   onto `triedQueries`, and return the full response (`exactDuplicateOfPriorQuery: false`,
   `substringOfPriorQuery`, `betterMatchOutsideModule`).
8. **Worked example against the real trace** (illustrative — depends on Phase 3's real
   calibration actually confirming `betterMatchOutsideModule` fires for this query at all,
   not asserted as certain here): if calls 2, 10, and 11 in the real trace had each triggered
   `betterMatchOutsideModule`, the sequence under this design would be: call 2 → executed,
   flagged (1st occurrence for this concept cluster) → advisory. Call 9 → exact duplicate of
   call 2 → served free from cache, doesn't add to the count. Call 10 → substring-related,
   executed, flagged (2nd occurrence) → advisory. Call 11 → substring-related,
   `flaggedRelatedCount` is now 2 → **hard refusal, `search()` never runs**. Call 12 → still
   blocked (count unchanged, since blocked attempts aren't executed and can't add new flags).
   Call 13 → exact duplicate of call 2 → free from cache. Call 14 → exact duplicate of call 12
   → free from cache, replaying the *blocked* outcome (Phase 1 step 3's second bullet). Net
   effect on this real trace: calls 11 and 12 would never reach Postgres/the embedding API at
   all, and calls 9/13/14 already wouldn't either (Phase 1's cache) — 5 of the trace's final 6
   calls avoid real spend entirely, with only call 10 actually paying for a (confirmatory) real
   query. This is illustrative of the mechanism, not a definitive re-run of doc 09 — the real
   distances that decide which calls actually get flagged are Phase 3's job, not this plan's.
9. Combined tool description update (line 112) covering all four new fields at once:
   > "The response also carries `exactDuplicateOfPriorQuery`/`substringOfPriorQuery` (as
   > above) and `betterMatchOutsideModule: { module, distance }` when a real, meaningfully
   > stronger match for this same query exists in a different module — that often means this
   > concept structurally belongs to a different capability call, not that another rephrasing
   > here will find it. The first two times a query for the same underlying concept comes back
   > with `betterMatchOutsideModule` set, treat it as real evidence to weigh, not a block. The
   > next related attempt after that is refused outright (`blocked: true`, no results) rather
   > than run — at that point, write `[NEEDS CLARIFICATION: ...]` for this part of your
   > assigned scope and move on to something your own module's evidence can actually support."
10. **`skill.v3.md` still isn't touched.** The hard refusal is self-explanatory in the tool
    result itself (a `blocked: true` response with zero facts is a strong enough signal on its
    own) — unlike the still-advisory-only `betterMatchOutsideModule` case, where doc 09 §3
    already flagged skill.v3.md reinforcement as a possible later fallback, not needed here.

## Phase 3 — Calibration (real spend — flag explicitly before running)

1. **Flag explicitly before running**: one real embedding call (`embedSearchQuery`) against
   the literal query `"OSKBuildingUnitInhabitantType"` — the same text as trace line #2 —
   with `moduleFilter="features"` and the new cross-module query enabled, to get the real
   measured gap between `features`' best in-module distance and `core`'s (or whichever module
   actually wins) best cross-module distance for this exact known case. Single call, matches
   the size of any one real `search_facts` invocation already happening constantly in this
   project — negligible but real, per this project's flag-don't-avoid-cost rule.
2. Use that real, measured gap to pick `CAPABILITY_CROSS_MODULE_MARGIN`'s default — not a
   guessed round number. Document the measured value and the chosen default (likely somewhat
   below the measured gap, to catch genuinely-weaker-but-real cases too) directly in the
   completion doc (Phase 5), same as `VECTOR_DISTANCE_CONFIDENCE_THRESHOLD`'s own calibration
   comment states its boundary case plainly and flags it as "revisit with more real examples."
   `CAPABILITY_CROSS_MODULE_BLOCK_AFTER` needs no such calibration — its default of 2 was
   decided directly in review, not derived from this real query.
3. This is real evidence on n=1 (one query, one known case) — state that plainly in the
   completion doc rather than presenting the calibrated default as more settled than it is.

## Phase 4 — Regression / integration verification (real spend — flag explicitly)

1. Re-run `capability-fanout-prd-agent.ts` with `FULL_DEBUG=true` against the same
   `1a-ownernonresident.txt` business request (the only real business-request file that
   exists) with `skill.v3.md`/`template.v2.md`, same as the most recent comparable real runs
   (`2026-09-19-001`, `2026-09-17-005`). **Flag explicitly before running** — a full 5-capability
   real run, comparable real cost to the ~$0.10-0.21 range already measured across prior runs
   of this same request (07-prompt-9-real-test-results doc, §"Direct comparison").
2. Check, against doc 09's real numbers:
   - Do `features`/`organization` (or whichever capabilities route this time) complete within
     `CAPABILITY_MAX_TURNS` without needing the graceful-wrap-up fallback, where they
     previously needed it or failed outright?
   - Does the real target fact (`0634ae0ee6b3b8231c096522f7d38d1a847b4cc0`, `OSKBuildingUnitInhabitantType`)
     get found this time via a `betterMatchOutsideModule` signal followed by `walk_cluster`/
     `get_graph_neighbors` into `core`, rather than exhausting budget on rephrasings?
   - **Does Phase 2's hard refusal ever actually fire in a real run**, and if so, does the
     model respond the way the tool description asks (write `[NEEDS CLARIFICATION]` and move
     on) or does an unfamiliar `blocked: true` tool-result shape confuse it into something
     worse (e.g. retrying anyway, or stalling)? This is a real behavioral question a plan can't
     answer on paper — check it directly against this run's transcript.
   - Does Phase 1's real design note (call 1's short generic query pulling into the same
     relatedness cluster) cause any early, over-eager blocking in practice?
   - No regression on the completion/citation behavior already validated in
     `07-prompt-9-real-test-results-2026-09-13.md` (the `formControlName` Gap B citation).
3. **n=1 caveat applies here too** — one real run is a real signal, not a settled result;
   state that plainly rather than generalizing from a single pass, consistent with this
   project's existing standard for these exact kinds of runs.

## Phase 5 — Documentation and cleanup

1. Delete the temporary offline replay script from Phase 1 once its output is confirmed and
   recorded — keep the confirmed numbers, not the script.
2. Write a new numbered doc recording what was actually built, the real calibrated margin
   value and its measured basis, whether/how often the hard refusal actually fired in Phase 4,
   and Phase 4's real run results (or honest failure, if it doesn't pan out) — mark doc 09 as
   addressed with a dated pointer at its top, not rewritten.
3. Open question, not decided here: if Phase 4 shows the hard refusal fires but the model
   still doesn't recover cleanly (writes something other than `[NEEDS CLARIFICATION]`, or the
   capability still exhausts its turn budget some other way), does that argue for a stronger
   mechanism still (e.g. the refusal counting toward, or directly triggering, the existing
   graceful-wrap-up path rather than just returning a tool result)? Not resolved by this plan —
   a real fork to revisit only if Phase 4's real result calls for it.

## Standing rules for the build session

- **Nothing in this doc is executed by writing it** — this is a plan only, per explicit
  instruction. Building it is a separate, future session's job.
- Never `git add`/`git commit` — only the user commits.
- Flag Phase 3 (calibration) and Phase 4 (full real run) spend explicitly, each on its own,
  before running either — never buried inside a larger step, and never assumed pre-approved
  by this plan's existence.
- Get explicit sign-off on the `search.ts` change (Phase 2a) specifically before building it —
  it's the one place this plan steps outside `capability-fanout-prd-agent.ts`'s own file, and
  the task that produced doc 09 was explicit that such an exception needs the investigation
  (now this plan) to show it's genuinely unavoidable, not just convenient.
- Keep the eventual build session in build mode only — investigate (doc 09) and decide (this
  doc) are already closed phases; don't slide back into fresh investigation mid-build without
  noting it explicitly.
