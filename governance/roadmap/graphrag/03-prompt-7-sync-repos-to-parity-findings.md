# Prompt 7 — sync repos to parity: findings (2026-09-11)

Executed `prompts/prompt-7-sync-repos-to-parity.md` tasks 1–2 and estimated task 3. No commits made (standing rule).

## Task 1 — `extraction_runs.is_current` vs. real run directories

Queried Postgres directly, cross-checked against `output/runs/{repo}/` on disk for all 9 onboarded repos:

| repo | `is_current` run_id | latest dir on disk | match |
|---|---|---|---|
| android-intercom-oskey-io | 20260909_123417-a15cce18 | 20260909_123417-a15cce18 | yes |
| angular-app-oskey-io | 20260911_092322-8345d222 | 20260911_092322-8345d222 | yes |
| firebase-oskey-dev | 20260911_080454-00e1d9fd | 20260911_080454-00e1d9fd | yes |
| ios-oskey-dev | 20260910_164201-e660bda2 | 20260910_164201-e660bda2 | yes |
| node-iot-api-oskey-io | 20260911_080505-a6cba122 | 20260911_080505-a6cba122 | yes |
| swift-ble-kit-oskey-dev | 20260910_164127-f8cdf199 | 20260910_164127-f8cdf199 | yes |
| swift-cloud-kit-oskey-dev | 20260910_164130-32772e4a | 20260910_164130-32772e4a | yes |
| swift-ui-kit-oskey-dev | 20260910_164134-9a75c7c6 | 20260910_164134-9a75c7c6 | yes |
| swift-webrtc-kit-oskey-io | 20260910_164132-e8aeea9d | 20260910_164132-e8aeea9d | yes |

**Result: no mismatches.** `is_current` is genuinely current for every onboarded repo as of this check.

## Task 2 — resolved-graph build for the 4 blocked Swift-family repos

Confirmed before running: all 4 repos' current run dirs had `knowledge-pipeline/swift-extractor-raw.json` and `modules/` but no `resolved-engineering-graph.json`. `run-context.json` for each matched the current `is_current` run, so no rescan was needed first.

Correct step, confirmed by reading `package.json` + `pipeline/swift/phase-01-ast-extraction/04-build-resolved-graph.ts`: shared script driven by `REPO_NAME`, run as `REPO_NAME=<repo> npm run cloud:swift-04-build-resolved-graph`. (Not a per-repo script — the swift pipeline restructure on 2026-09-10 consolidated all swift-family repos onto shared numbered scripts.)

Ran it for all 4. Before/after — before: no `resolved-engineering-graph.json` existed for any of the 4. After:

| repo | crossModuleCallEdges | sameModuleResolvedCalls | unresolvedEligibleCalls | graphEligibleCallExpressions |
|---|---|---|---|---|
| swift-ble-kit-oskey-dev | 0 | 71 | 174 | 245 |
| swift-cloud-kit-oskey-dev | 0 | 188 | 322 | 510 |
| swift-ui-kit-oskey-dev | 0 | 178 | 447 | 625 |
| swift-webrtc-kit-oskey-io | 0 | 163 | 488 | 651 |

`resolved-engineering-graph.json` and `resolved-graph-matrix.md` were written to each repo's `knowledge-pipeline/` dir.

**Note:** `crossModuleCallEdges` is 0 for all 4 — expected, since each of these is a single-module kit repo; there's no second module within the repo itself to resolve a cross-module call against. Real cross-*repo* resolution (e.g. calls from `ios-oskey-dev` into these kits) is prompt #6's job once these graph files exist, per the original scope split — this task only had to get each repo to the point where a current graph file exists, which is now done.

## Task 3 — Swift embeddings cost estimate (NOT YET RUN — awaiting approval)

Queried `embedding_calls` for real historical per-fact token averages across the 4 repos already embedded:

| repo | avg tokens/fact | facts | tokens |
|---|---|---|---|
| android-intercom-oskey-io | 78.93 | 11,361 | 853,096 |
| angular-app-oskey-io | 80.58 | 19,535 | 1,583,235 |
| firebase-oskey-dev | 61.38 | 31,196 | 1,880,500 |
| node-iot-api-oskey-io | 62.94 | 2,542 | 160,349 |

Weighted average (total tokens / total facts across all 4): **69.27 tokens/fact**.

