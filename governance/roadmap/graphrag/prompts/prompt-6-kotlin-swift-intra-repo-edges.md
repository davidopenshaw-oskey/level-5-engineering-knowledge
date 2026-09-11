# Prompt 6 — extend `build-intra-repo-edges.ts` for Kotlin/Swift's real schema

Copy everything below the line into a fresh Claude Code session in this repo.

**Standing rule: do not run `git add` or `git commit` under any circumstances.** Leave all changes uncommitted and report back — only the user commits, always.

---

`pipeline/facts-postgres-index/build-intra-repo-edges.ts` writes real `INTRA_REPO_CALL` edges into `cross_repo_edges`, reading a repo's `resolved-engineering-graph.json`. It was just fixed today (parameterized `REPO_NAME`, delete scoped by `source_repo`) and verified against the 3 TS repos (`firebase-oskey-dev`, now `angular-app-oskey-io` too; `node-iot-api-oskey-io` confirmed a real no-op — 0 confirmed/probable edges, matches its known 8%-resolution finding, not worth loading).

**It has never been run for Kotlin or Swift, and it structurally cannot be — not a config gap, a real schema mismatch.** Checked directly: `android-intercom-oskey-io`'s and the Swift family's own `resolved-engineering-graph.json` files use a completely different real schema than the TS repos' —

- TS schema (what the script parses today): `confirmedCallEdges` / `confirmedIntraModuleCallEdges` / `probableCallEdges` / `probableIntraModuleCallEdges` / `unresolvedCallEdges`.
- Kotlin/Swift's real schema (confirmed by reading the actual files): `crossModuleCallEdges` / `sameModuleResolvedCalls` / `unresolvedEligibleCalls` (Swift's also has an extra top-level `implicitMemberExpressionCalls` key Kotlin doesn't have — check what it real is before assuming it should or shouldn't become edges too).

**Real, checked consequence of this mismatch, worth knowing before you start**: running the current script against Kotlin/Swift as-is would not error — every field lookup falls back to an empty array (`graph.confirmedCallEdges ?? []`), so it would silently write **zero edges**, which could be misread as "these repos have no real intra-module calls" when it actually just means the parser can't see their real data at all. Kotlin's real numbers (checked directly, current run `20260909_123417-a15cce18`): **41 `crossModuleCallEdges` + 608 `sameModuleResolvedCalls` = 649 real resolved edges, against 2,941 `unresolvedEligibleCalls`** (~18% resolution) — real, meaningful data, worth loading properly, not a formality check.

## What to actually do

1. **Read the real, full field shapes** for `crossModuleCallEdges`, `sameModuleResolvedCalls`, and `unresolvedEligibleCalls` in both Kotlin's and Swift's real files (don't assume Swift matches Kotlin just because the top-level keys mostly match — check for real, and figure out what `implicitMemberExpressionCalls` actually is on the Swift side before deciding how or whether to handle it). Compare against the existing `fromConfirmedCallEdges`/`fromConfirmedIntraModuleCallEdges`/`fromUnresolvedCallEdges` functions already in `build-intra-repo-edges.ts` — the `Edge` interface they produce (`sourceSymbol`, `sourceFactId`, `targetSymbol`, `targetFactId`, `resolutionStatus`, `details`) is what you're mapping *into*, not necessarily the same field-by-field shape you're mapping *from*.

2. **Check the real disparity per repo before writing anything** — the same discipline that originally decided Firebase was worth loading and Node-IoT wasn't. For Kotlin (already checked above, looks worth it) and **each of the 5 Swift-family repos individually** (`ios-oskey-dev`, `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`) — get the real `crossModuleCallEdges`/`sameModuleResolvedCalls`/`unresolvedEligibleCalls` counts and resolution rate for each, and report them plainly before loading anything. Don't assume every repo is worth it just because Kotlin was.

3. **Check `resolution_status`'s real allowed values before mapping into it** — `cross_repo_edges.resolution_status` is `'resolved' | 'confirmed' | 'probable' | 'unresolved'` per the schema (`pipeline/facts-postgres-index/schema-proposal.sql`). Kotlin/Swift's schema doesn't appear to have TS's three-tier confirmed/probable split (just resolved-or-not, from what's visible in the sample data) — confirm this directly against the real full data before picking which value(s) to use, don't guess.

4. **Write new parser functions in the same file** (`build-intra-repo-edges.ts`) for this schema — extend the existing script rather than duplicating it, since the DB-write logic (now correctly repo-scoped) is shared infrastructure worth reusing, not a separate concern. Whether to select the parser by repo name, by detecting which schema shape is present, or some other real, sensible dispatch is your call — state your reasoning.

5. **Verify for real, per repo you actually load:**
   - Real edge counts written, matching what you found and reported in step 2.
   - Re-run for a repo a second time and confirm the delete-then-reinsert is still correctly scoped (doesn't touch any other repo's rows) — the same proof the original bug-fix session already did for Firebase/Angular, just extended to these new repos.
   - The same dangling-fact_id check already done for Angular: confirm every inserted edge's `source_fact_id`/`target_fact_id` actually exists in the current `facts` table (`WHERE NOT EXISTS (SELECT 1 FROM facts f WHERE f.fact_id = e.source_fact_id)` — zero expected).
   - Report all real numbers, repo by repo.

6. **No billable step is expected in this task** (reading already-extracted JSON into Postgres, no LLM/embedding calls) — if you find one is actually needed somewhere, flag the real cost before running it rather than assuming there's none.

7. **Leave all changes uncommitted.** Report your real verification numbers plainly, per the standing rule above.

If any repo's real data doesn't match what's described above once you're actually in it, say so directly rather than forcing the plan to fit — this is genuinely new territory (Kotlin/Swift's `04-build-resolved-graph.ts`-equivalent script's real output has not been used by anything downstream before).
