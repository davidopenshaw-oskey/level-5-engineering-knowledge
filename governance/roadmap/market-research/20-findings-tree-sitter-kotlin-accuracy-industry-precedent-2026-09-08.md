# Findings — Tree-sitter-Kotlin's Accuracy Gap, Alternative Lightweight Parsers, and How Sourcegraph Handles This

Follow-up to `19-findings-kotlin-extraction-tool-1810-compatibility-2026-09-08.md`. That report's recommendation (`kotlin-compiler-embeddable`) prompted a real question: given tree-sitter's huge industry footprint, has someone already solved its self-reported 61.2%-structural-match gap for Kotlin, is tree-sitter even the only lightweight option, and how does a company like Sourcegraph — much larger scale, same underlying problem — actually handle a language without a mature semantic indexer? Findings from live web research, 2026-09-08, run directly in-session (not delegated).

---

## 1. Has anyone addressed tree-sitter-kotlin's accuracy gap?

**No confirmed fork or successor with materially better structural accuracy was found.** `fwcd/tree-sitter-kotlin` remains the standard community grammar, with no evidence of an independent, more-accurate competitor.

**What real production consumers of tree-sitter actually need turns out to be much coarser than what we need.** GitHub's own requirement for a language to get tree-sitter-based code navigation on GitHub.com is just "a mature tree-sitter parser… published as a Rust crate, and the parser must include a valid `tags.scm` query" — i.e., enough to tag symbol definitions for jump-to-definition, not byte-perfect AST structure. Similarly, newer tree-sitter-based semantic-search tools (e.g., Roo Code's Codebase Indexing, CocoIndex) use tree-sitter to chunk code for embeddings, again a coarse "which function is this text near" use. **This is the real, honest explanation for why the 61.2% number hasn't blocked adoption**: the industry's actual tree-sitter consumers mostly need coarse symbol locations, not the precise nested structure (enum-entry constructor args, sealed-hierarchy shape, generic-argument placement) our own fact schema needs. Production tolerance for this grammar's imperfections is not evidence it's accurate enough for us specifically.

## 2. Other lightweight (non-full-compiler) Kotlin parsing options

**`kotlinx.ast`** (formerly `kotlinx/ast`, JVM-based) is a real, distinct alternative — it parses Kotlin via ANTLR using **JetBrains' own official Kotlin-spec grammar**, not a reverse-engineered grammar like tree-sitter-kotlin. This is a meaningfully different lineage, not just another implementation of the same idea. Real, honest caveats: the project describes itself as "in an early stage," with acknowledged incomplete features (e.g., import lists not yet converted into friendly data classes), and it is syntax-only — no type resolution, same category as tree-sitter, just a different grammar source.

