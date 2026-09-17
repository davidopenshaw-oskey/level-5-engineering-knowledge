# Prompt 10 findings: resolved-graph ID mismatch was staleness, not a code bug

2026-09-11. Follow-up to `prompts/prompt-10-resolved-graph-id-mismatch-root-cause.md`. That
prompt's own hypothesis (a code-level ID-computation divergence inside
`02-build-module-evidence.ts`) turned out to be wrong -- corrected mid-session by a concurrent
Claude Code session (`level-5-engineering-knowledge-3a`) via cross-session message, independently
matching the trace already done here before that message arrived. Both traces agree exactly.

## What was actually traced

`pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts` (read in full): there is only
ONE `facts` array per module. `stableFactId()` (with `boundedIdComponent()`) computes `.id` once per
fact, and that same array is written unchanged to both `{module}-facts.json` and
`{module}-evidence-graph.json` (lines 553-554). No separate/divergent ID computation exists for
call objects in the evidence graph -- the premise in prompt-10 was incorrect on this specific point.

`05-partition-capability-packs.ts` (read in full): repartitions `{module}-evidence-graph.json`'s
`facts` array into per-submodule capability packs, again without recomputing `.id`. `sync-facts.ts`
reads those capability packs (not `{module}-facts.json` directly) and upserts `f.id` as
`facts.fact_id`. So `facts.fact_id` and the evidence-graph's `call.id` are, for a single pipeline
run, literally the same string, computed once.

`04-build-resolved-graph.ts` reads `{module}-evidence-graph.json` and copies `call.id` straight into
`sourceCallFactId` (lines 218/238/252/271) -- also just a pass-through, not a recomputation.

## Real root cause: pipeline re-run ordering, not ID logic

`02-build-module-evidence.ts` was fixed (bounded IDs via `boundedIdComponent()`, `MAX_ID_COMPONENT_LENGTH = 200`)
and re-run today for `ios-oskey-dev`, regenerating `{module}-evidence-graph.json` and (via `05`) the
capability packs with the new, bounded IDs -- which `sync-facts.ts` then pushed into Postgres as the
current `facts.fact_id` values. But **`04-build-resolved-graph.ts` was never re-run afterward**, so
`resolved-engineering-graph.json` kept sourcing `sourceCallFactId` from the OLD, unbounded IDs computed
before the fix. Same run directory (`output/runs/ios-oskey-dev/20260910_164201-e660bda2/`), same
`runId`, different generation times for different downstream artifacts within it.

Confirmed via real file timestamps, not assumed:

| Repo | `resolved-engineering-graph.json` | `{module}-evidence-graph.json` (sample) | Order |
|---|---|---|---|
| ios-oskey-dev | Sep 10 18:42:41 | Sep 11 09:31:53 | **04 stale** (before 02's fix) |
| android-intercom-oskey-io | Sep 9 14:34:23 | Sep 11 13:23:34 | **04 stale** |
| swift-ble-kit-oskey-dev | Sep 11 14:49:18 | Sep 10 18:42:31 | 04 fresh (ran after 02) |
| swift-cloud-kit-oskey-dev | Sep 11 14:49:21 | Sep 10 18:42:31 | 04 fresh |
| swift-ui-kit-oskey-dev | Sep 11 14:49:25 | Sep 10 18:42:31 | 04 fresh |
| swift-webrtc-kit-oskey-io | Sep 11 14:49:28 | Sep 10 18:42:31 | 04 fresh |

This exactly explains the original per-repo dangling rates: the 4 swift-kit repos had `04` run after
`02`, so never went stale (0% dangling regardless of whether any IDs needed bounding). `ios-oskey-dev`
and `android-intercom-oskey-io` had `04` run before a later `02`/`05` re-run, so any call whose
`calleeExpression` exceeded the bound (200 chars for the shared Swift script, 2000 for Kotlin's own
copy) got a different ID pre- vs post-fix -- explaining why `ios-oskey-dev` (lots of long, deeply
chained SwiftUI view-builder calls) saw a large rate (19%) and Kotlin (much higher 2000-char bound,
rarely hit) saw a tiny one (0.03%, 1 call).

`build-intra-repo-edges.ts`'s existing freshness check (`graph.runId !== runId` fail-closed, added
2026-09-11 per its own header) does NOT catch this class of staleness -- it only checks that the
graph file's `runId` string matches the currently-live run in `extraction_runs`, which stays true
even when an earlier phase-1 script inside that same run directory was re-run after `04` already
produced its output. Confirmed both stale cases (`ios-oskey-dev`, `android-intercom-oskey-io`) had
matching `runId` throughout -- the check passed, correctly, since the run identity genuinely didn't
change; it just isn't sufficient to catch this failure mode. No fix attempted for that gap here --
flagged as real follow-up, not in scope for this task.

