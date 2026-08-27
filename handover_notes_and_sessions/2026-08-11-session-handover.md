# Session Handover — 2026-08-11

**Read this first, in full, before doing anything else.** Written by the Claude session ending this machine's work, for whichever Claude picks this up next (different machine, no shared conversation memory, and — important — no shared `~/.claude` auto-memory either, since that's local to the machine it ran on, not part of this git repo). Everything below that matters is restated here so nothing depends on memory that won't travel.

---

## 0. Operating rules — restate these to yourself immediately, they will NOT carry over automatically

These came from explicit user feedback across prior sessions. They are not in this repo's CLAUDE.md; they lived in local auto-memory on the previous machine. Follow them from message one on the new machine, don't wait to be told again:

1. **Never edit `governance/charters/` or `governance/reference-docs/`.** These are governance-controlled. Advise the user on changes; don't make them yourself.
2. **Never stage, commit, or push git changes.** The user manages all git operations themselves. Editing files is fine; running `git add`/`commit`/`push` is not, even if asked to "save" or "finish up" — check what's actually meant first if ambiguous.
3. **`governance/roadmap/tasks.md` is a todo list, not a changelog.** Never log completed work there. Log only pending, undone items. Completed-work narratives belong in a numbered plan file (see rule 4) or in a response to the user, not in tasks.md.
4. **Non-trivial new design/implementation work gets its own numbered plan file**: `governance/roadmap/NN-short-name.md`, worked one checklist item at a time, updated with real results (not just checked off) as items complete. See `03-token-economics-remediation-plan.md` and `04-complete-repo-run-and-repo-reports-plan.md` for the established style — narrative + technical detail per stage, marked done with what was actually found/measured, not just "done."
5. **Never trigger a real LLM call without confirming provider/LLM_CONFIG_KEY with the user first.** Real calls cost real money. This includes seemingly-small dev/test calls. Free/metadata-only calls (e.g. `ai.models.list()`) don't need this — only anything that generates content.

---

## 1. What this project is

The "Level 5 Engineering Knowledge" pipeline: turns a source-controlled codebase into a trustworthy, cited engineering knowledge corpus — per-module engineering profiles, API references, and (as of this session) a repo-wide report. Currently built and tested against one repo, `firebase-oskey-dev` (OSkey's Firebase/TypeScript building-access-control backend), as the proof case for a planned 15+ repo, multi-platform corpus (Angular, iOS, Android, Node/IoT middleware, eventually hardware/firmware).

Three-part pipeline, now fully built for the first time this session:
1. **Phase 1 — AST extraction** (`pipeline/firebase-oskey-dev/phase-01-ast-extraction/`): zero LLM, compiler/parser-only. Produces `output/runs/<repo>/<runId>/facts/*.json` (raw facts) and `.../knowledge-pipeline/` (resolved, partitioned facts + repo-wide graphs).
2. **Phase 2 — module synthesis** (`pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/`): LLM-based. Produces per-module engineering profiles + API references.
3. **Phase 2 — repo-wide report** (new this session, `02-generate-repo-report.ts`): one level up from module synthesis, produces a repo-wide engineering report.

---

## 2. Current git state (as observed at handover time)

- Branch: `development`
- HEAD: `78e740a "04 Stages completed"`, in sync with `origin/development` (not ahead, not behind) — `git status -sb` showed only `.DS_Store` as locally modified, nothing else pending.
- **This means all of this session's code/doc changes are already committed and pushed.** The other machine should get everything via a normal `git pull` — no uncommitted work is stuck on this machine. (Confirm this is still true when you read this — don't just trust a stale note if something looks off.)

---

## 3. What happened this session (chronological, grouped)

### 3a. Consolidated the module-level pipeline (Plan 04 Stage 1 — done)
Plan doc: `governance/roadmap/04-complete-repo-run-and-repo-reports-plan.md`.

- Fixed a real bug: `CACHE_BREAKPOINT_MARKER` (an Anthropic-only prompt-caching sentinel) was not stripped for Gemini/OpenAI — would have leaked into their prompts as literal text. Fixed in `_shared/llm-adapter.ts`'s `callGemini`/`callOpenAI`.
- Decided and implemented: every module, regardless of size, now goes through the SAME path — `01a-generate-capability-syntheses.ts` (new: Stage A only, extracted shared logic into `_shared/capability-synthesis.ts`) then `01c-generate-assembly-first-profile.ts` (promoted from "bounded experiment" to the standard production path — now writes to the canonical `knowledge-corpus/<repo>/<runId>/` location).
- `00-generate-module-profile.ts` and `01-generate-capability-based-profile.ts`'s Stage B are retired for new work (header comments say so) but kept in the repo as historical/comparison baselines, not deleted.
- Verified the provenance sidecar mechanism end-to-end via a real run (module `tasks`, `claude-default`) — confirmed it's written by the actual production code path, not just a standalone test script.

