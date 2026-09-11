# Prompt 2 of 5 — Firebase `stableFactId()` bounded-key fix

Copy everything below the line into a fresh Claude Code session in this repo.

---

Real bug, found 2026-09-11: `stableFactId()` folds a fact's `primaryKey`/`secondaryKey` verbatim into `facts.fact_id`, Postgres's own btree primary key. Found first in Swift (a ~28,000-char SwiftUI call chain broke the btree index-row limit), fixed there, then fixed properly in Angular the same day (`pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`, commit `2d56b54`) — read that diff first, it's the real precedent to follow for method, **not for the exact numbers**.

`stableFactId()` is independently duplicated in `pipeline/firebase-oskey-dev/phase-01-ast-extraction/02-build-module-evidence.ts` (same unbounded design, structurally identical function, never fixed). Your job is to fix it for this repo specifically, doing your own real measurement — **do not reuse Angular's `MAX_ID_COMPONENT_LENGTH = 2000` or its empirical ceiling number.** Firebase's own known real max (`argSig`, 8,223 chars per `governance/roadmap/consolidation/typescript.md` §2d) is already higher than Angular's was (6,798), and this is a much larger repo (544 files, 6,655 call expressions vs. Angular's smaller scale) — its real compressibility and combined-worst-case math need their own check, not an assumed inheritance from Angular's numbers.

## What to actually do

1. **Read Firebase's real, current `stableFactId()`** and Angular's now-fixed version (`git show 2d56b54 -- pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`) for the *method* — empirical ceiling test, combined-worst-case sizing, accepting a small known re-ID cost rather than engineering the threshold down to touch zero facts.

2. **Establish this repo's real, current field-length distribution.** Query Firebase's real extracted evidence for the current max length of every field that flows into a `primaryKey` or `secondaryKey` across every fact kind that calls `stableFactId()` here — not just `call_expression`. Report the real numbers.

3. **Determine the real Postgres ceiling empirically, for this repo's own text, not Angular's.** Use the local `facts-postgres-index-local` instance, a scratch table with an identical single-column btree PK — same method Angular's fix used (test pure-random/incompressible text, and this repo's own real longest values repeated/extended to approximate genuine compressibility), find where it actually breaks. This is cheap; do it rather than reusing Angular's ~9,400-char figure, which was specific to Angular's own text.

4. **Pick a threshold sized against the combined worst case** (a single `fact_id` can carry a bounded `primaryKey` *and* a bounded `secondaryKey` simultaneously, plus this repo's own real fixed overhead — type/module/file-path length), with real deliberate safety margin under this repo's own empirical ceiling from step 3 — not the bare minimum that avoids touching today's facts. If a well-justified threshold re-IDs some of today's facts, that's fine and expected; report how many and don't reverse-engineer the number to make it zero. State your reasoning for the exact number chosen.

5. **Verify for real:**
   - Re-run this repo's real extraction/build steps so the new logic actually executes against real data.
   - Compare the full set of fact_ids before and after — report exactly how many changed.
   - Prove the bound works on a pathological case (synthetic value beyond your threshold, confirm deterministic bounded output).
   - Confirm the hash is computed over the *full* original value, not the truncated prefix (Angular's fix got this right — two different values sharing the same truncated prefix must still get different bounded IDs).
   - Report all real numbers: max field lengths found, empirical ceiling found, threshold chosen and why, real count of changed fact_ids.

6. **Before any billable step (an embedding call), produce a real cost estimate first, then ask before running it** — small cost is fine, informed is what matters:
   - Query `embedding_calls` for this repo's own recent real rows (`SELECT model, fact_count, total_token_count FROM embedding_calls WHERE repo = 'firebase-oskey-dev' ORDER BY called_at DESC LIMIT 10`) for this repo's own real per-fact token average.
   - `gemini-embedding-2` is $0.20 per million tokens on Vertex AI (verified 2026-09-11).
   - **Real, known context you should account for in your estimate, not be surprised by**: Firebase has its own real backlog of 1,740 `imports_dependency` facts with stale/unenriched embeddings (per the same consolidation audit, §2d/§4) — separate from this fix's own re-IDed facts. If re-embedding this backlog alongside the fix's own changed facts is in scope, say so and include it in the estimate explicitly (this is a real, deliberate scope choice to offer, the way it worked out for Angular — not a default to assume either way). Ask before running either.

7. **Leave the change uncommitted.** Report your real verification numbers plainly.

If anything doesn't hold up once you're in the real code (more fact kinds than expected feed `primaryKey`/`secondaryKey`, the empirical ceiling behaves differently than Angular's), say so directly rather than forcing Angular's plan to fit.
