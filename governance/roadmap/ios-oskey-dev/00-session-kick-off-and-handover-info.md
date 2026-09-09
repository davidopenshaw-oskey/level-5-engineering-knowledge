We're starting the iOS/Swift onboarding for this pipeline — same real goal as android-intercom-oskey-io (already built through Task 4), but for the sibling iOS door-access app. No Swift/iOS repo has been added to config/repos.json yet; nothing below has been checked against real Swift code.

Read, in this order:

governance/roadmap/swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md — items 1-9 are anticipation from general language knowledge (not yet checked against real code); item 10 is live-researched 2026-09-09 findings on real Swift tooling. Note which parts are checked vs. anticipated.
governance/roadmap/swift-kotlin-preparation/01-real-findings-from-android-intercom-onboarding-2026-09-07.md — real, testable predictions for the iOS repo specifically, since it's very likely the same product family (same physical door-access hardware) as the Android app.
governance/roadmap/android-intercom-oskey-io/ (files 00-11) — not for Kotlin-specific technical answers, but as a worked example of the methodology that just ran end-to-end on a sibling repo.
governance/roadmap/pipeline-layers-and-cross-repo-business-flows.md — how Layer 1 facts need shaping so a future Layer 3 cross-repo join can connect this repo to node-iot/Firebase's facts.
What should NOT be assumed to transfer: the tool choice (Swift's landscape is genuinely different from Kotlin's), the specific same-package resolution logic (Swift's visibility rules differ from Kotlin's), any tree-sitter-kotlin-specific grammar workaround.

What should transfer, as discipline, not as an answer: verify every tool claim against the real pinned Swift/Xcode version the moment a real repo exists; run a small bounded test on real files, not a hand-typed snippet (today's Kotlin session got burned by exactly that once); re-verify every fix by re-running, not re-reading; write findings to the roadmap folder as they happen.

Concrete first step: once the real repo is cloned, do the real-repo-inspection pass first (branch/tag situation, real module structure, real pinned Swift version, one real toolchain check) — don't jump to writing an extraction script.