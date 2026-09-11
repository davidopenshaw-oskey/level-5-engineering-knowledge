# Swift/iOS Pipeline — Status Audit, 2026-09-11

**Purpose of this file:** a consolidated audit, not a new roadmap folder for ongoing work. Compiled by reading every file in `governance/roadmap/ios-oskey-dev/` (docs 00-19), the 5 per-leaf-package `governance/roadmap/swift-*-oskey-*/00-repo-snapshot-2026-09-09.md` docs, `governance/roadmap/swift-kotlin-preparation/` (both docs), plus every other real Swift/iOS mention found via a repo-wide grep across `governance/roadmap/` and `governance/adrs/`. Every claim below is either read directly from a real file (cited) or verified directly against live code/Postgres in this same pass (marked "verified live"). Where a cited doc's own claim is now stale (superseded by later, unrelated work), that's flagged explicitly rather than silently repeated. Structure mirrors `consolidation/kotlin-android.md`'s own audit, run the same day.

---

## 1. Real, current pipeline status — what's actually done

**Task 1 (tool choice) DECIDED**: SwiftSyntax over `tree-sitter-swift`, via a real bounded test (single-repo then family-wide, 821 files) — `08-swiftsyntax-vs-npm-treesitter-bounded-test-2026-09-09.md`, `09-task1-decision-swiftsyntax-2026-09-09.md`. `tree-sitter-swift` was rejected for a cascading (not localized) `#if`/`#endif` parse-corruption bug, not a tunable error-tolerance case. **No ADR was written for this decision** — see §4.

**P1 (AST extraction) is complete and verified for all 6 onboarded repos** (5 SPM leaf packages + `ios-oskey-dev` itself). Shared `pipeline/swift/phase-01-ast-extraction/00`-`07` scripts (restructured 2026-09-10 from a per-repo layout, `12-pipeline-restructure-shared-swift-scripts-2026-09-10.md`), plus a real `.pbxproj`-aware `pipeline/ios-oskey-dev/phase-01-ast-extraction/00-scan-repo.ts` for the one non-SPM repo (`14-...md`, `15-...md`). Real, verified numbers: 469 files in scope for `ios-oskey-dev` (13 confirmed-dead orphan files excluded, per direct user decision), 0 parse errors across all 6 repos, 25,458 facts for `ios-oskey-dev` alone.

**Cross-repo call resolution (`resolved_via_import`) is real and working** — Task 12, `16-task12-cross-repo-resolution-built-and-verified-2026-09-10.md`: 389 real calls in `ios-oskey-dev` resolve to a sibling package's public API, same-target resolution checked first (the real "local shadows import" shadow rule, verified against 44 genuine name overlaps, not the originally-cited example — see §4).

**`imports_dependency`'s own resolution fields are real** — Task 12 follow-up, `17-task12-followup-imports-dependency-resolution-2026-09-10.md`: `resolved_in_repo`/`resolved_cross_repo`/`external_or_unresolved`, plus a new `resolvedTargetRepo` field (no TS/Kotlin analog). Found and fixed a real, previously-unknown complication along the way: an Xcode target's display name ("iOS App") is not always its real Swift module name (`PRODUCT_NAME` build setting can diverge — real, measured: "iOS App" -> real module name "OSKEY"). `06-build-cross-module-dependency-graph.ts` now shows a real, non-empty result for the first time in this family's history (`OSKEYTests` -> `iOS App`, 1 edge).

**P2 (Postgres sync) is complete for all 7 Swift modules — verified live just now, not assumed from an older doc**: `SELECT repo, count(*) FROM facts WHERE repo IN (ios-oskey-dev, swift-ble-kit-oskey-dev, swift-cloud-kit-oskey-dev, swift-ui-kit-oskey-dev, swift-webrtc-kit-oskey-io)` → 33,714 total (`19-swift-family-synced-to-postgres-2026-09-11.md`). **`swift-ai-kit-oskey-io` remains permanently absent** — not a 6th synced repo, see §2.

