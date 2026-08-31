# Fact-Table Redundancy Reduction + Module-Level Consolidation — Findings

**Status:** Real, verified feasibility result. Not wired into production. Triggered by a direct question about whether the per-capability fan-out architecture (2026-08-01) still solves the problem it was built for, given later, independent fixes.

---

## The question

The per-capability fan-out (one LLM call per submodule + one reduce call) was built to fix a real context-window overflow: `building`'s whole evidence graph was 1,376,733 tokens against a 1,048,576 limit. That number was measured *before* the same-day compact-table-encoding fix (~2.74x reduction) landed, and was never re-checked against it. Real per-module fact-count extrapolation using the actual measured compact-encoding ratio showed even the largest module in the repo (`organization`, 3,155 facts) would be ~549K estimated tokens — comfortably under a modern context window.

## Real test 1 — does a whole module fit in one call, and does quality hold?

Built `contracts/EXPERIMENTAL-module-level-synthesis.md` and `EXPERIMENTAL-module-level-test.ts` (both explicitly experimental, not wired into any real script). Combined all 14 of `organization`'s capability packs into one prompt, asked for both per-capability judgment sections (Summary/Responsibilities/Notable Permissions/Open Questions) and the module-wide cross-cutting sections (Executive Summary, Architectural Position, Ownership Conclusion, Cross-Cutting Permissions & Security, Architectural Observations, Cross-Cutting Risks) in one call, with Sections 3/4/5/6/8 explicitly excluded (deterministically assembled, not the LLM's job).

