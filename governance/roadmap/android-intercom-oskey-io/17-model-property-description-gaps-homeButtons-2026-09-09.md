# Real `model_property` description gaps, found via a live PRD review — 2026-09-09

Cross-pipeline finding, same pattern as `16-...md` — surfaced from the MCP-direction side while manually reviewing a real generated PRD (`mcp-server/gold/2026-09-09-001-intercom-home-screen-config-button-dedup-fix.md`, the intercom home-button business request) "as if I were the Android developer who'd have to build it." Two real, verified gaps found in `model_property` description enrichment, both checked directly against the real source, not guessed.

## What was reviewed

The generated PRD's Technical Proposal cites two `homeButtons` properties as evidence (`OSKCustomConfiguration.homeButtons`, `OSKConfigurationData.homeButtons`) but never explains their real type or how a button label resolves to a specific call-directory recipient — the actual mechanism the whole business request is about. Checked why: pulled both facts' real `description` field directly from Postgres, then read the real source they describe.

## Gap 1: no type information in either description

```
model_property in app: OSKCustomConfiguration.homeButtons -- injected into: OSKCustomConfiguration (...)
model_property in app: OSKConfigurationData.homeButtons (...)
```

Neither says what `homeButtons` actually *is*. Real source, confirmed directly:

```kotlin
// OSKCustomConfiguration.kt
val homeButtons: List<String> = listOf(),

// OSKConfigurationData.kt (companion object)
var homeButtons = arrayListOf<String>(),
```

**Both are `List<String>` — plain label strings, nothing else.** This directly explains the real gap found reviewing the PRD as a developer: the doc claims "pressing a button calls the linked recipient," but a `List<String>` structurally cannot express a button-to-recipient link on its own — whatever mechanism resolves a label string to a specific call-directory contact lives somewhere else entirely, and neither the corpus description nor the agent's search surfaced it. This isn't a PRD-writing failure so much as a real, structural gap in what's currently knowable from this property alone.

Compare to how the TS pipeline enriches the equivalent case, e.g. `OSKInhabitantOnboardingCardRequest.inhabitantType -- type: OSKBuildingUnitInhabitantType | undefined` — a real, working `-- type: X` segment that Kotlin's `model_property` enrichment doesn't produce here at all.

## Gap 2: `OSKCustomConfiguration.homeButtons` mislabeled "injected into"

`"injected into: OSKCustomConfiguration"` is real enrichment language this pipeline uses elsewhere for genuine Hilt-injected dependencies (per `14-task7-description-enrichment-built-and-verified-2026-09-09.md`'s own real example: `context -- injected into: OSKGetAccessesUseCase`). But `OSKCustomConfiguration` is a plain Kotlin `data class` — `homeButtons` is an ordinary constructor property with a default value, not a Hilt-injected dependency by any real definition. Checked directly against the source (shown above) — confirmed, not assumed.

**Real, plausible root cause, not yet located in code**: the "constructor promotion" enrichment logic (built in Task 6/7 for genuinely-injected dependencies) looks like it's firing on *any* class constructor property, not just ones actually resolved as Hilt injections. Worth checking whether this affects other `data class` properties beyond this one instance — not verified beyond `homeButtons` here.

## Real, honest scope of this finding

Both gaps are description-enrichment issues (`descriptionFor()`'s `model_property` branch, or whatever upstream step feeds it type/injection info) — not an agent, persona, or MCP-tool problem. Reported here, not fixed here, per the same handoff pattern as `16-...md`.

## Real, deeper finding and fix, 2026-09-09 (call-argument capture)

Checking Gap 1 further against the real source (not just the two property declarations) found the actual real answer to "how does a `homeButtons` string resolve to anything" — and it isn't a button-to-recipient mapping at all:

```kotlin
isShowContact = homeButtons.contains("contact")
isShowPincode = homeButtons.contains("pincode")
isShowFaceRecognition = homeButtons.contains("face_recognition")
```

`homeButtons` is a **closed set of 3 hardcoded feature-toggle keys** that switch fixed, pre-existing buttons on/off — not an open, extensible button→call-directory-recipient mechanism the original business request assumed. This is a real, structural mismatch between what the business request wanted and what the code actually does — genuinely a design-intent question (does the real product need an extensible mapping that doesn't exist yet, or was the request based on a misunderstanding of a fixed toggle list?), which no AST fact of any kind can answer; it needs the actual UX/Figma source, still a known, waited-on gap.

**But the specific fact (which 3 strings are recognized) is real, code-derivable evidence that the pipeline was silently discarding** — confirmed directly: `01-extract-ast-evidence.ts` never captured a call expression's own arguments at all, unlike the TS pipeline's `callExpr.getArguments().map(a => a.getText())`. **Fixed**: `01` now captures `arguments: string[]` (raw source text per argument, same TS convention, ported via the same `value_arguments`/`.namedChildren` shape already proven by Task 5's own WebRTC extraction), threaded through `02-build-module-evidence.ts` as a plain data field (deliberately NOT folded into `stableFactId`'s secondaryKey — occurrenceOrdinal already disambiguates repeat call sites, and an argument changing shouldn't change a fact's own stable ID).

**Enrichment kept deliberately narrow**, same discipline the TS pipeline's own `apiContractDoc`/`callExpressionDoc` comment already established (a real call once dumped a multi-line object literal as an argument — noise, not signal): `descriptionFor()`'s new `kotlinCallArgumentsDoc` only renders when *every* argument is a short (≤40 char), single-line, string-literal-shaped token. Verified directly against Postgres: the 3 real `homeButtons.contains(...)` calls now render e.g. `call_expression in app/_unreferenced: OSKGetCurrentLocation -- calls: homeButtons.contains -- args: "contact" (...)`; a real non-literal case in the same file (`.lowercase(Locale.getDefault()).contains`) correctly produces no args suffix, confirming the filter doesn't over-fire. 113 facts repo-wide had their description text actually change; re-embedded for real (trivial cost), the other 9,637 kept their still-valid embeddings.