**The grammar underneath it is itself self-disclaimed by JetBrains.** `Kotlin/grammar-tools` (JetBrains' own wrapper around the `kotlin-spec` ANTLR grammar) states directly: *"The library is developed only for internal purposes of the Kotlin team, and actual state of the library isn't guaranteed."* It further documents a real, known divergence from the actual compiler: *"the parse tree may not match exactly to PSI… because the official compiler defers some error detection beyond the parser level."* **Even JetBrains' own "official" grammar has real, acknowledged gaps from ground truth** — this is not a clean win over tree-sitter-kotlin, just a different, differently-sourced set of imperfections, with no independently-reported accuracy percentage to compare against tree-sitter's self-reported 61.2%.

**No third, more polished option was found.** Between the full-compiler route (`kotlin-compiler-embeddable`, `19-...md`) and these two syntax-only grammars (tree-sitter-kotlin, kotlinx.ast), nothing else surfaced as a real, currently-maintained, publicly-obtainable Kotlin structural parser.

## 3. How Sourcegraph actually handles this — a real, somewhat surprising answer

**Sourcegraph's real fallback for a language without a mature SCIP semantic indexer is `universal-ctags`, not a bespoke tree-sitter grammar.** Their own `sourcegraph/go-ctags` (a Go wrapper around the decades-old, battle-tested `universal-ctags` project) explicitly lists **Kotlin** among its supported languages. `universal-ctags` is intentionally coarse — function/class/variable names, rough line locations, a "kind" tag — not full AST structure, and nowhere near what our own fact schema needs (full enum members, sealed-subclass names, generic-argument descent). Sourcegraph's own docs on adding language support confirm the real workflow is "add the language to tree-sitter supported file types… and update `.ctags.d` configuration… as `universal-ctags` bundles configuration for many languages, but additional/override configuration may be necessary to support missing or incorrectly parsed features" — i.e., **their own real answer, in their own docs, is to patch a decades-old coarse tool's config when it gets things wrong, not to build or adopt a highly-accurate modern grammar.**

Tree-sitter does appear in Sourcegraph's stack, but for narrower purposes (syntax highlighting; some newer "generic symbols" incremental-indexing work reported specifically for Python/JavaScript/TypeScript) — Kotlin was not confirmed as covered by that layer.

**Net, honest read**: Sourcegraph — at far greater scale and resources than this project — does not have a cleaner answer for Kotlin structural extraction than we do. Their real fallback for a language without a mature semantic indexer is coarser than either of our two candidates (tree-sitter-kotlin or kotlinx.ast), not more precise. This corroborates rather than contradicts everything found so far: this is a genuinely unsolved, industry-wide gap, not a corner this project is uniquely cutting — the same shape of honest finding as `10-findings-sourcegraph-codebase-analysis-2026-09-06.md` §2 found for UX/design-facts extraction.

---

## Recommendation

No one has quietly solved tree-sitter-kotlin's accuracy gap, and Sourcegraph's own real answer for a comparable gap is to fall back to something coarser (`ctags`), not something more precise. `kotlinx.ast` is a real, distinct, worth-testing second candidate — different grammar lineage (JetBrains' own spec grammar vs. tree-sitter-kotlin's reverse-engineered one) — but it carries its own real, honest caveats (early-stage, no independently-reported accuracy number, JetBrains' underlying grammar self-disclaimed as internal/unguaranteed) and a real operational cost difference: it's a JVM/Kotlin library, so — unlike tree-sitter-kotlin's npm package — it can't be driven directly from our Node-based pipeline without a JVM subprocess step, similar in shape (though much lighter) to the `kotlin-compiler-embeddable` route.

**Both remaining lightweight candidates are unverified against this repo's actual code, in different ways, with no research-only path to resolving that.** The responsible next step is the same either way: a small, bounded, real test — parse a handful of this repo's real files (one with `NavHost`/`composable` trailing-lambda DSL, one with a constructor-bearing enum, one with a sealed hierarchy) through each candidate and check the actual output, rather than choosing further from research alone.

## Sources

- [fwcd/tree-sitter-kotlin](https://github.com/fwcd/tree-sitter-kotlin)
- [GitHub Docs — Linguist / tree-sitter language requirements (via search excerpt)]
- [kotlinx/ast README](https://github.com/kotlinx/ast/blob/master/README.md)
- [Kotlin/grammar-tools README](https://github.com/Kotlin/grammar-tools)
- [Kotlin/kotlin-spec (official grammar source)](https://github.com/Kotlin/kotlin-spec)
- [sourcegraph/go-ctags](https://github.com/sourcegraph/go-ctags)
- [Sourcegraph docs — Adding language support (via search excerpt)](https://docs.sourcegraph.com/dev/how-to/add_support_for_a_language)

**Note on sourcing rigor**: several claims above (GitHub Linguist's exact requirements, Sourcegraph's tree-sitter-vs-ctags split) are drawn from search-result excerpts and one blocked direct fetch (`sourcegraph.com/docs/code-navigation/writing-an-indexer` returned HTTP 403), not full independent verification of every primary source — consistent with this project's practice of flagging excerpt-sourced claims (see `10-...md`'s own note on this). The Maven/GitHub-hosted repo claims (tree-sitter-kotlin's README, kotlinx/ast's README, Kotlin/grammar-tools' README, go-ctags' language list) were fetched and read directly.
