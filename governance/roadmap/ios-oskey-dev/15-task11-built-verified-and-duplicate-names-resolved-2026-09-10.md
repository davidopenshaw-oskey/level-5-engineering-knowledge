# Task 11 — Built, Run End-to-End for Real, and the 3 Duplicate Names Explained, 2026-09-10

Follows directly from `14-task11-pbxproj-structure-bounded-test-2026-09-10.md`'s bounded test. That doc's design was built for real as `pipeline/ios-oskey-dev/phase-01-ast-extraction/00-scan-repo.ts`, then the full `00`-`07` chain (the SHARED `pipeline/swift/` scripts, unmodified) was run against real `ios-oskey-dev` data.

## Real, user-confirmed scope decision, applied

**13 real orphaned `.swift` files (belonging to zero real Xcode targets) are SKIPPED entirely**, not tagged/included — explicit decision, 2026-09-10, after the scope question was put to the user plainly (not the first phrasing, which the user correctly flagged as unclear). `00-scan-repo.ts` implements this by only ever writing `facts/files.json` rows for files with at least one real target membership; the shared `01-extract-ast-evidence.ts` (which parses the WHOLE clone via the swift-extractor subprocess) then naturally excludes them via its own existing `filesByPath` scope filter — **zero changes needed to any shared script**.

## Real, verified: full pipeline run, `00`→`07`, all real numbers reconcile

