# Findings — duplicate/near-duplicate `search_facts` queries in capability-fanout, 2026-09-20

**Addressed 2026-09-20, same day — see [11-build-completion-duplicate-search-queries-fix-2026-09-20.md](11-build-completion-duplicate-search-queries-fix-2026-09-20.md)
for the real build + real-run results.** Findings below kept as-is, not rewritten.

Investigation only, read-only (Postgres + code + prior docs), zero LLM calls. Triggered by a
real, observed run: `output/agent-runs/prds/test/debug/2026-09-19T13-30-02-999Z-1a-full-debug-test/`.
Scope matches the pattern already used for `06`/`07`/`08` (enum possible-values bug):
investigate → decide → build as three separate sessions. **No fix is built in this doc.**

## 1. What the real trace shows (re-derived, not just re-quoted)

`tool-calls-features.jsonl`'s 14 real tool calls, query text only:

| # | tool | query | ts |
|---|---|---|---|
| 1 | search_facts | `inhabitantType` | 13:31:17 |
| 2 | search_facts | `OSKBuildingUnitInhabitantType` | 13:31:19 |
| 3 | walk_cluster | (anchor) | 13:31:20 |
| 4 | search_facts | `inhabitantType tenant owner` | 13:31:23 |
| 5 | search_facts | `create-organization-inhabitant` | 13:31:25 |
| 6 | walk_cluster | (anchor) | 13:31:27 |
| 7 | search_facts | `inhabitantTypes` | 13:31:29 |
| 8 | search_facts | `ownerNonResident` | 13:31:32 |
| 9 | search_facts | `OSKBuildingUnitInhabitantType` | 13:34:48 |
| 10 | search_facts | `OSKBuildingUnitInhabitantType enum` | 13:37:31 |
| 11 | search_facts | `OSKBuildingUnitInhabitantType values` | 13:40:42 |
| 12 | search_facts | `OSKBuildingUnitInhabitantType enum values` | 13:43:36 |
| 13 | search_facts | `OSKBuildingUnitInhabitantType` | 13:46:58 |
| 14 | search_facts | `OSKBuildingUnitInhabitantType enum values` | 13:49:44 |

Confirmed exactly as the task background described: `{2, 9, 13}` character-for-character
identical, `{12, 14}` character-for-character identical, and `{10, 11, 12, 14}` each contain
query `#2`'s full text as a substring with extra words appended.

**Confirmed independently** (not re-derived from the earlier claim): grepped the raw trace
file for the real target fact_ref (`0634ae0ee6b3b8231c096522f7d38d1a847b4cc0`) and for
`module":"core"` — both return zero matches across all 14 calls' results. The target fact
genuinely never surfaces; no rephrasing in this trace could have found it, because
`search_facts` is hard-scoped to `module='features'` (`search.ts`'s `WHERE module = $3`) and
the fact lives in `module='core'`.

**New observation, not in the task background**: calls 9–14 are spaced roughly 3 minutes
apart (13:34:48 → 13:37:31 → 13:40:42 → 13:43:36 → 13:46:58 → 13:49:44), vs. ~2 seconds apart
for calls 1–8. This matches this project's own previously-confirmed 5 req/min Vertex quota
backoff (`retryOn429`), not a new finding on its own, but worth stating plainly: the real cost
of this failure mode isn't just "6 extra tool calls" — under quota backoff, those 6 calls
alone cost roughly 15 minutes of wall-clock time. This run's own debug folder was never
renamed to a final basename and no `llm-features.json` was written (unlike `llm-organization.json`,
which exists and is complete) — the `features` capability call did not reach a normal
completion or a confirmed graceful wrap-up in this specific capture. This is inconclusive
by design (the artifacts simply stop after call 14, with no error recorded in this file) —
noted honestly rather than guessed at.

## 2. Question (a): recurring/generalizable, or coincidental same-identifier repeat?

**Real answer: recurring, not a one-off coincidental repeat of the exact same identifier.**
Evidence, in order of strength:

1. **Two different capabilities, same run, same session.** `tool-calls-organization.jsonl`
   (same 2026-09-19 debug run) shows the `organization` capability independently chasing the
   *same* identifier with the *same* growth-by-appended-words shape: `"OSKBuildingUnitInhabitantType"`
   (call 3) → `"type OSKBuildingUnitInhabitantType"` (call 12) → `"export type OSKBuildingUnitInhabitantType"`
   (call 13). Two independently-running capability calls converged on the identical
   rephrasing strategy against the identical out-of-scope identifier — this is the shape of a
   structural gap in the search tool/persona interaction, not a fluke specific to one
   capability's context.

2. **Budget exhaustion recurs across different runs and a different business request.**
   Checked every `output/agent-runs/prds/test/*.meta.json` with `capabilityFanout` data (8
   real runs total):
   - `2026-09-19-001-1a-multirepo-post-graceful-wrapup-fix`: `user` (21 turns) and `building`
     (21 turns) both exceed `maxTurns=20`, saved only by the 2026-09-19 graceful-wrap-up
     fallback (not visible as `failedCapabilities` because that fallback now absorbs it).
   - `2026-09-18-001-1a-multirepo-post-layer2-retest` (predates the graceful-wrap-up fix):
     `user` is in `failedCapabilities` outright.
   - `2026-09-17-007-2a-resident-departure-fanout-adr010-retest` — **a different business
     request** (`2a-resident-departure`, not `1a-ownernonresident`): `user` again in
     `failedCapabilities`, `building` at 21 turns.
   
   Only one `.txt` business-request file (`1a-ownernonresident.txt`) has ever actually been
   run through capability-fanout in `FULL_DEBUG` mode, so a second query-level trace for a
   genuinely different target identifier doesn't exist yet to confirm the exact
   duplicate/substring shape recurs verbatim. But budget exhaustion itself — the outcome this
   failure mode produces — recurs on a different business request, and hits a different
   capability (`user`) than the `1a-ownernonresident` case's `features`/`organization`/`building`.
   That's real evidence the underlying mechanism (a capability's assigned module doesn't own
   the concept its own search needs) is structural to module-scoped search, not tied to one
   symbol name.

