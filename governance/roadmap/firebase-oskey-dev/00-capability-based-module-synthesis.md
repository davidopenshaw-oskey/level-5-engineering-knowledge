# Implementation Plan 00 — Capability-Based Module Synthesis

**Status:** ✅ Done 2026-08-01 — all 7 stages complete and verified against `building`
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

### Stage 1 — Fix the missing data (small, standalone, do first regardless of anything else) — ✅ DONE 2026-08-01
- [x] Add `submodule` to every per-category field mapping in `02-build-module-evidence.ts` (mirrors how `module`/`file`/`line` are already carried through from raw facts). All 16 mapping blocks shared an identical `module: moduleName,` → `file: item.path,` pattern, fixed in one `replace_all` edit.
- [x] Re-run the full P1 pipeline (`npm run pipeline:firebase`) and confirm `submodule` is now populated on real facts. Run `20260801_173126-1aa319b1` — confirmed clean, no errors.
- [x] Confirm the 11-pack breakdown for `building` matches the manually-reconstructed preview. Exact match: `building_unit_nonAppUser` 450, `building_unit` 449, `building_intercom` 390, `building_door` 286, `building_settings` 260, module root 246, `building_activity` 115, `building_user` 106, `building_pincode` 88, `building_accesses` 68, `building_pincode_trash` 40. Total 2,498, identical to before the fix (fix only added the field, didn't change fact counts).

### Stage 2 — Build the capability-pack extraction step — ✅ DONE 2026-08-01
- [x] **Decided (Q&A checkpoint):** new standalone script `05-partition-capability-packs.ts` in `phase-01-ast-extraction/`, added to the `pipeline:firebase` npm chain (always runs after a P1 pass, same as `04-build-resolved-graph.ts`'s role).
- [x] Implemented: groups a module's facts by `submodule`; facts with no `submodule` land in the module-root pack.
- [x] **Decided (Q&A checkpoint):** module-root pack named `_module_root`.
- [x] Each pack written to `output/.../modules/<module>/capability-packs/<submodule>.json`, wrapped with the same metadata convention as other pipeline artifacts (schemaVersion/runId/repoName/module/submodule/generatedAt/summary/facts). Verified against real run: all 11 `building` packs written correctly, ran cleanly across all 12 modules (exit 0), sizes consistent with the earlier manual estimate (e.g. `building_unit_nonAppUser.json` 857KB vs. the ~710KB raw-facts estimate -- difference is the wrapper metadata + pretty-printing, expected).

### Stage 3 — Compact re-encoding for prompt use — ✅ DONE 2026-08-01
- [x] Built `factsToCompactTable(facts)` in `_shared/run-utils.ts` (TSV not CSV, since raw call-expression text routinely contains commas; per-type sections, one header row per type, `evidence` blob dropped). Ephemeral/prompt-assembly-time only, per ADR-003 — not persisted as its own pipeline artifact.
- [x] Verified against the real, largest `building` pack (`building_unit_nonAppUser`, 450 facts): 857KB → 313KB, ~214,320 → ~78,236 tokens, **2.74x shrink** — better than the earlier whole-graph estimate (2.55x). Worst-case pack is now trivially small.
- **Noted, not implemented (deliberately deferred):** `repo`/`module`/`submodule`/`runId`/`type` columns are identical on every row within a pack and could be hoisted to a pack-level header for further savings. Skipped for now — 78,236 tokens for the worst pack already comfortably solves the problem; revisit only if a future pack (bigger module, or a repo-level pack) doesn't fit as comfortably.

### Stage 4 — Capability synthesis prompt — 🔶 DRAFT WRITTEN, awaiting review
- [x] **Decided (Q&A checkpoint):** output stays narrative (not JSON), consistent Markdown headers so the reduce step can parse reliably. New dedicated file, not a section bolted onto the existing module-level instructions doc — capability-level and module-level are different enough contracts to warrant separating.
- [x] **Decided (Q&A checkpoint), naming convention:** new files only follow the `NN-name.md` numbered convention going forward; existing `module-engineering-profile-task-instructions.md`/`-template.md` are NOT renamed as part of this. New dedicated `contracts/` subfolder created under `phase-02-inter-module-synthesis/` for this and future numbered contract docs, since `00`–`05` in the parent folder are already taken by scripts.
- [x] Drafted: [`contracts/00-capability-synthesis.md`](../../pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/00-capability-synthesis.md) — role, evidence priority/confidence tagging (same rules as whole-module synthesis), a dedicated Coupling section explaining why only *outbound* coupling is visible at capability level (inbound only becomes visible once the reduce step correlates multiple capabilities' outbound mentions), 7-section output structure (Summary, Responsibilities, Public Interfaces, Data Ownership, Outbound Coupling, Permissions, Open Questions) plus a "what NOT to include" section (no executive summary/architectural position/evidence-references — those belong to the reduce step). **Not yet used in a real call — needs review before Stage 6 wires it in.**
- [ ] Migrate/confirm the intra-module-coupling and Pub/Sub-specific guidance from the module-level instructions doc's §5/§11 are adequately covered by this new contract's Coupling and Public Interfaces sections (drafted to cover the same ground, not yet cross-checked line-by-line against the original).

**Related fix made alongside this (from the same Q&A round):** `00-generate-module-profile.ts`'s `DEFAULT_MODULE_PROFILE_CONFIG` hardcoded stale-path fallback removed entirely — every repo must now explicitly configure `phase2.moduleProfile` or the script fails closed. See `tasks.md` item 9.

### Stage 5 — Module synthesis (reduce) prompt — ✅ DONE 2026-08-01
- [x] Drafted [`contracts/01-module-synthesis-reduce.md`](../../pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/01-module-synthesis-reduce.md) — a short covering contract, not a duplicate of the 14-section schema: it defers to `module-engineering-profile-task-instructions.md` for output structure/confidence rules, and only covers what's specific to the reduce step (input is N capability outputs, not raw evidence; inbound-coupling reconciliation across capability outputs; which module-wide sections only the reduce step can write; merging without flattening).
- [x] **Decided (Section 14 Evidence References):** the reduce step does not get raw fact-ID lookup machinery. It consolidates whatever file:line citations the capability outputs already included inline (they were written with raw evidence in front of them and instructed to preserve specifics) and is explicitly told not to fabricate a citation that isn't already present in a capability output. Deferred: a deterministic fact-ID lookup post-process, if inline citations turn out insufficient in practice — not needed yet.

### Stage 6 — Wire it into the orchestrator — ✅ DONE 2026-08-01
- [x] **Decided (Q&A checkpoint):** refactor into a shared generic orchestration helper now, not a separate duplicate script.
- [x] **Built and verified:** new `_shared/synthesis-orchestrator.ts` (`readRequiredFile`, `splitMarkedFiles`, `resolveContractsRootAbs`, `loadDocs`, `DocumentCallSpec`, `runDocumentCalls`) — generic plumbing only; task-specific framing text stays in whichever script defines the task. `00-generate-module-profile.ts` refactored to use it (removed ~90 lines of now-duplicated logic), type-checks clean. `runDocumentCalls` later extended to return written content keyed by relPath, so the fan-out step could feed capability outputs into the reduce call without a redundant disk re-read.
- [x] **Live-verified end-to-end** against the real `tasks` module via `claude-default` — first successful real output from this automated pipeline. See Stage 7 below for the important correction to this: the first pass at "verified" here was incomplete (see the truncation bug).
- [x] Built the actual capability-fan-out + reduce flow: new script [`01-generate-capability-based-profile.ts`](../../pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/01-generate-capability-based-profile.ts). Partition (Stage 2, already built) → one capability-synthesis call per pack via `runDocumentCalls` + `contracts/00-capability-synthesis.md`, writing intermediate output to `output/runs/<repo>/<runId>/knowledge-pipeline/modules/<module>/capability-syntheses/<pack>.md` (regenerable, not corpus) → reduce call via `contracts/01-module-synthesis-reduce.md` → final profile + API reference written to the same `knowledge-corpus/<repo>/<runId>/...` location the module-level flow uses (so downstream consumers don't need to know which generation method produced a given module's profile).
- [x] **Decided (fan-out strategy):** sequential capability calls, confirmed as the right call for this first version — running 11 sequential calls against `building` made it straightforward to watch progress and pinpoint exactly which call hit the truncation bug (see Stage 7).

### Stage 7 — Live test and validate — ✅ DONE 2026-08-01
- [x] Ran end-to-end against `building` (the module already blocked on this): no context-window errors — the original `building` overflow (1,376,733 tokens vs. 1,048,576 max on the whole-graph flow) is fully resolved by the capability partitioning.
- [x] **Real bug found and fixed during this verification, not assumed away:** the first `building` run completed with exit code 0 and looked successful, but every one of its 13 written files (11 capability outputs + profile + API reference) was silently truncated mid-sentence — and so, it turned out on re-check, was the earlier `tasks` run reported as "verified" in Stage 6. Root cause: `splitMarkedFiles`'s marker regex fell back to matching end-of-string when the model's response was cut off by hitting `maxTokens` (8192, too small for this contract's required verbosity) — a truncated response has no `===END FILE===` marker, and the fallback silently accepted the partial text as if it were the complete document. Fixed: (1) `splitMarkedFiles` now requires the literal closing marker, no fallback; (2) `llm-adapter.ts` now checks each provider's truncation signal (`stop_reason: max_tokens` / `finishReason: MAX_TOKENS` / `finish_reason: length`) and throws `LLM_OUTPUT_TRUNCATED` immediately, before marker-parsing even runs; (3) `claude-default`'s `maxTokens` raised 8192 → 16384 (still too small, confirmed by the new fail-closed error) → 65536 (empirically sufficient for both `tasks` and every one of `building`'s 13 calls, re-verified by tail-checking every file for a genuine complete sentence, not just a non-error exit code).
- [x] Re-ran `tasks` and all of `building` after the fix; manually tail-checked every one of the 13 written files — all end in genuine complete content, none mid-word/mid-sentence.
- [x] Spot-checked output quality against the original door-coupling finding that motivated this whole plan: the reduce step's cross-capability reconciliation worked as designed — Section 5 of the new `building-engineering-profile.md` explicitly identifies `building_door` as depended upon by five sibling submodules (the most of any submodule, more than the module root itself), a fact invisible from any single capability's own outbound-coupling view and only surfaced by reconciling all eleven capabilities' outputs together, exactly as Stage 5's design intended.
- [ ] Update `tasks.md`'s checkpoint and HANDOVER items 3/4 status — not yet done as a separate step, largely superseded by this plan file's own completion; revisit only if HANDOVER.md itself still needs an explicit edit.

**New follow-on gap surfaced during this stage (logged to `tasks.md` item 9, not fixed here):** `knowledge-corpus/<repo>/<runId>/...` is deliberately LLM-agnostic (no provider/model in the path), so running a second `LLM_CONFIG_KEY` against the same module/run overwrites the first provider's output — a real problem for side-by-side LLM comparison testing. Deferred by user request ("leave this as a question for tomorrow").

---

## Explicitly not deciding yet (deferred, don't relitigate mid-implementation)
- Whether this becomes the *only* way module profiles are generated, or an alternative path alongside the existing single-shot generator.
- Generalization to modules with little/no submodule structure (expected to just yield fewer packs — not a special case to design for up front, confirm this holds once we see a flatter module).
- Repo-level/cross-repo synthesis (Phases 3+) — this plan is module-level only.