**Result: succeeded technically at 659,011 real input tokens** (one 429 rate-limit, correctly retried and recovered). All 14 capabilities present, no dropped content, no empty-section collapse (the large-module failure mode found in the reduce-step investigation did not reproduce here). All previously-validated real findings recurred (the `v1.org.buildings.create` over-privilege issue, the exact same unresolved-call-edge file:line citations, `organization_prompt_templates`'s missing RBAC). **One genuinely new real finding surfaced that no prior run this session had caught**: a global Firestore rules bypass (`/organizations/{id}` and `/buildings/{id}` allow any authenticated user read/write via `isValidUser()`, completely bypassing backend RBAC) — caught specifically because the model could see the whole module's permission landscape at once.

**Gap found**: the draft contract never specified the pipeline's actual citation format, so the model wrote plain prose with names in ordinary backticks — 0 structured citations, unverifiable.

## Real measurement — what's actually inside the 659K-token prompt

Broke down the real prompt by component. **88.3% is the raw compact fact table** (2,116,707 of 2,396,397 chars); everything else (grounding docs, deterministic graphs, RBAC catalog, contract text) is ~11.7% combined. This matters for the caching conversation: in the old per-capability architecture the stable/cacheable prefix dominated a small prompt (68-72%); here the module-specific, non-cacheable facts dominate a much bigger prompt, so caching alone would only ever touch the truly-stable slice (grounding+contract, ~6.6% of this call's total) — call-count/volume reduction is the dominant lever here, not caching.

## Real test 2 — removing redundant data from the fact table itself

Inspected the actual compact table (`factsToCompactTable` in `phase-01-ast-extraction/_shared/run-utils.ts`) directly. Found:
- **`module`/`repo`/`runId` columns: confirmed 100% constant across all 3,155 real facts** — repeated verbatim on every row for zero new information (8.5% of the table).
- **`type` column: always constant within a section by construction**, already stated once via the `## <type> (<count>)` header immediately above (folded into the same fix).
- **The `id` column: 35.2% of the table**, itself a pipe-delimited concatenation duplicating data already present in other columns on the same row — but it's the real, load-bearing citation identity, not deletable outright.

**Fix 1 (shipped)**: `factsToCompactTable` now dynamically detects columns that are 100% constant across the input facts and hoists them into a one-line preamble instead of repeating them per row; `type` is always dropped from per-row columns (redundant with its section header by construction). Backward compatible — every existing caller (`capability-synthesis.ts`'s live production path included) gets a smaller table automatically, with zero signature change and zero risk if a future caller ever combines facts across modules/runs (in that case nothing is hoisted, today's exact behavior is preserved). Real measured result on `organization`'s full fact set: **10.9% reduction** (2,116,707 → 1,886,171 chars).

**Fix 2 (shipped, additive/opt-in only — NOT wired into the live production path)**: new `factsToCompactTableShortIds()` replaces the verbose `id` column with a short, per-table-only sequential reference (`F1`, `F2`, ...); the model cites that instead. New `restoreFactIdCitations()` deterministically substitutes short references back to the real, full fact ID immediately after the LLM response returns — before anything is persisted — reproducing the exact nested-backtick citation convention (`` `` `realId` `` ``) this pipeline already uses everywhere else, so `citation-validator.ts` and every other downstream consumer sees real fact IDs exactly as they always have. The short reference never survives past one prompt/response round-trip and is never persisted on its own. Real measured result: additional **38.6% reduction** on top of Fix 1 (1,886,171 → 1,158,265 chars) — **45.3% total reduction in the fact table** from the original.

Explicitly scoped as separate from — and not to be confused with — any future fact-to-workflow indexing need (a durable, stable identity requirement, which the real fact ID `id` field already satisfies and this change never touches).

## Real end-to-end verification, both fixes combined

Re-ran the full module-level test against `organization` with the optimized encoding (contract updated to instruct citing via the short-reference format).

- **Real input tokens: 382,253** — down from 659,011 in the encoding-unoptimized version, and down from the original per-capability architecture's ~1.21M tokens for the same module. **A ~68% total reduction**, independent of any caching.
- **A real bug found and fixed during verification**: the initial citation-restoration regex assumed no spacing and no nested backticks; the model's actual output used this pipeline's real, standard nested convention (`` `` `F123` `` ``, CommonMark-mandated spacing around content that itself uses backticks) — the same format every prior real capability/reduce output already uses. The regex silently matched zero citations until corrected.
- **After the fix: all 210 real citations the model wrote were found, correctly restored to real fact IDs, and verified — 210/210, 0 file-not-found.**

## Real test 3 — caching wired into the module-level approach, sample across 5 more modules

Added the same `CACHE_BREAKPOINT_MARKER` split (stable = contract + grounding docs; variable = everything module-specific) to `EXPERIMENTAL-module-level-test.ts`, reusing the already-verified `getOrCreateCache`/`callGemini` wiring from the production caching work (item 18) unchanged. Ran real calls against 5 modules spanning the full size range: `tasks` (70 facts, smallest), `apps` (471), `admin` (1,349), `building` (2,498), `user` (2,990, second-largest) — alongside `organization` (3,155, largest) already validated without caching.

**Caching result: `cacheReadInputTokens: 42,480` — identical across all 5 different modules.** Confirms the cache was created once (on `tasks`, the first call) and correctly reused across 4 subsequent, fully separate processes for entirely different modules — exactly the intended cross-process, cross-module reuse.

**Quality/citation result across the whole 5-module sample**: 359 total citations checked, 359 verified, 0 fabricated. No section-collapse (the large-module failure mode found during the reduce-step investigation) on any of the 5 — spot-checked `building` and `user`'s module-wide sections directly (Executive Summary through Cross-Cutting Risks all in the 490-3,850 char range, all comfortably real content, all 11 capabilities present in both). One real transient retry on `building` ("This operation was aborted"), recovered automatically by the existing retry wrapper — same class of transient infra issue seen elsewhere this session, not a new problem.

**Real input tokens by module** (module-level + optimized encoding + caching, all combined): `tasks` 49,945; `apps` 79,652; `admin` 191,542; `building` 309,464; `user` 320,606. Scales sensibly with real fact count in every case, no anomalies.

This is now validated across 6 of 12 Firebase modules, spanning the full size range from smallest to largest, with consistent results throughout: no quality collapse, no fabricated citations, and caching behaving exactly as designed.

## What this does NOT yet answer

- Batching/splitting strategy for a module (or future repo) too large for one call, even with these reductions — explicitly deferred, not designed here.
- Whether this holds up across other modules (only `organization`, the largest and most complex, has been tested) or across repeated runs (self-consistency not yet measured for this architecture).
- Whether/how to port this to the live production capability-synthesis path — both fixes exist only in `run-utils.ts` (Fix 1 live, Fix 2 additive-only) and the experimental contract/script, not wired into `01a`/`01c`/`01d` or `config/repos.json`.
- Interaction with caching once a real architecture decision is made — the caching-relevance finding above suggests caching's priority drops substantially if module-level consolidation is adopted.
