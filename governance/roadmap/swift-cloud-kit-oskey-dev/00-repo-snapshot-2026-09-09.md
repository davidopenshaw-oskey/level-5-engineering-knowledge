# `swift-cloud-kit-oskey-dev` — Real Repo Snapshot, 2026-09-09

Real, checked findings from cloning and reading this repo directly, as part of the wider `ios-oskey-dev` 4-repo onboarding pass. Full cross-repo context: `governance/roadmap/ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` and `03-branch-tag-and-version-pin-strategy-2026-09-09.md`. This doc holds only the facts specific to this one repo. Not yet at the Task-1-design stage — real, separate future work.

## Package shape

- Package name: `OSKCloudKit`
- `swift-tools-version:5.9`
- Platforms: `.iOS(.v15)`, `.watchOS(.v9)`, `.visionOS(.v1)`
- **Single target**: `OSKCloudKit` (+ `OSKCloudKitTests`)
- **Real external dependency**: `firebase-ios-sdk` (`FirebaseAuth`, `FirebaseFirestore`, `FirebaseFunctions`, `FirebaseStorage`, `FirebaseMessaging`, `FirebaseCrashlytics`, `FirebaseAppCheck`) — **this is the repo where a real, concrete future Layer-3 join to `firebase-oskey-dev` would connect**, the same backend Angular/node-iot already join against.
- 111 real Swift files total (`Sources/OSKCloudKit/`, `Tests/OSKCloudKitTests/`)

## Branch/tag reality

- Default branch: `master` — but **stale**, last real commit `ceb3695`, 2025-01-21. Do not pin here.
- `develop`: current, HEAD `1d1354e` ("Add unitNumber (#112)"), always matches the real latest tag (`1.6.9`, 0 commits behind).
- Real tags exist consistently as bare semver (`0.1.0` through `1.6.9`) — no naming-convention inconsistency found here.

## Version pinned by `ios-oskey-dev`

`ios-oskey-dev`'s real, authoritative `Package.resolved` pins commit `32772e4af35e26be987ff132e248e34bb928e76b` (tag `1.6.8`) — 1 patch version behind this repo's real latest tag (`1.6.9`). `config/repos.json`'s entry for this repo pins to that exact commit, not to `develop` or `master` — see `ios-oskey-dev/03-...md` for the full reasoning.
