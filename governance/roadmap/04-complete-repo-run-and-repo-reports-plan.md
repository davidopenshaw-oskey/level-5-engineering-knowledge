# Implementation Plan 04 — Complete Repo Run & Repo-Level Reports

**Status:** Not started. Ready to begin at Stage 1 — no open decision blocks it, but read the companion gaps document first.
**Created:** 2026-08-11

*Fifth plan under the numbered-plan-file convention (see `00-capability-based-module-synthesis.md`, `01-cross-module-dependency-graph.md`, `02-structural-narrative-synthesis-tiers.md`, `03-token-economics-remediation-plan.md`). Companion document: `04-gaps-and-issues-before-full-repo-run.md` — read that first. Several stages below exist specifically to resolve an item catalogued there before it can silently cause a problem at scale, rather than being discovered mid-run the way a few things have been this session already.*

---

## Why this exists

The original three-part pipeline vision was: AST facts (no LLM) → a profile and API reference per module → a repo-wide report tying the modules together. Plan 03 did real, verified work on the second piece — but only ever against `building`, the repo's most complex module, and only through the capability-based path. Two things are still true: the third piece (repo-level reduce) has never been built at all, and the second piece is produced by two different, unequally-equipped code paths depending on module size (small modules via `00-generate-module-profile.ts`, which has none of Plan 03's caching or provenance work; large modules via the capability-based flow, which has all of it).