Confirmed real current state: `embedding IS NULL` for all Swift facts, all 5 repos, counts sum to exactly 33,714 as the prompt stated:

| repo | facts | embedded | missing |
|---|---|---|---|
| ios-oskey-dev | 25,458 | 0 | 25,458 |
| swift-ble-kit-oskey-dev | 799 | 0 | 799 |
| swift-cloud-kit-oskey-dev | 2,488 | 0 | 2,488 |
| swift-ui-kit-oskey-dev | 2,482 | 0 | 2,482 |
| swift-webrtc-kit-oskey-io | 2,487 | 0 | 2,487 |
| **total** | **33,714** | **0** | **33,714** |

Estimated cost at $0.20/M tokens (gemini-embedding-2, Vertex AI), applying the weighted avg tokens/fact to each repo's fact count:

| repo | facts | est. tokens | est. cost |
|---|---|---|---|
| ios-oskey-dev | 25,458 | 1,763,469 | $0.3527 |
| swift-ble-kit-oskey-dev | 799 | 55,347 | $0.0111 |
| swift-cloud-kit-oskey-dev | 2,488 | 172,343 | $0.0345 |
| swift-ui-kit-oskey-dev | 2,482 | 171,927 | $0.0344 |
| swift-webrtc-kit-oskey-io | 2,487 | 172,274 | $0.0345 |
| **TOTAL** | **33,714** | **2,335,360** | **$0.4671** |

This is a meaningfully larger single batch than anything embedded so far (largest prior was Firebase's 31,196 facts in aggregate over time, but the largest *single* repo previously cited was Firebase's ~1,760-fact increment — this is 33,714 facts in one pass across 5 repos). Real estimated total: **~$0.47**. Small in absolute terms, but per the standing rule this is flagged for explicit approval before running, not skipped because it's cheap.

**Approved by user.** Ran per-repo/per-module via `sync-facts.ts` with `EMBED=true` (matching the existing convention — the script is scoped to `REPO_NAME` + `MODULE_NAME`, not whole-repo, so `ios-oskey-dev` required 3 separate invocations for its 3 modules: `OSKDoorUnlockActivityExtension` (439 facts), `OSKEYTests` (87 facts), `iOS App` (24,932 facts, ran in background — foreground timeout). Did a dry run (no `EMBED=true`) on `swift-ble-kit-oskey-dev` first to confirm the invalidated-count (799) matched Postgres before spending anything.

### Real final cost (from `embedding_calls`, after run)

| repo | facts | real tokens | any truncated? |
|---|---|---|---|
| ios-oskey-dev | 25,458 | 4,188,153 | **yes** |
| swift-ble-kit-oskey-dev | 799 | 54,800 | no |
| swift-cloud-kit-oskey-dev | 2,488 | 162,427 | no |
| swift-ui-kit-oskey-dev | 2,482 | 241,390 | no |
| swift-webrtc-kit-oskey-io | 2,487 | 175,146 | no |
| **TOTAL** | **33,714** | **4,821,916** | — |

**Real final cost: $0.9644** (4,821,916 tokens × $0.20/M) — **~2.07x the $0.4671 estimate**. The estimate's weighted 69.27 tokens/fact (from TS/Kotlin repos) undershot Swift's real average of ~143 tokens/fact; `ios-oskey-dev` alone averaged ~164.5 tokens/fact, well above any previously-embedded repo. Real spend was still small in absolute terms (under $1), but the estimate should not be treated as a reliable predictor for future Swift-family batches — use the real 143 tokens/fact figure instead if estimating further Swift embedding work.

**Flag:** `ios-oskey-dev` had `any_truncated = true` on at least one embedding call — at least one fact's description exceeded the embedding model's input limit and was truncated. Not investigated further here (out of this task's scope); worth a follow-up to identify which fact(s) and whether the description-enrichment logic in `sync-facts.ts` (the Swift enum-case/type enrichment added 2026-09-10) is producing unusually long descriptions for some `ios-oskey-dev` facts specifically.

Confirmed after the run: `embedding IS NULL` count is now 0 across all 5 Swift repos, all 33,714 facts — `missing=0` everywhere, verified directly against Postgres.

## Standing rule compliance

No `git add`/`git commit` run. All changes (new `resolved-engineering-graph.json`/`resolved-graph-matrix.md` files per repo, this findings doc) are left uncommitted for the user to review and commit.
