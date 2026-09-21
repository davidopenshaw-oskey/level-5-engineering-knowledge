# Findings: Stage 0 live verification for the cross-repo edge build plan (doc 38)

Read-only, zero-spend Postgres queries plus a read of the local `firebase-oskey-dev` clone,
run 2026-09-21 against `facts-postgres-index-local`. Nothing built, no rows written, no
git add/commit. Written as findings land; sections marked **PENDING** are not yet checked.

## 1. Baseline `cross_repo_edges` (17,195 rows, matches docs 29/31 total)

Corrects doc 38 Stage 0's expectation ("110 Angular→Firebase" as one group):

| connection_type | source → target | status | count |
|---|---|---|---|
| HTTP_API_CALL | angular → firebase | resolved | **97** |
| FIELD_BINDING | angular → firebase | resolved | **13** |
| HTTP_API_CALL | angular → unknown | unresolved | 5 |
| PUBSUB_TOPIC_BINDING | firebase → unknown | unresolved | 14 |
| PUBSUB_TOPIC_BINDING | node-iot → unknown | unresolved | 1 |
| PUBSUB_TOPIC_BINDING | node-iot → firebase | resolved (externally_configured) | 1 |
| INTRA_REPO_CALL | 8 repos, same-repo only | mixed | 17,064 |

- Doc 29's "110 angular→firebase" is 97 `HTTP_API_CALL` + 13 `FIELD_BINDING` (the latter from
  `build-form-field-lineage-edges.ts`, not this script). Doc 29's "20 → unknown" is 5 + 14 + 1.
  Angular's 102 callable calls = 97 resolved + 5 unresolved. The baseline for Stage 0's
  acceptance check must be these per-`connection_type` groups, and `FIELD_BINDING` must stay
  untouched.
- **node-iot has zero `INTRA_REPO_CALL` edges** (none of the 8 same-repo pairs listed is
  node-iot). Not investigated here. It affects how well any cross-repo edge *into* node-iot
  (Stages C, D) can be followed further inside node-iot. Worth its own check.

## 2. iOS→Firebase (Stage A): 24 of 34 resolve, but the 10 misses are two different problems

`swift-cloud-kit-oskey-dev` has 34 `firebase_callable_call` facts (Angular has 102). Simulating
the existing `module::handlerName` join: **24 resolve, 10 don't**. The 10:

**7 misses = a real module-alias mismatch, not missing endpoints.** The client function prefix
is `unit` (e.g. `unit-createUnitInvitation`); Firebase's `api_contract` facts label the module
`unit_management`. Every one of the 7 exists under `unit_management` (createUnitInvitation,
getAllUnitInhabitantsAndGuests, getUnitPerson ×2 call sites, removeInhabitantFromUnit,
removePendingInvitation, removePermanentGuest). Cause, read directly from
`firebase-oskey-dev/functions/src/index.ts`: the deployed function **group** is named by the
export (`export const unit = { ...unitTriggers.getCallableFunctionTriggers(...) }`, imported
from `@oskey/unit/management`), which differs from the module directory name. Angular never hit
this because it has zero `unit-*` calls. `removeInhabitantFromUnit` also exists under `admin`
(the known collision), so a bare-name fallback would be unsafe. **Consequence for doc 38 Stage
A**: it is *not* a pure repo-filter widening. It needs an export-group → module mapping, and
that mapping is not in the extracted facts (Firebase's root `functions/src/index.ts` has no
facts: 0 rows for that file). Options for the build session: extract the export-group
declarations from Firebase's index (dynamic, preferred), or accept 24/34 and record the 7 as
unresolved with a clear reason. Never a hand-typed alias table (dynamic rule).

**3 misses = real drift, correctly unresolved:**
- `organization-verifySmsOtpCode`: exists in Firebase source but is **commented out**
  (`organization_onboarding_inhabitant/index.ts:45`, `// verifySmsOtpCode: https.onCall(...)`).
  iOS calls a disabled callable.
- `user-approvePendingFriendRequest`, `user-rejectPendingFriendRequest`: **no occurrence
  anywhere** in the local Firebase source. Caveat: the local clone is on `develop`, the index
  was extracted from `staging` (per `config/repos.json`), so this is evidence, not proof, for
  the indexed branch.

