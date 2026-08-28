# Plan 05 (proposed) — Capability Pack Size Cap / Sub-Splitting

**Status:** Discussion only. Investigation done, nothing approved, nothing built.
**Created:** 2026-08-27

*Sixth item under the numbered-plan-file convention (see `00-capability-based-module-synthesis.md`, `01-cross-module-dependency-graph.md`, `02-structural-narrative-synthesis-tiers.md`, `03-token-economics-remediation-plan.md`, `04-complete-repo-run-and-repo-reports-plan.md`). Raised in `handover_notes_and_sessions/2026-08-11-session-handover.md` Section 4 as "the open thread to pick up first" — this doc is that pickup, for discussion before any implementation stage is written.*

---

## Why this exists

While reviewing the first full repo-wide report (2026-08-11), the user flagged that `core` and `access_control_device` seemed to get thin treatment relative to other modules. The prior session investigated and confirmed it was real, not perception — see Section 4 of the handover doc for the original numbers (743 facts in `core`'s `access` capability pack, 521 in the whole of `access_control_device`, both among the largest packs in the repo, producing 0.23–0.30 narrative lines per fact vs. 0.40 for a comparably-sized `building` submodule).

Root cause as reported: `05-partition-capability-packs.ts` gives every capability pack exactly one LLM call, regardless of size — a 12-fact pack and a 700+-fact pack get the same output budget.

## What I verified this session (2026-08-27)

- **Confirmed the root cause claim by reading the script directly.** [`05-partition-capability-packs.ts:92-98`](../../pipeline/firebase-oskey-dev/phase-01-ast-extraction/05-partition-capability-packs.ts#L92-L98) groups facts purely by `fact.submodule` (falling back to a `_module_root` catch-all), writes one pack per group, and applies no size threshold or sub-splitting anywhere in the file. The claim holds.
- **Could not independently re-verify the specific fact-count/density numbers on this machine.** This is a fresh clone; `output/` is gitignored and not present locally (no `facts/`, no `capability-packs/`, no `llm-comparison/gemini-default/` — the Gemini 12-module run and the repo report referenced in the handover aren't here to inspect). The git-tracked `knowledge-corpus/` for this runId (`20260803_143350-1aa319b1`) currently holds only `tasks`'s profile+API reference — no `core`, `building`, or `access_control_device` output exists locally to check firsthand. So the 743/521/0.23–0.30 numbers below are **reported by the prior session, not re-verified by me** — re-verifying would mean either re-running Phase 1 here (free, deterministic, no LLM — just needs the source repo cloned again) or you pointing me at a copy of that `output/` data if you have one from the old machine.
- **Confirmed this is a genuinely new finding, not a re-litigation.** `04-gaps-and-issues-before-full-repo-run.md` (the companion doc to Plan 04) doesn't mention a pack-size cap anywhere — this wasn't already tracked and decided against.
- **Confirmed it isn't already covered by `tasks.md`.** Closest related item is #15, which points at `02-structural-narrative-synthesis-tiers.md` Stage 4 — batching/recursive-reduce design for the reduce step in general. That plan is paused (see its status line: paused 2026-08-02 pending Plan 03 results, never resumed) and is about a different mechanism (splitting a large *reduce input* into bundles), not about Phase 1's pack-generation step. Related in spirit, not the same fix — flagged as an open question below.

## The proposal on the table (from the handover, not yet actioned)

Add a max-facts-per-pack threshold to `05-partition-capability-packs.ts` and sub-split oversized packs. For `core`'s `access` submodule specifically, the handover notes it already cleanly separates into ~5 distinct services visible in its own citations: `access.service`, `access_pincode_generation.service`, `access_pincode.service`, `access_message_publisher.service`, `access_update.service` — a plausible natural split key.

Also flagged as worth checking first: whether `access_control_device` genuinely has no subfolder structure in the source repo (making one pack the *correct* representation of a flat module) or whether that's a gap in how `00-scan-repo.ts` detects submodules — those are different problems with different fixes.

## Why this isn't a small patch — blast radius

- Changes Phase 1 partitioning for **every module**, not just these two — directly changes capability-pack counts, and therefore LLM call counts and cost, repo-wide.
- `06-build-cross-module-dependency-graph.ts` and `07-build-intra-module-coupling-graph.ts` both consume the module→submodule pack structure Phase 1 produces. If partitioning changes, both need re-running.
- Any module whose partitioning actually changes needs a fresh Stage A/B pass (`01a`+`01c`) — real LLM spend, gated by the standing rule to confirm provider/config with you before any real call.
- Potential overlap with `02-structural-narrative-synthesis-tiers.md` Stage 4, which was paused specifically to design a batching/recursive-reduce mechanism before ad hoc fixes accumulate at different boundaries. Worth deciding whether this is that mechanism, a precursor to it, or a genuinely separate concern (Phase 1 pack generation vs. Phase 2 reduce-input batching).

## Open questions

1. **Sequencing** — is this urgent enough to jump ahead of resuming Plan 02 Stage 4, or does it make more sense to fold into that plan since both are about "when is a chunk too big, and how do we split it without losing cross-boundary judgment"?
2. **Split key** — for a pack like `core/access` with ~5 services living inside one submodule folder, what's the deterministic split signal? File path grouping? A new partition level below "submodule" (e.g. "service"), à la the existing `_module_root` convention? Does this need a new fact field, or can it be derived from what's already extracted?
3. **`access_control_device` — split or leave alone?** Depends on the subfolder-structure question above. If it's a genuinely flat module, splitting it arbitrarily could be worse than giving it a bigger call budget instead of sub-splitting.
4. **Verification before deciding anything** — do we want a fresh, local Phase 1 re-run (free, no LLM) first, to get real current numbers instead of relying on the 2026-08-11 session's report? This would also settle question 3 directly.
5. **Cost re-projection** — if we do build a size cap, should we redo a Plan-04-Stage-2-style cost projection before re-running any affected module, given every module's pack count could shift?

Nothing here is decided. Next step is talking through these five questions — once we land on a direction, this doc gets promoted into a real staged plan (task list, one item at a time, checked off only as actually done) the same way `03` and `04` were.

---

## Update — 2026-08-27: fresh Phase 1 re-run, questions 3 and 4 settled

Ran `npm run pipeline:firebase` (scripts `00`–`07`, zero LLM) fresh on this machine against `firebase-oskey-dev`. `git ls-remote` confirmed `master` HEAD is still `1aa319b1...` — the identical commit the 2026-08-03 numbers came from, so this is a true re-verification, not a new data point from a moved target. Run was clean: exit 0, `21` unresolved calls (matches the historical baseline exactly).

**Question 4 (verify before deciding) — done.** Real, current numbers, byte-for-byte reproducible against the same commit:
- `core`'s `access` pack: **743 facts** — exact match to the 2026-08-11 report.
- `access_control_device`: **521 facts**, one single `_module_root` pack — exact match.

**Question 3 (`access_control_device` — flat module or extraction gap?) — settled, it's genuinely flat.** With the fresh clone present locally, inspected the real source tree directly instead of inferring from fact counts: `functions/src/modules/access_control_device/` contains `shared/`, `models/`, `api/`, `controllers/`, `services/` — no `modules/` folder, which is the only structure `00-scan-repo.ts` recognizes as containing real submodules. This is the same flat layout as `call`, `tasks`, and `unit_management` (all confirmed `submoduleCount: 0` in `07`'s output). **Not an extraction gap** — there is nothing to detect. Any fix for this module can't be "split by submodule," since no submodule boundary exists in the source; it would have to split some other way (by file, by class, by the `shared/models/api/controllers/services` folders themselves) or just get a bigger call budget instead of being split at all.

**New finding, not anticipated in the original framing: this isn't a two-module problem.** Looking at every pack's `factCount` from this run, several other packs are as large or larger than `core`'s `access` (743) — the two originally-flagged modules are not uniquely affected:

| Pack | factCount |
|---|---|
| `organization` / `organization_intercom_ communication` | 546 |
| `user` / `user_invitation` | 823 |
| `user` (`_module_root`) | 645 |
| `admin` / `admin_maintenance` | 687 |
| `admin` / `admin_users` | 521 |
| `supplier` / `supplierStaff` | 605 |
| `unit_management` (`_module_root`, flat, no submodule folder) | 556 |
| `core` (`_module_root`) | 594 |
| `core` / `access` | 743 |
| `access_control_device` (`_module_root`, flat, no submodule folder) | 521 |

`user_invitation` (823) and `admin_maintenance` (687) are both larger than `core`'s `access` pack. Two of the ten — `unit_management` and `access_control_device` — are flat `_module_root` packs like `access_control_device`, not sub-splittable submodules, so they'd need the same "different fix shape" as question 3 settled above.

**Practical effect on the open questions above:** question 2 (split key) still needs answering, but now for at least four submodule-shaped candidates (`core/access`, `user/user_invitation`, `admin/admin_maintenance`, `supplier/supplierStaff`), not one — and question 5 (cost re-projection) matters more than it did, since a size-cap fix would touch more of the repo than originally scoped. Whatever gets decided should be checked against this full table, not just the two modules that happened to surface the issue first.

Gemini Phase 2 synthesis (all 12 modules + repo report, `gemini-default`, writing directly to `knowledge-corpus/firebase-oskey-dev/20260827_163338-1aa319b1/` per explicit instruction — not `COMPARISON_MODE`) is running against this same fresh data as a current "before" baseline, to compare once a partitioning fix is actually built.

---

## Update — 2026-08-27/28: fresh Gemini baseline complete, plus a reliability finding

All 12 modules synthesized and the repo report generated, now sitting in `knowledge-corpus/firebase-oskey-dev/20260827_163338-1aa319b1/`. This is the current "before" baseline (no partitioning fix applied) to diff against once one is built.

**Reliability finding, possibly relevant to any future fix design:** of 84 total LLM calls in this run (12 modules × ~7 calls average + repo report), 6 failed transiently and needed retries — 4 to `429 RESOURCE_EXHAUSTED` (rate limiting from firing all 12 modules back-to-back with no pacing) and 3 to a generic `fetch failed` (client-side network error, no HTTP status body) all on **the exact same call**: `building`'s final reduce/assembly step, the single largest reduce input in the entire run (11 capability syntheses + full cross-module/intra-module coupling data, one prompt). That call failed 3 times in a row before succeeding on a 4th identical attempt — a 75% failure rate on the biggest call in the pipeline, while every other module's reduce call (including `organization`'s, with 14 capability packs, more than `building`'s 11) succeeded on the first or second try. `_shared/llm-adapter.ts`'s `callGemini()` (lines 189-221) sets no explicit request timeout — worth checking whether `@google/genai`'s default is simply too short for a call this size, independent of whatever comes out of the pack-size-cap discussion, since splitting `05`'s output wouldn't necessarily shrink `01c`'s reduce input if the fix is "more, smaller capability packs" rather than "fewer, more targeted ones."

**Does the original core/access_control_device thinning reproduce?** Not as cleanly as expected — worth a caveat before reading too much into it:
- A rough density check (profile line-count ÷ module fact-count, a cruder proxy than the original session's per-capability measurement) puts `core` at 0.39 lines/fact — still the lowest of the 11 non-trivial modules, consistent with the original finding. But `access_control_device` comes in at 0.52, mid-pack, not visibly thin this time.
- The repo report *does* give both modules real, substantive treatment: `access_control_device` gets its own subsystem grouping (with `call`), a named dependency profile, and a genuine security finding (Firestore rules allow any authenticated user to read/write `/accessControlDevices` with no tenant isolation). `core` doesn't get the original run's exact "1,422 inbound edges, dedicated SPOF" framing, but does surface a different, arguably more actionable one: a circular-dependency risk between `core` and `building`/`user` (47 edges each direction), flagged as violating architectural layering.
- Most likely explanation: the 2026-08-11 session's own contract fix (Section 3d of the handover — the citation/inline-evidence contract change that closed the connective-tissue depth gap) is already baked into the current contracts this run used. Some of what looked like a partitioning-specific problem in the original report may have actually been the pre-fix contract gap, already resolved independently of pack size. This doesn't rule out the size-cap issue — the exact-match fact counts (743/521) and the repo-wide table of comparably oversized packs still stand as measured, structural facts — but it does mean **the density/thinness evidence for urgency is weaker on a fresh run than the original report suggested**, and any decision to build the size-cap fix should weigh that before treating it as urgent.

Not yet done: an isolated before/after comparison of `core/access.md`'s capability-synthesis document specifically (the actual affected artifact) against the same file from the original run — that would be a more precise density check than the whole-module line-count proxy used above, but the original run's `output/` isn't available locally to diff against (per the earlier note), so it would require whatever comparison documents get copied in from the old machine.
