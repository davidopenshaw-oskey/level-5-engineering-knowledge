# Build plan: closing the cross-repo edge gap (four joins)

Decide-stage doc, written 2026-09-21. **Nothing built.** No code edited, no `cross_repo_edges`
rows written, no git add/commit. Follows the investigate → decide → build pattern: docs
[29](29-findings-cross-repo-edges-scope-gap-2026-09-21.md) (gap found) →
[30](30-investigation-prompt-cross-repo-edges-extension-2026-09-21.md) (investigation prompt) →
[31](31-findings-cross-repo-edges-extension-scope-2026-09-21.md) (real scope) → this plan.
Related: [35](35-collated-action-plan-2026-09-21.md) §2d,
[36](36-session-handoff-2026-09-21.md) §2 (an earlier, unconfirmed build order, revised below).

---

> **Pending user decision, added 2026-09-21 (validator session): hub payload size.** Measured
> in this doc's **Build log, "Stage B" entry, "Hub measurement" paragraph (~line 675)**, and
> independently reproduced by the validator: `findGraphNeighbors(OSKUIExpanded)` = 85 rows /
> 35,071 bytes; `walkBoundedCluster` = 80 members + 164 edges (85 unique) / 73,491 bytes,
> `truncated: true` (cap hit at depth 1, 6 of 85 callers cut arbitrarily). The `get_graph_neighbors`
> tool returns the result uncapped. Nothing was changed (report only). Options: (1) do nothing;
> (2) de-duplicate walk edges, lossless (validator's recommendation, a small separate
> traversal-code task); (3) summarise hubs (count plus sample); (4) hard cap. Also pending: whether
> to spend a real agent run to see if hub size hurts in practice. **The build session is not
> blocked on either.**
> **Update (validator session, after reading the third session's note at Build log
> "Validator note on Stage B's hub measurement", ~line 699):** the 35,071-byte figure is raw
> edge rows. The tool the agent actually calls returns neighbour descriptions too, **57,254 bytes
> (~14k tokens)** for the hub; the 73,491-byte walk figure stands. A walk from any iOS call site
> with a kit edge is ~30x heavier at the median than before Stage B. Hubs are not new (Firebase
> `logError` 534 incoming, `logInfo` 281, all followed by traversal), and the 148 real
> `walk_cluster` calls in existing traces were never truncated. That note's suggested order
> supersedes the validator's earlier "de-duplicate now": test with a before/after re-run of the
> 1c dummy PRD (LLM spend, needs the user's go-ahead, preferably after Stage C) and only then
> choose between "include the hub with its count but don't expand through it" and lossless
> edge de-duplication.
> **Operating rule after any facts sync (validator, 2026-09-21; refines a peer session's
> "rebuild PACKAGE_SYMBOL_USE after an iOS or kit sync").** A `resolved`/`confirmed` edge whose
> source or target fact disappears makes `walkBoundedCluster` throw. That applies to every slice
> that repo touches, not only `PACKAGE_SYMBOL_USE`: after syncing a repo, immediately re-run
> `build-cross-repo-edges.ts` (`--dry-run` first; all five joins are idempotent and
> compute-first) **and** that repo's `build-intra-repo-edges.ts` (Firebase and Angular have
> followed `confirmed` intra edges: 2,341 and 282). If the shrink guard refuses because the sync
> really removed call sites, read the printed diff, then use `--accept-shrink`. The script's
> coverage summary flags dangling and stale slices after each run, but nothing stops a walk from
> throwing between a sync and the rebuild. Until the edges entry point (P4) is decided, this is a
> manual habit.
>
> **Pending user decision #2, added 2026-09-21 (validator, after Stage E): the missing
> `handler → publishConfig` hop.** Stage E built 17 `FIRESTORE_EVENT_TRIGGER` edges and the
> chain `door-add / intercom-message call → ConfigController.save → onDocumentCreated/Updated`
> is traversable, but the next hop, the handler calling `publishConfig`, has **no edge**, so a
> walk stops at the handler. The build session suggested re-running `build-intra-repo-edges.ts`
> for Firebase. **The validator checked and that will not fix it**: the input graph
> (`output/runs/firebase-oskey-dev/20260911_080454-00e1d9fd/knowledge-pipeline/resolved-engineering-graph.json`)
> has 0 edges targeting `publishConfig` (it holds 2,222 confirmed cross-module + 119
> confirmed intra-module edges; 1,550 same-module service calls are simply not edges). Options,
> all outside this build: (a) fix the upstream resolved-graph builder so those calls become
> edges; (b) derive same-repo call edges directly from resolved `call_expression` facts (the
> way Stage E reads write calls); (c) leave it. Related close-out item for the build session: a
> report of base-controller methods that are neither in the write-wrapper table nor known
> readers, so a newly added wrapper shows up instead of silently lowering coverage.
>
> **Agreed in principle, deferred until the build prompt finishes cleanly (user, 2026-09-21;
> discuss before running anything; each run needs an explicit go-ahead).** Re-running 1c as a
> Stage B test is *not* planned: its 14 graph calls returned 2,392 bytes in total (all 8
> `get_graph_neighbors` empty), its anchors are `inhabitantType` facts, not iOS calls into the
> kits, and the third session's replay showed byte-identical graph results, so a re-run would
> show LLM noise, not the new edges. Planned instead: **(2)** one new question that anchors on
> the new kit edges (e.g. iOS unlock/Bluetooth flows into the BLE kit, or iOS cloud-kit
> callables), read for hub payload size and anchor choice, not citation counts; it has no
> "before" baseline, so a baseline would need the `PACKAGE_SYMBOL_USE` slice temporarily
> removed and restored (reversible via the script and the backup; needs explicit approval); and
> **(4)** the existing **1d** run (`2026-09-21-002-1d-pubsub-edge-device-api`) as the before/after
> for Stages C/D1. 1c reference numbers for the record: `gemini-3.5-flash`, 42 turns, 882 s,
> 372,611 in / 2,415 out / 6,680 thought tokens, about $0.64. Each new run is about
> $0.60 to $0.70; check the Vertex quota first.

# AUTHORITATIVE BUILD SPEC (2026-09-21): read this; the rest of the doc is history

Consolidates the original plan, the live-verification block and doc 39's findings. **Where
anything below this section conflicts with it, this section wins.** **Amended 2026-09-21 by
five user decisions** (Stage E: no `probable`, resolved edges to both create and update
handlers; Stage C: Apigee-confirmed prefix and a strict wildcard rule; Stage B: measure hub
output, report only; staleness rule corrected to cover dangling sources on resolved edges;
edges entry point and the 153-edge cleanup stay out of this build). Where the amendments and
the stage text differ, the amendments win; they are folded into the stage text below. The build session's prompt
is [prompts/prompt-4-cross-repo-edges-build.md](prompts/prompt-4-cross-repo-edges-build.md).
It **supersedes** `prompts/prompt-1-generalize-cross-repo-edge-builders.md` ("Layer 1"), which
was never run (no `02-…` findings doc exists; `build-cross-repo-edges.ts` is unchanged since
the `wip` commit). Docs 04/05 already named android→node-iot and iOS→Firebase as Layer 1's
real test targets, so Stage 0 + A + C below *are* Layer 1.

**Scope decided by the user, 2026-09-21:** all four cross-repo joins (A, B, C, D), **plus
Firestore-trigger edges (E)**. Out of scope: building settings / Remote Config, and
`build-form-field-lineage-edges.ts`'s `FIELD_BINDING` generalization (prompt-1's other half;
`FIELD_BINDING` rows must be left untouched).

