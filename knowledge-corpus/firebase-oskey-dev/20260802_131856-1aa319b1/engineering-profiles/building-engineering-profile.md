# Module Engineering Profile: `building`

## 0. Generation Metadata
- runId: 20260802_131856-1aa319b1
- generatedAt: 2026-08-02T14:02:53.228Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: claude-default
- llmProvider: anthropic
- llmModel: claude-sonnet-5

---

## 1. Executive Summary

The `building` module is the platform's core domain owner for the **Building** scope in Oskey's Organization → Entity → Property → Building → Unit hierarchy (per `Oskey Architecture.md` §2). It owns the `OSKBuilding` entity itself and an extensive tree of building-scoped sub-concerns implemented as 10 submodules plus a root capability: building CRUD and property reassignment (`_module_root`), building-centric access ledgers (`building_accesses`), door-activity ingestion (`building_activity`), physical door records and ACD assignment/key management (`building_door`), the Android Intercom directory and call-transfer routing (`building_intercom`), PIN code issuance and retirement (`building_pincode`, `building_pincode_trash`), per-building configuration (`building_settings`), the Unit entity and its inhabitants/doors/permanent-guests/invitations (`building_unit`), Non-App User (PIN-only) provisioning within a unit (`building_unit_nonAppUser`), and building-scoped operational user records (`building_user`). **Confirmed** (synthesized across all 11 capability outputs).

Architecturally, `building` is one of the most heavily depended-upon modules in the repository: 8 other modules (`access_control_device`, `admin`, `call`, `core`, `organization`, `supplier`, `unit_management`, `user`) call into it (Cross-Module Dependency Graph, inbound, **Confirmed**), while `building` itself depends outbound on only 5 modules (`access_control_device`, `core`, `organization`, `settings`, `user`). This asymmetry is consistent with `building` acting as a foundational data-owning hub rather than an orchestrator: actual access-granting/revoking logic is deliberately centralized in `core`'s access-orchestration layer (`OSKAccessService`, `OSKAccessUpdateService`, `OSKAccessMessagePublisherService`, `OSKPincodeService`), which `building`'s submodules call into rather than implement themselves — consistent with the architecture doc's description of a central Access Orchestration Service "conceptually separate from the modules that trigger it." **Confirmed/Inferred** (mechanics confirmed by call edges; the architectural characterization is Inferred from the pattern).

---

## 2. Architectural Position

- **Parent scope**: Building, per the platform's five-level hierarchy (Organization → Entity → Property → Building → Unit). `building` documents carry `propertyId`/`organizationId` (per `firestore-schema.md` `/buildings` collection and `_module_root` capability evidence), anchoring buildings under a Property. **Confirmed**.
- **Owned concepts**: Building entity; Doors (+ ACD assignment/keys); Units (+ inhabitants, permanent guests, invitations, non-app users, unit doors); Intercoms (+ call-transfer lists); building-scoped PIN codes and their trash/retirement state; building-scoped access ledgers; building-scoped operational users; building-scoped settings; building door-activity logs. **Confirmed**.
- **Provided capabilities**: CRUD and lifecycle management for all of the above, consumed programmatically by sibling submodules and by 8 other modules via controller/service classes (not solely via HTTP-facing API contracts — several submodules, e.g. `building_accesses`, `building_pincode`, `building_pincode_trash`, expose no `api_contract` at all and are purely internal data-access layers). **Confirmed**.
- **Outbound dependencies** (Cross-Module Dependency Graph, **Confirmed**): `access_control_device`, `core`, `organization`, `settings`, `user`.
- **Inbound dependencies** (Cross-Module Dependency Graph, **Confirmed**): `access_control_device`, `admin`, `call`, `core`, `organization`, `supplier`, `unit_management`, `user`. Notably `admin` (maintenance/repair tooling), `organization` (resident/invitation/property workflows), and `user` (invitation, settings, activity) all depend heavily on `building` at the method level (see §10), indicating `building` functions as shared, foundational domain state for much of the platform's resident-and-property-management surface.
- **Not** in this module: physical hardware provisioning/cryptographic device identity (`access_control_device`), the central access-orchestration business logic (`core`), organization/property/entity management (`organization`), RBAC role definitions (`settings`), and end-user identity/profile (`user`) — `building` calls into all of these but does not own them.

---

## 3. Primary Responsibilities

### `_module_root`
- **Building CRUD** (`getAllBuildings`, `getBuildingById`, `createOrganizationBuilding`, `updateBuilding`, `getBuildingsByPropertyId`) exposed as callables backed by `OSKBuildingService`, each permission-checked and, where relevant, joined with unit/door counts or filtered doors+ACDs. **Confirmed**.
- **`createOrganizationBuilding`**: dual/triple-write across `OSKBuildingController.save`, `OSKOrganizationBuildingController.save`, and `OSKPropertyController.update` (`arrayUnion`), plus seeding default settings via `getBuildingSettingsDefaultDocumentData`/`OSKBuildingSettingsController.set`. **Confirmed**.
- **`updateBuilding`**: propagates street-address changes to units and to user access records (`OSKAccessUpdateService.updateUserAccessesBuildingInfo`) and syncs the organization-scoped building record. **Confirmed**.
- **`assigningBuildingToProperty`**: moves a building between properties via `arrayUnion`/`removeBuildingFromProperty`/`OSKBuildingController.update`. **Confirmed**.
- **`deleteBuilding`** (service method only, no confirmed callable registration): blocks deletion if doors/units exist; deletes the building's settings sub-resource; **no evidenced call to delete the `/buildings/{id}` document itself**. **Confirmed** (precondition/settings logic) / **Unknown** (actual document deletion — see §13).
- **Image management**: `uploadImage`/`deleteBuildingImage` via `OSKBuildingController.uploadImage`/`.deleteImage`. **Confirmed**.

### `building_accesses`
- Building-centric access-ledger CRUD (`OSKBuildingAccessesController`) over a per-building `accesses` array, keyed by `userId` or by staff/non-app-user `memberId`, with get-or-create/append semantics (`OSKBuildingAccessService.createOrUpdateBuildingAccess` / `...ForStaffOrNonAppUser`). **Confirmed**.
- No API contracts or permission checks of its own — purely an internal service/controller layer invoked by other capabilities/modules. **Confirmed** (absence in evidence).
- Likely the building-centric half of the architecture doc's "Paired Document Pattern" dual-write access ledger, with `user`'s `user_access` submodule as the probable user-centric counterpart. **Inferred**.

### `building_activity`
- Ingests/enriches door-event activity records (`ActivityReceivedForBuilding`) and exposes four callables for reading/deleting them (`getActivityById`, `getAllBuildingActivities`, `deleteBuildingActivityById`, `deleteAllBuildingActivities`), each gated only by `OSKUserSecurityChecks({checkUserIdMatch:false})` + parameter checks, no RBAC string. **Confirmed**.
- Activity documents carry an enriched `activityType`, device/code/success outcome fields — representing processed door-event outcomes rather than raw hardware signals. **Confirmed**.