### 3b. Gemini access and model discovery
- Discovered the earlier "gemini-3.6-flash 404" (from a prior session) was a **region gap, not an access/auth problem**: `europe-west1` only serves the Gemini 2.5 generation on this project; `us-central1` and the `global` endpoint already serve `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.6-flash` under the same identity/project. No non-preview pro-tier exists yet at 3.5/3.6 (flash-only; pro tops out at `gemini-3.1-pro-preview`, still preview).
- `config/llm-providers.json`'s `gemini-default` now points to `gemini-3.5-flash` / `global` (confirmed via a real `generateContent` call that `global` has actual generation entitlement, not just catalog visibility — `us-central1` showed the model in `.list()` but 404'd on actual generation).
- Added a second config entry, `gemini-default-highthinking` — same model, `thinkingConfig.thinkingLevel: "HIGH"` (Gemini's reasoning-effort control, previously never wired into `callGemini`). **Tested and found NOT worth using for the full run** — see 3d below, the contract fix alone closed the quality gap on standard thinking, cheaper. Keep this config around as a per-module escape hatch if a future module comes out shallow, don't default to it.

### 3c. Traceability/observability fixes (real bugs found by asking "are you sure")
- Added `servedModel` to `LlmCallResult` (all three providers) — the API's own response now confirms which model actually served a request, not just an echo of what was requested. `callLlm()` warns (doesn't throw) on mismatch.
- Discovered Gemini caching is **not active anywhere** — checked the real `cachedContentTokenCount` usage field, confirmed absent/zero on real calls. Vertex AI caching (per `@google/genai`'s `ai.caches` namespace / `cachedContent` config field) looks to be **explicit** (create a cache resource, reference it) — a different mechanism than Anthropic's inline `cache_control`, not yet implemented. Flagged, not built.
- Found and fixed a **second occurrence** of an earlier notification-ID collision bug: `buildNotificationId()` (in `phase-01-ast-extraction/_shared/run-utils.ts`) now also distinguishes on `llmConfigKey`, since `COMPARISON_MODE` runs the same module/relPath through multiple configs and the old ID collided across them, silently overwriting usage data. Verified fixed by deliberately re-triggering the same collision scenario and confirming both entries now survive.

### 3d. Quality work: closing a real cross-cutting depth gap in Gemini's output
- Found and fixed a real contract bug: `contracts/00-capability-synthesis.md`'s "What NOT to include" line told capability-level synthesis not to write "an evidence-references section with fact IDs" — ambiguous enough that models read it as "don't cite anything inline," not just "don't write a separate Section 14 list." Fixed with an explicit "Citing evidence inline" section giving exact fact-ID and file-line citation syntax. Result: citations went from 0 to fully populated and verified (262/262 on `building`).
- Compared Gemini vs. the existing Claude-generated `building`/`tasks` profiles directly. Found a real, specific depth gap: Claude's connective-tissue output caught cross-capability patterns (e.g. "RBAC enforcement is inconsistent across sibling capabilities," "5 unattributed permission-denied errors with no RBAC string behind them") that Gemini's didn't, even on identical facts.
- Tried `thinkingLevel: HIGH` first — modest improvement, didn't close the gap, cost more.
- **Root-caused and fixed via a contract change instead**: `contracts/01-module-synthesis-reduce.md` already told the reduce step to do cross-capability judgment but only gave a concrete worked example for ownership conflicts, not permissions. Added two explicit, generalized techniques (build a mental RBAC-enforcement tally and name the asymmetry; flag unattributed security signals by capability name and exact count). Re-tested on `building` with plain `gemini-default` (standard thinking, to isolate the variable) — **fully closed the gap and arguably exceeded the original Claude finding** (caught a second capability with the same pattern Claude missed, and connected two findings into one compound risk). Citations held at 262/262.
- **Lesson worth remembering**: the depth gap was a prompting/contract issue, not a model capability ceiling. Don't reach for a bigger model or more thinking budget as a first response to a quality gap — check whether the contract is actually asking for the right thing first.

### 3e. Full 12-module Gemini run (Plan 04 Stage 3 — done)
Ran every module in the repo through the fixed `01a`+`01c` pipeline against `gemini-default` (standard thinking), using `COMPARISON_MODE=true` so it writes to `output/runs/<repo>/<runId>/llm-comparison/gemini-default/<module>/...` — never touching the canonical `knowledge-corpus/` path where the earlier Claude-generated `tasks`/`building` profiles live (kept as the gold-standard comparison baseline).

All 12 modules done: `access_control_device`, `admin`, `apps`, `building`, `call`, `core`, `organization`, `settings`, `supplier`, `tasks`, `unit_management`, `user`. `admin` was specifically re-run after the contract fix (3d) for consistency; `tasks` was left on its earlier run since it's single-capability (the fix doesn't change anything for a module with no sibling capabilities to compare).

