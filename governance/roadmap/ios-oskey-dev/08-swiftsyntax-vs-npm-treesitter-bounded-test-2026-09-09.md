# Bounded Test: SwiftSyntax vs. `tree-sitter-swift` (npm) — 2026-09-09

**Status: EVIDENCE GATHERED, not yet a decision.** Mirrors `android-intercom-oskey-io/08-task1-consolidated-checklist-2026-09-08.md`'s role for Kotlin — a real, bounded parse test against this repo's actual code, ahead of a `09-...`-style decision doc. Executes the "one agreed next step" from `07-session-handoff-2026-09-09.md`, plus a second question raised in this session: does an npm-only tool (matching the TS/`ts-morph` and Kotlin/`tree-sitter-kotlin` precedent) exist for Swift, and if so, how does it compare? This matters beyond tool choice — it decides whether Swift extraction needs a Swift toolchain (Xcode or swift.org) wherever the pipeline runs, or can stay Node-only like the other two languages.

**Target corpus:** starts with `swift-ble-kit-oskey-dev` (32 files, §1-2, the hand-off's named starting point), then widens to **all 6 repos in the family, 821 real `.swift` files total** (§5) — the family-wide pass found a real gap the single-repo pass could not have caught.

**Ground truth for declaration counts**, established independently via `grep` over the real source (not derived from either tool, so it can catch a bug in either): `class: 9, struct: 9, enum: 10, extension: 11, protocol: 2`.

**CORRECTION, 2026-09-10**: the `extension: 11` figure above is wrong — real count is **13**, confirmed by re-running `grep` twice (once scoped to `Sources/` only, once whole-repo, both returning the identical 13-line list) while building P1 build tasklist Task 5's real extractor, which also independently counted 13 and matched. Root cause of the original miscount not fully re-derived (the exact original command is gone), but the likely mechanism: `Sources/.../OSKBKOSKEYIntercomPlusPreSeriePeripheral.swift` has **3** separate `private extension OSKBKOSKEYIntercomPlusPreSeriePeripheral { ... }` blocks (lines 234, 243, 251) — a per-file rather than per-line counting slip would collapse those 3 into 1, exactly accounting for the 2-count gap (13 real → 11 counted). Both SwiftSyntax's and `tree-sitter-swift's` own bounded-test runs reported 11 and were checked against this same wrong reference, so their real declaration-level accuracy was not as tightly verified on this one construct (three same-named extensions in one file) as this doc originally claimed. **Does not change the Task 1 decision in `09-...md`** — that decision turned on the `#if`/`#endif` cascading-parse-error finding, not this count — but this number should not be cited as verified ground truth from this doc without this correction.

## 1. SwiftSyntax (host-toolchain-dependent path)

Real Swift package built in a scratch dir, depending on `apple/swift-syntax` pinned `exact: "603.0.2"` — the release tag matching this machine's actual installed toolchain (`swift --version` → `Apple Swift version 6.3.3`, confirmed directly, not assumed). Parsed all 32 files with `SwiftParser.parse(source:)`, ran `ParseDiagnosticsGenerator.diagnostics(for:)` against each tree, and walked the resulting `SourceFileSyntax` with a `SyntaxVisitor` counting declaration kinds.

**Result: 100% clean.** 0 of 32 files produced any diagnostic. Real risk this test was built to check — this machine's toolchain (6.3.3) is materially newer than every repo's pinned `swift-tools-version` (5.9/5.10), the same class of mismatch that disqualified the Kotlin Analysis API — **did not materialize**. SwiftSyntax's parser is tolerant of older source syntax; the version pin governs which compiler is needed to *build the SwiftSyntax package itself*, not what source vintage it can parse, and building it worked cleanly by fetching Apple's prebuilt `603.0.2` binary.

Declaration counts (whole corpus): `classes: 9, structs: 9, enums: 10, protocols: 2, extensions: 11, functions: 64, properties: 115, imports: 58, calls: 335`. Matches ground truth exactly on every count `grep` could independently verify (class/struct/enum/protocol/extension).

**Real, load-bearing dependency this path requires:** a Swift compiler must be present on whatever machine runs extraction — via Xcode (as here) or a standalone swift.org toolchain (macOS or Linux). Not portable to a plain Node runtime the way `ts-morph` and `tree-sitter-kotlin` are.

## 2. `tree-sitter-swift` (npm path)

`npm install tree-sitter tree-sitter-swift` (current: `0.7.1`, actively maintained, MIT). Ships prebuilt native bindings via `node-gyp-build` — no C/C++ toolchain, no Swift compiler, no Xcode needed on the host at all. Confirmed directly: `require('tree-sitter-swift')` loaded and parsed successfully with zero native compilation step.

**Real bug found and fixed in this session's own test script, not in the tool.** First pass reported exactly double every class/struct/enum/extension count (18/18/20/22 against a 9/9/10/11 ground truth). Root cause, confirmed directly: the bucket keys used for the *declaration* count (`class`, `struct`, `enum`, `extension`) collided with the grammar's own `node.type` string for the bare *keyword token* (`class_declaration`'s own `class`/`struct`/keyword child) — a generic `counts.hasOwnProperty(node.type)` fallback then double-counted every declaration when the walk visited its own keyword child as a separate node. Not a grammar or binding defect; renaming the bucket keys (`class_decl` etc., decoupled from raw keyword strings) fixed it, and the corrected script now reproduces ground truth exactly.

**Result after the fix: 100% clean, 0 error/MISSING nodes across all 32 files.** Declaration counts: `class: 9, struct: 9, enum: 10, extension: 11, protocol_declaration: 2` — **exact match** to both ground truth and SwiftSyntax on every category `grep` could verify.

**Real, honest deltas that remain** (not re-litigated further in this pass — same "named limitation, not silently hidden" treatment the Kotlin decision doc gave its own gaps):
- `function_declaration: 56` + `init_declaration: 16` (tree-sitter separates initializers into their own node type) vs. SwiftSyntax's `functions: 64` — this is a counting-script asymmetry (the SwiftSyntax script never added an `InitializerDeclSyntax` counter), not a real capability gap; both tools clearly expose initializers as distinct, extractable nodes.
- `property_declaration: 106` vs. SwiftSyntax's `properties: 115` (~8% gap) and `call_expression: 315` vs. `calls: 335` (~6% gap) — real, unexplained deltas, most likely different treatment of things like optional-binding conditions, property-wrapper attribute sites, or trailing-closure call shapes between the two grammars. **Not yet root-caused.** Flagging honestly rather than assuming either number is "right" — this needs the same kind of targeted, per-construct check Kotlin's `07-call-graph-resolution-gap-major-finding-2026-09-08.md` did before it's safe to trust either tool's property/call counts as ground truth.

## 3. Cross-check against how Kotlin resolved the equivalent question

Kotlin's real decision (`android-intercom-oskey-io/09-task1-decision-tree-sitter-plus-import-aware-resolver-2026-09-08.md`) rested on two empirically-measured pillars: (1) syntax-only declaration extraction matched what the compiler-backed TS pipeline actually needed, measured directly against real files, and (2) Kotlin's mandatory explicit-`import`-per-cross-package-reference convention gave a syntax-only resolver a real, deterministic disambiguation signal for the call-graph problem — checked directly by scanning all 5 Android modules for duplicate top-level declaration names (found only 4, 2 irrelevant test scaffolding, the other 2 cleanly disambiguated by each call site's own import).

**Pillar 1 transfers cleanly, now measured for Swift too**: this test's 100%-clean, ground-truth-matching declaration counts are the direct Swift analog of Kotlin's 95.6%-clean bounded test — arguably a cleaner result here (0 parse errors found at all vs. Kotlin's 4.4% real error rate from one grammar bug).

**Pillar 2 has NOT yet been tested for Swift, and Swift's module model is meaningfully different from Kotlin's package model** — this is the real open question before an npm-only path could be decided, not assumed:
- Kotlin: visibility is package-based; any file can reference any top-level declaration in the same package without an import, and cross-package references need an explicit import.
- Swift: visibility is *target*-based (an SPM module). Files within the *same target* (e.g., everything under `Sources/OSKBluetoothLEKit/`) can reference each other's `internal`/`public` declarations with **no import statement at all** — Swift has no per-file package-level import requirement the way Kotlin does. Cross-*target* references (e.g., `ios-oskey-dev` calling into `swift-ble-kit-oskey-dev`) do require `import OSKBluetoothLEKit`.
- This means a Swift import-aware resolver's disambiguation signal is real but structurally different: `resolved_via_import` (cross-target call, matches this file's own `import` statements — 58 found in this repo) plus a `resolved_via_same_target` tier (the direct Swift analog of Kotlin's `resolved_via_same_package`, likely *more* load-bearing here since same-target calls need no import at all to begin with) — untested how ambiguous either tier is on real cross-target call sites in this 6-repo family. The equivalent of Kotlin's "4 duplicate names, 2 real collisions, both cleanly disambiguated" scan has not been run for Swift.

**Real, measured granularity gap found 2026-09-09 (flagged by a peer session working the Kotlin side, then confirmed directly here) — this likely means Kotlin's clean result does NOT transfer as-is.** Kotlin's low same-package collision rate relied on fine-grained packages (typically <20 files each). Real file counts per SPM target in this family, measured directly:

| Package | Files in its main target |
|---|---|
| `swift-ble-kit-oskey-dev` | 30 |
| `swift-cloud-kit-oskey-dev` | 109 |
| `swift-webrtc-kit-oskey-io` | 87 |
| `swift-ui-kit-oskey-dev` | 91 |
| `swift-ai-kit-oskey-io` | 2 (+0 in its C++ shim target) |

Each SPM package here is essentially **one single target holding all its files**, not Kotlin's fine-grained per-feature package structure. `swift-cloud-kit-oskey-dev`'s `resolved_via_same_target` candidate pool (109 files, all visible to each other with zero imports) is over 5x the size of Kotlin's typical package. `ios-oskey-dev` itself uses Xcode project targets (not an SPM `Sources/` layout) — its own target-membership file counts are not yet measured (would require reading `project.pbxproj` target membership, not a folder convention). **Do not assume Kotlin's "only 2 real collisions" result transfers — the real ambiguity rate for Swift's `resolved_via_same_target` tier needs its own measurement**, per the duplicate-top-level-declaration-name scan named as the next step below.

## 4. What this means for deployment (the real question behind running this test)

**Superseded by §5 below — kept for the reasoning, do not read this paragraph as the current picture.** This originally argued the npm path could match SwiftSyntax cleanly if Pillar 2 (call-resolution ambiguity) resolved well. The family-wide re-run (§5) found `tree-sitter-swift` has a real, root-caused 4.9% file-level parse-corruption rate (dominated by `#if` conditional-compilation blocks) that the single-repo test never surfaced, and that corruption directly produced an unsafe *undercount* in a real duplicate-name scan (§5b) — a materially bigger problem than "the resolver might be somewhat ambiguous." SwiftSyntax's 100%-clean, toolchain-dependent result is now the stronger of the two options on correctness grounds; the npm path is no longer a clean-parity toolchain-free win without first addressing §5a's three bug classes.

**Revised real next steps, in order** (supersedes the original 4-item list):
1. **Decide whether `tree-sitter-swift`'s three known bug classes (§5a) are worth working around**, e.g. a pre-pass that strips or normalizes `#if` blocks before parsing (real risk: silently dropping facts inside the conditional branch, same honesty problem Kotlin's pipeline avoided by tagging confidence rather than hiding gaps) — or whether this alone is enough to prefer SwiftSyntax despite its toolchain dependency. Not decided in this pass.
2. **Resolve the 3 same-target duplicate names via real `.pbxproj` target-membership inspection** (§5d) — a structural blind spot neither tool addresses, and the first Swift-specific risk this project has hit that has no Kotlin/Gradle analog at all.
3. **The cross-target duplicate (`OSKBKCentralManagerHostViewModifier`, §5c)** needs a named rule in whatever resolver gets built — "local/same-module declarations shadow same-named imports" — not an assumption.
4. If `tree-sitter-swift` is still chosen after (1): **`01-extract-ast-evidence.ts` (Swift port)** needs the `resolutionMethod`-tagged (`resolved_via_import` / `resolved_via_same_target` / `unresolved`) symbol table per §3, PLUS explicit, honest handling of the §5a bug classes rather than silent data loss.
5. **Root-causing the two smaller, still-unexplained count deltas** (§2: properties ~8% low, calls ~6% low) remains open regardless of which tool is chosen.
6. **02-07 (module evidence, benchmark, resolved graph, capability packs, cross-module dependency graph, intra-module coupling graph)**: expected to port the same way the Kotlin versions did from the TS originals — not yet verified, lower priority than (1)-(3) above.

## 5. Family-wide re-run, 2026-09-09 (all 6 repos, 821 files) — a materially different picture from the single-repo test

The single-repo test (§1-2) was clean for both tools. Running the same two tools across the **whole 6-repo family** (`ios-oskey-dev` + 5 packages, 821 real `.swift` files total) surfaced a real gap the single-repo test could not have caught, plus a structural risk neither this session nor Kotlin's own Task 1 anticipated.

### 5a. Parse-cleanliness gap, real and root-caused

**SwiftSyntax: 100% clean across all 821 files, all 6 repos, 0 diagnostics anywhere.** Directly re-run per-repo; no exceptions.

**`tree-sitter-swift`: 40 of 821 files (4.9%) produced parse errors** — not evenly distributed and not present at all in the single repo originally tested:

| Repo | Files | Parse errors |
|---|---|---|
| `ios-oskey-dev` | 482 | 23 |
| `swift-ble-kit-oskey-dev` | 32 | 0 |
| `swift-cloud-kit-oskey-dev` | 111 | 14 (12.6%) |
| `swift-webrtc-kit-oskey-io` | 89 | 0 |
| `swift-ui-kit-oskey-dev` | 103 | 2 |
| `swift-ai-kit-oskey-io` | 4 | 1 |

Root-caused directly (not guessed), three distinct real bug classes, dominant one first:
1. **`#if`/`#else`/`#endif` conditional-compilation blocks wrapping a declaration** (property or function) — the dominant cause, confirmed in `swift-cloud-kit-oskey-dev`'s `OSKCKUser*.swift` family (`#if canImport(FirebaseFirestore) ... #else ... #endif` around a `@DocumentID` property), `swift-ui-kit-oskey-dev`'s `OSKUIPhoneNumber.swift` (`#if !targetEnvironment(simulator)`), and `swift-ai-kit-oskey-io`'s `OSKAIKit.swift` (`#if DEBUG`). The grammar loses a closing brace at the `#if`/`#endif` boundary, producing a `MISSING` node whose effect cascades to the end of the file — everything after the broken block is at risk of being misparsed, not just the block itself. This is a common, ordinary Swift idiom (conditional compilation), not an edge case — closer in real-world frequency to Kotlin's own call-then-navigation-chain bug than a rare corner case.
2. **`#Preview { }`** (SwiftUI's Swift-5.9+ freestanding macro for canvas previews) is not recognized at all by this grammar version — found in `ios-oskey-dev/OSKDoorUnlockActivity/OSKDoorUnlockActivityLiveActivity.swift`.
3. **Labeled/multiple trailing closures** (Swift 5.3+ syntax, e.g. `AsyncImage(url:) { ... } placeholder: { ... }`) mis-parsed in at least one case (`swift-ui-kit-oskey-dev/.../InvitationCard.swift`).

None of these three constructs appeared in `swift-ble-kit-oskey-dev`, which is why the single-repo test missed this entirely. **This is the real, family-wide answer to whether the single-repo result generalizes: it does not, for `tree-sitter-swift`.** SwiftSyntax — the actual compiler frontend — has no such gap, by construction.

### 5a-i. Follow-up literature check, 2026-09-09 (later same day) — the dominant bug's fix is real and merged, but not on npm

Before treating §5a as final, checked directly (GitHub API, npm registry, PyPI) whether these three bugs were already known/fixed upstream. Real, concrete finding: **the dominant bug (bug 1, `#if`/`#endif` around a declaration) has a real, merged fix — but it hasn't reached the npm package this test actually used.**

- [Issue #298](https://github.com/alex-pinkus/tree-sitter-swift/issues/298) ("Incorrectly parsed directives") remains **open** — the general architectural complaint that directives don't nest their contained statements.
- [PR #300](https://github.com/alex-pinkus/tree-sitter-swift/pull/300), an earlier attempt at a fix, was **abandoned** 2024-03-10 — the author found four structurally different directive contexts (top-level/declaration-level/local/switch-case) that couldn't share one grammar rule ("the grammar is underspecified").
- [**Issue #583**](https://github.com/alex-pinkus/tree-sitter-swift/issues/583) ("Allow #if/#elseif/#else/#endif directives inside type bodies") **was merged 2026-05-26** — adds `$.directive` as a valid member of `enum_class_body`, `_class_member_declarations`, `_protocol_member_declarations`, with a real corpus test for exactly this repo's bug shape ("`#if` directive inside class body"). One remaining cosmetic wrinkle noted in the PR: zero-width ERROR nodes can precede directives in enum bodies, though the structural parse is correct.
- Checked directly against the repo's tag history: **this fix is in tag `0.7.3`**, tagged 2026-06-01 (the PR merge predates the release-prep commit). PyPI is current with this (`0.7.2` published 2026-05-04, `0.7.3` published 2026-06-01, checked directly against `pypi.org/pypi/tree-sitter-swift/json`).
- **But npm's registry (`registry.npmjs.org/tree-sitter-swift`) still lists `latest: 0.7.1`, published 2025-06-23** — over a year before the fix merged, and npm has never published `0.7.2` or `0.7.3` at all. The `0.7.1` this test actually installed via `npm install tree-sitter-swift` predates the fix entirely.
- One further relevant commit exists on `main` *after* the `0.7.3` tag: `8e273049`, 2026-07-15, "fix compilation directives error" — meaning even `0.7.3` isn't the final word, and there's no tag newer than `0.7.3` yet.
- Bug 2 (`#Preview`): general freestanding-macro support ([issue #438](https://github.com/alex-pinkus/tree-sitter-swift/issues/438) → [PR #484](https://github.com/alex-pinkus/tree-sitter-swift/pull/484)) merged 2025-05-05, *before* npm's `0.7.1` — so it should already be in the version tested. But its example was parenthesized-call syntax (`#expect(true)`), not `#Preview`'s trailing-closure invocation shape. No issue matching `#Preview` or "macro" + "trailing closure" was found — **a genuine, still-unreported gap**, not a known-and-fixed one.
- Bug 3 (labeled/multiple trailing closures): the closest match, [issue #2](https://github.com/alex-pinkus/tree-sitter-swift/issues/2) → PR #211, is a different, older, already-fixed bug (single trailing closure + regular params mis-parsed as curried calls) — not the `AsyncImage(url:) { } placeholder: { }` multi-labeled-closure shape found here. Searches for "second trailing", "multiple closures", "labeled closure" against this repo returned zero matches — **also a genuine, unreported gap**.

**Real, concrete, cheap next step this implies, not yet executed**: re-run this same bounded test with `tree-sitter-swift` installed from the GitHub source (`0.7.3` tag or `main`) instead of the stale npm registry package, to measure how much of the 4.9% file-error rate bug 1's real fix actually closes. **Real caveat on that path**: the npm-published `0.7.1` ships prebuilt native bindings via `node-gyp-build` (no C/C++ toolchain needed); installing from a git ref instead very likely falls back to compiling the native addon locally via `node-gyp`, reintroducing a real (smaller than Xcode, but non-zero) native-toolchain dependency — partially eroding the "npm-only, zero native toolchain" property that motivated testing `tree-sitter-swift` in the first place. Bugs 2 and 3 would remain open regardless.

### 5b. The duplicate-name scan itself was corrupted by the parse-error rate above — redone on the clean (SwiftSyntax) parse

First pass used `tree-sitter-swift`'s output for the scan (following Kotlin's methodology) and found 3 duplicate top-level names. Given §5a's finding that a broken `#if` cascades corruption to end-of-file, any top-level declaration appearing *after* a broken block in one of the 40 affected files could be silently absent from that scan's results — not just miscounted, dropped. **Confirmed this concern was real**: re-running the identical scan on SwiftSyntax's 100%-clean parse of the same 821 files found **5** duplicate top-level names, not 3 — two real collisions (`Provider`, `OSKUserIdKey`) were invisible to the corrupted scan. This is concrete, direct evidence that a resolver (or any fact-extraction pipeline) built on `tree-sitter-swift` without first fixing §5a's gap would silently under-report real symbol collisions, not just tolerate a bounded, known error rate the way Kotlin's pipeline safely did.

### 5c. Manual triage of all 5 real duplicate names (mirroring Kotlin's own per-collision triage discipline)

| Name | Sites | Triage |
|---|---|---|
| `ContentView` | `ios-oskey-dev` (real app) + `swift-ui-kit-oskey-dev/Sample/...` | **Irrelevant** — the second site is a bundled demo/sample app inside the package repo, not the real `OSKUIKit` library other repos import. Direct Swift analog of Kotlin's auto-generated `ExampleUnitTest` scaffolding; same "real but not load-bearing" treatment. |
| `OSKBKCentralManagerHostViewModifier` | `ios-oskey-dev` (local copy) + `swift-ble-kit-oskey-dev/Sources/OSKBluetoothLEKit/...` (the real package `ios-oskey-dev` imports) | **Real cross-target duplicate**, likely *not* actually ambiguous under real Swift name-lookup semantics (a same-module/local declaration shadows an imported one with the same bare name) — but a genuine trap for a naive import-aware heuristic resolver that doesn't explicitly encode "local declarations win over imports" as a rule. Worth a named rule in the eventual resolver, not just an assumption. |
| `Provider` | Two structs, **both inside `ios-oskey-dev`'s `OSKDoorUnlockActivity/` folder** (`OSKDoorUnlockActivityControl.swift`, `OSKWDoorUnlockActivity.swift`) | **Real, unresolved — needs `.pbxproj` target-membership check, not assumed.** Both files sit in the same folder, which per `02-...md` §5 corresponds to one real Xcode extension target — if both are actually compiled into that same target, two top-level structs named `Provider` (the standard WidgetKit template name) would be a genuine compile error, meaning one is almost certainly excluded from the target or dead code left over from a widget migration. **Not determined in this pass.** |
| `OSKUserIdKey` | Two structs, both under `ios-oskey-dev/Shared/...` (`EnvironmentValues+userId.swift`, `GPUserDefaultValues+userId.swift`) | Same open question as `Provider` — same apparent target, unrelated purposes (SwiftUI `EnvironmentKey` vs. a `UserDefaults` key) accidentally sharing an identical name. **Not determined in this pass.** |
| `OSKStreetAddressPickerViewModel` | Two classes, both under `ios-oskey-dev/iOS App/...` (`UI/View Models/...`, `View Models/Forms/OSKFRAddressSearchFormViewModel.swift`) | Same open question. **Not determined in this pass.** |

### 5d. A structural risk Kotlin's scan never had to deal with

Kotlin's every real duplicate was **cross-module**, cleanly disambiguated by each call site's own explicit import — Gradle's module boundaries are directory-based and unambiguous from source alone. **Three of Swift's five real duplicates are *same-target*** (both files apparently compiled into the same `ios-oskey-dev` target) — something Gradle's model doesn't really allow to happen silently. This is possible in Xcode specifically because **target membership is a per-file property recorded in `.pbxproj`, not implied by folder location** — a file can sit in the "right" folder and still be excluded from the target that actually compiles. **Neither tool tested here (`tree-sitter-swift` or SwiftSyntax) parses `.pbxproj`, so neither can tell a real same-module collision apart from two never-both-compiled files that merely look like one from the source tree alone.** This is a genuinely new blind spot for *any* syntax-only Swift resolver, not something either tool choice fixes — real next step, not attempted in this pass, is checking `.pbxproj` target membership for these 3 pairs before concluding whether they're live bugs, dead code, or a real resolver hazard.

## Scripts used

Both test scripts (a Swift executable target and a Node script) were written to this session's scratchpad directory (outside the repo, session-isolated) — not committed to the repo, per this project's own discipline of not leaving temporary diagnostic scripts lying around once findings are written up.
