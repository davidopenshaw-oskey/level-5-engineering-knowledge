# Session hand-off — dynamic pipeline architecture initiative, 2026-09-18

Written at a deliberate, clean phase boundary — the prior session had just closed out ADR-010 (fact_id → fact_ref surrogate key) completely: built, tested, verified, and documented. This is a genuinely new, separate initiative, discovered as a direct side effect of that work's own final test (the 1a multi-repo run), not a continuation of it. Two other Claude sessions that had been coordinating on ADR-010 were closed before this hand-off was written — nothing carries over from them except what's in the files below.

## Read in this order

1. **`01-findings-hardcoded-repo-names-and-missing-integration-kinds-2026-09-18.md`** (this folder) — the real, two-layer finding. Read this first, it's the whole basis for everything else here: (Layer 1) `pipeline/facts-postgres-index/build-cross-repo-edges.ts` and `build-form-field-lineage-edges.ts` hardcode specific repo names directly into SQL and insert logic, a real violation of this project's standing "always dynamic, never hardcoded" principle; (Layer 2) Swift/Kotlin extraction has never been taught to recognize an outbound Cloud/API integration call as its own fact kind at all, confirmed against live Postgres — so even a perfectly generalized Layer 1 fix produces zero new real iOS/Android edges today.
2. **`graphrag/15-1a-multirepo-first-run-findings-2026-09-17.md`** — the real test that surfaced this (a business request explicitly naming the iOS app pulled zero iOS evidence; the model handled the gap honestly via `[NEEDS CLARIFICATION]`, not by fabricating).
3. **`governance/adrs/adr-010.md`** — only if work in this new initiative ever needs to touch `mcp-server/` or the `fact_ref` mechanism (it shouldn't; this initiative is scoped to the P1/P2 pipeline layer, not retrieval/generation). Mentioned for completeness, not because it's expected to be load-bearing here.

## Real, live decision already made (don't re-litigate)

Fix both layers, in parallel, via two separate sessions — the user's explicit call, given the severity of finding hardcoded repo-name logic baked into what's supposed to be a generic pipeline. The two layers are genuinely independent:

- **`prompts/prompt-1-generalize-cross-repo-edge-builders.md`** — Layer 1. A same-day, scoped refactor. `build-intra-repo-edges.ts` in the same directory already solves an equivalent problem correctly (takes `REPO_NAME` from an env var, discovers what it needs from the data) — real, working reference pattern already proven in this codebase, not a new design.
- **`prompts/prompt-2-swift-kotlin-integration-call-extraction.md`** — Layer 2. Investigation first, not a build — nobody has yet read the real Swift/Kotlin source to determine what an outbound Cloud/API call even looks like structurally in either language. Do not let this session jump straight to writing extraction code.

**Correction (2026-09-18, caught by the user before either session started, not self-caught): these are not fully independent — sequence them.** Layer 1's fix can only be verified as "didn't break the existing Angular/Firebase edges" without a second real fact kind to test the generalization against — it can look generic without ever being proven generic. Start Layer 2 first. Once Layer 2's *investigation* (not necessarily its full build) has a real, concrete answer for what the new fact kind(s) would look like, hand that to Layer 1's session before it starts writing its "discover repos/kinds dynamically" logic — so it has a real second target to validate against, not just the one existing Angular/Firebase case. Layer 1 does not need to wait for Layer 2's extraction code to actually exist and populate Postgres — just for Layer 2's proposed fact-kind shape to be known.

## Standing rules, still apply

- Never `git add`/`git commit` — only the user commits. (Already true of everything referenced above; nothing here has been committed.)
- Flag real spend (LLM calls, if Layer 2's investigation needs to re-run any extraction) before incurring it, every time — small spend is fine once flagged, don't design around avoiding it.
- Verify claims against live Postgres or the real source files before writing them down as fact — this whole finding only became trustworthy because it was checked directly (a live `GROUP BY repo, kind` query, not inferred from an older doc). Both prompts explicitly ask for the same discipline.
- Keep this initiative's docs in `governance/roadmap/dynamic-pipeline-architecture/`, numbered sequentially — `01-` is taken (findings), each prompt names its own real output path (`02-...` for Layer 1, `03-...` for Layer 2). Check the folder for the real next number before adding anything else.
- This is a distinct initiative from the `graphrag/` fact_id/capability-fanout thread — don't merge documentation into that folder; it's a different real problem, even though one test from that thread is what surfaced this one.

## Not in scope here, don't get pulled into it

- `citation-validator.ts`'s own citation-abbreviation mechanism (phase-02, deliberately kept per `project_phase02_reports_preserved` memory) — unrelated, already tracked as its own future TODO.
- The two ADR-010 defensive additions that have never fired in practice (near-miss reverse-lookup, `warnIfNotFactRef`) — already logged in `graphrag/14-...md`, not this initiative's concern.
- The broader "consolidate the 3 TS pipelines into one" idea and "add the Android mobile app" idea from the post-freeze roadmap discussion — related in spirit (same root principle: stop hardcoding per-repo scripts), but not the same scoped task. Don't expand this initiative to cover them without a real, separate decision first.
