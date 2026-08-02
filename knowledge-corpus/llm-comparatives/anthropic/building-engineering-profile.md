# Module Engineering Profile: `building`

## 0. Generation Metadata

- runId: `20260801_173721-1aa319b1`
- generatedAt: `2026-08-01T21:48:30.567Z`
- repoName: `firebase-oskey-dev`
- targetModule: `building`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

---

## 1. Executive Summary

**Confirmed** (synthesized across all 11 capability outputs). The `building` module is the platform's authoritative owner of the physical-structure layer of the Oskey domain hierarchy: the `Building` scope that sits between `Property` and `Unit` (per `Oskey Architecture.md`). It owns the root `/buildings/{buildingId}` document and an extensive tree of building-scoped sub-collections covering doors, units, inhabitants, non-app users, intercom directories, call-transfer routing, building-scoped PIN codes (active and trashed), building-scoped access ledgers, building-scoped settings, building-user associations, and building/door activity logs.

Architecturally, this module is less a single cohesive service and more a **federation of eleven capabilities** (one root plus ten submodules) that together implement the building side of the platform's Access Orchestration pattern described in `OSkey Backend Services & Data Architecture.md`. The module root (`_module_root`) provides building lifecycle CRUD and cross-cutting aggregation (e.g., building+doors+units dashboards); the submodules provide door management and ACD-to-door assignment/key provisioning (`building_door`), unit management and unit-door/inhabitant lifecycle (`building_unit`, `building_unit_nonAppUser`), building-to-user association (`building_user`), building-scoped access ledgers (`building_accesses`), PIN code issuance and soft-deletion (`building_pincode`, `building_pincode_trash`), building configuration policy (`building_settings`), the physical intercom directory and call routing (`building_intercom`), and door/building activity logging (`building_activity`).

A recurring architectural theme, confirmed independently by many capabilities, is that **actual access-grant provisioning and hardware synchronization are not owned by this module** — they are delegated outbound to the `core`/`user` access-orchestration layer (`OSKAccessService.createAccess`/`deleteAccessById`, `OSKAccessMessagePublisherService.publishMessageToAllACDs`, `OSKAccessUpdateService`). The `building` module's role in that orchestration is almost entirely as a **data-ownership and cascading-consistency layer**: it owns denormalized ledgers, settings, and directory data that must stay consistent with building/unit/door lifecycle events, and it calls out to the access orchestration layer rather than performing hardware sync itself.

## 2. Architectural Position

**Confirmed** (per `Oskey Architecture.md` §2 and cross-capability evidence).

- **Parent scope**: `Property` (via `propertyId` on the root building document; fan-out to `/properties/{propertyId}.buildings` array, and reverse assignment via `assigningBuildingToProperty`).
- **Owned child scope**: `Unit` (via `building_unit`), which in turn owns `Inhabitants`, `NonAppUsers`, `Invitations`, `PermanentGuests`, and (per direct code evidence, contradicting the architecture doc's "not implemented" note — see Section 13) `Unit Doors`.
- **Owned peer concepts at the Building scope**: `Doors` (`building_door`), building-wide `Settings` (`building_settings`), the physical `Intercom` directory and `Call Transfer List` (`building_intercom`), building-scoped `PIN codes` and `PIN code trash` (`building_pincode`, `building_pincode_trash`), a building-scoped `Accesses` ledger (`building_accesses`), a `Building-User` association record (`building_user`), and door/building-level `Activity` logs (`building_activity`).
- **Provided capabilities to the rest of the platform**: building CRUD and lookup (consumed by the PGO portal); the denormalized "building has doors/units/ACDs" aggregate consumed for dashboards; the intercom directory and call-routing data consumed by the `call` module's WebRTC call flow (per architecture doc, though not directly evidenced from this module's own outbound calls); building-scoped PIN validation data consumed by the hardware read path via the `access_control_device` / Cloud Run middleware pipeline.
- **Consumed capabilities from elsewhere**: RBAC permission resolution (`settings/role`), organization-user identity/roles (`organization/user`, `organization` root, `organization/residents`, `organization/property`), global user records (`user`, `user/access`, `user/intercom`), and the access-orchestration/hardware-sync layer (`core/access`, imported in places as both `@oskey/core/access` and `@oskey/user/access` — see Section 5 and Section 13 for the unresolved aliasing question this raises), plus activity enrichment from `access_control_device`.

## 3. Primary Responsibilities

Organized by capability; each item retains the confidence tag from its source capability synthesis.

### `_module_root` — Building lifecycle & aggregation
- Building CRUD (`getAllBuildings`, `getBuildingById`, `createOrganizationBuilding`, `updateBuilding`, `deleteBuilding`, `assigningBuildingToProperty`, `uploadImage`, `deleteBuildingImage`, `getBuildingsByPropertyId`) at `/buildings/{buildingId}`. **Confirmed**.
- Creation fan-out to `/organizations/{organizationId}/buildings` and `/properties/{propertyId}.buildings`, plus default-settings bootstrap. **Confirmed**.
- Update-time cascade of name/address changes to all units and to user access records. **Confirmed**.
- Deletion blocked if doors or units exist (relational-integrity guard). **Confirmed**; whether the root document itself is ultimately deleted in this code path is **Unknown** (no direct-delete call_expression captured).
- Aggregation of building+doors+per-door-ACDs for property-level dashboards. **Confirmed**.
- Registration/re-export of all sibling submodules' triggers and callables in the module's `index.ts`. **Confirmed** (orchestration only).

### `building_accesses` — Building-centric access ledger
- Upsert ("create-or-append") of per-user access grants at `/buildings/{buildingId}/accesses/{userId}`, for both standard app users (`createOrUpdateBuildingAccess`) and staff/non-app users (`createOrUpdateBuildingAccessForStaffOrNonAppUser`). **Confirmed**.
- Per-user (`deletePerUser`) and building-wide (`deleteAll`) ledger deletion. **Confirmed**.
- No RBAC checks and no `api_contract`/trigger of its own — a pure data-access layer invoked by other capabilities. **Confirmed** (absence); **Unknown** what enforces authorization upstream.

### `building_activity` — Door/building activity ingestion & retrieval
- `ActivityReceivedForBuilding` persists enriched hardware activity events keyed by building, door, and activity ID. **Confirmed**.
- Callables `getActivityById`, `getAllBuildingActivities`, `deleteBuildingActivityById`, `deleteAllBuildingActivities`, all gated only by parameter validation (`checkUserIdMatch: false`). **Confirmed**.
- No RBAC permission-string checks evidenced anywhere in this capability. **Confirmed** absence; **Unknown** if enforced elsewhere.

