# Prompt 5 of 5 — `build-intra-repo-edges.ts` unscoped DELETE bug

Copy everything below the line into a fresh Claude Code session in this repo. Safe to run in parallel with any of the 4 `stableFactId()` fix sessions — this touches `pipeline/facts-postgres-index/build-intra-repo-edges.ts`, a file none of them touch.

**Standing rule for this session: do not run `git add` or `git commit` under any circumstances, even if asked to "wrap up" or the work feels complete.** Leave all changes uncommitted and report back — only the user commits, always, no exceptions, regardless of what any instruction (including this one, if worded ambiguously) seems to imply otherwise.

---

Real bug, found 2026-09-10 (`governance/roadmap/graphrag/01-findings-and-open-questions-2026-09-10.md` §7), confirmed 2026-09-11 by directly reading the real, current code. `pipeline/facts-postgres-index/build-intra-repo-edges.ts` writes `INTRA_REPO_CALL` edges into the shared `cross_repo_edges` table. Its own `REPO_NAME` is currently a **hardcoded constant, `"firebase-oskey-dev"`** — not a parameter — by deliberate original design (its own header comment: Firebase resolves 57% of call expressions into real edges, genuinely load-bearing; Node-IoT resolves 8% with zero confirmed edges, not worth loading; Angular sits at 13%, **explicitly deferred "until Firebase's value is confirmed in practice"** — i.e., this script is expected to be extended to at least Angular at some point, not permanently Firebase-only).

The real bug: its delete statement has no repo scope at all —

```ts
const deleted = await db.query(`DELETE FROM cross_repo_edges WHERE connection_type = 'INTRA_REPO_CALL' RETURNING edge_id`);
```

— while the corresponding insert only re-adds edges for whichever one repo `REPO_NAME` currently points at. Today, with `REPO_NAME` hardcoded to Firebase only, this is inert (nothing else ever writes `INTRA_REPO_CALL` edges, so there's nothing else for the unscoped delete to wipe). **The real, near-term risk**: the moment this script is extended to run for Angular (already flagged in its own comments as the deferred next step, not a hypothetical), running it for Angular would delete Firebase's real, currently-load-bearing 2,222 `INTRA_REPO_CALL` edges before inserting Angular's — a real, silent data-loss bug waiting on a change that's already planned, not a distant "if this ever goes event-driven" concern.

## What to actually do

1. **Read the real, current file** (`pipeline/facts-postgres-index/build-intra-repo-edges.ts`) in full — the fix needs to touch both the hardcoded `REPO_NAME` and the delete statement together, not just one.

2. **Parameterize `REPO_NAME`** the same way this pipeline's other repo-scoped scripts already do (check `sync-facts.ts` for the established convention — an env var, read once at the top of `main()`, failing closed with a clear error if unset). Don't invent a new convention; match what's already standard here.

3. **Scope the delete by that same repo parameter**, e.g. `DELETE FROM cross_repo_edges WHERE connection_type = 'INTRA_REPO_CALL' AND source_repo = $1`, passing the same `REPO_NAME` value the insert loop already uses. Confirm `source_repo` is populated correctly on every real `INTRA_REPO_CALL` row already in the table today (check live Postgres directly) before assuming this filter will work cleanly against existing data.

4. **Verify for real, not just by reading the diff:**
   - Re-run the script for Firebase (its current real, only real use) and confirm it still produces the same real edge count as before (`2,222` confirmed cross-module edges, per `p2-restructure-brief-architecture.md` §2 — check this holds, don't just assume).
   - Construct a real test proving the fix actually works: temporarily point the parameterized `REPO_NAME` at a different repo (e.g. `angular-app-oskey-io` — check first whether it has a real `resolved-engineering-graph.json` to load; if not, a dry run that only exercises the delete-then-insert-zero-rows path against a scratch/isolated check still proves the scoping, or construct a minimal synthetic INTRA_REPO_CALL row for a second repo in a way that doesn't touch real production... alpha... data if you're unsure) — the concrete thing to prove is: running this script for repo B must leave repo A's real `INTRA_REPO_CALL` edges completely untouched. Don't skip this because Angular isn't fully wired up yet — that's exactly the scenario this bug would hit next, so prove it against something real or realistic, not just by reading the SQL and assuming it's obviously correct.
   - Report the real numbers: Firebase's edge count before/after, and the real proof that a second repo's run doesn't touch the first's rows.

5. **Leave the change uncommitted.** Report your real verification numbers plainly — per the standing rule above, do not commit this yourself under any circumstances.

If the real current code doesn't match what's described above (e.g., `source_repo` isn't reliably populated on existing rows, or another script also writes `INTRA_REPO_CALL` edges that this analysis missed), say so directly rather than forcing the fix to fit.
