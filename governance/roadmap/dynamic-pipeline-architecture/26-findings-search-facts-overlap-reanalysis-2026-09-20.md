# Re-analysis: `search_facts` result-overlap ("pulling too much noise out of Postgres"), 2026-09-20

Independent re-derivation of
[25-preliminary-finding-search-facts-overlap-2026-09-20.md](25-preliminary-finding-search-facts-overlap-2026-09-20.md),
per that doc's own explicit ask, addressed to this thread (docs 09-11's capability-fanout
work). Read-only investigation, zero LLM calls — all numbers below come directly from the
three real `FULL_DEBUG` traces already on disk (`2026-09-20-001`, `002`, `003`). No fix
proposed or built here; this is the investigation, per doc 25's own framing.

## Task 1/2: independently re-derived — doc 25's numbers hold up

Recomputed tool-level volume directly from `tool-calls-*.jsonl` (not re-typed from doc 25):

| Run | search_facts calls | avg results/call | raw results | walk_cluster calls | avg members/call |
|---|---|---|---|---|---|
| 001 | 62 | 25.00 | 1,550 | 34 | 1.85 |
| 002 | 55 | 23.64 | 1,300 | 31 | 1.74 |
| 003 | 55 | 25.91 | 1,425 | 34 | 1.88 |

Exact match to doc 25's cited ranges (52-62 calls, 1,300-1,550 raw results, walk_cluster under
2/call). `get_graph_neighbors` confirmed near-useless independently: 0, 0, and 1 real facts
returned across 3/8/6 calls respectively, in the three runs.

**On task 2 (check against the real shipped code, not an approximation)**: rather than
reproducing the `isRelatedQuery`/`triedQueries` logic a second time, this pass read the
`exactDuplicateOfPriorQuery`/`substringOfPriorQuery` fields **directly from the trace** — these
are the real, live values the actual shipped code computed and stored at run time, not a
re-derivation. Cross-tabulated against the real `alreadyRetrieved` per-result flag (also live,
not recomputed), using a ≥70% overlap cutoff matching doc 25's own threshold:

| Run | ≥70% overlap calls | caught by real text flags | **residual (unflagged)** |
|---|---|---|---|
| 001 | 24 | 17 | **7** |
| 002 | 22 | 20 | **2** |
| 003 | 26 | 22 | **4** |

Identical to doc 25's cited 7/24, 2/22, 4/26 — a strong, independent confirmation using ground
truth rather than a reproduction. Doc 25's quick pass was accurate; this isn't a case where the
narrow first look was wrong, just unfinished (per its own framing).

## Task 3: what doc 25's pass didn't check

### 3a. The 40-70% population, not just the binary ≥70% cutoff

Full histogram, all `search_facts` calls with non-empty results, all 3 runs:

| Bucket | 001 | 002 | 003 |
|---|---|---|---|
| 0-10% | 16 | 11 | 10 |
| 10-40% | 10 | 10 | 9 |
| 40-70% | 12 | 9 | 10 |
| 70-100% (incl. 100%) | 24 | 22 | 26 |

**Real answer: yes, a meaningful population sits in 40-70%** — roughly as large as the ≥70%
bucket itself (12/9/10 vs. 24/22/26). Doc 25's binary cutoff was a reasonable first
approximation but does hide real volume; a fix designed only around a ≥70% trigger would miss
roughly a third of all calls that are still meaningfully (40-69%) redundant, not just the
worst offenders.

### 3b. `walk_cluster`/`get_graph_neighbors` overlap ratio, not just raw volume

Doc 25 checked raw volume only (found it low) and didn't check per-fact overlap. Reconstructed
each capability's own real chronological "has the model seen this factRef yet" set (across
*all* tool types in call order, not just `search_facts`'s own `seenFactRefs`, since the model
itself sees everything regardless of which internal tracker the code updates) and checked what
fraction of each `walk_cluster` call's real `members` were already in that set:

| Run | walk_cluster already-seen | overlap % |
|---|---|---|
| 001 | 34/63 | 54.0% |
| 002 | 42/54 | 77.8% |
| 003 | 48/64 | 75.0% |

**Real, previously-unmeasured finding, direct answer to doc 25's own flagged blind spot**:
`walk_cluster`'s per-fact overlap is *high* (54-78%) despite its low raw volume — "low volume"
and "low waste" are not the same thing here, confirming doc 25's own suspicion. Worth noting
as a real, separate structural gap: `walk_cluster`/`get_graph_neighbors` results never get an
`alreadyRetrieved` flag at all in the shipped code (only `search_facts`'s handler touches
`seenFactRefs`) — so even the partial signal `search_facts` already has, these two tools have
none.

### 3c. Do residual (unflagged) cases cluster by capability, phrasing, or fact kind?

**Yes — sharply, by capability.** All 13 residuals across all 3 runs:

| Capability | Residual count |
|---|---|
| `core` | 9 |
| `building` | 4 |
| `organization`, `features`, `user` | 0 |

