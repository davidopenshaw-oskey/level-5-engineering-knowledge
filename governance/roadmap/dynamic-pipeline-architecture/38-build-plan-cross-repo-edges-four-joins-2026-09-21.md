# Build plan: closing the cross-repo edge gap (four joins)

Decide-stage doc, written 2026-09-21. **Nothing built.** No code edited, no `cross_repo_edges`
rows written, no git add/commit. Follows the investigate → decide → build pattern: docs
[29](29-findings-cross-repo-edges-scope-gap-2026-09-21.md) (gap found) →
[30](30-investigation-prompt-cross-repo-edges-extension-2026-09-21.md) (investigation prompt) →
[31](31-findings-cross-repo-edges-extension-scope-2026-09-21.md) (real scope) → this plan.
Related: [35](35-collated-action-plan-2026-09-21.md) §2d,
[36](36-session-handoff-2026-09-21.md) §2 (an earlier, unconfirmed build order, revised below).

---

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
`route_definition` (18 facts): **method and path are packed into `payload.value`**
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