**Assumed defaults for the §3 decisions (the user did not override them when scope was
decided; the build session should treat them as settled unless told otherwise):**
1. Order: **0 → A → B → C → D1 → E → (gated) A2, D2**.
2. New connection types: **`PACKAGE_SYMBOL_USE`** (B) and **`FIRESTORE_EVENT_TRIGGER`** (E;
   the name already appears in `schema-proposal.sql`'s comment). A and C reuse `HTTP_API_CALL`;
   D reuses `PUBSUB_TOPIC_BINDING`.
3. Pubsub input: the saved snapshot `governance/reference-docs/pubsub.bindings.staging.json`.
   No live `gcloud` in the pipeline (a scheduled re-fetch needs its own ADR, later).
4. One script (`build-cross-repo-edges.ts`) restructured into join functions with a
   `--join=` flag and a shared scoped-replace helper.

## Stage-by-stage spec

Every stage: build, run, compare with the Stage 0 baseline, **append the real numbers to this
doc's `## Build log` section (end of doc)**, stop for validation. No new numbered docs.

**Stage 0: safety net and refactor (no new edges).**
- Back up the table first: `pg_dump -t cross_repo_edges` into `output/backups/` (gitignored).
- Baseline (verified live 2026-09-21, 17,195 rows), save as
  `38-baseline-cross-repo-edges-before-2026-09-21.json`, grouped by
  `(connection_type, source_repo, target_repo, resolution_status, provenance)`. Key groups:
  `HTTP_API_CALL angular→firebase resolved 97`, `HTTP_API_CALL angular→unknown unresolved 5`,
  `FIELD_BINDING angular→firebase resolved 13` (**not this script's; must not change**),
  `PUBSUB_TOPIC_BINDING firebase→unknown unresolved 14`, `node-iot→unknown unresolved 1`,
  `node-iot→firebase resolved 1`, `INTRA_REPO_CALL` 17,064 across 8 repos.
- Fix the delete scope: replace must be per `(connection_type, source_repo)`, not per
  `connection_type` (today it deletes all `HTTP_API_CALL` rows). Discover repos from the data;
  no repo-name literals in the new/changed joins. Each join in its own transaction.
- **Acceptance:** re-running the refactored script reproduces the baseline exactly, also with
  `--join=` for a single join. Stop and find out why if not.

**Stage A: iOS→Firebase.** Source: `firebase_callable_call` facts from **any** repo (today
angular 102, `swift-cloud-kit-oskey-dev` 34). Same `module::callableExportName` compound key
and fail-closed duplicate check. Live result to expect: **24/34 resolve**. Of the 10 misses,
**3 are dead/superseded iOS code, correctly unresolved** (user-confirmed:
`organization-verifySmsOtpCode`, `user-approvePendingFriendRequest`,
`user-rejectPendingFriendRequest`), and **7 are an export-group alias miss** (client prefix
`unit`, Firebase module `unit_management`). Record all 10 as `unresolved` with the reason in
`details`. **Gated follow-up A2** (needs user go-ahead, it's an extraction-level design
choice): derive the export-group → module mapping from Firebase's `functions/src/index.ts`
(`export const unit = {...unitTriggers.getCallableFunctionTriggers…}`), which has no facts
today. Never a hand-typed alias table. With A2: up to 31/34.

**Stage B: iOS↔Swift-kit.** Source: `ios-oskey-dev` `call_expression` facts with
`resolutionMethod='resolved_via_import'` and `declarationRepo` ≠ own repo (**389**; by kit ui
222 / cloud 135 / ble 20 / webrtc 12). Repo and file come from the payload; the declared
symbol is the **leading identifier of `calleeExpression`** (`^\s*[A-Za-z_]\w*`; extracts for
all 389). Target: the fact in `(declarationRepo, declarationFile)` whose `symbol_name` equals
it, across declaration-like kinds (no hardcoded kind list). Ambiguity: 368 match one; **21
match a class/struct plus `extension_declaration`(s)**, so rule: prefer the non-extension; if
still not exactly one, `unresolved` with candidates in `details`. Unmatched goes `unresolved`
with `declarationFile` in `details` (a target-less edge is invisible to traversal, so never
emit it as resolved). Expect the 389 edges to land on only **72 distinct declarations** (hub
`OSKUIExpanded`: 85 incoming). Report max in-degree and distinct-declaration count.
Spot-check 3 resolved edges against real source (the `declarationFile` and the declaration
facts come from the same extractor, so 100% match is consistency, not proof).
**Hub measurement (user decision 2026-09-21, report only, add no cap):** `findGraphNeighbors`
has no `LIMIT` and `OSKUIExpanded` has ~85 incoming edges. After the build, call
`findGraphNeighbors` on that hub and run one `walkBoundedCluster` from a kit anchor; record the
row count and serialized size (bytes) of each in the build log. Don't call Stage B done until
those are recorded.

**Stage C: android-intercom→node-iot.** Source: `rest_endpoint_call` (5 facts, all
`OSKApiService.kt`; fields `evidence.httpMethod`, `evidence.path`). Target: node-iot
`route_definition` (18 facts) **[CORRECTED 2026-09-21 by the validator: each fact also carries
structured `evidence.method` and `evidence.httpPath`, all 18 agreeing with the packed string
(doc 39 §4 correction); the "packed only" claim below was the validator's error. The build
used the parse. **Decided 2026-09-21: switch to the structured fields as a small "Stage C
amendment" before D1, so D1's push-path matching reuses the same route reader.** Acceptance:
the C slice reproduces byte-identically (same 5 edges); preflight checks
`evidence.method` and `evidence.httpPath` exist; the packed `value` becomes a warn-only
cross-check]**: **method and path are packed into `payload.value`**
(`"GET /access-control-devices/:accessControlDeviceId/config"`); `evidence.path` is the source
file, so parse the string. Normalize `{x}` and `:x` to a wildcard segment. A route matches a
call when its segments are a **segment-aligned suffix** of the call's path and methods are
equal (this absorbs `/v1/iot`, `/v1` and no-prefix variants with no prefix list). Guards:
≥2 literal segments in the matched suffix; **a `{x}`/`:x` segment matches only another
wildcard segment, never a literal such as `pubsub`** (user decision 2026-09-21); anything
else, or more than one candidate → `unresolved` with the candidates in `details`. Expected:
5/5, no ambiguity.
**Gateway (user-confirmed 2026-09-21):** Android traffic goes via **Apigee**, which strips
the `/iot` prefix, so the match to node-iot's routes is correct. Every C edge's `details` and
`confirmed_via` carry: "reaches node-iot via Apigee, /iot prefix stripped; confirmed by the
product owner 2026-09-21; gateway config not in the indexed repos". **Optional future step
(log only, do not build):** export Apigee's proxy definitions (base path and target) so this
becomes deterministic, like the pubsub snapshot.

**Stage D1: pubsub, deterministic known edge.** Input: the bindings JSON (10 subscriptions:
7 push to node-iot, 1 push to Firebase `core-processPubSubMessage`, 1 scheduled function, 1
pull DLQ). Emit edges only where a fact exists on **both** ends: today that is
`accessControlDevice_activities` (node-iot publish → Firebase `pubsubPushReceiver` handler),
reproducing the existing edge with `confirmed_via` = the binding source and date. Keep
`CONFIRMED_PUBSUB_BINDINGS` as a cross-check until they agree. Record the other bindings as
`unresolved` with reasons. Key facts: the 4 node-iot push routes (`state`, `system-log`,
`access-log`, `access-command`) were **removed on purpose in node-iot `32e3d97`
(2025-09-26, CLD1-1209)** and the staging subscriptions are dangling; state that in `details`.
All data is **staging only**.

**Stage E: Firestore-trigger edges (same-repo, Firebase).** *Investigate first, then build
only if the coverage gate passes.* What exists: **28 `firestore_trigger` facts** (all
Firebase; `handlerResolutionStatus='resolved'` 28/28, `handlerExpression` and
`handlerDeclarationFile` present) but each has `firestorePath: "unknown"`; the resolved path
template lives in the **sibling `firestore_path_touched` fact at the same file:line**
(e.g. `/accessControlDevices/{deviceId}/configs/{configId}`, `resolved_constant`; 26 of the 42
path facts). The **writer side is thin**: only 42 path facts exist, `operation` is `null` for
most, and e.g. `ConfigController.save` (`_set(\`/accessControlDevices/${id}/configs\`, …)`) has
a `_set` call fact but **no recorded path argument**.
- E1: pair each trigger with its sibling path fact (file+line) and report how many of the 28
  get a usable path. E2: report how many writer methods (controller methods calling
  `_set`/`_delete`/`_update`/`set`/`add`/`delete` wrappers) have a derivable path.
- **Gate:** if writer-path coverage is too low to be meaningful, **stop and report**; the fix
  is an extractor change (record the path argument of the write wrappers), which needs user
  go-ahead. Don't fake the writer side by parsing clone source inside the join.
- If it passes: match writer collection path (wildcards normalized) to trigger path minus its
  last segment; edge from the **writer method fact → trigger handler fact**
  (`FIRESTORE_EVENT_TRIGGER`, `ast_derived`). **No `probable` status (user decision
  2026-09-21):** a trigger edge states "writing to this document path is configured to run
  this handler", a fact about code and config, not about runtime outcome. A `set` gets
  **`resolved` edges to both the create and the update handler**, with `details` =
  "fires as create if the document is new, as update if it exists"; a delete gets `resolved`
  to the delete handler. Reason: `findGraphNeighbors` only follows `resolved`/`confirmed`
  (`mcp-server/db/graph-traversal.ts:250,254`), so `probable` edges would be invisible to
  the agent and would fail the acceptance test below. **Do not change traversal code.**
  **Do not model "the intercom collected the document"**: the chain after the trigger
  (`publishConfig` → topic → node-iot → intercom `GET`) is separate edges, and two links are
  not built (D2 is gated; node-iot's store step has no edge). State that gap in the build log.
- **Ground truth to validate against** (verified on `staging`): configs written by
  `ConfigController.save` (callers: door-add `building_door_access_control_device.service.ts:122`;
  intercom communication `:660`, `:1461` via `_updateDeviceConfigWithMessage`, `:1738`) fire
  `onAccessControlDeviceConfigCreated/Updated/Deleted` → `OSKAccessControlDeviceConfigService`
  → `publishConfig`. Doc 39 §5b has the full chain. Acceptance: `findGraphNeighbors` from the
  `save` fact reaches the handler, and the handler reaches `publishConfig`.

**Gated, not to be built without user go-ahead:** A2 (above) and **D2** (Firebase → node-iot
for accesses / configurations / intercom-entries). D2 facts: Firebase's checked-in
`functions/.env` defines the 7 `OSK_PUBSUB_TOPIC_ACD_*` values (exactly the 7 node-iot push
topics), but only 3 are read in source (`access.controller.ts:71/75`,
`access_control_device_config.controller.ts:87/92`, `building_intercom.controller.ts:61/62`);
the publish facts there are `unsupported`/`partial`, so linking a publish fact to its env var
is an extraction-level step. The build session should *propose* the design (e.g. an idempotent
reference-JSON script like the screen-map ones) and stop.

**Close-out:** per-pair coverage summary at the end of the script's output (edges by
`(source_repo, target_repo, connection_type, status)` and any expected pair with zero edges);
update the stale comment in both `graph-traversal.ts` copies (line ~172, "four connection_types
that exist today"); decide whether to add the script to `package.json`; mark doc 36 §2 answered.
Real end-to-end re-test of a dummy PRD run costs LLM spend and is **not** part of the build.

**Out of scope but noted:** node-iot has zero `INTRA_REPO_CALL` edges (unexplained);
Angular's 5 unresolved callables (`organization-updateIntercomCommunication` absent from
Firebase; `getAllIntercomCommunicationService` vs deployed `getAllIntercomCommunication`);
`accessControlDeviceConfigs` (stale publish topic; asks whether it exists in prod/dev);
the retrieval gap on `external_hook` pubsub facts; prod/dev pubsub.

### Merge-robustness rules (added 2026-09-21 after review: "what breaks when a dev merges to staging?")

Repo names are not the risk (all discovered from data; the joins recompute from facts, and
never read `output/clones/`). The real risks, in order of seriousness:

1. **Edges are a derived table and nothing keeps them fresh.** Edge rows store `fact_id`s;
   `sync-facts.ts` deletes facts that disappear (line ~619) but never touches edges, and no
   `package.json` script runs any `build-*-edges.ts`. **Live proof today: 153 existing
   `INTRA_REPO_CALL` edges have a source fact that no longer exists** (swift-ui-kit 108,
   swift-webrtc-kit 37, swift-ble-kit 6, android-intercom 2), built 2026-09-11. The Swift kits
   were re-extracted 2026-09-20 (doc 22); **the 2 android-intercom rows are unexplained** (doc 22
   did not refresh android; its latest run is `20260918_154849-f2cac85f`).
   **Corrected wording (user, 2026-09-21; verified live):** all 153 have a **null target** and
   are `unresolved` (130) or `probable` (23), which traversal never follows, which is the only
   reason they're harmless today. **The earlier rule was incomplete: a dangling *source* on a
   `resolved`/`confirmed` edge also makes `walkBoundedCluster` throw**, because the walk
   reaches that source from its live target through the incoming query. Live count of dangling
   source on resolved/confirmed edges today: 0. **The new Stage B edges (and A, C, E) are
   exactly that case** once `ios-oskey-dev` (or the relevant repo) is re-synced without an
   edge rebuild. Rules: (a) the close-out coverage summary must report dangling **source
   and target** counts per `(connection_type, repo)`, **split by `resolution_status`**, and
   flag any repo whose newest `runId` is newer than its edges' `generated_at`; (b) each join runs **after** the relevant repos' latest sync and
   the build log records the `runId`s it ran against (index at spec time: firebase
   `20260911_080454-00e1d9fd`, node-iot `20260911_080505-a6cba122`, angular
   `20260911_092322-8345d222`, ios `20260920_165124-e660bda2`, swift-cloud-kit
   `20260920_165044-32772e4a`, android-intercom `20260918_154849-f2cac85f`); (c) **user
   decision, and **out of this build (user, 2026-09-21): keep it, and the cleanup of the 153,
   as proposals in the build log only; the user decides before the next `ios-oskey-dev`
   re-sync. Until then "re-sync a repo, then rebuild its edges" is a manual habit**:** add a single edges entry point (e.g. a
   `pipeline:edges` script running intra, cross and lineage builders in order) and wire it
   after the sync step, so a merge → re-extract → sync doesn't leave stale edges. Rebuilding
   the 153 dangling intra edges (re-run `build-intra-repo-edges.ts` for those 4 repos) is a
   separate, cheap follow-up to offer the user.
2. **Never delete-then-hope.** Compute the new edge set first; only replace a
   `(connection_type, source_repo)` slice if a **preflight** passes: the source and target
   fact kinds exist and required payload fields are present. If the new set is empty, or
   smaller than the existing slice, print the diff and **abort unless the run is given an
   explicit `--accept-shrink`**. This is what stops a silent extractor rename from wiping
   good edges on the next run.
3. **Extractor-contract literals are the one legitimate "hardcoding".** The joins depend on
   these names: `firebase_callable_call.evidence.functionName`,
   `api_contract.evidence.callableExportName` (+ `contractType='callable'`),
   `call_expression.evidence.{resolutionMethod='resolved_via_import',declarationRepo,
   declarationFile,calleeExpression}`, `rest_endpoint_call.evidence.{httpMethod,path}`,
   `route_definition.payload.value` (packed `"METHOD /path"` string), `external_hook`
   `evidence.type='pubsub_publish_call'` + `topicResolutionStatus`,
   `api_contract.evidence.pubsubPushReceiver`, `firestore_trigger` and
   `firestore_path_touched`. Put them in **one constants block** at the top of the script
   with a comment naming the extractor that owns each, and rely on rule 2's preflight to fail
   loudly if any goes missing. Do not scatter them.
4. **Heuristic thresholds are named constants with a comment, not inline magic:** ≥2 literal
   segments (C); prefer-non-`extension_declaration` (B); the leading-identifier regex (B).
   Their failure mode is safe (falls through to `unresolved`, never a wrong resolved edge).
5. **Snapshot input goes stale.** D1's bindings JSON is a moment-in-time copy of GCP
   config; every D1 edge's `details`/`confirmed_via` carries the snapshot's `extractedAt`,
   and a binding whose target route/handler no longer exists in the facts becomes
   `unresolved`, not dropped. **`CONFIRMED_PUBSUB_BINDINGS` is a hand-typed list**; once D1
   reproduces its one entry, remove it in a follow-up rather than keeping two sources.
6. **Stage E pairing by `file:line`** is safe only within one extraction `runId` (both
   facts come from the same run); pair within a run, and if two triggers share a line, treat
   as ambiguous and report it.
7. **Baseline numbers in this spec are as of the runIds above, not permanent.** Acceptance is
   always "matches the baseline captured at Stage 0 start, in the same DB state". If any
   repo is re-synced between stages, re-baseline before continuing.

**Validation (this session, after each stage):** independent SQL on `cross_repo_edges`
(counts by group vs baseline, `FIELD_BINDING` unchanged, no row with a target `fact_id`
missing from `facts`), one `findGraphNeighbors` call per new edge type, source spot-checks
against `output/clones/<repo>/` **on the branch in `config/repos.json`**, and a check that
no `git add`/`git commit` was run.

---

# Historical: original plan text and live-verification block (kept for reasoning)

> **Live verification results, added 2026-09-21 (Docker came back up after this plan was
> first written).** Stage 0's read-only checks were run; full detail in
> [39](39-findings-stage0-verification-cross-repo-edges-2026-09-21.md). The plan text below is
> the original; where it conflicts with this block, **this block wins**:
> - **Baseline**: the "110 Angular→Firebase" is 97 `HTTP_API_CALL` + 13 `FIELD_BINDING`
>   (different script; must stay untouched). Stage 0's baseline groups are per
>   `connection_type`. node-iot has zero `INTRA_REPO_CALL` edges (unexplained, not
>   investigated).
> - **Stage A is not a pure repo-filter widening.** 24/34 resolve; 7 of the 10 misses are an
>   export-group vs. module-directory mismatch (client prefix `unit`, Firebase module
>   `unit_management`, defined in Firebase's `functions/src/index.ts`, which has no facts).
>   Needs a dynamically extracted export-group → module mapping (up to 31/34), or accept 24/34.
>   The other 3 are real drift: iOS calls a commented-out callable (`verifySmsOtpCode`) and 2
>   callables absent from Firebase source (`approve/rejectPendingFriendRequest`).
> - **Stage B**: doc 31's 389/262/127 split is confirmed. The 127 complex callees all resolve by
>   leading identifier. The 21 ambiguous matches (5.4%) are all class/struct + `extension`, so
>   "prefer the non-extension declaration" settles them. The 389 edges hit only **72 distinct
>   declarations** (hubs: `OSKUIExpanded` 85 incoming).
> - **Stage C**: 5/5 `rest_endpoint_call` confirmed as the complete set. node-iot's
>   `route_definition` has method and path packed in one `value` string
>   (`"GET /access-control-devices/:id/config"`), not structured fields.
> - **Stage D** (corrected after inspecting the real clones in `output/clones/`, see doc 39
>   §5a): the 4 unmatched push routes are absent from node-iot's `staging` source, not just
>   from its facts. Firebase's 14 publish facts are 12 unsupported, 1 partial env-var, 1
>   resolved literal (`accessControlDeviceConfigs`, which does not exist in staging). The
>   earlier "14 env-var topics" was a misreading of a code comment. **Firebase's checked-in
>   `functions/.env` defines all 7 `OSK_PUBSUB_TOPIC_ACD_*` values, and they are exactly the 7
>   topics that push into node-iot**, so D2 is now deterministic (env var → value from the repo's
>   own `.env`, no `gcloud functions describe`, no naming guess). D2 remains an extraction-level
>   step (link a publish fact to the env var its getter reads), only 3 of the 7 env vars are
>   read by Firebase source, and it needs nothing new from GCP.
> - **Stage A**: the 3 unresolved of the reachable 31/34 (`verifySmsOtpCode`,
>   `approvePendingFriendRequest`, `rejectPendingFriendRequest`) are confirmed by the user as
>   dead / superseded iOS code, so they are correctly unresolved. 31/34 is every live call site.
> - **Build order** (§3.1) is unchanged by these results.

**Original caveat (now superseded by the block above)**: the Docker daemon was not running when
this plan was first written, so its Postgres numbers came from docs 29/31.

**Spend**: zero LLM/embedding spend for the whole build. Stage 4 makes read-only, free `gcloud`
calls against a real GCP project (flagged, not buried). An optional end-to-end re-test of a
dummy PRD run *would* cost LLM spend. It's listed under "Optional" and is not part of this plan.

---

## 1. What the build produces

| # | Edge | Source fact → target fact | Expected yield (from doc 31) |
|---|---|---|---|
| A | iOS→Firebase | `firebase_callable_call` (swift-cloud-kit) → Firebase `api_contract` | 24 of 34 |
| B | iOS↔Swift-kit | `call_expression` (ios) → declaration fact in the kit | up to 389 (262 simple-callee verified; 127 complex-callee unverified) |
| C | android→node-iot | `rest_endpoint_call` (android) → node-iot `route_definition` | 5 of 5 |
| D | pubsub | publish fact → receiving route/handler fact via live push endpoint | 1 known edge, made deterministic; more only if publisher topics resolve (see Stage 4) |

Edge counts are what doc 31 measured, not promises. Each stage reports its own real numbers.

## 2. Real findings from reading the code that shape this plan

Found by reading `build-cross-repo-edges.ts`, `mcp-server/db/graph-traversal.ts` and the
`fact_ref` build docs (graphrag 13/14), not by querying live data:

1. **The script's replace step would destroy other joins' rows if widened naively.** It runs
   `DELETE FROM cross_repo_edges WHERE connection_type = 'HTTP_API_CALL'` (whole type, any
   repo), then re-inserts with `source_repo` hardcoded to `'angular-app-oskey-io'`. Adding
   iOS→Firebase and android→node-iot under the same `HTTP_API_CALL` type, each run in isolation,
   would wipe the other's rows. **The replace must be scoped `(connection_type, source_repo)`**,
   as `build-intra-repo-edges.ts` already does for `INTRA_REPO_CALL`. This is the single most
   important change and is a prerequisite for Stages A, C and D.
2. **The script violates this project's "always dynamic, never hardcoded" rule.** Angular and
   Firebase repo names are literals, and Angular's `module-handler` split is baked in. Each new
   join must discover its repos from the data: source repos = `SELECT DISTINCT repo` with the
   relevant fact kind; target repo for iOS↔Swift-kit comes straight from `declarationRepo` in the
   payload. The existing Angular→Firebase join should be generalized to "any repo emitting
   `firebase_callable_call`", not gain a second hardcoded repo.
3. **No `fact_ref` work is needed in the writers.** `source_fact_ref`/`target_fact_ref` are
   `GENERATED ALWAYS` from `source_fact_id`/`target_fact_id` (graphrag doc 14, verified there
   against 17,195 rows). New joins keep writing `fact_id`, the same as today.
4. **Traversal only follows resolved edges with a real target fact.** `findGraphNeighbors`
   requires `resolution_status IN ('resolved','confirmed')` and `target_fact_ref IS NOT NULL`
   for outgoing edges. So an edge with no target fact (the "file-level fallback" doc 31 §3
   suggested) is invisible to `walk_cluster`/`get_graph_neighbors`. It is worth recording for
   coverage, but does not close the gap the agent feels. Corrected in doc 31's note.
5. **Traversal code is connection-type-agnostic**, so new types need no traversal change. Only
   a stale comment (`graph-traversal.ts:172`, "all four connection_types that exist today")
   needs a one-line update, in both copies (`mcp-server/db/` and
   `pipeline/facts-postgres-index/_shared/`).
6. **No schema change needed.** `connection_type` is unconstrained `text`; `provenance` allows
   `ast_derived` / `externally_configured`, which covers all four joins.
7. **The script isn't wired into `package.json`.** It's run by hand. Not changed here; worth a
   decision when the joins land (Stage 5).
8. **Edges need a fact on both ends, which limits Stage D.** The only topic with a resolved
   publisher fact is `accessControlDevice_activities` (node-iot → Firebase, already an edge).
   None of the 7 topics that push *into* node-iot has a resolved publisher fact in the index.
   Doc 31 said "something else publishes"; the script's own comments point at **Firebase**'s 14 unresolved
   `pubsub_publish_call` facts (dynamic env-var topic names). If the env-var values can be read
   deterministically, the real, valuable edge is Firebase → node-iot. If not, Stage D yields
   only the one edge that already exists.

## 2a. Open questions for the user (pubsub data I can't find myself)

1. ~~The 4 provisioned-but-unhandled topics~~ **Answered from git history (doc 39 §5b):**
   removed on purpose in node-iot `32e3d97` (2025-09-26, CLD1-1209), replaced by HTTP
   activities/heartbeat routes; Firebase's `.env` entries are leftovers (FIR1-357, 2024-05-13).
   Record the 4 bindings as `unresolved` with that reason (stale subscriptions), not as a gap.
   Still to confirm with you: the live staging subscriptions are dangling and can be cleaned up
   (you said the deployed service is probably `staging`).
2. **`accessControlDeviceConfigs`**: a live Firestore-trigger publisher
   (`OSKAccessControlDevicePublicKeysController.publish`, public-key create/delete) hardcoded to
   a 2023 topic name that is not in staging's topic list. Does that topic exist in prod/dev, or
   is public-key publishing silently failing in staging? (Still open; needs you or a prod/dev
   pubsub listing.)
3. ~~Which branch do live staging URLs run?~~ Answered by you: probably staging.
   The config publisher is a Firestore trigger under `access_control_device`, not
   building/units/doors (doc 39 §5b), so the D2 source fact for configurations is the publish
   site at `access_control_device_config.controller.ts:92`.

## 3. Decisions needed before build starts

These are the user's to make. Recommendations are given, but nothing below is agreed.

1. **Build order.** Doc 36 proposed A → B → D → C, unconfirmed. This plan recommends
   **A → B → C → D**. Reason: finding 8 shrinks D's certain yield to one edge that already
   exists and adds a real new dependency (live `gcloud` in the pipeline), while C is a clean
   join with five verified matches. Does that match your priorities, or does upcoming
   node-iot/android work argue for a different order?
2. **New `connection_type` name for B.** iOS→Swift-kit is neither an HTTP call nor pubsub. A and
   C reuse `HTTP_API_CALL` (same meaning: caller → externally exposed endpoint, `ast_derived`).
   Recommend a new value, e.g. **`PACKAGE_SYMBOL_USE`**, rather than overloading
   `INTRA_REPO_CALL` or `HTTP_API_CALL`, so retrieval can weight or filter it later. Name is
   yours to change; it's free text.
3. **Live GCP dependency for Stage D: one-off snapshot vs. re-fetch step.** A one-off snapshot
   (what `pubsub.bindings.staging.json` already is) needs no new pipeline dependency but goes
   stale, and the hand-typed `.md` files already have. A re-fetch step makes `gcloud` (and the
   user's authenticated identity) a pipeline dependency and probably warrants its own ADR
   (`governance/adrs/`, plus the README catalog). Recommend: **build D against the JSON file
   as input (a snapshot) first, and decide scheduled re-fetch / a devops export separately**.
4. **Refactor `build-cross-repo-edges.ts` or add per-join scripts.** Recommend **one script,
   restructured into join functions with a shared scoped-replace helper and a `--join=` flag**
   to run a subset. That way stages can be verified one at a time against a before/after
   baseline, and the delete-scope fix (finding 1) lives in one place. The alternative (four
   scripts) duplicates the helper and its bugs. The cost of the recommended path is one
   no-behavior-change refactor first (Stage 0), which must be verified before anything is added.

## 4. Stages

Each stage: build → run → compare against the Stage 0 baseline → record real numbers in a
completion doc → stop. Smaller sessions are fine; a stage can be its own session.

### Stage 0. Prerequisites and refactor (no new edges)

1. Start Docker / `facts-postgres-index-local`. Confirm `facts` and `cross_repo_edges` are
   reachable.
2. **Baseline snapshot** (before touching anything): row counts of `cross_repo_edges` grouped by
   `(connection_type, source_repo, target_repo, resolution_status, provenance)`; expect 17,195
   total, 110 Angular→Firebase, 1 node-iot→Firebase pubsub, 20 to `unknown`. Save as
   `39-baseline-cross-repo-edges-before-2026-09-21.json` (pattern from doc 07's baseline).
3. Re-verify the numbers this plan depends on, read-only and free:
   - iOS→Firebase: the 34 `firebase_callable_call` facts and **why the 10 non-resolving ones
     miss** (missing Firebase handler? renamed? module prefix?). Doc 31 didn't say; the
     "no logic change" claim for Stage A depends on it.
   - iOS `call_expression` resolved-via-import: the 389 / 262 / 127 split, and **how many
     simple-callee names match more than one declaration fact in the target file** (e.g.
     `struct Foo` + `extension Foo`). Doc 31's 262/262 checks existence, not uniqueness.
   - android: confirm the 5 `rest_endpoint_call` facts are the complete set (doc 31 only
     checked `OSKApiService.kt`).
4. Refactor: join functions, `replaceEdges({connectionType, sourceRepo})` scoped helper,
   `--join=` flag, generalized repo discovery for the existing join (findings 1-2), each join in
   its own transaction (today a failure in the pubsub half leaves HTTP committed, which is fine,
   but should be intentional).
5. **Acceptance**: re-running the refactored script for the existing joins reproduces the
   baseline exactly (same counts per group), including when run with `--join=` for only one of
   them. If it doesn't, stop and find out why before adding anything.

### Stage A. iOS→Firebase via `swift-cloud-kit-oskey-dev`

Widen source discovery to any repo with `firebase_callable_call` facts. Same compound key
(`module::handlerName`), same fail-closed duplicate check, no join-logic change.
Acceptance: Angular's 110 unchanged; iOS resolved count matches Stage 0's re-verified number
(doc 31 expected 24/34); every unresolved row carries a `details` reason; a spot-check of 3
resolved edges by reading both facts.

### Stage B. iOS↔Swift-kit via `call_expression`

- Source: `call_expression` facts with `resolutionMethod = 'resolved_via_import'` and a
  `declarationRepo` different from the fact's own repo. Repo and file come from the payload
  itself; **nothing named in code**.
- Target: the fact in `(declarationRepo, declarationFile)` whose symbol name equals the callee
  identifier. Match on symbol name within that file across all declaration-like kinds, **not** a
  hardcoded kind list, and **fail closed on ambiguity** (>1 candidate → unresolved with the
  candidate kinds in `details`, mirroring the existing duplicate check). The Stage 0 count of
  ambiguous cases decides whether a tie-break rule (e.g. prefer the primary declaration over an
  `extension`) is needed.
- Complex `calleeExpression` (the 127): extract the leading identifier and apply the same
  match; anything that doesn't parse or match is recorded **`unresolved`** with `declarationFile`
  in `details`, not as a target-less "resolved" edge (finding 4).
- Hub risk: a widely used declaration (e.g. a base UI type) can have many incoming edges. The
  existing `walkBoundedCluster` caps at 80 facts and depth 6, so this is bounded, but check the
  max in-degree after the build and note it.
- Acceptance: edge count by target kit vs. the 222/135/20/12 call-site split; every resolved
  edge has a non-null target `fact_id` that exists in `facts`; unresolved share reported
  honestly; a real `findGraphNeighbors` call on one declaration returns iOS callers.

### Stage C. android-intercom→node-iot via HTTP path and method

- Source: `rest_endpoint_call` facts, all repos (discovered). Target: `route_definition` facts,
  all repos.
- Normalization: lowercase method; split path on `/`; **any `{x}` or `:x` segment becomes a
  wildcard**, so `{modificationDate}` and `:timestamp` match by position, not name.
- **Prefix handling must be derived, not listed.** Live data has three prefix variants (android
  `/v1/iot`, Cloud Run `/v1`, none in node-iot's router-relative facts). Rule: a route matches a
  call when the route's segments are a **segment-aligned suffix** of the call's segments and
  the methods are equal. No prefix list anywhere.
- Guard against short-route over-matching: if more than one route in more than one repo matches
  a call, mark it unresolved with the candidates; require a minimum of 2 literal segments in the
  matched suffix; report any call that only matches on wildcards. Fail-closed, like the compound
  key.
- Acceptance: 5/5 android calls resolve to the exact routes in doc 31's table; no unresolved
  ambiguity; no duplicate edges on re-run.

### Stage D. Pubsub via live push endpoints

Two sub-stages so that the certain part doesn't wait on the uncertain part.

- **D1: make the one known edge deterministic (certain).** Feed `pubsub.bindings.staging.json`
  in as input. For each `push` binding, the target is the fact whose route or handler matches
  the push endpoint (same segment-aligned suffix rule as Stage C; Cloud Function URL tail
  `core-processPubSubMessage` → Firebase `pubsubPushReceiver` handler). `confirmed_via` records
  the source and extraction date (e.g. "gcloud pubsub subscriptions list, project
  staging-oskey-io, 2026-09-21, pushEndpoint …"). This replaces the `CONFIRMED_PUBSUB_BINDINGS`
  manual entry; keep it as a cross-check until D1 reproduces the same edge. Binding data is
  staging-only; state that in `details` so it's never read as production truth.
- **D2: publisher resolution (uncertain, investigate first).** Before writing any edge, check
  whether the 14 Firebase unresolved `pubsub_publish_call` env-var topics can be resolved
  deterministically (e.g. from a checked-in `.env`/config file in the Firebase repo, or the
  deployed function's runtime env via `gcloud functions describe`). **A naming resemblance
  (`OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` vs `accessControlDevice_intercomEntries`) is not
  enough: the script's own rule forbids naming-guess bindings.** If resolvable, D2 adds
  Firebase→node-iot edges for the 3 route-matched topics (and the other 4 once their routes are
  understood). If not resolvable, stop; D yields the one edge and D2 is recorded as blocked.
  This is a separate investigation, not a build step, until proven feasible.
- Not covered: production/dev projects (staging only), and the 4 node-iot push paths with no
  matching route fact (read node-iot's route files first; extraction gap vs. unimplemented).
- Acceptance (D1): the existing edge reproduces with a live-derived `confirmed_via`; the
  unmatched bindings are listed as unresolved with reasons, not dropped.

### Stage 5. Close-out

- Add a per-pair coverage summary to the end of the script's output (edges by
  `(source_repo, target_repo, connection_type, status)`, and any expected pair with zero edges).
  This is the cheap version of the "sanity/health report" idea, and would have caught the
  original gap without a manual investigation.
- Update the stale comment in both `graph-traversal.ts` copies (finding 5).
- Decide whether to add the script to `package.json` (finding 7).
- Write the completion doc (`40-build-completion-…`), compare final counts to the Stage 0
  baseline, and mark doc 36 §2 answered.
- If D goes beyond a one-off snapshot (decision 3), write the ADR and update
  `governance/adrs/README.md`'s catalog.

## 5. Risks and unknowns

- **Yield is smaller than 389+24+5+1 in graph terms.** Edges are per call site; the number that
  matters for the agent is how many distinct kit declarations gain a working cross-repo
  neighbor, which the completion doc should report alongside raw edge counts.
- **Refactor risk** sits in Stage 0: a silent behavior change to the working Angular join would
  be worse than the gap. The baseline comparison is the guard.
- **Stale reference data**: any live-derived binding (Stage D) drifts. Every such edge records
  where and when it came from.
- **Extractor-trust caveat on B**: `declarationFile` is computed by the same extractor that
  created the declaration facts, so a 100% match shows consistency, not independent
  correctness. Add a spot-check of a few resolved edges by reading source (e.g. does
  `OSKUIExpanded` really live in that file).
- **Not investigated**: why `search_facts` never surfaced the `external_hook` pubsub fact
  (retrieval question, out of scope); android-intercom's `webrtc_signaling_touchpoint` facts
  (counterpart not in the index, structural boundary).

## 6. Session rules for the build

- Investigate-only checks in Stage 0 come first, then one stage per commit-sized unit of work.
- No `git add`/`git commit` from a build session unless the user asks in that turn; any drafted
  build prompt must say so explicitly.
- Write each stage's real numbers to a doc as it finishes, not at the end. Delete any temporary
  diagnostic scripts once their findings are recorded.
- Flag real spend before running (only the optional re-test below has any).

**Optional, not part of this plan**: after B lands, re-run one of the earlier dummy PRD runs
(e.g. the iOS + swift-ble-kit one) to see whether a cross-repo citation now appears. That costs
real LLM spend and needs its own go-ahead.

## 7. Read order for the build session

1. This doc (§2 and §3 first).
2. `pipeline/facts-postgres-index/build-cross-repo-edges.ts` (the whole file, 310 lines) and
   `build-intra-repo-edges.ts` around line 339 (the scoped-delete pattern to copy).
3. [31](31-findings-cross-repo-edges-extension-scope-2026-09-21.md) §1, §3 and §5, with its
   correction note.
4. `mcp-server/db/graph-traversal.ts` lines 172-183 and 247-269 (what traversal will and won't
   follow).
5. `governance/reference-docs/pubsub.bindings.staging.json`.

Open decisions pending from the user: §3.1-3.4.


---

## Build log

One dated entry per stage, appended as each stage finishes. Session `level-5-engineering-knowledge-c3`. No git add/commit run by the build session.

### 2026-09-21: Stage 0 (safety net and refactor, no new edges): DONE, pending validator

**runIds the build ran against** (`max(run_id)` per repo in `facts`, also equal to `extraction_runs.is_current`): firebase `20260911_080454-00e1d9fd`, node-iot `20260911_080505-a6cba122`, angular `20260911_092322-8345d222`, ios `20260920_165124-e660bda2`, swift-cloud-kit `20260920_165044-32772e4a`, android-intercom `20260918_154849-f2cac85f` (plus swift-ble `20260920_165106-f8cdf199`, swift-ui `20260920_165053-9a75c7c6`, swift-webrtc `20260920_165059-e8aeea9d`). **All six spec-listed runIds are identical to the spec's, so nothing was re-synced** and every spec number (17,195 rows etc.) still holds.

**Backup:** `output/backups/cross_repo_edges-2026-09-21.sql` (13.7 MB, 17,195 rows, gitignored).

**Baseline:** `38-baseline-cross-repo-edges-before-2026-09-21.json`: 17,195 rows, 23 groups by `(connection_type, source_repo, target_repo, resolution_status, provenance)`, runIds, plus a content fingerprint (md5, excluding `edge_id`/`synthesis_id`/`generated_at`) for each of the 12 `(connection_type, source_repo)` slices. The fingerprints make "reproduces exactly" mean identical rows, not just identical counts.

**What changed in `pipeline/facts-postgres-index/build-cross-repo-edges.ts`** (v1.1.0):
- Two `Join`s: `firebase-callable` (`HTTP_API_CALL`) and `pubsub-binding` (`PUBSUB_TOPIC_BINDING`). `--join=<name>[,<name>]` runs a subset.
- Shared `replaceSlices` helper: replace is scoped to `(connection_type, source_repo)` (before: all `HTTP_API_CALL` / all `PUBSUB_TOPIC_BINDING` rows). Source repos are discovered from the data; all of a join's slices are replaced in one transaction (own pooled client, so a `ROLLBACK` only ever follows a `BEGIN`).
- **Compute first, replace second** (spec rule 2): each join has a preflight (source and target kinds exist, required payload fields present on at least one row) and a shrink guard (new slice empty or smaller than the existing one prints the diff and aborts the whole join before `BEGIN`; `--accept-shrink` overrides). One join failing does not stop the others; the run exits 1 if any failed.
- Slice-ownership guard: aborts if two joins of one `connection_type` ever claim the same source repo (checked across all joins even when `--join=` selects one), because each would otherwise delete the other's rows.
- Single `CONTRACT` constants block (spec rule 3) naming each extractor-owned kind/field; `UNKNOWN_REPO = "unknown"` (already in the live table). Only the literals Stage 0's two joins use are there; later stages add theirs to the same block.
- `--dry-run` (compute and print, write nothing) and `--print-edges` added because the prompt requires a bounded dry run before each real write.
- Target repos are now discovered (the receiver/callable queries no longer filter on `firebase-oskey-dev`); confirmed identical today (253 callable `api_contract` and the 1 push receiver are both only in Firebase).
- **One deliberate, transitional repo-name literal: `STAGE0_CALLABLE_SOURCE_REPOS = ["angular-app-oskey-io"]`.** Discovering callable sources purely from the data would also pick up `swift-cloud-kit-oskey-dev`'s 34 calls, which are Stage A's new edges. The constant keeps Stage 0 at "no new edges" and is deleted at the start of Stage A.

**Acceptance (re-run reproduces baseline exactly), all measured against the baseline file:**

| Run | Result |
|---|---|
| Dry run (both joins) | every slice `existing N → new N` with the same status split; nothing written |
| Full run, real | total 17,195; 23/23 groups equal; 12/12 slice fingerprints equal |
| `--join=firebase-callable`, real | total 17,195; groups and fingerprints identical |
| `--join=pubsub-binding`, real | total 17,195; groups and fingerprints identical |

**Guards tested (each was a cheap bounded test with a before/after check):**
- *Shrink guard:* inserted one throwaway `HTTP_API_CALL` angular row (`GUARD-TEST-ROW`, 17,196 rows). Run without `--accept-shrink`: refused (`103 → 102`, printed the row), table unchanged (test row still present, 103). Run with `--accept-shrink`: removed it; table back to the baseline (identical). Test row no longer exists.
- *Preflight:* a scratch copy with `CALLABLE_CALL_FUNCTION_NAME` renamed reported `PREFLIGHT FAILED -- nothing changed` for that join, still ran the other join, and exited nonzero. Scratch copy deleted.
- Unknown `--join=` value and unknown flag: rejected with the valid list.

**Post-stage checks:** target `fact_id` not in `facts`: 0 (whole table). `FIELD_BINDING`: 13, untouched. Resolved/confirmed edges with a dangling source: 0. Dangling source rows overall: 153 (130 `unresolved`, 23 `probable`), the same 153 the spec already records. One `findGraphNeighbors` call on an existing `HTTP_API_CALL` edge (`organization-createEntity`) returns its resolved outgoing edge to `organization::createEntity`.

**Notes for the validator:**
- Live `edge_id`s and `synthesis_id`s of the rebuilt `HTTP_API_CALL` (102) and `PUBSUB_TOPIC_BINDING` (16) rows changed (each was rebuilt by the acceptance runs, the callable join also by the shrink-guard test); content is identical to the baseline.
- A scratch file named `build-cross-repo-edges.ts.head` that this session created inside the repo directory was swept into the user's commit `8bc5bfd`; the working-tree copy is deleted and shows as ` D` until the next commit. It contains only a header fragment of the script and nothing depends on it.
- `package.json` not touched.


### 2026-09-21: Stage A (iOS→Firebase, `HTTP_API_CALL` from any repo with `firebase_callable_call` facts): DONE, pending validator

**Validator's Stage 0 verdict: approved**, with three conditions for Stage A, all met below.

**runIds:** unchanged from the Stage 0 entry (checked in the post-run snapshot: `latestRunIdPerRepo` identical to the baseline's). No re-sync happened, so the Stage 0 baseline is still the reference.

**Code changes (`build-cross-repo-edges.ts`, v1.2.0):**
- `STAGE0_CALLABLE_SOURCE_REPOS` **deleted**. Source repos for the callable join are now discovered purely from `firebase_callable_call` facts: `angular-app-oskey-io`, `swift-cloud-kit-oskey-dev`. No repo-name literal remains in code.
- **Condition 1, resolved-count drop is a shrink.** A slice whose resolved edges would fall below the existing resolved count now aborts the join before `BEGIN` unless `--accept-shrink`, and prints the edges that would stop being resolved. It fires even when the slice size is unchanged.
- **Condition 2, orphan slices.** New coverage section at the end of every run: existing edges of a connection type this script owns whose source repo no join discovers. Report-only (never deletes, never rebuilds). Looks across all joins, so `--join=` cannot hide one. Today: none. This is the first piece of the close-out coverage summary; the dangling source/target counts and the newer-`runId` flag are still to come at close-out.
- **Condition 3, `details` from the data.** Every unresolved callable edge now explains its miss from the indexed callable facts (253 callables, 9 modules): (a) name exists only under other module(s) and the client prefix is not a module → *"Callable 'X' exists under module 'M' (file:line)[, ...], but the client prefix 'P' matches no module (9 modules have callables). Left unresolved: no rule derived from the facts maps that prefix to a module."*; (b) prefix is a module but lacks the name, which exists elsewhere → *"Module 'P' has no callable 'X'; the name exists only under module ..."*; (c) name exists nowhere → *"No callable named 'X' exists in any module (searched 253 callables across 9 modules); the client asked for module 'P'."* No alias table, no "dead code" wording anywhere in the code; the classification is computed, and none of these cases can turn into a resolved edge.

**Dry run first (`--dry-run --print-edges`, nothing written), then the real run.** Real result:

| Slice | Before | After |
|---|---|---|
| `HTTP_API_CALL` angular-app-oskey-io | 102 (97 resolved, 5 unresolved) | 102 (97 resolved, 5 unresolved) |
| `HTTP_API_CALL` swift-cloud-kit-oskey-dev | 0 | **34 (24 resolved, 10 unresolved)** |
| Table total | 17,195 | **17,229** (+34) |

**Angular slice, exactly what changed:** resolved rows, all keys and target facts are byte-identical (md5 over everything except the 5 unresolved rows' `details` = `4f94dfe4…` before and after). The only difference is the `details` text of the 5 unresolved rows, which now come from the data. New information this surfaced: `organization-assigningBuildingToProperty` is not in module `organization` but the name exists under module `building` (`functions/src/modules/building/index.ts:53`); it stays unresolved (a different module is not the one the client named). The other 4 name nothing that exists in any module.

**The 10 swift-cloud-kit misses, all `unresolved`, all with data-derived `details`:**
- **7 export-group alias** (client prefix `unit`, callable exists under `unit_management`): `unit-getAllUnitInhabitantsAndGuests` (`OSKCKUserInvitesService.swift:120`), `unit-createUnitInvitation` (:141), `unit-removePermanentGuest` (:244), `unit-removeInhabitantFromUnit` (:265; the name exists under **two** modules, `admin` and `unit_management`, both listed), `unit-removePendingInvitation` (:288), `unit-getUnitPerson` (:65 and :89, two call sites).
- **3 no callable with that name in any module:** `organization-verifySmsOtpCode` (`OSKCKUserOnboardingBuildingService.swift:52`), `user-approvePendingFriendRequest` (`OSKCKUserPendingFriendRequestService.swift:100`), `user-rejectPendingFriendRequest` (:111). **User confirmation (2026-09-21, recorded here, not in code):** these three are dead or superseded iOS code and correctly unresolved.
- **A2 not built** (needs user go-ahead). Design option, unchanged from the spec: derive the export-group → module mapping from Firebase's `functions/src/index.ts` (`export const unit = {...unitTriggers.getCallableFunctionTriggers…}`), which has no facts today, so it is an extractor-level change (a new fact kind for export-group aliases), never a hand-typed table. With it, up to 31/34 would resolve (the 7 alias misses; `removeInhabitantFromUnit` still needs the alias to pick between `admin` and `unit_management`).

**Post-run checks:** other 11 of 12 baseline slices byte-identical; only two groups added (`swift-cloud-kit → firebase resolved 24`, `swift-cloud-kit → unknown unresolved 10`); `FIELD_BINDING` 13; target `fact_id` not in `facts`: 0; resolved/confirmed with dangling source: 0; dangling-source rows still the known 153 (130 unresolved, 23 probable). `findGraphNeighbors` on a new edge (`OSKCKPinCodeService.swift:38 -> core-createQuickcode`): outgoing resolved `HTTP_API_CALL` to `core::createQuickcode`; from the Firebase target fact, the incoming `HTTP_API_CALL` set includes the swift edge. All 24 resolved swift edges carry a target fact.

**Guards tested (each a cheap bounded test, before/after):**
- *Resolved-drop guard:* flipped one Angular unresolved row to `resolved` (slice size stays 102; existing 98 resolved vs new 97). Without `--accept-shrink`: refused (`RESOLVED DROP 98 -> 97`, printed the edge), table unchanged (98/4). With it: restored; the whole table identical to the post-A snapshot.
- *Orphan report:* inserted a throwaway `HTTP_API_CALL` row for a made-up repo; a `--join=pubsub-binding --dry-run` still reported `ORPHAN HTTP_API_CALL / zz-orphan-test-repo: 1 edge(s)`. Test row deleted; the table is back to 17,229 and the report says `none`.

**Still open, not built (by design):** A2 (above). Also noted: a peer session's activity touches `governance/reference-docs/screen-map-ios.json` (shows as modified); not this build's file and untouched here.


### 2026-09-21: Stage B (iOS↔Swift-kit, `PACKAGE_SYMBOL_USE`): DONE, pending validator

**Validator's Stage A verdict: approved.**

**runIds:** unchanged (post-run snapshot's `latestRunIdPerRepo` identical to Stage 0's). No re-sync; baselines still valid. The clones sit at the exact commits the runIds encode (ios `e660bda2` on `master`; ui kit `9a75c7c`, cloud kit `32772e4`, detached at the extracted commit).

**Source repos discovered from the data (no literal):** repos with `call_expression` facts whose `resolutionMethod = 'resolved_via_import'` and whose `declarationRepo` is another repo → **only `ios-oskey-dev`**, as expected (no other repo appeared, so no stop was needed). 389 sources; by declaration repo **ui 222 / cloud 135 / ble 20 / webrtc 12**, all as expected.

**New join `package-symbol-use` (`build-cross-repo-edges.ts` v1.3.0):** match key is `(declarationRepo, declarationFile, leading identifier of calleeExpression)`; target is a declaration-like fact in that file with that `symbol_name`. Exactly one primary (non-extension) declaration → `resolved`; none, only extensions, or more than one primary → `unresolved` with `declarationFile` and the candidates in `details`. The join throws if it would ever emit a resolved edge without a target fact.
- **How "declaration-like" is decided (no kind list):** kind name ends in `_declaration` (the Swift extractor's own convention: struct/class/enum/protocol/function/extension), a named constant in the `CONTRACT` block. This matters: matching on `symbol_name` alone (any kind) also hits `call_expression` facts in the same file (271 such candidate rows), which are calls, not declarations. The suffix rule reproduces doc 39's numbers exactly.
- Named heuristics: `LEADING_IDENTIFIER` regex and the prefer-non-extension tie-break (`EXTENSION_DECLARATION_KIND`); failure mode of both is `unresolved`, never a wrong `resolved`.

**Dry run first (`--dry-run --print-edges`), reviewed before the real write:** 0 unresolved lines, 389 resolved, none without a target fact; looked at the plain, complex-callee and tie-broken edges. Then the real run.

**Result (all expectations met, no deviations):**

| Measure | Expected | Actual |
|---|---|---|
| Sources by kit | ui 222 / cloud 135 / ble 20 / webrtc 12 | ui 222 / cloud 135 / ble 20 / webrtc 12 |
| Total sources = edges | 389 | 389 |
| Distinct target declarations | ~72 | **72** |
| Max in-degree | `OSKUIExpanded` ~85 | **`OSKUIExpanded` 85** (then `OSKUIContentView` 33, `OSKUIProgressIndicator` 25, `OSKCKStorageFilePathService` 21, `OSKUIOTPCodeField` 20) |
| class/struct + extension ambiguities settled by non-extension | 21 | **21** (368 single-candidate + 21) |
| Resolved / unresolved | n/a | **389 resolved / 0 unresolved** |
| Table total | 17,229 | **17,618** (+389) |

Target kinds: struct 304, class 63, enum 22. No source in the current data was left unresolved, so the unresolved paths (no match, only-extensions, ambiguous primaries, no leading identifier) exist in code but are not exercised by today's facts; they are exercised only by the guards' logic, not by a real case.

**Post-run checks:** all 13 pre-existing slices byte-identical to the post-A snapshot; only new groups are the four `PACKAGE_SYMBOL_USE ios→kit resolved` groups (20/135/222/12); `FIELD_BINDING` 13; target `fact_id` not in `facts`: 0; resolved/confirmed with dangling source: 0 (dangling still the known 153: 130 unresolved, 23 probable). Independent SQL over all 389 edges: source is a `call_expression` in the ios repo (389/389); target is a non-extension `*_declaration` in the `declarationFile` the call named, with `symbol_name` equal to the leading identifier (389/389); no resolved edge without a target fact (0).

**Spot-check of 3 resolved edges against real source in `output/clones/` (ios `master@e660bda2` and the kit clones):**
1. `iOS App/Presentation/Account/Views/OSKUserAccountDeletionSection.swift:32` `OSKUIBottomPopup { … }.showAndReplace()` (complex callee, leading identifier extracted) → `public struct OSKUIBottomPopup<…>` at `Sources/OSKUIKit/UI Elements/Popup/Views/OSKUIBottomPopup.swift:20`. ✔
2. `iOS App/App/Delegates/OSKAppDelegate.swift:108` `OSKWKCallProviderService.shared.configure(...)` (tie-break) → `public class OSKWKCallProviderService` at `Sources/OSKWebRTCKit/…/OSKWKCallProviderService.swift:21`, chosen over the `extension OSKWKCallProviderService: CXProviderDelegate` at :327 in the same file. ✔
3. `iOS App/App/Views/OSKBluetoothAuthorization.swift:115` `OSKBKCentralManagerService.shared.initIfNeeded()` → `public final class OSKBKCentralManagerService` at `Sources/OSKBluetoothLEKit/Central Manager/Services/OSKBKCentralManagerService.swift:19`. ✔
Each ios file also `import`s the matching kit module. (Caveat from doc 38: the declaration facts and `declarationFile` come from the same extractor, so agreement is consistency, not independent proof; the spot-check above reads the source text directly.)

**Hub measurement (required before Stage B counts as done; report only: no cap added, traversal code untouched).** Measured against the live table right after the build, on the `OSKUIExpanded` declaration fact (`swift-ui-kit-oskey-dev`, `Sources/OSKUIKit/UI Elements/Expanded/Views/OSKUIExpanded.swift:16`), which is also the worst-case kit anchor:

| Call | Rows | Serialized bytes (JSON, UTF-8) |
|---|---|---|
| `findGraphNeighbors(hub)` | **85** (all `incoming` / `PACKAGE_SYMBOL_USE` / `resolved`) | **35,071** (~413 bytes/row) |
| `walkBoundedCluster(hub)`, default bounds (`maxDepth` 6, `maxFacts` 80) | **80 members** + **164 edges**, `truncated: true`, 29 ms | **73,491** total = members 47,540 (of which `description` text 29,580) + edges 25,913 |

Reading the numbers: the hub has 85 distinct source facts (85 edges; only 79 distinct `source_symbol` strings, because a few call sites carry several call facts). The default 80-fact cap is hit **immediately at depth 1**: the cluster is the hub plus 79 iOS callers (1 ui-kit + 79 ios-oskey-dev members), so 6 callers are cut and the result says `truncated: true`. The walk never goes deeper because the callers' own other edges are `unresolved`/`probable` INTRA_REPO_CALL, which traversal doesn't follow. The 164 edges are the 85 incoming hub edges plus the same 79 seen again from each caller's outgoing side (the walk does not de-duplicate an edge it sees from both ends; harmless but it is why edges > members). Both calls are unbounded by an SQL `LIMIT`; a hub of this size costs ~35 KB per `findGraphNeighbors` call and a walk over it ~73 KB, i.e. tens of KB per anchor that touches a hub. Decision for the user, not made here: whether a per-call cap or hub-aware summarisation is wanted before the agent leans on kit-side anchors.

**Guards kept and re-tested on the new slice:** idempotent re-run reproduces the whole table exactly (17,618 rows, 29 groups, 14 slice fingerprints identical). With one throwaway extra resolved row in the slice (`GUARD-TEST-ROW`, 390 rows), a run without `--accept-shrink` printed both `SHRINK 390 -> 389` and `RESOLVED DROP 390 -> 389 resolved` and changed nothing; with `--accept-shrink` the table was restored exactly (test row gone). Orphan report: `none`. A full `--dry-run` of all three joins is consistent (every slice `existing N → new N`, nothing written).

**Notes:** `package.json` not touched; no LLM/embedding/`gcloud` spend. Scratch diagnostics from this stage were deleted after their findings were written here. `screen-map-ios.json` still shows as modified from a peer session (not this build's file).

### 2026-09-21: Validator note on Stage B's hub measurement (added by the validator session, not the build session)

**Status for the build session: informational only. It does not change Stage B's result, the
spec, or anything the build must do.** Stage B's acceptance stands as recorded above. Hub
handling stays out of this build's scope (the "report only, no cap, don't touch traversal" rule
is unchanged); the decision on it belongs to the user and is being discussed separately.
Nothing was written to `cross_repo_edges`, no code was changed, no LLM/embedding/`gcloud`
spend, no git add/commit. The validator's scratch scripts were deleted after use.

**What was checked (read-only, against the live table after Stage B):**

1. **Independent confirmation of the hub numbers.** `OSKUIExpanded` has 85 incoming resolved
   `PACKAGE_SYMBOL_USE` edges (SQL). The build session's walk figure (`walkBoundedCluster`
   default bounds: 73,491 bytes) reproduced **exactly**.
2. **One discrepancy on the neighbour figure.** The build log's 35,071 bytes is
   `findGraphNeighbors` (raw edge rows). The `get_graph_neighbors` tool returns
   `expandWithGraphNeighbors` (`mcp-server/agent-poc/atomic-prd-agent.ts:184-200`), which adds
   each neighbour's description text. Measured on that function, the hub call is **57,254 bytes**,
   about 1.6x the logged figure, so roughly 14k tokens by the build log's own 4-bytes-per-token
   estimate, not 9k. Only the atomic agent's tool wiring was checked; the capability-fanout
   version of the tool was not.
3. **Replay of every real graph call from the 10 `FULL_DEBUG` traces** (200 calls, same inputs
   including the model's own `maxDepth`/`maxFacts`) against today's graph: total bytes identical
   before and after (232,785), 0 grew, 0 truncated, 0 threw. The real runs never touched the new
   edges (the 1c iOS run made only 7 graph calls), so this shows no stale-reference errors, and
   says nothing about flood risk.
4. **Sweep: what if an agent anchored on any of the 389 iOS call sites that now have a kit edge.**

   | Bounds | Reach the hub | Truncated | Members (median / max) | Bytes (median / p90 / max) |
   |---|---|---|---|---|
   | depth 3, facts 30 (what the agent chose in 1c) | 85 / 389 | 118 | 15 / 30 | 17.7k / 37k / 42k |
   | defaults, depth 6, facts 80 | 85 / 389 | 85 | 15 / 80 | 17.7k / 73k / 73k |

   Real walks before Stage B had a median of about 0.5 KB, so an iOS walk from a call site with a
   kit edge is now roughly 30x heavier at the median (the intended payoff of the edges, but each
   member carries about 1 KB of description). About 1 in 5 of those anchors reaches the hub and
   is truncated with unrelated sibling callers; at the agent's own bounds about 33 more truncate
   on other large kit components.
5. **Kit-side anchors:** `get_graph_neighbors` on each of the 72 target declarations: median
   1.3 KB, p90 11.6 KB, max 57 KB (the hub); 8 of 72 exceed 10 KB.
6. **Hubs are not new.** Existing intra-repo hubs are larger (Firebase `OSKLoggingService.logError`
   534 incoming, `logInfo` 281, Angular `OSKTranslateService.instant` 129); `OSKUIExpanded` is the
   7th largest. None of the 148 real `walk_cluster` calls in the traces was truncated (max result
   about 11 KB), but those runs predate Stage B and rarely anchored where a hub would matter.

**Conclusion:** a flood is possible in a narrow case (agent anchors on an iOS call site with a
kit edge, or on a kit declaration) and is not visible in today's real traces. Behavioural impact
can only be seen in a real run; a before/after re-run of the 1c dummy PRD (its before trace
exists) would show it, costs LLM spend, and needs the user's go-ahead, preferably after Stage C.
If it shows a problem, the candidate fix is "include the hub with its count but do not expand
through it", which `graph-traversal.ts:178-183` already anticipated for weaker-coupling
connection types. Lossless de-duplication of the walk's edges (164 to 85 unique) is a separate,
smaller option. Neither is part of this build.


### 2026-09-21: Stage C (android-intercom → node-iot, `HTTP_API_CALL`, `externally_configured`): DONE, pending validator

**Validator's Stage B verdict: approved.**

**runIds:** unchanged (post-run snapshot's `latestRunIdPerRepo` identical to Stage 0's); no re-sync. Clones at the indexed commits: android `develop@f2cac85`, node-iot `staging@a6cba12`.

**New join `rest-route` (`build-cross-repo-edges.ts` v1.4.0).** Sources are `rest_endpoint_call` facts, discovered by kind (5, all `OSKApiService.kt`, all in `android-intercom-oskey-io`). Targets are node-iot `route_definition` facts (18); `payload.value` = `"METHOD /path"` is parsed. Rules as specified: segments; `{x}` and `:x` are parameters; a route matches when its segments are an **aligned suffix** of the call's path, methods are equal, and at least `MIN_LITERAL_SEGMENTS` (2) of its segments are literal; **a parameter matches only another parameter at the same position, never a literal** (`pubsub`); zero or more than one candidate → `unresolved` with the reason/candidates in `details`. The stripped prefix in `details` is computed from the data (`/v1/iot`), not from a prefix list. No repo-name literal in code; all extractor names are in the `CONTRACT` block.

**Provenance (per validator note):** the join carries its own `provenance = externally_configured`, because the match rests on the Apigee claim, which is not in any indexed repo. `confirmed_via` and `details` of every Stage C edge carry the exact sentence: *"reaches node-iot via Apigee, /iot prefix stripped; confirmed by the product owner 2026-09-21; gateway config not in the indexed repos"* (constant `APIGEE_CONFIRMATION`). `HTTP_API_CALL` now holds both provenances (Angular/Swift `ast_derived`, Android `externally_configured`); `findGraphNeighbors` does not filter on provenance, so all are followed.

**Slice-ownership / no-overlap:** discovery is by kind, so `rest-route` finds `android-intercom-oskey-io` only, while `firebase-callable` finds `angular-app-oskey-io` and `swift-cloud-kit-oskey-dev`: no overlap. The guard was tested, not just assumed: a scratch copy in which `rest-route` discovered the same repos as `firebase-callable` aborted with `[Fail-Closed] joins 'firebase-callable' and 'rest-route' both own HTTP_API_CALL for source repo(s) …` before doing any work. Scratch copy deleted.

**Matcher tested before real data (13 synthetic cases, all pass; scratch, deleted):** `{x}`/`:x` both parameters; suffix absorbs `/v1/iot`; **`{modificationDate}` matches `:timestamp` by position**; **parameter does not match literal `pubsub`, and a literal does not match a parameter in the call**; route longer than the call cannot match; route not aligned to the end cannot match; a route with only 1 literal segment fails the ≥2 guard (both `/config` and `/:id/config`); literals are case-sensitive; query string ignored. (The real data cannot exercise the parameter-vs-literal rule, since none of the 5 calls sits next to a `pubsub` route, so the synthetic test is the only proof of it.)

**Dry run first (`--dry-run --print-edges`), then the real run.** Result:

| Measure | Expected | Actual |
|---|---|---|
| Sources / targets loaded | 5 / 18 | 5 / 18 (0 routes skipped as unparseable) |
| Resolved / unresolved | 5 / 0 | **5 / 0** |
| `{modificationDate}` call | matches the `:timestamp` route by position | `GET …/config/{modificationDate}` → `GET /access-control-devices/:accessControlDeviceId/config/:timestamp` (`access_control_device_configs.route.ts:20`) |
| Table total | 17,618 | **17,623** (+5) |

The 5 edges: `:32 config` → `GET …/config`; `:42 config/{modificationDate}` → `GET …/config/:timestamp`; `:53 intercom-entries` → `GET …/intercom-entries` (not `…/intercom-entries-deltas`); `:63 accesses` → `GET …/accesses` (not `…/accesses/digicom` etc.); `:73 POST activities/intercom` → `POST …/activities/intercom`. Every call had exactly one candidate route (no ambiguity).

**Independent verification (separate Python implementation, no shared code):** recomputed the matches from the raw facts using node-iot's structured `evidence.method`/`evidence.httpPath` instead of the packed `value`: 5 of 5 calls have exactly one candidate and **5 of 5 edges agree** (same target `fact_id`, `resolved`). All 5 have `provenance = externally_configured`, identical `confirmed_via`, and the Apigee sentence inside `details`.

**Post-run checks:** all 14 pre-existing slices byte-identical to the post-B snapshot (so the Angular and swift-cloud-kit `HTTP_API_CALL` slices are untouched); the only new group is `HTTP_API_CALL android→node-iot resolved externally_configured 5`; `FIELD_BINDING` 13; target `fact_id` not in `facts`: 0; resolved/confirmed with dangling source: 0 (dangling still the known 153). `findGraphNeighbors` on a new edge: outgoing `resolved` `HTTP_API_CALL` to the node-iot route fact, and from the route fact the incoming set includes the android edge.

**Spot-check of 2 edges against real source (android `develop`, node-iot `staging`):**
1. `OSKApiService.kt:32` `@GET("/v1/iot/access-control-devices/{accessControlDeviceId}/config")` ↔ node-iot `src/v1/routes/access_control_device_configs.route.ts`, path key `'/access-control-devices/:accessControlDeviceId/config': { GET: … getConfig }` (the fact's `line` 15 is the handler-registration line inside that key). ✔
2. `OSKApiService.kt:42` `@GET(".../config/{modificationDate}")` with `@Path("modificationDate") modificationDate: Long` ↔ node-iot key `'…/config/:timestamp'` (`getConfigAfterTimestamp`), whose handler reads `req.params.timestamp` and does `Number(...)` as **epoch milliseconds**. The parameter names differ but the position, type and meaning line up, so the position match is right, not just structural. ✔
Extra evidence for the prefix: node-iot's `src/server.ts` mounts its v1 API at `'/v1': apiV1`, so a node-iot route really lives at `/v1/access-control-devices/…`. The only part of the android path with no counterpart in any indexed repo is therefore `/iot`, which is exactly what the Apigee statement covers. (This supports the `/v1` half from code; the `/iot` half still rests on the product owner's word.)

**Guards kept and re-tested on the new slice:** re-running reproduces the whole table exactly (17,623 rows, 30 groups, 15 slice fingerprints); with a throwaway extra resolved row (6 rows) the run refused with both `SHRINK 6 -> 5` and `RESOLVED DROP 6 -> 5 resolved` and changed nothing; `--accept-shrink` restored the table exactly. Orphan report: `none`. A full `--dry-run` of all four joins is consistent.

**Finding for the user (not acted on): a sturdier extractor contract exists.** The spec, doc 38 rule 3 and doc 39 say route method and path are only available packed into `payload.value`. In fact each `route_definition` fact also carries them structured, **`evidence.method` and `evidence.httpPath`** (also mirrored at the top level), and for all 18 facts `value == "<method> <httpPath>"` exactly. The build follows the spec (parses `value`), which works today. Switching to the structured fields would remove the string parse and its "does the extractor still pack it that way" risk; it is a small, optional change, not made here because it would deviate from the spec.

**Logged, not built (per spec): optional future step.** Export Apigee's proxy definitions (base path and target) as a reference JSON, like `pubsub.bindings.staging.json`, so the `/iot` strip becomes deterministic and the Stage C edges could move from `externally_configured` to a data-backed provenance.

**Notes:** `package.json` not touched; no LLM/embedding/`gcloud` spend; scratch diagnostics deleted after their findings were written here. `screen-map-ios.json` may still show as modified from a peer session (not this build's file).


### 2026-09-21: Stage C amendment (route reader switched to structured fields): DONE

Not a new stage. **Validator's Stage C verdict: approved, with this one amendment** (the spec was wrong that route method and path exist only packed into `payload.value`; corrected in docs 38 and 39 by the validator).

**Change (`build-cross-repo-edges.ts`):**
- **One shared route reader.** `loadRoutes(db)` is now the only place routes are read; it uses `evidence.method` and `evidence.httpPath` and builds `raw` = `"METHOD /path"` from them. A companion `matchRoutes(routes, method, pathSegs)` holds the suffix / ≥2-literal / parameter-vs-literal rule, so D1 reuses both for push-endpoint matching.
- **`CONTRACT`:** added `ROUTE_METHOD: "method"` and `ROUTE_HTTP_PATH: "httpPath"` (both under `payload.evidence`); the old `ROUTE_VALUE` became `ROUTE_PACKED_VALUE`, used only for the cross-check. The stale comment that said the fields don't exist is corrected.
- **Preflight (`routePreflightProblems`, shared):** fails loudly, changing nothing, if there are no route facts or if **any** route fact lacks either field.
- **Packed `value` = warn-only cross-check (`warnRouteDisagreements`):** any route fact whose packed value differs from `"METHOD /path"` rebuilt from the structured fields is logged (first 5) and never fails the join. The old `parseRouteValue` parser is deleted.

**Acceptance (all against the post-C snapshot):** the re-run reproduces the Stage C slice exactly: the same 5 edges and the same slice fingerprint (details text included, since `raw` rebuilt from the structured fields equals the old packed value for all 18 routes); table total **17,623**; all 15 slice fingerprints and all 30 groups identical, so every other slice is unchanged. The real run printed no WARN: 0 of 18 disagree.

**Tested (scratch copies deleted; throwaway row removed):**
- *Preflight:* with `ROUTE_HTTP_PATH` pointed at a non-existent field, the join reported `PREFLIGHT FAILED -- nothing changed: 18 of 18 'route_definition' fact(s) lack evidence.method or evidence.httpPath…` and did not compute.
- *Warn-only:* with `ROUTE_PACKED_VALUE` pointed at a non-existent field, all 18 were logged as disagreeing (first 5 shown), and the join **still ran** (5 resolved / 5, slice unchanged): not fatal.
- *Guards on this slice:* with one throwaway extra resolved row (6 rows), a run without `--accept-shrink` printed both `SHRINK 6 -> 5` and `RESOLVED DROP 6 -> 5 resolved` and changed nothing; with `--accept-shrink` the table was restored exactly (identical to the post-C snapshot).


### 2026-09-21: Stage D1 (pubsub deterministic edge from the bindings snapshot): DONE, pending validator

**Validator's Stage C verdict: approved** (with the route-reader amendment logged above).

**INCIDENT, must be read (rule breach, no harm found).** While splicing D1's code, I passed Python source containing backticked text (for example a comment mentioning the `gcloud pubsub subscriptions list` listing) through an **unquoted shell heredoc**, so the shell executed the backticks as commands. One of them was **`gcloud pubsub subscriptions list`**, which printed `Listed 0 items.`; the others (`deliveryType`, a `<group>-<name>` pattern) failed as unknown commands / a parse error. This build had been told to run no `gcloud` command. It was a single read-only listing (no `--project` given, so against whatever default configuration the machine has, and it returned nothing), so: no spend, no writes, no data used from it, nothing changed in any repo or in the database. The splice itself did not run (the shell errored first), the script file was byte-identical to its pre-D1 backup, and the code was then spliced in safely (script written with the file tool, quoted heredocs from then on). The snapshot `pubsub.bindings.staging.json` was **not** refreshed and no GCP call is made by the script (verified: no `child_process`, `exec` or `spawn` in it; the only `gcloud` text in it is a documentation comment). Which gcloud account/project the default configuration points at was not inspected (that would be another gcloud call).

**runIds:** unchanged (post-run snapshot's `latestRunIdPerRepo` identical to Stage 0's); no re-sync.

**Design (`pubsub-binding` join, `build-cross-repo-edges.ts` v1.5.0).** The join's binding source is now the committed snapshot `governance/reference-docs/pubsub.bindings.staging.json` (project `staging-oskey-io`, `extractedAt 2026-09-21T06:50:31.435153Z`, 10 bindings, **staging only**), not the hand-typed list. An edge is `resolved` only where a fact exists on **both** ends: a `pubsub_publish_call` fact naming the topic, and a subscriber fact the subscription's push endpoint reaches: a node-iot route (via the shared `loadRoutes`/`matchRoutes`, method POST, aligned suffix, ≥2 literal segments, a parameter matches only a parameter), or a Firebase push receiver named by the endpoint's single path segment `"<module>-<value>"` (`/core-processPubSubMessage` = module `core`, value `processPubSubMessage`). Every other binding is recorded `unresolved` with a reason worked out from the data, never dropped. Bindings that no publish site reaches are recorded under `source_repo = 'unknown'` (no publisher fact means no known source repo; `source_fact_id` is NULL; the target fact is filled in when the endpoint really matches a fact). Every D1 edge's `confirmed_via` records the snapshot source, `project` and `extractedAt`, and its `details` repeat `extractedAt` and "staging only".
- **`CONFIRMED_PUBSUB_BINDINGS` kept, demoted to a warn-only cross-check** (not deleted, per instruction). It no longer produces any edge. The join logs `Cross-check vs CONFIRMED_PUBSUB_BINDINGS: 1 entry: 1 reproduced by the snapshot join, 0 only in the hand-typed list, 0 only in the snapshot join`; a disagreement would print `WARN DISAGREEMENT` and not fail. **They agree**, so the list can be deleted in a follow-up.
- **New named constants:** `PUBSUB_SNAPSHOT_REL/FILE`, `PUSH_DELIVERY`, `PUSH_HTTP_METHOD` ("POST", a protocol fact), `APP_ENGINE_PUSH_PREFIX`, `SCHEDULE_TOPIC` (Firebase's `firebase-schedule-<group>-<name>-<region>` naming, used only to look up facts that name the trigger), and **`REMOVED_PUSH_ROUTES`** = `{commit 32e3d97, 2025-09-26, CLD1-1209, routes: state, system-log, access-log, access-command}`. That last one is the one deliberate hand-typed literal in D1: it is an external, dated, source-cited statement from node-iot's git history (see verification below), not derivable from facts, and it is applied only to an unmatched push binding whose endpoint ends in one of those names; any other unmatched binding would get the generic "no route matches" reason and no claim of a removal.
- **Shared-code side effects:** `EdgeRow.sourceFactId` is now nullable; the shrink/resolved-drop diff identifies a row by its source fact, or by its source symbol when it has none (so binding records are diffed correctly), and compares the resolved count by count (not by a set that would collapse fan-out).

**Dry run first (`--dry-run --print-edges`), then the real run. Exact counts:**

| PUBSUB_TOPIC_BINDING | Before | After |
|---|---|---|
| source `firebase-oskey-dev` | 14 unresolved | 14 unresolved |
| source `node-iot-api-oskey-io` | 1 resolved + 1 unresolved | 1 resolved + 1 unresolved |
| source `unknown` (binding records) | 0 | **9 unresolved** |
| **Total** | **16** | **25** (1 resolved, 24 unresolved); table **17,623 → 17,632** |

**The 10 snapshot bindings, each accounted for exactly once:**
- **1 resolved (the existing edge, reproduced):** `accessControlDevice_activities` → subscription `accessControlDevice_activities-processPubSubMessage` → push `/core-processPubSubMessage` → Firebase receiver `core-processPubSubMessage` (`functions/src/modules/core/index.ts:77`); source is node-iot's publish site `…activities_route.handler.ts:101`.
- **4 removed-route bindings** (`accessControlDevice_states`, `_systemLogs`, `_accessLogs`, `_accessCommands`): `unresolved`, no route fact matches the push path, with the `32e3d97` / 2025-09-26 / CLD1-1209 "removed on purpose, dangling, staging only" note.
- **3 bindings whose push route matches a real node-iot route** (`accessControlDevice_accesses` → `POST /access-control-devices/pubsub/accesses`, `_intercomEntries` → `…/pubsub/intercom-entries`, `_configurations` → `…/pubsub/configs`): `unresolved` because **no `pubsub_publish_call` fact names the topic** (details list the facts: 16 publish facts, firebase 14 + node-iot 2; topics statically resolved for only 2 [`accessControlDeviceConfigs`, `accessControlDevice_activities`]; 14 publish sites have an unresolved topic and may publish to it). The target fact IS recorded on these 3 rows. **D2 not built.**
- **1 scheduled-function binding** (`firebase-schedule-user-checkAccountDelete-europe-west1`): `unresolved`; push path is an App Engine push handler (`/_ah/push-handlers/…`), so the platform scheduler is the publisher and no application publish fact can exist; the only Firebase fact naming `checkAccountDelete` is `function_declaration getScheduledFunctionTriggers` (`functions/src/modules/user/index.ts:115`), which returns it, not a fact for the handler itself.
- **1 DLQ pull subscription** (`accessControlDevice_activities_dlq`): `unresolved`; pull, no push endpoint, no puller fact; topic identified from the snapshot as the dead-letter topic of `accessControlDevice_activities-processPubSubMessage`.

**The existing rows: what did and did not change** (row-by-row before/after of all 16 existing rows): **14 of 16 identical in every field.** Two changed **text only**, and every identity field (source fact, target fact, target repo, target symbol, status, provenance) is unchanged for all 16:
1. the resolved edge: `confirmed_via` now records the snapshot source and `extractedAt` (instructed), and `details` now name the subscription and endpoint and keep the earlier 2026-08-29 evidence text as "also independently confirmed";
2. one existing unresolved firebase row (`accessControlDeviceConfigs`, resolved topic, `access_control_device_public_keys.controller.ts:84`): `details` no longer cites the hand-typed list and now says the topic is not among the 11 topics in the snapshot. Still `unresolved`, status/keys unchanged (this is the known out-of-scope stale topic; nothing fixed).

**Independent verification (separate Python implementation, no shared code, from the raw snapshot JSON and raw facts):** all 10 bindings agree: the 3 real-route bindings each match exactly one route and their `target_fact_id` equals it; the 4 removed-route, the scheduled and the pull bindings have no target; the activities binding has a publisher fact and its resolved edge is from that fact to the `core-processPubSubMessage` receiver, with no duplicate record. Resolved edges in the table: 1, source = node-iot's resolved-topic publish fact, target = the receiver.

**Post-run checks:** 13 of the 15 other slices byte-identical to the post-C snapshot (the two that differ are the two existing pubsub slices, by the 2 text-only changes above), plus the new `unknown` slice; `FIELD_BINDING` 13; target `fact_id` not in `facts`: 0; resolved/confirmed with dangling source: 0 (dangling still the known 153); orphan slices: none. Every binding record has NULL source fact (so none counts as a dangling source).
- **Traversal:** `findGraphNeighbors` from the node-iot publish fact returns one outgoing `PUBSUB_TOPIC_BINDING` `resolved` to `processPubSubMessage`; from the Firebase receiver fact its one neighbour is that incoming edge. On `POST /access-control-devices/pubsub/accesses`, which an unresolved record points at, `findGraphNeighbors` returns **0** neighbours even though 1 `PUBSUB_TOPIC_BINDING` row points at it: unresolved records are visible in the table and invisible to traversal, as designed.

**Spot-check against real source (`output/clones/`, branches per `config/repos.json`):** node-iot `staging@a6cba12` `…activities_route.handler.ts:101` `pubSubService.publishMessage('accessControlDevice_activities', …)`; firebase `staging@00e1d9fd` `functions/src/modules/core/index.ts` `processPubSubMessage: https.onRequest(PubSubMessageProcessor.default.processPubSubMessage)`; the 3 surviving push routes registered at `access_control_device_{accesses,intercom_entries,configs}.route.ts` (`'/access-control-devices/pubsub/…'`); none of the 4 removed paths exists in source (0 grep hits). **Removed-routes claim verified in git history (`git log HEAD`, staging):** commit `32e3d97` (2025-09-26, `[CLD1-1209] node iot post api for activities and heartbeat (#126)`) is in staging history; before it, `src/v1/routes/access_control_device_logs.route.ts` registered exactly `/access-control-devices/pubsub/state`, `…/system-log`, `…/access-log`, `…/access-command` (lines 17/22/27/32); after it that file registers `:id/activities` and `:id/heartbeat` instead, and the commit deletes the handlers, controllers, models and schemas of all four. That confirms the removal was deliberate and total.

**Guards and resilience (each a cheap bounded test; scratch copies and throwaway rows removed; table back to the post-D1 snapshot each time):**
- Idempotent re-run: identical (17,632 rows, 32 groups, 16 slice fingerprints).
- Shrink + resolved-drop on the node-iot slice: with a throwaway resolved row (3 rows), the run printed `SHRINK 3 -> 2` and `RESOLVED DROP 2 -> 1` and changed nothing; `--accept-shrink` restored it exactly.
- Null-source diff: with a throwaway unresolved row in the `unknown` slice (10 rows), the shrink diff listed **only** that row, not the 9 real records.
- *Target no longer exists → unresolved, not dropped:* (a) with the Firebase receiver made unfindable, the activities edge became `unresolved` (target unknown, reason recorded), the join still emitted all 25 rows, the cross-check printed `WARN DISAGREEMENT` for the hand-typed entry, and without `--accept-shrink` the resolved-drop guard stopped the run; (b) with no POST routes, the 3 real-route records stayed as `unresolved` rows with "No route_definition fact with method PUT matches…" (none dropped); (c) with the snapshot file missing, the preflight failed loudly (`bindings snapshot unusable: ENOENT …`) and changed nothing.

**Open, not built:** **D2** (Firebase → node-iot for accesses / configurations / intercom-entries): its design proposal is below; **A2** untouched. `package.json` not touched; no LLM/embedding spend.

**D2 design proposal (propose only, gated):** the 3 real-route bindings need a publisher fact. (The `.env` facts in this paragraph are taken from the spec's D2 text and were **not re-checked in this session**.) Firebase's checked-in `functions/.env` defines the 7 `OSK_PUBSUB_TOPIC_ACD_*` values (exactly the 7 node-iot push topics), and only 3 are read in source (`access.controller.ts:71/75`, `access_control_device_config.controller.ts:87/92`, `building_intercom.controller.ts:61/62`), but the publish facts there are `unsupported`/`partial` because the topic is an env-var expression. The extraction-level step is to link a publish fact to its env var and resolve that var from the env file; the pattern to copy is the idempotent reference-JSON script (like the screen-map ones): a small script emits `{env var → topic}` from `functions/.env`, the join resolves a publish fact's expression through it, and the 3 records above would then be replaced by resolved edges from those publish facts. Needs the user's go-ahead (extractor-level choice).

**Notes:** the shared route reader/matcher from the Stage C amendment is used unchanged by D1; `pipeline/README.md` shows as modified from another session (not this build's file).


### 2026-09-21: Stage E, investigation (E1, E2, gate): written BEFORE any edge code

**Validator's Stage C amendment and Stage D1 verdict: approved.** Two decisions accepted (`source_repo = 'unknown'` for binding records; `REMOVED_PUSH_ROUTES` as a labelled annotation, to be deleted when the stale subscriptions are cleaned up or a route is re-added). **New process rule for the rest of the build:** no unquoted heredocs (Edit/Write, or a quoted `<<'EOF'` delimiter), and no `gcloud` command of any kind, not even a list. All queries below are read-only SQL on the facts DB, plus read-only reads of `output/clones/` on the branches in `config/repos.json`.

**runIds:** unchanged (Firebase `20260911_080454-00e1d9fd`); no re-sync.

**E1: trigger ↔ path pairing (all 28 `firestore_trigger` facts, all Firebase).**
- **Pairing rule used:** a `firestore_trigger` fact pairs with a `firestore_path_touched` fact having the **same file, same line and same `runId`** (the spec's rule). The trigger's own `evidence.firestorePath` is `"unknown"` for **all 28** (the extractor never resolves it), so the sibling is the only source of the path. The trigger's event is not a field either; it is the last identifier of `evidence.calleeExpression` (`.onCreate` / `.onUpdate` / `.onDelete`).
- **Result: 26 of 28 pair with exactly one sibling; 0 ambiguous** (0 triggers share a file:line with another trigger; 0 have two siblings). **All 26 paired paths are `resolved_constant`** with `{wildcard}` segments, e.g. `/accessControlDevices/{deviceId}/configs/{configId}`. The 26 = 10 onCreate, 7 onUpdate, 9 onDelete, over 11 distinct document paths.
- **The 2 unpaired are not Firestore triggers:** `user/index.ts:84` and `:85`, raw text `auth.user().onCreate(OSKUserService.onAccountCreated)` / `.onDelete(...onAccountDeleted)`. They are **Firebase Auth triggers**, mis-tagged by the extractor with the `firestore_trigger` kind, so having no path is correct. Extractor note for the user (not acted on): the kind name is too broad.
- **Usable-path count: 26 of 26 real Firestore triggers.**

**E2: writer side.** *Spec correction found while measuring:* the spec said the writer side is thin and that `ConfigController.save` has "a `_set` call fact but **no recorded path argument**". That is wrong. **Every `call_expression` fact records `evidence.arguments`** (the argument source texts), plus `callerName`, `callerClass`, `callerStartLine/EndLine`, `declarationFile`, `declarationClass`, `declarationMethod`. For `save`'s `_set` call, `arguments[0]` is `` `/accessControlDevices/${data.accessControlDeviceId}/configs` ``. So the writer path is derivable **from facts** (no clone-source parsing anywhere), which is what makes the gate below pass. (Same shape of correction as the Stage C route fields; the fix here is in how E2 is measured, not in the expected result.)
- **Write wrappers** (the Firebase repo's base controllers, `core/controllers/document.controller.ts` and `document_and_message.controller.ts`; I read their signatures in the `staging` clone: every one takes the **collection path as its first parameter**): `_set` (create or overwrite), `_create`, `_add` (create), `_update`, `_delete`, `_deleteAll`, `_deleteCollection` (delete). Identified by the call's resolved `declarationMethod`.
- **Call sites:** **248** calls resolve to these wrappers (`_set` 73, `_delete` 68, `_update` 58, `_deleteAll` 27, `_create` 20, `_deleteCollection` 1, `_add` 1) in **83 files**, **245 distinct writer methods** (a method = `callerClass.callerName` in a file).
- **Derivable path:** **101 of 248 (40.7%)** have a first argument that is a literal path: 80 template literals + 21 string literals (every template starts with a path word, none with an interpolation). **147 (59.3%) pass an identifier or expression** that would need constant/call resolution: `collectionPath` 60 and `collection` 25 (generic pass-throughs inside the base/helper controllers), `OSKUserController.collection` 8, `this.compositeRolesCollection` 4, and `X.getCollectionPath(...)` calls.
- **Yield, the number that matters** (scratch computation from facts only; rule = writer collection path, `${...}` and `{x}` normalised to a wildcard, must equal the trigger's path minus its last segment, same length; a trigger wildcard matches any writer segment, a writer wildcard never matches a trigger literal; event must be one the wrapper can fire): **15 writer methods reach 11 of the 26 triggers through 17 (writer, trigger) pairs.** By trigger collection: `users/{userId}/devices/{deviceId}` 6, `accessControlDevices/{deviceId}/configs/{configId}` 4, `accessControlDevices/{deviceId}` 3, `…/publicKeys/{keyType}` 2, `users/{userId}/notifications/{notificationId}` 2. **The ground-truth chain is inside this yield:** `OSKAccessControlDeviceConfigController.save` (`_set`, controller:65) → config `onCreate` **and** `onUpdate`; `.delete` (`_delete`, :80) and `.deleteAll` (`_deleteAll`, :73) → config `onDelete`.
- **15 triggers have no derivable-path writer** (roles/compositeRoles ×4, roles ×1, workflows ×6, `/users/{userId}` onCreate/onUpdate, `accessControlDevices/{deviceId}` onDelete, building-door device onCreate/onDelete). Their writers pass identifiers (`OSKUserController.collection`, `this.compositeRolesCollection`, …). Direct Firestore API writes (`.doc(x).set(...)`, chained `.update/.delete/.add`) are also not covered: their paths are only in sibling `firestore_path_touched` facts for a handful of sites (16 non-trigger path facts in the whole repo).

**Gate decision: PASSES, so the edges are built.** Reasons: the path comes from facts (no source parsing); the spec's own ground-truth chain is fully covered (`save` → create + update, `delete`/`deleteAll` → delete); every edge is a deterministic collection-path match, so precision is not in doubt; and the limit is coverage (11 of 26 triggers, 40.7% derivable sites), which is documented here with its cause. **Proposed extractor change for the rest (not built):** resolve the first argument of a write-wrapper call when it is a static property (`OSKUserController.collection`) or a call to a `getCollectionPath(...)` method whose body is a template, and record it as `evidence.resolvedPath` next to `arguments`; that would recover most of the 147 sites and the 15 unreached triggers without any join-side parsing.

**Facts about the existing graph found while checking the chain (reported, not fixed):**
1. The 4 known `save` callers are already `INTRA_REPO_CALL` **confirmed** edges into the `save` `controller_method` fact (door-add service `building_door_access_control_device.service.ts:122`; `organization_intercom_communication.service.ts` :660, :1461, :1738). Their sources are the **call-site facts**, their targets the callee **method** fact.
2. **No `INTRA_REPO_CALL` edge exists from the config handlers to `publishConfig`.** The three calls (`access_control_device_config.service.ts` lines 49, 98, 122) are `resolved` in the facts, yet the only edges from that file are three `logWarning` calls. This contradicts doc 39 §5b ("trigger→service→controller already covered by intra-repo edges"). It is an existing intra-edge gap (the intra edges were built 2026-09-11 from the resolved-graph file, not from the facts); the fix is a re-run of `build-intra-repo-edges.ts` for firebase and is a user decision, out of scope here. **[SUPERSEDED 2026-09-21, see the "Close-out" entry below: this fix claim was WRONG. A re-run will not create these edges, do not re-run it. The gap itself is real and is a pending user decision.]** Consequence for acceptance below: `findGraphNeighbors` can show `save` → handler; it cannot show handler → `publishConfig` until that gap is closed.
3. Graph model note: existing intra edges hang off call-site facts, so a method fact has only incoming edges from its callers. A trigger edge is method-level (the method's write fires the handler), which is what lets one `findGraphNeighbors(save)` show both its callers and the handlers it triggers.


### 2026-09-21: Stage E (Firestore triggers, `FIRESTORE_EVENT_TRIGGER`): DONE, pending validator

E1/E2 numbers and the gate decision are in the "Stage E, investigation" entry above, written before any edge code. This entry is the build.

**Process rule kept:** no unquoted heredocs (Edit/Write or quoted `<<'EOF'` only) and no `gcloud` command of any kind. The script contains no `child_process`/`exec`/`spawn`.

**runIds:** unchanged (Firebase `20260911_080454-00e1d9fd`); no re-sync.

**New join `firestore-trigger` (`build-cross-repo-edges.ts` v1.6.0), `ast_derived`, same-repo.** Trigger side: each `firestore_trigger` fact is paired with its sibling `firestore_path_touched` fact (same file, line, `runId`; more than one sibling = ambiguous, skipped and reported, never guessed); its event is the last identifier of `evidence.calleeExpression`; its handler is the declaration fact at (`handlerDeclarationFile`, `handlerName`, `handlerStartLine`), and exactly one must exist. Writer side: a `call_expression` resolved to a base-controller write wrapper, its collection path read from the call fact's recorded `arguments[0]` (template or string literal only; nothing parsed from source), its enclosing method fact found by (file, `callerName`, `callerStartLine`). A write matches a trigger when the collection path equals the trigger path minus its last segment (a trigger wildcard matches any writer segment, a writer wildcard never matches a trigger literal) and the wrapper can fire the trigger's event. **One edge per (writer method fact → handler fact), always `resolved`** (a statement that writing to this path is configured to run this handler; no `probable`, traversal code untouched). All extractor names are in the `CONTRACT` block; the wrapper/event vocabulary is two named maps (`FIRESTORE_WRITE_WRAPPERS`, `FIRESTORE_TRIGGER_EVENTS`); `SET_EVENT_DETAILS` holds the exact wording. No repo-name literal in code. Preflight fails loudly, changing nothing, if there are no trigger/path facts or no call resolves to a write wrapper with recorded arguments.
- **A bug the dry run caught, fixed before any write:** the first dry run showed 20 of 28 triggers as "unknown event" because their callee expression spans lines and my JavaScript regex's `.` does not match a newline (Postgres' does, which is why my scratch numbers had looked right). Fixed with a newline-safe pattern; the re-run matched the independent scratch numbers exactly.

**Dry run first (`--dry-run --print-edges`, all 17 edges read in full), then the real run. Result:**

| Measure | Expected (E1/E2) | Actual |
|---|---|---|
| Triggers usable | 26 of 28 | **26 of 28** (2 skipped: `auth.user().onCreate/onDelete`, no sibling path) |
| Ambiguous / unknown-event / handler-not-found | 0 / 0 / 0 | 0 / 0 / 0 |
| Write-wrapper call sites; readable path | 248; 101 | 248; **101** (147 identifiers/calls) |
| Readable sites landing on a trigger | 15 | **15** (0 without a single enclosing method) |
| Edges; triggers reached | 17; 11 of 26 | **17; 11 of 26** |
| Table total | 17,632 | **17,649** (+17) |

By writer: config controller `save` (`_set`) → `onDocumentCreated` **and** `onDocumentUpdated` (the exact `set` wording, "fires as create if the document is new, as update if it exists"); config `delete` and `deleteAll` → `onDocumentDeleted` ("fires on document delete"); the other 13 edges are the device, public-keys, user-device and user-notification controllers (`accessControlDevices/{deviceId}` 3, `publicKeys/{keyType}` 2, `users/{userId}/devices/{deviceId}` 6, `users/{userId}/notifications/{notificationId}` 2). 9 edges carry the `set` wording, 8 the delete wording, none other. Note (edge 16): `OSKUserNotificationController.save` (`_set`) reaches only `onDocumentUpdated`, because no create trigger is registered on that path; its details name the trigger it reaches, and no create edge is invented.

**Independent verification (separate Python implementation, deliberately different code, from the raw facts):** the expected set of (writer method fact, handler fact) pairs is **17, identical to the 17 in the table (0 only-expected, 0 only-in-table)**; all `resolved`, all `ast_derived`, none `probable`.

**Post-run checks:** all **16** pre-existing slices byte-identical to the post-D1 snapshot; the only new group is `FIRESTORE_EVENT_TRIGGER firebase→firebase resolved ast_derived 17`; `FIELD_BINDING` 13; target `fact_id` not in `facts`: 0; resolved/confirmed with dangling source: 0 (dangling still the known 153); orphan slices: none.

**Acceptance (the config chain).**
- **`findGraphNeighbors` from the `save` fact** (`controller_method`, `access_control_device_config.controller.ts:64`) returns **both handlers, `OSKAccessControlDeviceConfigService.onDocumentCreated` and `onDocumentUpdated`, via `FIRESTORE_EVENT_TRIGGER`, `resolved`**, plus its 4 existing callers (`INTRA_REPO_CALL`, confirmed: door-add `building_door_access_control_device.service.ts:122` and `organization_intercom_communication.service.ts` :660/:1461/:1738). ✔
- **`walkBoundedCluster` from the real door-add call site** (`building_door_access_control_device.service.ts:122`): depth 0 the call site, depth 1 `save`, depth 2 the config handlers `onDocumentCreated` and `onDocumentUpdated` (plus `save`'s other 3 callers); `truncated: false`. So the door-add → `save` → handler chain is connected. ✔
- **The next hop is NOT connected, and this is not caused by Stage E:** `findGraphNeighbors(publishConfig)` returns **0** neighbours, and the handler's only neighbour is the incoming trigger edge. The three `publishConfig` calls in the handlers (`access_control_device_config.service.ts` 49/98/122) are `resolved` in the facts, but no `INTRA_REPO_CALL` edge exists for them (existing intra-edge gap, logged in the investigation entry). Re-running `build-intra-repo-edges.ts` for `firebase-oskey-dev` would create them (a call-site-fact → method edge); **a user decision, not done here.** **[SUPERSEDED 2026-09-21, see the "Close-out" entry below: a re-run would NOT create them, because the resolved graph the builder reads has no such edge. Do not re-run. The gap remains a pending user decision.]** Even then the graph model links call-site facts to callee method facts, so reaching `publishConfig` from the handler *method* needs a walk through the call-site fact inside it.

**Not modelled, by instruction (stated gap).** The edge says "writing to this document path is configured to run this handler", a fact about code and config. It does **not** model "the intercom collected the document". The chain after the trigger is separate and only partly present: (1) handler → `publishConfig`: missing intra edge (above); (2) `publishConfig` → topic → node-iot: **D2 is gated** (Firebase's publish sites resolve their topic through an env var; not built); (3) node-iot's store step: node-iot has **zero `INTRA_REPO_CALL` edges**, so the node-iot side after the push route has no edge; (4) intercom `GET` → node-iot is Stage C's edge (present, `externally_configured`). So two links between the trigger and the intercom fetch are not built, plus the missing handler → `publishConfig` intra edge.

**Guards and resilience (each a bounded test; scratch copies and the throwaway row removed; table back to the post-E snapshot each time):**
- Idempotent re-run: identical (17,649 rows, 33 groups, 17 slice fingerprints).
- Throwaway resolved row (18 rows): `SHRINK 18 -> 17` and `RESOLVED DROP 18 -> 17` printed, run refused, nothing changed; `--accept-shrink` restored it exactly.
- Partial extractor change (only `_set` renamed): preflight passes, the join yields 8 edges, the guards stop it (`SHRINK 17 -> 8`, `RESOLVED DROP 17 -> 8`), 9 edges named. Full change (no call resolves to a wrapper): `PREFLIGHT FAILED -- nothing changed`. Path-fact kind renamed: `PREFLIGHT FAILED`.
- Ambiguity never guessed: with the sibling pairing broken so every trigger has several candidate paths, all 28 were reported `AMBIGUOUS` and skipped (0 usable), and the guards refused to replace the 17 edges with 0.

**Source spot-check (`firebase-oskey-dev` `staging@00e1d9fd`):** the config triggers are registered in `functions/src/modules/access_control_device/index.ts` (`.document(accessControlDeviceConfigPath).onCreate/onUpdate/onDelete(OSKAccessControlDeviceConfigService.onDocument…)`, the fact lines 84/87/90 are the property lines); the door-add service calls `OSKAccessControlDeviceConfigController.default.save(data)` at `building_door_access_control_device.service.ts:122`; `save` calls `_set(\`/accessControlDevices/${data.accessControlDeviceId}/configs\`, …)` at :65; `_set` in `document.controller.ts` is documented "creates new document, overwrite if already exists", which is exactly why a set fires both create and update.

**Coverage limits (documented, not hidden):** 15 of 26 triggers have no readable-path writer: roles/compositeRoles ×4, roles ×1, workflows ×6, `/users/{userId}` create and update, `accessControlDevices/{deviceId}` delete, and the building-door device create/delete. Their writers pass identifiers (`OSKUserController.collection`, `this.compositeRolesCollection`, `getCollectionPath(...)`). Direct Firestore API writes are not covered either. **Proposed extractor change (not built):** record `evidence.resolvedPath` on write-wrapper calls whose first argument is a static property or a `getCollectionPath(...)` call whose body is a template; that would recover most of the 147 sites and the 15 triggers with no join-side parsing. Also for the user: the extractor tags Firebase Auth triggers with the `firestore_trigger` kind.

**Not built (as instructed):** A2 and D2. `package.json` not touched; no LLM/embedding spend; scratch diagnostics deleted after their findings were written here. `pipeline/README.md` still shows as modified by another session (not this build's file).

**Correction to the validator note above (added later the same day).** Point 4 called the iOS
walk's median of about 15 members "the intended payoff of the edges". That overstated it. For
each of the 389 call-site edges, the kit declaration it points at is used by a median of **13
other call sites** (p90 and max 84; only 25 edges have no sibling). Kit-internal `INTRA_REPO_CALL`
edges are all `probable`/`unresolved` with no target, so traversal never follows them (see
`pipeline/README.md`, Stage C). So a typical walk from an iOS call site returns **one useful
member (the kit declaration) plus about 13 sibling call sites that use the same component**, not
kit internals. That makes the sibling-noise concern apply to ordinary anchors, not just the
`OSKUIExpanded` hub, and strengthens the case for a "don't expand through a heavily used target"
rule if the before/after run shows a problem. The build session's work and Stage B's acceptance
are unaffected.


### 2026-09-21: Close-out: DONE, pending validator

**Validator's Stage E verdict: approved.** They recomputed the 17 pairs independently (exact match) and verified the table (17,649), the traversal from `save` and from the door-add call site, and the Auth-trigger mis-tag. Process rule kept throughout: quoted heredocs or Edit/Write only, no `gcloud` of any kind, no `git add`/`commit`.

**Correction (supersedes two earlier statements of mine, marked in place above).** I wrote that re-running `build-intra-repo-edges.ts` for Firebase would create the handler → `publishConfig` edge. **That was wrong; do not re-run it.** The validator said so and I checked it myself against the file the builder reads (`output/runs/firebase-oskey-dev/20260911_080454-00e1d9fd/knowledge-pipeline/resolved-engineering-graph.json`): it holds 2,222 confirmed cross-module edges and 119 confirmed intra-module edges; the only row that mentions `publishConfig` is `publishConfig` calling `_publishMessage` (it as the *caller*), so **0 edges target `publishConfig`**; the config service has 3 rows (the cross-module `logWarning` calls) and **0 intra-module edges**. Same-module service → controller calls are not edges in that graph, so no rebuild can produce them. **The handler → `publishConfig` gap is a pending USER DECISION** (options and sizing in proposal P7 below).

**Close-out items (all in `pipeline/facts-postgres-index/build-cross-repo-edges.ts`, v1.7.0, unless stated):**
1. **Per-pair coverage summary**, printed at the end of every run (whole table, read-only): (a) edges by `(connection_type, source -> target, provenance)` with status counts, and any pair a join expects but finds empty; (b) **dangling source AND target** counts per `(connection_type, repo)`, split by `resolution_status`, with a loud verdict for the followed statuses (`resolved`/`confirmed`); (c) per `(repo, connection_type)`, whether the edges were built before the repo's newest extraction run (`extraction_runs.extracted_at` of the newest run vs the edges' `generated_at`).
2. **Base-controller classification report**, printed by the `firestore-trigger` join. The "base controllers" are the files that declare the write wrappers (learned from the calls). Any other method declared there that is called **from another file** and is in neither `FIRESTORE_WRITE_WRAPPERS` nor the new `FIRESTORE_READ_WRAPPERS` list is reported, so a newly added wrapper shows up. (Calls from within the same file are excluded: without that, 11 lowercase methods such as `create`/`delete`/`set` were reported, which are just a wrapper delegating to its own internal implementation class.)
3. **Stale comment fixed in both `graph-traversal.ts` copies** (`mcp-server/db/` and `pipeline/facts-postgres-index/_shared/`): the original reasoning is kept ("four connection_types that existed then", "was 2,362"), and a dated update note says six types exist now (adds `PACKAGE_SYMBOL_USE` and `FIRESTORE_EVENT_TRIGGER`), `INTRA_REPO_CALL` alone is 17,064, the conclusion still holds, the measured `OSKUIExpanded` hub (85 incoming) hits the `maxFacts` cap at depth 1, only `resolved`/`confirmed` edges are followed, and a followed edge with a dangling source makes the walk throw. **Comment-only, proven:** with every `//` line stripped, the code lines of each copy are identical to their pre-edit state; both files still type-check.
4. **Snapshot path is now script-relative**: `path.resolve(__dirname, "..", "..", …)` (the repo has no `"type": "module"`, so the script is CommonJS and `__dirname` exists). Verified from an unrelated working directory: the pubsub join loads all 10 bindings; the old `process.cwd()`-based code, run from the same directory, fails with `bindings snapshot unusable: ENOENT`.

**Tests of the new reports (each bounded; throwaway row and scratch copies removed; table identical afterwards):**
- *Classification report:* with `_deleteAll` removed from the write table (simulating a newly added wrapper), it appeared in the report (7 external call sites in `document_and_message.controller.ts`, 20 in `document.controller.ts`).
- *Zero-edge pair:* a scratch variant whose join "expects" a repo with no edges printed `EXPECTED PAIRS WITH ZERO EDGES: HTTP_API_CALL / zz-fake-repo (join rest-route discovers it as a source)`.
- *Dangling on a followed edge:* a throwaway `INTRA_REPO_CALL` row with `resolution_status = 'resolved'` and a non-existent source fact printed `dangling SOURCE 1 resolved` and `DANGLING ON A FOLLOWED EDGE (resolved/confirmed): 1. walkBoundedCluster will THROW when it reaches one.` Row deleted; table back to the post-E snapshot.

**What the new reports show on the real table (findings, nothing fixed):**
- **Dangling: 153, all on statuses traversal never follows; 0 on `resolved`/`confirmed`; 0 dangling targets.** By slice: android-intercom 2 unresolved; swift-ble 6 unresolved; swift-ui 23 probable + 85 unresolved; swift-webrtc 37 unresolved. Zero expected pairs are empty.
- **7 `(repo, connection_type)` slices have edges built BEFORE the repo's newest extraction run:** `INTRA_REPO_CALL` for android-intercom (3,590 edges vs the 2026-09-18 run), ios (8,734), swift-ble (245), swift-cloud-kit (510), swift-ui (625), swift-webrtc (651) (all vs the 2026-09-20 runs), and, a new finding, **Angular `FIELD_BINDING` (13 edges, built 2026-09-05, before Angular's newest run of 2026-09-11)**. Stale is not the same as broken: only the 4 slices above with dangling sources are broken today (153 rows); Angular `FIELD_BINDING` and the ios intra edges have 0 dangling. Every edge from this build (all five joins) is newer than its repos' runs.
- **Base-controller report: 5 methods in neither table:** `_deleteImage` (4 external call sites) and `_uploadImage` (4) (Storage image helpers), `_publishMessage` (4) (a pub/sub message, not a Firestore document), and **`_removeFromArrayField` (1) and `_removeFromArrayFieldByPredicate` (1)**. I read the last two in the `staging` clone: both take `(collection, documentId, …)` and update the document inside a transaction (the predicate variant can delete it when `deleteIfEmpty`), so they are **genuine Firestore writers that the write table does not classify** and that would fire `onUpdate`/`onDelete` triggers. Their two call sites pass `OSKPropertyController.collection` and `collectionPath`, which are not readable literals, so classifying them would add **0 edges today**; the report exists so they do not vanish silently.

**Final proof: the final script reproduces the whole table.** A **full real run of all five joins** with the final script (v1.7.0) printed `existing N -> new N` with identical status splits for every slice, no guard fired, and the resulting table is **identical to the post-Stage-E snapshot** (17,649 rows, 33 groups, 17 slice fingerprints).

**Final full-table comparison (current table vs the Stage 0 baseline and every stage snapshot; every difference is attributable):**

| Compared to | Rows then → now | Slices byte-identical | Differences (all explained) |
|---|---|---|---|
| Stage 0 baseline | 17,195 → **17,649 (+454)** | 9 of 12 | +454 = A 34 + B 389 + C 5 + D1 9 + E 17. Changed content: `HTTP_API_CALL` angular (the 5 unresolved rows' `details` text, Stage A), `PUBSUB` firebase (1 row's text) and `PUBSUB` node-iot (`confirmed_via`/`details`), both D1. New slices: `HTTP_API_CALL` swift-cloud-kit (A), `PACKAGE_SYMBOL_USE` ios (B), `HTTP_API_CALL` android (C), `PUBSUB` `unknown` (D1), `FIRESTORE_EVENT_TRIGGER` firebase (E). |
| post-Stage A | 17,229 → 17,649 (+420) | 11 of 13 | B + C + D1 + E only |
| post-Stage B | 17,618 → 17,649 (+31) | 12 of 14 | C + D1 + E only |
| post-Stage C (+ amendment) | 17,623 → 17,649 (+26) | 13 of 15 | D1 (+9 and the 2 text changes) + E |
| post-Stage D1 | 17,632 → 17,649 (+17) | 16 of 16 | E only (+17) |
| post-Stage E | 17,649 → 17,649 (0) | 17 of 17 | none |

- **Untouched types:** all **9** `INTRA_REPO_CALL` (8 repos) and `FIELD_BINDING` slices (**17,077 rows**) are byte-identical to the pre-build baseline. Latest `runId` per repo is unchanged in every comparison (no re-sync happened at any point of the build).
- Edge counts by type now: `HTTP_API_CALL` 141 (angular 102, swift-cloud-kit 34, android 5), `PUBSUB_TOPIC_BINDING` 25, `PACKAGE_SYMBOL_USE` 389, `FIRESTORE_EVENT_TRIGGER` 17, plus the untouched `INTRA_REPO_CALL` 17,064 and `FIELD_BINDING` 13.

**Not done, deliberately:** `package.json` was **not** touched (no `pipeline:edges` script added); the 153 dangling edges were not fixed; nothing was rebuilt in the intra or lineage builders; A2 and D2 were not built. Doc 36 §2 ("mark answered", in the original close-out list) was not marked: it was not in this close-out's list, so I left it for the user. No LLM, embedding or GCP spend at any point; scratch diagnostics deleted after their findings were written here.

#### Proposals (proposals only; none of this is work done or authorised)

- **P1: extractor change for the 15 triggers with no readable-path writer.** Record `evidence.resolvedPath` on write-wrapper calls whose first argument is a static property (`OSKUserController.collection`) or a call to a `getCollectionPath(...)` method whose body is a template. Expected effect: recovers most of the 147 unreadable call sites and up to the 15 unreached triggers (roles, compositeRoles, workflows, `users/{userId}` create/update, `accessControlDevices/{deviceId}` delete, building-door device create/delete) with no join-side parsing. Related: add `_removeFromArrayField` and `_removeFromArrayFieldByPredicate` to the write table as update writers once their paths are readable, after the user confirms the semantics; and stop tagging Firebase **Auth** triggers with the `firestore_trigger` kind.
- **P2: D2 (Firebase publish sites → node-iot, 3 topics).** Design as in the D1 entry: an idempotent reference-JSON script (like the screen-map ones) emits `{env var → topic}` from Firebase's `functions/.env`, the join resolves a publish fact's topic expression through it, and the 3 real-route binding records (`accesses`, `intercomEntries`, `configurations`) become resolved edges. Needs the user's go-ahead (extractor-level choice). The `.env` facts in that design come from the spec and were never re-checked here.
- **P3: A2 (iOS export-group alias, 7 of the 10 swift-cloud-kit misses).** Derive the export-group → module mapping from Firebase's `functions/src/index.ts` (`export const unit = {...unitTriggers.getCallableFunctionTriggers…}`) as a new fact kind, never a hand-typed table. Up to 31/34 resolve; `removeInhabitantFromUnit` still needs the mapping to choose between `admin` and `unit_management`. The other 3 misses are dead/superseded iOS code and stay unresolved.
- **P4: an edges entry point (`pipeline:edges`).** One script that runs the intra, cross and lineage builders in order and is wired after the sync step, so a merge → re-extract → sync no longer leaves stale edges. The coverage summary's `STALE` and `DANGLING ON A FOLLOWED EDGE` lines are the natural gate; an optional `--fail-on-stale` exit code would let it stop a pipeline. Until then "re-sync a repo, then rebuild its edges" is a manual habit, and the summary now tells you when it was skipped (7 slices today).
- **P5: cleanup of the 153 dangling `INTRA_REPO_CALL` edges** (android-intercom 2, swift-ble 6, swift-ui 108, swift-webrtc 37; all have a null target and are `unresolved`/`probable`, so traversal never follows them). Options: (a) rebuild those four repos with `build-intra-repo-edges.ts`, which drops edges whose source fact no longer exists, only after confirming each repo's current run has a fresh `resolved-engineering-graph.json` (doc 22 refreshed the swift kits, not android); (b) delete the 153 rows outright, which is safe because none is ever followed. Decide before the next `ios-oskey-dev` re-sync.
- **P6: retire hand-typed knowledge once it is redundant.** `CONFIRMED_PUBSUB_BINDINGS`: the snapshot join has reproduced its one entry on every run since D1 (0 disagreements), so delete the constant and its cross-check block, first moving the 2026-08-29 evidence text (subscription naming convention, receiver code comment, message shape) into the snapshot's documentation so it is not lost. `REMOVED_PUSH_ROUTES` (accepted by the validator as a labelled annotation): delete it when the stale staging subscriptions are cleaned up or a route is re-added.
- **P7: handler → `publishConfig` and the wider same-module gap (PENDING USER DECISION).** Sizing, read-only, today: Firebase has **5,832** resolved call facts that name a declaration in the repo; only **2,341 (40%)** have an `INTRA_REPO_CALL` edge; **3,491 (60%) have none**, of which 1,882 are within the same module and 936 within the same file. So the missing `publishConfig` edge is one instance of a class. Options: (a) a small facts-based same-repo join that turns each resolved `call_expression` fact (which already records `declarationFile`, `declarationMethod`, `resolutionStatus`) into a call-site → callee-method edge, closing the whole class for every repo and needing no resolved-graph file (this is the join the intra builder cannot be); (b) accept the gap and rely on agents following `FIRESTORE_EVENT_TRIGGER` to the handler and reading its body. Not started. Either way, do NOT re-run `build-intra-repo-edges.ts` for this.
- **P8: hub cap decision (from Stage B, still open).** `findGraphNeighbors(OSKUIExpanded)` returns 85 rows / 35,071 bytes and one `walkBoundedCluster` from it 73,491 bytes, `truncated: true` at depth 1. Whether to add a per-call cap or hub-aware summarisation before the agent leans on kit-side anchors is the user's call; no cap or traversal change was made.
- **P9: Apigee proxy export** so Stage C's `/iot` strip becomes deterministic (a reference JSON like the pubsub snapshot), and Stage C's edges could move off `externally_configured`.
- **P10: three small findings to pass on.** Angular's `organization-assigningBuildingToProperty` names a callable that exists only under module `building` (a client bug or a moved callable); the stale Firebase publish topic `accessControlDeviceConfigs` (not among the snapshot's 11 topics; the subscribed topic is `accessControlDevice_configurations`); Angular `FIELD_BINDING` (13 edges) predates Angular's newest run and should be rebuilt with the next lineage run.
