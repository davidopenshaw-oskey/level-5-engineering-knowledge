# V1-A/V1-B A/B/AB Factorial Experiment — Plan

**Status:** Executed and fully measured. Tasks 17m-17o all done 2026-08-30 — see `tasks.md` item 17 and `06b-v1-ab-factorial-experiment-results.md` for the real results and the porting decision (V1-A ported, V1-B deferred pending a re-run against the since-fixed pipeline defects). Full background: `governance/roadmap/v1-a-capability-synthesis-contract-scope-2026-08-30.md`, `v1-b-module-reduce-contract-scope-2026-08-30.md`, and the `governance/roadmap/contract-refactoring/contract-scope-conflict-review-*-2026-08-30*.md` thread.

---

## Goal

Measure whether V1-A (capability contract) and V1-B (reduce contract) actually reduce run-to-run output variance, with each stage's contribution attributable separately — not just "did the final assembled profile look different."

## Design

Four arms, each run twice per module for self-consistency:

| Arm | Capability contract | Reduce contract |
|---|---|---|
| Current | old | old |
| A | new | old |
| B | old | new |
| AB | new | new |

Modules: `tasks` (1 capability pack), `apps` (4 packs), `organization` (14 packs) — small/medium/large spread, cost-bounded subset of the 12-module repo.

**Stage isolation, the part that needs infrastructure:** a reduce call's own self-consistency (run1 vs run2) must not be contaminated by the capability stage also varying between those two runs, or an observed difference can't be attributed to the reduce contract specifically. So:
- Arms **Current**/**B** (old capability contract) read a *fixed*, already-existing old-contract capability-syntheses set for both of their reduce runs.
- Arms **A**/**AB** (new capability contract) read one *fixed* new-contract capability-syntheses generation (produced once, "cap-run1") for both of their reduce runs.
- Capability-stage self-consistency itself is measured separately: the new contract is regenerated *twice* independently (cap-run1, cap-run2) across all 19 packs, compared directly against each other — never funneled through a reduce call for run2.

**A real contamination found during design, fixed before running anything:** `organization`'s real canonical capability-syntheses directory is not purely old-contract. `organization_intercom_communication` was regenerated under the new (2026-08-30) contract during V1-A's own verification (task 17e) and written to the canonical location — 13 of `organization`'s 14 packs are still genuinely old-contract (dated 2026-08-29), this one isn't. Fix: one fresh old-contract regeneration of just that pack (via the new contract-path override, pointed at the recovered `.OLD.md` contract), combined with copies of the other 18 already-old-contract canonical files, into a dedicated `gemini-default-v1ab-old-canonical` comparison namespace. Current/B read from there, never from the real (mutable, partially-contaminated) canonical directory.