These 3 are probably worth surfacing to the user as a finding in their own right (iOS calling
endpoints Firebase doesn't currently expose), independent of the graph work. Not confirmed on
the deployed backend.

Net: with an export-group mapping, Stage A would resolve up to **31/34**; without it, 24/34.

## 3. iOS↔Swift-kit (Stage B): doc 31's numbers hold, ambiguity is small and uniform

Re-confirmed live: 389 iOS `call_expression` facts with `resolutionMethod = resolved_via_import`
and a `declarationRepo` other than `ios-oskey-dev`; 262 simple-callee + 127 complex-callee;
by kit 222 ui / 135 cloud / 20 ble / 12 webrtc (all identical to doc 31).

- **The payload carries `declarationRepo`/`declarationFile`/`declarationModule` but not the
  declared symbol name.** The symbol has to be recovered from `calleeExpression`. Leading
  identifier (`^\s*[A-Za-z_]\w*`) extracts cleanly for **all 389** (0 with no leading
  identifier), e.g. `OSKUIBottomPopup { ... }.showAndReplace` → `OSKUIBottomPopup`.
- **All 389 (simple and complex) match at least one fact in the target `declarationFile` by
  symbol name.** So the "127 complex" slice is not the open question doc 31 left it as: leading
  identifier + same match works. (Existence only; see the extractor-trust caveat in doc 38 §5.)
- **Ambiguity**: 368 match exactly one `*_declaration` fact; **21 (5.4%) match two or three,
  and every one is a primary `class_declaration`/`struct_declaration` plus one or more
  `extension_declaration` in the same file** (17 class+extension, 2 class+2 extensions, 2
  struct+extension). A single rule ("prefer the non-extension declaration; if none, or more
  than one primary, leave unresolved") settles all 21 deterministically.
- **The 389 edges point at only 72 distinct declarations.** So the graph gains 72 new reachable
  kit-side facts, not 389. The top targets are hubs: `OSKUIExpanded` 85 incoming call sites,
  `OSKUIContentView` 33, `OSKUIProgressIndicator` 25, `OSKCKStorageFilePathService` 21,
  `OSKUIOTPCodeField` 20. The existing walk cap (80 facts, depth 6) matters here: a walk that
  reaches `OSKUIExpanded` will hit it.
  **Update 2026-09-21: measured, see doc 38's Build log, "Stage B" entry, "Hub measurement"
  paragraph** ([38-build-plan-cross-repo-edges-four-joins-2026-09-21.md](38-build-plan-cross-repo-edges-four-joins-2026-09-21.md),
  line ~675): on the built edges `findGraphNeighbors(OSKUIExpanded)` returns 85 rows / 35,071 bytes
  and one `walkBoundedCluster` from it returns 80 members + 164 edges / 73,491 bytes, `truncated: true`
  (the cap is hit at depth 1). Report only; no cap added, whether to add one is a pending user decision.

## 4. android→node-iot (Stage C): confirmed, with a data-shape gotcha

- `rest_endpoint_call`: exactly **5** facts in the whole index, all in `OSKApiService.kt`
  (GET config, GET config/{modificationDate}, GET intercom-entries, GET accesses, POST
  activities/intercom). Complete as far as the extracted facts go. Android has no other
  http/rest/retrofit/endpoint fact kind.
- Fields differ by side: android's `rest_endpoint_call` has `evidence.httpMethod` and
  `evidence.path` (the `/v1/iot/...` template). node-iot's `route_definition` has **no method
  or path fields**: `evidence.path` is the *source file*, and the method and route are packed
  into `payload.value` as one string, `"GET /access-control-devices/:id/config"`. The join must
  split that string; doc 38 Stage C assumed structured fields.
- node-iot has **18** `route_definition` facts from 5 route files only.
- **Correction (validator, 2026-09-21, found when the build session checked):** the bullet above
  saying node-iot routes have "no method or path fields" is **wrong**. I queried the android
  field names (`httpMethod`, `path`) against node-iot, whose facts name them
  `evidence.method` and `evidence.httpPath`. Verified live: all 18 `route_definition` facts
  carry both, and all 18 agree with the packed `payload.value` string. The Stage C build parsed
  `value` as the spec (wrongly) instructed; the result is identical (5/5), but the structured
  fields are the cleaner contract.

## 5. Pubsub (Stage D): the picture is thinner, and stranger, than doc 31/38 said

**The 4 "unmatched" node-iot push routes have no trace anywhere.** No fact of any kind in
node-iot's 1,432 facts (44 files) mentions `system-log`, `access-log`, `access-command`, `state`
or the matching camelCase names. Only 5 route files were extracted (accesses, activities,
configs, firmwares, intercom_entries). Either the handlers are not implemented or not in the
indexed source; the node-iot repo isn't cloned locally, so I couldn't distinguish. The 3
matched push routes (accesses, configs, intercom-entries) are real `POST .../pubsub/...`
route facts.

**Firebase's 14 publish facts are not "14 env-var topics" (that was doc 38's reading of a code
comment):**
- 12 are `unsupported` (topic is a pass-through parameter or expression, e.g. `topicName`,
  `intercomDoc.accessControlDeviceId`),
- 1 is `partial`: `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}`
  (`building_intercom.controller.ts:62`),
- 1 is `resolved`: the string literal **`accessControlDeviceConfigs`**
  (`access_control_device_public_keys.controller.ts:84`).

**That literal does not exist in staging.** The live topic is
`accessControlDevice_configurations`; `accessControlDeviceConfigs` also appears only in a
commented-out legacy trigger in Firebase's `index.ts:211`. So either that publish path is
stale/dead or it targets a topic name that isn't provisioned in `staging-oskey-io` (not
checked on production/dev). Worth surfacing separately.

