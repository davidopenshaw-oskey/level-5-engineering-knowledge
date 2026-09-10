# Scope Decision: `swift-ui-kit-oskey-dev` and `swift-ai-kit-oskey-io` Brought Into Scope, 2026-09-09

Resolves the open scope question raised in `02-real-repo-inspection-findings-2026-09-09.md` §2 and tracked as open in `04-task1-pre-design-checklist-2026-09-09.md`. Real decision rule, set by the user directly: **if the app is actually using it, bring it into scope** — because generating a solid atomic PRD from the corpus needs these facts extracted if the app depends on them for real. Both were checked directly against real usage before deciding, not added on the strength of appearing in `Package.resolved` alone (a lockfile can list something without the app's own code ever importing it — checked, not assumed).

## Real usage check, the actual decision criterion

| package | real module name to `import` | files in `ios-oskey-dev` that import it | verdict |
|---|---|---|---|
| `swift-ui-kit-oskey-dev` | `OSKUIKit` | **179** | heavily used — general shared SwiftUI component library |
| `swift-ai-kit-oskey-io` | `SwiftRecognition` (not `OSKAIKit` — see its own snapshot doc) | **4** | small footprint, but real and business-relevant: on-device face recognition as a door-unlock access method (`iOS App/Presentation/FaceRecognition/`, `AccessMethods/OSKAccessMethodView.swift`) |

Both pass the bar. Full per-repo facts (package shape, branch/tag reality, exact version pin): `governance/roadmap/swift-ui-kit-oskey-dev/00-repo-snapshot-2026-09-09.md` and `governance/roadmap/swift-ai-kit-oskey-io/00-repo-snapshot-2026-09-09.md`.

**Real, notable difference from the first 3 leaf packages**: both of these are pinned by `ios-oskey-dev` at *exactly* their own real latest tag — zero version-drift gap, unlike `swift-ble-kit-oskey-dev`/`swift-cloud-kit-oskey-dev`/`swift-webrtc-kit-oskey-io`'s real 1-2 patch-version lag (`02-...md` §4). Not something to generalize from (2 data points), just recorded as real and different.

**Real, new risk worth carrying forward**: `swift-ai-kit-oskey-io` is genuinely different in kind from every other Swift repo in this onboarding — a 4-Swift-file wrapper around a C++ face-recognition core (`ncnn`/`opencv2`/Swift-C++ interop), not a pure-Swift library. Whether SwiftSyntax-only extraction can usefully describe this repo at all is a real, untested question for whenever its own Task 1 design happens — see its snapshot doc.

The 2 additional packages also mean the family this onboarding covers is now **6 repos**, not 4 (`ios-oskey-dev` + 5 first-party OSkey packages) — `config/repos.json` and `04-task1-pre-design-checklist-2026-09-09.md` updated accordingly.

## `master` branch — confirmed by the user, not just evidence-inferred

The open question in `03-branch-tag-and-version-pin-strategy-2026-09-09.md` ("not yet confirmed with the actual iOS team whether `master`'s tip is genuinely live for 100% of users, or could reflect a staged rollout") is resolved: the user confirmed directly, 2026-09-09, to use `master` — the real evidence already gathered (real release train `develop → staging → master`, `MARKETING_VERSION` matching `master`'s tip) was sufficient to decide without needing to separately ask the iOS developer. `config/repos.json`'s `ios-oskey-dev` entry updated to reflect this as a confirmed decision, not an inferred-but-unconfirmed one.
