# Session hand-off — stableFactId bounding pass, 2026-09-11

Real, specific hand-off at session close (user hitting a real session usage limit, resetting in ~1 hour) — per this project's own documentation discipline. Mid-flight on the 5-part `stableFactId()` bounded-key fix batch that followed the graphrag investigation's conclusion (`01-findings-and-open-questions-2026-09-10.md` §10). Prompts for all drafted-so-far fixes are saved in `governance/roadmap/graphrag/prompts/` (moved there from the session scratchpad, which does not survive a session boundary — don't look for them anywhere else).

## Read first

1. **`01-findings-and-open-questions-2026-09-10.md` §10** — why this batch of fixes exists (the real architectural conclusion: decompose PRD generation by capability, not a report tier; pgVector schema stays; clean up real bugs found along the way, including this one).
2. **This file**, for exact current state.
3. **`governance/roadmap/consolidation/typescript.md` §6** — Firebase's own real numbers, written by that fix session itself.

## Real, current state of the 5-part fix batch

| # | Repo | Status | Real numbers |
|---|---|---|---|
| 1 | `angular-app-oskey-io` | **DONE, verified, committed** (`2d56b54`) | `MAX_ID_COMPONENT_LENGTH = 2000`; 17/3,584 real `call_expression` facts re-IDed (0.47%); embedded, cost **$0.0114** (512 facts total — 17 from this fix + a bundled 491-fact `imports_dependency` backlog + minor drift, user approved bundling live in-session) |
| 2 | `firebase-oskey-dev` | **Fix done, verified, uncommitted.** Doc updated (`consolidation/typescript.md` §6). **Real, live decision still pending in that session**: whether to embed just the 11 changed facts (~$0.0002) or bundle with the 1,740-fact `imports_dependency` backlog too (~$0.025) | `MAX_ID_COMPONENT_LENGTH = 2000` (independently derived, not copied — landed near Angular's number by coincidence); real risk driver was `secondaryKey` (`callerName\|argSig`, max 8,228 chars), not `primaryKey` (max only 1,659) — opposite of Angular. Pre-fix worst case already at 8,330 chars, ~91% of the empirical ~9,100-char ceiling — a real, live near-miss. 11/6,655 facts re-IDed (0.17%) |
| 3 | `node-iot-api-oskey-io` | **In progress, not complete.** Only the `crypto` import has landed as of this note (1-line diff) — the actual `boundedIdComponent()`/threshold work has not been written yet. Check this first when resuming. | none yet |
| 4 | `android-intercom-oskey-io` (Kotlin) | **Fix done, verified, embedded, uncommitted.** Compose-chaining hypothesis confirmed directly (unlike Firebase): risk was in `primaryKey` (`calleeExpression`), a 3,707-char chained `Modifier.size().clip().clickable{...}` block in `app/.../OSKAccessesScreen.kt` — every other fact kind's own real max component length is under 111 chars. | `MAX_ID_COMPONENT_LENGTH = 2000` (independently derived: this repo's own real fixed overhead ~175 chars, empirical ceiling 9,378 succeeds/9,416 fails on a concatenation of 30 distinct real longest `calleeExpression` values — a single value repeated was rejected as a test method mid-session for being artificially compressible past 100,000 chars; pure-random control failed at 2,712, consistent with Angular/Firebase). Combined worst case ~4,219 chars, ~2.2x margin. Exactly 1 of 9,750 real facts re-IDed (0.01%) — the single facts row confirmed via direct `git diff`-independent before/after fact_id comparison, not self-report. Pathological synthetic case (49,950 chars) proven deterministic, hash-over-full-value (not truncated prefix), and shared-prefix variants still disambiguated. Real pipeline re-run (`02` → `05-partition-capability-packs` → `sync-facts.ts` for module `app`), synced, and embedded for real: cost was $0.0001022 (511 tokens, `gemini-embedding-2` @ $0.20/M) — user approved before running. Postgres confirms 9,750/9,750 facts embedded, new max `fact_id` length 2,146 (down from 3,831). Code change itself left uncommitted per this repo's git-commit rule. |
| 5 | `build-intra-repo-edges.ts` scoping bug | **Not started, prompt not yet drafted.** Real bug: `DELETE FROM cross_repo_edges WHERE connection_type = 'INTRA_REPO_CALL'` has no repo filter, silently wipes every other repo's intra-repo edges when run for just one repo (`graphrag/01-...md` §7). Touches a shared file none of the 4 stableFactId fixes touch — safe to run in parallel with any of them. | n/a |

## Real, established method (apply to #3 completion, #4, and #5 the same way)

Every fix in this batch does its **own** empirical measurement — never reuse another repo's threshold or ceiling number. Per prompt, in order: (1) read the real current field-length distribution across every `stableFactId()`-feeding fact kind, not just `call_expression`; (2) determine the real Postgres ceiling empirically on the shared local `facts-postgres-index-local` instance (a distinctly-named scratch table if another fix session is running concurrently — check `docker exec facts-postgres-index-local psql -U facts_index -d facts_index` works before assuming); (3) size the threshold against the *combined* worst case (bounded `primaryKey` + bounded `secondaryKey` + this repo's real fixed overhead), with real safety margin — not the bare minimum that avoids re-IDing today's facts; (4) verify for real (before/after fact_id diff count, a synthetic pathological-case proof, confirm the hash is over the *full* value not the truncated prefix); (5) before any billable embed step, produce a real cost estimate from that repo's own `embedding_calls` history (`gemini-embedding-2` = $0.20/M tokens) and ask before running it — small cost is fine, informed is what matters, don't design around avoiding it.

**Verification discipline, learned the hard way this session**: don't trust a fix session's self-report at face value — independently check the real diff (`git diff --stat`, then read it) and query `embedding_calls` directly for the real numbers before treating anything as confirmed. Angular's reported "17 facts, trivial cost" turned out to be a real, correctly-explained $0.0114/512-fact number once the bundled backlog decision was accounted for — not wrong, just underspecified until checked.

## Real, still-open items not part of this fix batch (don't conflate)

- **Report-coverage gap** (`01-...md` §6): 6 of 9 repos lack the narrative-synthesis layer — benched, separate investigation, not this batch's job.
- **The next Kotlin repo** (the actual Android phone app, heavy Compose UX, analogous to `ios-oskey-dev`) isn't onboarded yet — nothing to fix there now. When it is, the first real step is this same measure-first method, not porting `android-intercom-oskey-io`'s or Swift's threshold blindly ([[project_swift_kotlin_prep]] memory has this recorded).
- **ADR-005/006 status lines** still say "Proposed" despite most of their direction being live — a real, still-pending housekeeping item from `01-...md` §10 conclusion 3, not touched this session.
- **Swift's embeddings**: still zero, across all 33,714 facts — a real, explicit, costed decision not yet made, unrelated to this fix batch.

## Immediate next steps, in order

1. Check on / resume the Node-IoT session (#3) — confirm whether it's still running or stalled.
2. Decide Firebase's (#2) bundling question (or let that session's own user prompt resolve it) and commit once resolved.
3. ~~Open Kotlin (#4)~~ **Done 2026-09-11** — fix verified, embedded, uncommitted (see table above).
4. Draft and run #5 (edge-scoping bug fix) — can run parallel to any of the above, different file.
5. Once all 5 are done and committed individually, re-check `git status` for a clean tree before considering this batch closed.
