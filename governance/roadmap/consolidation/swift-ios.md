# Swift/iOS Pipeline — Status Audit, 2026-09-11

**Purpose of this file:** a consolidated audit, not a new roadmap folder for ongoing work. Compiled by reading every file in `governance/roadmap/ios-oskey-dev/` (docs 00-19), the 5 per-leaf-package `governance/roadmap/swift-*-oskey-*/00-repo-snapshot-2026-09-09.md` docs, `governance/roadmap/swift-kotlin-preparation/` (both docs), plus every other real Swift/iOS mention found via a repo-wide grep across `governance/roadmap/` and `governance/adrs/`. Every claim below is either read directly from a real file (cited) or verified directly against live code/Postgres in this same pass (marked "verified live"). Where a cited doc's own claim is now stale (superseded by later, unrelated work), that's flagged explicitly rather than silently repeated. Structure mirrors `consolidation/kotlin-android.md`'s own audit, run the same day.

> **Partly superseded 2026-10-01 — read §7 at the bottom first.** §7 is a re-audit against the live DB covering everything built since this audit (2026-09-11 → 2026-09-27). Several items below are now closed: §2a (embeddings: done 2026-09-11), §2b (`swift-ai-kit-oskey-io` discrepancy: explained), §2d (cross-repo edges: built), §3 (Swift facts are now retrievable). The original text below is left intact as the 2026-09-11 record.

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

---

## 7. Re-audit, 2026-10-01 — current status (supersedes §1-§3 where they conflict)

**How this was compiled:** read `ios-oskey-dev/` docs 00-19, `graphrag/03`-`04`, `dynamic-pipeline-architecture/` docs 20, 22, 35, 36, 38 (Stages A/B + proposals P1-P10), 43 (W1, W4c, W4d, W5c, W6, Lane C entries and final capture notes) and 44, `prompts/prompt-8c-lane-swift.md`, `ux-mappings/01`, and `downstream-app-feedback/2026-09-27-extraction-update-3.md`. Every number marked "live" was queried read-only against `facts_index` on 2026-10-01; no spend, no writes.

### 7a. Built, verified, current

| Layer | Status | Source | Live, 2026-10-01 |
|---|---|---|---|
| P1 extraction (SwiftSyntax + `.pbxproj` scan) | Done, 0 parse errors | `ios-oskey-dev/10`, `15`-`17` | — |
| Facts in Postgres | Done, current | `ios-oskey-dev/19`, doc 43 W4c | ios 25,458 / cloud 2,587 / ui 2,482 / webrtc 2,487 / ble 799 = **33,813**; **0 without embedding** |
| Embeddings | Done 2026-09-11 (real cost $0.96, ~143 tokens/fact for Swift — use this, not the TS/Kotlin 69) | `graphrag/03` | 0 missing |
| Orchestrators | `pipeline:` script for all 5 repos (3 were missing until 2026-09-20) | dynamic-pipeline doc 22 | — |
| Current runs | All 5 extracted 2026-09-26 (W4c) | doc 43 | ios `20260926_073857-e660bda2`; kits `…073744-32772e4a`, `…073755-9a75c7c6`, `…073758-f8cdf199`, `…073801-e8aeea9d` |
| iOS → kit edges (`PACKAGE_SYMBOL_USE`) | Built 2026-09-21 (Stage B) | doc 38 | 389 resolved (ui 222, cloud 135, ble 20, webrtc 12) |
| Cloud kit → Firebase callables (`HTTP_API_CALL`) | Built Stage A; export-group alias (doc 38 P3/A2) closed by W1 | doc 38, doc 43 | 31 resolved, 3 unresolved (dead iOS friend-request/OTP code, user-confirmed 2026-09-21) |
| Swift Firestore path facts (`firestore_client_call`, `cases[].computedStrings`) | Built 2026-09-26 (W4c) | doc 43 | 65 facts in cloud kit (64 resolved templates, 1 unresolved); 32/32 path-enum cases have templates. **iOS calls Firestore only through the cloud kit**, no direct path calls |
| Client ↔ Firebase Firestore edges | Built 2026-09-27 (W4d) | doc 43 | `FIRESTORE_CLIENT_ACCESS` 215 resolved + 22 unresolved; `FIRESTORE_CLIENT_TRIGGER` 17 |
| Intra-repo call edges | Built 2026-09-11 | `graphrag/04`, doc 43 | ios 8,734; kits 245/510/625/651 — **all `probable`/`unresolved`**, see 7b-1 |
| BLE GATT constants | Built | `ios-oskey-dev/10` Task 6 | 5 of 6 UUIDs identical to Android's |
| iOS screen map | Built 2026-09-21, hand-filled | `ux-mappings/01` | `screen-map-ios.json`: 88/88 entries have `screenName` + `description` |
| W5c (151 dangling Swift `INTRA_REPO_CALL` edges) | Cleared by the W5a rebuild | doc 43 | 0 dangling |

### 7b. Outstanding, in priority order

