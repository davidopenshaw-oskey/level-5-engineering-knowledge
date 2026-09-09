# Does the Repo→Expose-Interface→Cross-Repo-Join Methodology Fit a 4-Repo iOS App?

**Real, honest epistemic status:** this is architectural reasoning by analogy to the existing, proven pipeline layering — not yet checked against any real iOS repo, real `Package.resolved`, or real code. No repo has been cloned as of this writing. Verify every claim below the moment real repos exist, the same discipline as everything else in this project.

## The real question

The iOS door-access app is not one repo with multiple modules (the way `android-intercom-oskey-io` is one repo with 5 Gradle modules) — it's **four separate git repositories**: `ios-oskey-dev` (the app), `swift-ble-kit-oskey-dev`, `swift-cloud-kit-oskey-dev`, and a fourth WebRTC package (real name unconfirmed — see naming note below). `ios-oskey-dev` almost certainly consumes the other three as Swift Package Manager dependencies, not as subdirectories. Does this project's existing methodology (per-repo AST facts → each repo exposes an interface → a cross-repo layer joins them) still apply, or does this shape need something new?

## The answer: yes, it applies — and fits more naturally here than Android's case did

What made Android's `app` + 4 Gradle library modules "cross-module" rather than "cross-repo" was that they all live in one git checkout — Task 3's own BFS (`android-intercom-oskey-io/10-...md`) treated them as one connected import graph, and a real, non-trivial engineering effort went into building that within-repo resolution correctly.

For iOS, that whole problem doesn't need solving the same way, because it doesn't exist in the same shape: `swift-ble-kit-oskey-dev` etc. aren't reachable via a same-checkout import graph at all — they're external package dependencies, pinned via `Package.swift`/`Package.resolved`. What would have been "within-repo module coupling" for Android is, structurally, already **Layer 3** territory (`governance/roadmap/pipeline-layers-and-cross-repo-business-flows.md`) — the existing `pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/` machinery that joins each repo's own already-extracted "exposed interface" facts by name across repo boundaries, real and proven for Firebase↔Angular and Firebase↔node-iot's own callable/API-contract joins. No new pipeline architecture is needed — four more repos plug into the pattern that already exists, arguably more cleanly than Android's single-repo case did (no bespoke intra-repo BFS needed for these four at all; each is just another Layer-1 repo, joined at Layer 3).

## Two real, new nuances this specific shape introduces — not blockers, but genuinely new for this project

**1. Version-pin consistency across the cross-repo join.** Android's `kotlin-ble-kit-oskey-io` module was always trivially in sync with `app` (same repo, same commit, by construction). Here, `ios-oskey-dev`'s `Package.resolved` pins a *specific version* of each sibling repo. If `config/repos.json` extracts `swift-ble-kit-oskey-dev` at its own `develop` HEAD while `ios-oskey-dev` actually integrates against, say, `v2.1.0`, the cross-repo join could connect facts describing code that isn't really what's integrated — a real, new failure mode this project's existing repo pairs (Firebase/Angular/node-iot, all independently versioned services, not package-dependency-pinned) never had to consider. **Concrete recommendation:** read `ios-oskey-dev`'s real `Package.resolved` the moment it's cloned, and consider pinning each sibling repo's own `config/repos.json` entry to the *actual resolved version* `ios-oskey-dev` depends on, not independently to `develop`/`main` — mirroring the same "check the real thing, don't assume" discipline the Kotlin repo's own branch/tag investigation already established.

**2. The wire-format facts become first-class exposed-interface facts, not just internal enrichment.** `android-intercom-oskey-io`'s BLE UUID/USB constant/WebRTC-touchpoint facts (`12-task5-wire-format-facts-built-and-verified-2026-09-09.md`) were valuable mainly as domain-specific detail *within* one repo's own corpus. For iOS, since `swift-ble-kit-oskey-dev` is a separate repo, its own BLE UUID table *is* the exposed interface `ios-oskey-dev` (and Layer 3) need to join against — design these facts with that cross-repo join in mind from day one, not as an afterthought once the join is attempted.

## On sequencing: leaf packages first, then `ios-oskey-dev`

Agreed, for a concrete reason beyond "smaller first": the leaf packages are very likely lower-risk places to validate the real Swift tool choice (SwiftSyntax/SourceKit-LSP vs. `tree-sitter-swift`, per `swift-kotlin-preparation/00-...md` item 10) — probably no SwiftUI/UIKit duality risk at all (pure libraries, no UI code), smaller real file counts, the same "bounded test before scaling" discipline that worked for Kotlin's own Task 1. And once a leaf repo's exposed-interface facts exist for real, `ios-oskey-dev`'s own onboarding has something real to join against immediately, rather than designing the join in a vacuum.

## Honest caveat

No repo in this project has been onboarded in this "N sibling repos consumed via a package manager, one pinning specific versions of the others" shape before. Layer 3 was designed for and proven against independently-deployed service pairs (a backend and a frontend calling it), not yet a package-dependency graph where one repo's build literally pins another's version. Treat this whole document as a real, fresh hypothesis for that layer, not an assumed-safe replay — verify against `ios-oskey-dev`'s actual `Package.resolved` the moment it exists.

## Naming note, not yet resolved

This folder's own subfolder is named `swift-webrtc-kit-oskey-io`; the name given verbally for this same repo was `swift-webrtc-kit-oskey-dev`. Worth confirming the real repo name before it gets used anywhere load-bearing (a `config/repos.json` `gitUrl`, a cross-repo join key) — a mismatch here would silently break the exact join mechanism this document just argued for.
