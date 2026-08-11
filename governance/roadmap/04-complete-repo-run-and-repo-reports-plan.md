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

- [x] **Done 2026-08-11, via Gemini (`gemini-default`, standard thinking).** Ran `01a`+`01c` for all 12 modules in the repo (`tasks`, `admin`, `building`, `access_control_device`, `call`, `unit_management`, `supplier`, `apps`, `settings`, `core`, `user`, `organization`), smallest-to-largest with a citation check after each. Output lives at `output/runs/<repo>/<runId>/llm-comparison/gemini-default/<module>/` (kept out of the canonical `knowledge-corpus/` path deliberately, so it never overwrote Claude's existing `tasks`/`building` gold-standard profiles). Chose standard thinking over `gemini-default-highthinking` deliberately — the cross-cutting depth gap (gaps-doc items 16/18) was closed by the Stage-1-adjacent contract fix (item 21), not by extra thinking budget, so standard was both sufficient and cheaper. Claude's own full 12-module pass was NOT run — only `tasks` and `building` exist as Claude references, by design, to keep Anthropic budget in reserve per explicit instruction.
- [x] **Done 2026-08-11.** Citation validation and provenance sidecars verified for every one of the 12 modules, not spot-checked: **1,293 citations total, 1,286 verified (99.5%), 7 line-unverified (weak signal only), 0 fabricated anywhere.** Zero warning/error/fatal notifications across the entire run (`run-notifications.json` highestSeverity for this run's entries: none above info).

### Stage 4 — Design the repo-level reduce, deliberately, using Stage 3's own lesson from the start

The point of doing this stage *before* writing any repo-level code: Plan 03 had to discover, empirically, that full-text concatenation across many units is the wrong default and assembly-plus-targeted-synthesis is the fix. That lesson transfers directly one level up; there's no reason to relearn it at repo scale.

- [x] **Decided 2026-08-11: per-module extracts, not full profiles.** Each module's Executive Summary (Section 1), Architectural Position (Section 2), and Cross-Cutting Risks only (Section 13's cross-cutting bullets, not per-capability open questions) — mirroring the module-level reduce's own "extracts, not full text" input design exactly one level up.
- [x] **Decided 2026-08-11: no new aggregation script needed.** `knowledge-pipeline/resolved-engineering-graph.json` turned out to already be repo-wide (`confirmedCallEdges` with `sourceModule`/`targetModule`, `rbacRequirements` already cross-module) — built by Phase 1's existing `04-build-resolved-graph.ts`. The repo-level reduce reads it directly and aggregates in-memory (group call edges by module pair, count) rather than reading and re-merging 12 separate per-module `cross-module-dependencies.json` files.
- [x] **Decided 2026-08-11: no fact-based citation validation at repo level, by design, not oversight.** Citations at this level name modules (e.g. "per `building`'s Architectural Position"), not fact IDs — the LLM never sees raw facts at this level, so `validateCitations()` (which checks fact-ID/file-line patterns) doesn't apply and would either find nothing or risk a false match. The provenance sidecar says so explicitly (`generatedFrom.note`) instead of silently omitting the check.
- [x] **Decided 2026-08-11: a repo-wide consolidated API catalog is explicitly deferred, not in scope for v1.** The 12 per-module API references remain the source of truth; revisit only if the tech team's RAG interface conversation surfaces a real need for one consolidated index.
- [x] **Built 2026-08-11.** New `02-generate-repo-report.ts` + `contracts/02-repo-synthesis-reduce.md` + `config/repos.json`'s `phase2.repoSynthesis` block. Deterministic sections (Module Inventory, Module Dependency Overview, RBAC Requirements Catalog — the last one cross-checked against `rbac-roles.json` for real, not eyeballed) assembled directly; one LLM call for Executive Summary, Major Subsystems, Cross-Cutting Patterns, Repo-Wide Risks.

### Stage 5 — Run and validate the repo-level report for real

- [x] **Done 2026-08-11.** Ran against all 12 already-completed Gemini module profiles (`gemini-default`, standard thinking) — one real LLM call, comparable input size to a single module's connective call. Output: `output/runs/.../llm-comparison/gemini-default/_repo-report/firebase-oskey-dev-repo-engineering-report.md`.
- [x] **Done 2026-08-11.** No fact-based citation check applies at this level (see above, by design). Quality spot-check against the module-level profiles: genuinely strong, not just structurally complete — the deterministic RBAC catalog surfaced ~30 permission strings checked in code but missing from `rbac-roles.json` (a real, deterministic finding, zero hallucination risk); Section 6 correctly identified `core` as the platform's structural hub (1,422 inbound edges from 11 of 12 modules) and the `user`↔`building` symmetric bidirectional coupling; Section 7's risks correctly drew on per-module extracts, not just the deterministic tables (e.g. citing `building_accesses`/`building_unit_nonAppUser`'s zero-RBAC-checks finding, which only exists in `building`'s own earlier-generated profile).

### Stage 6 — Cross-provider validation (separate, explicitly non-blocking thread)

- [ ] Using Claude's already-validated `building` output as the gold-standard reference, run the same module through Gemini (after Stage 1's cache-marker fix) and compare structure, quality, and citation accuracy against it directly.
- [ ] If the comparison is ambiguous, add OpenAI credit and use it as an independent judge comparing Gemini's output against the Claude gold standard — same cross-model-validation pattern already used successfully on the facts-vs-decisions document.

---

## Explicitly not deciding yet

- Landscape-level (cross-repo) synthesis — a separate scope, once repo-level actually exists and this repo isn't the only one onboarded.
- Decision A2 (the full persistent knowledge model) — still gated on finding the interface with the tech team's RAG/EmbeddingGemma retrieval layer, per `03-token-economics-remediation-plan.md`. That conversation is still pending and isn't a prerequisite for this plan's stages, but shouldn't be forgotten either.
- Whether repo-level (or any of this plan's) output gets promoted into `knowledge-corpus/`, which currently only holds stale, pre-Plan-03 runs.
