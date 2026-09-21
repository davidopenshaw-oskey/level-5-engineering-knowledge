# Session hand-off — 2026-09-21, ahead of a machine reboot

Written because the machine is rebooting shortly and this session's conversation history may
not survive it. Two real, substantive things exist only in this conversation right now and
are captured here so nothing is lost. No code changed, nothing built, no git add/commit — this
is a discussion-mode session throughout, per the user's own "challenge, suggest, discuss"
framing.

**Read order for the next session**: this doc, then `35-collated-action-plan-2026-09-21.md`
(§2d specifically), then `31-findings-cross-repo-edges-extension-scope-2026-09-21.md` if the
cross-repo-edges decision below is picked up.

## 1. Open decision: `screen_fact_links` table — design synthesis, not yet decided

> **Refined 2026-09-21, see `governance/roadmap/ux-mappings/01-screen-map-enrichment-discussion-2026-09-21.md`:** the shared-table idea stands, but keying on `fact_ref` alone is wrong for enrichment (measured: 0.5% direct hits vs 24% by file containment). The join should be on `(repo, file)`. The reasoning below is kept as written.

Context: three real reference files exist (`governance/reference-docs/pubsub.bindings.staging.json`,
`screen-map-angular-features.json`, `screen-map-ios.json`), backed by three real, already-built
extraction scripts in `pipeline/facts-postgres-index/` (`extract-screen-map-angular.ts`,
`extract-screen-map-ios.ts`, `extract-screen-map-android.ts` — the last one not yet read/discussed,
explicitly deprioritized by the user: "not yet decided because the other repo (end user app and
intercom gap) is being investigated now").

Both read scripts (Angular, iOS) are real, idempotent, merge-aware: they read live Postgres,
merge into the existing JSON preserving any human-filled `screenName`/`description`, and loudly
flag (not silently drop) entries that no longer match live data. **Neither writes to Postgres
today** — both are Postgres-read → local-JSON-write only.

**Recommendation reached in this session** (not yet challenged/confirmed by the user):
one shared `screen_fact_links(fact_ref, repo, screen_name, description, source_file, extra JSONB)`
table, not separate per-platform tables — `repo` as the disambiguator (not `platform`, since
multiple real iOS/Android repos exist). Reasoning: the platform-specific complexity (Angular's
route+submodule+`angular_component`-kind disambiguation vs. iOS's direct symbol+kind match) lives
in the *extraction script*, which was always going to stay separate per platform regardless of
storage shape — once each script resolves down to a `fact_ref`, what it writes is identical.
Neither script currently selects `fact_ref` at all (they key on `symbol_name`/`route`); adding it
to each script's `SELECT` is the concrete small gap, not a redesign. Angular's real asymmetry: 15
of its 59 routes have no matched component and so have no `fact_ref` to write yet (nullable, or
just not written until one exists) — not a reason to split Angular into its own table shape.

**Not decided**: whether to actually build this. The user has stayed in "discuss, challenge,
suggest" mode throughout ("no not yet", "it is early days in investigation"). Next session should
not build `screen_fact_links` without an explicit go-ahead.

## 2. Open decision: cross-repo-edges build sequencing (§2d of doc 35)

Doc 31 found four independent, real, buildable cross-repo-edge opportunities (table below,
detail in doc 31 itself). This session proposed a build order; **the user had not yet responded
to it when the reboot warning came in** — treat this as a live, unanswered question, not an
agreed plan.

| # | Edge | Join type | Risk/size |
|---|---|---|---|
| 1 | iOS↔Swift-kit | `call_expression.declarationRepo`/`declarationFile` | Small, clean, 100% match on checked subset |
| 2 | iOS→Firebase (via `swift-cloud-kit`) | existing Angular→Firebase join, widen repo filter only | Cheapest, zero new join logic, 71% match |
| 3 | android-intercom→node-iot | new: HTTP path-template + method match | New join type, small scope (5 call sites) |
| 4 | pubsub bindings (topic→push-endpoint→route) | new: live `gcloud pubsub subscriptions list` + host/path match | New join type; needs a live-query step in the pipeline |

Proposed order and why: **(2) first** (smallest diff, reuses proven code) → **(1) next** (bounded,
do all 4 Swift kits in one pass per doc 31's own recommendation, not a single-kit pilot) →
**(4) after that** (simple join logic, but introduces a new *kind* of dependency — a live
`gcloud` call as part of the pipeline; needs a separate decision on one-off vs. scheduled re-fetch)
→ **(3) last** (smallest current payoff, newest join shape).

All four are Postgres-read + code-build, zero LLM/embedding spend. Item 4's live `gcloud` query
is free and read-only but touches an external system (flagged, not buried).

**Next session should ask the user**: does this sequencing match their priorities, or does
upcoming node-iot/android-intercom work argue for reordering (3) sooner? Then, only on explicit
go-ahead, proceed to build — this has not been authorized yet.

## Explicitly not done in this session

No files edited except this one. No `cross_repo_edges` rows written, no `screen_fact_links` table
created, no changes to any extraction script. Both open items above are analysis/recommendation
only, pending the user's decision.
