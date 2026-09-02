# Structured-Output Pilot → Firebase Production Migration

**Status:** Shipped 2026-08-31. Stages 1-4 all complete — `01e` now calls Gemini with schema-enforced structured output in real production (verified against real live calls on `tasks` and `organization`, not just pilot data), and the free-text/regex citation mechanism is fully retired for the module-level (`01e`) path. `01a`/`01c`/`01d` fallback path is untouched and still free-text. Now a real production migration, not an experiment — decision made 2026-08-31: free-text/regex citation handling is too fragile for an unattended production system, on the strength of tonight's robustness evidence specifically (zero malformed/fabricated citations across 10 real calls up to 1,568 citations each, vs. three distinct new failure shapes found in the free-text mechanism in one evening). Semantic-quality/variance stayed genuinely mixed all night and is **not** the basis for this decision — noted so the record doesn't overstate what was actually proven. See `10-module-level-production-cutover-plan.md` for the module-level architecture this migration sits inside (unchanged by this work — only citation handling changes, not the one-shot-vs-fan-out decision). Full Stage 1-2 pilot results logged in `tasks.md` items 29 and the follow-up entries.

**Scope of this migration: Firebase only, `01e` only, citations only.** Matches the same "prove on one repo first" discipline that worked for both the V1-A/V1-B port and the module-level architecture port earlier tonight. Angular and Node-IoT each need their own schema (real new authorship per repo, not a shared config) and are explicitly deferred until Firebase's migration is proven in real production use — not started here. The `01a`/`01c` fallback path (for any module too large for one call) keeps the free-text mechanism for now; migrating it is a separate, lower-priority future task, not blocking this one.

## Task list

