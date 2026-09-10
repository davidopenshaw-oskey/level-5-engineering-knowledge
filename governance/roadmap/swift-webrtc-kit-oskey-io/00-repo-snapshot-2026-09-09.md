# `swift-webrtc-kit-oskey-io` — Real Repo Snapshot, 2026-09-09

Real, checked findings from cloning and reading this repo directly, as part of the wider `ios-oskey-dev` 4-repo onboarding pass. Full cross-repo context: `governance/roadmap/ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` and `03-branch-tag-and-version-pin-strategy-2026-09-09.md`. This doc holds only the facts specific to this one repo. Not yet at the Task-1-design stage — real, separate future work.

**Naming note**: this is the repo `ios-oskey-dev/01-multi-repo-architecture-methodology-fit-2026-09-09.md` flagged as unresolved between `-oskey-io` and `-oskey-dev` suffixes. Resolved by actually cloning the user-supplied URL: real name is `swift-webrtc-kit-oskey-io` (`-io`, matching this folder). The package's own `Package.swift` header comment still reads `swift-webrtc-kit-oskey-dev` internally (stale copy-paste inside the file) — not evidence of a different real name, noted so it doesn't get re-litigated.

## Package shape

- Package name: `OSKWebRTCKit`
- `swift-tools-version:5.10` — **higher than the other 2 leaf packages' `5.9`**; if a single shared toolchain pin is chosen for scanning all 3, it must satisfy this floor.
- Platforms: `.iOS(.v15)`, `.visionOS(.v1)`
- **Single target** (`OSKWebRTCKit` + `OSKWebRTCKitTests`) plus a `.binaryTarget` — a prebuilt `WebRTC.xcframework` from a third party (`sendbird/sendbird-webrtc-ios`, not Apple's or OSkey's own code)
- Real external dependency: `socket.io-client-swift`
- 89 real Swift files total (`Sources/OSKWebRTCKit/`, `Tests/OSKWebRTCKitTests/`)

## Branch/tag reality — simpler than the other 2 leaf packages

- Default branch: `master` — and **current** here (unlike the other 2 leaf packages), HEAD `4114ba2`, 2026-08-10 ("Fix OSKWKCallVideoView thread safety and rendering reliability (#16)").
- **No `develop` branch exists** in this repo at all (branches: `master`, `change-path`, `fix-call-kit`, `use-stasel`, `whisper`).
- Real tags exist consistently as bare semver (`1.0.0` through `1.1.7`), matching `master` HEAD (0 commits behind latest tag).

## Version pinned by `ios-oskey-dev`

`ios-oskey-dev`'s real, authoritative `Package.resolved` pins commit `e8aeea9d4cc1333c007440137df9c1d915917881` (tag `1.1.6`) — 1 patch version behind this repo's real latest tag (`1.1.7`). `config/repos.json`'s entry for this repo pins to that exact commit rather than `master`, for consistency with the other 2 leaf packages' pinning strategy (even though `master` happens to be current here) — see `ios-oskey-dev/03-...md` for the full reasoning.
