# Investigation prompt: why Swift/iOS repos lack Phase 1's structural knowledge-pipeline

Hand-off prompt for a new session, drafted 2026-09-20. Not yet dispatched/run as of writing
this file. Persisted per this project's own discipline (write real findings/hand-offs to
files as they happen).

---

Investigate why `ios-oskey-dev` and all 4 Swift repos (`swift-cloud-kit-oskey-dev`,
`swift-ui-kit-oskey-dev`, `swift-webrtc-kit-oskey-io`, `swift-ble-kit-oskey-dev`) lack the
Phase 1 structural knowledge-pipeline scripts (`04-build-resolved-graph.ts` through
`07-build-intra-module-coupling-graph.ts`) that `firebase-oskey-dev`,
`angular-app-oskey-io`, `node-iot-api-oskey-io`, and `android-intercom-oskey-io` already
have, and scope what it would take to close the gap. INVESTIGATE ONLY — no building, no
fixing. Real spend only if genuinely needed to check something and explicitly flagged
first; expect this to be mostly free (git history + code reading + read-only Postgres).
Never git add/commit unless explicitly asked.

## Real context (don't re-derive)

Confirmed directly, 2026-09-20, during
`governance/roadmap/dynamic-pipeline-architecture/13-findings-hierarchical-routing-
investigation-2026-09-20.md`: `find pipeline -iname "*phase-01-ast-extraction*"` for
`04-build-resolved-graph.ts` shows it present for `firebase-oskey-dev`,
`angular-app-oskey-io`, `node-iot-api-oskey-io`, `android-intercom-oskey-io`, and absent for
`ios-oskey-dev` and all 4 Swift repos. This is a newly-discovered gap (not a prior
deliberate deferral like the earlier signalling/WebSocket integration-call decision from
this same initiative) — see project memory
`project_ios_swift_missing_structural_aggregation.md` for the full record of what's already
confirmed; re-verify rather than trust it blindly, since memories are point-in-time.

Doc 13 also confirmed these scripts produce real, current, free (no LLM/embedding cost,
regenerates on every extraction run) structural aggregates for the repos that have them:
resolved call graphs, cross-module dependency edges, API entry points, RBAC requirements,
shared Firestore touch points, pub/sub routing tables — all pure AST-derived, written to
`output/runs/<repo>/<runId>/knowledge-pipeline/` on local disk, not embedded or in Postgres.

## What to investigate

1. **Why the gap exists — check real git history, don't assume either "oversight" or
   "deliberate."** When were `04-07` first added, and for which repo(s) first? When was
   Swift/Kotlin AST extraction (the `swift-extractor`/tree-sitter-kotlin work) added
   relative to that? If Swift/Kotlin extraction predates or is contemporaneous with `04-07`,
   that's different evidence than if `04-07` was built well before Swift/Kotlin support
   existed and simply never got backported. Check commit dates for both, not just file
   presence.

2. **What `04-07` actually depend on — read them for one working repo (suggest
   `firebase-oskey-dev`, most-referenced in this project's history).** Do they depend on
   TS-specific data shapes from that repo's own Phase 1 extraction (e.g. ts-morph AST node
   types, TS-specific import/call resolution), or on a genuinely repo-agnostic input shape
   any extractor could in principle produce? This determines whether porting to Swift/Kotlin
   is a real rewrite or a smaller adaptation. Also check: are `04-07` shared/reusable code,
   or bespoke per-repo scripts (doc 13 already found phase-02's own artifact-builders are
   bespoke per-repo — check directly whether Phase 1's `04-07` share that same anti-pattern,
   since it directly affects the real cost of building 5 more).

3. **Real, important scoping question: does `cross_repo_edges` (the live Postgres table,
   17,195 rows, confirmed in doc 13) depend on this same `04-07` pipeline stage, or is it
   populated by a separate mechanism?** Check directly (read whatever script actually
   writes to `cross_repo_edges`, and check if it's fed by `04-07`'s output or something
   else). This matters because if `cross_repo_edges` is independent, Swift/iOS's real,
   already-existing edges in that table are unaffected by this gap — the gap would be purely
   about local/intra-repo-family structural richness (call graphs, RBAC tables), not
   cross-repo evidence expansion. If `cross_repo_edges` genuinely depends on `04-07`'s
   output, that changes the real stakes of closing this gap considerably (it would mean
   Swift/iOS's cross-repo edges are systematically weaker/absent too, not just their local
   structural richness) — check which is true, don't assume either way.

4. **Real scope/cost estimate for closing the gap** (not a build — a scoped estimate only):
   roughly how much work per repo to build `04-07` equivalents for the 5 missing repos,
   given what's found in (2)? Is this one shared effort (if `04-07` is genuinely
   repo-agnostic) or 5 separate bespoke builds (if it's the same per-repo-bespoke pattern
   phase-02 has)? Real, honest uncertainty is a fine answer here if the code doesn't make it
   obvious either way.

5. Report findings clearly — this doc's job is to inform a future decide-stage session on
   whether closing this gap is worth the real cost found in (4), not to make that call here.

Write findings to `governance/roadmap/dynamic-pipeline-architecture/20-...` (or the next
available number if others have landed since this prompt was written).
