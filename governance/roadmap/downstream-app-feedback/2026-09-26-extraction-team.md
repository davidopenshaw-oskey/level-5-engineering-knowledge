# Handoff to the Extraction Team (2026-09-26)

**From:** the wiki rebuild (`wiki-docs/wiki/`), owner David Openshaw.
**Reference DB:** `facts_index_20260925` (a copy of `facts_index` taken on 2026-09-25).
**Backlog ids:** `T-1xx` in `wiki/tasks/BACKLOG.md`. **Evidence:** the discovery folders named under each item.

## Why this matters
The wiki documents what crosses repo boundaries, because that's where developers lose time. The owner confirmed that **Firestore is the hub for the apps** (D-080), and it's the boundary the facts can't see at all today. Everything below is ranked by how much it blocks the wiki. The priorities are **suggestions, for the owner to confirm**.

## What we confirmed works well
These need no action:
- **Runs replace a repo's facts completely.** Old runs have 0 facts, every fact is in its repo's current run, and there are no orphans (`2026-09-25-current-state-review/queries/17`).
- **`fact_ref` is stable across a re-extraction at the same commit** (discovery `03b`).
- **Angular form controls match the source exactly** for 20 of 23 PGO templates, with commented-out code correctly excluded (discovery `12`).
- **Callables** Angular / swift-cloud-kit → firebase, **kit APIs** iOS → Swift kits, and **HTTP** android-intercom → node-iot are all well resolved.

## Priority 1: blocks the main wiki pages
### T-112 (with T-104): client-side Firestore
**Problem**
- swift-cloud-kit has a full Firestore layer: `OSKCKFirestoreService`, 17 service classes and 177 Firestore calls. Its paths are enums: `OSKCKFirestoreCollectionPath` (17 cases) and `OSKCKFirestoreDocumentPath` (15 cases).
  - The facts hold the **case names only**, with `associatedValues` types but **no path strings**.
- Angular uses `@angular/fire/firestore` (`collection`, `collectionData`), and there are no path facts for it.
- Firebase has only 42 `firestore_path_touched` facts (19 distinct values). Some values aren't paths: `default`, `publicKey`, `{OSKUserController.collection}/{userId}`.
- `firestore_trigger.value` is `unknown` on all 28 trigger facts. The path appears only in the free-text `details` of the 17 `FIRESTORE_EVENT_TRIGGER` edges.
- There are **no client ↔ firebase Firestore edges.**

**Needed**
1. The path string for each Swift path-enum case.
2. `firestore_path_touched`, or an equivalent kind, for swift-cloud-kit, iOS and Angular, with the operation (get / set / update / delete / listen).
3. The trigger path in a structured field on `firestore_trigger`.
4. Edges between client paths and firebase writers and triggers on the same collection or document pattern.
5. Wider firebase coverage for `entities`, `properties`, `units`, `pincodes`, `staff`, `nonAppUsers`, `userInvitations`, … (T-104).

**Evidence:** `2026-09-26-cross-repo-landscape/` F10, queries `03`, `04`.

### T-108: callable export names
**Problem:** 28% of handlers are exported under a different name from their function (e.g. `createQuickcode` → `onCreatePincodeAnonymousAccess`). Clients call the export name, while `api_contract.value` holds the handler name. 151 of the 253 `callable` contracts have no inbound edge, and we can't tell which of them are really unused.

**Needed:** the export name on every `api_contract`. The export prefixes are defined in `functions/src/index.ts` (`export const unit = {…}`, `core`, `user`, …), which **isn't extracted** (see T-105).

**Evidence:** `2026-09-25-current-state-review/08` addendum; landscape F3.

## Priority 2: Pub/Sub and resolver gaps
### T-111 (replaces T-107): Pub/Sub publish-side resolution
**Problem**
- 14 firebase publish edges are unresolved because the topic is a pass-through parameter.
- The code reads the topic from `process.env.OSK_PUBSUB_TOPIC_*`, which is set in `functions/.env`. `.env.staging`, `.env.prod` and `.env.dev` don't override it.
- **The resolver treats the second `publishMessage` argument (the device id) as the topic, but it's the ordering key:** `publishMessage(topicName, acdId, payload)` → `_publishMessage(topic, orderingKey, body)`. That produced device-id "topics" (`acdId`, `buildingDoorACD.accessControlDeviceId`, …) that don't exist (owner, D-078).
- 10 of the 14 can be resolved through env variable → `.env`:
  - `access.controller.ts:71` plus `access_message_publisher.service.ts:136, 169, 192, 225`
  - `access_control_device_config.controller.ts:92`
  - `building_intercom.controller.ts:62` plus `building_intercom_message_publisher.service.ts:24, 56, 64`
