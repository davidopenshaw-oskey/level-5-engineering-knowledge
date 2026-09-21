# Findings: Swift/iOS Phase 1 structural knowledge-pipeline "gap"

Investigation run 2026-09-20 per the hand-off prompt in
`19-investigation-prompt-swift-phase1-structural-gap-2026-09-20.md`. Read-only: git history,
code reading, local `output/runs/` inspection, one Postgres-adjacent script read. No real
spend incurred (no LLM/embedding calls). No git add/commit run.

## Headline finding: the premise is wrong — the gap doesn't exist the way doc 13/19 describe it

Doc 13's `find pipeline -iname "*04-build-resolved-graph.ts"` search returned nothing for
`ios-oskey-dev` or the 4 Swift-kit repos because it was checking **per-repo** pipeline
directories (`pipeline/<repo-name>/phase-01-ast-extraction/`) — the pattern used by the 4 TS
repos and by `android-intercom-oskey-io` (Kotlin). Swift doesn't follow that pattern: all 5
Swift/iOS repos share **one** pipeline directory, `pipeline/swift/phase-01-ast-extraction/`,
which does contain `04-build-resolved-graph.ts` through `07-build-intra-module-coupling-graph.ts`
(confirmed present, read in full for script 04). `pipeline/ios-oskey-dev/` only holds its own
`00-scan-repo.ts` (repo-specific clone/checkout logic); steps 01-07 for `ios-oskey-dev` are the
shared `pipeline/swift/` scripts, invoked with `REPO_NAME=ios-oskey-dev`.

More importantly: **this shared pipeline has actually run to completion for all 5 repos.**
Checked `output/runs/<repo>/*/knowledge-pipeline/modules/<module>/` for every one of the 5
repos — each has at least one historical run (all dated 2026-09-10) containing the full 04-07
output set: `cross-module-dependencies.json` (06) and `intra-module-coupling.json` (07), plus
04's `resolved-engineering-graph.json` / `resolved-graph-matrix.md` and 05's
`capability-packs/`. This is not a capability gap — the code exists, is wired into
`package.json`, and has produced real output for every one of the 5 repos in question.

## What's actually true: staleness, not absence

The **current/latest** run per repo is not uniformly complete, and that's the real, narrower
finding:

| Repo | Latest run | Has 06/07 output? |
|---|---|---|
| `ios-oskey-dev` | 2026-09-10 16:42 (no run since) | Yes — complete |
| `swift-ble-kit-oskey-dev` | 2026-09-18 16:50 | No — stops after 02 |
| `swift-cloud-kit-oskey-dev` | 2026-09-18 15:50 | No — stops after 02 |
| `swift-ui-kit-oskey-dev` | 2026-09-18 16:50 | No — stops after 02 |
| `swift-webrtc-kit-oskey-io` | 2026-09-18 16:51 | No — stops after 02 |

For all 4 Swift-kit repos, their earliest 2026-09-10 runs *did* produce complete 04-07 output;
a later run that same day already regressed to stopping after 02, and the most recent
(2026-09-18) runs repeat that pattern. `ios-oskey-dev` is the one exception — both of its runs
(both 2026-09-10) are complete, but it also hasn't been re-run since, so its 04-07 output now
reflects the pre-2026-09-18 extractor code, not the current one.

**Likely mechanism, not fully confirmed:** `01-extract-ast-evidence.ts` and
`02-build-module-evidence.ts` (the shared Swift extractor stages) were edited 2026-09-18
17:49-17:50 — same day as the 4 kit repos' most recent runs. `package.json` only defines a
full `pipeline:*` orchestrator (`00` through `07` in one `npm run` chain) for two of the five
repos: `pipeline:swift-ble-kit` and `pipeline:ios-oskey-dev`. There is **no**
`pipeline:swift-cloud-kit`, `pipeline:swift-ui-kit`, or `pipeline:swift-webrtc-kit` script —
only the underlying `cloud:swift-0X-*` step commands exist, which take `REPO_NAME` from the
environment and must be chained manually per repo. The most consistent explanation for the
09-18 runs stopping at 02 across all 4 kit repos (including `swift-ble-kit`, which *does* have
a full orchestrator) is that 09-18's runs were deliberate, partial re-runs of just the
extractor stages (01-02) to validate that day's extractor code change, not full `00-07`
pipeline invocations — not a crash or newly-broken dependency. One data point against a crash
theory: `swift-ble-kit-oskey-dev`'s 2026-09-10 16:41 run's `run-notifications.json` shows 04's
entries timestamped **after** 05's (05 at `07:29:34Z` on 09-11, 04 at `12:49:18Z` on 09-11,
both a day after the run's own `00-scan-repo` step at `16:41:27Z` on 09-10) — evidence that
individual stages were invoked standalone at different times, not through one atomic pipeline
run, well before 09-18. Not verified further (would require checking shell/CI history outside
this repo, out of scope for a read-only investigation).

## Answers to the 5 investigation questions