### `building_door`
- Door record CRUD for org users (`organizationUserCreateBuildingDoor`, `...UpdateBuildingDoor`, `...GetAllBuildingDoors`, `...GetBuildingDoorById`, `deleteBuildingDoor`), with deletion blocked while ACDs remain assigned and access-record propagation on update/delete. **Confirmed**.
- ACD assignment lifecycle driven by two Firestore triggers (`onDocumentCreated`/`onDocumentDeleted` on the door's `accessControlDevices` sub-path): on create, persists ACD config, creates an intercom entry, marks the device assigned, and generates an EC key pair; on delete, deletes public keys, unassigns the device, deletes ACD configs. **Confirmed**.
- Cryptographic key management for door ACDs (`generateKeys`, `getPublicKey`, `deletePublicKeys`, `getPrivateKey` via `OSKSecretService`). **Confirmed**.

### `building_intercom`
- Building intercom document CRUD and call-transfer-list CRUD (`OSKBuildingIntercomController`, `OSKBuildingIntercomCallTransferListController`). **Confirmed**.
- Three callables: `onUpdateBuildingIntercomsTransferList`, `updateIntercomDisplayName`, `deleteIntercomDisplayName`. **Confirmed**.
- Intercom-entry lifecycle for inhabitants (create/add/delete entry, per-user deletion, stale-recipient cleanup), automatic display-name generation from tenant last names, and hardware sync via Pub/Sub (`OSKIntercomMessagePublisherService`, topic `OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES`). **Confirmed**.

### `building_pincode`
- PIN document CRUD (`OSKBuildingPincodeController`: `set`, `get`, `getSafe`, `getAll`, `getAllByType`, `delete`, `getByAccessId`) across a discriminated union of PIN document types (inhabitant, guest, permanent guest, anonymous/non-app, supplier), each created by a dedicated `OSKBuildingPincodeService.createPincode*Document` method. **Confirmed**.
- No API contracts of its own — internal layer, invoked heavily by `core`'s `access_pincode.service.ts`. **Confirmed** (absence in evidence + inbound call edges).

### `building_pincode_trash`
- Retired-PIN status tracking (`status`, `lastStatusUpdate`, `expirationDate`) via `OSKBuildingPincodeTrashController` (`set`, `get`, `getSafe`, `getAll`, `getAllSafe`, `update`, `delete`). **Confirmed**.
- No API contracts of its own; invoked exclusively by `core`'s pincode service (see §10). **Confirmed**.

### `building_settings`
- Per-building configuration document (access methods, invitation rules, PIN/quickcode policy, resident/invitation toggles) with five callables: `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`, `resetBuildingSettings`. **Confirmed**.
- On update/delete/reset, cascades writes into a **separate, `user`-module-owned** per-user settings projection (`OSKUserSettingsBuildingController`) for every organization user. **Confirmed** (call evidence); the architectural rationale for this duplication is not evidenced (see §13).
- `resetBuildingSettings` is gated by the same permission as `deleteBuildingSettings` (`v1.org.settings.delete`) rather than an edit-class permission — flagged, not resolved (see §9/§13).

### `building_unit`
- Unit CRUD (`organizationUserCreateBuildingUnit`, `...UpdateBuildingUnit`, `...GetAllBuildingUnits`, `...GetBuildingUnitById`, `deleteBuildingUnit`), the last of which fans out user-removal notifications (logged only) before deletion. **Confirmed**.
- Unit-door creation (`OSKBuildingUnitDoorService.createBuildingUnitDoor`) automatically grants all current unit inhabitants permanent access to a newly created unit door via `OSKAccessService.createAccess`. **Confirmed**.
- Unit inhabitant lifecycle (`addInhabitant`, `removeInhabitant`, `getCleanUnitInhabitantList`, `getInhabitantsByBuildingId`) — on add, provisions access, registers tenant/resident types in all building intercoms, and derives user-level building/unit settings; on remove, deletes the access grant and the intercom entry. **Confirmed**.
- Unit inhabitant invitations (`OSKBuildingUnitInvitationController`) and unit permanent guests (`OSKBuildingUnitPermanentGuestController`) — full CRUD/collection-group query support. **Confirmed**.
- Hosts the nested `building_unit_nonAppUser` submodule (registered but its own capability, described separately below). **Confirmed reference**.

### `building_unit_nonAppUser`
- Non-App User (PIN-only) profile CRUD scoped to a unit, plus access provisioning/revocation (`createNonAppUserAccess`, `createNonAppUserWithAccess`, `updateNonAppUserAccessDoors`, `deleteNonAppUserAccess`) and hardware-activity enrichment/aggregation for this user type. **Confirmed**.
- Dual-write pattern: writes both a Non-App-User-scoped `accesses` collection and the sibling `building_accesses` building-centric ledger, then publishes ACD update/delete messages via `core`'s `OSKAccessMessagePublisherService`. **Confirmed**.
- `deleteNonAppUserAccess` exists as a fully-wired service method but has **no evidenced callable registration** — same open-endpoint pattern seen in `_module_root`'s `deleteBuilding` (see §13). **Confirmed absence** in evidence.

### `building_user`
- Building-scoped operational user record CRUD (`/buildings/{buildingId}/users`) via `OSKBuildingUserController`. **Confirmed**.
- `createBuildingUser` callable: permission-gated creation that also provisions access via `core`'s `OSKAccessService.createAccess` before persisting the building-user document. **Confirmed**.
- `onDocumentDeleted` cascade: deletes the building-side access record and all of the user's accesses — its signature (Firestore snapshot) strongly implies a Firestore delete-trigger, though the trigger-registration code itself is not in evidence. **Inferred** (existence as a trigger), **Unknown** (wiring).

---

## 4. Public Interfaces

| Submodule | Callable(s) | Notes |
|---|---|---|
| `_module_root` | `getAllBuildings`, `getBuildingById`, `createOrganizationBuilding`, `updateBuilding`, `deleteBuildingImage`, `assigningBuildingToProperty`, `getBuildingsByPropertyId` | `deleteBuilding` (service method) has **no** confirmed callable registration. |
| `building_accesses` | *(none)* | Internal controller/service/model surface only. |
| `building_activity` | `getActivityById`, `getAllBuildingActivities`, `deleteBuildingActivityById`, `deleteAllBuildingActivities` | `ActivityReceivedForBuilding` is an internal ingestion method, not itself a callable/trigger in evidence. |
| `building_door` | `organizationUserCreateBuildingDoor`, `organizationUserUpdateBuildingDoor`, `organizationUserGetAllBuildingDoors`, `organizationUserGetBuildingDoorById`, `deleteBuildingDoor` | Plus 2 Firestore triggers (§8). |
| `building_intercom` | `onUpdateBuildingIntercomsTransferList`, `updateIntercomDisplayName`, `deleteIntercomDisplayName` | |
| `building_pincode` | *(none)* | Internal; consumed heavily by `core`. |
| `building_pincode_trash` | *(none)* | Internal; consumed exclusively by `core`. |
| `building_settings` | `createBuildingSettings`, `getResidentSettings`, `updateBuildingSettings`, `deleteBuildingSettings`, `resetBuildingSettings` | |
| `building_unit` | `organizationUserCreateBuildingUnit`, `organizationUserUpdateBuildingUnit`, `organizationUserGetAllBuildingUnits`, `organizationUserGetBuildingUnitById`, `deleteBuildingUnit` | |
| `building_unit_nonAppUser` | `createNonAppUser`, `getNonAppUser`, `getAllNonAppUsers`, `updateNonAppUser`, `deleteNonAppUser`, `createNonAppUserAccess`, `createNonAppUserWithAccess`, `updateNonAppUserAccessDoors` | `deleteNonAppUserAccess` (service method) has **no** confirmed callable registration. |
| `building_user` | `createBuildingUser` | Plus inferred `onDocumentDeleted` trigger (§8). |

All confirmed unless noted. Every callable enforces App Check (`enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR`) and `OSKUserSecurityChecks`/`OSKSecurityChecks.checkParameters` at minimum.

---

## 5. Internal Structure

### Submodule inventory (11 capabilities)
`_module_root`, `building_accesses`, `building_activity`, `building_door`, `building_intercom`, `building_pincode`, `building_pincode_trash`, `building_settings`, `building_unit` (parent of `building_unit_nonAppUser`), `building_user`. **Confirmed** (per Intra-Module Coupling Graph `submoduleCount: 11`).

### Intra-module coupling (from the Intra-Module Coupling Graph — all entries below **Confirmed**, not reconciled by hand)

- **`_module_root`** → outbound to: `building_activity`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_user` (root wires/imports every submodule's index and, in `building.service.ts`, calls into `building_door`, `building_settings`, `building_unit` controllers directly).
- **`_module_root`** ← inbound from: `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_unit_nonAppUser`, `building_user` (all resolve `OSKBuildingController` to fetch the parent building record).
- **`building_accesses`** ← inbound from: `building_unit_nonAppUser`, `building_user` (both call `OSKBuildingAccessesController`). No outbound coupling of its own.
- **`building_activity`** ← inbound from: `_module_root` (wiring) and `building_unit_nonAppUser` (imports `OSKBuildingActivity` type). No outbound coupling of its own.
- **`building_door`** ↔ `building_intercom` (door → intercom for `OSKBuildingIntercomService` on ACD assignment; intercom → door for `OSKBuildingDoorController`/`OSKUserDoor`). Inbound also from `building_pincode`, `building_settings`, `building_unit`, `building_unit_nonAppUser`, and `_module_root` — `building_door` is the single most-depended-upon sibling submodule (5 inbound submodule dependents).
- **`building_intercom`** ↔ `building_unit` (intercom depends on `building_unit` for inhabitant data; `building_unit` depends on `building_intercom` for directory registration) — bidirectional coupling.
- **`building_pincode`** ← inbound from `building_pincode_trash` (trash model imports `OSKBuildingPincodeDocument`). `building_pincode` → outbound to `building_door` (`OSKUserDoor`).
- **`building_settings`** ↔ `building_intercom`/`building_unit` (settings consumed by both for resident/invitation policy); `building_settings` → outbound to `building_door` (populating default `permittedInvitationDoors`) and to `_module_root`.
- **`building_unit`** ↔ `building_unit_nonAppUser` (parent/child submodule relationship — `building_unit` wires the nested submodule's triggers; `building_unit_nonAppUser` calls back into `building_unit`'s controller).
- **`building_user`** → outbound to `building_accesses` only; ← inbound from `_module_root` only.

This graph confirms the module's internal shape: `building_door`, `building_unit`, and `_module_root` are the most central sibling submodules, consistent with the Data Ownership Hints (§6) showing `OSKBuildingDoorController` and `OSKBuildingController` as the most widely-called classes both intra-module and cross-module.

### Per-submodule component summary
- `_module_root`: `OSKBuildingController` (extends `OSKDocumentController`, `core`), `OSKBuildingService`.
- `building_accesses`: `OSKBuildingAccessesController`, `OSKBuildingAccessService`.
- `building_activity`: `OSKBuildingActivitiesController` (extends `OSKDocumentAndMessageController`, `core`), `OSKBuildingActivitiesService`.
- `building_door`: `OSKBuildingDoorController`, `OSKBuildingDoorAccessControlDeviceController`, `OSKBuildingDoorAccessControlDeviceKeysController`, `OSKBuildingDoorService`, `OSKBuildingDoorAccessControlDeviceService`.
- `building_intercom`: `OSKBuildingIntercomController` (extends `OSKDocumentAndMessageController`), `OSKBuildingIntercomCallTransferListController`, `OSKBuildingIntercomService`, `OSKBuildingIntercomCallTransferListService`, `OSKIntercomMessagePublisherService`.
- `building_pincode`: `OSKBuildingPincodeController`, `OSKBuildingPincodeService`.
- `building_pincode_trash`: `OSKBuildingPincodeTrashController`, `OSKBuildingPincodeTrashService`.
- `building_settings`: `OSKBuildingSettingsController`, `OSKBuildingSettingsService`.
- `building_unit`: `OSKBuildingUnitController`, `OSKBuildingUnitDoorController`/Service, `OSKBuildingUnitInhabitantController`/Service, `OSKBuildingUnitInvitationController`, `OSKBuildingUnitPermanentGuestController`.
- `building_unit_nonAppUser`: `OSKBuildingUnitNonAppUserController`/Service, `OSKNonAppUserAccessController`/Service, `OSKNonAppUserPincodeController`/Service, `OSKNonAppUserActivitiesController`/Service, `OSKNonAppUserActivityAggregatesController`/Service.
- `building_user`: `OSKBuildingUserController`, `OSKBuildingUserService`.

All **Confirmed** per capability outputs.

---

## 6. Firestore & Data Ownership

| Collection (best-evidenced path) | Owning submodule | Confidence |
|---|---|---|
| `/buildings` (root) | `_module_root` (`OSKBuildingController`) | **Confirmed** (direct `_query('/buildings', ...)` call). |
| `/buildings/{id}/accesses` | `building_accesses` (`OSKBuildingAccessesController`) | **Confirmed**, cross-checked against `firestore-schema.md` field-for-field match. |
| `/buildings/{id}/doors` and `/buildings/{id}/doors/{doorId}` | `building_door` (`OSKBuildingDoorController`) | **Inferred** — path constructed via `getCollectionPath`, no literal string fact captured, but strongly implied by CRUD method shapes and matches `firestore-schema.md`. |
| `/buildings/{id}/doors/{doorId}/accessControlDevices/{deviceId}` (+ `/keys` doc `publicKey`) | `building_door` (`OSKBuildingDoorAccessControlDeviceController`, `...KeysController`) | **Confirmed** for the `keys/publicKey` document (direct get/set/delete evidence); **Confirmed** trigger existence on the parent path, operation scope `undetermined_may_be_indirect`. |
| `/buildings/{id}/intercoms` | `building_intercom` (`OSKBuildingIntercomController`) | **Confirmed**, matches `firestore-schema.md`. |
| `/buildings/{id}/callTransferList` | `building_intercom` (`OSKBuildingIntercomCallTransferListController`) | **Confirmed**, matches `firestore-schema.md`. |
| `/buildings/{id}/pincodes` | `building_pincode` (`OSKBuildingPincodeController`) | **Inferred** path (no literal fact), but field-shape correspondence with `firestore-schema.md` is exact. |
| Pincode-trash collection (name/path not evidenced; not present in `firestore-schema.md` at all) | `building_pincode_trash` (`OSKBuildingPincodeTrashController`) | **Unknown** exact path — flagged as a documentation gap, not just an inference gap. |
| `/buildings/{id}/settings` | `building_settings` (`OSKBuildingSettingsController`) | **Inferred** path; field correspondence with `firestore-schema.md`'s `/buildings/{id}/settings` is exact. |
| `/buildings/{id}/units`, `.../units/{id}/doors`, `.../units/{id}/permanentGuests`, `.../units/{id}/inhabitants` (inhabitants path inferred), unit-invitations (path inferred) | `building_unit` (`OSKBuildingUnitController` and door/inhabitant/permanentGuest/invitation controllers) | **Confirmed** for `/units` and `/units/{id}/doors` and `/units/{id}/permanentGuests` (literal template strings in evidence); **Inferred** for inhabitants/invitations (cross-referenced against `firestore-schema.md`'s `/buildings/{id}/units/{id}/inhabitants`). |
| Non-App User profile/access/activity/pincode collections nested under a unit | `building_unit_nonAppUser` | **Inferred** — only `getCollectionPath` parameter signatures observed (`buildingId`, `unitId`, `nonAppUserId`); no literal path string captured; loosely corroborated by the Personas doc's mention of `/units/{unitId}/nonAppUsers`. |
| `/buildings/{id}/users` | `building_user` (`OSKBuildingUserController`) | **Confirmed** literal template string; present in `firestore.rules.txt` though not separately enumerated in `firestore-schema.md`. |
| Building door-activity records (path not directly captured) | `building_activity` (`OSKBuildingActivitiesController`) | **Unknown** exact path — no `.../activities` subcollection appears in `firestore-schema.md` under `/buildings/{id}` or `/buildings/{id}/doors/{id}`; flagged as a documentation gap. |

**Cross-cutting ownership signals (Data Ownership Hints, deterministic call-count signal — Inferred conclusions only, not automatic):**
- `OSKBuildingDoorController` is called by 3 sibling submodules and 7 other modules — the single most fanned-out class in this module, consistent with doors being the nexus between building-scoped data and hardware/ACD/access workflows across the platform. **Inferred** true owner of door data (combined with its own confirmed CRUD evidence in `building_door`).
- `OSKBuildingAccessesController` (2 submodules, 6 modules) and `OSKBuildingController` (0 submodules, 7 modules) similarly show heavy fan-out, consistent with their confirmed ownership of `/buildings/{id}/accesses` and `/buildings` respectively.
- `OSKBuildingUnitInhabitantController`/`OSKBuildingUnitController` (5 and 4 external modules respectively) confirm `building_unit` as a second major hub, particularly for `organization`, `unit_management`, and `user`.
- Lower fan-out classes (`OSKBuildingPincodeTrashController` — 1 module only, `core`; `OSKBuildingIntercomCallTransferListController` — 2 modules, `admin`/`call`) are consistent with narrower, more specialized ownership and do not indicate any ownership ambiguity.
- No conflicting ownership signal was found between any two capabilities in this pack — each Firestore-touching class maps to exactly one submodule's own confirmed CRUD evidence, with no case where two different submodules both directly manipulate the same collection path.

Firestore Security Rules (`firestore.rules.txt`) corroborate `building`'s collections: `/buildings/{buildingId}` and its `doors`, `users`, `units` (+ `owners`, `residents`) subcollections are explicitly matched, consistent with the ownership claims above. **Confirmed**.

---

## 7. API Endpoints

*(Full request/response schemas as resolved per capability; response types largely unresolved across this module — see note below.)*

**`_module_root`**
- `getAllBuildings` — req: `OSKBuildingGetAllRequestData {organizationId}`. Response: not resolved in evidence — **Unknown**.
- `getBuildingById` — req: `OSKBuildingGetRequest {buildingId, organizationId}`. Resp: `OSKBuildingDetailsResponseData {building: OSKBuildingDocument, unitsCount: number, doorsCount: number}`.
- `createOrganizationBuilding` — req: `OSKBuildingCreateRequest {organizationId, propertyId, name?, imageFilename?, streetAddress: OSKStreetAddress}`. Resp: not resolved.
- `updateBuilding` — req: `OSKBuildingUpdateRequest {buildingId, data: Partial<OSKBuilding>, organizationId}`. Resp: not resolved.
- `deleteBuildingImage` — req type exists (`{buildingId, filename}`) but not present in the Resolved Schemas join for this endpoint. Resp: not resolved.
- `assigningBuildingToProperty` — req: `OSKPropertyAssigningBuildingRequestData {organizationId, oldPropertyId?, newPropertyId, buildingId, buildingData: Partial<OSKBuilding>}`. Resp: not resolved.
- `getBuildingsByPropertyId` — req: `OSKBuildingGetAllByPropertyRequest {propertyId, organizationId, accessControlDeviceType?}`. Resp: not resolved (service assembles `OSKBuildingWithDoorsDocument[]`, **Inferred** only).

**`building_activity`**
- `getActivityById` — req: `OSKGetBuildingActivityByIdRequest {buildingId, doorId, activityId}`.
- `getAllBuildingActivities` — req: `OSKGetAllBuildingActivitiesRequest {buildingId, doorId}`.
- `deleteBuildingActivityById` — req: `OSKDeleteBuildingActivityByIdRequest {buildingId, doorId, activityId}`.
- `deleteAllBuildingActivities` — req: `OSKDeleteAllBuildingActivitiesRequest {buildingId, doorId}`.
- No response schemas resolved for any of the four.

**`building_door`**
- `organizationUserCreateBuildingDoor` — req: `OSKBuildingDoorCreateRequest {buildingId, name, streetAddress: OSKStreetAddress, isForAllResidents, organizationId}`.
- `organizationUserUpdateBuildingDoor` — req: `OSKBuildingDoorUpdateRequest {buildingId, doorId, data: Partial<Pick<OSKBuildingDoor,"name"|"streetAddress">>, organizationId}`.
- `organizationUserGetAllBuildingDoors` — schema entirely unresolved (not in Resolved Schemas section).
- `organizationUserGetBuildingDoorById` — schema entirely unresolved.
- `deleteBuildingDoor` — req: `OSKBuildingDoorDeleteRequest {buildingId, doorId, adminsOrganizationId?: string}`.
- No response schemas resolved for any of the five.

**`building_intercom`**
- `onUpdateBuildingIntercomsTransferList` — req: `OSKIntercomCallTransferListRequest {userId, unitId, buildingId, callTransferList: OSKUserIntercomCallTransferListItem[]}`.
- `updateIntercomDisplayName` — req: `OSKBuildingIntercomDisplayNameRequest {buildingId, unitId, newDisplayName}`.
- `deleteIntercomDisplayName` — req: `OSKBuildingIntercomEntryDeleteRequest {organizationId, buildingId, entryId}`.
- No response schemas resolved for any of the three.

**`building_settings`**
- `createBuildingSettings` — req: `OSKBuildingSettingsCreateRequest {buildingId, buildingSettingsInputParams: OSKBuildingSettingsInputParams}`.
- `getResidentSettings` — req: `OSKBuildingGetSettingsRequest {buildingId, settingsId}`.
- `updateBuildingSettings` — req: `OSKBuildingUpdateSettingsRequest {buildingId, update: Partial<OSKBuildingSettingsInputParams>}`.
- `deleteBuildingSettings` / `resetBuildingSettings` — req: `OSKBuildingDeleteOrResetSettingsRequest {buildingId, settingsId}`.
- No response schemas resolved for any of the five. An unused/unreferenced `OSKBuildingGetAllSettingsRequest {buildingId}` type also exists with no bound endpoint in evidence.

**`building_unit`**
- `organizationUserCreateBuildingUnit` — req: `OSKBuildingUnitCreateRequest {name, floor, unitNumber, streetAddress: OSKStreetAddress, organizationId, capacity, buildingId}`.
- `organizationUserUpdateBuildingUnit` — req: `OSKBuildingUnitUpdateRequest {buildingId, unitId, data: {name, floor, unitNumber, streetAddress?}, organizationId}`.
- `organizationUserGetAllBuildingUnits` / `organizationUserGetBuildingUnitById` — schemas entirely unresolved.
- `deleteBuildingUnit` — req: `OSKBuildingUnitDeleteRequest {buildingId, unitId, adminsOrganizationId?: string}`.
- No response schemas resolved for any of the five.

**`building_unit_nonAppUser`**
- `createNonAppUser` — schema entirely unresolved.
- `getNonAppUser` — req: `OSKGetNonAppUserRequest {buildingId, unitId, nonAppUserId}`.
- `getAllNonAppUsers` — req: `OSKGetAllNonAppUsersRequest {buildingId, unitId}`.
- `updateNonAppUser` — req: `OSKUpdateNonAppUserRequest {buildingId, unitId, nonAppUserId, dataToUpdate}`.
- `deleteNonAppUser` — req: `OSKDeleteNonAppUserRequest {buildingId, unitId, nonAppUserId}`.
- `createNonAppUserAccess` — req: `OSKCreateNonAppUserAccessRequest {buildingId, unitId, nonAppUserId, doorIds?, startDate, endDate}`.
- `createNonAppUserWithAccess` — req: `OSKCreateNonAppUserWithAccessRequest` (only `doorIds?` resolved; `buildingId`/`unitId`/`fullName`/`inviterId` referenced in code but not resolved via `model_property`). Resp: `OSKCreateNonAppUserwithAccessResponse {nonAppUserId, accessId, pincode, fullName}` — the **only** resolved response schema in this entire module.
- `updateNonAppUserAccessDoors` — req: `OSKUpdateNonAppUserAccessDoorsRequest {buildingId, unitId, nonAppUserId, accessId, doorIds?}`.

**`building_user`**
- `createBuildingUser` — req: `OSKBuildingUserCreateRequest {organizationId, buildingId, userId, firstName, lastName, accessRights: OSKAccessRightWithTimestamp[], doors: OSKDoorInfo[], userType: OSKUserAccessType}`. Resp: not resolved.

**Module-wide observation**: across all ~30 callables in this module, only **one** response schema (`OSKCreateNonAppUserwithAccessResponse`) resolved via the Resolved API Request/Response Schemas join. This is reported as a systemic gap rather than an assumption of "no response" — see §13.

---

## 8. Firestore Triggers

| Trigger | Path | Handler | Confidence |
|---|---|---|---|
| `onDocumentCreated` | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` — persists ACD config (`OSKAccessControlDeviceConfigController.save`), creates intercom entry (`OSKBuildingIntercomService.createIntercomEntry`), sets assignment record, marks device assigned (`OSKAccessControlDeviceController.assignBuildingDoor`), triggers key generation (`OSKBuildingDoorAccessControlDeviceKeysController.generateKeys`). | **Confirmed** (submodule `building_door`). |
| `onDocumentDeleted` | Same path as above | `OSKBuildingDoorAccessControlDeviceService` — deletes public keys, unassigns device (`OSKAccessControlDeviceController.unassignBuildingDoor`), deletes all ACD configs (`OSKAccessControlDeviceConfigController.deleteAll`). | **Confirmed** (submodule `building_door`). |
| `onDocumentDeleted` (inferred trigger, not explicitly registered in evidence) | `/buildings/{buildingId}/users/{userId}` (inferred from controller scope) | `OSKBuildingUserService.onDocumentDeleted` — deletes the building-side access record (`OSKBuildingAccessesController.deletePerUser`) and all of the user's accesses (`OSKUserAccessesController.deleteAllUserAccesses`). | **Inferred** existence as a trigger (signature takes a Firestore snapshot); **Unknown** actual registration/wiring (submodule `building_user`). |

No other Firestore triggers were evidenced for any of the remaining 8 submodules (`_module_root`, `building_accesses`, `building_activity`, `building_intercom`, `building_pincode`, `building_pincode_trash`, `building_settings`, `building_unit`, `building_unit_nonAppUser`) — **Confirmed absence** in each capability's own evidence pack.

---

## 9. Permissions & Security

### Confirmed matches against `rbac-roles.json`
| Permission | Checked in | Operation |
|---|---|---|
| `v1.org.buildings.create` | `_module_root.createOrganizationBuilding`; also checked (semantically inconsistently) in `building_unit.deleteBuildingUnit` and `building_unit_door.createBuildingUnitDoor` | Building creation |
| `v1.org.buildings.edit` | `_module_root.updateBuilding`; `building_door.organizationUserCreateBuildingDoor`/`...UpdateBuildingDoor`; also checked (semantically inconsistently) in `building_unit.organizationUserCreateBuildingUnit`/`...UpdateBuildingUnit` | Building/door/unit edit |
| `v1.org.buildings.view` | `_module_root.getAllBuildings`; `building_door.organizationUserGetBuildingDoorById`; `building_unit.organizationUserGetBuildingUnitById` | Read access |
| `v1.org.settings.create` / `.view` / `.edit` / `.delete` | `building_settings`'s five callables, one-to-one except `resetBuildingSettings` (see below) | Settings CRUD |
| `v1.admin.accessControlDevice.edit` | `building_intercom.deleteIntercomDisplayName` | ACD-adjacent operation gating intercom-entry deletion |
| `v1.admin.building.register` + `v1.org.buildings.create` (combined) | `building_user.createBuildingUser` | Building-user creation |

### Flagged mismatches / semantic inconsistencies (not reconciled, per instructions)
- **`v1.org.buildings.createManager`** — checked in `building_door.deleteBuildingDoor`. **Does not appear anywhere in `rbac-roles.json`.** Genuine string-level RBAC mismatch. **Confirmed** risk.
- **`v1.org.settings.create`** — checked in `_module_root.assigningBuildingToProperty`. The string exists in `rbac-roles.json`, so there is no string-level mismatch, but its semantic scope (management-rule creation) does not match the operation it gates (building↔property reassignment), which is elsewhere in the same capability gated by `v1.org.buildings.*` permissions. **Confirmed** (string present) / **Inferred** (semantic mismatch).
- **`building_unit.organizationUserCreateBuildingUnit`** checks `v1.org.buildings.edit` rather than the dedicated `v1.org.buildings.create`. **Confirmed** mismatch (operation/permission-class mismatch), not reconciled.
- **`building_unit.deleteBuildingUnit`** checks `v1.org.buildings.create` rather than a delete-class permission. **Confirmed** mismatch, not reconciled.
- **`building_settings.resetBuildingSettings`** is gated by `v1.org.settings.delete` rather than an edit-class permission, despite functioning as an update (regenerate-and-apply-defaults), not a deletion. **Confirmed** by evidence; not reconciled.
- **`building_unit.organizationUserGetAllBuildingUnits`** — no permission-candidate fact evidenced at all, unlike its four sibling endpoints. Flagged as a gap, not assumed to be unguarded.
- **`building_accesses`, `building_pincode`, `building_pincode_trash`, `building_unit_nonAppUser`** show **no RBAC permission strings anywhere** in their own evidence — authorization (if any beyond `OSKUserSecurityChecks({checkUserIdMatch:false})` and parameter-shape checks) is not visible at this layer and cannot be cross-checked against RBAC. This recurs across four separate submodules, suggesting a module-wide pattern where authorization for building-internal/PIN/access-ledger operations is either enforced entirely upstream (by callers in `core`/`organization`/`user`) or via Firestore rules rather than in-code RBAC strings — **flagged as a cross-capability pattern**, not resolved.

### Security enforcement patterns (module-wide, Confirmed)
- Every callable across all 11 submodules applies `OSKUserSecurityChecks({checkUserIdMatch: false})` plus `OSKSecurityChecks.checkParameters(...)` before business logic.
- App Check is enforced module-wide via `functionBuilder.runWith({enforceAppCheck: !process.env.OSK_FIREBASE_EMULATOR})`.
- `checkUserIdMatch: false` is used uniformly, meaning no endpoint in this module restricts access purely by caller-userId match at the decorator level — actual authorization relies on the RBAC permission checks (where present) described above.

---

## 10. Cross-Module Relationships

Per the **Cross-Module Dependency Graph** (deterministic, AST-derived — all entries below reported as **Confirmed**, both directions):

### Outbound (building depends on X)
- **`access_control_device`** — Confirmed. Touchpoints in `building_request.model.ts`, `building_activity.service.ts`, `building_door_access_control_device_document.model.ts`, `building_door_access_control_device.service.ts`, `building_unit_nonAppUser`'s activity services. Method-level: `building_door` calls `OSKAccessControlDeviceController.get/assignBuildingDoor/unassignBuildingDoor` and `OSKAccessControlDeviceConfigController.save/deleteAll`.
- **`core`** — Confirmed. The single heaviest outbound dependency (touchpoints across nearly every submodule) — base controller classes (`OSKDocumentController`, `OSKDocumentAndMessageController`), logging (`OSKLoggingService`), secrets (`OSKSecretService`), and the entire access-orchestration layer (`OSKAccessService`, `OSKAccessUpdateService`, `OSKAccessUtilsService`, `OSKAccessMessagePublisherService`, `OSKPincodeService`).
- **`organization`** — Confirmed. `OSKOrganizationUserController`, `OSKOrganizationUserUtils`, `OSKOrganizationBuildingController`, `OSKPropertyController`, `OSKOrganizationResidentsController` — used across `_module_root`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_user`.
- **`settings`** — Confirmed. `OSKConsolidatedRolesController.checkUserPermissions`/`checkUserPermissionsSafe` — used across `_module_root`, `building_door`, `building_intercom`, `building_settings`, `building_unit`, `building_user` for every RBAC check in this module.
- **`user`** — Confirmed. `OSKUserController`, `OSKUserAccessesController`/`OSKAccessesDocument`, `OSKUserIntercomService`, `OSKUserSettingsBuildingController`/`OSKUserSettingsUnitService`, `OSKUserService._getInhabitantType` — used across `_module_root`, `building_accesses`, `building_intercom`, `building_settings`, `building_unit`, `building_unit_nonAppUser`, `building_user`.

### Inbound (X depends on building) — this direction is only visible via this graph, no capability output could see it
- **`access_control_device`** — Confirmed. Calls `OSKBuildingController.getSafe`, `OSKBuildingDoorController.getSafe`, `OSKBuildingAccessesController.get` (activity enrichment).
- **`admin`** — Confirmed, and the heaviest inbound dependent by call-site count. Extensive maintenance/repair (`db_accesses`, `db_building`, `db_intercoms`, `db_pincodes`, `db_propertiesIds`, `db_residents`, `db_user_settings`) and user-provisioning (`admin_users`) tooling calls directly into nearly every `building` submodule's controllers (`OSKBuildingController`, `OSKBuildingDoorController`, `OSKBuildingIntercomController`, `OSKBuildingSettingsController`, `OSKBuildingPincodeController`, `OSKBuildingUnitController`/`...InhabitantController`, `OSKBuildingUnitNonAppUserController`, `OSKNonAppUserAccessController`).
- **`call`** — Confirmed. `OSKBuildingDoorController.get`, `OSKBuildingIntercomCallTransferListController.get` — supports intercom call routing.
- **`core`** — Confirmed. The access-orchestration layer (`access.service.ts`, `access_pincode.service.ts`, `access_pincode_generation.service.ts`, `access_update.service.ts`, `access_utils.service.ts`, `pub_sub_receiver.service.ts`) calls extensively into `building`'s `OSKBuildingController`, `OSKBuildingAccessesController`/`Service`, `OSKBuildingDoorController`, `OSKBuildingPincodeController`/`Service`, `OSKBuildingPincodeTrashController`, `OSKBuildingUnitInhabitantController`, `OSKBuildingUnitNonAppUserController`, `OSKNonAppUserPincodeController`/`Service`, `OSKNonAppUserAccessService`, `OSKBuildingActivitiesService`, `OSKNonAppUserActivityService`/`...AggregatesService` — confirming `core` as the true orchestrator of access/pincode workflows that `building` merely persists data for (per the architecture doc's Access Orchestration Service pattern).
- **`organization`** — Confirmed, second-heaviest inbound dependent. Building/property/entity/resident/onboarding/invitation workflows across `organization_building`, `organization_building_invitation`, `organization_entity`, `organization_inhabitant`, `organization_intercom_communication`, `organization_onboarding_inhabitant`, `organization_property`, `organization_residents`, `organization_user_invitation` all call into `building`'s door, unit, unit-inhabitant, intercom, non-app-user, accesses, and pincode controllers/services — including several destructive operations (`OSKBuildingUnitController.deleteCollection`, `OSKBuildingUnitInhabitantController.delete`, `OSKBuildingUnitNonAppUserController.delete`) driven entirely from `organization`.
- **`supplier`** — Confirmed. `supplierStaff` services call `OSKBuildingController.getSafe/get`, `OSKBuildingAccessesController.get/update`, `OSKBuildingDoorController.get/getAll`.
- **`unit_management`** — Confirmed. Extensive calls into `OSKBuildingUnitInhabitantController` (get/update/delete), `OSKBuildingUnitPermanentGuestController`, `OSKBuildingIntercomService.deleteIntercomEntryUser`, `OSKBuildingUnitNonAppUserController`, `OSKNonAppUserPincodeController` — `unit_management` appears to be a dedicated orchestration layer built almost entirely on top of `building_unit`/`building_unit_nonAppUser`.
- **`user`** — Confirmed. `user_access`, `user_activity`, `user_device`, `user_intercoms`, `user_invitation`, `user_pincode`, `user_settings` submodules, plus `user.service.ts` itself, call into `OSKBuildingController`, `OSKBuildingUnitController`/`...InhabitantController`, `OSKBuildingDoorController`, `OSKBuildingAccessesController`, `OSKBuildingUserController` — reciprocal to `building`'s own outbound dependency on `user`.

No relationships in this section are Inferred — the Cross-Module Dependency Graph resolves both directions deterministically via AST import/call resolution, superseding any Inferred cross-module guesses that individual capability outputs may have made from relative-import paths alone.

---

## 11. External Hooks

- **Pub/Sub publish (hardware sync)**: `building_intercom`'s `OSKIntercomMessagePublisherService.publishMessageIntercomCreate/Update/Delete`, publishing to topic `{process.env.OSK_PUBSUB_TOPIC_ACD_INTERCOM_ENTRIES}` via `OSKBuildingIntercomController.publishMessage`. No `detectionMethod` (`structural_chain` vs `known_wrapper_method_name`) was captured in any capability's evidence pack for this call site — **Unknown** which detection method applies; reported as a confirmed publish call site without over-specifying detection confidence.
- **Pub/Sub publish (access sync)**: `building_unit_nonAppUser` calls `core`'s `OSKAccessMessagePublisherService.publishMessageToAllACDs` to propagate access-door updates/deletions to ACDs — this is a **cross-module** outbound call into `core`'s publisher, not a publish call owned by `building` itself. **Confirmed** call exists; publisher implementation is out of `building`'s scope.
- **No push-receiver (`pubsubPushReceiver: true`) `api_contract` facts** were present in any of this module's 11 capability packs — this module does not appear to own a Pub/Sub Event Routing Table entry point itself; it is a publisher into `core`'s/`access_control_device`'s pipeline, consistent with the architecture doc's description of hardware sync as one-directional (Firestore → Pub/Sub → MongoDB). **Confirmed absence** in evidence.
- **Secret management**: `building_door`'s ACD key-pair generation/storage/retrieval via `OSKSecretService.createPrivateKeySecret`/`.getPrivateKey` — an external boundary to a secret-management backend (likely GCP Secret Manager, per the architecture doc's general GCP-serverless description, but not directly confirmed by any fact). **Confirmed** dependency exists; **Unknown** the specific backend.
- **File upload**: `_module_root`'s `uploadImage`/`deleteBuildingImage` via `OSKBuildingController.uploadImage`/`.deleteImage` — consistent with the architecture doc's delegated-upload pattern (signed URL to Cloud Storage), though the signed-URL mechanism itself is not directly evidenced in this module's own capability packs (only the controller-level call is). **Inferred** consistency with the documented pattern.
- **No** `pubsub_event_route` facts (i.e., no receiver-side routing table) appear anywhere in this module's evidence — the two Pub/Sub mechanisms described in the system instructions (publish call sites vs. push-receiver routing) are **not evidenced as connected** for this module, and neither is a push-receiver role evidenced here at all.

---

## 12. Architectural Observations

- **Hub-and-spoke data ownership**: `building` is confirmed (via the Cross-Module Dependency Graph and Data Ownership Hints) to be one of the most heavily-depended-upon modules in the repository — 8 inbound module dependents versus only 5 outbound — consistent with its role as the platform's authoritative store for building/unit/door/intercom/pincode/access-ledger state, called into by nearly every workflow-oriented module (`organization`, `unit_management`, `user`, `admin`, `supplier`, `call`). **Confirmed** (deterministic graph evidence).
- **Orchestration is deliberately external**: despite owning the data, `building` does not itself implement access-granting/revoking or pincode-lifecycle business logic — every capability that touches access or pincodes (`building_accesses`, `building_pincode`, `building_pincode_trash`, `building_unit`'s door/inhabitant flows, `building_unit_nonAppUser`) calls into `core`'s `OSKAccessService`/`OSKAccessUpdateService`/`OSKAccessMessagePublisherService`/`OSKPincodeService`, and conversely `core` calls back into `building`'s controllers to persist state. This bidirectional core↔building relationship (5 outbound touchpoints module-wide, matched by extensive inbound calls from `core`) is the clearest evidence in this module for the architecture doc's described "Access Orchestration Service... conceptually separate from the modules that trigger it." **Confirmed** mechanics / **Inferred** architectural framing.
- **Consistent base-class layering**: virtually every controller in this module extends `core`'s `OSKDocumentController` or `OSKDocumentAndMessageController`, giving a uniform CRUD-plus-optional-messaging shape across all 11 submodules — a strong, repeatable architectural pattern rather than ad hoc per-submodule design. **Confirmed**.
- **Denormalized dual-write / Paired Document Pattern**: `building_accesses` (building-centric) and `user`'s `user_access` submodule (user-centric, outside this module's own evidence) appear to be two sides of the same access record, both populated by upstream orchestration in `core`. `building_unit_nonAppUser` exhibits the same pattern explicitly (writing both its own scoped accesses collection and the sibling `building_accesses` ledger). **Confirmed** for the `building_unit_nonAppUser` case (both writes evidenced in the same capability); **Inferred** for the `building_accesses`↔`user_access` pairing (only the `building` side's evidence is available in this pack).
- **Settings fan-out**: `building_settings` maintains a denormalized per-user projection in the `user` module (`/users/{id}/buildingSettings`) on every settings update/delete/reset — a fan-out consumer relationship confirmed by call evidence, though its architectural rationale (cache vs. personalization layer) is not evidenced from this module's side alone.
- **Recurring permission/operation mismatch pattern**: across three independent submodules (`_module_root`, `building_door`, `building_unit`, `building_settings`), RBAC permission strings checked for a given operation do not consistently match the operation's own CRUD class (e.g., create-checks-edit, delete-checks-create, reset-checks-delete) — this is a pattern only visible by comparing multiple capabilities side-by-side during this reduce step, not something any single capability could characterize as a *module-wide* pattern on its own. **Confirmed** as a genuine cross-capability observation (see also §9, §13).
- **Response-schema resolution gap is module-wide, not isolated**: of ~30 callables across all 11 submodules, only one (`createNonAppUserWithAccess`) has a resolved response schema. This uniformity — visible only by comparing all 11 capability packs together — suggests either a systemic gap in the schema-resolution tooling for this module's response types, or a genuine platform convention of thin/untyped callable responses; this reduce step cannot distinguish between the two and flags it as a module-wide observation rather than 11 separate isolated gaps.

---

## 13. Risks & Open Questions

*(Listed, not resolved, per instructions. Grouped by whether they were visible to a single capability or only emerge from comparing capabilities.)*

### Cross-capability risks (visible only by comparing multiple capability outputs — could not have been written by any one submodule alone)
- **Systemic RBAC operation/permission-class mismatches** recur independently across `_module_root` (`assigningBuildingToProperty` checks `v1.org.settings.create`), `building_door` (`deleteBuildingDoor` checks a non-existent `v1.org.buildings.createManager`), `building_unit` (create checks `.edit`, delete checks `.create`), and `building_settings` (`resetBuildingSettings` checks `.delete`). No single capability could show this is a *pattern* rather than an isolated quirk — comparing all four makes it visible as a module-wide risk worth investigating (e.g., copy-pasted permission-check boilerplate that was never updated per-endpoint).
- **Two "orphan" service methods with no callable registration**: `_module_root.deleteBuilding` and `building_unit_nonAppUser.deleteNonAppUserAccess` both have full security/business logic wired but no corresponding `api_contract`/`https.onCall` registration in their own evidence. Individually each capability flagged this as its own open question; comparing them reveals a recurring pattern (fully-implemented-but-unregistered deletion methods) across two unrelated submodules, which may indicate a broader convention (e.g., internal-only invocation from other services) rather than two unrelated oversights — worth investigating together rather than separately.
- **No inbound cross-module call to a "delete" method on `OSKBuildingController`** appears anywhere in the Resolved Cross-Module Call Edges (inbound calls only show `.get`/`.getSafe`/`.getAll`/`.update`), which is consistent with (though does not confirm) `_module_root`'s own open question that the actual `/buildings/{id}` document deletion may not be implemented, or is implemented via a path not captured in any evidence pack. This cross-reference between one capability's internal open question and the separately-provided call-edge graph is only possible at this reduce step.
- **Four submodules with zero RBAC permission-string evidence** (`building_accesses`, `building_pincode`, `building_pincode_trash`, `building_unit_nonAppUser`) — individually each flagged this as "unknown where authorization happens." Seen together, this suggests a consistent module design choice (authorization enforced by upstream orchestrators in `core`/`organization`, not at these internal layers) rather than four independent gaps — plausible, but not confirmed by any evidence in this pack.

### Per-capability risks (retained from individual capability outputs)
- `_module_root`: no confirmed literal Firestore path fact for `/buildings` sub-resources touched by sibling controllers; several response schemas unresolved.
- `building_accesses`: composition of `OSKBuildingAccessDocument` (vs. `OSKBuildingAccess`) unresolved; no Firestore trigger evidence for downstream sync off this ledger.
- `building_activity`: literal collection path not evidenced and not present in `firestore-schema.md` at all; relationship between `RawIotActivityPayload` and `ActivityReceivedForBuilding` not evidenced; no caller of `ActivityReceivedForBuilding` visible in this module's own evidence (only suggested via the `access_control_device` outbound import — though note the Cross-Module Call Edges confirm `core`'s `pub_sub_receiver.service.ts` as the actual caller, resolving this specific question at the reduce level).
- `building_door`: exact `rolesToCheck` contents beyond single captured candidates unresolved for 3 of 5 endpoints; storage backend for ACD private keys unresolved.
- `building_intercom`: response schemas unresolved for all 3 callables; internal logic of `_getCallSettingsMode`/`_getIntercomInhabitantType` not detailed; `OSKOperationType` enum member values not evidenced.
- `building_pincode` / `building_pincode_trash`: neither has any `api_contract` evidence of its own; pincode-trash's literal collection path is not documented anywhere, including `firestore-schema.md`.
- `building_settings`: purpose of the per-user settings projection duplication not explained; `getResidentSettingsSafe` has no `service_method`/`api_contract` fact of its own; unused `OSKBuildingGetAllSettingsRequest` type with no bound endpoint.
- `building_unit`: no permission-check evidence at all for `organizationUserGetAllBuildingUnits`; nested `building_unit_nonAppUser` behavior only knowable from its own separate capability pack (now included in this profile); email-notification-on-delete only evidenced via a log line, not an actual send call.
- `building_unit_nonAppUser`: exact Firestore paths for all 5 owned collections are Inferred only; `OSKCreateNonAppUserWithAccessRequest`'s schema is incomplete relative to fields actually referenced in code (`buildingId`, `unitId`, `fullName`, `inviterId` missing from resolved schema).
- `building_user`: response schema for `createBuildingUser` unresolved; `onDocumentDeleted` trigger registration/wiring not evidenced, only the handler body; logical combination (AND/OR) of its two RBAC permission candidates not evidenced.

### Documentation/schema gaps
- Two Firestore collections used by this module (`building_activity`'s activity records, `building_pincode_trash`'s trash records) do not appear anywhere in the supplied `firestore-schema.md`, despite clear code-level evidence that they exist. This is reported as a grounding-document gap, not a code defect.

---

## 14. Evidence References

*(Consolidated from citations already present in the 11 capability outputs; no fact IDs or file:line citations are fabricated here. Where a capability output did not supply a citation for a claim, it is marked uncited rather than invented.)*

- `_module_root`: `functions/src/modules/building/controllers/building.controller.ts`, `functions/src/modules/building/services/building.service.ts`, `functions/src/modules/building/models/documents/building_document.model.ts`, `functions/src/modules/building/models/functions/building_request.model.ts`, `functions/src/modules/building/index.ts`.
- `building_accesses`: `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts`, `.../services/building_access.service.ts`, `.../models/documents/building_access_document.model.ts`.
- `building_activity`: `functions/src/modules/building/modules/building_activity/index.ts`, `.../services/building_activities.service.ts` (lines 21, 59, 77, 90, 103), `.../models/documents/building_activity_document.model.ts`.
- `building_door`: `functions/src/modules/building/modules/building_door/index.ts` (lines 59–255), `.../services/building_door.service.ts`, `.../services/building_door_access_control_device.service.ts` (lines 29–148), `.../controllers/building_door_access_control_device_keys.controller.ts`.
- `building_intercom`: `functions/src/modules/building/modules/building_intercom/index.ts`, `.../services/building_intercom_inhabitant.service.ts`, `.../services/building_intercom_calltransferlist.service.ts`, `.../services/building_intercom_message_publisher.service.ts` (line 27).
- `building_pincode`: `functions/src/modules/building/modules/building_pincode/controllers/building_pincode.controller.ts` (lines 15, 41, 66, 90, 112), `.../services/building_pincode.service.ts`, `.../models/documents/building_pincode_document.model.ts`.
- `building_pincode_trash`: `functions/src/modules/building/modules/building_pincode_trash/controllers/building_pincode_trash.controller.ts` (lines 18–60), `.../models/documents/building_pincode_trash_document.model.ts`.
- `building_settings`: `functions/src/modules/building/modules/building_settings/controllers/building_settings.controller.ts`, `.../services/building_settings.service.ts` (lines 76–491), `.../data/building_settings_default_data.ts`.
- `building_unit`: `functions/src/modules/building/modules/building_unit/index.ts`, `.../services/building_unit.service.ts` (lines 30–377), `.../services/building_unit_door.service.ts`, `.../services/building_unit_inhabitant.service.ts`.
- `building_unit_nonAppUser`: `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts` (line 48), `.../services/building_unit_nonAppUser.service.ts` (lines 105–604), `.../services/building_unit_nonAppUser_access.service.ts`, `.../services/building_unit_nonAppUser_activity.service.ts`, `.../services/building_unit_nonAppUser_activity_aggregates.service.ts`.
- `building_user`: `functions/src/modules/building/modules/building_user/controllers/building_user.controller.ts` (lines 19–43), `.../services/building_user.service.ts` (lines 26–300).
- **Cross-module/intra-module graphs**: `building/cross-module-dependencies.json` (runId `20260802_131856-1aa319b1`), `building/intra-module-coupling.json` (same runId) — used directly for §5's intra-module coupling table and §10's cross-module relationships table; every entry in those sections is traceable to a specific `file`/`line` touchpoint recorded in those two JSON graphs.
- **Resolved Cross-Module Call Edges** (method-level, same runId) — used for §10's method-level detail and the deletion-call cross-check in §13; individual edges cited inline in §10 are traceable to the specific `file:line -> module :: Class.method (file:line)` entries in that section.
- **Data Ownership Hints** (same runId) — used for §6's ownership-signal table; each class/count pair is traceable to its corresponding line in that section.

Several claims in this profile (e.g., precise semantics of `getSafe`/`getAllSafe` wrappers, `_getCallSettingsMode`/`_getIntercomInhabitantType` internals, exact literal Firestore path strings for `building_activity`/`building_pincode_trash`/`building_unit_nonAppUser`'s collections) could not be traced to any citation supplied by the underlying capability outputs and are marked **Unknown**/**uncited** in §6, §8, §11, and §13 rather than assigned a fabricated reference.