**Env-var naming does line up with the 3 route-matched topics, circumstantially.** Firebase
source has getters returning `process.env.OSK_PUBSUB_TOPIC_ACD_ACCESSES`
(`access.controller.ts:75`), `..._CONFIGURATIONS` (`access_control_device_config.controller.ts:87`)
and `..._INTERCOM_ENTRIES` (`building_intercom.controller.ts:61`), the same three topics whose
push routes match node-iot. That is naming resemblance only. The values are **not** in the
checked-in `.env.staging` / `.env.dev` (no `PUBSUB` entries at all), so they live in deployed
runtime config. **Not checked**: `gcloud functions describe` (a different GCP API from the
pubsub listing already authorized; would need your go-ahead) or wherever the team sets them.

Net for Stage D: D1 (make the one existing edge deterministic) is unchanged. D2 (Firebase →
node-iot for accesses / configurations / intercom-entries) is plausible but needs runtime env
values *and* linking three Firebase publish facts (`access.controller.ts:71`,
`access_control_device_config.controller.ts:92`, `building_intercom.controller.ts:62`) to those
getters, an extraction-level step, not just a join.

## 5a. Corrections after inspecting the real indexed clones (user pointed to `output/clones/`)

Everything in §2 and §5 above that says "local clone" was first read from
`~/development/firebase-oskey-dev` on `develop`, and node-iot was wrongly described as "not
cloned locally". The pipeline's own clones are in
`output/clones/<repo>/`, on the indexed branch (`staging`, same commit the facts were extracted
from: firebase `00e1d9fd` = the `runId 20260911_080454-00e1d9fd` seen in the facts). Re-checked
there:

- **iOS's 3 unresolved calls (of the 31/34 reachable)** are `organization-verifySmsOtpCode`,
  `user-approvePendingFriendRequest` and `user-rejectPendingFriendRequest`. Confirmed on the
  indexed `staging` clone: `verifySmsOtpCode` is commented out
  (`organization_onboarding_inhabitant/index.ts:45`, and its service body at :1234+ is
  commented too); the two friend-request callables appear nowhere in `functions/src`.
  **User confirmed: these 3 are dead-end / superseded iOS code.** So they are correct
  unresolved edges by design, not a join gap. Effective Stage A ceiling is 31/34 = every
  live call site.