**1. Why the gap exists — git history.** `pipeline/swift/phase-01-ast-extraction/` (including
`04-07`) and `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/04-build-resolved-graph.ts`
were both introduced in the **same commit**, `8e63dd6` ("built the swift p1", 2026-09-10).
`kotlin-ast-utils.ts` (Kotlin's extractor) was added one day earlier, `9e659b7` ("kotlin-intercom
mid flight, ios-swift commencing code session 1", 2026-09-09). So Swift/Kotlin AST extraction
and the 04-07 structural stage for both were built **contemporaneously**, within the same
1-2 day session — not "04-07 existed long before Swift/Kotlin support and was never backported."
There was no oversight-style gap at build time. The only real gap found is the staleness
described above, which is recent (started within 2026-09-10 itself) and ongoing.

**2. What `04-07` actually depend on.** Read `pipeline/swift/phase-01-ast-extraction/04-build-resolved-graph.ts`
in full. Its own header states explicitly: *"Real, deliberate re-design vs. the TS/Kotlin
pipelines' own copies of this script, not a blind port — same reasoning as Kotlin's own Task
8."* It does not depend on TS-specific AST shapes (no ts-morph node types); it consumes the
Swift extractor's own already-resolved call data (resolution happens earlier, in
`01-extract-ast-evidence.ts`) and applies Swift-specific eligibility rules (e.g. a
`NOISY_CALL_ROOTS` list tuned to real SwiftUI/Foundation/Combine/Firebase-SDK call volume, and
explicit handling of Swift's implicit-member-expression shorthand, which has "no Kotlin/TS
analog at all" per the same header). So: **not** the phase-02 bespoke-per-repo anti-pattern
doc 13 found — it's one level coarser: one deliberately-redesigned script **per language
family** (TS, Kotlin, Swift), each shared across every repo in that family, not one script per
repo. Confirmed for the TS family too: `firebase-oskey-dev`'s and `angular-app-oskey-io`'s
`04-build-resolved-graph.ts` are byte-identical (`diff` = 0 lines) — the TS pattern is also
one script, copy-pasted per repo directory, not independently bespoke per repo. Swift's
version goes one step further and isn't even copy-pasted — it's genuinely one shared file
(`pipeline/swift/...`) referenced by all 5 repos via `REPO_NAME`.

**3. Does `cross_repo_edges` depend on `04-07`?** No — confirmed independent.
`pipeline/facts-postgres-index/build-cross-repo-edges.ts` (the script that writes the live
`cross_repo_edges` table) reads **live Postgres facts** directly (e.g.
`payload->'evidence'->>'callableExportName'` from `firebase_callable_call` / `api_contract`
fact rows), not any file under `knowledge-pipeline/` (not `resolved-engineering-graph.json`,
not `cross-module-dependencies.json`, not `intra-module-coupling.json`). It's a narrow,
deterministic join plus one manually-curated pub/sub mapping, scoped specifically to
Angular↔Firebase and node-iot↔Firebase pairs per its own header comments — it does not
mention Swift, iOS, or Android at all. So the 04-07 staleness/gap **does not** weaken
Swift/iOS's `cross_repo_edges` rows (there don't appear to be any Swift/iOS-specific rows in
that table's join logic regardless, which is a separate, real scoping fact worth flagging but
outside this investigation's 5 questions). The stakes of this gap are exactly what doc 19's Q3
called the "smaller" case: purely local/intra-repo-family structural richness (call graphs,
module coupling, capability packs) for Swift/iOS, not cross-repo evidence.

**4. Scope/cost estimate for closing the gap.** Given (1)-(3), this is **not a build task** —
the shared code already exists, is already language-appropriate (not a TS port), and has
already produced complete output for all 5 repos at least once. Closing the gap is really two
much smaller, mechanical items:
   - Add the missing `pipeline:swift-cloud-kit`, `pipeline:swift-ui-kit`,
     `pipeline:swift-webrtc-kit` full orchestrator scripts to `package.json` (following the
     existing `pipeline:swift-ble-kit` / `pipeline:ios-oskey-dev` pattern exactly — each is a
     one-line addition chaining the same 8 existing `cloud:swift-0X-*` commands with a
     different `REPO_NAME`).
   - Re-run the full `00-07` pipeline for all 5 repos (via those orchestrator scripts) so
     current output reflects the 2026-09-18 extractor fix, rather than the 09-10 code. This is
     a real, free (no LLM/embedding cost — confirmed earlier in doc 13) re-run, same as any
     other pipeline run in this project.
   No new script-writing is needed unless a future decide-stage session wants the Swift `04-07`
   family to diverge further from its current shared design — not indicated by anything found
   here.

**5.** Findings only, as instructed — no decision made here on whether/when to act on this.

## What would need re-verification before acting on this

- Whether the 09-18 partial runs were in fact deliberate (as inferred above) rather than a
  genuine new failure — not confirmed directly, since it would require info outside this
  repo (shell history, CI logs) not available to a read-only file/git investigation.
- Whether Swift/iOS facts are currently synced into Postgres at all (`sync-facts.ts` exists;
  not checked here whether it's been run for these 5 repos, or whether `cross_repo_edges`
  could ever include a Swift/iOS row under a future extension of
  `build-cross-repo-edges.ts`'s join logic) — genuinely out of scope for this investigation's
  5 questions, flagged here only because it surfaced while reading (3).
