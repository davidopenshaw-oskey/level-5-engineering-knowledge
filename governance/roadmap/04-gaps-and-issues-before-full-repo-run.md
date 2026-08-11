# Gaps & Issues Not Yet Reconciled — Before the Full Repo Run

**Status:** Living catalogue, not a plan. Companion to `04-complete-repo-run-and-repo-reports-plan.md` — each item below maps to a stage in that plan, referenced inline.
**Created:** 2026-08-11

*Purpose: a single honest list of everything currently known to be unresolved, inconsistent, or unverified in the pipeline, so nothing gets carried silently into a full repo-wide run — the same discipline that caught the `firestore_trigger` collision and the heading-level bug during Plan 03, applied proactively instead of after the fact this time.*

---

## Cross-provider gaps

**1. ~~`CACHE_BREAKPOINT_MARKER` is not stripped for non-Anthropic providers.~~ RESOLVED 2026-08-11.**
`callGemini` and `callOpenAI` (`_shared/llm-adapter.ts`) now strip the marker before sending the prompt. This is a safe no-op fix, not a caching implementation for those providers — item 3 below (Vertex AI's own caching mechanics) is still open.

**2. Gemini's actual format compliance with the current capability-synthesis/reduce contracts is unverified.** Every real, verified output so far (heading-level fix included) has come from Claude. Whether Gemini follows the same numbered-section contract closely enough for the assembly-first split (`splitNumberedSections()`) to work unmodified is unknown until tested. → Plan 04 Stage 6.

**3. Gemini/Vertex AI's own context-caching mechanics are unresearched.** Unknown whether Vertex AI has an equivalent to Anthropic's inline `cache_control` ephemeral blocks, and if so, whether its cache-hit semantics (TTL, minimum prefix size, cost model) resemble Anthropic's closely enough to reuse the same stable/variable prompt-splitting pattern, or need a different design entirely. → Plan 04 Stage 1.

**14. (New, resolved 2026-08-11) The 2026-08-01 `gemini-3.6-flash` 404 was a region gap, and there's a second, sharper distinction underneath it: catalog visibility ≠ generation entitlement.** `config/llm-providers.json`'s `gemini-default` had been pinned to `europe-west1`, which on this project only serves the Gemini 2.5 generation. `ai.models.list()`/`.get()` (free metadata calls) showed `gemini-3.5-flash`/`gemini-3.6-flash` as catalog-visible in BOTH `us-central1` and `global` — but a real `generateContent` call against `us-central1` still 404'd with the same "not found or your project does not have access to it" message, while the identical call against `global` succeeded. So `.get()`/`.list()` returning a model is not proof it can actually be generated against in that specific region — always verify with a real (small) `generateContent` call before trusting a region for a new model. `global` is confirmed working end-to-end: ran the full `01a`+`01c` path for real against `gemini-3.5-flash` on module `tasks` (~53.6K+1.5K then ~49.3K+1.3K input/output tokens across the two calls), written to `output/runs/.../llm-comparison/gemini-default/tasks/` so it never touched the canonical Claude output. `gemini-default` is now `gemini-3.5-flash` / `global`. Note: pro-tier hasn't reached 3.5/3.6 on this project at all yet (`gemini-3.1-pro-preview` is the newest pro, still preview) — only flash has 3.5/3.6.

**15. (New, surfaced by item 14's real comparison run) Neither Claude nor Gemini produced machine-checkable citations for the `tasks` module, but for different reasons worth distinguishing.** Both `tasks-engineering-profile.md.provenance.json` files (Claude and Gemini) show `citationSummary.total: 0`. Claude's prose DOES reference specific evidence (e.g. "evidence: call_expression facts at task_handler.service.ts lines 38–49") but not in the exact backtick-quoted-file + "(lines N-M)" parenthetical format `validateCitations()` requires — so it doesn't count as a machine-verified citation despite being a real, honest evidence reference. Gemini's prose doesn't attempt file/line evidence references at all, relying on `[Confirmed]`/`[Inferred]`/`[Unknown]` tags alone. Confirms item 13's suspicion: this is a contract-instruction clarity gap (the citation format isn't explicit/salient enough in the current contract), not a single-provider quirk — worth fixing the contract's citation instruction before the full-repo run, since right now the provenance sidecar's citation layer is real but empty for every module tested so far.

**16. (New, surfaced by item 14's real comparison run) Structural compliance was perfect for Gemini; content depth was noticeably shallower than Claude's for the same module.** Gemini 3.5 Flash matched every contract section number/title exactly (0-14, including the "7-8" combined section) and used confidence tagging correctly throughout — no parse failures, no missing sections. Content-wise it stayed at a higher level of abstraction than Claude's output for the same facts: it didn't enumerate the task-payload model fields, didn't quote the exact response-code/log-message strings Claude quoted verbatim, and its architectural-observations/risks sections were shorter and less specific. Not evidence of a broken pipeline (all facts it referenced check out against the evidence) — a real, first-look quality signal worth tracking across more modules before drawing a conclusion, per Plan 04 Stage 6.

## Pipeline consistency gaps

**4. ~~Two divergent code paths produce module profiles depending on module size.~~ RESOLVED 2026-08-11.**
Decided and implemented: every module, regardless of size, now goes through `01a-generate-capability-syntheses.ts` + `01c-generate-assembly-first-profile.ts`. `00-generate-module-profile.ts`'s separate single-call path is retired for new work (its own header comment says so). This was possible because `05-partition-capability-packs.ts` already guarantees at least one capability pack for any module with at least one fact.

**5. ~~Older scripts (`00`, `01`, `01b-rerun-reduce-only.ts`) have no explicit retire/keep decision.~~ RESOLVED 2026-08-11.**
`00` and `01`'s Stage B reduce call are retired for new work but kept in the repo as historical/comparison baselines, not deleted. `01`'s Stage A loop is still valid and now shares logic with `01a` via the new `_shared/capability-synthesis.ts`. `01c` is promoted to the standard path, writing to the canonical `knowledge-corpus/` location. `01b-rerun-reduce-only.ts` is kept as-is — still the intended tool for Stage 6's cross-provider comparison.

## Traceability gaps

**6. ~~The provenance sidecar has never been exercised by an actual pipeline run.~~ RESOLVED 2026-08-11.** Ran `01a` + `01c` for real against the `tasks` module (2 real Anthropic calls, approved before spending). Both sidecars were written by `01c` itself at the canonical `knowledge-corpus/` path and are well-formed. → Plan 04 Stage 1.

**13. (New, surfaced by item 6's verification run) Citation-format compliance is not guaranteed for every module.** The `tasks` module's real LLM output used neither citation format `validateCitations()` recognizes (backtick file path + line-range parenthetical, or pipe-delimited fact ID) — its `citationSummary` correctly came back all-zero, which is the validator behaving correctly (no false-positive "verified" claims), but means this module's profile currently has zero machine-checkable citations. Worth watching across the full-repo run (Stage 3): if this recurs on several modules, it may indicate the capability-synthesis contract's citation instruction needs to be more explicit for modules with sparse-enough evidence that the LLM doesn't feel the need to cite. Not a blocker, just a real-data observation.

**7. Decision A2 (the full persistent knowledge model — Signals, EvidenceSets, Conflicts, Reviews, lineage, multi-dimensional assurance) remains open**, deliberately re-gated on a conversation with the tech team about their RAG/EmbeddingGemma retrieval layer's actual scope (versioning, staleness handling, conflict handling) rather than parked indefinitely. That conversation has not happened. This is organizational, not technical, and sits outside Plan 04's scope — but is listed here so it isn't mistaken for resolved. → not in Plan 04; tracked separately per `03-token-economics-remediation-plan.md`.

## Repo-level design gaps

**8. No repo-level reduce script exists at all.** Only a design sketch exists (architecture brief Section 3.3). This is the single largest concrete gap against the originally-envisioned three-part pipeline. → Plan 04 Stage 4.

**9. The evidence scope for repo-level citation validation is undecided.** `validateCitations()` currently always checks claims against one module's evidence-graph facts. A repo-level report's claims could reference any module's facts — needs an explicit decision (most likely: concatenate every module's evidence-graph facts into one repo-wide array) before the repo-level reduce can validate its own citations. → Plan 04 Stage 4.

**10. No real cost model exists yet for the full-repo run.** The only real, measured numbers are for `building`. `organization` (13 submodules) and `user` (10 submodules) are structurally larger and plausibly comparable-or-more-expensive; nothing has been measured for them yet, so any total-repo figure right now would be an unverified projection. → Plan 04 Stage 2 (and Stage 2 explicitly requires converting the projection into real measured numbers once Stage 3 actually runs, not stopping at the projection).

**11. Whether a repo-wide consolidated API/interface catalog is in scope is undecided.** Right now there are 11 separate per-module API references and nothing tying them together repo-wide. Could be built as part of the repo-level reduce, or explicitly deferred — currently neither has been decided. → Plan 04 Stage 4.

**12. Whether `01c`'s (or any successor's) output should be promoted to the `knowledge-corpus/` "official" location is undecided.** That directory currently holds only two stale, pre-Plan-03 runs, so the corpus's canonical location is itself out of date relative to the actual best available output on disk. → not yet scheduled in Plan 04; worth resolving alongside Stage 5.

---

## How to use this document

Treat each numbered item as closed only when the corresponding plan stage's checkbox is checked AND the resolution is recorded here (not just in the plan). Update this file directly rather than letting resolved items silently disappear — the point is a durable record of what was actually reconciled and when, not just a todo list.
