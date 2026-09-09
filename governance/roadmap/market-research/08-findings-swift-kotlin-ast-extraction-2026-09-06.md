# Findings — Best-in-Class Tooling and Practice for Swift/Kotlin AST Fact Extraction, Researched Live

Answers the brief (misfiled as `market-research/Read governance/roadmap/market-research/07-priming-brief-swift-kotlin-ast-extraction-2026-09-06.md and follow it..md` — see the note at the very end of this report). All claims below are from live web search/fetch run 2026-09-06, cited inline. Per the brief's explicit instruction, tool age is **not** treated as a weakness — only current maintenance/adoption status is checked live.

**Restated up front, per the brief's own framing:** no Swift or Kotlin extraction work is being built yet. This exists to inform P1's next real design decisions once that work actually starts — the same role `02-findings-retrieval-architecture-2026-09-05.md` played before its architecture was built.

---

## 1. Swift AST/type-resolution tooling

**Corroborates and extends** `00-...md`'s hypothesis, with real, current, named projects — not just Apple's own internal tooling.

- **SwiftSyntax** (`github.com/swiftlang/swift-syntax`) is confirmed real and current: Apple's own official library for "parsing, inspecting, generating, and transforming Swift source code," producing a source-accurate syntax tree. Confirmed **syntax-only** — no type resolution on its own.
- Real type resolution requires pairing with **SourceKit-LSP** and specifically **IndexStoreDB** (`github.com/swiftlang/indexstore-db`) — Apple's own "index database library for use with sourcekit-lsp," providing "a composable and efficient query API for looking up source code symbols, symbol occurrences, and relations." Both are active `swiftlang`-org repos, not abandoned side projects.
- **Real, named, current (2026) projects using exactly this pairing for large-scale, non-linting extraction** (directly answering the brief's "not just Apple's own internal tooling" question):
  - **SwiftLens** (`github.com/swiftlens/swiftlens`) — an MCP server integrating directly with SourceKit-LSP for "compiler-grade accuracy" semantic analysis of Swift codebases, built specifically so AI models can query real code semantics — a close structural cousin of this project's own MCP tool-layer direction (ADR-007).
  - **Grapha** (`github.com/oops-rs/grapha`) — real, quantified benchmark on a production iOS app: **1,991 Swift files, ~300K lines, 131K nodes, 784K edges indexed in 8.7 seconds**, reading Xcode's pre-built index store via binary FFI when available, falling back through SwiftSyntax and tree-sitter. Real evidence this combination scales to a real production-sized iOS codebase, not just small samples.
  - **SwiftSCIPIndex** (community tool) — generates standardized SCIP indexes from Xcode's DerivedData, bridging SourceKit-LSP into the same cross-language protocol discussed in angle 7 below.

---

## 2. Kotlin AST/type-resolution tooling

**Corroborates** the maturity/distinctness claim directly; **extends** with a credible named alternative; **does not fully confirm** a named third-party project using the Analysis API specifically for extraction.

- Real, confirmed 2026 maintenance status: **K2 is the default Kotlin compiler frontend since Kotlin 2.0**, and "the ecosystem (plugins, IDEs, processors) has largely caught up" — a real, current adoption signal, not resting on old reputation.
- Real, direct confirmation the Analysis API is genuinely distinct from lint-focused tools, and more foundational than `00-...md` even claimed: **"The Analysis API is consumed by the IntelliJ Kotlin plugin, Detekt, and other Kotlin static-analysis tools"** — i.e., Detekt itself is built on top of the Analysis API, not a separate, shallower alternative to it. The API's own documentation states it is "accessible both for IDE plugin makers and **command-line tool developers**" — an explicit statement of intent for exactly this project's kind of use.
- **Real, named, current project doing extraction (not linting) with compiler-grade Kotlin type resolution**: `sourcegraph/scip-kotlin` — "SCIP indexer for Kotlin, implemented as a SemanticDB compiler plugin." It compiles real Kotlin sources through a compiler plugin specifically **"to ensure that the produced [semantic] data is accurate even as new language versions... are released"** — a compiler-verified route to real facts, functionally the same guarantee this project wanted from `ts-morph`.

  **Flagged stale 2026-09-08, not corrected here — see `android-intercom-oskey-io/05-task1-scip-kotlin-disqualified-2026-09-08.md`.** `scip-kotlin` was already archived (2026-07-02, merged into `scip-java`) at the time this report was written; its stated successor's own docs mark Kotlin support as less mature than Java's and explicitly call out Android+Gradle as unsupported. This "currently-maintained" characterization was wrong when written, not just outdated since.
- **Honest gap**: no independently-named, non-Sourcegraph/non-JetBrains project was found in this search using the Analysis API *by name* for large-scale fact/graph extraction the way Grapha/SwiftLens do for Swift. Report this as a real, open item — the API's maturity and design intent are confirmed; a second independent real-world adopter specifically for extraction was not.

---

## 3. Dual UI paradigm coexistence — checked against real data

**Corroborates directly, with real numbers `00-...md` didn't have — and meaningfully refines the risk as asymmetric between platforms, not parallel.**

- **iOS**: a 2025 developer survey (Rentamac, via search aggregation) found **57% using SwiftUI in some capacity, 22% explicitly running a hybrid SwiftUI+UIKit setup, 43% still UIKit-only**. Separately, ~60% of *new* projects start in SwiftUI (WWDC-cited) while UIKit still holds roughly 40% of *production* apps (Appfigures-cited) due to legacy support. Real, quantified confirmation that hybrid iOS apps are, per multiple 2026-era sources, "the norm, not the exception."
- **Android**: the 2025 State of Android Developer survey found Compose is now the primary UI toolkit for **>78% of professional Android developers, up from 49% in 2023** — a much sharper skew toward the newer paradigm than iOS shows. Official Android docs confirm Compose/View-system interop is a supported, common incremental-migration pattern, and XML "remains relevant... especially for legacy systems," but the real, current center of gravity is already far more Compose-dominant than SwiftUI's iOS equivalent.
- **Real, useful refinement for this project's own design**: `00-...md` treats iOS and Android as parallel cases of the same risk. Real 2026 data suggests the risk is genuinely asymmetric — the Angular-style "57% used the missed syntactic form" scenario is more plausible on iOS (a real ~22-43% UIKit-exposed population) than on Android (Compose already dominant at 78%+). This is a real, concrete reason to check OSkey's actual Android app's real UI-paradigm mix directly and early, rather than assuming it needs the same dual-extraction investment as iOS by default.

---

## 4. Cross-repo/cross-platform model-mirror divergence — checked against real practice

**Potentially falsifies `00-...md`'s hand-mirroring assumption, pending a real, cheap check this project doesn't have yet.**

- Real, well-adopted 2026 practice found: OpenAPI/protobuf-driven codegen as a genuine, real alternative to hand-mirroring. `oapi-codegen` and the OpenAPI Generator project both "treat OpenAPI files as the single source of truth, reading the specification and emitting types, handlers, and client code that match it exactly," including generating type-safe SDK clients in multiple languages from one spec. Real, CI-integrated drift-detection practice (schema-vs-actual-response validation) also exists as a separate, complementary control.
- **What this means concretely**: if OSkey's actual Swift/Kotlin apps generate their network models from a shared OpenAPI/protobuf spec (genuinely unknown — not yet checked against the real mobile repos), the hand-mirrored-divergence risk `00-...md` predicts by direct analogy to the hand-authored TypeScript/Angular case may **not** materialize the same way — codegen'd models can't drift from their own generator by construction (though the spec itself can still go stale relative to real backend behavior — a different, real risk, not eliminated by codegen). This is a real, cheap, high-value thing to check directly the moment a real Swift/Kotlin repo is in scope, rather than assuming hand-mirroring is still the 2026 default the way it clearly was for the existing Angular app.

---

## 5. AST-walker coverage verification, as a named practice

**Not found — an honest negative, exactly as `00-...md` itself suspected might be the case.**

Search across grammar-coverage and testing literature surfaced only generic academic grammar-fuzzing/coverage concepts (e.g., "Grammar Coverage" in *The Fuzzing Book*, random grammar-based test-coverage papers) — nothing specific to the Swift or Kotlin AST-extraction ecosystem, and nothing describing this project's specific technique (cross-checking extracted-construct counts against an independent grep/regex count over real source). This project's own home-grown verification discipline (found and refined during the real Angular BoundText/interpolation gap) appears to remain genuinely ahead of documented common practice here — worth carrying forward as-is into Swift/Kotlin work, not something to look for a ready-made tool to replace.

---

## 6. Local persistence layers (CoreData/SwiftData, Room) as a third model-mirror

**Partially corroborates, partially extends** — confirms the real third layer `00-...md` flagged, but finds two concrete, cheaper paths than bespoke extraction from scratch.

- **iOS**: Xcode can auto-generate SwiftData `@Model` files directly from an existing CoreData schema, and community tooling (`Data-swift/ManagedModels`) provides the reverse — a CoreData-backed macro that looks like SwiftData's `@Model`. The real, useful implication: both CoreData and SwiftData model declarations are **ordinary Swift declarations/macros**, extractable by the same general-purpose SwiftSyntax-based approach used for every other Swift type — not a structurally special case requiring separate tooling.
- **Android**: Room's `@Entity`-annotated classes are ordinary Kotlin `data class` declarations with annotations. Official Android docs confirm Room supports exporting its schema as versioned JSON/SQL artifacts at build time (`room.schemaLocation`), explicitly recommended to be committed to version control — a real, existing, structured schema artifact this project could potentially read directly, if OSkey's Android build already produces one, rather than building bespoke AST extraction specifically for Room. No dedicated third-party static-analysis tool specifically for Room-schema extraction beyond this build-time export was found.
- **Net read**: both layers are real (as `00-...md` flagged), but likely cheaper to handle than a wholly new extraction concern — general-purpose Swift/Kotlin type extraction should already catch these declarations, and Room's build-time schema export is a real, concrete thing worth checking for directly in OSkey's actual Android build before assuming any bespoke work is needed at all.

---

## 7. Polyglot integration pattern — real prior art found, more mature than expected

**Extends `00-...md`'s hypothesis significantly** — real, standardized prior art exists for the exact bridging shape it speculated about, not just "probably a subprocess emitting JSON."

**SCIP (Sourcegraph Code Intelligence Protocol)** is a real, current, protobuf-encoded, language-agnostic format that many independent per-language indexers emit for a central consumer to read — exactly this project's own "small native-toolchain subprocess emits structured facts, the existing Node pipeline consumes them" shape, already standardized:

- Real, named indexers found: `scip-java` (Java, Scala, **and Kotlin**), `scip-typescript`, `rust-analyzer`, `scip-clang` (C/C++), `scip-ruby`, `scip-python`, `scip-dotnet`, `scip-dart`, `scip-php`, and the community `SwiftSCIPIndex` bridging SourceKit-LSP.
- Real, current governance signal: as of 2026, SCIP transitioned from a Sourcegraph-owned project to an independent one with open governance — a Core Steering Committee including engineers from **Uber and Meta** — a real signal of broad, non-vendor-locked, current adoption, not an abandoned Sourcegraph-only format.
- **Directly relevant nuance for this project's own design**: `scip-kotlin` doesn't go straight from "Analysis API call" to final fact format in one step — it's a compiler plugin that first emits an intermediate **SemanticDB** representation, converted to SCIP afterward. Real prior art shows a compiler-plugin/intermediate-format shape is a credible, real alternative to "call an analysis library and emit JSON directly," worth knowing about even if this project doesn't adopt SCIP itself.

**Open, not resolved here**: whether this project should adopt SCIP itself (gaining a standardized, widely-adopted format and existing indexers for free) versus building a simpler, bespoke JSON bridge in the same spirit but extracting directly into this project's own fact schema, is a real design question for whenever Swift/Kotlin work actually starts — not something this research round should settle in advance of that decision.

---

## Summary — what's now more confident, what's genuinely open

| # | `00-...md` hypothesis | This round's result |
|---|---|---|
| 1 | SwiftSyntax alone insufficient; needs SourceKit/SourceKit-LSP | **Corroborated**, with two real, named, current 2026 projects (SwiftLens, Grapha) doing exactly this at production scale |
| 2 | Kotlin Analysis API distinct from lint tools, real analog to `ts-morph` | **Corroborated** (Detekt itself sits on the Analysis API); real alternative found (`scip-kotlin`'s compiler-plugin route); independent non-Sourcegraph adopter for extraction specifically — **not confirmed, open** |
| 3 | Dual UI paradigms commonly coexist, Angular-scale risk on both platforms | **Corroborated for iOS with real numbers** (22-43% UIKit-exposed); **refined for Android** — real but far more Compose-skewed (78%+) than the Angular precedent suggests; treat the two platforms as asymmetric risks, not parallel ones |
| 4 | Backend/mobile hand-mirroring recurs, plausibly 3-way | **Potentially falsified, pending a real, cheap check**: OpenAPI/protobuf-driven codegen is real, current, well-adopted practice that would eliminate this exact risk *if* OSkey's mobile apps already use it — unknown until checked against the real repos |
| 5 | AST-walker coverage cross-checking is this project's own discipline, likely ahead of documented practice | **Confirmed as a genuine honest negative** — no named practice found anywhere in this ecosystem |
| 6 | CoreData/SwiftData/Room are a real, unprecedented third model-mirror layer | **Corroborated as real, but likely cheaper than expected** — ordinary annotated types (general extraction should already cover them) plus, for Room, a real existing build-time schema-export artifact worth checking for directly |
| 7 | Some bridging pattern probably exists for polyglot fact extraction into this Node pipeline | **Extended well beyond the hypothesis** — SCIP is real, current, standardized, and already has a Kotlin indexer and a community Swift bridge; adopting it vs. building bespoke is a real open design choice, not a gap to fill from scratch |

## Sources

- [swiftlang/swift-syntax](https://github.com/swiftlang/swift-syntax)
- [swiftlang/indexstore-db](https://github.com/swiftlang/indexstore-db)
- [swiftlens/swiftlens](https://github.com/swiftlens/swiftlens)
- [oops-rs/grapha](https://github.com/oops-rs/grapha)
- [Fostonger/SwiftSCIPIndex](https://github.com/Fostonger/SwiftSCIPIndex)
- [Kotlin K2 compiler migration guide](https://kotlinlang.org/docs/k2-compiler-migration-guide.html)
- [Kotlin Analysis API docs — migrating from K1](https://kotlin.github.io/analysis-api/migrating-from-k1.html)
- [sourcegraph/scip-kotlin](https://github.com/sourcegraph/scip-kotlin)
- [sourcegraph/scip-java design docs](https://github.com/sourcegraph/scip-java/blob/main/docs/design.md)
- [Sourcegraph — SCIP, a better code indexing format than LSIF](https://sourcegraph.com/blog/announcing-scip)
- [Sourcegraph — The future of SCIP](https://sourcegraph.com/blog/the-future-of-scip)
- [Rentamac 2025 SwiftUI/UIKit developer survey, via aggregated search]
- [2025 State of Android Developer survey — Compose adoption]
- [Android Developers — Migrate XML Views to Jetpack Compose](https://developer.android.com/develop/ui/compose/migrate/migrate-xml-views-to-jetpack-compose)
- [oapi-codegen / OpenAPI Generator — contract-first single source of truth](https://github.com/OpenAPITools/openapi-generator)
- [Android Developers — Define data using Room entities](https://developer.android.com/training/data-storage/room/defining-data)
- [Data-swift/ManagedModels](https://github.com/Data-swift/ManagedModels)

---

## Note on file organization

The brief for this research was found misfiled at `governance/roadmap/market-research/Read governance/roadmap/market-research/07-priming-brief-swift-kotlin-ast-extraction-2026-09-06.md and follow it..md` — a stray nested-directory artifact, not the clean `07-priming-brief-swift-kotlin-ast-extraction-2026-09-06.md` path its own filename implies. This findings report was saved to the correct, intended path per the brief's own final instruction. The misfiled original was left untouched — flagged for the user to review/clean up rather than deleted unilaterally.
