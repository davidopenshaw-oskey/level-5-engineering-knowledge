# Prompt 8 — complete intra-repo edge loading for the 4 Swift-kit repos

Copy everything below the line into a fresh Claude Code session in this repo. Check `git status` first regardless of what's expected — other sessions may be active.

**Standing rule: do not run `git add` or `git commit` under any circumstances.** Leave all changes uncommitted and report back — only the user commits, always.

---

`pipeline/facts-postgres-index/build-intra-repo-edges.ts` already supports Kotlin/Swift's real schema (`crossModuleCallEdges`/`sameModuleResolvedCalls`/`unresolvedEligibleCalls`) — built and committed 2026-09-11 while loading `android-intercom-oskey-io` (3,589 edges) and `ios-oskey-dev` (7,071 edges). This task is pure execution against that already-working code, not new development: the 4 Swift-kit repos (`swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`) were blocked at the time (no `resolved-engineering-graph.json` for their current run) but a separate task since re-ran their resolved-graph build step — all 4 now have real, current graph files (`governance/roadmap/graphrag/03-prompt-7-sync-repos-to-parity-findings.md` Task 2 has the real per-repo counts).

## What to actually do

1. **Confirm each of the 4 repos' current run still has a real `resolved-engineering-graph.json`** and that its `runId` matches the live `is_current` run in Postgres (the script's own freshness check will fail-closed if not, but confirm directly first rather than finding out from an error).

2. **Real, known numbers already found for these 4** (Task 2 of the prompt-7 findings doc) — real, meaningful resolution rates, all in a similar 25-37% range, well above Node-IoT's known "not worth it" 8%:

   | repo | sameModuleResolvedCalls | unresolvedEligibleCalls | rough resolution rate |
   |---|---|---|---|
   | swift-ble-kit-oskey-dev | 71 | 174 | ~29% |
   | swift-cloud-kit-oskey-dev | 188 | 322 | ~37% |
   | swift-ui-kit-oskey-dev | 178 | 447 | ~28% |
   | swift-webrtc-kit-oskey-io | 163 | 488 | ~25% |

   Re-confirm these against the real, current files before loading (don't just trust this table — it's from an earlier pass, verify it still holds). `crossModuleCallEdges` was 0 for all 4 last checked — expected, since each is a single-module kit repo (no second module within the repo to resolve a cross-module call against).

3. **Run the existing script for each of the 4** (`REPO_NAME=<repo> ...`, same invocation pattern as `android-intercom-oskey-io`/`ios-oskey-dev`). Watch for the known dangling-source-fact_id issue found during the Swift load (some `sourceCallFactId` values didn't match any real `fact_id` — 19% dangling rate for `ios-oskey-dev`, 0.03% for Kotlin) — the existing filter should already handle this safely (drop, don't insert a broken reference), but report the real dangling rate for each of these 4 repos too; don't assume it'll be low just because it was low for Kotlin.

4. **Verify for real, per repo:**
   - Real edge count inserted, matching what you found in step 2.
   - Zero dangling `source_fact_id`/`target_fact_id` after insert (the same check already used for every other repo this batch: `WHERE NOT EXISTS (SELECT 1 FROM facts f WHERE f.fact_id = e.source_fact_id)`).
   - Re-run once more for one of the 4 and confirm the delete-then-reinsert is still correctly scoped (doesn't touch any other repo's rows, including the other 3 in this same batch) — cross-repo isolation, the same proof already done for Firebase/Angular/Kotlin/Swift.
   - Confirm `target_fact_id` is NULL on all rows (per the Q2 decision already made and documented in the file's own header) — this schema still has no real target symbol.

5. **No billable step is involved** (pure Postgres writes from already-extracted JSON) — nothing to estimate or flag here.

6. **Leave all changes uncommitted.** Report your real verification numbers plainly, per the standing rule above.

If any of these 4 repos' real current data doesn't match what's expected (a repo's resolution rate looks too low to be worth loading, matching Node-IoT's precedent — check and say so rather than loading everything by default), say so directly rather than forcing all 4 through uniformly.