**Stage 3 — build the real render step (no pipeline wiring yet, reuses Stage 2's already-generated real data, no new LLM calls needed for this stage)** — Done/Resolved 2026-08-31.
1. ~~Write `renderStructuredModuleProfile()`: takes the Stage 1/2 schema's parsed object, produces the identical 0-14 numbered markdown document `01e` produces today.~~ Done — `phase-02-inter-module-synthesis/_shared/structured-output-render.ts`. Renders sections 1, 2, 3, 6, 9, 12, 13 (LLM-authored) with the same `(FactId:#NNN)` inline-footnote convention and Section 14 format the free-text pipeline already produces, via the existing `formatEvidenceAppendix()`/`EvidenceAppendixEntry` reused unchanged.
2. ~~Evidence-ID restoration: simpler than today's regex-based `restoreFactIdCitations`~~ Done — direct `idMap[shortId]` lookup per `evidenceIds` entry, no regex. An unresolvable short ID renders loudly as `(unresolvable:F123)` inline rather than vanishing silently.
3. ~~Citation validation: simpler than today's regex-based `extractCitations`~~ Done — `validateStructuredResponse()` walks the whole parsed object for every `evidenceIds` array (array-membership check against `idMap`) and separately checks each capability's `name` field against the real pack-name list (`unknownCapabilityNames`/`missingCapabilityNames`), mirroring what the free-text path's `SINGLE_CAPABILITY_NAME_REMAPPED`/missing-capability checks catch today.
4. Splice in the sections that stay deterministic and unaffected by this change (Public Interfaces, API Contracts, Outbound Coupling) — unchanged code; wiring this into `01e` itself is Stage 4 item 8, not part of Stage 3's own render/validate module.
5. ~~Verify against Stage 2's own already-generated real data (both `tasks` and `organization`, both arms)~~ Done, zero new LLM calls. Ran `renderStructuredModuleProfile`/`validateStructuredResponse` against all 10 real Stage 2 JSON responses (tasks: 6 files; organization: 4 files; up to 1,568 evidence IDs in one response). Result: **zero fabricated evidence IDs and zero unresolvable citations across all 10 files** — every real `evidenceIds` entry resolved via `idMap`. One real, correctly-caught defect: `tasks/arm-b-run1.json`'s `_module_root` capability came back with `name: ""` instead of `"_module_root"` — flagged by `unknownCapabilityNames`/`missingCapabilityNames` exactly as designed, not a render-code bug. `tsc --noEmit` clean across the whole project. Rendered markdown spot-checked for `organization/arm-c-run1`: section numbering, footnote ordering, and Section 14's real fact-ID format all match production output exactly.

**Stage 4 — wire into `01e`, retire the free-text mechanism there** — Done/Resolved 2026-08-31.
6. ~~Swap `01e`'s prompt-assembly to the schema-based contract framing~~ Done — `contracts/03-module-level-synthesis.md` rewritten (used exclusively by `01e`, safe to replace wholesale; `01a`/`01c` use their own separate contract files, untouched).
7. ~~Extend `LlmProviderConfig`/`callGemini` to accept an optional response schema~~ Done — `LlmProviderConfig.responseSchema?: object` (deliberately NOT loaded from `config/llm-providers.json`, since it's tied to one document type's shape, not a provider setting — callers build a per-call config via `{ ...llmConfig, responseSchema }`). `callGemini` sets `responseMimeType: "application/json"` + `responseSchema` when present.
8. ~~Replace `01e`'s response parsing with `JSON.parse()` + Stage 3's render function~~ Done. `parseModuleLevelResponse`/`splitByNamedHeader` deleted from `01e` entirely (local to that file, not shared with `01a`/`01c`, so no fallback-path impact). `01e` now calls `callLlm` directly (not `runDocumentCalls`, whose `splitMarkedFiles` parses the free-text `===FILE:===` wrapper that no longer exists for this path) and persists the raw JSON response to its own file (`<module>-module-level-response.json`) as part of the audit chain.
9. ~~Replace `01e`'s citation-validation call with Stage 3's array-based validator~~ Done — `validateStructuredResponse` replaces `validateCitations` as `01e`'s own top-level check. `writeProvenanceSidecar`'s *internal* `validateCitations` call is untouched (a second, independent regex-based check against the resolved-inline reconstruction, not a replacement).
10. ~~Do not delete the free-text functions from `run-utils.ts`~~ Confirmed untouched — `01a`/`01c` still import and use them; only `01e`'s own imports were trimmed.
11. ~~Keep the model/provider as `gemini-3.5-flash`~~ Confirmed — no change to `config/llm-providers.json`'s `gemini-default` entry.
12. ~~Real verification: run `01e` for real against `tasks` and `organization`~~ Done, real production calls (not comparison-only pilot data), `COMPARISON_MODE=true` so canonical `knowledge-corpus/` was never touched. **`tasks`**: clean end-to-end; the one real capability came back with `name: ""` instead of `"_module_root"` (same defect class as Stage 3's finding, now live) — caught and remapped by `SINGLE_CAPABILITY_NAME_REMAPPED` exactly as designed; final `CITATION_VALIDATION_PASSED`: 34 evidenceIds, 0 fabricated. **`organization`** (first call): found a genuinely new, real bug on gemini-3.5-flash — two `evidenceIds` array elements came back as `"F558, F559"` / `"F2318, F2327"` (two real short IDs bundled into one comma-separated string inside a single array element, rather than two separate elements). The schema's `type: "string"` per-element constraint can't prevent this. Root-caused against the actual captured JSON (not guessed), fixed with `normalizeEvidenceIds()` (splits each `evidenceIds` string on `,`/whitespace) in `structured-output-render.ts`, applied in both `validateStructuredResponse` and `renderStructuredModuleProfile`. Verified the fix against the exact real captured bug instance (0 fabricated after, both previously-orphaned IDs now resolve and appear in Section 14) and confirmed no regression against all 10 Stage 3 archived files. Re-ran `organization` for real post-fix: `CITATION_VALIDATION_PASSED`, 463 evidenceIds, 0 fabricated. (A stale `CITATION_FILE_NOT_FOUND` notification briefly appeared from the first call's notification ID being upserted by the second run — the known notification-ID-collision behavior from item 20 below, not a real regression; confirmed by reading the actual freshly-written JSON directly, which was clean.) Net first-production-day finding: comma-bundling inside a schema-enforced array element is a real, narrower failure mode structured output does NOT eliminate on its own — still far more tractable than the free-text mechanism's equivalent (one known field/delimiter to split vs. open-ended prose scanning), and now fixed.
13. ~~Once verified, `01a`/`01c`/`01d` and the old free-text contract stay as-is~~ Confirmed — no changes made to any of them.

**Known residual gap, not addressed here:** the notification-ID-collision behavior (upsert-by-ID keyed on sourceScript+code+module+file) can show a stale entry when the same `LLM_CONFIG_KEY`+module is run twice in one session, as seen live during item 12's verification — the underlying fix (giving every comparison run's file key enough uniqueness) was already applied for the cross-config case (see `outputLabel`-prefixed `details.file`, items 20/26) but not for the same-config-run-twice case. Not blocking (the real output files are always authoritative and were checked directly), but worth a small follow-up if repeated same-key re-runs become routine.