**A second real gap found during design, fixed independent of the experiment:** `config/repos.json`'s `moduleSynthesisContractPaths` for `firebase-oskey-dev` still listed `module-engineering-profile-task-instructions.md` and `-template.md` alongside the reduce contract. V1-B's contract-text rewrite (task 17g) never controlled what actually reached the prompt — this config array did, and nobody had updated it. Fixed by trimming the array to just `01-module-synthesis-reduce.md`; see `tasks.md` item 17 for the re-verification (two more real `organization` runs post-fix, one came back thin, the next came back full — consistent with this thread's own established baseline variance, not a regression). The old three-document set is preserved for this experiment's Current/A arms via the new override mechanism below, so the actual historical behavior is reproducible.

## Infrastructure added

**Old contract text, recovered and versioned.** Both `00-capability-synthesis.md` and `01-module-synthesis-reduce.md` were rewritten in place by V1-A/V1-B — no separate "old" file existed. Recovered from the git commit immediately preceding this session's contract work (`966311b`, local, not yet pushed) via `git show`, saved as `contracts/00-capability-synthesis.OLD.md` and `contracts/01-module-synthesis-reduce.OLD.md`. Confirmed by diff: only Sections 2/3's body text (capability contract) and Sections 6/9/13's guidance text plus the self-contained framing (reduce contract) differ — section numbering and the Output Format instruction are byte-identical between OLD and NEW, so `01c`'s hardcoded `CAP_SECTION`/`CONNECTIVE_SECTION` index maps parse both versions' output correctly without any code branching.

**`CAPABILITY_CONTRACT_PATHS_OVERRIDE`** (optional env var, `01a`/`01d`): comma-separated repo-relative paths, replaces `capCfg.capabilitySynthesisContractPaths` when set. Unset by default — no effect on any existing caller.

**`REDUCE_CONTRACT_PATHS_OVERRIDE`** (optional env var, `01c`): same mechanism for `capCfg.moduleSynthesisContractPaths`.

**`CAPABILITY_SOURCE_CONFIG_KEY`** (optional env var, `01c`): decouples "which capability output do I read" from "which LLM-config namespace does my own reduce output go to." `COMPARISON_MODE` alone can't express this — it uses one `LLM_CONFIG_KEY` for both read and write, which arm B's design specifically breaks (old-canonical capability input, new-contract reduce output, non-canonical output directory). Special value `"canonical"` means the real `knowledge-corpus`-adjacent capability-syntheses directory; any other value names an `llm-comparison/<key>/` namespace. Unset by default, falls through to prior `COMPARISON_MODE`-only behavior.

**11 new `config/llm-providers.json` entries**, all identical to `gemini-default` (same model/project/region/temperature) — pure directory-namespacing keys, same precedent as the existing `gemini-default-temp0`/`-temp0-run2` pair: `gemini-default-v1ab-old-canonical`, `-cap-run1`, `-cap-run2`, `-current-run1/2`, `-a-run1/2`, `-b-run1/2`, `-ab-run1/2`.

## Call volume and interleaving

63 real LLM calls total: 1 (old-canonical contamination fix) + 38 (19 packs × 2 self-consistency runs, new capability contract) + 24 (4 arms × 3 modules × 2 reduce self-consistency runs).

Per the interleaving discussion: each call already runs as its own OS process (`01d` operates at one-pack-per-process granularity; `01c` is already one-call-per-process), so the only thing left to control is *execution order*. The worklist was shuffled (fixed seed 20260835, chosen by rejection sampling to also guarantee no two self-consistency runs of the same cell land adjacent to each other) rather than looped module-by-module/arm-by-arm — cheap insurance against any provider-side session/connection/routing correlation between temporally-close identical-ish requests, on top of the existing evidence (the temp=0 self-consistency test) that literal output-caching isn't happening.

Driver: `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/experiment-v1ab-factorial-runner.sh` — generated (not hand-written) from the shuffled worklist, `set -e`, logs a labeled line before each call. Do not hand-edit the call order; regenerate from the worklist if it needs to change.

## Measurement plan (after execution)

Per the V1-B scope doc's metrics, not raw citation count alone:
- **Capability stage (cap-run1 vs cap-run2):** semantic-inventory equality for Section 3 (should be exactly equal, by construction — deterministic assembly), evidence-engagement overlap for Section 2.
- **Reduce stage, per arm (run1 vs run2, fixed capability input):** Section 6's stated ownership conclusion consistency, Section 9's named-asymmetry overlap, Section 13's evidence-engagement overlap.
- **Cross-arm comparison:** does Current's reduce-stage variance exceed B's (isolating the reduce-contract effect); does Current's capability-stage-driven variance (historical, already measured) exceed A's new-contract capability variance.

Report which arm(s) actually reduced variance, per-stage, before deciding anything further — including the already-agreed contingency that a null result wouldn't invalidate either fix (both are independently justified structural corrections), just point back toward the still-open "ordinary LLM sampling/decoding/selection variance" explanation.

## Explicitly out of scope

No new deterministic risk aggregations, no new Phase 1 extraction, no traversal rules justified by the retired bounded-traversal-stability hypothesis, no pipeline consolidation, no cross-repository normalization, no porting to Angular/Node-IoT (their own copies of the same `moduleSynthesisContractPaths` pattern are deliberately left untouched for now).
