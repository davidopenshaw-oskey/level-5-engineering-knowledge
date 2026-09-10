# Real Repo-Inspection Findings — All 4 iOS/Swift Repos, 2026-09-09

**Real, checked findings.** All 4 repos cloned for real (`output/clones/<repo>/`, gitignored, same convention `pipeline/*/phase-01-ast-extraction/00-scan-repo.ts` uses) and inspected directly — nothing below is anticipation. This is the "real-repo-inspection pass" `00-session-kick-off-and-handover-info.md` asked for before any extraction script gets written.

Repos: `ios-oskey-dev`, `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`.

## 1. Naming note from `01-...md` — resolved

The naming ambiguity flagged in `01-multi-repo-architecture-methodology-fit-2026-09-09.md` ("this folder's own subfolder is named `swift-webrtc-kit-oskey-io`; the name given verbally was `swift-webrtc-kit-oskey-dev`") is resolved: the user-supplied URL is `https://github.com/oskey-io/swift-webrtc-kit-oskey-io`, and the repo clones and resolves correctly under that name. **`-io`, not `-dev`, is correct** — confirmed by actually cloning it, not by re-guessing. The package's own internal `Package.swift` header comment still says `swift-webrtc-kit-oskey-dev` (a stale copy-paste artifact inside the file, not evidence of a different real name) — noted so a future reader doesn't get confused re-discovering the same ambiguity.

## 2. Real, new finding: `ios-oskey-dev` depends on 2 more OSkey packages than scoped

Reading `ios-oskey-dev`'s real `Package.resolved` (see §3) surfaced **two additional first-party OSkey Swift packages** not named anywhere in `00-session-kick-off-and-handover-info.md` or `01-...md`:

- `swift-ai-kit-oskey-io` (pinned `1.1.2`)
- `swift-ui-kit-oskey-dev` (pinned `2.2.5`)