## Stage 2, part 2: `organization` results (2026-08-31)

Confound-free from the start (lesson already applied from `tasks`). **Structural reliability holds strongly at real scale**: all 4 runs valid, exactly 14 capabilities enumerated each time, 100% schema-conformant, zero fabricated evidence across 750-1,568 citations per run — far higher volume than `tasks`, still perfectly clean, including unconstrained Arm B.

**The `tasks`-scale "zero thinking under constraint" finding did not reproduce here** — all 4 runs show comparable thinking-token usage regardless of arm. The earlier working hypothesis (constraint suppresses thinking → increases variance) needs narrowing: it may be module-size- or output-volume-dependent, not a general property of constrained decoding. Found specifically because a second module was tested before generalizing from the first.

**Content**: both findings established as reliably dominant across every earlier temperature/model test tonight (the unresolved-call-edge facts, and the `v1.org.buildings.create` over-privilege finding) are genuinely present in all 4 runs — confirmed by direct string search, not a title scan (a naive title-only read suggested more divergence than actually exists). This precise, cheap verification is itself a real advantage of the structured format over free-text prose.

**Follow-up, same day: chased a large Arm B run1-vs-run2 file-size gap (84%) to its real source, and found a genuine quality gap while investigating it, not just noise.** The size gap traced to citation *volume* (run2 cited ~2x more evidence per finding, 1,568 vs. 750), not narrative length (only ~11% more prose) or finding count (close: 43 vs. 52 responsibilities). Cross-referencing against the deterministic "Unresolved Call Edges" finding (the single most reliable result across every test tonight) found it correctly promoted to a module-wide Cross-Cutting Risk in both C runs, but **demoted to a buried per-capability Open Question in B-run2** despite B-run2 having more total citations overall. Citation count and citation placement quality are evidently separate properties — more evidence didn't mean better prioritization here. **Checked B-run1 too before generalizing**: it gets the placement right, same module-wide slot both C runs use — so the demotion is specific to B-run2, not a general Arm B weakness. Real tally: B 1-of-2 correct, C 2-of-2 correct — a real, worth-watching signal, smaller than first framed, consistent with the n=2-per-arm caveat throughout this whole investigation. Full detail in `tasks.md`.

## Stage 2 results (2026-08-31)

Ran against Firebase's `tasks` module: 2 calls Arm B (JSON via prompt, ordinary decoding), 2 calls Arm C (JSON Schema, grammar-constrained). **A real confound was found in the experiment's own design before trusting any result**: the first pass gave Arm B the full schema as prompt text but Arm C only a one-line note, conflating "does enforcement matter" with "does prompt detail matter." Fixed (identical full schema text in both arms, differing only in whether `responseSchema` was set) and Arm C re-run.

