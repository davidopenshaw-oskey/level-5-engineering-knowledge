# Branch/Tag/Version-Pin Strategy — Real Evidence and Decision, 2026-09-09

Mirrors `android-intercom-oskey-io/04-task1-challenge-trigger-assumption-and-branch-tag-open-question-2026-09-08.md` in spirit: a real, checked look at each repo's actual branch/tag history before picking what `config/repos.json` pins to, rather than assuming `develop` (Android's placeholder) transfers here. **It doesn't** — the real evidence below points to a different answer for the app than for the leaf packages, and to a different answer than Android's own precedent for both.

## `ios-oskey-dev` (the app): real evidence points to `master`, not `develop`

Real, checked branch relationship:

- `origin/master` HEAD: `e660bda2`, 2026-04-14, `"Release 1.11.0 #1"` — `MARKETING_VERSION = 1.11.0` in the checked-out `.pbxproj` confirms this really is the current shipped version.
- `origin/develop` HEAD: `2eeb9b76`, 2026-09-01 — 15 real commits ahead of `master` (unreleased feature work, most recently an auth refactor).
- `master` also has **60 real commits not on `develop`** — mostly `Merge branch 'develop' into staging` / `Merge branch 'staging'` commits and version-bump/release commits (`Release 1.9.0 #2/#3/#4`, `Release 1.7.0 #1/#2`, etc.).

**Real conclusion**: this repo's actual release train is `develop → staging → master`, and `master`'s tip is the genuinely current, shipped production state — the opposite relationship from `android-intercom-oskey-io`, where `develop` was the more-current branch and `master`/tags lagged behind it. **Recommendation: pin `ios-oskey-dev` to `branch: "master"`**, not `develop` — unlike Android's placeholder choice (chosen only to unblock, explicitly flagged as not reflecting real release semantics), this one is backed by real evidence that `master` *is* the release-representative branch.

**Real, separate tag-naming problem, confirmed a second time in this project**: `git tag --sort=-v:refname` ranks `v1.7.0` (a legacy `v`-prefixed tag) **above** `1.11` (the real latest, matching `master`'s own `MARKETING_VERSION`) — the exact same "naive tag-sort breaks on inconsistent naming" failure mode already found and documented for `android-intercom-oskey-io` (`04-task1-challenge-trigger-assumption-and-branch-tag-open-question-2026-09-08.md`). Real tag inventory shows at least 3 competing conventions in this one repo: `v1.7.0`/`v1.6.0` (v-prefixed), `release_2025012101`/`release_20250206` (date-based), and `1.11`/`1.9.0`/etc. (bare semver, plain, no `.0` on the two-part `1.11`). **Also real: no tag points at `master`'s current tip commit at all** (`git tag --points-at origin/master` returns empty) — the nearest tag, `1.11`, sits 60 commits behind the tip. This means tag-based resolution isn't just messy here, it's currently impossible for the true latest state — another real, independent reason branch-pinning (`master`) is the right pragmatic choice over any tag-sort scheme, not just a Kotlin-specific quirk.

**Honest caveat, matching Android's own**: pinning to `master` is a real, evidence-backed default for unblocking the pipeline build, not a substitute for asking the actual iOS team whether `master`'s tip is genuinely what's live for 100% of users at any given moment (a staged/phased rollout could exist the same way Android's open question raised). Not resolved here — flagged the same way Android's was.

## The 3 leaf packages: neither `master` nor `develop` is right — must pin by commit

Real, checked per repo:

| repo | `origin/master` HEAD | `origin/develop` HEAD | real latest tag |
|---|---|---|---|
| `swift-ble-kit-oskey-dev` | `52d8a7f`, **2025-01-21** | `62f5a9` (current) | `1.1.3` (== develop) |
| `swift-cloud-kit-oskey-dev` | `ceb3695`, **2025-01-21** | `1d1354e` (current) | `1.6.9` (== develop) |
| `swift-webrtc-kit-oskey-io` | `4114ba2`, 2026-08-10 (current) | *(no `develop` branch exists)* | `1.1.7` (== master) |

**Real, load-bearing finding**: for `swift-ble-kit-oskey-dev` and `swift-cloud-kit-oskey-dev`, `master` has not been updated since **January 2025** — over a year stale relative to `develop`, which stays current and always matches the real latest tag (0 commits between latest tag and `develop` HEAD for both). Pinning to `master` for these two would clone code more than a year older than what `ios-oskey-dev` actually ships. Pinning to `develop` would clone code that's *ahead* of what's integrated (post-1.1.3/1.6.9 unreleased work) — not wrong in the same disastrous way, but still not what `ios-oskey-dev` actually depends on today.

**Decision, directly implementing `01-multi-repo-architecture-methodology-fit-2026-09-09.md`'s nuance #1 recommendation**: pin all 3 leaf packages by **exact commit SHA**, matching `ios-oskey-dev`'s own real, authoritative `Package.resolved` pins (see `02-...md` §3-4), not by branch at all. `pipeline/android-intercom-oskey-io/phase-01-ast-extraction/00-scan-repo.ts` already supports this — `config.repos.json` entries take exactly one of `branch` or `commit` (`hasBranch`/`hasCommit` mutual-exclusivity check, lines 144-148 of that script) — no pipeline-code change needed, just the config choice:

| repo | pinned commit | corresponds to real tag |
|---|---|---|
| `swift-ble-kit-oskey-dev` | `f8cdf1995ef94103991ba784d4e6e67dda4f1232` | `1.1.1` |
| `swift-cloud-kit-oskey-dev` | `32772e4af35e26be987ff132e248e34bb928e76b` | `1.6.8` |
| `swift-webrtc-kit-oskey-io` | `e8aeea9d4cc1333c007440137df9c1d915917881` | `1.1.6` |

**Honest caveat**: this pin will go stale the moment `ios-oskey-dev` updates its own `Package.resolved` (e.g. picks up `1.1.3`/`1.6.9`/`1.1.7`) — whoever re-runs extraction later should re-read `ios-oskey-dev`'s real `Package.resolved` first and update these 3 commits to match, rather than trusting this doc's snapshot indefinitely. This is a real, ongoing maintenance cost of the package-dependency-pinned shape `01-...md` §"Version-pin consistency" already flagged as new for this project.

## Applied to `config/repos.json`

Reflected directly in the 4 new entries added this session — see `config/repos.json` and its own inline `_note`/`_note_branch` fields on each entry for the same reasoning, kept close to the config so a future reader doesn't have to cross-reference this doc just to see what was chosen.
