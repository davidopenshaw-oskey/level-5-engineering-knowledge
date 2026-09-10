# `swift-ui-kit-oskey-dev` — Real Repo Snapshot, 2026-09-09

Brought into scope 2026-09-09, after `ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` §2 flagged it as a real dependency not in the original 4-repo onboarding list. Scope decision: confirmed in-scope after checking real usage (see below) — not just present in the lockfile. Full cross-repo context: `governance/roadmap/ios-oskey-dev/06-two-additional-packages-brought-into-scope-2026-09-09.md`.

## Package shape

- Package name: `OSKUIKit`
- `swift-tools-version:5.9`
- Platforms: `.iOS(.v15)`, `.watchOS(.v8)`, `.visionOS(.v1)`
- **Single target**: `OSKUIKit` (+ `OSKUIKitTests`)
- Real external dependencies: `PopupView` (Mijick), `PhoneNumberKit`, `SDWebImageSwiftUI`, `SkeletonUI`
- 103 real Swift files total

## Real usage in `ios-oskey-dev` — confirmed, not assumed

`grep -rl "^import OSKUIKit"` across `ios-oskey-dev`'s real source: **179 files**. By far the most heavily used of any sibling OSkey package found so far — general shared SwiftUI component library (buttons, avatars, styles, view modifiers), not a narrow feature.

## Branch/tag reality

- Default branch: `master` — **stale and anomalous**: 3 different tags (`1.0.1`, `1.7.8`, `1.8.6`) all point at the same old `master` HEAD commit, a real, separate tag-data-quality issue from the naming-inconsistency problem already found on `ios-oskey-dev` itself. Do not pin here.
- `develop`: current, HEAD `9a75c7c6` ("Update icon notification (#182)", 2026-03-24), matches the real latest tag (`2.2.5`, 0 commits behind).

## Version pinned by `ios-oskey-dev`

`ios-oskey-dev`'s real, authoritative `Package.resolved` pins commit `9a75c7c6bc2b1d3b8f44d4457618f34295c838c5` (tag `2.2.5`) — **exactly matches this repo's own real latest tag, no version-drift gap** (unlike the first 3 leaf packages, which were each 1-2 patches behind). `config/repos.json` pins to that exact commit, consistent with the other leaf packages' commit-pinning strategy.
