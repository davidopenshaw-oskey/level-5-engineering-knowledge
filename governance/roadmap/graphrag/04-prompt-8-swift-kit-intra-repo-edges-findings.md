# Prompt 8 — complete Swift-kit intra-repo edges: findings (2026-09-11)

Executed `prompts/prompt-8-complete-swift-kit-intra-repo-edges.md` against the already-working `build-intra-repo-edges.ts` (Kotlin/Swift schema support committed 2026-09-11). No new development — pure execution + verification. No commits made (standing rule).

## Step 1 — freshness confirmed before running anything

Queried Postgres `extraction_runs.is_current` for the 4 repos directly, and confirmed each `resolved-engineering-graph.json`'s own `runId` field matches:

| repo | `is_current` run_id (Postgres) | `runId` in graph file | match |
|---|---|---|---|
| swift-ble-kit-oskey-dev | 20260910_164127-f8cdf199 | 20260910_164127-f8cdf199 | yes |
| swift-cloud-kit-oskey-dev | 20260910_164130-32772e4a | 20260910_164130-32772e4a | yes |
| swift-ui-kit-oskey-dev | 20260910_164134-9a75c7c6 | 20260910_164134-9a75c7c6 | yes |
| swift-webrtc-kit-oskey-io | 20260910_164132-e8aeea9d | 20260910_164132-e8aeea9d | yes |

## Step 2 — re-confirmed resolution numbers against real current files (not trusted from the table)

Read each file directly (`.crossModuleCallEdges`, `.sameModuleResolvedCalls`, `.unresolvedEligibleCalls` array lengths) rather than trusting the prompt's table:

| repo | crossModuleCallEdges | sameModuleResolvedCalls | unresolvedEligibleCalls | resolution rate |
|---|---|---|---|---|
| swift-ble-kit-oskey-dev | 0 | 71 | 174 | ~29% |
| swift-cloud-kit-oskey-dev | 0 | 188 | 322 | ~37% |
| swift-ui-kit-oskey-dev | 0 | 178 | 447 | ~28% |
| swift-webrtc-kit-oskey-io | 0 | 163 | 488 | ~25% |

**Exact match to the prompt's table.** `crossModuleCallEdges = 0` for all 4 confirmed — expected, each is a single-module kit repo. All 4 well above Node-IoT's 8% "not worth loading" threshold, so all 4 were loaded (no repo held back).

## Step 3 — ran `build-intra-repo-edges.ts` for each of the 4

Same `REPO_NAME=<repo> node -r ts-node/register pipeline/facts-postgres-index/build-intra-repo-edges.ts` invocation used for `android-intercom-oskey-io`/`ios-oskey-dev`.

| repo | edges built | dangling source_fact_id dropped | edges inserted |
|---|---|---|---|
| swift-ble-kit-oskey-dev | 245 | 0 (0.0%) | 245 |
| swift-cloud-kit-oskey-dev | 510 | 0 (0.0%) | 510 |
| swift-ui-kit-oskey-dev | 625 | 0 (0.0%) | 625 |
| swift-webrtc-kit-oskey-io | 651 | 0 (0.0%) | 651 |

**Real, notable finding:** unlike `ios-oskey-dev` (19% dangling) or `android-intercom-oskey-io` (0.03% dangling), all 4 kit repos had **zero** dangling `sourceCallFactId` values — built count equaled inserted count for every one, no "Dropped" line appeared in any run. Not assumed low because Kotlin was low; checked directly, per repo, and it happened to be zero across the board here. Plausible explanation (not confirmed further): these are smaller, less deeply-nested SwiftUI/library codebases than `ios-oskey-dev`'s app target, so the oversized-call-site-ID root cause documented in the script's own header (deeply nested SwiftUI view builders exceeding the 412-byte fact_id bound) simply didn't occur here as often.

## Step 4 — verification against live Postgres

**Edge counts** (matches step 3 exactly):

| repo | edges in `cross_repo_edges` | non-NULL `target_fact_id` |
|---|---|---|
| swift-ble-kit-oskey-dev | 245 | 0 |
| swift-cloud-kit-oskey-dev | 510 | 0 |
| swift-ui-kit-oskey-dev | 625 | 0 |
| swift-webrtc-kit-oskey-io | 651 | 0 |

**`target_fact_id` is NULL on all rows** for all 4 repos — confirmed directly (0 non-NULL out of 245/510/625/651), matching the Q2 decision documented in the script's own header (no symbol-level target resolution exists for this schema yet).

**Zero dangling `source_fact_id`** after insert, checked with the same `NOT EXISTS` query used for every other repo this batch — 0 dangling rows across all 4 repos, confirmed against live `facts`.

**Cross-repo isolation re-proven:** re-ran `swift-ble-kit-oskey-dev` a second time. It correctly reported `Removed 245 stale INTRA_REPO_CALL edge(s)` (its own prior 245, not 0 and not some other repo's count) before reinserting 245 fresh. Checked all 8 repos' `INTRA_REPO_CALL` edge counts before and after this second run — identical:

| repo | edges (before 2nd run) | edges (after 2nd run) |
|---|---|---|
| android-intercom-oskey-io | 3,589 | 3,589 |
| angular-app-oskey-io | 346 | 346 |
| firebase-oskey-dev | 2,363 | 2,363 |
| ios-oskey-dev | 7,071 | 7,071 |
| swift-ble-kit-oskey-dev | 245 | 245 |
| swift-cloud-kit-oskey-dev | 510 | 510 |
| swift-ui-kit-oskey-dev | 625 | 625 |
| swift-webrtc-kit-oskey-io | 651 | 651 |

No repo's rows were touched by another repo's run, including the 3 sibling kit repos loaded in the same batch.

## Step 5 — no billable step

Confirmed: pure Postgres writes from already-extracted JSON, no LLM/embedding call involved. Nothing to flag.

## Summary

All 4 Swift-kit repos loaded successfully, real numbers verified at every stage, no repo held back (all resolution rates well clear of the Node-IoT precedent). `cross_repo_edges` now carries real `INTRA_REPO_CALL` data for 8 repos total: Firebase (2,363), Angular (346), Kotlin/android-intercom (3,589), `ios-oskey-dev` (7,071), and the 4 Swift kits (245+510+625+651 = 2,031) — **15,400 real intra-repo edges total** across the batch.

## Standing rule compliance

No `git add`/`git commit` run. All changes (Postgres writes to `cross_repo_edges`, this findings doc) left uncommitted for the user to review and commit.