### `building_door` — Door lifecycle & ACD assignment/keys
- Door CRUD (`organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `organizationUserGetAllBuildingDoors`, `organizationUserGetBuildingDoorById`, `deleteBuildingDoor`) at `/buildings/{buildingId}/doors/{doorId}`. **Confirmed**.
- Cascading propagation of door name/address changes to user access documents (`OSKAccessUpdateService.updateUserAccessesDoorInfo`). **Confirmed**.
- Door deletion blocked while ACDs remain assigned; cascades access revocation via `OSKAccessUpdateService.removeDoorFromUserAccesses`. **Confirmed**.
- Firestore-triggered ACD-to-door assignment orchestration (`onDocumentCreated`/`onDocumentDeleted` on `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`): denormalizes device data, calls `OSKAccessControlDeviceController.assignBuildingDoor`/`unassignBuildingDoor`, generates/deletes cryptographic keys, creates the building's intercom entry, and writes/deletes ACD config documents. **Confirmed**.
- EC key-pair generation, secret storage, and public-key persistence at `.../accessControlDevices/{deviceId}/keys/publicKey` for door-assigned ACDs. **Confirmed**.

### `building_intercom` — Physical intercom directory & call routing
- Intercom entry lifecycle at `/buildings/{buildingId}/intercoms/{accessControlDeviceId}` — creation, per-unit inhabitant addition, deletion (whole-unit and single-inhabitant). **Confirmed**.
- Automatic display-name generation from tenant last names, with manual-override protection. **Confirmed**.
- Tenant-only directory inclusion rule (`inhabitantType === 'tenant'`). **Confirmed**.
- Call-transfer-list management at `/buildings/{buildingId}/callTransferList/{callTransferListId}` — creation, append, reorder/replace (client-driven), validation that all listed users are current inhabitants. **Confirmed**.
- Hardware synchronization via Pub/Sub (`OSKIntercomMessagePublisherService`, topic `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`), embedding building-settings-derived `allowUnitNumber`. **Confirmed**.
- Denormalization fan-out to `/users/{userId}/intercoms` (owned by `user` module, not this capability). **Confirmed** (outbound call only).

### `building_pincode` — Building-scoped PIN code data-access layer
- CRUD/query on `/buildings/{buildingId}/pincodes/{pincode}`: `set`, `get`/`getSafe`, `getAll`, `getAllByType`, `delete`, `getByAccessId`. **Confirmed**.
- Type-specific document builders (`createPincodeInhabitantDocument`, `createPincodeGuestDocument`, `createPincodePermanentGuestDocument`, `createPincodeAnonymousDocument`, `createPincodeSupplierDocument`). **Confirmed**.
- No `api_contract`/trigger of its own; pure data-access layer. **Confirmed** (absence in this pack).

### `building_pincode_trash` — Building-scoped PIN soft-delete/audit store
- CRUD on `/buildings/{buildingId}/pincodesTrash/{pincode}` (path **Inferred**, not a literal fact): `set`, `get`/`getSafe`, `getAll`/`getAllSafe`, `update`, `delete`. **Confirmed** operations.
- `OSKBuildingPincodeTrashService` is an empty class with no evidenced methods — consistent with the architectural grounding document's explicit note that this feature "has not been fully written and deployed." **Confirmed**.

### `building_settings` — Building configuration policy
- Master settings CRUD + reset (`createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`, `resetBuildingSettings`) at `/buildings/{buildingId}/settings`. **Confirmed**.
- Fan-out of every update/delete/reset to each user's denormalized `/users/{userId}/buildingSettings/{buildingId}` copy, by iterating all users. **Confirmed**.
- Default-value generation, including resolution of `permittedInvitationDoors` via a live read of the building's doors (`building_door` dependency). **Confirmed**.
- Self-describing field-metadata wrapping (`canBeChanged`/`isRequired`/`description`/etc.) matching the architecturally-documented pattern. **Confirmed**.

### `building_unit` — Unit lifecycle & inhabitant management
- Unit CRUD (`organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `organizationUserGetAllBuildingUnits`, `organizationUserGetBuildingUnitById`, `deleteBuildingUnit`) at `/buildings/{buildingId}/units/{unitId}`. **Confirmed**.
- Unit deletion reads all inhabitants and logs (but does not evidence sending) a "unit removed" notification email. **Confirmed** (log only); **Unknown** (actual send).
- **Unit-door creation** (`OSKBuildingUnitDoorService.createBuildingUnitDoor`) at `/buildings/{buildingId}/units/{unitId}/doors`, which provisions permanent access for every current unit inhabitant to the new door. **Confirmed** as implemented code — this directly contradicts the architectural grounding document's explicit statement that unit-level doors are "not implemented" / "roadmap only" (see Section 13).
- Inhabitant lifecycle (`addInhabitant`, `removeInhabitant`, `getCleanUnitInhabitantList`, `getInhabitantsByBuildingId`) at `/buildings/{buildingId}/units/{unitId}/inhabitants`, including conditional intercom registration (`tenant`/`resident` types only) and denormalized user-settings provisioning. **Confirmed**.
- Fully-implemented but apparently unconsumed controllers for unit-scoped **invitations** (`/buildings/{buildingId}/units/{unitId}/invitations`, path **Inferred**) and **permanent guests** (`/buildings/{buildingId}/units/{unitId}/permanentGuests`, path **Confirmed** literal). **Confirmed** as controller surface; **Unknown** what service layer (possibly in `unit_management`) consumes them.

### `building_unit_nonAppUser` — Non-app-user lifecycle (unit-scoped)
- Full CRUD (`createNonAppUser`, `getNonAppUser`, `getAllNonAppUsers`, `updateNonAppUser`, `deleteNonAppUser`) at `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}`. **Confirmed**.
- Access provisioning (`createNonAppUserAccess`, `createNonAppUserWithAccess` one-shot workflow), door-authorization updates (`updateNonAppUserAccessDoors`), and cascading revocation (`_deleteAccessSideEffects`) synchronized with the building-level accesses ledger and physical ACDs. **Confirmed**.
- PIN issuance at `.../nonAppUsers/{nonAppUserId}/pincodes/{pincode}`. **Confirmed**.
- Activity logging and 30-day rolling aggregation at `.../activities/{activityId}` and `.../activityAggregates/{buildingId}`. **Confirmed**.
- A fully-implemented `deleteNonAppUserAccess` service method exists but has **no evidenced callable registration** — status unresolved (dead code vs. missing evidence). **Confirmed** implementation; **Unknown** exposure.

### `building_user` — Building-to-user association
- `createBuildingUser` creates a `/buildings/{buildingId}/users/{userId}` association record and provisions access via `OSKAccessService.createAccess`. **Confirmed**.
- `onDocumentDeleted` Firestore trigger cascades cleanup to the building-level accesses ledger and the user-level accesses ledger on deletion. **Confirmed**.
- Controller exposes `get`, `getAll`, `update`, `deleteAll`, `listDocuments` with no evidenced service-layer callers in this pack. **Confirmed** (controller exists); **Unknown** (consumers).

## 4. Public Interfaces

All public entry points are Firebase `callable` functions (`https.onCall`) unless otherwise noted as a Firestore trigger. Full request/response schema detail is in Section 7 and the companion API Reference document.

| Capability | Callables |
|---|---|
| `_module_root` | `getAllBuildings`, `getBuildingById`, `createOrganizationBuilding`, `updateBuilding`, `deleteBuildingImage`, `assigningBuildingToProperty`, `getBuildingsByPropertyId` |
| `building_accesses` | *(none — internal service/controller only)* |
| `building_activity` | `getActivityById`, `getAllBuildingActivities`, `deleteBuildingActivityById`, `deleteAllBuildingActivities` |
| `building_door` | `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `organizationUserGetAllBuildingDoors`, `organizationUserGetBuildingDoorById`, `deleteBuildingDoor` |
| `building_intercom` | `onUpdateBuildingIntercomsTransferList`, `updateIntercomDisplayName`, `deleteIntercomDisplayName` |
| `building_pincode` | *(none — internal service/controller only)* |
| `building_pincode_trash` | *(none — internal service/controller only, service class empty)* |
| `building_settings` | `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`, `resetBuildingSettings` |
| `building_unit` | `organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `organizationUserGetAllBuildingUnits`, `organizationUserGetBuildingUnitById`, `deleteBuildingUnit` (plus `OSKBuildingUnitDoorService.createBuildingUnitDoor`, implemented but with **no evidenced `api_contract` registration** in this pack) |
| `building_unit_nonAppUser` | `createNonAppUser`, `getNonAppUser`, `getAllNonAppUsers`, `updateNonAppUser`, `deleteNonAppUser`, `createNonAppUserAccess`, `createNonAppUserWithAccess`, `updateNonAppUserAccessDoors` (plus unwired `deleteNonAppUserAccess`) |
| `building_user` | `createBuildingUser` |

Firestore-triggered entry points are listed separately in Section 8.

