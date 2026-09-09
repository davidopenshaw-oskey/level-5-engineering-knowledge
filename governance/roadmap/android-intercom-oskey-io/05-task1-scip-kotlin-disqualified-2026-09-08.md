# Task 1 Review — `scip-kotlin`/SCIP Route Disqualified by Real, Verified Facts — 2026-09-08

**Purpose of this file:** the user asked for a real review of Task 1 (`02-p1-build-tasklist.md`, tool choice), starting from what the folder already says. Live checks against `sourcegraph/scip-kotlin` and its stated successor turned up real, disqualifying facts that `market-research/08-findings-swift-kotlin-ast-extraction-2026-09-06.md` and `00-phase1-ast-extraction-design.md` did not have. This narrows Task 1 materially — recorded here rather than silently changing the recommendation.

## Real findings (live checks, 2026-09-08)

**`sourcegraph/scip-kotlin` is archived.** Direct check of `github.com/sourcegraph/scip-kotlin`: archived by the owner **2026-07-02**, with the repo's own notice stating "This repository has been merged into scip-java and is no longer relevant. Please refer to that repository going forward." `market-research/08-...md` (published 2026-09-06, over two months *after* the archival) described it as "a real, named, currently-maintained compiler-plugin route" — that characterization was already wrong at the time it was written, not something that went stale afterward. A real research gap, not a moving target.

**Its version-compatibility table does confirm this repo would have been in range**, for the record: Kotlin 1.8.x → scip-kotlin 0.3.2 (this repo is on Kotlin 1.8.10, per `00-...md`). Compatibility was never the blocker — maintenance status and its successor's limitations are.

**The stated successor, `sourcegraph/scip-java`, explicitly does not support this repo's actual build shape.** Direct checks of its docs:
- Kotlin support is present but explicitly flagged by the project itself as **"less mature compared to the Java support."**
- **Kotlin indexing on Gradle is supported; Kotlin indexing on Maven is not.** Not relevant to us either way (this repo is Gradle), but a signal of how partial the Kotlin support is.
- **Android+Gradle integration is explicitly called out as unsupported, tracked as a known limitation** in the project's own docs. This repo is exactly that shape — 5 real Gradle modules built via AGP (Android Gradle Plugin), Compose, Hilt/kapt. This is not a maturity risk to weigh, it's a direct "this doesn't work for our actual build" disqualifier, assuming the tracked limitation is still current (docs give no resolution date — worth a fresh check only if this recommendation is ever revisited).
- **Most recent release: v0.13.1, July 2024** — over two years stale as of today (2026-09-08), no 2026 release found.

## What this changes

Task 1 (`02-p1-build-tasklist.md`) framed this as a 3-way prototype-and-compare decision (standalone Analysis API vs. `scip-kotlin` vs. kotlinc-direct). It is no longer that:

- **`scip-kotlin`/SCIP route: disqualified**, not just de-prioritized. An archived tool whose own stated successor doesn't support Android+Gradle builds is not a real candidate for this repo, regardless of how well `08-...md`'s Kotlin-version-compatibility table lined up. This also means the SCIP snapshot/golden-testing benefit `01-standing-principles-...md` flagged as coming "for free" with this route is off the table — this project's own existing reactive grep-cross-check discipline (the "92 of 160" technique) remains the real coverage-verification method for Kotlin, same as it was before this route was ever considered.
- **Standalone Kotlin Analysis API becomes the clear front-runner**, not one of three roughly-equal options. It was already the more architecturally consistent choice (same "own a direct compiler-API-based walker" shape as `ts-morph` in all three existing pipelines, versus SCIP's generic-protocol-plus-translation-layer shape) — now it's also the only candidate not actively disqualified by a real, checked fact.
- **kotlinc-direct stays a real, live question, but looks partial at best**, unchanged by today's findings: `00-...md`'s own facts show Hilt runs via `kapt` in `app` and 2 of the 4 library modules — meaning at least those modules need Gradle-driven annotation-processing output on the classpath before types resolve cleanly, regardless of whether `kotlinc` is invoked directly afterward. Whether the other 2 library modules (and whether they're even plain Kotlin/JVM modules vs. Android library modules needing `android.jar`/resource merging) are clean enough for a true kotlinc-direct path is not yet checked — real open item, not resolved by today's findings, but no longer worth spending prototype time on across all 5 modules given the Analysis API front-runner is viable repo-wide.

## Real remaining open item — the one thing not yet checked

`00-...md`'s own honest gap stands: the K1 compiler frontend has been proven to resolve this repo's types (via a real, successful `./gradlew compileDevelopmentDebugKotlin`), but the **standalone Analysis API library itself has not been instantiated against this repo** — that's a proxy, not the same test. This is now the single concrete next step for Task 1, not one of three parallel prototypes. That step is build-mode work (writing and running a real small program against `analysis-api-standalone`), deliberately not done in this review.

## Flags added, originals not rewritten

- `market-research/08-findings-swift-kotlin-ast-extraction-2026-09-06.md` §2 — its `scip-kotlin` characterization is now known-stale; flagged there, text left intact per this project's mark-don't-rewrite convention.
- `00-phase1-ast-extraction-design.md` and `02-p1-build-tasklist.md` — flagged at their respective `scip-kotlin` mentions, pointing here.