100% of the residual gap is in exactly two capabilities, both times the modules that
structurally *own* the target concept for this business request (`core` owns
`OSKBuildingUnitInhabitantType` itself; `building` owns closely related facts). Pulled the
actual results for three of `core`'s residual calls (`"OSKBuildingUnitResident"`,
`"building-unit-inhabitant.type"`, `"isResident"` — genuinely different query text, no
exact/substring relation to each other) and confirmed directly: all three return largely the
*same* small cluster of real `core` facts (`OSKBuildingUnitInhabitant.*` model properties,
`OSKBuildingUnitResident/Owner/Tenant.type`, `OSKBuildingUnitInhabitantType` itself), just
approached from different angles ("what facts relate to residents," "what's in this specific
file," "what has 'isResident' in its name"). **This is a different mechanism than the
literal/near-literal query repetition docs 09-11 targeted** — it's not the same question asked
again, it's a small, real, genuinely-exhausted evidence pool being reached from several
legitimately different angles. Text-based dedup structurally cannot catch this, by design —
the queries really are different.

### 3d. Does the exact-dup-cache-bypasses-escalation-gate bug (doc 11 Addendum 2) explain any of this?

Checked directly, not assumed. The bug (found and fixed live, same day, in `user`'s trace)
does **not** explain the residual gap above — those cache-hit repeats were already correctly
flagged `exactDuplicateOfPriorQuery: true` by the shipped code even before the ordering fix
(the bug was about *escalating to a block*, not about *detecting* the duplicate), so they were
already counted as "caught by text flags," not residual.

What the bug *does* explain: real, extra, avoidable volume. Found 6 real instances across all
3 runs of an exact-duplicate call returning full (non-empty) cached results instead of a block:
`002/core` (1), `002/features` (1), `003/user` (4). Quantified the local and aggregate effect:

- **Locally, in `003/user` specifically** (where it fired 4 times): 225 raw results, 157
  already-seen (69.8%) as actually recorded. Removing those 4 calls' 100 results (all 100
  were already-seen, by definition of an exact-duplicate repeat) gives an estimated post-fix
  figure of 125 results, 57 already-seen (**45.6%**) — a real, large local improvement.
- **Aggregately, across all 3 runs combined**: 4,275 raw results, 2,259 already-seen (52.8%)
  as recorded; the 6 bug-affected calls contributed 150 results (all already-seen) to that
  total. Estimated post-fix: 4,125 results, 2,109 already-seen (**51.1%**) — a real but modest
  aggregate shift.

**Honest conclusion**: the bug is a real, quantifiable, already-fixed contributor to wasted
volume, but a small one at the aggregate level — it explains a few points of the overall
overlap rate, not the overall 45-59% overlap phenomenon doc 25 originally asked about. It's a
distinct, separate, smaller problem from the `core`/`building` small-pool pattern above, which
is the dominant real driver of the residual gap specifically.

## Task 4: other anomalies found in the same data, not part of doc 25's original question

**`core` is uniformly the worst-overlap capability, by a wide margin, across all 3 runs**
(summed): `core` 810/1,150 = **70.4%**; `user` 54.6%; `building` 50.4%; `features` 49.8%;
`organization` 28.3%. This isn't run-specific noise — `core` is worst in every single run
checked. Consistent with 3c above: `core`'s real, structural evidence pool for this business
request's concept is small, and every capability assigned to it (once, or across all 3 runs)
converges on largely the same set.

**Specific facts re-surface 12-14 times within one capability's own conversation.** Counted
real `factRef` appearances per (run, capability): the top 15 are *all* in `core`, ranging
12-14 appearances each, across capabilities that only made ~14-15 `search_facts` calls total —
meaning several individual facts appeared in **nearly every single call** that capability
made. Notably, the real doc-09 target fact itself
(`0634ae0ee6b3b8231c096522f7d38d1a847b4cc0`) is among them — appearing 12 times in run 002's
`core` capability alone, despite `alreadyRetrieved` presumably flagging most of those
repeats correctly (worth a future check: does citation quality actually suffer when a fact
this thoroughly re-surfaced still only gets cited once, or not at all — not checked here).

## What this means for doc 25's candidate fix — a real refinement, not just a decision to make

Doc 25 framed the residual gap as "differently-worded question, same small pool of facts" and
proposed a real-overlap-fraction advisory signal as a candidate fix. This re-analysis
**confirms that framing directionally but sharpens it**: this isn't a general phenomenon
spread evenly across the corpus — it's concentrated specifically in modules with a genuinely
small, exhausted real evidence pool for the concept in question. That raises a real question
the candidate fix's design should address before being built, not decided here: is high
overlap against a small, real, already-mostly-covered pool actually *waste* worth suppressing,
or is it evidence the model is doing exactly what `skill.v3.md` already asks (try several real,
different angles) against an area that simply doesn't have much more to give — in which case
the real fix isn't "stop returning already-seen facts," it's "tell the model it has likely
exhausted this module's real evidence," a stop-early signal complementary to (but distinct
from) `skill.v3.md`'s existing 70%-budget and 3-5x-retry-per-subquestion rules.

## Explicitly not done here, per doc 25's own scope and this project's discipline

- No fix designed or built. Both this doc's findings and doc 25's original candidate remain
  real options for a future decide-stage doc, not decided here.
- No new traces generated — this re-analysis is scoped to the same three real `FULL_DEBUG`
  captures doc 25 used, per its own ask to redo the analysis on the same data before looking
  further. A fourth real trace (`2026-09-19-003`) still has no debug capture, unchanged from
  doc 25's note.
- Citation-quality correlation (does high overlap predict low citation value) is flagged above
  as a real, interesting follow-up question, not checked here — out of scope for a re-analysis
  of doc 25's specific claims.
- Diagnostic scripts used to produce every number in this doc were temporary and deleted after
  producing the figures recorded here, per this project's script-cleanup discipline — the real
  findings live in this doc, not in a script.