1. **The iOS graph cannot be walked within a repo (most important).** *Now its own initiative: `governance/roadmap/call-resolution-same-repo-edges/00-findings-and-plan-2026-10-01.md` (root cause: root-identifier-only resolution; also affects android-intercom).* Every Swift `INTRA_REPO_CALL` edge is `probable` or `unresolved`, and traversal follows neither (doc 38 Stage B hub note). W6's `INTRA_REPO_CALL_DECLARED` (resolved, facts-based, with a derived hub fence) fixed this for Firebase and Angular on 2026-09-27; Swift was not in its scope. **The input data already exists (live):** of 17,442 iOS `call_expression` facts, 4,838 `resolved_via_same_target` and 389 `resolved_via_import` all carry `declarationFile`; 12,074 `unresolved` and 141 `self_reference` carry none. A W6-style join for the 5 Swift repos looks feasible without extractor work (not built, not dry-run). Concrete consequence, found 2026-10-01 while tracing the Invitations tab's "Generate quick code" button: the view-model → cloud-kit hop (`OSKPinCodeGenerationViewModel.generatePinCode` → `pinCodeService.generatePinCode(...)`) is a call through an injected variable, so it is `unresolved` and has no edge. Each piece of the flow is findable by search, but a graph walk from button to backend almost certainly breaks inside iOS (inferred from the edge statuses; no walk was run).
2. **iOS branch choice — needs a user decision.** `ios-oskey-dev` is pinned to `master` on evidence that `master` = shipped production (`ios-oskey-dev/03`). Live 2026-10-01: `master` is still `e660bda2` (unchanged since ≤2026-09-10), while `develop` (`37320fa6`) and `staging` (`8f9d49ac`) have both moved. iOS facts therefore describe the released app, while Angular and node-iot track `staging` — a cross-platform mismatch for any end-to-end workflow question. The kit pins stay valid only while `master`'s `Package.resolved` is unchanged.
3. **`swift-ai-kit-oskey-io` (face recognition) not onboarded — awaiting a yes/no.** The §2b discrepancy is explained (doc 43, Lane C scoping, 2026-09-27): 2 Swift files in `SwiftRecognition`; the rest is a C++ target (`CxxRecognition`), which the extractor doesn't parse by design. iOS uses it from 4 files, 7 static calls on `OSKFaceRecognition`. Estimate: ~1 session, ~100-145 facts to embed (~10-14k tokens), `PACKAGE_SYMBOL_USE` 389 → ~396; needs a `pipeline:swift-ai-kit` script and a re-extract of iOS. Open: whether `02`-`07` cope with a zero-file module.
4. **Hub cap (doc 38 P8) — undecided.** `OSKUIExpanded` has 85 incoming `PACKAGE_SYMBOL_USE` edges; `findGraphNeighbors` ~35 KB (~57 KB through `get_graph_neighbors`), `walkBoundedCluster` truncates at depth 1. The validator's suggested fix ("include the hub with its count, don't expand through it") is not built. Item 1 would add more Swift hubs, so decide this alongside it.
5. **Findings to pass on to the iOS developers** (none sent as far as these docs show): `OSKCKUserInvitationService.swift:157` listens on a collection-shaped path declared as a document (likely runtime failure); `OSKCKUserBuildingAccessService.swift:64` template names `buildingId` but interpolates `accessId`; friend-request code (3 callables + `friends`/`friendRequests`/`pendingFriendRequests` collections, plus `/users/{}/accesses/{}/invitations`) has no Firebase counterpart. Two independent methods (W1 callables, W4d paths) reach that conclusion.
6. **Smaller open items:**
   - `OSKCKUserBuildingSettingsService.swift:42`: an unresolved Firestore call (path from a local `let`; local bindings aren't tracked).
   - Latent bug in `pipeline/swift/phase-01-ast-extraction/_shared/firestore-client-calls.ts`: the wrapper table is keyed by method name, not (class, method). Harmless today; see doc 43, Lane C FINAL CAPTURE.
   - The `any_truncated` embedding on one iOS fact (`graphrag/03`, 2026-09-11) has never been investigated.
   - §2c (cloud kit file count) and §2f (flat resolver: `enum Text` ~122 calls, `Provider`, `OSKUserIdKey`) are unchanged and still accepted. Also accepted: 261 implicit-member calls are unresolvable without compiling.
7. **Governance, unchanged since §2g/§4:** there's still no ADR for SwiftSyntax. The stale code comments and snapshot docs listed in §4 were **not re-checked** in this pass.

### 7c. Status of §2/§3 items from 2026-09-11

| 2026-09-11 item | Status 2026-10-01 |
|---|---|
| 2a embeddings | **Closed**: done 2026-09-11, 0 missing live |
| 2b swift-ai-kit discrepancy | **Explained**; onboarding is now a scoping decision (7b-3) |
| 2c cloud-kit file count | Open, low priority |
| 2d cross-repo dependency graph | **Superseded**: delivered as Postgres edges (`PACKAGE_SYMBOL_USE`, `HTTP_API_CALL`, `FIRESTORE_CLIENT_*`). The `build-intra-repo-edges.ts` scoping bug it warned about was re-proven fixed (`graphrag/04`) |
| 2e no narrative reports | Unchanged, still the decision |
| 2f flat-resolver limits | Unchanged, accepted |
| 2g no ADR | Unchanged, open |
| §3 nothing retrievable | **Closed**: all Swift facts are embedded and edged; the new risks are 7b-1 and 7b-4 |

### 7d. Not checked in this pass

- Whether `2026-09-27-extraction-update-3.md` (exists untracked; doc 44 says it was not yet drafted) has been sent to the wiki team.
- Whether `INTRA_REPO_CALL_DECLARED` would need a different hub fence for SwiftUI-heavy code.
- Any real `walk_cluster` / `get_graph_neighbors` run over the iOS quick-code or invite-guest flow (7b-1 is inferred from edge statuses).