**A real, genuine Postgres bug was found and fixed while syncing**: a ~28,000-character real SwiftUI view-builder call chain (`ios-oskey-dev`'s `OSKUserProfileUpdateForm.swift:133`) used verbatim as a `stableFactId()` primary-key component broke Postgres's own btree index-row limit. Fixed in `pipeline/swift/phase-01-ast-extraction/02-build-module-evidence.ts` (`boundedIdComponent()` — 200-char prefix + deterministic SHA-1 suffix for any oversized key component). **The same unbounded-component design is independently duplicated in the other 4 pipeline folders (TS ×3, Kotlin)** — flagged, not fixed there; `consolidation/kotlin-android.md` §2a independently confirms Kotlin's own copy hasn't been checked either.

**`imports_dependency` description enrichment is real and, as of this audit, fully retroactively applied everywhere** — `facts-serving-strategy/17-imports-dependency-description-enrichment-fix-2026-09-11.md` added a real `descriptionFor()` branch (general across languages, not Swift-only). See §4 for why that doc's own "not yet done" caveat about the other repos is now stale.

**Real, deliberate, closed decision**: a cross-*repo* dependency-graph artifact (an actual "`ios-oskey-dev` depends on `swift-ble-kit-oskey-dev`, ...") was investigated and **not built**, on purpose — `18-cross-repo-dependency-graph-deferred-to-p2-2026-09-10.md`. Before building it, checked why the project's own prior cross-repo tooling (`pipeline/cross-repo-synthesis/`) was archived and found it was superseded by a live, Postgres-based pattern (`build-cross-repo-edges.ts`), not because cross-repo graphing itself was wrong. Put to the user directly; the real decision was to stop at P1's `imports_dependency` fix and treat the artifact as separate, deferred P2 work — not an oversight.

---

## 2. Real, currently open — not yet decided or fixed

### 2a. Embeddings have never been generated for any Swift fact

**Verified live, this pass**: `SELECT repo, count(*), count(embedding) FROM facts WHERE repo LIKE '%swift%' OR repo='ios-oskey-dev'` → 33,714 total, **0 embedded**, across every module. This is a real, load-bearing gap, not an oversight: `EMBED=true` is a deliberate, explicit, paid opt-in per this pipeline's own standing rule, and it has not been requested yet. **Practical consequence, worth stating plainly**: `search_facts`/semantic retrieval cannot see any Swift fact at all right now — the corpus exists in Postgres but is invisible to vector search until this real, costed step runs.

### 2b. `swift-ai-kit-oskey-io`'s real file-count discrepancy — never root-caused, repo remains permanently excluded

`00-scan-repo.ts` found only **2** real Swift files (`OSKAIKit.swift`, `UIImage+Preparation.swift`) against the pinned commit `cee618a8`; every prior doc (`swift-ai-kit-oskey-io/00-repo-snapshot-2026-09-09.md`, `ios-oskey-dev/04-task1-pre-design-checklist-2026-09-09.md`) claims **4**. Config entry was removed entirely from `config/repos.json` (not disabled) 2026-09-10, real artifacts deleted, per direct user instruction to stop chasing it further. `10-p1-build-tasklist-2026-09-10.md`'s own Task 10 entry: "**Revisit later**: re-check the real file count against the pinned commit before re-adding." Still unrevisited as of this audit — genuinely open, not forgotten, just parked.

### 2c. `swift-cloud-kit-oskey-dev`'s smaller, lower-priority file-count discrepancy — flagged, not root-caused

Config/`00-repo-snapshot-2026-09-09.md` claimed 111 real files (`Sources/`+`Tests/` combined); the real scan found 127 in `Sources/` alone (128 with `Tests/`). `10-...md`'s own Task 10 entry: "most likely explanation... the original manual count... simply undercounted... **not chased further to full root cause**." No known excluded-directory explanation exists here (unlike the `swift-webrtc-kit-oskey-io`/`swift-ui-kit-oskey-dev` cases, both fully reconciled). Real, still open, lower severity than 2b since the repo stays in scope regardless.

### 2d. Cross-repo dependency-graph artifact — real next steps written, not built

Per §1's closed decision (`18-...md`): the concrete next step (a new `SWIFT_MODULE_IMPORT` connection_type in `build-cross-repo-edges.ts`, reading the now-real `resolved_cross_repo` facts) is written down but not scheduled. **New, real complication found during this audit, not present when `18-...md` was written**: `graphrag/01-findings-and-open-questions-2026-09-10.md` §7 found `build-cross-repo-edges.ts`/`build-intra-repo-edges.ts` have a real scoping bug — `build-intra-repo-edges.ts`'s own delete has no repo filter, silently wiping every other repo's intra-repo edges when run for just one repo. Any future work adding a Swift connection type to this same file inherits that risk and should account for it, not just copy the existing `HTTP_API_CALL` pattern blind.

### 2e. Report-coverage / narrative-synthesis layer — decided for now, underlying scope question still open

`graphrag/01-...md` §6/§8b, both real and current:
- **Real, user-confirmed decision, 2026-09-10, made in a concurrent peer session**: `ios-oskey-dev` and the 4 `swift-*-kit` repos get **pgVector facts only, no narrative-synthesis (phase-02) report layer** — asked and decided directly. Closed, not open, at least until revisited.
- **What's genuinely still open**: `knowledge-corpus/` (real reports) exists for only 3 of 9 P1-extracted repos; §6's own text calls the scope of that gap ("is it 2 repos or 6?") "**not confirmed, needs its own investigation**." The 2026-09-10 facts-only decision reads as the practical answer for `ios-oskey-dev` specifically, but the two sections were never explicitly reconciled in that doc — same open thread `consolidation/kotlin-android.md` §2d flags for Kotlin.

### 2f. Two accepted-but-real resolver limitations, documented, deliberately not fixed

- **`swift-ui-kit-oskey-dev`'s nested `enum Text` inside `Color.swift`** collides with SwiftUI's own `Text` view — ~122 real calls misattributed, flat name-only resolver has no lexical-scope awareness. `10-...md` Task 9 finding 4: same accepted-limitation class as Kotlin's own call-resolution gaps, not fixed.
- **The 3 real same-target duplicate declaration names** in `ios-oskey-dev` (`Provider`, `OSKUserIdKey`, `OSKStreetAddressPickerViewModel`) — real target-membership data explained all 3 (`15-...md`): one was never a real collision at all (one hit was dead/orphaned code), the other two are genuine Swift nested-type namespacing (WidgetKit's own `Provider` convention, a nested `EnvironmentKey` type) that the flat resolver still conflates. Not fixed, matching the `enum Text` precedent exactly.

### 2g. No ADR exists for the SwiftSyntax tool-choice decision

**Verified directly**: `grep -rli "swift" governance/adrs/` returns nothing. Task 1's decision (`09-...md`) is a real, family-wide architectural choice — this project's own stated convention (new architectural decisions get a real ADR, catalog updated) was not followed here; the decision lives only in a roadmap-folder doc. Not a functional gap, a governance-process one.

---

## 3. Agent/MCP-side issues tied to Swift's own corpus

**None found — but only because retrieval is not yet possible, not because it was tested and found clean.** Per §2a, zero Swift facts have embeddings, so `search_facts`/`walk_cluster`/`get_graph_neighbors` cannot surface any Swift-derived evidence yet. The general, cross-language MCP/agent issues `consolidation/kotlin-android.md` §3 found (bounded-search-effort not reliably followed, `walk_cluster`'s uncaught-crash risk on a fabricated anchor, the Vertex AI quota ceiling, `_unreferenced`-style internal-marker fabrication risk) all apply in principle the moment Swift facts become retrievable — none have been specifically re-tested against Swift data, since there is currently nothing to retrieve.

---

## 4. Corrections to other docs' own claims, found stale during this audit

- **`facts-serving-strategy/17-imports-dependency-description-enrichment-fix-2026-09-11.md`'s own "Not yet done" section claims the 4 pre-existing repos' `resolved_in_repo` facts (2,547 total) still carry the old, unenriched description.** **Verified live, now false for all of them**: `SELECT repo, count(*) FILTER (description NOT LIKE '%-- resolves to:%') FROM facts WHERE kind='imports_dependency' AND resolvedTargetModule IS NOT NULL GROUP BY repo` → 0 stale rows for every repo checked (`android-intercom-oskey-io`, `angular-app-oskey-io`, `firebase-oskey-dev`, `node-iot-api-oskey-io`, `ios-oskey-dev`). Someone (this session and/or a concurrent peer session) has already re-synced all of them since that doc was written. That doc's own table is now fully stale, not partially — worth a follow-up note there rather than leaving the "not yet done" framing standing.
- **`04-build-resolved-graph.ts`'s own code comments (lines ~262 and ~361) still say "`resolved_via_import` is not implemented yet for Swift" and "this branch never actually fires today."** Both are stale as of Task 12 (2026-09-10) — `resolved_via_import` fires for real (389 calls in `ios-oskey-dev`). The code's own logic is unaffected and correct (`confidence: ... === "resolved_via_import" ? "probable" : "weak"` already handles the real case properly) — only the explanatory comments describe outdated, pre-Task-12 reality. Cheap, real, unfixed.
- **`06-build-cross-module-dependency-graph.ts`'s entire file header still asserts "every repo in this family will produce EMPTY outbound/inbound arrays from this script right now"** and attributes it to `imports_dependency` "always" carrying `importResolutionStatus: "not_yet_implemented"`. Both are false as of the Task 12 follow-up (`17-...md`) — `ios-oskey-dev` now produces a real, non-empty result (`OSKEYTests` -> `iOS App`). This header was not updated when that fix shipped, even though the fix's own write-up (`17-...md`) explicitly confirmed and reported the exact behavior change this header still denies.
- **The 5 per-leaf-package `00-repo-snapshot-2026-09-09.md` docs** (`swift-ai-kit-oskey-io`, `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`) each still state "Not yet at the Task-1-design stage — real, separate future work." All 12 tasks in `10-...md` are now done for these repos. None of the 5 carry a superseded-note pointing to the real, current status, despite this project's own "mark superseded, don't rewrite" convention.
- **`swift-ai-kit-oskey-io/00-repo-snapshot-2026-09-09.md`'s "4 real Swift source files" claim** is the direct, uncorrected source of §2b's discrepancy — the doc itself was never annotated to explain the gap or point to the repo's real removal from scope.
- **`swift-cloud-kit-oskey-dev/00-repo-snapshot-2026-09-09.md`'s "111 real Swift files total" claim** is the direct, uncorrected source of §2c's discrepancy, same pattern.

---

## 5. Housekeeping, not architectural

- **`swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md` and `01-real-findings-from-android-intercom-onboarding-2026-09-07.md`** are early (2026-09-06/07) anticipation docs, explicitly self-described as unconfirmed hypotheses. Most items are now real, checked, and closed by later work (module-structure prediction checked and found wrong — hub-and-spoke, not a Gradle-style analog split, per `02-real-repo-inspection-findings-2026-09-09.md` §5; enum-case extraction, cross-repo redeclaration, and dynamic discovery all confirmed and built). `00-...md`'s item 5 recommendation (SourceKit-LSP for genuine type resolution) was **not** followed in the real build — the actual decision (`09-...md`) uses a hand-built, syntax-only symbol table instead, the same style as Kotlin's own resolver, with the resulting flat-resolution limitations documented as accepted (§2f) rather than solved with real semantic resolution. Neither prep doc carries a superseded-note pointing to `11-cross-pipeline-lessons-checked-against-swift-2026-09-10.md`, the doc that actually did the real cross-check.
- **`ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` §5's own open thread** ("`Shared/API/BLE` and `Shared/API/Cloud` exist as real top-level folders... worth a closer look once Task 1 design actually starts... not resolved further here") was never revisited in any later doc — genuinely still open, low priority.
- ADR-005 ("Proposed — not yet decided," dated 2026-09-01) indirectly covers Swift's own real architecture today (pgVector-only, no report tier is exactly the retrieval-over-facts split ADR-005 describes) despite never being formally accepted. Same cross-cutting gap `consolidation/kotlin-android.md` would also inherit; not Swift-specific to fix, but Swift's own real P2 shape is a live instance of the undecided ADR.

---

## 6. What this audit did not check

- Whether the SwiftSyntax version-pin risk (this machine's Swift 6.3.3 vs. each repo's own pinned 5.9/5.10/`SWIFT_VERSION=5.0`) holds on a different machine or CI environment — confirmed clean only on this machine, per `02-...md` §8's own original framing; `05-future-trigger-driven-extraction-concurrency-risk-2026-09-09.md`'s broader concurrency/trigger-driven risk was not re-verified either.
- Whether `pipeline/ios-oskey-dev/00-scan-repo.ts`'s dynamic target-discovery logic has been exercised against any real project change since it was built (it has only ever run against the current real 3 targets) — not a known bug, just untested against a future 4th target or a `PBXAggregateTarget`/other target type this repo doesn't currently have.
- Kotlin's own equivalent `stableFactId()` risk — that's `consolidation/kotlin-android.md`'s own scope (§2a there), not re-verified independently here.
- Whether `build-cross-repo-edges.ts`/`build-intra-repo-edges.ts`'s real scoping bug (§2d) has since been fixed elsewhere — flagged as unconfirmed, not investigated further in this pass.
- Whether any `mcp-server/` code path has Swift-specific handling anywhere — not checked; low likelihood given zero Swift facts are currently retrievable (§3), but not literally verified.
