# `swift-ai-kit-oskey-io` — Real Repo Snapshot, 2026-09-09

Brought into scope 2026-09-09, after `ios-oskey-dev/02-real-repo-inspection-findings-2026-09-09.md` §2 flagged it as a real dependency not in the original 4-repo onboarding list. Scope decision: confirmed in-scope after checking real usage (see below) — not just present in the lockfile. Full cross-repo context: `governance/roadmap/ios-oskey-dev/06-two-additional-packages-brought-into-scope-2026-09-09.md`.

## Package shape — real, genuinely different in kind from the other leaf packages

- Package name: `OSKAIKit`. **The real importable module name is `SwiftRecognition`, not `OSKAIKit`** — the product wraps a differently-named target; `import OSKAIKit` does not resolve to anything (checked directly, 0 matches), `import SwiftRecognition` does. Worth remembering the moment Task 1 extraction design starts for this repo, or the wrong module name will silently mismatch.
- `swift-tools-version: 5.10` (matches `swift-webrtc-kit-oskey-io`'s higher floor, not the `5.9` most other kits use)
- Platforms: `.iOS(.v15)`, `.visionOS(.v1)`
- **Not a pure-Swift library** — real on-device computer-vision/face-recognition code: a Swift target (`SwiftRecognition`) wrapping a C++ target (`CxxRecognition`, via Swift/C++ interop) which itself links 5 real, prebuilt `.binaryTarget`s: `ncnn`, `opencv2`, `MoltenVK`, `glslang`, `openmp` — real ML-inference and GPU-shader libraries, not OSkey's own code. Only **4 real Swift source files** in the whole repo (the rest is C++/headers/binary frameworks, not inventoried here).
- **Real, new AST-extraction risk this repo introduces that no other repo in this project has needed yet**: any real business logic here is likely split across the Swift/C++ boundary (`swiftSettings: [.interoperabilityMode(.Cxx)]`), not contained in Swift syntax alone. Whether SwiftSyntax-only extraction can see anything meaningful in a 4-Swift-file wrapper around a C++ core is a real, open, untested question — flagged for whenever this repo's own Task 1 design happens, not resolved here.

## Real usage in `ios-oskey-dev` — confirmed, not assumed

`grep -rl "^import SwiftRecognition"` across `ios-oskey-dev`'s real source: **4 files**, all inside `iOS App/Presentation/FaceRecognition/` (`FaceEmbedder.swift`, `OSKRecognitionCameraView.swift`, `OSKCameraView.swift`) and `iOS App/Presentation/AccessMethods/View/OSKAccessMethodView.swift`. Small footprint, but a real, live, business-relevant feature — on-device face recognition as a door-unlock access method, matching the `FaceRecognition` folder (23 real files) and git branch already visible in `ios-oskey-dev`. This is exactly the kind of fact ("what access methods does this door-access product actually support, and how") the atomic-PRD/corpus goal cares about — real justification for bringing this repo into scope despite its small direct footprint.

## Branch/tag reality

- Default branch: `master` — and **current** here (like `swift-webrtc-kit-oskey-io`), tag `1.1.2` points exactly at `master` HEAD (`cee618a8`, 2026-03-18).
- **No `develop` branch exists** (branches: `master`, plus several `feature/`/`bug/`/`task/` branches).

## Version pinned by `ios-oskey-dev`

`ios-oskey-dev`'s real, authoritative `Package.resolved` pins commit `cee618a81d1776d87741fdf00de6276eee9fceb6` (tag `1.1.2`) — **exactly matches this repo's own real latest tag and `master` HEAD, no version-drift gap**. `config/repos.json` pins to that exact commit, for consistency with the other leaf packages' pinning convention, even though `master` itself happens to already be correct here.