This plan closes both gaps for real — a complete module-level pass across every module in the repo, then a deliberately-designed repo-level reduce — and treats cross-provider validation (Gemini via GCP budget, Claude's output as the gold standard, OpenAI as an independent judge) as a related but explicitly non-blocking third thread, since it doesn't need to finish before the repo-level work can start.

**Governing constraint carried over from Plan 03**: economics must stay traceable, and every real number in this plan should come from measurement, not projection left unchecked. The cost-projection stage below is a *plan*, not a substitute for verifying the real number once each module actually runs.

---

## Task List

### Stage 1 — Consolidate the module-level pipeline before scaling

Everything here is about not carrying an unresolved inconsistency into 11+ more real runs.

- [x] **Fix the cross-provider cache-marker bug before any Gemini test.** *Done 2026-08-11.* `callGemini` and `callOpenAI` in `_shared/llm-adapter.ts` now strip `CACHE_BREAKPOINT_MARKER` before sending the prompt, so it can never leak into a non-Anthropic provider's visible prompt text. This is a safe no-op strip, not a caching implementation for those providers — Vertex AI's own caching mechanics are still unresearched (gaps doc item 3).
- [x] **Decide the small-module path.** *Done 2026-08-11.* Decision: every module, regardless of size, goes through the capability-based path — `01a-generate-capability-syntheses.ts` (new: Stage A only, extracted from `01`'s embedded loop into shared `_shared/capability-synthesis.ts` so it's not duplicated) followed by `01c-generate-assembly-first-profile.ts` for the reduce/assembly. This works uniformly because `05-partition-capability-packs.ts` already groups any facts without a real submodule into a catch-all `_module_root` pack — a small, flat module still produces exactly one capability pack and takes the same path as a large one. `00-generate-module-profile.ts`'s separate single-call path is retired for new work (its header comment now says so explicitly).
- [x] **Verify the provenance sidecar mechanism end-to-end via a real `01c`/`01d` run.** *Done 2026-08-11.* Ran the new `01a` + `01c` path for real against the `tasks` module (1 capability pack → 2 real Anthropic calls total) via `claude-default`, approved explicitly before spending. Both `tasks-engineering-profile.md.provenance.json` and `tasks-api-reference.md.provenance.json` were written by `01c` itself, at the canonical `knowledge-corpus/` path, well-formed, with correct `generatorType` ("llm" vs "deterministic"). Real finding surfaced by this run (not a bug in the sidecar mechanism, but worth tracking — see gaps doc item 13): the LLM's output for this module used neither recognized citation format (backtick-file-path-with-line-range, nor pipe-delimited fact ID), so `citationSummary` correctly came back all-zero rather than fabricating a pass.
- [x] **Explicitly reconcile the older scripts** (`00-generate-module-profile.ts`, `01-generate-capability-based-profile.ts`, `01b-rerun-reduce-only.ts`). *Done 2026-08-11.* `00` and `01`'s Stage B are retired for new work (header comments updated to say so, and to point at `01a`+`01c` instead) but kept in the repo as historical reference/comparison baselines, not deleted. `01`'s Stage A loop remains valid and now shares its prompt-construction logic with `01a` via `_shared/capability-synthesis.ts`. `01c` was promoted out of "bounded experiment" status: it now writes to the canonical `knowledge-corpus/<repo>/<runId>/` location (previously `assembly-experiment/<LLM_CONFIG_KEY>/`) since it is the standard path, not a parallel comparison. `01b-rerun-reduce-only.ts` is kept as-is — still the right tool for Stage 6's cross-provider comparison, since it writes to a separate `llm-comparison/<LLM_CONFIG_KEY>/` path that can't collide with the canonical output.

### Stage 2 — Cost-project the full-repo run before starting it

- [ ] For each module in this repo, estimate cost from the real `building` per-capability rate (post-caching: roughly $0.10-0.36 per capability call, depending on evidence-pack size) multiplied by that module's actual submodule count — already known from `05-partition-capability-packs.ts`'s real output (e.g. `organization`: 13 submodules, `user`: 10, `admin`: 5, several modules with 0 meaning single-capability) — plus one connective call per module.
- [ ] Confirm an explicit budget ceiling before starting, given the current Anthropic balance. If the projection is uncomfortably close to that balance, decide the fallback (partial run, different provider, top-up) before starting rather than mid-run.

### Stage 3 — Run the complete module-level pass

- [ ] Run capability regeneration + assembly-first profile/API-reference generation for every module in the repo, reusing the validated `01c`/`01d` flow (with Stage 1's fixes already in place).
- [ ] Verify citation validation and provenance sidecars for every module's output — not just spot-checked, actually confirmed per module, the same discipline used for `building`.

### Stage 4 — Design the repo-level reduce, deliberately, using Stage 3's own lesson from the start

The point of doing this stage *before* writing any repo-level code: Plan 03 had to discover, empirically, that full-text concatenation across many units is the wrong default and assembly-plus-targeted-synthesis is the fix. That lesson transfers directly one level up; there's no reason to relearn it at repo scale.

- [ ] **Decide the repo-level connective-tissue call's input boundary** the same way Decision B was resolved at module level: each module's short summary (its own profile's Section 1, not the full profile) plus whatever repo-wide deterministic artifacts already exist — not full-text concatenation of 11+ module profiles into one prompt.
- [ ] **Identify what repo-wide deterministic artifacts actually exist versus need building.** `06-build-cross-module-dependency-graph.ts` already writes one file *per module* (that module's own outbound/inbound view) — confirm whether reading all of those together is sufficient for a repo-level reduce, or whether a single aggregated repo-wide graph object is worth building first.
- [ ] **Decide the citation-validation evidence scope for repo-level claims.** `validateCitations()` is currently always called against one module's evidence graph. A repo-level report's claims could cite any module's facts — decide whether that means assembling a repo-wide combined fact array (straightforward: concatenate every module's evidence-graph facts) or something else.
- [ ] **Decide whether a repo-wide consolidated API/interface catalog is in scope for this plan.** Currently there are 11 separate per-module API references and nothing repo-wide. Explicitly decide to build one, or explicitly defer it — don't let it default into existing by accident or not existing by oversight.
- [ ] Build the repo-level reduce script, applying the boundary/evidence-scope decisions above.

### Stage 5 — Run and validate the repo-level report for real

- [ ] Run it against this repo, measure the real token/cost numbers (not a projection) the same way every other stage in this project has been measured.
- [ ] Confirm citation validation passes at repo scope; spot-check quality against the module-level profiles it was built from.

### Stage 6 — Cross-provider validation (separate, explicitly non-blocking thread)

- [ ] Using Claude's already-validated `building` output as the gold-standard reference, run the same module through Gemini (after Stage 1's cache-marker fix) and compare structure, quality, and citation accuracy against it directly.
- [ ] If the comparison is ambiguous, add OpenAI credit and use it as an independent judge comparing Gemini's output against the Claude gold standard — same cross-model-validation pattern already used successfully on the facts-vs-decisions document.

---

## Explicitly not deciding yet

- Landscape-level (cross-repo) synthesis — a separate scope, once repo-level actually exists and this repo isn't the only one onboarded.
- Decision A2 (the full persistent knowledge model) — still gated on finding the interface with the tech team's RAG/EmbeddingGemma retrieval layer, per `03-token-economics-remediation-plan.md`. That conversation is still pending and isn't a prerequisite for this plan's stages, but shouldn't be forgotten either.
- Whether repo-level (or any of this plan's) output gets promoted into `knowledge-corpus/`, which currently only holds stale, pre-Plan-03 runs.
