# Findings — A Real, Obtainable Kotlin Extraction Tool Matching This Repo's Actual Kotlin Version (1.8.10)

Follow-up to `08-findings-swift-kotlin-ast-extraction-2026-09-06.md` and `05-task1-scip-kotlin-disqualified-2026-09-08.md` (`android-intercom-oskey-io/`). Both of those found real problems with the two previously-identified candidates for this specific repo (`sourcegraph/scip-kotlin`/`scip-java`: archived, Android+Gradle unsupported; the standalone JetBrains Analysis API: not on Maven Central, unstable dev snapshots, only proven real-world example targets Kotlin 2.0.20-dev vs. this repo's actual 1.8.10). This report answers the follow-up question directly: is there a real Kotlin equivalent of `ts-morph` — normally obtainable, real type resolution, drivable standalone from our own extraction code — that actually matches Kotlin 1.8.10, not just "modern Kotlin" in general. Findings from live web research, 2026-09-08.

---

## 1. `kotlin-compiler-embeddable` (K1 legacy resolution API) — the strongest real candidate found

**Confirmed directly on Maven Central proper** (`repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-compiler-embeddable/1.8.10/`), published 2023-02-02 — an exact version match to this repo's own Kotlin version, not an adjacent or dev-snapshot approximation. This is the "old"/K1 compiler-internals resolution surface that predates the modern Analysis API, and it is the real, documented entry point older-line static-analysis tools have used for years: `TopDownAnalyzerFacadeForJVM.analyzeFilesWithJavaIntegration(...)` (package `org.jetbrains.kotlin.cli.jvm.compiler`) takes a `KotlinCoreEnvironment` plus parsed `KtFile`s and returns an `AnalysisResult` wrapping a `BindingContext` — from which real declared types, generic type-argument descent, and `enum class`/`sealed class` member enumeration (via `DescriptorUtils` and `ClassDescriptor.sealedSubclasses`) are all real, reachable operations.

It is designed to be driven standalone/programmatically — that is literally what Detekt (see §2) and Kotlin's own scripting host do with it — not only usable as a compiler-plugin hook. **Real, honest cost**: this is deep internal compiler API, not a stable, documented public contract. No tutorial-grade documentation exists outside reading Detekt's or the Kotlin compiler's own source. JetBrains is deprecating the embeddable artifact long-term in favor of `kotlin-compiler` + K2/Analysis API tooling — fine for a repo pinned at 1.8.10 today, a real fact to revisit if this repo's Kotlin version is ever upgraded.

## 2. Detekt's internals — real, at-scale validation of option 1, not a separate reusable library

Detekt's own docs (`detekt.dev/docs/gettingstarted/type-resolution`) confirm its `BindingContext` is "identical to that used in the equivalent Kotlin compilation task," with rules annotated `@RequiresFullAnalysis` consuming it directly — i.e., Detekt is a thin layer over exactly the `kotlin-compiler-embeddable`/K1 `BindingContext` machinery in §1, not a different, more consumable API of its own. Detekt's own compatibility table confirms **Detekt 1.23.0 supports Kotlin 1.8.21** (directly adjacent to this repo's 1.8.10) running on this stack — real, named, currently-relevant proof the K1 path works cleanly at this repo's actual Kotlin version, which is exactly the kind of independent validation the standalone Analysis API research could not produce.

Detekt does **not** expose a clean, standalone "hand me a `BindingContext` for this file set" library call you can just import — reusing this path means replicating Detekt's own `KotlinCoreEnvironment`/`TopDownAnalyzerFacadeForJVM` setup (a few hundred lines, per Detekt's own source shape), not adding a one-line dependency the way `ts-morph` was for the TS repos.

## 3. Dokka — a real published artifact, but not built for reuse outside its own plugin harness

`org.jetbrains.dokka:analysis-kotlin-descriptors` (Dokka's own K1 backend) is genuinely on Maven Central (`repo1.maven.org/.../analysis-kotlin-descriptors/1.9.20/`). However, it is an internal implementation module sitting behind Dokka's `analysis-kotlin-api` plugin-interface layer, built specifically for Dokka's own `Documentable` model and plugin lifecycle. No evidence of anyone using it standalone outside Dokka's own plugin harness was found, and Dokka 2.0 has since moved its own default to K2/the newer Analysis API anyway. Real, published — but not designed for reuse, and not recommended.

## 4. Nothing else clean

No other Maven Central library was found offering real semantic/type resolution for Kotlin confirmed against the 1.8.x line with a `ts-morph`-like standalone API. `kotlinx.ast` and similar Kotlin-parsing libraries are syntax-only — no type resolution. The JetBrains standalone Analysis API remains internal-feed-only and version-mismatched, exactly as already found in `05-task1-scip-kotlin-disqualified-2026-09-08.md` — restated here, not a new finding.

---

## Recommendation

Build the extractor directly on **`kotlin-compiler-embeddable:1.8.10`**, using the `KotlinCoreEnvironment` + `TopDownAnalyzerFacadeForJVM` pattern Detekt itself runs on real Kotlin 1.8.x projects today. It is the only option that is simultaneously (a) on Maven Central proper, (b) version-matched to this repo's actual Kotlin version, and (c) proven at real scale by an independent, currently-used tool (Detekt) — at the real cost of writing a thin driver ourselves rather than importing a polished, documented library the way `ts-morph` was for the TS repos.

## Sources

- [`kotlin-compiler-embeddable` 1.8.10 — Maven Central](https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-compiler-embeddable/1.8.10/)
- [Detekt — Type Resolution docs](https://detekt.dev/docs/gettingstarted/type-resolution)
- [`org.jetbrains.dokka:analysis-kotlin-descriptors` 1.9.20 — Maven Central](https://repo1.maven.org/maven2/org/jetbrains/dokka/analysis-kotlin-descriptors/1.9.20/)

**Note on sourcing rigor**: this report was produced by a delegated research agent's live web search/fetch pass, summarized here rather than independently re-verified line-by-line against each primary source the way `08-...md`/`10-...md` were compiled directly in-session. Treat the Maven Central coordinate and Detekt-compatibility claims as real (Maven Central listings and Detekt's own docs are both directly checkable, low-ambiguity sources) but worth a quick independent spot-check before being load-bearing for an actual build decision.