## Fix applied

No code changes. Re-ran, for real, against the current live pipeline:

```
REPO_NAME=ios-oskey-dev node -r ts-node/register pipeline/swift/phase-01-ast-extraction/04-build-resolved-graph.ts
REPO_NAME=ios-oskey-dev node -r ts-node/register pipeline/facts-postgres-index/build-intra-repo-edges.ts

REPO_NAME=android-intercom-oskey-io node -r ts-node/register pipeline/android-intercom-oskey-io/phase-01-ast-extraction/04-build-resolved-graph.ts
REPO_NAME=android-intercom-oskey-io node -r ts-node/register pipeline/facts-postgres-index/build-intra-repo-edges.ts
```

Deliberately did NOT re-run extraction (`01`) or `02`/`05` -- those were already fresh (regenerated
earlier today, post-fix) for `ios-oskey-dev`, and `android-intercom-oskey-io`'s evidence-graph/
capability-packs were likewise already regenerated (Sep 11 13:23/13:27, cause not further traced here
-- outside this task's scope) before this session started. Only the stale downstream step (`04`) and
its Postgres loader needed a re-run.

## Verification -- real, before/after, checked directly against Postgres

Call-classification breakdown from `04`'s own re-run output is unchanged both times (confirms this
was purely an ID refresh, not a logic change):
- `ios-oskey-dev`: 8734 graph-eligible (497 cross-module / 2136 same-module / 6101 unresolved) -- identical to the original prompt's own numbers.
- `android-intercom-oskey-io`: 3590 graph-eligible (41 / 608 / 2941).

`cross_repo_edges` (`connection_type = 'INTRA_REPO_CALL'`), before (real, queried live):
- `ios-oskey-dev`: 7071 (= 8734 - 1663 dangling, 19.0%)
- `android-intercom-oskey-io`: 3589 (= 3590 - 1 dangling, 0.03%)

After re-running `04` + `build-intra-repo-edges.ts` (neither run printed a "Dropped N edge(s)" line
-- `build-intra-repo-edges.ts`'s own dangling-filter found zero to drop):
- `ios-oskey-dev`: **8734** (100% loaded, 0% dangling)
- `android-intercom-oskey-io`: **3590** (100% loaded, 0% dangling)

Independently re-verified with a direct SQL join (not trusting the script's own count alone):

```sql
SELECT e.source_repo, count(*) AS dangling_count
FROM cross_repo_edges e
LEFT JOIN facts f ON f.fact_id = e.source_fact_id AND f.repo = e.source_repo
WHERE e.connection_type = 'INTRA_REPO_CALL' AND e.source_repo IN ('ios-oskey-dev','android-intercom-oskey-io')
  AND f.fact_id IS NULL
GROUP BY e.source_repo
```
Result: zero rows for both repos.

No regression: every edge count that wasn't previously dangling carried through unchanged (7071 and
3589 respectively), plus the previously-dropped edges (1663 and 1) are now correctly loaded. Nothing
else changed in either repo's `cross_repo_edges` rows.

## Standing follow-up (not done here, real and open)

`build-intra-repo-edges.ts`'s freshness check should arguably also confirm `resolved-engineering-graph.json`
was generated at or after the evidence-graph files it was built from (e.g. compare `generatedAt`
timestamps, or have `04` stamp/consume a content hash of its inputs) -- the current `runId`-only check
is real and correct but not sufficient to catch a same-run, re-run-ordering staleness bug like this
one. Not fixed here per this task's own scope (verify + reload, not redesign the freshness check);
flagging for a future prompt.

Everything above is a live-pipeline/live-Postgres state change (via the two re-run scripts), not a
git change -- there is nothing to commit from this session. Only this findings file and the prior
in-flight prompt files under `governance/roadmap/graphrag/` are new/uncommitted, per the project's
standing "never commit unprompted" rule.