Neither was in the 4 URLs given for this onboarding pass. **Open scope question, not resolved here**: whether these belong in the same onboarding effort (they're first-party OSkey code, same as the 3 kits already in scope) or are deliberately out of scope for now. Not cloned or inspected — flagging their existence is as far as this pass goes.

## 3. Real, major finding: `ios-oskey-dev` has TWO divergent `Package.resolved` files

Xcode's project+workspace pattern produces two `Package.resolved` locations, and in this repo **they disagree with each other**:

- `ios-oskey-dev.xcworkspace/xcshareddata/swiftpm/Package.resolved` — **the real, live one.** 256 commits have touched it; most recent 2026-03-31.
- `ios-oskey-dev.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved` — **stale.** Only 27 commits have touched it; most recent 2025-12-08 (over 3 months older). This is Xcode's auto-generated implicit workspace for the `.xcodeproj` when opened standalone — vestigial here, since the repo is normally opened via the real `.xcworkspace`.

The two files pin **materially different versions** of real dependencies, sibling OSkey packages included:

| package | `.xcworkspace` (authoritative) | `.xcodeproj`'s own copy (stale) |
|---|---|---|
| `swift-ble-kit-oskey-dev` | `1.1.1` | `1.0.5` |
| `swift-cloud-kit-oskey-dev` | `1.6.8` | `1.6.0` |
| `swift-webrtc-kit-oskey-io` | `1.1.6` | `1.1.4` |
| `swift-syntax` (transitive) | `603.0.0` | `602.0.0` |

**Concrete, load-bearing conclusion:** any tool or person reading "what version does `ios-oskey-dev` actually depend on" must read `ios-oskey-dev.xcworkspace/xcshareddata/swiftpm/Package.resolved`, never the `.xcodeproj`-nested copy — found only by checking each file's real git history, not by picking one that looked more official.

## 4. Real version-pin gap, measured (confirms `01-...md`'s nuance #1 as real, not hypothetical)

Using the authoritative `Package.resolved`, each sibling repo's pinned revision vs. that same repo's real latest tag:

| sibling repo | pinned in `ios-oskey-dev` | real latest tag | gap |
|---|---|---|---|
| `swift-ble-kit-oskey-dev` | `1.1.1` (`f8cdf199`, 2026-03-31) | `1.1.3` | 2 patch versions behind |
| `swift-cloud-kit-oskey-dev` | `1.6.8` (`32772e4a`, 2026-03-25) | `1.6.9` | 1 patch version behind |
| `swift-webrtc-kit-oskey-io` | `1.1.6` (`e8aeea9d`, 2026-02-09) | `1.1.7` | 1 patch version behind |

Small gaps in absolute terms, but real and non-zero for all three — `01-...md`'s warning that extracting each sibling at its own `develop`/latest-tag would describe code slightly different from what's actually integrated is now a measured fact, not a hypothesis. See `03-branch-tag-and-version-pin-strategy-2026-09-09.md` for the resulting config decision.

## 5. Real module-structure finding — the app does NOT internally split by BLE/Cloud/WebRTC

`00-session-kick-off-and-handover-info.md` (via `swift-kotlin-preparation/01-...md`) predicted an analogous Android-style split ("an App target plus separate BLE/USB/WebRTC domain/data modules"). Checked directly against `ios-oskey-dev.xcodeproj/project.pbxproj`: **exactly 3 native Xcode targets** —

- `iOS App` (the app itself)
- `OSKEYTests` (unit tests)
- `OSKDoorUnlockActivityExtension` (a Live Activity/widget extension for the door-unlock flow — matches the `OSKDoorUnlockActivity/` top-level folder)

No `BLE`, `Cloud`, or `WebRTC` target exists inside this repo at all — that functionality is **entirely external**, consumed as the 3 (or 5, see §2) SPM package dependencies. This directly confirms `01-multi-repo-architecture-methodology-fit-2026-09-09.md`'s core architectural claim: what would have been intra-repo module structure for Android is, here, real, checked, **already Layer-3 territory** — there is no additional internal split left to discover inside `ios-oskey-dev` itself.

`Shared/API/BLE` and `Shared/API/Cloud` do exist as real top-level folders inside the app (thin usage/wrapper code around the SPM packages, presumably) — worth a closer look once Task 1 design actually starts for this repo, not resolved further here.

## 6. Real SwiftUI/UIKit dual-paradigm measurement (the risk flagged in `swift-kotlin-preparation/00-...md` item 1)

Direct grep across `ios-oskey-dev`'s 482 real `.swift` files:

- SwiftUI-touching (`import SwiftUI` or `: View`): **298 files**
- UIKit-importing: **30 files**
- Files directly using `UIViewController`: **7 files**
- Storyboard files: **0**

**Real, measured conclusion, different from Android's finding**: unlike `android-intercom-oskey-io` (confirmed Compose-only, zero legacy View-system code), this iOS app is **not** SwiftUI-only — UIKit is present and non-trivial (30 files), though clearly the minority paradigm (no storyboards; UIKit usage is code-only). A real extractor for this repo will need to walk both paradigms, per the general risk `00-...md` flagged — now backed by a real ratio for this specific repo instead of an abstract risk.

## 7. Real local-persistence finding — diverges from the Android sibling

`swift-kotlin-preparation/01-...md` flagged, as an open question, whether iOS mirrors Android's confirmed "no Room/local-persistence layer" finding. **It does not**: `ios-oskey-dev` has a real Core Data model (`Shared/OskeyDataModel.xcdatamodeld`). No SwiftData usage found (0 matches for `import SwiftData`). This is a real, concrete divergence from the Android app, not assumed symmetry — confirms `swift-kotlin-preparation/00-...md` item 9's "worth checking for directly" flag was warranted: this repo genuinely does have a third kind of local-mirror-of-backend-data layer that Android's onboarding never had to design for.

## 8. Real language/toolchain versioning findings — the risk flagged in `swift-kotlin-preparation/00-...md` item 10 and `01-...md`, now checked for real

| repo | `swift-tools-version` (`Package.swift`) | other real version signals |
|---|---|---|
| `ios-oskey-dev` | n/a (Xcode app, no `Package.swift`) | `SWIFT_VERSION = 5.0` (language-mode setting, all targets); `.swift-version` file pins toolchain `5.9`; `IPHONEOS_DEPLOYMENT_TARGET` mostly `16.0`, one target `16.6`; `objectVersion = 77`, `LastSwiftUpdateCheck = 1630`, `LastUpgradeCheck = 1510` in the `.pbxproj` (Xcode-generation fingerprints, roughly Xcode 16.3-era last save) |
| `swift-ble-kit-oskey-dev` | `5.9` | platforms: `.iOS(.v15)`, `.watchOS(.v8)` |
| `swift-cloud-kit-oskey-dev` | `5.9` | platforms: `.iOS(.v15)`, `.watchOS(.v9)`, `.visionOS(.v1)` |
| `swift-webrtc-kit-oskey-io` | **`5.10`** (higher than the other two) | platforms: `.iOS(.v15)`, `.visionOS(.v1)` |

**Real, open risk — not resolved here, flagged for the actual tool-selection task**: this machine's installed toolchain is Xcode 26.6 / Swift 6.3.3 (`swift --version`, checked directly) — a large real gap from every repo's own pinned `5.9`/`5.10`. This is exactly the class of problem that disqualified the Kotlin Analysis API (`android-intercom-oskey-io/05-...md`) and that `swift-kotlin-preparation/01-...md` item 10 flagged as "genuinely unresolved... not resolvable until the actual iOS repo exists and its real pinned Swift version can be checked directly" — that check is now done (5.9/5.10, not the newest), but whether the newest local SwiftSyntax/toolchain still parses this code correctly is still real, untested work, deliberately not attempted in this pass (this pass is repo-inspection, not tool selection).

**Also real, worth carrying forward**: `swift-webrtc-kit-oskey-io`'s `5.10` tools-version is strictly newer than the other two kits' `5.9` — if a single shared toolchain pin is chosen for scanning all 3 leaf packages, it must satisfy `swift-webrtc-kit-oskey-io`'s higher floor, not just the other two's.

## 9. Real dependency-shape findings, useful for future Layer-3 design

- `swift-ble-kit-oskey-dev`: package name `OSKBluetoothLEKit`, **single target**, zero external dependencies, 32 real files. Smallest and simplest of the three, confirms `01-...md`'s "leaf packages first" sequencing call.
- `swift-cloud-kit-oskey-dev`: package name `OSKCloudKit`, **single target**, depends directly on `firebase-ios-sdk` (`FirebaseAuth`, `FirebaseFirestore`, `FirebaseFunctions`, `FirebaseStorage`, `FirebaseMessaging`, `FirebaseCrashlytics`, `FirebaseAppCheck`). 111 real files. **This is the repo where a real, concrete Layer-3 join to `firebase-oskey-dev` would connect** — the same Firebase backend the Angular/node-iot repos already join against.
- `swift-webrtc-kit-oskey-io`: package name `OSKWebRTCKit`, **single target** plus a `.binaryTarget` (a third-party prebuilt `WebRTC.xcframework`, from `sendbird/sendbird-webrtc-ios`, not Apple's or OSkey's own code) and a `socket.io-client-swift` dependency. 89 real files.
- None of the 3 leaf packages depend on each other or on `ios-oskey-dev` — confirmed real leaf packages, exactly as assumed.
- No USB-kit-equivalent repo exists among the 4 — confirms `swift-kotlin-preparation/01-...md`'s hedge ("USB is less common on iOS, may not carry over 1:1") as correct for this product.

## 10. Branch/tag situation — see dedicated doc

Real, non-trivial findings on branch/tag strategy for all 4 repos (including a second, independently-confirmed instance of the exact "naive tag version-sort breaks" failure mode already found on `android-intercom-oskey-io`) are written up separately: `03-branch-tag-and-version-pin-strategy-2026-09-09.md`.
