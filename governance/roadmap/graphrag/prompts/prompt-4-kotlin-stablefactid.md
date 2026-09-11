# Prompt 4 of 5 — Kotlin (android-intercom) `stableFactId()` bounded-key fix

Copy everything below the line into a fresh Claude Code session in this repo. **Other sessions may be running the equivalent fix for `firebase-oskey-dev` and/or `node-iot-api-oskey-io` concurrently right now** — different files, no conflict, but you share the same local Postgres instance: use a distinctly-named scratch table for any empirical test, don't assume exclusive DB access.

---

Real bug, found 2026-09-11: `stableFactId()` folds a fact's `primaryKey`/`secondaryKey` verbatim into `facts.fact_id`, Postgres's own btree primary key — btree indexes have a hard, physical per-entry size limit (~2,704-2,712 bytes, a structural property of 8KB btree pages) independent of how large a plain `text` column could otherwise hold. Found first in Swift (a ~28,000-char SwiftUI call chain broke it), fixed there and in Angular/Firebase since (`pipeline/angular-app-oskey-io/.../02-build-module-evidence.ts` commit `2d56b54`; Firebase fixed the same day, see `governance/roadmap/consolidation/typescript.md` §6 for its own numbers) — each via its own real empirical measurement, not a copied number.

`stableFactId()` is independently duplicated in `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts` (same unbounded design, never fixed). **This one is a real, elevated-risk case, not just a latent-by-precedent check**: `android-intercom-oskey-io` uses Jetpack Compose (confirmed real, `@Composable`/`androidx.compose` present in the live source) — Android's own equivalent of SwiftUI's declarative, chained-modifier UI style (`.padding().background().clickable()...`), the exact same root cause as Swift's original failure. And this repo's own `call_expression.primaryKey` is `item.calleeExpression` — the same *kind* of field (callee text) that broke Swift, not a different field like Firebase's case turned out to be. Go in expecting a real find here, not a formality.

## What to actually do

1. **Read this repo's real, current `stableFactId()`** (note: its signature is leaner than the TS repos' — no `repo`/`line`/`sourceStart` fields, closer to Swift's shape) and the method used in Angular's/Firebase's fixes (`git show 2d56b54 -- pipeline/angular-app-oskey-io/phase-01-ast-extraction/02-build-module-evidence.ts`, and read `governance/roadmap/consolidation/typescript.md` §6 for Firebase's numbers/reasoning) — for the *method*, not the numbers.

2. **Establish this repo's real, current field-length distribution** across every fact kind that calls `stableFactId()` here — `call_expression`'s `calleeExpression` first (the most likely real risk, per the Compose reasoning above), but check every other fact kind's `primaryKey`/`secondaryKey` source field too, the same discipline Firebase's fix used to correctly find its risk was in `secondaryKey`, not the field that seemed obvious at first. Report the real numbers, including the single longest real value found and which fact kind/field it came from.

3. **Determine the real Postgres ceiling empirically for this repo's own text** — same method as the others, a scratch table on the shared local `facts-postgres-index-local` instance (distinctly named per the concurrency note above), using this repo's own real longest values (concatenated/repeated to approximate genuine worst-case compressibility if nothing today is close to breaking) plus a pure-random/incompressible control. Don't reuse Angular's or Firebase's ceiling numbers.

4. **Pick a threshold sized against the combined worst case** (bounded `primaryKey` + bounded `secondaryKey` + this repo's own real fixed overhead), with real deliberate safety margin under your own empirical ceiling. If a well-justified threshold re-IDs some of today's 9,750 already-embedded facts, that's a known, accepted cost — report the real count, don't engineer the number down to avoid it.

5. **Verify for real:**
   - Re-run this repo's real extraction/build steps.
   - Compare fact_ids before and after — report the real count changed.
   - Prove the bound works on a pathological case (synthetic value beyond your threshold, deterministic bounded output).
   - Confirm the hash is computed over the *full* original value, not the truncated prefix.
   - Report all real numbers.

6. **Before any billable step, produce a real cost estimate first, then ask before running it:**
   - Query `embedding_calls` for this repo's own recent real rows (`WHERE repo = 'android-intercom-oskey-io'`) for its real per-fact token average.
   - `gemini-embedding-2` is $0.20 per million tokens.
   - Unlike Firebase/Node-IoT, this repo's `imports_dependency` descriptions are already fully enriched (244/244, confirmed in `governance/roadmap/consolidation/kotlin-android.md` §4) — no separate backlog to consider bundling here, this estimate should just be about the fix's own re-IDed facts.

7. **Leave the change uncommitted.** Report your real verification numbers plainly.

If this repo's real numbers turn out different from what's expected above (e.g., the Compose-chaining risk doesn't materialize the way anticipated, or a different fact kind entirely carries the real longest values), say so directly — the Compose reasoning is a real, informed expectation, not a certainty to force the results to match.