3. **Routing makes the gap likely to recur specifically for this project's target case.**
   `routeCapabilities()` ranks candidate modules by best vector distance across the whole
   corpus and takes the top `CAPABILITY_MAX_CAPABILITIES` (default 5). `core` — the module
   that structurally owns `OSKBuildingUnitInhabitantType` — has consistently ranked 5th
   (worst) or been cut entirely across every routed run checked (e.g. `2026-09-19-003`, which
   only ran `organization`+`features`, `core` not even a candidate). Whenever a target concept
   lives in a module that routes poorly relative to the *overall* business-request wording
   (a real, plausible pattern whenever the important evidence is a shared/base-layer type
   referenced only indirectly by request text phrased in feature-facing language), every
   capability whose own module doesn't win that concept will hit this gap by construction.

**Conclusion**: not coincidental. Treat as a structural, recurring class of failure —
worth fixing generally, not as a one-off patch for this specific identifier.

## 3. Question (b): cross-module signal as an objective, code-computed FACT

**Real precedent already in the code to build on**, confirmed by reading
`makeCapabilityTools()` (`capability-fanout-prd-agent.ts:108-127`): `alreadyRetrieved` is
exactly this shape already — code (`seenFactRefs.has(r.factRef)`) computes an objective
per-result fact, the `search_facts` tool's own description string explains what it means and
what to do about it (`"if so, don't search again for the same concept; call walk_cluster or
get_graph_neighbors on it instead"`), and **skill.v3.md never mentions `alreadyRetrieved` at
all** (confirmed: zero matches). The generic persona doesn't need special-casing — the
tool-level description carries the instruction, adr-008-compliant (code computes fact, the
model's own judgment, primed by the tool's own description, decides what to do).