### 3f. Built the missing third pipeline piece: the repo-wide report (Plan 04 Stages 4/5 — done)
This was a genuine, previously-unbuilt gap against the original three-part pipeline vision. New files:
- `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/02-generate-repo-report.ts`
- `pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/contracts/02-repo-synthesis-reduce.md`
- `config/repos.json`'s new `phase2.repoSynthesis` block
- `_shared/document-sections.ts` (extracted `splitNumberedSections` out of `01c` so both scripts share it)
- `_shared/rbac-flatten.ts` gained `getFlattenedRbacRolesMap()` (a real Map, not just the formatted string) for deterministic membership checks

Design, applying the "assembly-first" lesson from the start rather than relearning it (Plan 03's Stage 3 lesson, one level up):
- **Deterministic sections** (no LLM): Module Inventory (module + capability-pack counts), Module Dependency Overview (aggregated from `knowledge-pipeline/resolved-engineering-graph.json`'s `confirmedCallEdges` — this artifact turned out to already be repo-wide, no new Phase 1 aggregation script was needed), RBAC Requirements Catalog (from the same file's `rbacRequirements`, cross-checked against `rbac-roles.json` for real membership, not eyeballed by an LLM).
- **One LLM call** for genuinely repo-wide judgment: Executive Summary, Major Subsystems, Cross-Cutting Patterns, Repo-Wide Risks — fed each module's *extracts only* (Executive Summary, Architectural Position, Cross-Cutting Risks sections), never full module profiles.
- Citations at this level name modules, not fact IDs (documented explicitly in the provenance sidecar) — the fact-based citation validator doesn't apply two levels removed from raw facts, and running it would be misleading, so it's deliberately skipped, not silently omitted.

Ran for real against all 12 Gemini modules. Output: `output/runs/firebase-oskey-dev/20260803_143350-1aa319b1/llm-comparison/gemini-default/_repo-report/firebase-oskey-dev-repo-engineering-report.md`. Quality is genuinely strong, not just structurally complete — found ~30 permission strings checked in code but missing from `rbac-roles.json` (deterministic, zero hallucination risk), correctly identified `core` as the platform's structural hub (1,422 inbound edges from 11 of 12 modules) with a dedicated SPOF risk item, and correctly drew on per-module extracts for module-specific findings (not just the deterministic graphs).

Caught and fixed one small bug of my own along the way: the provenance sidecar's note text had the wrong section numbers (said "Sections 1, 3, and 4" when the actual final doc numbering is 1, 3, 6, 7) — fixed in both the script and the already-generated sidecar file.

### 3g. Handoff artifact for the dev team
Wrote `output/runs/firebase-oskey-dev/20260803_143350-1aa319b1/README-for-dev-team.md` explaining `facts/`, `knowledge-pipeline/`, and `llm-comparison/gemini-default/` for a senior engineer taking a copy of the data. **The user has since edited this file themselves** to add explicit framing: `facts/` and `knowledge-pipeline/` are reference-only, not intended for the Corpus; `llm-comparison/gemini-default/` **is** "the data that was planned to be used in the Corpus." Take that as a real signal of intent — despite its "comparison" path name, that directory's content is being treated as the actual candidate Corpus output, which may matter for future naming/promotion decisions (e.g. whether it should eventually move out of a path literally named `llm-comparison`).

---

## 4. The open thread to pick up first

**Immediately before this handover was requested**, the user raised a concrete quality concern while reviewing the repo report: little attention seemed paid to `core`/`access_control_device`. I investigated and confirmed it's real, with hard evidence, not just perception:

- `core`'s `access` submodule capability pack has **743 facts**; `access_control_device`'s entire module is **one single unpartitioned pack of 521 facts**. Both are among the largest capability packs in the whole repo — bigger than anything in `building`, comparable to `organization`'s biggest.
- Measured output density confirms real compression: these two packs produce **0.23–0.30 narrative lines per underlying fact**, versus **0.40** for a comparably-sized `building` submodule (`building_unit`, 449 facts).
- Root cause: `05-partition-capability-packs.ts` (Phase 1) has **no cap on capability-pack size** — a 700+-fact pack and a 12-fact pack both get exactly one capability-synthesis LLM call, same shape, same output budget. This is a Phase 1 partitioning gap, not a Phase 2 prompting/model problem (unlike 3d above).
- Repo-level nuance: `core` still got strong, deserved attention *at the repo-report level* (dedicated SPOF risk item, hub identification) because that came from the deterministic dependency graph, independent of the thin module-level narrative. `access_control_device` got less repo-level attention, but its dependency numbers are genuinely modest — that part may be a fair reflection, not neglect.

**I proposed, not yet actioned or confirmed by the user**: add a max-facts-per-pack threshold to `05-partition-capability-packs.ts` and sub-split oversized packs — `core`'s `access` submodule already cleanly separates into ~5 distinct services visible in its own citations (`access.service`, `access_pincode_generation.service`, `access_pincode.service`, `access_message_publisher.service`, `access_update.service`). Also worth checking whether `access_control_device`'s source genuinely has no subfolder structure (making one pack correct) or whether that's an extraction gap.

**Next Claude: pick this up by asking the user whether to pursue that fix**, don't just build it — this changes Phase 1's partitioning logic, which affects capability-pack counts (and therefore LLM call counts/cost) across every module, not just these two. If they say yes, this is Phase 1 work (`pipeline/firebase-oskey-dev/phase-01-ast-extraction/05-partition-capability-packs.ts`), and re-running it would need `06`/`07` (the dependency graphs) re-run too since they consume the same module-scoped structure, plus a full re-run of Stage A/B for any module whose partitioning actually changes.

---

## 5. Other open items, roughly by urgency

- **URGENT, still not done**: talk to the tech team about their RAG/EmbeddingGemma retrieval-layer interface. This gates Decision A2 (the fuller persistent knowledge model) per `governance/roadmap/phase 2-llm q&a/01 facts-vs-decisions-for-review.md` and `03-token-economics-remediation-plan.md`. Nothing to build here — it's a conversation the user needs to have, flagged repeatedly across sessions as not yet happened.
- `governance/roadmap/tasks.md` item 16 (added this session): strengthen `contracts/00-capability-synthesis.md` to explicitly prefer fact-ID citations over file-line citations, since file-line citations go stale on any source-line shift (even a single comment) while fact-IDs don't (line was deliberately excluded from fact identity in an earlier fix). Logged, not implemented — user asked for it to be logged only, not built yet.
- Gemini/Vertex AI context caching — flagged as a real, unexploited cost lever (gaps doc item 3), not researched or implemented. Different mechanism than Anthropic's, needs its own design.
- OpenAI (`openai-default`, `gpt-5`) is configured in `config/llm-providers.json` but has never been cost-tested or used for anything in this pipeline — the original idea was using it as an independent judge comparing Gemini against the Claude gold standard, never executed.
- `governance/roadmap/04-gaps-and-issues-before-full-repo-run.md` has the fuller, itemized list of everything tracked as open/closed — read it directly rather than trusting this summary if you need the complete picture.

---

## 6. Practical notes for running things

- **Every Bash command in this environment prints a spurious first line**: `/Users/davidopenshaw/.zshenv:1: permission denied: /Library/Java/JavaVirtualMachines/jdk-20.jdk/Contents/Home`. This is harmless shell-profile noise (unrelated to whatever command actually ran), not a real error. Pipe through `grep -v zshenv` or just ignore it — don't mistake it for a failure.
- Scripts are invoked directly with `ts-node`, not via `package.json` (no phase-02 scripts are wired into `package.json` — this is an established, deliberate pattern in this repo, not an oversight): `node -r ts-node/register pipeline/firebase-oskey-dev/phase-02-inter-module-synthesis/<script>.ts`, with env vars `REPO_NAME`, `MODULE_NAME` (where applicable), `LLM_CONFIG_KEY`, and `COMPARISON_MODE=true` (where you want output kept out of the canonical `knowledge-corpus/` path).
- Current active run: `output/runs/firebase-oskey-dev/20260803_143350-1aa319b1/` (runId tied to commit `1aa319b1`). Check `output/firebase-oskey-dev/run-context.json` to confirm this is still the live run before assuming it.
- `config/llm-providers.json` currently has: `claude-default` (claude-sonnet-5, Anthropic), `gemini-default` (gemini-3.5-flash, global region, standard thinking), `gemini-default-highthinking` (same model, HIGH thinking — escape hatch, not default), `openai-default` (gpt-5, untested).
- TypeScript compiles clean as of handover (`npx tsc --noEmit -p .` — ignore the zshenv line in its output too).

---

## 7. If you're not sure where to start

Read, in this order: this file in full → `governance/roadmap/04-complete-repo-run-and-repo-reports-plan.md` → `governance/roadmap/04-gaps-and-issues-before-full-repo-run.md` → the actual repo report at `output/runs/firebase-oskey-dev/20260803_143350-1aa319b1/llm-comparison/gemini-default/_repo-report/firebase-oskey-dev-repo-engineering-report.md`. Then ask the user whether to pick up Section 4 above (the capability-pack size fix) or something else — don't assume.
