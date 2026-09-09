# Task 1 Challenge — Trigger-Model Assumption Recorded, Branch/Tag Question Left Genuinely Open — 2026-09-08

**Purpose of this file:** the user asked for a real challenge to yesterday's Task 1 framing (`02-p1-build-tasklist.md` Task 1, grounded in `00-phase1-ast-extraction-design.md` Decision 1) before doing any build work, per two real points they raised directly. This is a decide-mode session per this project's own session-scope discipline (`CLAUDE.md`) — no prototype code written here.

## Point 1 — trigger model couples with tool choice, and yesterday's Task 1 treated them as independent

Yesterday's Task 1 (`02-p1-build-tasklist.md`) frames the Kotlin extraction tool decision (Analysis API vs. `sourcegraph/scip-kotlin` vs. kotlinc-direct) as resolvable by prototyping each against the repo and picking the best type-resolution/coverage result. That's incomplete: all three candidates require real Android SDK + Gradle infrastructure that the three existing TS pipelines never needed (no Android-SDK equivalent exists for `ts-morph`/tsconfig-based extraction). Yesterday's own `00-...md` open item 6 ("toolchain footprint for wherever extraction actually runs") already flagged this and deferred it alongside the project-wide trigger-model question (`01-standing-principles-...md`'s pipeline-duplication note) — but Task 1's own phrasing doesn't re-surface that coupling, so it reads as a decision independent of where this runs. It isn't: if the eventual trigger environment can't host a persistent Android SDK + licensed build tools, that constrains all three candidates, not just one.

**Resolution (user, 2026-09-08): proceed with an explicit, named assumption rather than blocking Task 1 on resolving the trigger model project-wide.**

- **Assumption:** extraction runs the way the three existing TS repos actually run today — manually, on a developer's own machine, with the toolchain (JDK 17 + Android SDK, per `00-...md`'s recorded setup recipe) present for the duration of the run. Not CI, not a serverless/cloud job.
- **Why this unblocks Task 1's prototype step:** all three candidate tools are feasible under this assumption — yesterday's session already proved a full Android SDK + Gradle toolchain can be stood up session-locally and used to build all 5 modules successfully. The prototype step can proceed on that basis.
- **Named risk, to revisit, not resolved here:** if the project-wide trigger-model question (`01-...md`) later settles on something lighter-weight (CI runner without persistent SDK state, a cloud function, etc.), this assumption may need to be revisited, and depending on which tool Task 1 picks, that could mean redoing the tool choice rather than just re-pointing a script. This is the same class of deliberately-deferred coupling as the `pipeline/<repo>/` code-duplication question in `00-...md` — surfaced once the trigger model is actually known, not resolved by guessing now.

## Point 2 — `develop` vs. release tags is a real, unresolved question, not a relabeled version of the TS repos' branch choice

Yesterday's Decision 1 (`00-...md`) picked `develop` for `config/repos.json`, reasoning by direct analogy to the three TS repos' `"branch": "staging"` — "same role, different literal name." The user found today that this analogy doesn't actually hold: **production runs off a tagged release (latest `1.6.0`), not `develop`'s HEAD.** `develop` is 163 commits ahead of `master` (`00-...md`'s own verified finding) — for a backend/web service under continuous deployment, staging tends to track prod closely, but a mobile binary's release cycle (store review, staged rollout) genuinely decouples "what's merged" from "what's installed on a real device" in a way that doesn't apply the same way to the existing three repos. This is a real, new category of gap for this repo specifically, not a solved problem under a new name.

There's also a mechanical constraint: `config/repos.json`'s `branch` field (see `config/repos.json`, all three existing entries) is a static string. It can express `"develop"` as-is, but **cannot express "latest release tag"** without either hardcoding a tag (goes stale the moment `1.6.1` ships) or adding a genuinely new, dynamically-resolved ref mechanism (e.g., resolve `git tag --sort=-v:refname` at scan time) — new config-schema surface beyond what Task 2 already scoped (dynamic module list from `settings.gradle.kts`).

**Resolution (user, 2026-09-08): genuinely undecided, left open — not defaulting back to yesterday's `develop` choice.** Real, live options, unresolved:

1. **`develop`** — matches existing precedent, right fit if these facts primarily serve forward-looking documents (PRDs, impact analysis for work being planned on top of the current engineering trunk).
2. **Latest release tag** — right fit if consumers (support, compliance, incident response) need facts that match what's actually running on real devices today. Requires the new dynamic-ref mechanism above.
3. Still open whether this needs to be one answer at all, or whether the corpus eventually needs both (e.g., tag-truth for "what's live" queries, develop-truth for "what's about to change" queries) — not scoped here, flagged only.

**Does not block Task 1's tool prototype step**, since type-resolution/coverage prototyping works the same regardless of which ref is eventually checked out — but it does block finishing `00-...md` Decision 1 and Task 2 (`02-p1-build-tasklist.md`, config shape) until answered.

**Flag on the original doc:** `00-phase1-ast-extraction-design.md` Decision 1 is not rewritten (this project marks things open/superseded rather than rewriting history) — a pointer to this file has been added at Decision 1 instead.

## What this actually unblocks

- Task 1 (tool prototyping) can proceed under the trigger-model assumption above.
- Task 2 (config shape) and finalizing Decision 1 (branch) remain blocked on the branch/tag question above — do not silently carry `develop` forward as settled.
