# TS/Angular Pipeline Lessons, Re-Checked Against the Real Code — What Actually Needs Semantic Resolution vs. What's Pure Syntax

**Purpose of this file:** `swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md` generalized the TS/Angular pipeline's hard-won lessons from memory/summary before any Kotlin tool decision existed. Its own §5 recommended the Kotlin Analysis API as the `ts-morph` analog — since disqualified in practice (`05-task1-scip-kotlin-disqualified-2026-09-08.md`, `market-research/19-...md`). Now that a syntax-only tool (tree-sitter-kotlin or `kotlinx.ast`) is the live candidate, the real question is: which of the TS pipeline's fixes actually depended on `ts-morph`'s real compiler type-checker, and which were pure AST-syntax walking that just happened to run through a type-checker-capable library? Answered here by reading the actual code (`pipeline/angular-app-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts`, `pipeline/facts-postgres-index/sync-facts.ts`), not the summary doc alone.

## Real, encouraging finding: most of what we need is already pure syntax-tree walking in the proven TS code

Checked directly against `01-extract-ast-evidence.ts`:

- **Generic type-argument descent via heritage clauses** (`extendsClassTypeArguments`, line 717): `extendsExpr.getTypeArguments().map(t => t.getText())` — reads the literal source text of the heritage clause's type arguments. **No type-checker call.** Fully portable to a syntax-only tree.
- **Union-type closed-set values** (`unionMembers`, lines 988-996): walks `TypeNode`s directly (`getTypeNodes()`, `isLiteralTypeNode`, `.getLiteral().getText()`). **No type-checker call.** Fully portable.
- **Enum members** (line 1013): `en.getMembers().map(m => m.getName())` — direct AST children. **No type-checker call.** Fully portable (matches what was already assumed for Kotlin `enum class`/`sealed class`).
- **Generic-wrapper descent for object-literal-shaped types** (`collectTypeLiteralProperties`, lines 1047-1058, the real `OSKDocument<{...}>` fix): recurses through `isTypeLiteral`/`isIntersectionTypeNode`/`isTypeReference` + `getTypeArguments()` — pure syntax-node-type branching. **No type-checker call.** Fully portable.

**This changes the honest risk assessment from the earlier prep doc.** Several fixes that sounded like they needed "real, compiler-verified extraction, not text/regex matching" (prep doc §5's framing) turn out, on reading the actual code, to be syntax-tree pattern matching that a type-checker-capable library did coincidentally, not extraction that required one. A syntax-only Kotlin tool doing the equivalent syntax-node walking should reproduce these specific fact kinds without needing real semantic resolution.

## Real, narrower gaps that DO need semantic resolution — won't transfer to a syntax-only tool

**1. Indirect constant-value resolution through symbol aliasing** (`01-extract-ast-evidence.ts` lines 230-288). Real, documented case: `case ActivityUserType.USER:` resolves via `node.getSymbol()` → the actual enum-member declaration → its real value — genuine binder/type-checker work, confirmed by the code's own comment: *"Confirmed empirically 2026-08-01: this exact gap caused case labels... to resolve as null/'unsupported'"* before this fix. This has no syntax-only equivalent: a tree-sitter walker sees the identifier `ActivityUserType.USER` as text, not as "the same declaration as the enum member defined 40 files away." **Real Kotlin analog to check for in the bounded parse test**: `when` branches or `sealed`/`enum` matches that reference a value through a `val`/const alias or an imported constant rather than the literal member access — if this pattern occurs in this repo's BLE/USB/WebRTC state-machine code (a plausible place for it), it's a real, concrete gap a syntax-only tool can't close without a hand-written resolution layer.

**2. `getBaseClass()`'s canonical-name resolution** (line 715, used alongside the syntactic `getExtends()` above specifically for the base class's *name*, not its type arguments): resolves through the type checker to the actual class declaration. For the common case (a direct, unaliased class reference) this matches what's syntactically written and a text-based extraction would give the same answer — but for an aliased or re-exported base class, it wouldn't. Narrower risk than item 1, worth a quick real check rather than assuming it never happens in this repo.

