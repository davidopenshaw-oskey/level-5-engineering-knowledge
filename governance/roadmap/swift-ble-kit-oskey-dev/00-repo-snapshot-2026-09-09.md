# `swift-ble-kit-oskey-dev` — Real Repo Snapshot, 2026-09-09

Real, checked findings from cloning and reading this repo directly, as part of the wider `ios-oskey-dev` 4-repo onboarding pass. Full cross-repo context (why this repo is in scope, how it relates to the other 3, the version-pin decision below): `governance/roadmap/ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` and `03-branch-tag-and-version-pin-strategy-2026-09-09.md`. This doc holds only the facts specific to this one repo. Not yet at the Task-1-design stage (`00-phase1-ast-extraction-design.md` equivalent) — that's real, separate future work, sequenced after `ios-oskey-dev`'s own onboarding per `01-multi-repo-architecture-methodology-fit-2026-09-09.md`'s "leaf packages first" call.

## Package shape

- Package name: `OSKBluetoothLEKit`
- `swift-tools-version:5.9`
- Platforms: `.iOS(.v15)`, `.watchOS(.v8)`
- **Single target**: `OSKBluetoothLEKit` (+ `OSKBluetoothLEKitTests`), zero external dependencies
- 32 real Swift files total (`Sources/OSKBluetoothLEKit/`, `Tests/OSKBluetoothLEKitTests/`)
- Smallest and simplest of the 3 leaf packages — no submodule split needed, confirms the "leaf packages are lower-risk to validate tooling against" prediction.

## Branch/tag reality

- Default branch: `master` — but **stale**, last real commit `52d8a7f`, 2025-01-21. Do not pin here.
- `develop`: current, HEAD `62f5a97` ("Refactor unlock command to send with response and sequential chunking (#20)"), always matches the real latest tag (`1.1.3`, 0 commits behind).
- Real tags exist consistently as bare semver (`1.0.0` through `1.1.3`) — no naming-convention inconsistency found here, unlike `ios-oskey-dev`'s own tag history.

## Version pinned by `ios-oskey-dev`

`ios-oskey-dev`'s real, authoritative `Package.resolved` pins commit `f8cdf1995ef94103991ba784d4e6e67dda4f1232` (tag `1.1.1`) — 2 patch versions behind this repo's real latest tag (`1.1.3`). `config/repos.json`'s entry for this repo pins to that exact commit, not to `develop` or `master` — see `ios-oskey-dev/03-...md` for the full reasoning.
