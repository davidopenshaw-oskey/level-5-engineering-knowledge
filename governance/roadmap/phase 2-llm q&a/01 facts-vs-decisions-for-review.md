# Facts Surfaced vs. Decisions Still Open — Revised After Cross-Model Validation + Real Measurement

*Status: still a discussion/review draft, not yet persisted to backlog. Round 1 (validation by Gemini and OpenAI) is folded in below, plus a real measurement taken afterward that overturned one of our own claims. Corrections and additions are marked inline.*

## Guiding principle (adopted 2026-08-03)

**Economics must be traceable, with the same discipline this project already applies to facts.** Every fact in this corpus is verifiable and citable; nothing is trusted just because an LLM asserted it. The same standard now applies to cost: at any point in the pipeline, it should be possible to say exactly where tokens and dollars went — per call, per level, per component — not just a total after the fact. The notification-logging bug found and fixed earlier this session (every capability call's usage silently overwriting the previous one) is a concrete example of what a violation of this principle looks like in practice, not just a bug — it made the system's own spending untraceable.

**Approaching a token or cost ceiling in any part of the architecture is treated as a defect in that part of the architecture, not a tuning problem to route around.** If a call is closing in on a context-window limit, or a run is closing in on a budget limit, that is a signal the design at that point is wrong — not something to patch with a bigger budget or a smaller model swap. This matters specifically because the project has to scale to a scope larger than what's been tested so far (15+ repos, growing), and an architecture that only stays affordable by accident, or that can't say where its own cost comes from, will not survive that scaling regardless of how good its output is.

## Facts (reasonably well-supported — by independent cross-model convergence, or by measured data)

1. **Line-number-based fact identity is broken for any incrementality scheme.** Unchanged — both validators confirmed this as settled. Fix: separate a stable semantic identity from a version/location field. *(Implementation note added by validation: needs a migration/alias path from the old ID format — existing citations, graph edges, and anything keyed on today's IDs would otherwise silently break.)*
2. **Scope-level invalidation is the wrong grain.** Unchanged — confirmed settled by both validators. Real invalidation needs to walk a dependency graph of what a specific claim actually depends on.
3. **The current reduce/synthesis step re-ingests and re-synthesizes already-finished content rather than assembling it — this part is settled behavior, not a hypothesis.** *(Revised per both validators: the claim that this is "the larger contributor" to the measured input was an inference from a rough byte estimate, not a measurement. It has now been checked directly — see the new measurement section below, which does not support it as stated.)*
4. **Downgraded from fact to hypothesis** (per both validators, independently) **and now shown to be weaker than originally claimed, per real measurement below.** Assembling instead of rewriting still avoids re-digesting already-produced text, but the real data shows the content it would stop re-ingesting (capability outputs) is a smaller share of the known input than the shared grounding documents are — so this fix alone would not be the dominant lever we first thought.
5. **Assembling verbatim preserves embedded citations more reliably than rewriting — true, but scoped.** Only holds when the component is included verbatim, unexcerpted, and unrenumbered; a rewrite of surrounding context can still change how a citation reads even if the citation text itself survives.
6. **Assembly-based combining does not, by itself, fix cross-component connectivity correctness.** Confirmed by both validators. That correctness is bounded by how complete the deterministic connectivity artifacts actually are — the same known gaps (API-schema-join coverage, the thin Firestore-path signal) matter here for a second, independent reason beyond cost.
7. **No dedicated capability currently exists, in this pipeline, to detect "this call is now broken because something it depends on changed."** *(Softened per OpenAI: this is accurate to the best of our own project knowledge, not a claim backed by an exhaustive code audit.)* Deliberately staged — to be built incrementally as connectivity knowledge is constructed level by level, not designed as a general-purpose artifact ahead of that hierarchy existing.
8. **Citations embedded as prose are fragile to paraphrasing outside the pipeline's own assembly steps.** Confirmed by both validators as correctly settled.
9. **[Added — Gemini] A 230K-token input already exceeds a 200K-token context window.** This isn't only a cost problem — it's a hard feasibility gate. Shrinking input size is required to make some cheaper model tiers usable at all, independent of whether it also saves money on tiers with room to spare.
10. **[Added — Gemini, previously established but missing from this list] Splitting into smaller, more frequent calls increases total cost unless paired with caching.** The dominant cost per call is the large, fixed grounding/contract overhead resent identically every call; more/smaller calls multiplies that fixed cost across more repetitions.
11. **[Added — OpenAI] The current economic evidence is too narrow to support a general conclusion about Phase 2's sustainability.** The $4.80/one-module/one-repo/one-model measurement is real, but it proves that path *can* be expensive and *can* exceed cheaper-model context limits — it does not establish average module, repository, or enterprise-scale cost. "Phase 2 doesn't scale economically" remains a risk hypothesis, not a settled numerical conclusion.
12. **[Added — OpenAI] Serialization optimization and architectural reduction are separate levers.** Compact encoding (e.g., the compact-table fact format already in use) reduces token overhead without reducing how many concepts the model actually has to reason over. Both matter; neither substitutes for the other.
13. **[Added — real measurement, below] The two deterministic graph artifacts fed to the reduce step are unexpectedly large, and for an identifiable, fixable reason.** Not previously known to anyone in this discussion.

## Real measurement taken to resolve facts 3/4 (2026-08-03)

Checked the actual, on-disk components of the one real reduce call we have data for (`building` module, profile document), rather than continuing to reason about it:

| Component | Bytes | Share of known total |
|---|---|---|
| Grounding docs (architecture, personas, Firestore schema/rules/indexes, RBAC) | 208,732 | 41.2% |
| Cross-module dependency graph (JSON) | 99,149 | 19.6% |
| 11 capability-synthesis outputs, concatenated | 141,996 | 28.0% |
| Intra-module coupling graph (JSON) | 32,740 | 6.5% |
| Contract/instruction docs (reduce-specific) | 23,951 | 4.7% |
| **Known total** | **506,568** | |

**This overturns an earlier claim in this discussion**, made from a rough byte-to-token estimate without checking the actual files: capability outputs are *not* the largest known component. Grounding docs are larger. Assembly-based restructuring (facts 3-5) would still help, but it is not the single dominant fix it was assumed to be.

**New finding, not surfaced by either validator or by us before this check**: the two deterministic graph JSON files are large because each module/submodule relationship entry includes every individual import statement behind it — file path, line number, import path, named imports — not a relationship-level summary. Example, one real entry: a single outbound relationship (`building` → `access_control_device`) carries a `touchpoints` array of 6 full import records. The reduce step's actual stated need is to report that the relationship exists and is Confirmed — it does not need every import line to do that. This looks like a large, low-risk, independent win: compact these two artifacts to relationship-level summaries (a count and a few representative examples, not every touchpoint) before they're fed to the reduce step.

**Gap resolved 2026-08-11, both candidate explanations confirmed true.** Measured the two previously-unmeasured in-memory sections directly, using the exact same functions the pipeline calls (`filterCallEdgesForModule`/`formatCallEdges`, `computeOwnershipHints`/`formatOwnershipHints`) against the real historical run:

| Component | Bytes | Share of known total |
|---|---|---|
| Grounding docs | 208,732 | 31.8% |
| **Resolved call edges (previously unmeasured)** | **146,562** | **22.3%** |
| Capability outputs (11, concatenated) | 141,996 | 21.6% |
| Cross-module dependency graph | 99,149 | 15.1% |
| Intra-module coupling graph | 32,740 | 5.0% |
| Contract/instruction docs | 23,951 | 3.6% |
| Data-ownership hints (previously unmeasured) | 4,158 | 0.6% |
| **New known total** | **657,288** | |

Resolved call edges turned out to be the second-largest component overall, not a rounding error — 591 total edges (338 outbound + 253 inbound), each formatted as one uncapped line with full file paths and identifiers. At a 4-bytes/token estimate this new total (657,288 bytes) still leaves a 65,388-token gap against the measured 229,710; at 3 bytes/token it closes to within 10,614 tokens (4.6%). Both candidate explanations from the original gap were real: the two in-memory sections were larger than assumed, *and* this identifier/JSON-heavy content tokenizes less efficiently than the flat byte estimate assumed. Treating the remaining ~4.6% as attributable to the small remaining unmeasured scaffolding (module list, generation metadata, task framing) rather than pursuing an exact tokenizer count, which still isn't available.

**Fixed 2026-08-11.** `_shared/call-edges.ts`'s `formatCallEdges` grouped by relationship instead of listing one line per call site — verified first, across all 1,068 relationship groups repo-wide (not just `building`), that confidence and declaration location are always uniform within a group before relying on that (defensive fallback still handles it correctly if that's ever not true for future data). Real result on `building`: 146,562 → 69,472 bytes (52.6% reduction). No relationship, confidence, declaration location, or call-site count was dropped — repeated call sites for the same relationship (one real case: 78 separate lines for a single relationship) are now one line with a capped set of examples and an exact count, not silently removed.

## Decisions (genuinely open, not yet committed)

A. **Split per the validators' disagreement, rather than picked one side.** Gemini argued facts 2 and 8 already force adoption of a structured representation; OpenAI argued they don't, since a lightweight structured layer could coexist with markdown as the primary output. Resolving the disagreement: it splits into two differently-sized decisions.
   - **A1 — ✅ DECIDED AND IMPLEMENTED 2026-08-11.** Each generated document now gets a structured provenance sidecar (`<documentPath>.provenance.json`) — every citation, tagged verified/line-unverified/file-not-found, plus what the document was actually generated from (source capabilities, deterministic artifacts, LLM vs. deterministic generation). Built as an additive extension to the existing citation-validator (`allCitations` field, no behavior change to existing callers) plus a new `_shared/provenance-sidecar.ts` helper, wired into `01c-generate-assembly-first-profile.ts` and `01d-regenerate-single-capability.ts`. Verified for free against the real `building` profile before trusting it (2 citations, both correctly matched, identical to the earlier notification output). Second, independent reason this stopped being deferrable, beyond satisfying facts 2/8 for our own invalidation work: the tech team's RAG retrieval layer intends to index these documents, and a citation that only exists as prose is exactly what Fact 8 already warned doesn't survive retrieval/chunking/paraphrasing.
   - **A2 — commit to the full persistent knowledge model** (Signals, EvidenceSets, Conflicts, Reviews, lineage, Document snapshots, multi-dimensional assurance) — still the large, genuinely open bet. **Re-gated 2026-08-11 on a specific, better trigger than before**: not "if the bounded approach isn't sufficient" (too vague to act on), but *the outcome of finding the interface with the tech team's RAG/EmbeddingGemma retrieval layer*. If their platform already handles versioning, staleness, or conflict representation at the retrieval layer, building our own Signal/Conflict/Review/lineage objects would duplicate their infrastructure. If it doesn't, more of A2 is probably still needed to preserve the trust guarantees this project is built on. Not decidable in isolation until that conversation happens — treated as urgent, not parked.
B. **Exactly how content-assembly gets implemented** — component boundaries, ordering, duplicate-resolution, whether/how editorial smoothing happens, and now also: how much of the real savings actually requires shrinking the deterministic-artifact and grounding-doc inputs rather than just the capability-output re-ingestion.
C. **When and how staged connectivity-breakage detection (fact 7) actually gets built**, level by level. No timeline or design committed.
D. **Whether/how to formalize cross-organizational-boundary "contract surface" facts** for connectivity across language/toolchain boundaries. Direction proposed, not designed or built.
E. **Two explicitly parked, out-of-scope items**: a separate diagnostics/observability system, and eventual ingestion of non-source-code artifacts (hardware, firmware). Neither decided, neither blocking anything above.

## No-regrets actions (valid regardless of how A-E resolve)

- **Fix the fact-ID format** (fact 1) — bounded, independent, but needs a migration/alias plan, not a silent format swap.
- **Compact the two deterministic graph artifacts** (new finding above) — bounded, independent, likely a larger and more certain win than originally assumed for the assembly restructuring, and doesn't touch any open decision.
- **Run a bounded assembly-first reduce experiment** (re-scoped per OpenAI, from "replace the reduce stage" to "build and test a variant") — directionally sound, but coupled to Decision B and requires Stage-A output-contract tightening (stable section boundaries, separable content) to work cleanly; not fully unconditional, and — per the real measurement — should not be expected to be the dominant cost fix on its own.

## Still to check

- Get an exact tokenizer count (not a byte estimate) to close the ~103,000-token gap above, once a provider is available to ask.
- Decide whether A1 (minimal structured metadata) should be folded into the no-regrets list, given how small it appears to be relative to A2.
