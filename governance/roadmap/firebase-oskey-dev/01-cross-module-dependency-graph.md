# Implementation Plan 01 — Cross-Module Dependency Graph

**Status:** 🔶 Stages 1-3 done + verified 2026-08-02. Stage 4 code-complete, type-checked, NOT live-tested. Stage 5 not started -- holding for user to confirm which LLM/when before any run (see governance/roadmap/tasks.md and the standing "ask before LLM run" rule).
**Created:** 2026-08-02

*Second plan under the numbered-plan-file convention (see `00-capability-based-module-synthesis.md`). Work through one item at a time; check items off as `[x]` only once actually done and verified against a real run.*

---

## Why this exists

Trimming `OSkey Backend Services & Data Architecture.md` down to concepts/patterns (see the doc-consolidation work in progress) removes its per-collection "Read By"/"Written By" callouts. Most of that was redundant with what P2 already derives from evidence — but a subset of it was the *only* source of cross-module inbound-coupling information: P2 runs one module at a time, so a module's own evidence pack can only see its own **outbound** imports, never who from *other* modules calls into it.

This is already visible as a real quality gap in the `building` runs: both the Claude and Gemini profiles had to mark inbound relationships (e.g. `organization`/`user`/`call` depending on `building`) as **Inferred**, sourced from architectural-document guessing rather than direct evidence — because no better source existed. This is the exact same problem the capability-pack reduce step already solved *within* one module (the `@oskey/building/door` intra-module coupling fix) — just one level up, at the cross-module/repo-wide level.

The fix doesn't need an LLM. P1 already extracts `imports_dependency` facts for every module in one pass, before P2 ever runs. A deterministic script can invert/aggregate those facts repo-wide into a per-module inbound+outbound view — always fresh (recomputed every run from the same facts), zero staleness risk, unlike a hand-maintained doc.

**Explicitly a different scope from the existing capability-pack reduce step**: that solves intra-module (submodule-to-submodule) coupling. This solves inter-module (module-to-module) coupling, repo-wide. Not a replacement for either existing mechanism — a new layer alongside them.

---

## Task List

### Stage 1 — Design the artifact shape (Q&A checkpoint) — ✅ DONE 2026-08-02
- [x] **Refined during implementation**: target-module resolution happens at P1 *extraction* time (`01-extract-ast-evidence.ts`), not by string-matching import paths in the new script. Reuses ts-morph's own compiler resolution (`imp.getModuleSpecifierSourceFile()` — correctly resolves both relative imports and `@oskey/*` tsconfig path aliases, since the ts-morph `Project` is already initialized with the real tsconfig) plus `files.json`'s already-authoritative file→module classification. New fields on the raw import record and the `imports_dependency` fact (promoted top-level, not just nested in `evidence`, same reasoning as `submodule`): `resolvedTargetModule`, `resolvedTargetSubmodule`, `importResolutionStatus` (`resolved_in_repo` / `resolved_outside_module_boundary` / `unresolved_by_compiler`). This is more robust than string-matching and required no new parsing logic in the aggregation script itself.
- [x] Schema: per module, `{ outbound: [{targetModule, touchpoints: [{file, line, importPath, namedImports}]}], inbound: [{sourceModule, touchpoints: [...]}] }`. Only `resolved_in_repo` facts with a target module different from the source are included — self-module (intra-module) facts are excluded, matching the "different scope from the capability-pack reduce step" note above.
- [x] Written to `output/runs/<repo>/<runId>/knowledge-pipeline/modules/<module>/cross-module-dependencies.json`.
- [x] New script: `06-build-cross-module-dependency-graph.ts`, run after `05-partition-capability-packs.ts`, wired into `pipeline:firebase`.

### Stage 2 — Build the script — ✅ DONE 2026-08-02
- [x] Reads every module's own evidence graph (repo-wide pass, same file `05` already reads — confirmed `04-build-resolved-graph.ts` writes to a *separate* file and does not touch/drop fields on each module's own `<module>-evidence-graph.json`).
- [x] Aggregates + inverts resolved `imports_dependency` facts into the Stage 1 schema.
- [x] Writes one artifact per module, wired into the `pipeline:firebase` npm chain.
- [x] Standard fail-closed/notification boilerplate, matching every other P1 script. Type-checks clean.

### Stage 3 — Verify against a real run — ✅ DONE 2026-08-02
- [x] Re-ran the full `pipeline:firebase` chain end-to-end (exit 0, only pre-existing unrelated warning: `UNRESOLVED_CALLS_WARNING` from `04`, nothing new). Both relative-path and `@oskey/*`-alias imports resolve correctly with real file/line/namedImports evidence (spot-checked `building`'s outbound list against `access_control_device` and `core`).
- [x] **Confirmed the actual gap is closed**: `building`'s inbound list now shows 8 real, evidenced dependent modules (`access_control_device`, `admin`, `call`, `core`, `organization`, `supplier`, `unit_management`, `user`) — including exactly the three (`organization`, `user`, `call`) that both the Claude and Gemini `building` profiles could only mark **Inferred** from architectural-document guessing. This can now be reported as **Confirmed** with real citations once wired into P2 (Stage 4).

### Stage 4 — Wire into P2 consumption — 🔶 CODE DONE 2026-08-02, NOT LIVE-TESTED
- [x] Added the artifact as a new prompt section in `00-generate-module-profile.ts` (module-level flow, direct).
- [x] Added it to `01-generate-capability-based-profile.ts`, but **only to the reduce step**, not each of the N capability calls — deliberate: the graph is module-scoped, not submodule-scoped, so it doesn't map onto individual capability packs, and resending it N times would be pure repeated cost for zero benefit. The reduce step is the one place already doing whole-module synthesis.
- [x] Updated `module-engineering-profile-task-instructions.md` §10 (Cross-Module Relationships): inbound/outbound relationships from this graph are now **Confirmed**, with an explicit fallback (tagged Inferred) preserved for older runs / repos where this graph doesn't exist yet.
- [x] Updated `contracts/01-module-synthesis-reduce.md`: added the graph as a fourth input, with an explicit note that this is the one case where the reduce step is allowed to *upgrade* a capability output's Inferred tag to Confirmed (real evidence arriving, not invented confidence).
- [x] Type-checks clean.
- [ ] Not yet run — holding per the user's standing rule to confirm LLM provider before any run that spends money.

### Stage 5 — Live re-test
- [ ] Re-run `building` end-to-end (module-level and/or capability-based flow) once a provider is confirmed, and verify inbound relationships that were previously Inferred (`organization`, `user`, `call`) are now Confirmed, with real evidence, in the resulting profile.

---

## Explicitly not deciding yet
- Whether this generalizes to a cross-*repo* version once Phase 3 (cross-repo synthesis) is designed — same principle, bigger scope, separate plan.
- Whether the artifact should also surface at the capability/submodule level, not just module level — start at module level since that's the concrete gap found; revisit only if it turns out insufficient.