**3. `.getType().getText()` for interface/class property types without an explicit inline object-literal shape** (line 1026): calls the real type-checker to get a property's *resolved* type text. For an explicitly-annotated property (`val x: StateFlow<UserProfile>`, the common Kotlin/Compose ViewModel style) the syntactic annotation and the resolved type are the same text, so this is likely a non-issue in practice for this repo. It becomes a real gap only for **inferred, unannotated declarations** (`val x = someFunction()`, common enough in idiomatic Kotlin) — a syntax-only tool sees nothing where `ts-morph`'s type-checker would infer and print the real type. Worth including at least one unannotated `val` in the bounded parse test to see how much this actually matters here.

## Angular's own biggest lesson (the 92-of-160 gap) has no direct Kotlin/Compose analog — but its general principle still applies

The real 92-of-160 gap (`node.inputs` vs. `node.attributes`, `02-build-module-evidence.ts`/`01-extract-ast-evidence.ts` lines ~820-882) is specific to Angular's *separate template AST* (`@angular/compiler`'s own node model for `.html` files/inline `template:` strings) — a second parser entirely, distinct from the TypeScript AST. **Compose has no equivalent second AST**: UI is plain Kotlin function calls, inside the exact same syntax tree a Kotlin extractor already walks. So the specific "two different ASTs, one silently unvisited" failure mode does not recur here.

**The general principle underneath it does still apply, and deserves its own real Kotlin-specific check**: a walker tuned to one syntactic *shape* of a construct can silently miss a structurally different but semantically equivalent sibling. Concrete candidate risks for this repo, not yet checked: a walker looking only for top-level `@Composable fun X()` declarations could miss composables assigned to a `val` as a lambda, or content passed as a trailing lambda vs. a named parameter (`Button(onClick = {}) { Text(...) }` vs. `Button(onClick = {}, content = { Text(...) })`) — same real risk shape as `formControlName`'s two forms, worth a direct grep-count check (this project's own standard verification technique) once real extraction is built, not assumed away because there's no separate template file this time.

## Major correction, 2026-09-08 — see `07-call-graph-resolution-gap-major-finding-2026-09-08.md`

This file's own research pass read `01-extract-ast-evidence.ts` closely but only grepped `04-build-resolved-graph.ts` and `06-build-cross-module-dependency-graph.ts` rather than reading them — missing the single biggest finding in this investigation. **Real, compiler-exact call-graph and cross-module-dependency resolution (the "confirmed" tier behind RBAC linking and coupling graphs) depends entirely on one `expr.getSymbol()` whole-project symbol-resolution call in `01`, which a syntax-only tool (tree-sitter, `kotlinx.ast`) cannot replicate at all, not just partially.** This is categorically bigger than the narrow gaps below (indirect enum aliasing, unannotated types) — read `07-...md` before treating this file as a complete risk picture.

## Not re-litigated here — already correctly framed as tool-agnostic in the prep doc

- **Cross-repo type redeclaration / name collisions** (prep doc §4) — this is a real risk regardless of tool (it's about independently-declared types across repos/languages, not about what one extractor's tool can resolve within a single file). Still real, still open, not affected by the tree-sitter-vs-compiler-embeddable choice.
- **The `symbolNameFor()`/`descriptionFor()` per-fact-kind identity and embedding-completeness discipline** (`sync-facts.ts` lines 54-78) — this is entirely about how *our own* fact schema and description-builder are designed, not about the extraction tool's semantic power. Applies identically no matter which Kotlin tool wins.
- **Recursive/nested structure joins, actor-scoped UI narrowing, camelCase tokenization** (prep doc §3, §7, §8) — all real, all tool-agnostic, unchanged by today's findings.

## What this means for the bounded parse test already planned

Add two concrete checks to the test beyond the three already planned (`NavHost`/`composable` trailing-lambda file, a constructor-bearing enum, a sealed hierarchy):

1. A real `when`/branch construct that references an enum or sealed value **indirectly** (via a `val` alias or imported constant), if one exists in this repo — to see whether the indirect-resolution gap (item 1 above) is real here or theoretical.
2. A `@Composable` or Hilt-injected declaration written in an **unannotated/inferred** style, and/or a composable defined as something other than a top-level `fun` — to check items 3 and the Angular-principle-without-Angular's-bug risk above.

## Flag on the prep doc

`swift-kotlin-preparation/00-lessons-from-typescript-angular-extraction.md` §5 recommended the Kotlin Analysis API as the `ts-morph` analog — not rewritten (this project marks things open rather than rewriting history), but superseded in practice by `05-task1-scip-kotlin-disqualified-2026-09-08.md` and this file's own finding that most of what §5 worried about turns out to be syntax-portable anyway.