- The other 4 are generic wrappers, which resolve through their callers, plus `access_control_device_public_keys.controller.ts:84`, a literal topic that isn't deployed in staging.

**Inconsistency (F8):** the edge `details` cite "16 `pubsub_publish_call` facts (firebase 14, node-iot 2)", but `facts_index_20260925` has **no facts of that kind**. The edges seem to have been generated from facts that aren't in this DB.

**Evidence:** landscape F4–F8. The operational topic list is in D-078 and `wiki/intent/infra/pubsub-topics.yaml`.

### T-106: edge resolver gaps
15 client callable calls resolve to `unknown`:
- all 7 `unit-*` calls from swift-cloud-kit (the handlers exist in `unit_management/`)
- `organization-assigningBuildingToProperty` (handler in `building/`), `organization-getAllIntercomCommunicationService`, `organization-updateIntercomCommunication`, `organization-verifySmsOtpCode`, `user-approve/rejectPendingFriendRequest`, `supplier-getById`, `supplier-getStaffMember`

Some of these may be real client bugs (T-201).

**Probable cause for the `unit-*` calls** (our reading, not confirmed against your resolver): in `functions/src/index.ts`, prefix `unit` imports `@oskey/unit/management` and `acd` imports `@oskey/access_control_device`, while the other prefixes match their module names. A prefix → module lookup by name would miss all 7.

### T-110: Angular templates without facts
3 PGO templates have **no form-control facts**, although their components look like the ones that were extracted (standalone, `templateUrl`, `@if`):
- `hosting/web-app/src/app/app.component.html`
- `…/sign-in-with-email-link/sign-in-with-email-link.component.html`
- `…/sign-up-with-email-link/sign-up-with-email-link.component.html`

That's 2 static + 6 bound controls missing. Nested `formGroupName` (e.g. `phone.localPhoneNumber`) isn't recorded either.

**Evidence:** `2026-09-25-current-state-review/12`.

## Priority 3: completeness
| Id | Item |
|---|---|
| T-103 | Record per-repo **edge-sync state** in the DB. Today only the owner knows which repos have been edge-synced |
| T-101 | Re-sync the Swift kit edges: 151 dangling `INTRA_REPO_CALL` in ui, ble and webrtc |
| T-105 | Widen firebase beyond `functions/src/modules/`. **Re-verified 2026-09-26:** 0 facts outside `modules/`. Missing:<br>• `decorators/securityChecks.ts`: the authorization decorator `OSKUserSecurityChecks`, applied 138× in 40 files. Facts show where it's applied but not what it checks<br>• `decorators/accessChecks.ts`<br>• `utils/`: `errors_helper` is imported by 84 files<br>• `index.ts`: the export registry, needed for T-108 and T-106. **Consider raising this to priority 1** |
| T-102 | iOS ↔ door intercom edges (BLE GATT UUIDs, WebRTC signalling) |
| T-109 | Roadmap: load the deployed GCP config (Pub/Sub topics, subscriptions, push endpoints, DLQs, per environment) as facts |
| – | Repos not extracted: Android user app, digicom (D-081 assumes it calls the 4 node-iot `digicom` routes) |
| – | **Payload consistency:** Swift `enum_declaration` uses `evidence.cases[{name, associatedValues}]`, while TS uses `evidence.enumMembers[{name, value}]`. The caller field is `callerMethod` in Angular and `callerFunction` in Swift. A shared shape per concept would simplify every consumer |

## Open questions for the extraction team
1. Why do the Pub/Sub edge `details` cite `pubsub_publish_call` facts that aren't in the DB (F8)?
2. node-iot `staging` (`a6cba122`) contains routes that the local `develop` clone doesn't have, e.g. `access_control_device_activities.route.ts`. Which branch should the pipeline extract?
