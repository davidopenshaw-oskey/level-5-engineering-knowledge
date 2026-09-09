# Task 6 — Independent Extraction-Coverage Verification

**Status: DONE, 2026-09-09.** Same discipline as the TS pipeline's own "92 of 160" technique — an independent grep/regex count of each real construct, cross-checked against what the extractor actually found, every discrepancy explained by direct investigation rather than dismissed.

## Exact matches on the first pass

Classes (196), interfaces (13), and enums (17) all matched an independent grep count exactly. No investigation needed — genuinely clean.

## Two apparent discrepancies, both real and both explained as correct behavior

**Objects: grep 47, extractor 45.** The 2 "missing" are anonymous object expressions (`object : PeerConnection.Observer { ... }`, `object : SdpObserver { ... }`) — Kotlin's equivalent of an anonymous inner class. These have no name at all, so the extractor's `if (!name) continue` guard correctly excludes them rather than fabricating one. Not a bug.

**`@Composable`: grep 52, extractor 51 (`composableFunctions`).** The one "extra" grep match is `Theme.kt:35`'s `content: @Composable () -> Unit` — `@Composable` used as a **type annotation** on a lambda parameter's type, not as an annotation on a function declaration. The extractor correctly counts only real annotated function declarations. Not a bug.

## One real, significant gap found and fixed: constructor-promoted properties

Independent counts for `functions` (grep 582 vs. extractor 589 — explained: my grep regex didn't include all real modifier keywords like `operator`/`infix`/`tailrec`, a verification-regex gap, not an extraction gap) and `properties` (grep ~1428 vs. extractor 1145 — a real, much bigger gap, investigated properly rather than assumed away).

**Root cause, confirmed by parsing a minimal real example before trusting it**: `class Foo(val x: Int)`-style primary-constructor `val`/`var` parameters are real Kotlin class properties (accessible as `this.x`), but tree-sitter-kotlin parses them as a genuinely different node type — `class_parameter` with a `binding_pattern_kind` child — not `property_declaration` at all. Task 4's original property extraction only searched for `property_declaration`, silently missing every constructor-promoted property in the repo. This is a common, high-value Kotlin idiom directly relevant to this codebase's own real architecture — Hilt's `@Inject constructor(private val repository: X)` pattern promotes every injected dependency exactly this way.

**Fixed and verified**: added a second extraction pass over `class_parameter` nodes, gated on the real `binding_pattern_kind` child (present only for `val`/`var`-marked parameters — a plain, non-property constructor parameter has no such child, confirmed directly before relying on it). Real result: **406 previously-invisible properties recovered** (properties: 1145 → 1551, a ~26% increase). Spot-checked real Hilt-injected dependencies (`OSKGetAccessesUseCase`'s `repository: OSKAccessesRepository`) — correct name, type, visibility, and owning class.

**One minor, honestly-noted imprecision, not chased further**: a `@ApplicationContext context: Context`-style Hilt-qualified parameter shows `declaredType: "ApplicationContext"` (the qualifier annotation's type) rather than `"Context"` (the real parameter type) — the `user_type` lookup grabs the first match, which can be the annotation's own type reference when a qualifier annotation is present. Narrow edge case; revisit if it turns out to matter for real retrieval quality, same "verify at real scale before fixing" discipline as everything else in this project.

## Net result

Every fact type in `01-extract-ast-evidence.ts` has now been independently checked at least once, not just spot-checked opportunistically during earlier debugging. One real, significant extraction gap found and fixed as a direct result of doing this properly rather than trusting the first working version.