A cross-module signal fits the identical shape. Concretely, per `search.ts`: `search()`
already computes one embedding per query (`embedSearchQuery`, a real, quota-limited Vertex
API call — this project's confirmed 5 req/min constraint) and issues one Postgres query. To
surface "N result(s) exist for this exact query outside your assigned module, with a
stronger match" as a fact:

- **Reuse the already-computed embedding for a second, module-excluded (or unfiltered)
  Postgres query**, not a second `search()`/`embedSearchQuery()` call. `search.ts` doesn't
  currently expose a way to reuse an embedding across two SQL queries (`search()` always
  embeds internally) — this is a real, small refactor `search.ts` would need (split embedding
  from querying, or accept a pre-computed embedding), not a two-line change. Doing this as a
  second full `search()` call instead would double real Vertex API spend and quota pressure
  per `search_facts` invocation, silently, for every capability call in every run —
  a real cost this decision should weigh explicitly, not default into.
- The comparison itself is cheap: compare the capability's own best in-module distance
  against the best distance among the excluded/other-module rows for the same embedding.
  `SearchResult.module` is already returned per row, so no new column or index is needed.
- Feed it back the same way `alreadyRetrieved` is fed back: an extra field per result (or a
  single top-level `betterMatchOutsideModule: { module, distance } | null` on the response),
  described in `search_facts`'s tool description, e.g. *"if present, a stronger match for
  this same query exists in a different module — that often means this concept structurally
  belongs to a different capability, not that you should keep rephrasing."*
- **skill.v3.md would need a small addition** to make full use of it — the task background
  assumed skill.v3.md "already told 'not found in your module' can mean 'wrong module'" or
  could be trivially extended; **checked directly, it does not currently say this anywhere**
  (grepped the whole file for "module" — zero matches). Workflow rule 5 ("never repeat a
  sub-question 3-5 times") is genuinely generic and doesn't reference module-scoping at all.
  Whether that extension belongs in skill.v3.md (shared, generic) or stays entirely inside
  the tool description (capability-fanout-specific, no shared-file edit needed) is a real,
  open decide-stage question — the tool-description-only route stays strictly inside this
  task's stated scope (`capability-fanout-prd-agent.ts` and its own tool definitions); the
  skill.v3.md route touches a shared file used by both agents and needs its own justification.

## 4. Questions (c)/(d): exact-duplicate cache and substring-containment check

Quantified directly against the real 14-call trace, keying on `(query, limit, moduleFilter)`:
`makeCapabilityTools` already binds `moduleFilter` constant per capability call, so keying
on query text + limit alone is sufficient within one capability's `seenFactRefs`-scoped
lifetime — no stale-cache risk from a shared key space:

- **Exact-duplicate cache (c)** would flag calls **9, 13, 14** — 3 of 14 `search_facts`
  calls, all identical to an earlier call in the same conversation, for zero ambiguity.
- **Substring-containment check (d)** would flag calls **10, 11, 12, 14** — 4 of 14 calls,
  each containing query `#2`'s exact text as a substring.
- **Combined, deduplicated**: calls **9, 10, 11, 12, 13, 14** — 6 of the trace's 14 calls,
  i.e. the entire second half of this run from 13:34:48 onward, every single one of which
  turned out to be unproductive. Given the ~3-minute-apart quota-backoff spacing observed in
  §1, this range alone represents roughly 15 of this capability call's real minutes.

Both checks are naturally implemented at the exact same site `alreadyRetrieved` already lives
(`makeCapabilityTools`'s `searchFacts` tool implementation, `capability-fanout-prd-agent.ts:108-127`),
using a second per-capability `Map`/array parallel to `seenFactRefs`, populated with each
call's `{query, limit}` before returning. Same fact-not-instruction shape: surfaced as a
result-level or response-level field, described in the tool description, left for the
model's own judgment to act on — not a hard block, per the task's adr-008 framing and this
file's own `alreadyRetrieved` precedent.

## 5. Question (e): embedding/fuzzy matching

Not investigated further, per the task's explicit instruction to defer it as a separate,
harder, threshold-tuning decision.

## 6. Summary for the decide stage

- The cross-module scoping gap is real, structural, and recurring — confirmed across 2
  capabilities in one run, 3+ runs, and 2 different business requests — not a coincidence
  tied to `OSKBuildingUnitInhabitantType` specifically, though verbatim query-level
  confirmation for a second identifier doesn't yet exist (only one business-request `.txt`
  file has ever been run in `FULL_DEBUG` mode).
- All three candidate fixes ((b) cross-module fact, (c) exact-dup cache, (d) substring check)
  fit the same adr-008-compliant shape already proven by `alreadyRetrieved`: code computes an
  objective per-run fact, the tool description (not skill.v3.md) explains it, the model's own
  judgment acts on it.
- (c)/(d) are cheap, zero-risk, and quantifiably would have caught 6 of this run's 14 real
  `search_facts` calls — a real, low-risk win regardless of what happens with (b).
- (b) is the structural fix for the actual root cause, but needs a real (small) `search.ts`
  refactor to reuse one embedding across two Postgres queries rather than doubling real
  Vertex API spend per `search_facts` call — worth flagging as real, non-trivial spend impact
  before greenlighting, not a one-line addition.
- skill.v3.md currently has zero awareness of module-scoping at all; whether to extend it or
  keep the fix entirely inside the tool description (in scope for this task) is a real,
  open decide-stage question, not resolved here.

No fix is built in this doc. If a decide-stage build plan follows, it belongs in its own
separate doc (`10-...`), same mode-separation pattern as `06`/`07`/`08`.
