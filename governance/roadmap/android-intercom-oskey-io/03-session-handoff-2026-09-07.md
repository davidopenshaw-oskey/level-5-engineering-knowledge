# Session Handoff — `android-intercom-oskey-io` P1 Onboarding, Investigation Complete — 2026-09-07

**Purpose of this file:** a real, specific hand-off at a deliberate mode boundary. This session did Task 2 from `governance/roadmap/mcp-direction/20-session-handoff-repo-restructure-and-kotlin-onboarding-2026-09-07.md` — real investigation and decisions, now complete and written down. The next session's job is build-mode work (writing actual pipeline scripts), deliberately not started in this same session, per this project's own session-scope discipline (`CLAUDE.md`) and an explicit checkpoint agreed with the user.

## Read first, in this order

1. **`00-phase1-ast-extraction-design.md`** — the real repo findings (branch, module structure, UI paradigm, Room, Kotlin version, KSP, toolchain verification) and the two real decisions made (branch `develop`, scope all 5 modules). Also contains the real, working toolchain setup recipe (JDK/Android SDK download URLs, install steps) — needed again, see "Toolchain state" below.
2. **`01-standing-principles-and-lessons-from-ts-facts-pipeline-2026-09-07.md`** — two standing principles given directly by the user (config shape can differ per repo; extraction must be dynamic, never hardcoded — with the explicit, real tension against node-iot's own hardcoded-module precedent, deliberately not being copied here) plus the generalizable lessons pulled from the TypeScript facts pipeline's real, multi-day history of getting a usable PRD out (facts-as-pointers, closed-set-value extraction, generic-type-argument descent, extraction-vs-embedded-text as separate design surfaces, the reverted hybrid-search attempt, etc.).
3. **`02-p1-build-tasklist.md`** — the real, ordered 8-task build list for this repo's own P1 pipeline. Start here for the next session's actual work.

Optional, read if touching anything cross-repo/cross-platform: **`swift-kotlin-preparation/01-real-findings-from-android-intercom-onboarding-2026-09-07.md`** — real, product-specific hypotheses for the future iOS repo, grounded in this session's findings (same product family — another door-access app).

## Real, open decision that needs a genuinely fresh look, not a rubber-stamp

**Task 1 in `02-p1-build-tasklist.md`: which Kotlin extraction tool to actually use** — standalone Kotlin Analysis API vs. `sourcegraph/scip-kotlin` (compiler-plugin route, comes with real snapshot/golden-testing tooling as a bonus) vs. a lighter kotlinc-direct approach. This session verified the underlying K1 compiler frontend resolves real types cleanly against this repo (a real, successful `./gradlew compileDevelopmentDebugKotlin`) — that derisks the *toolchain*, not the *tool choice*. The market research behind this (`market-research/08-...md` §2) has a real, honest gap: no independently-named non-Sourcegraph/JetBrains adopter of the Analysis API was found for extraction specifically. **The user explicitly asked for a fresh review of this decision next session, not a continuation of whatever direction this session's discussion leaned toward** — treat it as genuinely open, and prototype small before committing, per the task list's own instruction.

## Toolchain state — what persists, what doesn't

- **The real repo clone persists**: `output/clones/android-intercom-oskey-io`, on `develop`, in the actual project working directory (gitignored, but not session-scratchpad — it's still there).
- **The JDK/Android SDK toolchain does NOT persist** — it was installed under this session's own scratchpad directory (`/private/tmp/claude-502/.../scratchpad`), which is session-specific and will be gone. The next session needs to redo this setup using the real, working recipe recorded in `00-...md` (exact URLs, exact package versions, the two dead-end URLs already ruled out so they aren't re-tried) — should be fast to repeat, not a re-investigation.
- Toolchain was deliberately installed session-local only (not system-wide) after an explicit check-in with the user — the next session should make the same call explicitly again, not assume a system-wide install is now wanted just because it was needed once.

## Other real, live context

- **A peer session is working Task 1** (moving `mcp-server/` to repo root, resolving its `_shared/search.ts`/`graph-traversal.ts` coupling) from the same source hand-off doc, in parallel. As of this session's end, no update was received from them since the initial coordination exchange (both sessions confirmed no file overlap). Check `ListAgents` for their current status before assuming anything about where that stands.
- This session deliberately did **not** touch `mcp-server/`, `_shared/`, `config/repos.json`, or any file outside `output/clones/android-intercom-oskey-io/` and the `governance/roadmap/` docs listed above.

## What this session should NOT do (carried forward as a general reminder for whoever picks this up)

Don't start writing `01-extract-ast-evidence.ts` (task 4) before task 1 (tool selection) is actually re-reviewed and settled — the extraction script's real shape depends on which tool wins.
