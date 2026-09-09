# Preparation Notes for Swift (iOS) and Kotlin (Android) — Lessons from TypeScript/Angular P1 Extraction

**Real, honest epistemic status, stated up front:** nothing below is confirmed against OSkey's actual iOS/Android repos — no Swift or Kotlin repo has been added to `config/repos.json` yet, and no P1 extraction has run against them. This document generalizes the *classes* of real problems found and fixed during the TypeScript/Angular work into concrete things to check for early, using real knowledge of Swift/Kotlin language and tooling conventions. Treat every "concrete recommendation" below as a real, worth-checking hypothesis, not a confirmed finding — the same discipline this project already applies to any unverified source. Verify or falsify each one against real code once extraction actually begins, and update this doc with what's actually found, the same way `05-tasklist.md` and `15-...md` recorded real fixes as they happened.

## Placeholder, noted 2026-09-06: Figma/UX-mapping input is expected for these repos too, not just AST facts

Real, tracked context (see project memory "Partial pipeline coverage & reverse-engineering goal"): some form of Figma-derived UX/design mapping — via MCP or another method, not yet decided — is expected to become available for Swift, Kotlin, *and* Angular, on a rough timeline of ~2026-09-19. This is a real, separate input source from AST-derived code facts, not a replacement for anything in this document — but it's directly relevant to Section 1 above: design-source data (real screen layouts, real option/label text) could plausibly fill exactly the kind of gap AST extraction alone struggles with (a form control's real option values and labels, which Angular's own AST-only extraction still can't fully capture — see `governance/roadmap/facts-serving-strategy/15-workflow-clustering-and-angular-ux-facts.md`, Part A2). Worth checking, once this arrives, whether it changes what needs to be extracted from Swift/Kotlin code at all, rather than assuming code-only extraction (mirroring the TypeScript/Angular approach exactly) is still the complete plan. Not designed further here — a real placeholder, not a task.

## Placeholder, noted 2026-09-07: retrieval/persona wording derived from the TS corpus needs re-checking too, not just extraction logic

