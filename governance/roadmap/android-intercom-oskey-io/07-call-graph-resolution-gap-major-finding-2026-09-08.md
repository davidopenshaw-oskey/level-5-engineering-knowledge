# Major Finding, Missed in the First Pass — Real Call-Graph/Cross-Module-Dependency Resolution Cannot Be Done by a Syntax-Only Tool at All

**Purpose of this file:** `06-ts-pipeline-lessons-reflagged-for-tree-sitter-2026-09-08.md` only read `01-extract-ast-evidence.ts` closely and grepped the other 7 phase-01 scripts plus all of phase-02 without reading them. Directly challenged on this (2026-09-08) — correctly, since the grepped files turned out to hide the single most consequential finding in this whole investigation. This file corrects and supersedes that gap. It does not change the earlier file's conclusions about enum/union/generic-descent extraction (those are confirmed still accurate) — it adds a materially bigger, separate finding those greps missed.

## The real finding

**`04-build-resolved-graph.ts` (1017 lines, "the graph" per this project's own description) and `06-build-cross-module-dependency-graph.ts` do zero AST/compiler work themselves.** Read in full: both are pure JSON-in/JSON-out joining scripts over facts already produced by `01-extract-ast-evidence.ts`. Confirmed directly in `06`'s own header comment: *"target module already resolved at extraction time in 01-extract-ast-evidence.ts, via ts-morph's own compiler resolution — not string-matched here."*

**The real "compiler-exact declaration matching" — the mechanism behind every `confirmedCallEdges` entry, the RBAC linking, and the cross-module dependency graph's authoritative edges — is exactly one block of code, `01-extract-ast-evidence.ts` lines 1114-1155:**

```
const symbol = expr.getSymbol();
...
const decl = symbol.getValueDeclaration() || symbol.getDeclarations()[0];
if (decl) {
  const declSf = decl.getSourceFile();
  declarationFile = toRepoPath(declSf.getFilePath(), clonePath);
  ...
}
```

`expr.getSymbol()` is full, whole-project, cross-file symbol resolution — TypeScript's real binder, not a text/import-path heuristic. It's what lets a call like `this.someService.doThing()` in one file resolve to the exact file/line/class/method of `doThing`'s real declaration, however many files away. `04-build-resolved-graph.ts`'s "Rule A: Exact Compiler Declaration Match" (its own primary, highest-confidence resolution path) is then just a map lookup on the `declarationFile`/`declarationMethod` strings this one call already produced — no compiler work happens in `04` itself. Only when Rule A finds no match does the script fall back to "Rule B: Heuristic Unique Signature Fallback" (normalized object/class-name string matching) or "Rule C: Unresolved."

**This is categorically different from, and much bigger than, everything in `06-...md`.** That file's gaps (indirect enum-value resolution through an alias, unannotated inferred types) are narrow edge cases. This is the actual mechanism behind the pipeline's most valuable structural output — real, confirmed call edges; RBAC requirement linking; the cross-module dependency graph — and it fundamentally requires a whole-project symbol table. **A syntax-only tool (tree-sitter-kotlin, `kotlinx.ast`) cannot do this at all, not partially — it has no concept of cross-file symbol resolution.** Tree-sitter parses one file in isolation; there is no "which declaration does this identifier really point to" operation available, in any form, at any accuracy level.

## What this means concretely for Kotlin

If Kotlin extraction uses a syntax-only tool, **every call-graph edge becomes what the TS pipeline treats as its fallback tier, not its primary tier.** There is no Kotlin equivalent of "Rule A: confirmed, compiler-exact" available at all — only a "Rule B"-style heuristic (build a project-wide table of declared classes/functions from tree-sitter's per-file parses, normalize names, match call sites to declarations by normalized class+method name) would be possible, and it would carry the accuracy risks Rule B already carries in the TS pipeline today (ambiguous matches, same-named methods on unrelated classes, no protection against a wrong match beyond "was there exactly one candidate"). Every Kotlin call edge would be `"probable"` at best, never `"confirmed"` — a real, honest downgrade to this repo's most valuable outputs (RBAC requirement matrix, cross-module coupling graph — the design doc's own `00-...md` names these as central to closing the edge-device access-control gap this whole repo onboarding exists for).

**The same applies to `06`'s cross-module dependency graph** — the "which Gradle module does this import really come from" resolution would need to be done via our own import-statement parsing rather than real module resolution. This is likely a smaller risk for Kotlin than for TS specifically (Kotlin doesn't have TS's path-alias/barrel-re-export conventions that made "not string-matched" a deliberate, real choice for `06` — package-to-module mapping in idiomatic Kotlin is usually direct), but it's unverified against this repo, not assumed safe.

## Real options, not yet decided

1. **Accept the downgrade explicitly.** Ship Kotlin's call-graph/RBAC/cross-module-dependency facts at heuristic-only confidence, clearly tagged (the TS pipeline's own `resolutionMethod`/`confidence` fields already model this distinction — reuse it, don't hide it), and treat it as a named, honest limitation the way `04`'s own event-subscriber-extraction ("`not_implemented`") and Firestore-operation-detection gaps are already handled today.
2. **Build a real, project-wide symbol table ourselves on top of tree-sitter's per-file parses** — walk every file's declarations (package + class/function names), build a lookup table, resolve call sites against it. This is more than the "small gap-filler" originally envisioned; it's closer to writing our own lightweight linker. Real, buildable, but a materially bigger task than "resolve a same-name ambiguity."
3. **Use `kotlin-compiler-embeddable` specifically for call-graph/cross-module resolution, and a syntax-only tool for the bulk declaration-level facts (enums, sealed classes, generic descent).** A real hybrid — heavier tool only where semantic resolution is actually load-bearing, lighter tool everywhere else. Worth real evaluation given how much of `06-...md`'s "pure syntax" finding already reduces the compiler-embeddable route's necessary surface area.

**Not decided here** — this file's job is to correct the record and surface the real size of the gap, not to choose among these. This materially changes what the bounded parse test should check: it should now also attempt a call-resolution scenario (does a heuristic name-based match produce a correct or ambiguous result on a real cross-module call in this repo, e.g. `app` calling into `kotlin-ble-kit-oskey-io`) — not just declaration-shape parsing.

## What was actually checked, for a complete accounting

- `00-scan-repo.ts`: pure git/filesystem operations, no AST/compiler dependency at all. Unaffected by tool choice.
- `01-extract-ast-evidence.ts`: the only script doing real AST/compiler work — contains both the pure-syntax fixes already covered in `06-...md` and this file's `getSymbol()` finding.
- `02-build-module-evidence.ts`, `03-build-benchmark.ts`, `05-partition-capability-packs.ts`, `07-build-intra-module-coupling-graph.ts`: pure downstream JSON aggregation, zero AST/compiler API calls — consume `01`'s output as-is, add no new tool-capability considerations.
- `04-build-resolved-graph.ts`, `06-build-cross-module-dependency-graph.ts`: this file's finding.
- All of `phase-02-inter-module-synthesis/` (~15 files): zero AST/`ts-morph` dependency confirmed by direct grep — pure LLM-synthesis over already-extracted JSON facts. Not affected directly by the Kotlin tool choice, though obviously downstream synthesis quality inherits whatever confidence tier phase-01 hands it.
