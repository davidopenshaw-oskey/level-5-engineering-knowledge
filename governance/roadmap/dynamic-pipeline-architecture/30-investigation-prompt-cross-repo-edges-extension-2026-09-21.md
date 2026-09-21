# Investigation prompt: extending cross-repo edge building past Angular↔Firebase

> **Status update 2026-09-21: this prompt was run; results are in
> [31](31-findings-cross-repo-edges-extension-scope-2026-09-21.md), and the follow-on build plan
> is [38](38-build-plan-cross-repo-edges-four-joins-2026-09-21.md).** The "not yet dispatched"
> line below is the original status at drafting time. Two of this prompt's hypotheses were
> refuted by doc 31 (android-intercom as pubsub-shaped "Category 1"; the iOS join needing
> UIKit/system-framework filtering and disambiguation). Its "(a) bounded vs (b) pilot" question
> was answered (a), and the scope turned out wider than one join (four).

Hand-off prompt for a new session, drafted 2026-09-21. Not yet dispatched/run as of writing
this file. Persisted per this project's own discipline (write real findings/hand-offs to
files as they happen).

---

Investigate the real scope of closing the cross-repo graph gap found in
`governance/roadmap/dynamic-pipeline-architecture/29-findings-cross-repo-edges-scope-gap-2026-09-21.md`,
toward a real build — but **INVESTIGATE AND DECIDE ONLY in this session; do not build**, per
this project's own investigate → decide → build session-scope discipline (see docs 09→10→11
and 19→20→21→22 in this same folder for the established pattern). Real spend only if
genuinely needed to check something and explicitly flagged first before running; expect this
to be mostly free (Postgres reads + code reading). Never `git add`/`git commit` unless
explicitly asked.

## Real context (don't re-derive)

Doc 29 found, directly from Postgres and from reading
`pipeline/facts-postgres-index/build-cross-repo-edges.ts`:

- `cross_repo_edges` has 17,195 real rows; **99.2% are same-repo**. The only real cross-repo
  edges are `angular-app-oskey-io → firebase-oskey-dev` (110, a deterministic AST-derived
  join on Firebase's `api_contract`/`callableExportName` facts) and exactly **one** manually
  human-confirmed `node-iot-api-oskey-io → firebase-oskey-dev` PUBSUB_TOPIC_BINDING edge.
- Zero edges exist for `android-intercom` ↔ `firebase`/`node-iot`, `ios-oskey-dev` ↔
  `firebase`/any of the 4 `swift-*-kit` repos, or `node-iot` ↔ `android-intercom` — every one
  a real, expected dependency in the actual system.
- Two different real categories of gap, not the same fix: **Category 1** (genuinely not
  AST-derivable — e.g. the pubsub topic→subscription binding, which lives entirely in GCP
  config outside both repos' source) vs. **Category 2** (genuinely resolvable, just never
  attempted — confirmed directly: `ios-oskey-dev` already has 316 real `imports_dependency`
  facts literally naming `OSKCloudKit` (118), `OSKUIKit` (176), `OSKBluetoothLEKit` (18),
  `OSKWebRTCKit` (4) — the same shape of real, extracted symbol name
  `build-cross-repo-edges.ts` already joins on for Angular→Firebase).
- This gap directly explains why 5 real dummy-PRD test runs against these repos (documented
  same day, `output/agent-runs/prds/test/2026-09-21-*` and `2026-09-20-*`) never surfaced a
  single cross-repo citation via `walk_cluster`/`get_graph_neighbors` — not a retrieval bug,
  a real graph-data gap.

## What to investigate

1. **Confirm `android-intercom-oskey-io`'s real shape before assuming it's Category 2 like
   iOS.** Checked directly in this project's own earlier queries: `android-intercom-oskey-io`'s
   Kotlin-kit-named modules (`kotlin-ble-kit-oskey-io`, `kotlin-webrtc-data-oskey-io`,
   `kotlin-webrtc-domain-oskey-io`, `kotlin-usb-oskey-io`) are **modules within the same repo**,
   not separate git repos the way iOS's Swift kits are — so Android-intercom likely has no
   iOS-style "import a sibling repo's package" gap to close via a Category-2 fix. Its real
   cross-repo needs are probably `firebase`/`node-iot`-facing (pubsub-shaped, likely
   Category 1) instead. Verify this directly, don't assume — check Android-intercom's real
   `imports_dependency`/`api_contract`/external-hook facts for anything that *does* name
   `firebase-oskey-dev` or `node-iot-api-oskey-io` symbols, resolvable or not.

2. **Check whether the one real `node-iot → firebase` edge was reachable but simply never
   anchored**, a smaller, separate question doc 29 flagged but didn't check. Look at the real
   debug trace `output/agent-runs/prds/test/debug/2026-09-21-002-1d-pubsub-edge-device-api/`
   (the dummy PRD built specifically around this pubsub flow): did any capability's gathered
   evidence include the specific `pubsub_publish_call`/`processPubSubMessage` facts that real
   edge connects? If yes, why didn't a `walk_cluster`/`get_graph_neighbors` call ever anchor on
   either side of it? If no, that's itself worth noting (the relevant facts never surfaced via
   `search_facts` in the first place, a retrieval question, not a graph one).

3. **Real scope for a Category 2 build: iOS ↔ Swift-kit edges.** This is the concrete build
   candidate — investigate what it would actually take, don't just assume it mirrors
   Angular→Firebase's shape exactly:
   - What real fact *kind* on the Swift-kit side would a join target? Angular→Firebase joins
     against Firebase's own `api_contract` facts (a kind that represents an externally-callable
     surface with a clean `callableExportName`). Do the 4 Swift-kit repos have an equivalent
     "this is the real, externally-visible symbol this package exports" fact kind, or does the
     join need to target something else (e.g. `source_class`/`struct_declaration`/
     `exported_symbol` at the kit's own module root)? Check the Swift-kit repos' own extracted
     fact kinds directly before assuming symmetry with the TS-repo join.
   - Is the real join key as clean as `module::handlerName`, or messier for Swift (e.g. does
     `import OSKCloudKit` resolve unambiguously to one real target, or could a bare package
     import need disambiguation the way Angular's `functionName` needed a module prefix to
     avoid the real `removeInhabitantFromUnit`/`getAllOrganizations` collisions
     `build-cross-repo-edges.ts`'s own header describes)?
   - Real, honest count: how many of the 316 real iOS `imports_dependency` facts would
     plausibly resolve to a real target vs. stay genuinely unresolved (e.g. a bare `import
     UIKit`/system framework import that isn't one of the 4 OSK kits at all — the sample
     pulled in doc 29 already shows `UIKit`/`OSKEY` mixed in among the real `OSKCloudKit`/
     `OSKUIKit` hits, so real filtering is needed, not a blanket join).

4. **Scope, don't build, a decide-stage recommendation**: given what's found in (1)-(3), is
   extending `build-cross-repo-edges.ts` with an iOS↔Swift-kit join (a) a clean, bounded,
   single build task comparable in size to the existing Angular→Firebase join, or (b)
   meaningfully messier and worth a smaller pilot (e.g. just `OSKCloudKit`, the highest-volume
   kit) before committing to all 4? Real, honest uncertainty is a fine answer if the data
   doesn't make it obvious either way — this session's job is to produce that real scoping,
   not to guess at it or start building from a hunch.

5. Report findings clearly, written to a new doc
   (`governance/roadmap/dynamic-pipeline-architecture/31-...` or the next available number if
   others have landed since this prompt was written) — this doc's job is to inform a real,
   separate decide-stage build-plan session on whether/how to close this gap, not to make that
   call or start building here.