Real, separate caveat from the extraction-focused items below: `governance/roadmap/mcp-direction/atomic-prd-agent-skills.md`'s `search_facts` tool description now states, as a fix for a real retry-waste failure mode, that punctuation/brackets/exact-syntax tricks don't move a vector-search result. That wording was deliberately written to be language-agnostic (about the *mechanism* of embedding-based search, not about what any one language's descriptions happen to contain) — but the real evidence backing it (a character-frequency survey of `facts.description`, `10-sectioncontent-implementation-tasklist.md` Step 18) is 100% TypeScript-corpus data, from the only `descriptionFor()`-equivalent that exists today. Once Kotlin/Swift/C++ repos are extracted, their description-generation logic will very likely differ (different AST tooling, different language idioms), and the general wording should still hold — but it's worth re-running the same real character survey against those repos' real descriptions once they exist, rather than assuming the TS-derived instinct transfers untested.

## The meta-lesson, more important than any single item below

None of the real fixes this project made were found by reading a language spec and guessing. Every one was found by: running extraction for real → hitting a real retrieval-quality or business-question failure → root-causing by reading the *actual* AST shape or *actual* payload data directly, not assuming → checking the *real scale* of the gap (a direct grep across the whole codebase) before deciding it mattered enough to fix. Preserve that discipline for Swift/Kotlin specifically — this checklist should shorten the *search* for real problems, not replace actually finding and measuring them.

## 1. Multiple syntactic forms of the same semantic construct

**Real TS/Angular instance:** the template-attribute extractor only walked `node.inputs` (bound `[value]="expr"` bindings), silently missing plain literal attributes (`value="x"`) entirely — a different, unvisited part of the AST (`node.attributes`). Real, measured cost once found: 92 of 160 real `formControlName` usages (57%) used exactly the missed form.

**General lesson:** an AST walker tuned for one binding syntax will often silently miss its "plain literal" sibling — with no error, no warning, nothing to notice except a real coverage check.

**Swift/Kotlin-specific risk, concrete:**
- **iOS: SwiftUI vs. UIKit/Storyboard.** These are two structurally unrelated UI paradigms that very commonly coexist in one real app (older UIKit view controllers alongside newer SwiftUI screens). A form binding in SwiftUI (`TextField("...", text: $viewModel.name)`, `@Binding`) looks nothing like the UIKit equivalent (`textField.text = viewModel.name`, delegate callbacks, `IBOutlet`/`IBAction` wired from a Storyboard XML file). An extractor built against only one paradigm will silently miss every screen built in the other — the same shape of gap as the Angular one, potentially at greater scale.
- **Android: Jetpack Compose vs. XML layouts + `findViewById`/ViewBinding/DataBinding.** Same duality — Compose's declarative `TextField(value = ..., onValueChange = ...)` vs. an XML layout plus Kotlin code (`binding.emailField.text = ...`, or older `findViewById<EditText>(R.id.email)`).

**Concrete recommendation:** before writing an extractor, measure both forms' real prevalence with a direct grep across the actual repo — don't assume one paradigm dominates. Exactly the same verification discipline as "92 of 160" above.

## 2. Closed-set-of-values (enum) extraction

**Real TS/Angular instance:** `type X = 'owner' | 'tenant' | 'resident'` union types needed their real literal members extracted and threaded all the way through to embedded descriptions — found unused in the payload initially, a real, separate fix from the extraction itself.

**Swift equivalent:** `enum InhabitantType { case owner, tenant, resident }`, or a `String`-backed raw-value enum. Same real-values-need-surfacing treatment.

**Kotlin equivalent:** `enum class InhabitantType { OWNER, TENANT, RESIDENT }` — or, for a closed hierarchy where each case carries different associated data, a `sealed class`/`sealed interface` with named subclasses, Kotlin's closer analog to a TypeScript discriminated union, and deserving the same "extract every real case" treatment.

**Concrete recommendation:** budget for this as a known, expected fix from the start, rather than waiting for a retrieval-quality investigation to stumble onto the gap the way this project did with TypeScript.

## 3. Recursive/nested structures — a shallow join is a coincidence, not a design

**Real TS/Angular instance:** `build-form-field-lineage-edges.ts`'s field-resolution join initially checked only a resolved type's *direct* properties (6/82 resolved); the real field lived one level down, inside a nested request sub-type. Fixed with recursion — then found real chains reaching 3-4 levels deep, crossing repos at any level, in real document families (`OSKUserInvitation`, `OSKAccessRight`).

**Swift/Kotlin equivalent:** nested `Codable`/`Decodable` structs (Swift) or nested `data class` with serialization annotations (Kotlin) mirroring backend document shapes will very likely have the same real nesting depth — a mobile model for a Building Unit Inhabitant record will almost certainly nest sub-structs (address, access rights, settings) the way the Angular mirror did.

**Concrete recommendation:** build any field-lineage/type-resolution join for Swift/Kotlin as a bounded, cycle-safe *recursive* walk from day one — this project already has real, direct evidence that a shallow join is a coincidence of whatever gets tested first, not a property of how these model hierarchies actually shape up.

## 4. Cross-repo type redeclaration — expect divergence *and* genuine collisions

**Real TS/Angular instance:** 42 real ambiguous cross-repo symbol_names, mostly Firebase and Angular independently redeclaring the same backend document as a local model. Found real safe mirrors (Timestamp/Date, optionality-only, cosmetic renames), real counterexamples where "prefer the backend declaration" would be actively wrong, and — checked directly, not assumed — at least one likely genuine *name collision* between two unrelated concepts (`OSKUserSettings` meaning different things on each side) rather than drift.

**Real, near-certain prediction:** the same pattern recurs, plausibly at greater scale, between Firebase and the Swift/Kotlin apps — mobile apps virtually always maintain their own local typed mirrors of backend API/Firestore shapes, for the same reason Angular does. Worth anticipating a *three-way* version too: iOS and Android may each independently redeclare the same conceptual model in their own language, completely independently of each other, not just relative to Firebase.

**Concrete recommendation:** apply the sibling-field-divergence check designed this session (compare *all* fields on both/all sides, not just the one field in question) as soon as any cross-repo join between mobile and backend is attempted — don't wait for a retrieval-quality investigation to surface it as a surprise the way it did for TypeScript.

## 5. Real, compiler-verified extraction — not text/regex matching

**Real TS/Angular instance:** `ts-morph`'s real type-checker was used specifically because bare field-name matching found 25 real collisions on `inhabitantType` alone — a measured, not theoretical, risk of guessing.

**Swift equivalent:** **SwiftSyntax** (Apple's own official Swift AST library) is the direct analog to `ts-morph` — a real, compiler-grade AST; genuine type resolution needs SourceKit / SourceKit-LSP integration alongside it, not syntax structure alone.

**Kotlin equivalent:** the **Kotlin Analysis API** (built on the K2 compiler frontend) is the closest real analog to `ts-morph`'s type-resolution capability — distinct from lint-focused tools like detekt/ktlint, which parse but don't fully resolve types the way a real extraction pipeline needs.

**Concrete recommendation:** before committing to an extraction library, verify directly that it actually resolves real types, not just parses syntax — the same verification this project already did for `ts-morph` before trusting it.

**Flagged 2026-09-08, not rewritten:** the Kotlin Analysis API recommendation above didn't survive contact with reality — disqualified in practice (non-Maven-Central, unstable dev snapshots version-mismatched to this repo's actual Kotlin 1.8.10; see `android-intercom-oskey-io/05-task1-scip-kotlin-disqualified-2026-09-08.md`). A syntax-only tool (tree-sitter-kotlin or `kotlinx.ast`) is now the live candidate. Re-reading the actual TS extraction code shows most of the fixes this section worried about (generic type-argument descent, closed-set enum/union values) turn out to be pure syntax-tree walking already, not real type-checker work — see `android-intercom-oskey-io/06-ts-pipeline-lessons-reflagged-for-tree-sitter-2026-09-08.md` for the real, narrower list of what actually needs semantic resolution.

**Swift-side, added 2026-09-09 — see item 10 below:** live research (not anticipation) now backs the SwiftSyntax recommendation above with real, current, named 2026 adopters, and surfaces one open risk with a real Kotlin-side precedent worth watching for: version pinning. Kotlin's Analysis API was disqualified specifically because it turned out to be dev-snapshot-only and mismatched to this repo's real pinned Kotlin version — worth checking for the Swift analog (an older pinned Swift version needing a correspondingly older, but hopefully still-working, SwiftSyntax release) the moment a real iOS repo and its real pinned Swift version exist, rather than assuming SwiftSyntax is immune to the same class of problem just because no evidence of it broke on this research pass.

## 6. AST walker coverage — audit what's *not* visited, not just what compiles

**Real TS/Angular instance:** BoundText/interpolation template nodes have no `.name` field and were silently skipped by a walker that only branched on `.name`-having children. No error, no warning — found only by direct inspection of the real AST shape.

**Concrete recommendation:** for any new Swift/Kotlin AST-based extractor, always cross-check the extracted count against an independent, real grep/regex count over the actual source for the same construct before trusting its coverage — this project's own most-repeated verification technique (see item 1's "92 of 160").

