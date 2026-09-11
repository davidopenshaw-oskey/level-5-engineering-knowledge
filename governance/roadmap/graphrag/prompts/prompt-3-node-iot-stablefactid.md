# Prompt 3 of 5 — Node-IoT `stableFactId()` bounded-key fix

Copy everything below the line into a fresh Claude Code session in this repo. **Note: a separate session may be running the equivalent fix for `firebase-oskey-dev` concurrently right now** — you don't touch the same file, but you do share the same local Postgres instance, so if you run any empirical scratch-table test, use a table name unlikely to collide (e.g. include this repo's name or a timestamp in the table name), and don't assume you have exclusive use of the DB.

---

Real bug, found 2026-09-11: `stableFactId()` folds a fact's `primaryKey`/`secondaryKey` verbatim into `facts.fact_id`, Postgres's own btree primary key — btree indexes have a hard, physical per-entry size limit (~2,704-2,712 bytes, a structural property of 8KB btree pages, not a column-size limit) independent of how large a plain `text` column could otherwise hold. Found first in Swift (a ~28,000-char SwiftUI call chain broke it), fixed there, then fixed properly in Angular (`pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`, commit `2d56b54`) via its own real empirical measurement, not a copied number. Firebase is getting the same treatment concurrently.

`stableFactId()` is independently duplicated in `pipeline/node-iot-api-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` (same unbounded design, structurally identical function, never fixed). Your job is to fix it here, with your own real measurement — **do not reuse Angular's or assume Firebase's numbers.** This repo is known to run much smaller already (per `governance/roadmap/consolidation/typescript.md` §2d, its own real max component length was measured around 1,385 characters — far below Angular's 6,798 or Firebase's 8,223) — real, low risk today, but still fix it properly for the same reason Angular and Firebase were: not "is it needed today," but making the invariant hold everywhere, since this repo's own real code will keep changing.

## What to actually do

1. **Read this repo's real, current `stableFactId()`**, and Angular's fixed version for the *method* (`git show 2d56b54 -- pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`) — empirical ceiling test, combined-worst-case sizing, accepting a small known re-ID cost rather than forcing zero.

2. **Establish this repo's real, current field-length distribution** across every fact kind that calls `stableFactId()` here, not just `call_expression`. Given this repo's known-smaller scale, it's plausible (not assumed) that nothing here comes close to any real risk — confirm that with real numbers rather than skipping the check because it's expected to be fine.

3. **Determine the real Postgres ceiling empirically for this repo's own text** — same method as Angular/Firebase, a scratch table on the shared local `facts-postgres-index-local` instance (use a distinctly-named table, per the concurrency note above). Given this repo's small real scale, this step matters more for the *synthetic pathological-case proof* in step 5 than for finding an active near-miss.

4. **Pick a threshold sized against the combined worst case** (bounded `primaryKey` + bounded `secondaryKey` + this repo's own real fixed overhead), with real safety margin under your own empirical ceiling — not reused from Angular or Firebase. If it happens to re-ID zero or very few facts here given the smaller real scale, that's a fine, real outcome — just confirm it with the actual before/after count, don't assume it.

5. **Verify for real:**
   - Re-run this repo's real extraction/build steps.
   - Compare fact_ids before and after — report the real count changed.
   - Prove the bound works on a pathological case: since this repo's real data may not have anything close to your threshold, construct a synthetic value well beyond it and confirm deterministic, bounded output.
   - Confirm the hash is computed over the *full* original value, not the truncated prefix.
   - Report all real numbers.

6. **Before any billable step, produce a real cost estimate first, then ask before running it:**
   - Query `embedding_calls` for this repo's own recent real rows (`WHERE repo = 'node-iot-api-oskey-io'`) for its real per-fact token average.
   - `gemini-embedding-2` is $0.20 per million tokens.
   - **Known context**: this repo has its own smaller real backlog — 72 `imports_dependency` facts with stale/unenriched embeddings (per the same consolidation audit). If bundling that into this pass makes sense, offer it explicitly and ask, the way Angular's session did — don't assume either way.

7. **Leave the change uncommitted.** Report your real verification numbers plainly.

If this repo's real numbers turn out different from what's assumed above (e.g., some fact kind other than `call_expression` actually carries the longest real values here), say so directly rather than forcing the plan to fit.