| Stage | Real result |
|---|---|
| `00-scan-repo` | Real clone at pinned `master` tip (`e660bda2`). 3 real targets discovered dynamically (`iOS App`, `OSKDoorUnlockActivityExtension`, `OSKEYTests`) — matches the bounded test exactly. 469 files in scope, 13 orphaned/skipped — matches the bounded test exactly. |
| `01-extract-ast-evidence` | **0 diagnostics across all 482 real `.swift` files** (whole clone, swift-extractor's own real parse pass) — resolves the real, previously-open risk in `02-real-repo-inspection-findings-2026-09-09.md` §8 (this machine's Swift 6.3.3 toolchain vs. the repo's own pinned 5.9/`SWIFT_VERSION=5.0`). `astErrorTolerancePercent: 0` recorded in `config/repos.json`, real and measured, not assumed from the 5 leaf packages' own 0%. |
| `02-build-module-evidence` | Per-module facts reconcile exactly: `OSKDoorUnlockActivityExtension` 7 files/439 facts, `OSKEYTests` 2 files/87 facts, `iOS App` 460 files/24,932 facts. 7+2+460 = 469 exactly. |
| `03-build-benchmark` | 25,458 total facts, all sub-counts reconcile against `02`'s own sums. |
| `04-build-resolved-graph` | 17,442 real call expressions; 895 implicit-member-expression calls (Swift's leading-dot shorthand, same honest bucket as the leaf packages); 8,734 graph-eligible; 2,136 same-module resolved; 108 real cross-module (cross-target) resolved call edges (a genuine, expected side effect of the 2 real files shared between `iOS App` and `OSKDoorUnlockActivityExtension` — see below); 6,490 unresolved (real external-framework calls, same honest bucket as every other repo). `resolved_via_import`: still 0, as expected — Task 12 not built. |
| `05`-`07` | Ran cleanly, correctly empty (no submodule structure, no cross-repo import resolution yet) — same honest expected-empty result as every other repo, per those scripts' own header comments. |

**Real, load-bearing note on the 108 cross-module call edges**: the 2 files known to be real members of both `iOS App` and `OSKDoorUnlockActivityExtension` (`OSKDoorUnlockAttributes.swift`, `String.swift`, see doc 14) are the reason a same-target resolver can produce cross-*module*-labeled edges here — a real, correct consequence of this repo's own real multi-target membership, not a bug. Not investigated further; flagged for anyone reading `resolved-graph-matrix.md` for this repo so the number isn't mistaken for `resolved_via_import` finally firing (it hasn't — that's still genuinely 0).

## Task 11(b) — the 3 real same-target duplicate declaration names, now explained

`08-swiftsyntax-vs-npm-treesitter-bounded-test-2026-09-09.md` §5c/5d found 3 duplicate top-level declaration names via a repo-wide `grep` that had no concept of real Xcode target membership. Now that `00-scan-repo.ts` knows real target membership directly from `project.pbxproj`, each case was checked for real:

1. **`OSKStreetAddressPickerViewModel` — NOT a real same-target collision at all.** `grep` found two: `iOS App/UI/View Models/OSKStreetAddressPickerViewModel.swift:20` (real, compiled, in the `iOS App` target) and `iOS App/View Models/Forms/OSKFRAddressSearchFormViewModel.swift:12` — **the second is one of the 13 real orphaned files** from doc 14 Finding 5, confirmed absent from `project.pbxproj` entirely. This "duplicate" was always a false alarm produced by text-searching the whole repo without knowing one of the two locations is dead code. Resolved by this task's own real target-membership data, not by any resolver change.

2. **`OSKUserIdKey` — a real same-target duplicate, but real Swift nested-type namespacing, not a genuine name collision.** Both real, both compiled into `iOS App`: `Shared/Storages/Environment/EnvironmentValues+userId.swift:17` (`struct OSKUserIdKey: EnvironmentKey`, nested inside an `EnvironmentValues` extension) and `Shared/User/Account/Extensions/GPUserDefaultValues+userId.swift:18` (`struct OSKUserIdKey: GPUserDefaultKey`, nested inside a different extension). Real Swift scoping makes these two genuinely distinct types (`SomeExtension.OSKUserIdKey` vs. another) — only the flat, name-only same-target resolver (already an accepted limitation, same class as `swift-ui-kit-oskey-dev`'s own nested `enum Text` case, Task 9 finding 4) would conflate them.

3. **`Provider` — same real pattern as #2.** Both real, both compiled into `OSKDoorUnlockActivityExtension`: `OSKDoorUnlockActivityControl.swift:40` (`struct Provider: ControlValueProvider`) and `OSKWDoorUnlockActivity.swift:17` (`struct Provider: TimelineProvider`) — Apple's own real WidgetKit convention of each widget defining its own nested `Provider` type. Same accepted flat-resolver limitation class as #2, not a new problem.

**Real conclusion**: Task 11(b) as scoped ("resolving the 3 real same-target duplicate names... via direct `PBXNativeTarget`/`PBXSourcesBuildPhase`/`PBXFileReference` inspection") is **done** — the direct pbxproj-based membership data is exactly what explained all 3 cases. No extractor change was needed or made; #2 and #3 are real, now-measured instances of the same nested-type-scoping limitation this family has already, consistently accepted elsewhere (never silently fixed with a heuristic that could introduce a new wrong answer).

## Task 11(c) — cross-target shadow rule (`OSKBKCentralManagerHostViewModifier`)

Not yet testable — needs Task 12 (cross-repo declaration resolution) to exist first, so `ios-oskey-dev`'s own resolver can see the sibling `swift-ble-kit-oskey-dev` declaration it would need to shadow. Confirms the sequencing reasoning already recorded in `13-session-handoff-2026-09-10.md`: Task 11 needed to be real and running before Task 12 could be meaningfully tested — that data now exists.

## Real config changes this task made

`config/repos.json`'s `ios-oskey-dev` entry: `astTool: "SwiftSyntax"`, `astToolVersion`, `callResolutionStrategy`, and `astErrorTolerancePercent: 0` all filled in for real (previously `null`/undecided) — mirroring the shape already established for the 5 leaf packages, each with its own real note, not copied blindly. Old `_note` marked superseded rather than rewritten, per this project's own documentation discipline.

## Not done in this task

- Task 11(c) / Task 12, as above — genuinely blocked on Task 12's own build, not an oversight.
- The 895 implicit-member-expression calls and the same nested-type-scoping limitation class are recorded, not re-litigated — consistent with this family's existing accepted-limitations list.