## 7. Real business/actor scoping — a narrower UI is often correct, not a gap

**Real TS/Angular instance:** a hardcoded `inhabitantTypes` array showing only owner/tenant (never resident) was *correct*, actor-scoped PGO behavior — initially mistaken for a possible completeness gap before checking real business context (`Oskey Personas and Authority models.md`).

**Same lesson applies directly to mobile:** a resident-facing iOS/Android screen legitimately showing fewer options than a backend type permits is very likely correct, actor-scoped behavior. Don't flag "type says N, UI offers fewer" as an automatic finding without checking real persona/authority context first.

## 8. Retrieval-side, worth anticipating rather than rediscovering

The camelCase/compound-identifier tokenization problem found in this session's hybrid-retrieval research (a naive lexical channel can't split `getUserName` into `get`/`user`/`name`) applies identically to Swift and Kotlin (same camelCase/PascalCase conventions as TypeScript) — not a new problem when it recurs, the same one already found and documented in `governance/roadmap/market-research/02-findings-retrieval-architecture-2026-09-05.md`.

## 9. Real, honest unknowns this document can't cover yet

- Everything above is anticipation from general Swift/Kotlin/iOS/Android knowledge, not empirical findings from OSkey's actual mobile repos — none of it is confirmed to exist in these specific codebases.
- A real unknown with no TypeScript/Angular analog at all: platform-specific offline/local-storage layers (CoreData/SwiftData on iOS, Room on Android) may constitute a *third* kind of "local mirror of backend data," beyond the network-model layer already discussed above — worth checking for directly during real P1 extraction design, not assumed away because nothing in the TS/Angular work anticipated it.

## 10. Swift AST extraction tooling — live research findings, 2026-09-09 (different in kind from items 1-9 above)