**Structural reliability**: clean across all 6 runs, including both unconstrained Arm B runs — 100% valid JSON, 100% schema-conformant, 100% real evidence IDs (55/70/53/45/41/71 citations checked, zero fabricated anywhere). Caveat: this is one small module (1 capability); the malformations that motivated this pilot (item 27) occurred on much larger modules with hundreds of citations, so "Arm B was already clean here" shouldn't be read as "enforcement is unnecessary" without testing at real scale.

**A real, robust side effect**: Arm C shows zero thinking tokens across all 4 of its runs; Arm B shows real, substantial thinking (943-2,354 tokens). Held after fixing the confound, so it's a property of enforcement itself.

**Semantic-variance signal, small-sample but directionally real**: Arm B converged on the identical dominant architectural finding in both runs. Arm C converged in only 1 of 2 (corrected) runs. **Working hypothesis**: the model may rely on its thinking process to reliably converge on the same salient pattern; removing that process (as constrained decoding appears to do here) could increase variance on exactly this axis — the opposite of naive "structured output reduces variance" intuition, and consistent with the external research's caution that this needs measuring in either direction, not assumed.

**Not yet done**: a larger-module test (does the clean structural result hold where the original bugs actually occurred), and a run forcing thinking on even under schema constraint (if the API supports combining both), to test the hypothesis above directly rather than just observe a correlation.

## Why

Three real, distinct citation-malformation bugs surfaced in one evening testing `gemini-3.7-flash` (tasks.md item 27) — a bundled-citation shape, a bare-single-backtick shape, and a stray-character variant of the first that broke the initial fix. Each was invisible to the exact-pattern regex check that predated it, because the entire citation mechanism is free-text convention (backtick-wrapped markers embedded in prose) parsed after the fact, not something the API can enforce. All three providers this pipeline uses (Gemini, Anthropic, OpenAI) already support schema-enforced structured output natively — confirmed against each provider's own official documentation.

## Revision: what changed after real feedback, and why it matters

Two pieces of real evidence arrived after the first draft of this doc, both worth taking seriously rather than filing as caveats:

1. **Google's own current Gemini structured-output docs** (verified directly, fetched and quoted, not taken on trust): *"While output is syntactically correct JSON, always validate values in your application"* and *"Implement robust error handling for schema-compliant but semantically incorrect outputs."* Confirmed word-for-word against the live page. Schema compliance and semantic correctness are explicitly different guarantees, per the provider itself.

2. **A more rigorous framing of what "does structured output help" actually means**, distinguishing three separate, independently-measurable properties:
   - **Structural reliability** — did the model return the required structure at all (valid JSON, required fields present, no malformed/duplicate sections)? Strong existing evidence this improves under real schema/grammar constraint.
   - **Semantic quality** — did the model identify the *correct* architectural findings? Not proven to change either way under structured output — model-, task-, and schema-dependent.
   - **Semantic variance** — do repeated runs identify materially the *same* findings? **No strong evidence that JSON reduces this.** A model can have near-perfect schema compliance while still varying run-to-run in which legitimate findings it selects — schema compliance and finding-selection consistency are different axes entirely.

**This corrects something this doc originally implied**: that moving to structured output might also help with the run-to-run variance investigated all evening (tasks.md items 25-26). That's not supported by the evidence and shouldn't be assumed. **The architectural case for structured output stands entirely on structural reliability — eliminating the citation-malformation bug class and simplifying rendering — independent of whether it changes semantic variance at all.** If it turns out to have zero effect on variance, that's not a failed pilot; that was never the thing being tested.

## Revised design: three arms, not two

The original plan compared "current markdown" against "structured JSON," which conflates two different variables: the *representation* (JSON vs. markdown) and the *generation mechanism* (ordinary decoding vs. grammar-constrained decoding). Separating them:

