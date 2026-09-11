# Cross-Repo Dependency Graph Artifact — Deliberately Deferred to P2, 2026-09-10

Real decision record, not a build doc — no code was written for this. Follows directly from `17-task12-followup-imports-dependency-resolution-2026-09-10.md`'s own "explicitly not done" note, which flagged that a real cross-*repo* dependency-graph artifact (as opposed to `06`'s existing within-repo view) didn't exist yet.

## What was found before building anything

Before writing a new script, checked why the project's own prior cross-repo tooling (`pipeline/cross-repo-synthesis/phase-03-ecosystem-topology/06-build-cross-repo-graph.ts`) was archived 2026-09-09 (`archive/README.md`'s own note). Real reason: **not** that cross-repo graphing was a bad idea, but that it was superseded by a different, still-active pattern — `pipeline/facts-postgres-index/build-cross-repo-edges.ts`, which computes real cross-repo edges (`HTTP_API_CALL`, `PUBSUB_TOPIC_BINDING` today) by querying a shared Postgres `facts` table that every repo's own facts get synced into (`sync-facts.ts`), rather than reading on-disk `facts/*.json` per repo. The old script's explicit reason for being retired: reading live Postgres facts is "more current" than on-disk JSON.

**Real consequence for this task**: building a new on-disk, `06`-style script for Swift's own cross-repo import edges (`resolvedTargetRepo`/`resolved_cross_repo`, from `17-...md`) would have reintroduced the exact architectural pattern this project already retired once, for the same reason. The correct, consistent path is instead: sync Swift/`ios-oskey-dev` facts into the same Postgres `facts` table (a real P2 step, `sync-facts.ts`, that has never been run for this family — Swift has been P1-only this entire session), then add a new `connection_type` (e.g. `SWIFT_MODULE_IMPORT`) to `build-cross-repo-edges.ts`, reading `kind = 'imports_dependency'` facts where `payload->>'importResolutionStatus' = 'resolved_cross_repo'` — genuinely simpler than that script's existing joins, since Task 12's own fix already does the real resolution at extraction time; this would be a straight read-and-insert, no new join logic needed.

## Real decision, 2026-09-10

**Put to the user directly, given the real architectural fork above.** Decision: **stop at P1.** No cross-repo dependency-graph artifact is being built now, on-disk or Postgres-based. The `imports_dependency` fix in `17-...md` (real `resolvedTargetModule`/`resolvedTargetRepo`/`importResolutionStatus` values, no longer a permanent placeholder) is the real P1 deliverable and stands complete on its own — `06`'s existing within-repo view already benefits from it (the real `OSKEYTests` -> `iOS App` edge, `17-...md`).

**Why this is the right call, not just a punt**: matches this project's own established P1/P2 phase boundary (the same boundary this whole session's "close the repos before moving on" sequencing decision, 2026-09-10, was built around) and this document's own header type discipline (real findings written down before scope drifts). Building either version now would have meant working ahead of Swift's own real P2 onboarding, which hasn't been scheduled.

## Real, concrete next step, whenever Swift's own P2/Postgres work is scheduled

Not a task list to start now — a pointer for whoever picks this up later:

1. Run `sync-facts.ts` for `ios-oskey-dev` and the 4 leaf packages (per-module, matching its existing `REPO_NAME`/`MODULE_NAME` env-var convention) — first confirm `05-partition-capability-packs.ts`'s own Swift output actually includes `imports_dependency` facts in its capability packs (not verified in this pass).
2. Add a new `connection_type` value to `cross_repo_edges` (`SWIFT_MODULE_IMPORT` or similar) and a new query block in `build-cross-repo-edges.ts`, modeled on its existing `HTTP_API_CALL` block but simpler — the join is already done (`resolvedTargetRepo`/`resolvedTargetModule` are real fields on the fact itself), this would just be a read-and-insert.
3. Real, already-available data to seed it: 316 real `resolved_cross_repo` facts in `ios-oskey-dev`'s own last run (`17-...md`), naming `swift-ble-kit-oskey-dev`/`swift-cloud-kit-oskey-dev`/`swift-ui-kit-oskey-dev`/`swift-webrtc-kit-oskey-io` as real targets.
