# Task 1 Pre-Design Checklist — Where This Stands After the Real Repo-Inspection Pass, 2026-09-09

Mirrors `android-intercom-oskey-io/08-task1-consolidated-checklist-2026-09-08.md` in spirit: a real status checklist before AST-extraction design work (Task 1 proper) starts, not the design itself. All 6 repos in this family (`ios-oskey-dev` + 5 first-party OSkey packages, after `06-two-additional-packages-brought-into-scope-2026-09-09.md` widened the original 4-repo scope) are now cloned and inspected, and `config/repos.json` has real entries for all 6 (see that file). This doc tracks what's actually settled vs. still open.

## Settled, real, checked

- [x] All 6 repos clone successfully; access confirmed.
- [x] Architecture question answered: 4-repo shape fits the existing Layer 1 → Layer 3 methodology, arguably more cleanly than Android's single-repo case (`01-multi-repo-architecture-methodology-fit-2026-09-09.md`).
- [x] `ios-oskey-dev` module structure checked directly: 3 Xcode targets only (`iOS App`, `OSKEYTests`, `OSKDoorUnlockActivityExtension`) — no internal BLE/Cloud/WebRTC split exists inside this repo (`02-...md` §5).
- [x] `swift-webrtc-kit-oskey-io` naming ambiguity resolved (`-io`, confirmed by cloning) (`02-...md` §1).
- [x] Real, authoritative `Package.resolved` identified among 2 divergent copies, and read (`02-...md` §3).
- [x] Real version-pin gaps between `ios-oskey-dev` and each leaf package measured (1-2 patch versions each) (`02-...md` §4).
- [x] Branch/tag strategy decided with real evidence for all repos: `master` for `ios-oskey-dev` (branch, confirmed directly by the user 2026-09-09), exact-commit pins for all 5 leaf packages (`03-branch-tag-and-version-pin-strategy-2026-09-09.md`; the 2 later-added packages follow the same reasoning, see `06-...md`).
- [x] Real `swift-tools-version`/toolchain-pin facts recorded for all 6 repos (`02-...md` §8; `06-...md`'s 2 new snapshot docs for the later additions).
- [x] **Scope**: `swift-ai-kit-oskey-io` and `swift-ui-kit-oskey-dev` brought into scope 2026-09-09, after checking real usage directly (179 and 4 importing files in `ios-oskey-dev` respectively — both real, not dead lockfile entries) (`06-two-additional-packages-brought-into-scope-2026-09-09.md`).
- [x] **`master` branch for `ios-oskey-dev`**: confirmed directly by the user 2026-09-09, on the strength of the real evidence already gathered — no separate developer conversation needed (`06-...md`).
- [x] SwiftUI/UIKit dual-paradigm risk measured for real (298 vs. 30 files) — not zero, unlike Android (`02-...md` §6).
- [x] Local-persistence-layer question checked directly: Core Data is real and present, diverging from Android's confirmed zero-persistence finding (`02-...md` §7).
- [x] `config/repos.json` entries added for all 4 repos, following the existing schema and `android-intercom-oskey-io` entry's documentation convention (inline `_note`/`_note_branch` fields).
- [x] Per-repo roadmap folders created at the top level (`swift-ble-kit-oskey-dev/`, `swift-cloud-kit-oskey-dev/`, `swift-webrtc-kit-oskey-io/`), matching the existing one-top-level-folder-per-repo convention (`firebase-oskey-dev/`, `angular-app-oskey-io/`, etc.) rather than the stray nested/empty placeholders that existed under `ios-oskey-dev/` before this session (removed).

## Settled, real, checked (continued — 2026-09-09, second pass)

- [x] **Bounded parse test run for real** against `swift-ble-kit-oskey-dev` (32 files): both SwiftSyntax (pinned to this machine's real toolchain, `603.0.2`) and the npm-only `tree-sitter-swift` (`0.7.1`) parsed **100% clean, 0 errors**, both matching independent `grep` ground truth exactly on declaration counts. The version-mismatch risk this test was built to check did not materialize for either tool. Full results, a real script bug found and fixed along the way, and the remaining open deltas: `08-swiftsyntax-vs-npm-treesitter-bounded-test-2026-09-09.md`.

## Settled, real, checked (continued — 2026-09-09, third pass: family-wide re-run)

- [x] **The duplicate-declaration-name scan run for real across all 6 repos, 821 files** — and a real gap found along the way: `tree-sitter-swift` has a root-caused, family-wide 4.9% file-level parse-corruption rate (dominant cause: `#if`/`#else`/`#endif` conditional-compilation blocks wrapping a declaration; two smaller causes: `#Preview` macro, labeled trailing closures) that the original single-repo test never surfaced. That corruption directly caused the first duplicate-name scan pass to silently miss 2 of 5 real collisions — redone on SwiftSyntax's 100%-clean family-wide parse to get a trustworthy result. Full detail, root cause, and per-collision triage: `08-...md` §5.
- [x] **A new, Swift-specific structural risk found**: 3 of the 5 real duplicate top-level names are *same-target* (not cross-module like every one of Kotlin's), because Xcode's `.pbxproj` target membership is a per-file property, not folder-implied the way Gradle's module boundaries are — neither tool tested can see `.pbxproj`, so neither can tell a real same-module collision apart from two files that merely look alike from the source tree. No Kotlin/Gradle analog exists for this. `08-...md` §5d.

## Settled, real, checked (continued — 2026-09-09, fourth pass: decision)

- [x] **AST tool choice for Swift: DECIDED — SwiftSyntax, not `tree-sitter-swift`.** `tree-sitter-swift`'s `#if`/`#endif` parse bug is cascading (unbounded content loss to end-of-file), not localized like Kotlin's own accepted 4.4% error rate — a disqualifying property, not a tunable tolerance. Full reasoning: `09-task1-decision-swiftsyntax-2026-09-09.md`.

## Real, still-open questions — not resolved in this pass, deliberately
- [ ] **3 same-target duplicate names need real `.pbxproj` target-membership inspection** (`Provider`, `OSKUserIdKey`, `OSKStreetAddressPickerViewModel`, all within `ios-oskey-dev`) — not determined in this pass whether they're live compile-time conflicts, dead/excluded code, or a real resolver hazard. `08-...md` §5c.
- [ ] **Two smaller, still-unexplained count deltas** between the two tools on the single-repo corpus — `tree-sitter-swift` under-counts properties (~8%) and call expressions (~6%) relative to SwiftSyntax on the same 32 files. Not root-caused yet; flagged honestly in `08-...md` §2 rather than assumed away.
- [ ] **`swift-ai-kit-oskey-io`'s Swift/C++ interop shape**: only 4 real Swift files wrap a C++ core (`ncnn`/`opencv2`/`MoltenVK` binary frameworks) — genuinely untested whether SwiftSyntax-only extraction can describe anything meaningful here, or whether this repo needs a different approach entirely (`swift-ai-kit-oskey-io/00-repo-snapshot-2026-09-09.md`).
- [ ] **`Shared/API/BLE` and `Shared/API/Cloud`** inside `ios-oskey-dev` itself — real folders found (`02-...md` §5) but not yet inspected for content; likely thin wrapper/usage code around the SPM packages, not re-verified.
- [ ] **Stale-pin maintenance**: all 5 leaf packages' commit pins in `config/repos.json` will drift the moment `ios-oskey-dev` updates its own `Package.resolved` — whoever runs extraction next should re-check that file first (`03-...md`'s closing caveat).
- [ ] No Task-1 AST-extraction design doc exists yet for any of the 6 repos (the `00-phase1-ast-extraction-design.md` equivalent) — real, separate future work, sequenced leaf packages first per `01-...md`, smallest first per the agreed next step above.
- [ ] **Future, deliberately deferred**: the event-trigger concurrency/race-condition risk this 4(now 6)-repo family raises for any future automated, prod-push-triggered extraction — flagged in `05-future-trigger-driven-extraction-concurrency-risk-2026-09-09.md`, not relevant while extraction stays manual-trigger POC.