- **Arm A — current free-form markdown.** The existing baseline, no changes.
- **Arm B — JSON requested via prompt instructions, ordinary decoding.** No `responseSchema`/`strict` mode — just ask the model to return JSON matching a described shape, the same way the current contract asks for a specific markdown shape. Structural reliability here should look similar to today's failure modes (the model *can* still malform it), but this arm isolates whether the JSON *representation itself* changes anything about semantic quality, independent of constraint.
- **Arm C — JSON Schema / grammar-constrained decoding.** `responseSchema` (Gemini) / `strict: true` (OpenAI) actually enabled. This is the arm that can structurally guarantee the citation bug class is gone.

**The diagnostic this separation is actually for:**
- If **A ≈ B on semantic quality, but C < B** — constrained decoding itself (not JSON as a representation) is interfering with synthesis, and the schema or constraint design needs rethinking before shipping it.
- If **A ≈ B ≈ C on semantic quality, and C's structural reliability is far above A's** — that's a clean, strong result in favor of shipping Arm C.

Two real calls per arm (matching the self-consistency pattern already established this session), same module, same facts.

## Scope decision: which sections become structured arrays, not just citations

Re-reading the actual contract (`03-module-level-synthesis.md`) more carefully than the first draft did: most of its sections are already implicitly a *list of discrete items* rendered as prose — "every distinct responsibility," "the Firestore path(s)... and which fields it owns," specific named risks and asymmetries. Structuring those as arrays of typed finding-objects (not just adding a citations sidecar to flat prose) gives two real benefits beyond the citation fix: each finding carries its own evidence directly (no marker-indirection needed at all), and it makes the exact thing this whole evening's variance work did by hand all night — extracting named findings from prose to compare run-to-run — a direct, cheap array diff instead of manual reading.

Genuinely narrative sections (no natural "one finding per item" shape) stay flat strings: **Executive Summary**, **Architectural Position**, per-capability **Summary**.

Everything else becomes an array of objects, each with its own `evidenceIds` (replacing the earlier bracket-marker design — a finding directly lists which facts support it, no separate citations table to keep in sync):

```json
{
  "type": "object",
  "properties": {
    "moduleWide": {
      "type": "object",
      "properties": {
        "executiveSummary": { "type": "string" },
        "architecturalPosition": { "type": "string" },
        "ownershipConclusions": {
          "type": "array",
          "description": "One entry per Firestore path touched by more than one capability.",
          "items": {
            "type": "object",
            "properties": {
              "path": { "type": "string" },
              "owningCapability": { "type": "string" },
              "rationale": { "type": "string" },
              "confidence": { "type": "string", "enum": ["confirmed", "inferred"] },
              "evidenceIds": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["path", "owningCapability", "rationale", "confidence", "evidenceIds"]
          }
        },
        "crossCuttingPermissionsRisks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "finding": { "type": "string" },
              "confidence": { "type": "string", "enum": ["confirmed", "inferred"] },
              "relatedCapabilities": { "type": "array", "items": { "type": "string" } },
              "evidenceIds": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"]
          }
        },
        "architecturalObservations": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "finding": { "type": "string" },
              "confidence": { "type": "string", "enum": ["confirmed", "inferred"] },
              "relatedCapabilities": { "type": "array", "items": { "type": "string" } },
              "evidenceIds": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"]
          }
        },
        "crossCuttingRisksAndOpenQuestions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "title": { "type": "string" },
              "finding": { "type": "string" },
              "confidence": { "type": "string", "enum": ["confirmed", "inferred", "unknown"] },
              "relatedCapabilities": { "type": "array", "items": { "type": "string" } },
              "evidenceIds": { "type": "array", "items": { "type": "string" } }
            },
            "required": ["title", "finding", "confidence", "relatedCapabilities", "evidenceIds"]
          }
        }
      },
      "required": ["executiveSummary", "architecturalPosition", "ownershipConclusions", "crossCuttingPermissionsRisks", "architecturalObservations", "crossCuttingRisksAndOpenQuestions"]
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string", "description": "Exact submodule name as given in the fact table's submodule column." },
          "summary": { "type": "string" },
          "primaryResponsibilities": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "responsibility": { "type": "string" },
                "confidence": { "type": "string", "enum": ["confirmed", "inferred"] },
                "evidenceIds": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["responsibility", "confidence", "evidenceIds"]
            }
          },
          "dataOwnership": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "path": { "type": "string" },
                "fieldsOwned": { "type": "string" },
                "evidenceIds": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["path", "fieldsOwned", "evidenceIds"]
            }
          },
          "notablePermissionsObservations": {
            "type": "array",
            "description": "Empty array if nothing genuinely stands out for this capability -- do not pad with generic content.",
            "items": {
              "type": "object",
              "properties": {
                "finding": { "type": "string" },
                "confidence": { "type": "string", "enum": ["confirmed", "inferred"] },
                "evidenceIds": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["finding", "confidence", "evidenceIds"]
            }
          },
          "openQuestions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "question": { "type": "string" },
                "evidenceIds": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["question", "evidenceIds"]
            }
          }
        },
        "required": ["name", "summary", "primaryResponsibilities", "dataOwnership", "openQuestions"]
      }
    }
  },
  "required": ["moduleWide", "capabilities"]
}
```

