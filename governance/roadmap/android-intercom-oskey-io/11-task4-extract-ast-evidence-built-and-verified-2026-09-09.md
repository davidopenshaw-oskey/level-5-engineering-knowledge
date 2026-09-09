# Task 4 — `01-extract-ast-evidence.ts` Built and Verified

**Status: DONE (V1), 2026-09-09.** Real script at `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/01-extract-ast-evidence.ts`, run end-to-end against the real repo, with every fact type spot-checked against real, known-correct data (not just counted) before being called done — same discipline as Task 3.

## What it extracts

Nine fact types, written to `facts/ast-*.json` matching the TS pipeline's own naming convention: imports, classes, objects, interfaces, functions (with `@Composable` detection), enums (full members + constructor args), sealed hierarchies (full subclass lists), properties (with generic type-argument descent), and call expressions (with real, honestly-tagged resolution — `resolved_via_import` / `resolved_via_same_package` / `unresolved`, never `"confirmed"`, per `07-...md`'s finding that no compiler-exact resolution is available to a syntax-only tool).

Shared Kotlin AST helpers (`calleeNameOf`, `findAllCallExpressions`, etc.) were refactored out of `00-scan-repo.ts` into `_shared/kotlin-ast-utils.ts` first, since this script needed the same primitives — verified the refactor was behavior-preserving by re-running `00` and confirming identical output before building on top of it.

## Real bugs found and fixed, in the order they were found

**1. `composableFunctions: 0`** — known wrong immediately (this repo has 35 files using `@Composable`, confirmed in earlier investigation). Root cause: tested against real code, not assumed — an annotation like `@Composable` or `@Module` does NOT parse as a sibling node before the declaration the way an isolated synthetic test snippet suggested; it parses NESTED inside the declaration's own `modifiers` child. The synthetic snippet used to derive the original assumption wasn't representative of real file structure (more surrounding context — package headers, imports — changes how the grammar attaches it). Fixed by checking the declaration's direct `modifiers` child specifically (not a full-subtree search, which would incorrectly pick up a nested inner declaration's own annotations).

**2. `interfaces: 0`** — checked directly rather than trusted, since a repo-wide grep immediately found 10+ real interfaces. Root cause: tree-sitter-kotlin has **no separate `interface_declaration` node type at all** — `interface Foo {}` parses as a `class_declaration` whose first child is the literal token `interface` instead of `class`. The original code searched for a node type that doesn't exist in this grammar and silently returned zero, no error. Fixed by folding interface detection into the same `class_declaration` walk, splitting on the real literal-token check.

**3. Verified, not just counted: real call resolution correctness.** Pulled the exact real call central to Task 1's whole decision (`OSKAnalyticsService.shared.identifyAcd` in `OSKMainActivityViewModel.kt`, one of 3 same-named classes across the repo) and confirmed it resolves to the correct file (`app/utils/OSKAnalyticsService.kt`, matching the file's real `import` statement) via `resolved_via_import` — not one of the two decoy candidates. Also spot-checked the `Screen` sealed hierarchy (all 11 real subclasses, correct names/lines) and `AccessRightsValidity`'s enum members (correct names and real constructor-arg string values). All three checks came back exactly right on the first working version.

## Real, honest scope limits (not silently assumed complete)

- **Call resolution volume**: 5,338 real call expressions found; only 649 (12%) resolved to a real in-repo declaration (231 via import, 418 via same-package), the rest `unresolved`. Not a quality alarm by itself — most Kotlin/Compose/Android/stdlib framework calls (`println`, `Modifier.fillMaxSize()`, etc.) are never declared in this repo's own 136 files and were never expected to resolve. What matters is real in-repo cross-file resolution accuracy, verified directly above — the raw unresolved percentage on its own isn't the right metric and shouldn't be read as one.
- **Sealed hierarchy scope**: only same-file nested subclasses are captured (covers the real, dominant pattern here — 11/11 real `Screen` subclasses). Kotlin also allows same-package, different-file sealed subclasses since 1.5 — not scanned for; a named limit, not a silent gap.
- **Property type resolution**: explicit declared types and initializer-level generic type arguments are captured (pure syntax); a property with neither (fully inferred from a non-generic call) has no type information recorded, same real limit already flagged in `06-ts-pipeline-lessons-reflagged-for-tree-sitter-2026-09-08.md`.

## Not yet done

**Task 5** (the domain-specific "wire format" facts — BLE GATT UUIDs, USB command constants, WebRTC signaling event names) is explicitly a separate task per `02-p1-build-tasklist.md`'s own ordering, not started here.