Notably, `deleteBuilding` (module root) and `OSKBuildingUnitDoorService.createBuildingUnitDoor` (building_unit) are both fully-implemented service methods with **no confirmed `api_contract` binding** anywhere across the eleven capability packs — this is flagged once here rather than repeated per-capability, since no other capability's evidence resolves it either (see Section 13).

## 5. Internal Structure

The module is organized as a root (`_module_root`) plus ten submodules. Each submodule's controller/service pair follows the same layered pattern (a thin `OSKDocumentController`/`OSKDocumentAndMessageController` subclass over a Firestore collection, plus a service layer performing permission checks, validation, and cross-collection orchestration).

### Intra-module, cross-submodule coupling (per ADR-003 / this reduce step's cross-referencing)

Every sibling-submodule import in this module uses the `@oskey/building/<name>` alias pattern, which is easy to mistake for a cross-module import (it shares the `@oskey/<name>` shape used for genuine cross-module imports like `@oskey/user`). Reconciling all eleven capabilities' import evidence against each other resolves several ambiguities that no single capability could resolve alone:

| Submodule | Package alias observed | Confirmed by (cross-capability reconciliation) |
|---|---|---|
| `building_door` | `@oskey/building/door` | Imported by `_module_root`, `building_intercom`, `building_pincode`, `building_settings`, `building_unit`, `building_unit_nonAppUser` — self-import ambiguity in `building_door`'s own capability output is now resolved: `door` is confirmed as this submodule's stable alias. |
| `building_intercom` | `@oskey/building/intercom` | Imported by `_module_root` and `building_door` — resolves `building_intercom`'s own self-import as a genuine alias, not an anomaly. |
| `building_settings` | `@oskey/building/settings` | Imported by `_module_root`, `building_intercom`, `building_unit` — resolves `building_settings`'s own self-import. |
| `building_unit` | `@oskey/building/unit` | Only self-import observed (within `building_unit_inhabitant.service.ts`) — **still not independently confirmed** by any other capability; this capability's own "Open Question" about whether `@oskey/building/unit` is self-referential remains only **Inferred**, not fully resolved by cross-referencing. |
| `building_accesses` | `@oskey/building/accesses` | Imported by `building_user` and `building_unit_nonAppUser` — `building_accesses`'s own evidence pack showed no sibling-submodule imports at all, so this alias is confirmed only from the *importing* side. |
| `building_pincode` | `@oskey/building/pincode` | Imported by `building_pincode_trash` (confirmed sibling import) **and** by `building_pincode`'s own files (self-import). Cross-referencing resolves `building_pincode`'s own flagged open question: since `building_pincode_trash` independently imports the identical alias to reach the *actual* sibling `pincode` submodule, `building_pincode`'s self-import of the same alias is now confirmed to be a genuine self-referential barrel import, not a distinct submodule. |
| `building_pincode_trash` | `@oskey/building/pincode_trash` | Only self-import observed; not independently confirmed by any other capability. |
| `building_user` | *(no alias observed)* | No other capability imports a `@oskey/building/user`-style path; `_module_root` does register this submodule's triggers via the same generic aggregation pattern used for the others. |
| `building_activity` | *(no `@oskey/building/activity` alias observed anywhere)* | Only reached via relative import (`./modules/building_activity` from `_module_root`, and a deep relative path from `building_unit_nonAppUser` reaching `building_activity`'s document model). This submodule appears to be the one exception to the alias convention used by the rest of the module. |
| `building_unit_nonAppUser` | *(no alias; reached as a nested child of `building_unit`)* | `_module_root`/`building_unit`'s own `index.ts` registers `building_unit_nonAppUser`'s triggers via relative path (`./modules/building_unit_nonAppUser/index`), consistent with it being a child directory of `building_unit` rather than a true sibling. |

### Observed dependency graph within the module (inbound + outbound reconciled)

- **`_module_root`** depends on → `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_user`, `building_activity`. It is in turn the module's registration point — every submodule's triggers/callables are re-exported through it, so it is implicitly depended-on by the platform's function-deployment tooling for all of them.
- **`building_door`** depends on → `building_intercom` (to create intercom entries when ACDs are assigned), `_module_root` (building existence checks). Is depended on by → `_module_root`, `building_intercom`, `building_pincode`, `building_settings`, `building_unit`, `building_unit_nonAppUser` — making `building_door` the **single most depended-upon submodule** in the module, consistent with doors being the central addressable entity that pincodes, settings' default invitation-door lists, units, and non-app-user access grants all reference.
- **`building_intercom`** depends on → `building_unit` (inhabitant validation), `building_door` (door validation), `building_settings` (`allowUnitNumber` sourcing), `_module_root`. Is depended on by → `_module_root`, `building_door`, `building_unit`.
- **`building_settings`** depends on → `building_door` (default `permittedInvitationDoors`), `_module_root`. Is depended on by → `_module_root`, `building_intercom`, `building_unit`.
- **`building_unit`** depends on → `building_door`, `building_intercom`, `building_settings`, `_module_root`; parents → `building_unit_nonAppUser` (nested child). Is depended on by → `_module_root`, `building_intercom`.
- **`building_unit_nonAppUser`** depends on → `building_accesses`, `building_door`, `_module_root`, `building_unit` (parent), `building_activity`.
- **`building_user`** depends on → `_module_root`, `building_accesses`. Is depended on by → `_module_root`.
- **`building_accesses`** shows no outbound sibling-submodule coupling in its own evidence; is depended on by → `building_unit_nonAppUser`, `building_user`.
- **`building_pincode`** depends on → `building_door`. Is depended on by → `building_pincode_trash`.
- **`building_pincode_trash`** depends on → `building_pincode`. Is depended on by → *(none observed)*.
- **`building_activity`** shows no sibling-submodule coupling; is depended on by → `_module_root` (relative), `building_unit_nonAppUser` (relative, reaching its document model only).

This reconciliation directly surfaces what no single capability output could see on its own: **`building_door` is a de facto shared foundation for five other submodules**, and **`building_accesses` and `building_pincode` are consumed by write-heavy capabilities (`building_unit_nonAppUser`, `building_user`, `building_pincode_trash`) despite exposing no public interface or permission check of their own** — meaning their security posture is entirely inherited from whichever caller invokes them.

## 6. Firestore & Data Ownership

| Collection Path | Owning Capability | Operations Evidenced | Confidence |
|---|---|---|---|
| `/buildings/{buildingId}` | `_module_root` | create, read (get/getAll), update, (delete path present but final doc-delete call unconfirmed) | **Confirmed** (ownership), delete completion **Unknown** |
| `/organizations/{organizationId}/buildings/{buildingId}` (denormalized, owned by `organization` module) | fan-out write by `_module_root` | save (create), update | **Confirmed** (fan-out) |
| `/properties/{propertyId}` (owned by `organization` module) | fan-out write by `_module_root` | update (`arrayUnion`/`arrayRemove` of buildings) | **Confirmed** (fan-out) |
| `/buildings/{buildingId}/doors/{doorId}` | `building_door` | get, getSafe, getAll, getAllSafe, getForAllResidents, save, update, delete, deleteAll, listDocuments | **Confirmed** |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | `building_door` | get, getAll, set, update (also touched by triggers) | **Confirmed** path; operation semantics on trigger facts **Inferred** (`operationDetectionScope: undetermined_may_be_indirect`) |
| `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}/keys` → doc `publicKey` | `building_door` | get, set, delete | **Confirmed** |
| `/buildings/{buildingId}/units/{unitId}` | `building_unit` | get, getSafe, getAll, create, save, update, delete, deleteAll, deleteCollection, listDocuments | **Confirmed** |
| `/buildings/{buildingId}/units/{unitId}/doors` | `building_unit` (via `OSKBuildingUnitDoorService`) | save, getAll | **Confirmed** implementation — contradicts grounding doc's "not implemented" note (Section 13) |
| `/buildings/{buildingId}/units/{unitId}/inhabitants` | `building_unit` | get, getSafe, getAll, create, save, update, delete, deleteAll, listDocuments, getUnitInhabitants, collection-group query | **Confirmed** |
| `/buildings/{buildingId}/units/{unitId}/invitations` | `building_unit` | generateInvitationId, create, get, addInvitation, queryInvitations (collection-group), deleteInvitation | Path **Inferred** (no literal string fact); operations **Confirmed** as controller surface, but **no service-level consumer evidenced** |
| `/buildings/{buildingId}/units/{unitId}/permanentGuests` | `building_unit` | full CRUD + `queryPermanentGuests` (collection-group), `getUnitPermanentGuests` | Path **Confirmed** (literal string present); **no service-level consumer evidenced** |
| `/buildings/{buildingId}/units/{unitId}/nonAppUsers/{nonAppUserId}` | `building_unit_nonAppUser` | create/get/getSafe/update/delete/getAll | **Confirmed** |
| `.../nonAppUsers/{nonAppUserId}/accesses/{buildingId}` | `building_unit_nonAppUser` | getPerBuilding/save/update/getAll/delete | **Confirmed** |
| `.../nonAppUsers/{nonAppUserId}/pincodes/{pincode}` | `building_unit_nonAppUser` | create/get/getAll/delete/getByAccessId | **Confirmed** |
| `.../nonAppUsers/{nonAppUserId}/activities/{activityId}` | `building_unit_nonAppUser` | get/getSfe (naming inconsistency, likely intended `getSafe`)/getAll/generateDocId/save/delete | **Confirmed** |
| `.../nonAppUsers/{nonAppUserId}/activityAggregates/{buildingId}` | `building_unit_nonAppUser` | get/getSafe/save/updateActivities (30-day rolling window) | **Confirmed** |
| `/buildings/{buildingId}/accesses/{userId}` | `building_accesses` | get/getSafe/getAll/getAllSafe/save/create/update/deletePerUser/deleteAll/listDocuments | **Confirmed** — also written into by `building_door`, `building_unit_nonAppUser`, `building_user` as a cross-capability fan-out target |
| `/buildings/{buildingId}/pincodes/{pincode}` | `building_pincode` | set/get/getSafe/getAll/getAllByType/delete/getByAccessId | **Confirmed** |
| `/buildings/{buildingId}/pincodesTrash/{pincode}` | `building_pincode_trash` | set/get/getSafe/getAll/getAllSafe/update/delete | Path **Inferred** (not a literal fact); explicitly flagged by the architecture doc as **not fully deployed** |
| `/buildings/{buildingId}/settings` (singleton per building) | `building_settings` | set (create), get/getResidentSettings/getResidentSettingsSafe, update, delete | **Confirmed** |
| `/users/{userId}/buildingSettings/{buildingId}` (owned by `user` module) | fan-out write by `building_settings` | get/update/delete, iterated across all users | **Confirmed** (fan-out) |
| `/buildings/{buildingId}/intercoms/{accessControlDeviceId}` | `building_intercom` | create/get/getSafe/getAllIntercomByBuilding/update/delete | **Confirmed** |
| `/buildings/{buildingId}/callTransferList/{callTransferListId}` | `building_intercom` | create/get/getSafe/getAll/update/delete | **Confirmed** |
| `/users/{userId}/intercoms` (owned by `user` module) | fan-out write by `building_intercom` | via `OSKUserIntercomService` | **Confirmed** (outbound call only) |
| `/buildings/{buildingId}/users/{userId}` | `building_user` | get/getAll/save/update/delete/deleteAll/listDocuments (only `save` and deletion-cascade are exercised by evidenced service callers) | **Confirmed** (controller); several methods **Unknown** as to callers |
| `/buildings/{buildingId}/doors/{doorId}/activities/...` (or similar door-scoped path) | `building_activity` | get/getSfe/getAll/generateDocId/save/delete | Path **Inferred** (two-parameter `buildingId`+`doorId` collection-path resolver observed, but no literal path string fact) |

**Cross-capability discrepancy flagged by this reduce step**: the architectural grounding document describes a single `/buildings/{buildingId}/activities` collection (no door scoping) as the fan-out target of `PubSubMessageProcessor`. `building_activity`'s own evidence shows its collection-path resolver takes **both** `buildingId` and `doorId`, implying door-level scoping not mentioned in the grounding doc. No other capability's evidence clarifies whether these are the same collection under a different described shape, or two distinct structures — this remains unresolved (see Section 13).

## 7. API Endpoints

Schemas below are cross-referenced from `model_property` facts by `parentName` where available, per capability evidence. Where no `api_contract.requestType`/`responseType` field was present in the underlying evidence pack (true for essentially all capabilities in this module), the request-type association is **Inferred** from parameter/validation-call naming, as already flagged by each source capability.

### `_module_root`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `getAllBuildings` | `OSKBuildingGetAllRequestData`: `organizationId` | not found in evidence |
| `getBuildingById` | `OSKBuildingGetRequest`: `buildingId`, `organizationId` | `OSKBuildingDetailsResponseData` (**Inferred** binding): `building`, `unitsCount`, `doorsCount` |
| `createOrganizationBuilding` | `OSKBuildingCreateRequest`: `organizationId`, `propertyId`, `name`, `imageFilename`, `streetAddress` | not found |
| `updateBuilding` | `OSKBuildingUpdateRequest`: `buildingId`, `data`, `organizationId` | not found |
| `deleteBuildingImage` | `deleteBuildingImageRequest`: `buildingId`, `filename` | not found |
| `assigningBuildingToProperty` | `OSKPropertyAssigningBuildingRequestData`: `organizationId`, `oldPropertyId`, `newPropertyId`, `buildingId`, `buildingData` | not found |
| `getBuildingsByPropertyId` | `OSKBuildingGetAllByPropertyRequest`: `propertyId`, `organizationId`, `accessControlDeviceType` | not found |
| *(unwired)* `deleteBuilding` | `OSKBuildingDeleteRequest`: `buildingId`, `organizationId` — model exists, no confirmed callable binding | not found |

### `building_activity`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `getActivityById` | `OSKGetBuildingActivityByIdRequest`: `buildingId`, `doorId`, `activityId` | not found |
| `getAllBuildingActivities` | `OSKGetAllBuildingActivitiesRequest`: `buildingId`, `doorId` | not found |
| `deleteBuildingActivityById` | `OSKDeleteBuildingActivityByIdRequest`: `buildingId`, `doorId`, `activityId` | not found |
| `deleteAllBuildingActivities` | `OSKDeleteAllBuildingActivitiesRequest`: `buildingId`, `doorId` | not found |

### `building_door`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `organizationUserCreateBuildingDoor` | `OSKBuildingDoorCreateRequest`: `buildingId`, `name`, `streetAddress`, `isForAllResidents`, `organizationId` | not found |
| `organizationUserUpdateBuildingDoor` | `OSKBuildingDoorUpdateRequest`: `buildingId`, `doorId`, `data` (**Inferred** as `OSKBuildingDoorUpdate`: `name`, `isForAllResidents`, `streetAddress`), `organizationId` | not found |
| `organizationUserGetAllBuildingDoors` | no named model found; inferred inline `{ organizationId, buildingId }` | not found |
| `organizationUserGetBuildingDoorById` | `OSKBuildingDoorGetRequest`: `buildingId`, `doorId`, `adminsOrganizationId` | not found |
| `deleteBuildingDoor` | `OSKBuildingDoorDeleteRequest`: `buildingId`, `doorId`, `adminsOrganizationId` | not found |

### `building_intercom`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `onUpdateBuildingIntercomsTransferList` | `OSKIntercomCallTransferListRequest`: `userId`, `unitId`, `buildingId`, `callTransferList` | not found |
| `updateIntercomDisplayName` | `OSKBuildingIntercomDisplayNameRequest`: `buildingId`, `unitId`, `newDisplayName` | not found |
| `deleteIntercomDisplayName` | `OSKBuildingIntercomEntryDeleteRequest`: `organizationId`, `buildingId`, `entryId` | not found |

### `building_settings`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `createBuildingSettings` | `OSKBuildingSettingsCreateRequest`: `buildingId`, `buildingSettingsInputParams` | not found |
| `getResidentSettings` | `OSKBuildingGetSettingsRequest`: `buildingId`, `settingsId` | not found |
| `updateBuildingSettings` | `OSKBuildingUpdateSettingsRequest`: `buildingId`, `update` | not found |
| `deleteBuildingSettings` | `OSKBuildingDeleteOrResetSettingsRequest`: `buildingId`, `settingsId` | not found |
| `resetBuildingSettings` | `OSKBuildingDeleteOrResetSettingsRequest`: `buildingId`, `settingsId` | not found |
| *(unused type)* | `OSKBuildingGetAllSettingsRequest`: `buildingId` — no observed handler usage | not found |

### `building_unit`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `organizationUserCreateBuildingUnit` | `OSKBuildingUnitCreateRequest`: `buildingId`, `name`, `floor`, `unitNumber`, `streetAddress`, `organizationId`, `capacity` | not found |
| `organizationUserUpdateBuildingUnit` | `OSKBuildingUnitUpdateRequest`: `buildingId`, `unitId`, `data`, `organizationId` | not found |
| `organizationUserGetAllBuildingUnits` | not found in evidence | not found |
| `organizationUserGetBuildingUnitById` | `OSKBuildingUnitGetRequest`: `buildingId`, `unitId`, `adminsOrganizationId` | not found |
| `deleteBuildingUnit` | `OSKBuildingUnitDeleteRequest`: `buildingId`, `unitId`, `adminsOrganizationId` | not found |
| *(unwired)* `createBuildingUnitDoor` | `OSKBuildingUnitDoorCreateRequest`: `buildingId`, `unitId`, `doorId`, `name`, `streetAddress`, `isForAllResidents`, `adminsOrganizationId` | not found |

### `building_unit_nonAppUser`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `createNonAppUser` | `OSKAddNonAppUserRequest` — no `model_property` facts captured | not found |
| `getNonAppUser` | `OSKGetNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId` | not found |
| `getAllNonAppUsers` | `OSKGetAllNonAppUsersRequest`: `buildingId`, `unitId` | not found |
| `updateNonAppUser` | `OSKUpdateNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId`, `dataToUpdate` | not found |
| `deleteNonAppUser` | `OSKDeleteNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId` | not found |
| `createNonAppUserAccess` | `OSKCreateNonAppUserAccessRequest`: `buildingId`, `unitId`, `nonAppUserId`, `doorIds`, `startDate`, `endDate` | not found |
| `createNonAppUserWithAccess` | `OSKCreateNonAppUserWithAccessRequest`: only `doorIds` confirmed via `model_property` | `OSKCreateNonAppUserwithAccessResponse`: `nonAppUserId`, `accessId`, `pincode`, `fullName` |
| `updateNonAppUserAccessDoors` | `OSKUpdateNonAppUserAccessDoorsRequest`: `buildingId`, `unitId`, `nonAppUserId`, `accessId`, `doorIds` | not found |
| *(unwired)* `deleteNonAppUserAccess` | `OSKDeleteNonAppUserAccessRequest`: `buildingId`, `unitId`, `nonAppUserId`, `accessId` | not found |

### `building_user`
| Callable | Request Model (fields) | Response |
|---|---|---|
| `createBuildingUser` | `OSKBuildingUserCreateRequest`: `organizationId`, `buildingId`, `userId`, `firstName`, `lastName`, `accessRights`, `doors`, `userType` | not found |

`building_accesses`, `building_pincode`, and `building_pincode_trash` expose **no `api_contract` facts at all** — confirmed across all three capabilities as internal service/controller layers only.

## 8. Firestore Triggers

| Trigger | Path | Handler | Side Effects (per source-file call_expression evidence) | Confidence |
|---|---|---|---|---|
| `onDocumentCreated` | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` (`buildingDoorAccessControlDevicePath`) | `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` | Reads the device, denormalizes it onto the door-scoped path, calls `OSKAccessControlDeviceController.assignBuildingDoor`, generates crypto keys (`OSKBuildingDoorAccessControlDeviceKeysController.generateKeys`), reads the parent door, creates the intercom entry (`OSKBuildingIntercomService.createIntercomEntry` — cross-submodule call), writes an initial ACD config (`OSKAccessControlDeviceConfigController.save`) | **Confirmed** |
| `onDocumentDeleted` | same path | `OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted` | Deletes public keys (`deletePublicKeys`), unassigns the device (`unassignBuildingDoor`), deletes all ACD configs (`deleteAll`) | **Confirmed** |
| `onDocumentDeleted` | `/buildings/{buildingId}/users/{userId}` (exact binding path **Inferred**, not a literal fact) | `OSKBuildingUserService.onDocumentDeleted` | Deletes the building-level accesses ledger entry (`OSKBuildingAccessesController.deletePerUser`) and all user-level access ledger entries (`OSKUserAccessesController.deleteAllUserAccesses`) | **Confirmed** (method + cascade), **Inferred** (exact trigger binding) |

`_module_root`'s own `index.ts` delegates all Firestore-trigger registration entirely to `building_door`'s trigger aggregator — no triggers are owned directly by `_module_root`'s own code. `building_activity`'s ingestion handler (`ActivityReceivedForBuilding`) is **not** evidenced as a native Firestore trigger in this pack — it appears (per that capability's own evidence) to be invoked as a direct method call from an external enrichment pipeline rather than a `functions.firestore.document(...).onX()` registration. No trigger facts were found for `building_accesses`, `building_intercom`, `building_pincode`, `building_pincode_trash`, `building_settings`, `building_unit`, or `building_unit_nonAppUser`.

## 9. Permissions & Security

Every permission string evidenced anywhere in this module's eleven capability packs, cross-checked against `rbac-roles.json`:

| Permission String | Used In | RBAC Cross-Check | Notes |
|---|---|---|---|
| `v1.org.buildings.view` | `_module_root` (`getAllBuildings`), `building_door` (`organizationUserGetBuildingDoorById`) | **Match** | — |
| `v1.org.buildings.create` | `_module_root` (`createOrganizationBuilding`), `building_unit` (`createBuildingUnitDoor`, `deleteBuildingUnit`), `building_user` (`createBuildingUser`, alongside `v1.admin.building.register`) | **Match** | — |
| `v1.org.buildings.edit` | `_module_root` (`updateBuilding`), `building_door` (create/update door), `building_unit` (create/update unit) | **Match** | — |
| `v1.org.settings.create` | `_module_root` (`assigningBuildingToProperty`), `building_settings` (`createBuildingSettings`) | **Match** (string valid, defined in RBAC) | **Flagged**: in `_module_root`'s `assigningBuildingToProperty`, this string is used to gate a building→property reassignment operation, which is semantically a buildings/property operation, not a "management rules" (`settings`) operation. The identical string's use in `building_settings.createBuildingSettings` is semantically correct. This is a genuine **cross-capability inconsistency** only visible by comparing the two usages side-by-side: the same permission string is used correctly in one capability and, per its RBAC-documented purpose, incongruously in another. Not resolved — reported as-is. |
| `v1.org.settings.view` / `.edit` / `.delete` | `building_settings` (`getResidentSettings` / `updateBuildingSettings` / `deleteBuildingSettings` and, notably, also `resetBuildingSettings`) | **Match** | `resetBuildingSettings` (a "restore defaults" operation) is gated by the *delete*-scoped permission rather than a dedicated reset/edit permission — an observed design choice, not a naming mismatch. |
| `v1.org.buildings.createManager` | `building_door` (`deleteBuildingDoor`) | **No match — does not exist in `rbac-roles.json`.** | **Confirmed mismatch.** The RBAC document defines `v1.org.buildings.list/.view/.create/.edit/.delete` but not `.createManager`. Possible typo, legacy string, or undocumented permission. |
| `v1.admin.building.register` | `building_user` (`createBuildingUser`, alongside `v1.org.buildings.create`) | **Match** | Exact boolean relationship between the two co-checked permissions (either-sufficient vs. both-required) is **Unknown**. |
| `v1.admin.accessControlDevice.edit` | `building_intercom` (`deleteIntercomDisplayName`) | **Match** (string exists in RBAC) | **Flagged** as a semantic-domain mismatch: this is a device-administration permission being used to gate an intercom-directory-display-name edit, an organization/building-scoped operation elsewhere in the module gated by `v1.org.buildings.edit`-class strings. Reported, not resolved. |

**Capabilities with no RBAC permission-string evidence at all** (flagged as a module-wide pattern, not resolvable at this reduce step): `building_accesses`, `building_activity`, `building_pincode`, `building_pincode_trash`, `building_unit_nonAppUser`. For `building_unit_nonAppUser`, the only observed authorization-adjacent logic is a persona/inhabitant-hierarchy check (`OSKUserService._getInhabitantType`) rather than an RBAC string — consistent with the Personas document's "Delegated Authority Principle," but this cannot be confirmed as a complete substitute for RBAC enforcement from the available evidence. Across all five gap capabilities, the common mitigating factor evidenced is the `OSKUserSecurityChecks({ checkUserIdMatch: false })` decorator plus `OSKSecurityChecks.checkParameters` structural validation — neither of which is a permission check.

**Additional gap surfaced only by comparison across capabilities**: `building_unit`'s `organizationUserGetAllBuildingUnits` (a list operation) does not check the RBAC-defined `v1.org.buildings.list` permission, even though sibling list-style operations elsewhere in the same capability (and the module generally) do check scope-appropriate permissions, and `v1.org.buildings.list` exists and is otherwise unused across this entire module's evidence. This appears to be a genuinely unused/unchecked RBAC role across the whole `building` module.

## 10. Cross-Module Relationships

Only relationships to modules confirmed to exist in this repository's live module list are reported here (intra-module coupling is covered in Section 5).

- **`core`** — Confirmed extensive dependency across nearly every capability: base document controller classes (`OSKDocumentController`, `OSKDocumentAndMessageController` via `@oskey/core/controllers/document(_and_message)`), the access-orchestration facade (`@oskey/core/access` — `OSKAccessService`, `OSKAccessUpdateService`, `OSKPincodeService`, `OSKAccessMessagePublisherService`), and logging (`@oskey/core/logger`). This is the module's single heaviest dependency.
- **`organization`** — Confirmed dependency via `@oskey/organization/user` (organization-user identity/role resolution, used for permission checks in `_module_root`, `building_door`, `building_settings`, `building_unit`, `building_user`), `@oskey/organization/property` (property fan-out in `_module_root`), `@oskey/organization/residents` (resident lookups in `building_intercom`), and the bare `@oskey/organization` root (`building_door`, `building_intercom`).
- **`settings`** — Confirmed dependency via `@oskey/settings/role` (`OSKConsolidatedRolesController.checkUserPermissions`/`checkUserPermissionsSafe`), used for RBAC enforcement across `_module_root`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_user`.
- **`user`** — Confirmed dependency via the bare `@oskey/user` root (`OSKUserController.get`/`getAll`, used in `_module_root`, `building_accesses`, `building_intercom`, `building_settings`, `building_unit`, `building_unit_nonAppUser`), `@oskey/user/access` (`OSKAccessUpdateService`/`OSKUserAccessesController`, used in `building_accesses`, `building_door`, `building_unit`, `building_unit_nonAppUser`, `building_user`), and `@oskey/user/intercom` (`OSKUserIntercomService`, used in `building_intercom`). Two capabilities (`building_accesses`, `building_door`) also import an apparently-equivalent facility via `@oskey/core/access` rather than `@oskey/user/access` — this pack's evidence cannot determine whether these are the same underlying service reached through two different alias paths, or genuinely distinct services; flagged as an open question (Section 13).
- **`access_control_device`** — Confirmed dependency via relative imports (not `@oskey/` alias): `_module_root`'s request model imports `../../../access_control_device/models/documents/access_control_device_document.model`; `building_door` and `building_unit_nonAppUser` (via `access_control_device_activity_enrichment.service`) both depend on this module for hardware/activity-enrichment types and services; `building_door` also imports `@oskey/access_control_device` directly for `OSKAccessControlDeviceController`/`OSKAccessControlDeviceConfigController`.

No other modules from the live module list (`admin`, `apps`, `call`, `supplier`, `tasks`, `unit_management`) appear as evidenced outbound dependencies anywhere in this module's eleven capability packs, though the architectural grounding documents describe `call` and `unit_management` as likely consumers of building-owned data (intercom call routing; unit invitations/permanent guests respectively) — this is architectural-document context only, not confirmed by this module's own outbound-call evidence, and per the reduce contract this module has no visibility into whether those modules actually import from `building`.

Several shared-utility import paths (`@oskey/utils/errors_helper`, `@oskey/utils/https-response`, `@oskey/utils/security_check`, and the relative `.../decorators/securityChecks`) recur across nearly every capability but do not resolve to any name in the live module list — these are treated as shared/common infrastructure outside the module boundary system, not as cross-module relationships, per instructions to only name confirmed modules.

## 11. External Hooks

- **Pub/Sub (outbound publish)** — `building_intercom`'s `OSKIntercomMessagePublisherService` publishes Create/Update/Delete messages to the topic named by `process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES` on every intercom-entry change. No `detectionMethod` (`structural_chain` vs `known_wrapper_method_name`) classification was present in the underlying capability evidence for this call, so it cannot be characterized per the structural-vs-wrapper distinction — reported as a **confirmed wrapper-service call** without that finer distinction. **Confirmed** existence of the publish call; detection-method classification **Unknown**.
- **Pub/Sub (outbound, via core facade)** — `building_door`, `building_unit_nonAppUser`, and (per architectural grounding docs) other capabilities call `OSKAccessMessagePublisherService.publishMessageToAllACDs` (a `core`-module facade) to push Create/Update/Delete access-state messages to physical ACDs on access grant/revocation. This module's own evidence shows only the outbound call into the `core` facade, not the underlying topic/publish mechanics themselves, which belong to `core`. **Confirmed** (call exists); underlying topic mechanics **out of scope** for this module.
- **No `pubsubPushReceiver` / Event Routing Table evidence** was present anywhere in this module's eleven capability packs — no `api_contract` fact with `pubsubPushReceiver: true` or associated `pubsub_event_route` facts was reported by any capability. This module does not appear to be a Pub/Sub *receiver* based on available evidence.
- **Cloud Storage** — `_module_root`'s `uploadImage`/`deleteBuildingImage` read/write building images via `OSKBuildingController.uploadImage`/`deleteImage` (implementation detail not further decomposed in evidence, but consistent with the platform-wide Cloud Storage signed-URL pattern described in `OSKStorageService`). **Confirmed** as a call pattern; underlying mechanics **Unknown** from this module's own evidence.
- **Secret Manager (via `core`)** — `building_door`'s key-generation flow (`OSKBuildingDoorAccessControlDeviceKeysController.generateKeys`) stores generated EC private keys via `OSKSecretService.createPrivateKeySecret` — a `core`-module facade over Google Secret Manager / local emulator file, per the architectural grounding documents. **Confirmed** call; underlying storage mechanics belong to `core`.
- **Email notification (candidate only, not confirmed)** — `building_unit`'s `deleteBuildingUnit` logs an intent to send a "unit removed" notification email but no actual call to an email-sending service (`OSKEmailService`/`OSKNotificationService`) is evidenced in this capability's pack. **Unconfirmed candidate** — flagged rather than reported as a real integration.

## 12. Architectural Observations

- **Federated-capability structure over a single service**: the `building` module is best understood as ten loosely-coupled submodules unified only by a shared parent Firestore path prefix and a common registration point (`_module_root`'s `index.ts`), rather than a single cohesive service. **Inferred** from the consistent controller/service/model file-layout pattern repeated across all ten submodules.
- **`building_door` as a structural hub**: reconciling outbound/inbound coupling across all eleven capabilities (Section 5) shows `building_door` is depended upon by five of the other ten capabilities — more than any other submodule, including the module root itself — reflecting the architectural centrality of the addressable "door" entity (referenced by pincodes, settings defaults, units, non-app-user access grants, and the module root's aggregation queries). **Inferred** from the reconciled dependency graph.
- **Consistent "orchestration is elsewhere" pattern**: repeatedly, capabilities in this module perform Firestore writes to their own owned collections and then call out to `core`'s access-orchestration facade (`OSKAccessService`, `OSKAccessUpdateService`, `OSKAccessMessagePublisherService`, `OSKPincodeService`) rather than implementing access-grant logic or hardware sync themselves. This is consistent with the "Orchestration Service Pattern" described in `OSkey Backend Services & Data Architecture.md`. **Confirmed** across `building_door`, `building_unit`, `building_unit_nonAppUser`, `building_user`.
- **Heavy denormalization/fan-out discipline**: every capability that owns a "master" record (building settings, building name/address, door name/address, intercom entries) fans changes out to one or more per-user denormalized copies (`/users/{userId}/buildingSettings`, `/users/{userId}/accesses`, `/users/{userId}/intercoms`). **Confirmed** as a module-wide pattern.
- **Security posture is uneven across capabilities**: some submodules (`building_door`, `building_settings`, `building_unit`, `building_user`) enforce fairly granular, RBAC-string-checked permissions; others (`building_accesses`, `building_activity`, `building_pincode`, `building_pincode_trash`, `building_unit_nonAppUser`) show **no RBAC permission-string evidence at all**, relying only on parameter validation and, in one case, an inhabitant-hierarchy check. This unevenness is visible only when the eleven capabilities are compared side by side. **Confirmed** as an observed pattern; whether it constitutes a genuine security gap or is fully compensated by caller-side checks not visible in this evidence is **Unknown**.
- **Grounding-document vs. implementation divergence**: the architecture doc's explicit "not implemented / roadmap only" note for unit-level doors is contradicted by fully-implemented, wired code in `building_unit`. Per this pipeline's evidence-priority rules, direct engineering evidence takes precedence — this is reported as a genuine divergence, not resolved in favor of either source (see Section 13).

## 13. Risks & Open Questions

*Per-capability open questions are preserved below, grouped by capability, plus a final subsection of issues visible only by comparing capabilities against each other (which is the specific value this reduce step adds).*

**`_module_root`**
- Whether `deleteBuilding` is exposed via any callable/trigger at all — no `api_contract` fact references it anywhere in this module's evidence.
- Whether `/buildings/{buildingId}` is actually deleted at the end of `deleteBuilding`'s success path — no direct-delete call_expression captured.
- Exact response schemas for `getBuildingById`/`getAllBuildings`/`getBuildingsByPropertyId` are unconfirmed.
- Ownership/location of the shared `.../decorators/securityChecks` module is unresolved.
- Why `assigningBuildingToProperty` checks `v1.org.settings.create` rather than a buildings/property-specific permission (see Section 9).
- Whether `uploadImage`/`deleteBuildingImage` perform any permission check beyond structural validation.

**`building_accesses`**
- No `api_contract` facts — unclear whether this capability has any direct external entry point or is purely an internal library.
- No RBAC checks anywhere — unclear whether authorization is enforced entirely upstream by callers.
- Whether `userFirstName`/`userLastName` denormalization happens within this capability's own code or is supplied pre-denormalized by callers — no read of `/users` observed within this pack.

**`building_activity`**
- Literal Firestore path underlying the door-scoped activity collection not captured as a literal string.
- Whether this collection is the same as, or distinct from, the architecture doc's undifferentiated `/buildings/{buildingId}/activities` — unresolved (also called out in Section 6 as a cross-source discrepancy).
- No response schemas found for any of the four callables.
- No RBAC permission-string evidence for any operation in this capability.
- Trigger mechanism for `ActivityReceivedForBuilding` (native Firestore trigger vs. direct pipeline call) not directly confirmed.

**`building_door`**
- No response schemas found for any of the five callables.
- `OSKBuildingDoorUpdateRequest.data` ↔ `OSKBuildingDoorUpdate` linkage is inferred by convention, not by explicit type reference.
- `v1.org.buildings.createManager` (used in `deleteBuildingDoor`) does not exist in the RBAC document — confirmed mismatch, not resolved.
- Whether the "cannot delete door because accesses exist" check actually blocks deletion, or is logged post-hoc, is not fully disambiguated.
- Relationship between the building-door-scoped `.../keys/publicKey` path and the (possibly-decommissioned) top-level `/accessControlDevices/{id}/publicKeys` collection described in the grounding docs is unresolved.

**`building_intercom`**
- No response schemas found for any of the three callables.
- `v1.admin.accessControlDevice.edit` gating an intercom-directory operation is a plausible semantic mismatch (flagged, not resolved — see Section 9).
- Module ownership of the shared `@oskey/utils/*` and decorator imports is unclear.
- No Firestore-trigger entry points observed for this capability even though door/device-assignment triggers (owned by `building_door`) are the evidenced caller of `OSKBuildingIntercomService.createIntercomEntry` — consistent, not a gap, but worth noting the trigger lives in a different capability than the logic it invokes.

**`building_pincode`**
- Whether `@oskey/building/pincode` (self-imported by this same capability) is a genuine self-reference — **now resolved** by cross-referencing against `building_pincode_trash`'s independent import of the same alias (see Section 5); confirmed self-referential barrel, not a distinct submodule.
- Exact behavioral difference between `get` and `getSafe` remains unconfirmed.
- Fan-out from `/buildings/{buildingId}/pincodes` creation to `/users/{userId}/pincodes` (described in the grounding docs) is not evidenced anywhere in this module's eleven capabilities — likely implemented in `core`/`user`, outside this module's scope.
- Whether `delete` is a hard delete or paired with `pincodesTrash` migration performed by an external caller remains unconfirmed.
- No RBAC/permission evidence for any pincode-controller operation.

**`building_pincode_trash`**
- Literal collection path not directly evidenced (inferred).
- `OSKBuildingPincodeTrashDocument`'s evidenced schema (`status`, `lastStatusUpdate`, `expirationDate`) does not match the simpler shape implied by the architecture doc — unclear whether this reflects schema evolution or a documentation gap.
- No caller of `set`/`update`/`delete` is evidenced anywhere in this module's eleven capabilities (the architecture doc names `OSKPincodeService.deleteBuildingPincodeAndMoveToTrash`, which is not present in any of this module's own evidence packs — likely lives in `core`).
- Explicitly flagged by the grounding docs as not fully deployed in production — operational completeness should not be assumed.

**`building_settings`**
- Request/response schema mapping is inferred, not contract-confirmed (no `requestType`/`responseType` fields present).
- `OSKBuildingGetAllSettingsRequest` type exists with no observed consuming handler.
- No explanation for why `resetBuildingSettings` uses the `.delete` permission rather than `.edit`.
- No downstream hardware/Pub-Sub sync evidenced as a consequence of settings changes within this capability's own code.

**`building_unit`**
- `createBuildingUnitDoor` has no evidenced `api_contract` — unclear how/whether it is actually exposed.
- **Direct contradiction with architectural grounding document**: the grounding doc states unit-level doors are unimplemented/roadmap-only, but this capability's own evidence shows a complete, wired implementation (`OSKBuildingUnitDoorService.createBuildingUnitDoor`) that provisions access to all current unit inhabitants. Per evidence-priority rules, the direct engineering evidence is reported as-is; the contradiction itself is not resolved.
- `OSKBuildingUnitInvitationController` and `OSKBuildingUnitPermanentGuestController` have no evidenced service-layer consumer anywhere in this module — possibly consumed by `unit_management` (a distinct module in the live list), which is outside this module's own evidence scope.
- No permission check evidenced for `organizationUserGetAllBuildingUnits` despite the existence of an appropriate `v1.org.buildings.list` RBAC role (flagged in Section 9 as a module-wide gap, confirmed by cross-capability comparison).
- Whether `deleteBuildingUnit`'s logged "unit removed" email intent is actually dispatched is unconfirmed.
- `@oskey/building/unit` self-import ambiguity remains **not fully resolved** even after cross-referencing (see Section 5) — no other capability independently imports this alias to confirm it as a stable sibling reference.

**`building_unit_nonAppUser`**
- `deleteNonAppUserAccess` is fully implemented but has no evidenced callable registration anywhere in this module — status (dead code vs. missing evidence) unresolved.
- No RBAC permission strings evidenced for any operation in this capability — only an inhabitant-hierarchy check (`_getInhabitantType`) in `deleteNonAppUser`. Flagged in Section 9 as part of the module-wide uneven-security-posture pattern.
- `OSKAddNonAppUserRequest` and parts of `OSKCreateNonAppUserWithAccessRequest` have no corresponding `model_property` facts — schemas incomplete.
- `startDate`/`endDate` fields on the access-creation request appear unused in the evidenced call (`{ validity: 'permanent', isValidOnce: false }` is always passed) — their actual consumption is unconfirmed.
- Naming inconsistency: `OSKNonAppUserActivitiesController.getSfe` vs. the `getSafe` convention used elsewhere in the same module — likely a typo, not resolved.

**`building_user`**
- Exact boolean relationship between the two co-checked permissions (`v1.admin.building.register`, `v1.org.buildings.create`) is unconfirmed.
- No response schema evidenced for `createBuildingUser`.
- `get`, `getAll`, `update`, `deleteAll`, `listDocuments` controller methods have no evidenced service-layer caller anywhere in this module.
- `OSKBuildingUserUpdateRequest`/`GetRequest`/`DeleteRequest` models exist with no corresponding implemented handler evidenced anywhere in this module.
- Exact Firestore-trigger path binding for `onDocumentDeleted` is inferred, not a literal fact.

**Cross-capability issues visible only from this reduce step:**
- The identical permission string `v1.org.settings.create` is used correctly (per its RBAC-documented domain) in `building_settings.createBuildingSettings`, but appears semantically misapplied in `_module_root.assigningBuildingToProperty` — a genuine reuse inconsistency only visible when both usages are compared side by side (Section 9).
- Five of eleven capabilities (`building_accesses`, `building_activity`, `building_pincode`, `building_pincode_trash`, `building_unit_nonAppUser`) show **zero** RBAC permission-string evidence, while the other capabilities are consistently RBAC-gated — this unevenness in security posture across a single module is only apparent when all eleven packs are read together (Section 9, Section 12).
- `building_accesses` and `building_door` both import what appears to be the same access-orchestration facade via two different alias paths (`@oskey/core/access` vs. `@oskey/user/access`) — whether these resolve to the identical underlying service or are genuinely distinct cannot be determined from this module's evidence, and is only visible as an inconsistency once multiple capabilities' import lists are compared (Section 10).
- The RBAC role `v1.org.buildings.list` is defined in `rbac-roles.json` but is not checked by any capability in this module, including the one operation (`building_unit`'s `organizationUserGetAllBuildingUnits`) where it would be the obviously appropriate check — confirmed only by scanning every permission string used across all eleven capabilities (Section 9).
- `building_door` is depended upon by five sibling submodules (the most of any submodule) yet is not itself the module's root — this structural centrality is invisible from any single capability's own evidence and only emerges from reconciling all outbound-coupling facts together (Section 5).

## 14. Evidence References

The items below consolidate concrete file/line citations that were already present in the capability outputs. No fact IDs or file:line citations have been fabricated; where a claim in this profile cannot be traced to a citation given by a capability output, it is marked accordingly.

- **`_module_root`**: `functions/src/modules/building/controllers/building.controller.ts`, `functions/src/modules/building/services/building.service.ts` (permission checks at lines 78, 85, 189, 192, 275, 278, 436, 442), `functions/src/modules/building/index.ts` (trigger/callable aggregation).
- **`building_accesses`**: `building_accesses.controller.ts` (lines 6–8, 14, 23, 39), `building_access.service.ts` (lines 9–11), `building_access_document.model.ts` (lines 6–7). No line-level citations were given for the upsert logic beyond "lines 23, 39" for `getSafe`/`getAllSafe`.
- **`building_activity`**: `functions/src/modules/building/modules/building_activity/index.ts` (lines 41–44), `building_activities.service.ts` (lines 1–9, 21, 59, 77, 90, 103), `building_activities.controller.ts` (lines 6–7, 12).
- **`building_door`**: `building_door.service.ts` (lines 10, 16–17, 21, 24, 73, 81, 121, 129, 161, 169, 215, 237), `building_door_access_control_device.service.ts` (line 15), `building_door_access_control_device_document.model.ts` (line 6), `building_door_access_control_device_keys.controller.ts` (lines 31, 65, 83, 88).
- **`building_intercom`**: `building_intercom_inhabitant.service.ts` (line 272), various controller/service files for `OSKBuildingIntercomController`, `OSKBuildingIntercomCallTransferListController`, `OSKIntercomMessagePublisherService` — specific line numbers not itemized beyond the permission-check citation.
- **`building_pincode`**: `building_pincode.controller.ts` (lines 6–10), `building_pincode.service.ts` (lines 6–7, 14–16), `building_pincode_document.model.ts` (line 47 for the union type alias).
- **`building_pincode_trash`**: `building_pincode_trash.controller.ts` (imports), `building_pincode_trash_document.model.ts` (imports). No specific internal line numbers were captured in the source capability output for CRUD methods.
- **`building_settings`**: `building_settings.service.ts` (five `permission-denied` sites, one per handler; exact line numbers not individually itemized in source output beyond the RBAC table), `data/building_settings_default_data.ts`.
- **`building_unit`**: `building_unit.service.ts` (lines 44, 99, 135, 143, 161, 204, 212, 240, 287, 295, 315, 333, 341, 349, 353, 363), `building_unit_door.service.ts` (lines 46, 62, 69, 73–74), `building_unit_inhabitant.service.ts` (lines 63–145, 175–185, 215–232, 246–254).
- **`building_unit_nonAppUser`**: `building_unit_nonAppUser.service.ts` (lines 6–27, 187, 229, 265, 268, 349, 425), `building_unit_nonAppUser_activity.service.ts` (line 8), `building_unit_nonAppUser_activity_aggregates.service.ts` (line 8, line 12), `building_unit_nonAppUser_access.service.ts` (lines 6–7).
- **`building_user`**: `building_user.service.ts` (lines 7–15, 26–120, 49, 290–301), `building_user.controller.ts` (lines 6–7), `building_user_document.model.ts` (line 8), `building_user_request.model.ts` (line 8).

**Uncited claims flagged rather than backed by a specific fact reference**: the reconciled intra-module dependency graph in Section 5 (a synthesis across many capabilities' import lists, not a single citable fact); the RBAC cross-check table in Section 9 (derived by comparing permission strings named in the capability outputs against `rbac-roles.json`, not a single fact); and all "cross-capability issues visible only from this reduce step" in Section 13 (by definition, these are comparisons across capability outputs rather than citations to a single evidence fact).