# Task 11 — Real `.pbxproj` Structure Bounded Test, 2026-09-10

Real, checked findings from a bounded test against `ios-oskey-dev`'s actual `ios-oskey-dev.xcodeproj/project.pbxproj` (pinned commit `e660bda2`, real clone at `output/clones/ios-oskey-dev/`), done before writing any real `00-scan-repo.ts` port for this repo — same discipline as the SwiftSyntax vs. tree-sitter-swift bounded test before Task 1.

## Tool choice: `xcode` npm package (v3.0.1)

Real, established, actively-published parser for the OpenStep-plist `.pbxproj` format (used by React Native/Cordova tooling). Chosen over hand-rolled regex on the plist text, same reasoning as every other AST-tool decision this family has made — a real parser over text-munging. It correctly parses `PBXNativeTarget`/`PBXSourcesBuildPhase`/`PBXBuildFile`/`PBXFileReference`/`PBXGroup`/`PBXProject`. Installed with `--no-save` for this bounded test only; not yet added to `package.json` — that's a real build-step, not done yet.

**Real gap found in the library itself**: `xcode`'s own convenience methods (`pbxSourcesBuildPhaseObj`, etc.) don't understand Apple's newer "file system synchronized group" feature at all (see below) — had to read `PBXFileSystemSynchronizedRootGroup`/`PBXFileSystemSynchronizedBuildFileExceptionSet` directly from `proj.hash.project.objects`, and had to write a real group-parent-chain path resolver by hand (the library exposes the raw parsed objects, but not a path-composition helper). Both gaps are real, not a sign the tool is wrong — same class of "real tool, still needs custom logic on top" pattern as SwiftSyntax needing a hand-built symbol table.

## Finding 1 — real target discovery is dynamic, not hardcoded (confirmed 3 targets, matching `02-real-repo-inspection-findings-2026-09-09.md` §5)

```
grep -c "isa = PBXNativeTarget;" project.pbxproj  →  3
```
`OSKEYTests`, `iOS App`, `OSKDoorUnlockActivityExtension` — read from the real `PBXNativeTarget` section at scan time, never hardcoded by name, per this session's own standing "always dynamic, never hardcoded" principle.

## Finding 2 — real, mixed membership model per target: two independent real mechanisms, not one

Confirmed by direct inspection, not assumed: **all 3 real targets use a mix of the classic explicit-file-list model and Apple's newer (Xcode 16+) "file system synchronized group" model**, and the mix is different per target:

| Target | Explicit `PBXSourcesBuildPhase` files | `fileSystemSynchronizedGroups` (real, recursive on-disk folder membership) |
|---|---|---|
| `OSKEYTests` | 0 (`files = ()`, real, not a parse failure) | 1 folder: `OSKEYTests/` |
| `iOS App` | 449 | 3 folders: `Component`, `Utils`, `RegisterCloseOnes` |
| `OSKDoorUnlockActivityExtension` | 2 | 1 folder: `OSKDoorUnlockActivity/` (with 1 real exception: `Info.plist` excluded — not a `.swift` file, no real impact today) |

**Real, load-bearing consequence for the scan-repo port**: a target's real file membership cannot be read from the explicit build-phase list alone — for `OSKEYTests`, that list is empty, and 100% of its real membership comes from a real recursive directory walk of `OSKEYTests/` instead. This is Apple's actual current default for new targets/groups in modern Xcode, so this mix should be *expected* to grow over time, not shrink — exactly the kind of real structural variation the "always dynamic, always recursive" principle exists for.

## Finding 3 — real path resolution requires walking the group-parent chain, not the file's bare `path` field

A `PBXFileReference`'s own `path` field is very often just a bare filename (e.g. `OSKUserData.swift`), not a path — the real full path only exists by walking up the chain of parent `PBXGroup`/`PBXFileSystemSynchronizedRootGroup` nodes to the project's `mainGroup`, concatenating each node's own `path` (skipping virtual groups that have a `name` but no `path`). Built and verified a real recursive resolver for this (not part of the `xcode` library) — confirmed correct against 5 real explicit file refs and all 5 real synchronized root groups, every resolved path checked to actually exist on disk:

```
Component -> "iOS App/Presentation/SesamePlus/Component"   (exists: true)
Utils -> "iOS App/Presentation/Profile/Utils"               (exists: true)
RegisterCloseOnes -> "iOS App/Presentation/Onboarding/Views/RegisterCloseOnes" (exists: true)
```
Real, concrete reason this matters: 3 different real folders in this repo are named `Utils` (`App/UpdateAppKit/Utils`, `Presentation/FaceRecognition/Utils`, `Presentation/Profile/Utils`) — a bare-basename search would have silently picked the wrong one or conflated all three. Only the one actually listed as `iOS App` target's `fileSystemSynchronizedGroups` member (`Presentation/Profile/Utils`) is real target membership.

## Finding 4 — real, reconciled per-target and repo-wide counts

Combining both mechanisms (explicit + synced-folder walk, de-duplicated) and resolving every path against real files on disk:

| Target | Real `.swift` file count |
|---|---|
| `OSKEYTests` | 2 |
| `iOS App` | 460 |
| `OSKDoorUnlockActivityExtension` | 9 |
| **Distinct files across all 3 targets** | **469** |

Total real `.swift` files anywhere in the repo (`find`, excluding `.build/`): **482**. Reconciles as: 469 (in some target) + **13 real, genuine orphans** (below) = 482 exactly.

## Finding 5 — real, unresolved scope question: 13 real `.swift` files exist on disk but belong to NO target at all

Confirmed these 13 files do not appear **anywhere** in `project.pbxproj` — not as an excluded/unreferenced `PBXFileReference` under some other group, not under any target, nothing (`grep` for each basename against the whole `.pbxproj`: zero matches, for every one checked). Not a stale in-progress merge either — checked `git log` on one (`OSKBKHostViewModifier.swift`): last real commit 2025-01-21, over a year old at the pinned commit's date.

```
Shared/JWT/OSKJWT.swift
Shared/Cypto/CyrptoKit+OSKSKSecKeyConvertible.swift
Shared/UI/Views/OSKCircularProgressIndicator.swift
Shared/UI/View Modifiers/OSKOtpModifier.swift
Shared/API/BLE/Models/OSKBLELockPeripheralTokenHeader.swift
Shared/API/BLE/Models/OSKBLELockPeripheralToken.swift
Shared/API/BLE/Models/OSKBLELockPeripheralTokenPayload.swift
iOS App/UI/Views/OSKToastViewModel.swift
iOS App/UI/Views/OSKCustomToastView.swift
iOS App/View Models/Forms/OSKFRAddressSearchFormViewModel.swift
iOS App/View Models/Data Views/OSKBLECentralManagerHostViewModel.swift
iOS App/Extensions/EnvironmentValues.swift
iOS App/Views/Data Views/OSKBKHostViewModifier.swift
```

**Real, worth flagging directly**: `OSKBKHostViewModifier.swift` and `OSKBLECentralManagerHostViewModel.swift` are close in name to the real `OSKBKCentralManagerHostViewModifier` cross-target shadow case already found in `08-swiftsyntax-vs-npm-treesitter-bounded-test-2026-09-09.md` §5c (the one motivating Task 12) — worth a direct content check once these are in scope, not assumed to be the same thing from the name alone.

These are real, genuinely dead-from-the-build's-perspective Swift source files — not resources, not test fixtures, not excluded-but-visible. **Not yet decided**: whether this repo's own fact-extraction should (a) skip them entirely (matches "what the app actually compiles," consistent with every other repo in this family scoping to real build-relevant source), or (b) still extract them as a separately-tagged `orphaned`/`unreferenced` bucket (real precedent: `android-intercom-oskey-io`'s own unreferenced-tagging work, `16-real-downstream-consequence-of-unreferenced-tagging-2026-09-09.md`). This is a real scope decision, not a technical blocker — surfacing it rather than picking silently.

## Not yet done

- Duplicate-declaration-name resolution (`Provider`, `OSKUserIdKey`, `OSKStreetAddressPickerViewModel`, per `08-...md` §5c/5d) — needs the real per-target file lists above as an input, not done yet.
- The actual `00-scan-repo.ts` port itself — this doc is the bounded test that precedes it, per this family's own established sequencing (bounded test → decision → build).
- Adding `xcode` to `package.json` as a real dependency (currently installed `--no-save` for this test only).