**Different in kind from everything above this point**: items 1-9 are anticipation from general language/tooling knowledge, not yet checked against any real Swift repo. This item is *also* not checked against a real OSkey iOS repo (none exists yet) — but it is live-researched, current findings about the real state of the Swift tooling ecosystem, not analogy from the TypeScript/Kotlin experience. Follows directly from, and mostly corroborates, `market-research/08-findings-swift-kotlin-ast-extraction-2026-09-06.md` §1 — this section adds three things that report didn't cover, run specifically because of how the parallel Kotlin investigation played out (see the 2026-09-09 flag on item 5 above).

**Version-pinning risk — real, plausible, not yet confirmed either way.** SwiftSyntax major versions are explicitly aligned to Swift language versions (e.g. `509.x` ↔ Swift 5.9), so an app pinned to an older Swift version — the direct iOS analog of the Android app's real Kotlin-1.8.10 pin, discovered only by reading its actual `build.gradle.kts` — would need the matching older SwiftSyntax tag, not the newest. Unlike the Kotlin Analysis API's disqualifying problem, no evidence was found that older tagged SwiftSyntax releases are broken, unpublished, or dev-snapshot-only (they appear to be ordinary tagged releases going back through the 5.x line) — but no published compatibility matrix confirming this cleanly was found either. Treat "older SwiftSyntax versions still work fine" as a real, testable hypothesis, not a confirmed fact. **Concrete recommendation, mirroring item 5's Kotlin lesson exactly:** the moment a real iOS repo exists, read its actual pinned Swift/Xcode version directly (the same way the Kotlin pin was found) before assuming any specific SwiftSyntax version works — don't assume the newest tooling applies cleanly, and don't assume the version-pin risk that hit Kotlin doesn't apply here just because this research pass found no evidence of it breaking.

**tree-sitter-swift exists as a lightweight alternative, with no accuracy signal either way.** [alex-pinkus/tree-sitter-swift](https://github.com/alex-pinkus/tree-sitter-swift) (now also under the official `tree-sitter` org) is real and active — 223 stars, 511 commits, published to npm/crates.io/Go. Unlike tree-sitter-kotlin, it has **no equivalent cross-validation-against-real-parser self-disclosure** (no 61%-style number, positive or negative), and its README says nothing about SwiftUI result-builder DSL nesting, property wrappers, or generics specifically. Genuinely unknown, not a clean bill of health — could mean better real accuracy (Swift's grammar may be more tractable than Kotlin's) or just less rigorous self-testing. Not resolvable from research alone; would need the same kind of direct cross-validation work tree-sitter-kotlin's own maintainers already did, run against real Swift source, before trusting it the way `kotlin-compiler-embeddable` was preferred over tree-sitter-kotlin specifically because of its self-reported gap.

**A new, directly relevant 2026 tool**: [alexey1312/swift-index](https://github.com/alexey1312/swift-index) ("SwiftIndex") — a Swift-native semantic-search CLI/MCP server, actively developed (175 commits) though early-stage (5 stars, single maintainer). Notable for independently validating the toolchain choice already made in `market-research/08-...md`: it uses **SwiftSyntax as primary parser, with tree-sitter only as a fallback for non-Swift files** (ObjC/C/JSON/YAML/Markdown) — a real, current, non-Apple project reaching the same conclusion this project's own research already had, and explicitly built for AI-assistant/MCP consumption, close in spirit to this project's own ADR-007 direction.

**SourceKit-LSP setup cost, confirmed bounded but real**: ships with any Xcode 11.4+/Swift toolchain install (`xcrun sourcekit-lsp`), uses "indexing while building" (initial index takes 2-3x a normal build's time), background indexing on by default since Swift 6.1. No new information changing `01-real-findings-from-android-intercom-onboarding-2026-09-07.md`'s existing "expect a real, non-trivial toolchain cost" conclusion.

**Net read**: nothing here overturns the existing SwiftSyntax+SourceKit-LSP recommendation — if anything it's reinforced by an independent 2026 adopter (SwiftIndex) making the same architectural choice. The one real open risk worth carrying forward is version-pinning — genuinely unresolved from research, and, per this project's own standing discipline, not resolvable until the actual iOS repo exists and its real pinned Swift version can be checked directly, the same way the Kotlin 1.8.10 pin was.