- **Firebase's checked-in `functions/.env` holds the pubsub topic values** (my earlier "not
  in the `.env` files" was wrong; I had only checked `.env.staging`/`.env.dev` on the wrong
  branch):
  `OSK_PUBSUB_TOPIC_ACD_ACCESSES=accessControlDevice_accesses`, `_ACCESS_LOGS=…accessLogs`,
  `_ACCESS_COMMANDS=…accessCommands`, `_CONFIGURATIONS=…configurations`,
  `_INTERCOM_ENTRIES=…intercomEntries`, `_STATES=…states`, `_SYSTEM_LOGS=…systemLogs`. Those are
  **exactly the 7 topics whose live push endpoint is node-iot**. So Firebase → topic → node-iot
  is now deterministic at the config level (env var name → value from the repo's own `.env`),
  not a naming guess. Only 3 of the 7 env vars are *used* in Firebase source (`ACCESSES`,
  `CONFIGURATIONS`, `INTERCOM_ENTRIES`, the same 3 with matching node-iot routes). The other 4
  (`ACCESS_LOGS`, `ACCESS_COMMANDS`, `STATES`, `SYSTEM_LOGS`) are defined but never read by
  Firebase source.
- **The 4 unmatched push routes are confirmed absent from node-iot's `staging` source**:
  `grep` for `system-log|access-log|access-command|state` across the whole clone's `src`
  returns nothing; only 5 route files and 5 handlers exist. Together with the previous bullet:
  those 4 topics + subscriptions are provisioned in GCP (and named in Firebase's `.env`), but
  neither side's `staging` code publishes or receives them. Either provisioned ahead of code
  or served from a different branch/deploy: **an open question for the user** (see doc 38).
- The stale literal `accessControlDeviceConfigs`
  (`access_control_device_public_keys.controller.ts:84`) still stands.

## 5b. User's follow-up questions, answered from git history (2026-09-21)

**Are the 4 unmatched push routes redundant, or not yet implemented? Redundant: removed on
purpose.** node-iot commit `32e3d97` (2025-09-26, `[CLD1-1209] node iot post api for activities
and heartbeat (#126)`, hlamy-oskey) deleted the four controllers
(`access_commands`, `access_logs`, `states`, `system_logs`, 27 lines each) and the four routes
(`/pubsub/state`, `/system-log`, `/access-log`, `/access-command`), and added one consolidated
`access_control_device_logs.controller.ts` (86 lines, MongoDB-backed, `createActivitie` and
heartbeat handling) behind the HTTP `POST .../activities` routes. The routes had existed since
`e79a371` (2024-05-13, `[IEOI-61] Change pub-sub routes to be generic for all ACDs`). Firebase
side: the only commit that touches the four `OSK_PUBSUB_TOPIC_ACD_{ACCESS_LOGS,ACCESS_COMMANDS,
STATES,SYSTEM_LOGS}` strings is `f7c163c2` (2024-05-13, `[FIR1-357] Remove topics & subscription
per ACD`), so their `.env` entries are leftovers. **Consequence**: the 4 live staging
subscriptions still push to endpoints that no longer exist in node-iot `staging` source (dangling
infra, assuming the deployed service matches `staging`; user thinks probably yes). Not verified:
what now receives state/system-log/access-log/access-command data, if anything. The new logs
controller only covers activities and heartbeat. For the graph these 4 are correctly
**unresolved with a stated reason**, not a gap to close. Every one also stays visible in the
sanity output (Stage 5) as a stale-subscription finding.

**Did config publishing move (e.g. to a Firestore trigger under building/units/doors)?
Partly right: it *is* trigger-driven, but under the `access_control_device` module.**
`publishConfig` (`access_control_device_config.controller.ts:90`, topic from
`OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS`) is called from
`OSKAccessControlDeviceConfigService.onDocumentCreated/Updated/Deleted`
(`access_control_device_config.service.ts:49/98/122`), which `access_control_device/index.ts:86-92`
registers as **Firestore document triggers** (`onCreate`/`onUpdate`/`onDelete`), and also from
`organization_intercom_communication.service.ts` (lines ~650, 660, 1461, 1728, 1738), i.e.
also from callable/business code, not only triggers. Nothing under building/unit/door
publishes configs. So the correct graph source fact is the publish site
(`config.controller.ts:92`), with trigger→service→controller already covered by
intra-repo edges. Implication for D2: the source fact should be that publish call site, and
its topic resolves via the getter's `process.env.OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS`.

**Follow-up (user asked: aren't configs published when a device is added to a door?): yes,
and my "also called from business code" above was imprecise. Traced on `staging`, this is
the actual chain, all via Firestore triggers:**
1. Device doc created at `/buildings/{b}/doors/{d}/accessControlDevices/{deviceId}` fires
   `onBuildingDoorAccessControlDeviceCreated` (`building_door/index.ts:45`) →
   `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated`.
2. That handler assigns the door, generates a keypair (`generateKeys`, writes to the door's own
   `.../keys/publicKey`), builds a default config and calls
   `OSKAccessControlDeviceConfigController.default.save(data)`
   (`building_door_access_control_device.service.ts:122`), a Firestore write to
   `/accessControlDevices/{deviceId}/configs/{date}`.
3. That write fires `onAccessControlDeviceConfigCreated`
   (`access_control_device/index.ts:12/85`, path `/accessControlDevices/{deviceId}/configs/{configId}`)
   → `OSKAccessControlDeviceConfigService.onDocumentCreated` → `publishConfig` (:49) → topic
   `OSK_PUBSUB_TOPIC_ACD_CONFIGURATIONS`.
- Removal mirrors it: door-device delete → `deleteAll` configs (:147) → each delete fires the
  config `onDocumentDeleted` → `publishConfig` (`operation: 'delete'`).
- **Correction**: `publishConfig` has exactly **three** callers, all in
  `access_control_device_config.service.ts` (the create/update/delete triggers). The
  `organization_intercom_communication.service.ts` sites I listed (scheduled deactivation
  ~660, `_updateDeviceConfigWithMessage` ~1461, `deleteIntercomCommunication` ~1738) call
  `ConfigController.save`, so they publish **indirectly** through the same trigger.
- The door-add flow writes `.../keys/publicKey` under the door, not
  `/accessControlDevices/{id}/publicKeys`, so it does **not** itself fire the public-keys
  trigger that publishes to the stale `accessControlDeviceConfigs` topic. What writes that
  `publicKeys` path was not traced.
- **Correction (validator, 2026-09-21, found in Stage E):** the sentence below claiming the
  "trigger → service → controller" half "is already covered by intra-repo edges" is **wrong for
  the last hop**. The three `OSKAccessControlDeviceConfigController.default.publishConfig(...)`
  calls inside the config trigger handlers resolve in the facts, but **no `INTRA_REPO_CALL`
  edge exists for them** (`findGraphNeighbors(publishConfig)` = 0; the handlers have no
  outgoing edges). Cause traced to the input, not the DB: the run's
  `resolved-engineering-graph.json` has 0 edges targeting `publishConfig` (2,222 confirmed
  cross-module + 119 confirmed intra-module edges only; 1,550 same-module service calls are not
  edges), so re-running `build-intra-repo-edges.ts` would not create it.
- **Graph implication (not scoped, flag only)**: `cross_repo_edges` has **0** Firestore-trigger
  edges (the schema comment lists `FIRESTORE_EVENT_TRIGGER` as a planned type; none exist), so
  this write → trigger → publish chain, which is how the config actually reaches node-iot, is
  invisible to `walk_cluster`/`get_graph_neighbors`. A call-based intra-repo edge can't see it
  because no code calls the trigger handler directly. This is a fifth, same-repo edge
  opportunity, separate from the four cross-repo joins.

**Second follow-up (user: Angular can create building settings and messages to intercoms,
saved in Firebase and added to the intercom config, another trigger for the ACD config push).
Checked on `staging`: messages yes, building settings no code path found.**
- **Messages to intercoms: confirmed, and it is the *second writer* of the same config
  trigger.** Angular `organization-createIntercomCommunication` (a resolved
  `HTTP_API_CALL` edge already exists) → Firebase `createIntercomCommunication`
  (`https.onCall`) → `_updateDeviceConfigWithMessage` (`organization_intercom_communication.service.ts:1420`;
  called at :1348 immediately, and at :584 from `executeScheduledActivation`; delete/deactivate
  paths at :660 and :1738 use `save` too). It copies the device's most recent config,
  sets `homeScreen.message`, and calls `ConfigController.save` → the same Firestore
  `/accessControlDevices/{id}/configs/{configId}` create trigger → `publishConfig` →
  `accessControlDevice_configurations` → node-iot `POST /pubsub/configs` → Mongo → intercom
  `GET .../config`. So exactly two code paths write config docs: the door-add service and the
  intercom-communication service; both are invisible to the graph after the `save` call.
- **Building settings: no path found.** `updateBuildingSettings` (Angular
  `building-updateBuildingSettings`, resolved edge) writes only the building settings document.
  On `staging` there is no Firestore trigger on a building-settings path, no reference to
  configs/pubsub/devices anywhere in `building_settings`, and the config type's
  `homeScreen.meteo` and `homeScreen.branding` are declared but **never written by any
  code** (the door service leaves `homeScreen: {}` with a TODO). Only the two writers
  above touch a config doc. Either building settings reach the intercom another way (e.g.
  intercom or node-iot reads them directly), or that push isn't implemented on `staging`.
  Open question for the user.
- **Resolved by user + checked (2026-09-21): building settings do not reach the intercom, and
  the apps get them from per-user Firestore documents, not Remote Config.** User's account:
  building settings moved to Firebase Remote Config and only interface with the apps (iOS and
  the not-yet-onboarded android app, `android-oskey-io`). Checked on the indexed branches:
  - Remote Config *is* used by iOS and `android-oskey-io`, but the only keys read are
    `OskeyAppUpdateToVersion` and `SupportPhoneNumber` (iOS `OSKAppUpdateCheckerService.swift`;
    android `RemoteConfigManager.kt`). Neither reads a building-settings key. No Remote Config
    code or template in Firebase `staging` (templates are edited in the Firebase console, so
    they would not be in the repo; I can't see what else is set there). `android-intercom-oskey-io`
    and Angular have no Remote Config use at all, consistent with "not the intercom".
  - What the apps *do* read: `swift-cloud-kit` has a Firestore path
    `/users/{userId}/buildingSettings/{buildingId}` (`OSKCKUserBuildingSettings`), and
    `android-oskey-io` reads user building settings locally. Firebase's `user/user_settings`
    module owns that per-user collection (`user_building_settings.controller.ts:19`). So the
    app-facing building settings currently look like per-user Firestore documents. Not traced:
    how they are populated (the callable path or a fan-out from the building-level settings).
  - Net: the intercom config has only the two writers above; building settings stay out of it.
    The "unanswered question" bullet above is answered as "no path, by design".
- Side observations from the same Angular edges (not investigated further): Angular calls
  `organization-updateIntercomCommunication`, which appears nowhere in Firebase `staging`
  (already one of the 5 unresolved Angular edges), and `organization-getAllIntercomCommunicationService`,
  whose Firebase export key is `getAllIntercomCommunication` (the handler method is named
  `...Service`), so it can't resolve under `callableExportName`. The second may be an Angular
  bug or a naming quirk; unchecked.

**The stale literal `accessControlDeviceConfigs` is a different, live publisher**:
`OSKAccessControlDevicePublicKeysController.publish` (`access_control_device_public_keys.controller.ts:84`),
called from the Firestore trigger `onAccessControlDevicePublicKeysCreated/Deleted`
(`index.ts:94-99`), hardcoding a topic name from 2023 (`9c42bf82`/`62c8afc8`) that is not in the
staging topic list. Its call is not awaited. So in staging this trigger either fails to
publish or publishes to a topic that exists only in another project. Still open for the user.

**Branch verification (user reminder: `config/repos.json` states the branch).** The
git-history searches above first ran with `--all` (includes non-staging branches), so they were
re-checked: every commit cited (node-iot `32e3d97`, `e79a371`; Firebase `f7c163c2`, `9c42bf82`,
`62c8afc8`) is an ancestor of `HEAD` on the `staging` branch, and the `-S` searches give the
same results on `HEAD` alone. Each clone's checked-out branch matches `repos.json`:
firebase, angular, node-iot = `staging`; android-intercom = `develop`; ios = `master`. (The
Swift kits are pinned to SHAs per doc 22, not branches.) Only the branch named in
`repos.json` should be cited for repo claims; `~/development/*` checkouts and unmerged
branches are not evidence.

## 6. What changes in doc 38

Recorded as corrections in doc 38's "Live verification results" block: baseline groups,
Stage A needs an export-group mapping (24/34 without, up to 31/34 with), Stage B tie-break rule
resolved and the 72-declaration reality, Stage C's route-string parsing, Stage D's thinner
publisher picture. No code or data changed.