Note there's no separate top-level `citations` array anymore in this revision — `evidenceIds` lives directly on each finding, which is simpler than the marker-indirection scheme in the first draft (nothing to keep in sync between prose and a sidecar table) and matches the array-of-findings shape throughout. `evidenceIds` entries are the same short-ID references (`F123`) the pipeline already uses; restoration to real fact IDs happens in post-processing exactly like today, just reading from a real array field instead of regex-extracting from prose.

**Schema-design caution carried forward directly**: `confidence` is a small, closed, already-existing taxonomy (`confirmed`/`inferred`/`unknown`) — safe to enum. Nothing else is force-fit into a closed enum; `title`/`finding`/`responsibility`/`rationale` etc. stay free strings, since over-constraining semantic content can push a model toward the nearest permitted category rather than the actual finding, per Google's own stated risk.

## What gets measured, tracked as three separate categories (not conflated into one verdict)

**Structural reliability**: parse/validation failures, missing required fields, malformed or duplicate entries, citation/evidence-ID resolution failures, template-assembly failures.

**Semantic quality / coverage**: finding coverage against what's actually in the facts, evidence-ID engagement (are real, relevant facts actually cited), responsibility/risk/permission-finding coverage, unresolved-call-edge engagement, unsupported-finding rate.

**Semantic variance**: finding retention/drop rate between the two runs in each arm, evidence overlap, confidence-tag stability, related-capability stability, new/missing-finding rate — same style of measurement 06b already did by hand, now a direct array diff instead of a manual prose read.

## Open questions for Stage 2, not resolved here

1. **Semantic quality under grammar-constrained decoding (Arm C vs. A/B)** — the real unknown, now properly isolated from "does JSON as a representation change anything" (Arm B).
2. **Real token-count delta across all three arms** — now fully measurable including thinking tokens (tasks.md item 28). No longer assuming shorter output; the array-of-findings shape has its own real JSON overhead (field names repeated per array item) that needs measuring, not estimating.
3. **Gemini's `propertyOrdering`** — untested whether generation order across this many nested arrays affects quality.
4. **Anthropic's exact mechanism for `claude-sonnet-5`** — only matters if the pilot extends past Gemini.

## Target for Stage 2

Firebase's `tasks` module — smallest real module in the corpus (1 capability, `_module_root`), cheapest possible real test, already production-connected. Two real calls per arm (A already exists as today's production output — no new calls needed for it; B and C need 2 calls each = 4 new real calls total). No pipeline wiring yet — inspect the raw responses by hand against the three measurement categories above before building anything.
