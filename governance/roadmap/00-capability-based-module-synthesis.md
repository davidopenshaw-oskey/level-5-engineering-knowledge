# Implementation Plan 00 — Capability-Based Module Synthesis

**Status:** Not started
**Created:** 2026-08-01

*This is the first plan under this new convention: when we surface and design something non-trivial, it gets its own numbered file here (`NN-name.md`) with a concrete task list, worked through one item at a time. If we get distracted mid-work, come back to this file — it's the source of truth for this piece of work, not the conversation. Check items off as `[x]` as they're actually done and verified, not just attempted.*

---

## Why this exists

Two things surfaced together while discussing how to fix the `building` context-window overflow (see `tasks.md` checkpoints and `governance/adrs/adr-003.md`):

1. **A real bug**: `submodule` is correctly computed in `00-scan-repo.ts` and present in `files.json`, but silently dropped by `02-build-module-evidence.ts` when it builds the final evidence graph — every fact in the graph currently has `submodule: null`.
2. **A real design opportunity**: `submodule` is close to a free, deterministic "capability" partition key. Reconstructed manually from `files.json` against `building`'s real evidence graph, it splits cleanly into 11 packs (10 submodules + module root), largest being 450 facts / 710 KB — about 1/6th the size of the full 4.19MB graph, comfortably within any provider's context window even before any CSV/de-duplication work. Combined with the CSV re-encoding already measured (~2.55x), the largest pack would be roughly 70,000 tokens.

Proposed new Phase 2 shape (from the user, not yet built):

```
Module Evidence Graph
        ↓
Deterministic capability partitioning
        ↓
Capability evidence packs
        ↓
Capability synthesis (one LLM call per pack)
        ↓
Module synthesis (reduce: profile built from capability outputs, not raw evidence)
```

The full evidence graph stops being prompt input and becomes a queryable database — consulted for verification/evidence-reference lookups, not pasted wholesale into any single call.

**Known design risk, not a blocker:** cross-capability relationships (e.g. the `@oskey/building/door` intra-module coupling finding already patched into the instructions doc) need explicit handling — each pack naturally sees its own *outbound* coupling already (imports are recorded at the importing file), so the fix is telling the per-capability prompt to report that explicitly, and having the module-synthesis reduce step aggregate mentions across packs, rather than relying on one global pass over the whole graph.

---

## Task List

### Stage 1 — Fix the missing data (small, standalone, do first regardless of anything else)
- [ ] Add `submodule` to every per-category field mapping in `02-build-module-evidence.ts` (mirrors how `module`/`file`/`line` are already carried through from raw facts).
- [ ] Re-run the full P1 pipeline (`npm run pipeline:firebase`) and confirm `submodule` is now populated on real facts (spot-check `building_door`, `building_settings`, etc. against `files.json`).
- [ ] Confirm the 11-pack breakdown for `building` matches (or explain any difference from) the manually-reconstructed preview in this plan's "Why this exists" section above.

### Stage 2 — Build the capability-pack extraction step
- [ ] Decide: new standalone script (e.g. `05-partition-capability-packs.ts`, phase-01 or phase-02?) vs. a function called from within `00-generate-module-profile.ts`. Leaning: standalone script, since packs are a Phase 1.75-ish deterministic derivative of the evidence graph, not an LLM-facing concern themselves.
- [ ] Implement: group a module's facts by `submodule`, with facts carrying no `submodule` (module-root/foundational code) forming their own pack.
- [ ] Decide what to name the module-root pack (candidate: `_core` or `_foundational`, avoiding collision with any real submodule name).
- [ ] Write each pack to its own file (e.g. `output/.../modules/<module>/capability-packs/<submodule>.json`).

### Stage 3 — Compact re-encoding for prompt use (complementary, from the earlier CSV/TSV discussion)
- [ ] Build a shared `factsToCompactTable(facts)` utility: per-type CSV/TSV-style tables (header row once, then values), dropping the duplicated nested `evidence` blob — reusable both for capability packs and any other prompt-facing evidence slice.
- [ ] Verify token/byte reduction empirically against at least one real pack (not just the earlier whole-graph measurement) before relying on it.

### Stage 4 — Capability synthesis prompt
- [ ] Write the contract for what a capability-level synthesis call produces (scoped mini-profile: responsibilities, evidence, confidence tags, its own outbound/inbound coupling mentions). Decide: new file, or a new section in the existing `module-engineering-profile-task-instructions.md`?
- [ ] Migrate the Section 5 intra-module-coupling instruction (and the Pub/Sub §11 guidance, if applicable per-capability) down to this capability-level prompt, since that's now the right altitude for it.

### Stage 5 — Module synthesis (reduce) prompt
- [ ] Write the contract for the final module-synthesis call: takes N capability outputs (not raw facts) plus whatever genuinely module-wide inputs remain necessary (e.g. RBAC cross-check, Executive Summary/Architectural Position framing) and produces the existing 14-section profile + API reference.
- [ ] Decide how Section 14 (Evidence References) gets its fact-ID/file:line citations if the reduce step never sees raw facts directly — likely a deterministic post-processing lookup against the stored evidence graph (the "queryable database" role), not something the LLM fabricates from memory of the capability summaries.

### Stage 6 — Wire it into the orchestrator
- [ ] Modify (or replace) `00-generate-module-profile.ts`'s flow: partition → fan out capability calls → reduce call → write profile + API reference, same output location (`knowledge-corpus/<repo>/<runId>/...`) as already built.
- [ ] Decide fan-out strategy: sequential or parallel capability calls (parallel is faster; sequential is simpler to debug first time through — lean sequential for the first working version).

### Stage 7 — Live test and validate
- [ ] Run end-to-end against `building` (the module already blocked on this) and confirm no context-window errors.
- [ ] Spot-check output quality against the original hand-written `building-engineering-profile.md` — does capability-based synthesis preserve or lose the door-coupling finding, the Pub/Sub routing detail, etc.?
- [ ] Update `tasks.md`'s checkpoint and HANDOVER items 3/4 status based on the result.

---

## Explicitly not deciding yet (deferred, don't relitigate mid-implementation)
- Whether this becomes the *only* way module profiles are generated, or an alternative path alongside the existing single-shot generator.
- Generalization to modules with little/no submodule structure (expected to just yield fewer packs — not a special case to design for up front, confirm this holds once we see a flatter module).
- Repo-level/cross-repo synthesis (Phases 3+) — this plan is module-level only.
