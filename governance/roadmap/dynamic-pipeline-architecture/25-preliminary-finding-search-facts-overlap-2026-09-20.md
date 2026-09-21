# Preliminary finding: high result-overlap in `search_facts` calls that text-based dedup misses — needs independent re-analysis before acting

**Status: preliminary, from a quick, narrow, single-session pass — not yet independently
verified. This doc's own explicit purpose is to hand off for re-derivation and a broader
look, not to propose a build.** Written 2026-09-20, following the real, already-published
"gathered but not cited" Audit Trail numbers surfacing a broader question about retrieval
signal-to-noise, separate from the module/repo-scoping work in docs 09-23.

## What prompted this

Real, already-existing evidence in the Audit Trail section of recent output documents shows
a consistent 91-94% "gathered but not cited" rate across four real runs (`2026-09-20-001`:
93.7%, `002`: 93.2%, `003`: 92.8%, `2026-09-19-003`: 91.5%). Not all of that is necessarily
waste (some gathered-but-uncited evidence may be legitimate reasoning support), but the
consistency across four different runs, dates, and configs made it worth checking where the
raw volume actually comes from.

## Methodology (quick, narrow — state this plainly so a re-analysis knows what's already covered)

Used the three real `FULL_DEBUG` traces already on disk for
`2026-09-20-001-1a-cross-module-fix-verification`,
`2026-09-20-002-1a-cross-module-fix-with-grounding-docs`, and
`2026-09-20-003-1b-owner-non-resident-multiplatform` (`2026-09-19-003` has no debug trace —
it predates the `FULL_DEBUG` feature). Wrote a one-off Python script (not saved — throwaway,
per this project's diagnostic-script-cleanup discipline) that:
1. Counted real tool-call volume per tool type across all capabilities in each run.
2. For each `search_facts` call, used the already-computed `alreadyRetrieved` flag on each
   returned result (real, live data captured at the time of the original run — not
   recomputed) to get the real fraction of that call's results the capability had already
   seen.
3. Reproduced a simplified version of the shipped exact-match/substring-relatedness logic
   (`capability-fanout-prd-agent.ts`'s `triedQueries` mechanism) to check whether each
   high-overlap call would already be flagged by the current text-based mechanisms.

**This was one pass, one threshold, one approximation of the real shipped logic — flagged
explicitly below as things a re-analysis should redo independently, not trust from this
doc.**

## What was found

**Tool-level volume**: `search_facts` is overwhelmingly the source of raw fact volume —
averaging near its 25-result max on almost every call, called 52-62 times per run.
`walk_cluster` averages under 2 facts/call (far under its 80-fact ceiling — this rules out
the walk_cluster-ceiling hypothesis that seemed like the likely culprit before checking real
data). `get_graph_neighbors` contributes almost nothing.

**Overlap**: comparing raw `search_facts` return volume (1,300-1,550 per run) against the
real, deduplicated "gathered" count from the Audit Trail (610-839) implies roughly 45-59% of
everything `search_facts` returns across a run is something already seen.

**Cross-tabulated against the real, already-computed `alreadyRetrieved` flag** (not an
estimate): ~40% of all `search_facts` calls (22-26 of 52-62 per run) return results that are
≥70% already-seen facts. Of those high-overlap calls, the existing exact-match/substring
mechanisms (docs 09-11) already catch 71-91% of them — a real, positive validation of that
work, not wasted effort. The residual — calls where the query *text* looks genuinely new
(no exact/substring match to anything tried before in that capability) but the *results*
come back mostly already-seen — is real but smaller than the whole problem: 7/24 (29%),
2/22 (9%), 4/26 (15%) across the three runs.

## Candidate fix (one possible angle, not a decision)

Every `search_facts` result already carries a real, live-computed `alreadyRetrieved` flag.
A candidate fix for the specific residual gap above: after a call returns, check the real
overlap fraction directly (already available, no new computation needed) and treat a very
high overlap (e.g. ≥70-80%) as its own advisory signal — independent of whether the query
text resembles anything tried before. This would catch the "differently-worded question,
same small pool of facts" case the text-based check structurally can't. **Not designed in
detail here, and framed deliberately as one candidate, not the fix** — see the ask below.

## The real ask: re-analyze independently before treating any of this as settled

This was one session's quick pass, not a rigorous investigation. Handing to the
capability-fanout session (the one that did the real work in docs 09-23) to:

1. **Independently re-derive the numbers above** — don't trust this doc's counts; recompute
   from the same three real traces (and check whether more traces exist by the time this is
   picked up) using your own, careful methodology, not a reproduction of a quick script.
2. **Check the exact-match/substring logic against the real shipped code precisely** — this
   doc's own reproduction was a simplified approximation, not a direct read of
   `capability-fanout-prd-agent.ts`'s actual `triedQueries` implementation. A subtle
   difference there could change the residual-gap numbers meaningfully.
3. **Look at what this pass didn't check, since it's exactly the kind of thing a narrow
   first pass misses**:
   - Only a 70% overlap threshold was checked — is there a meaningful population between
     40-70% that this pass's binary cutoff hides?
   - `walk_cluster`/`get_graph_neighbors` weren't checked for their own overlap ratio, only
     raw volume (which is low) — low volume doesn't necessarily mean low waste-per-fact.
   - Whether the "slips through" residual cases cluster around specific capabilities, query
     phrasings, or fact kinds — a real pattern there could point at a more targeted fix than
     a blanket overlap threshold.
   - Whether the exact-dup-cache-bypasses-escalation-gate bug (found live in doc 11
     Addendum 2, being fixed independently) interacts with or explains any of this data —
     check whether that fix, once landed, changes these numbers before designing anything
     new on top of stale data.
4. **Genuinely look for other interesting anomalies in the same data**, not just confirm or
   refute this one hypothesis — this pass was narrowly scoped to the overlap question it
   set out to check; a fresh, broader look at the same real traces may well surface
   something this pass wasn't looking for.

No fix should be built from this doc alone. This is the raw material for a real
investigation, not the investigation itself.
