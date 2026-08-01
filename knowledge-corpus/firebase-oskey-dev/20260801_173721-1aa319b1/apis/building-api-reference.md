# API Reference: building

## 0. Generation Metadata
- runId: 20260801_173721-1aa319b1
- generatedAt: 2026-08-01T21:48:30.567Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: claude-default
- llmProvider: anthropic
- llmModel: claude-sonnet-5

## 1. API Contracts

This is a lookup reference of every `api_contract` and `firestore_trigger` fact reported by the capability-level synthesis for the `building` module. Request/response schemas are cross-referenced from `model_property` facts by `parentName` per ADR-002; where no matching `model_property` facts were found, this is stated explicitly rather than presenting the bare type name as a schema. Where an `api_contract` fact itself carried no `requestType`/`responseType` field, the mapping shown is marked **(inferred)** and was reconstructed from parameter/handler-name evidence in the source capability pack.

---

### _module_root

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `getAllBuildings` | callable | n/a (HTTPS callable) | `OSKBuildingGetAllRequestData`: `organizationId` | Lists all buildings for an organization, permission-gated on `v1.org.buildings.view`. |
| `getBuildingById` | callable | n/a (HTTPS callable) | `OSKBuildingGetRequest`: `buildingId`, `organizationId` | Retrieves a single building enriched with unit/door counts. Response candidate `OSKBuildingDetailsResponseData` (`building`, `unitsCount`, `doorsCount`) is **inferred**, not confirmed bound to this handler. |
| `createOrganizationBuilding` | callable | n/a (HTTPS callable) | `OSKBuildingCreateRequest`: `organizationId`, `propertyId`, `name`, `imageFilename`, `streetAddress` | Creates a new building, fans out denormalized copies to `/organizations/{organizationId}/buildings` and `/properties/{propertyId}`, and initializes default building settings. Permission-gated on `v1.org.buildings.create`. |
| `updateBuilding` | callable | n/a (HTTPS callable) | `OSKBuildingUpdateRequest`: `buildingId`, `data`, `organizationId` | Updates a building document; cascades name/address changes to units and user access records. Permission-gated on `v1.org.buildings.edit`. |
| `deleteBuildingImage` | callable | n/a (HTTPS callable) | `deleteBuildingImageRequest`: `buildingId`, `filename` | Deletes a building's image from storage and clears `imageFilename`. No permission-string evidenced for this handler. |
| `assigningBuildingToProperty` | callable | n/a (HTTPS callable) | `OSKPropertyAssigningBuildingRequestData`: `organizationId`, `oldPropertyId`, `newPropertyId`, `buildingId`, `buildingData` | Moves a building from one property to another. Permission-gated on `v1.org.settings.create` (flagged as a possible semantic mismatch in the profile — reported, not resolved). |
| `getBuildingsByPropertyId` | callable | n/a (HTTPS callable) | `OSKBuildingGetAllByPropertyRequest`: `propertyId`, `organizationId`, `accessControlDeviceType` | Lists buildings by property, aggregating each building's doors and assigned ACDs. No permission-string evidenced for this handler. |

No response schemas were confirmed for any handler in this capability (no `model_property` facts matched a response type name bound to a specific handler). `deleteBuilding` has no `api_contract` fact in evidence and is not listed here.

---

### building_accesses

No `api_contract` or `firestore_trigger` facts were present for this capability. It exposes only internal controller/service exports (`OSKBuildingAccessesController`, `OSKBuildingAccessService`) consumed by other capabilities; no directly callable/triggered entry points are evidenced.

---

### building_activity

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `getActivityById` | callable | n/a (HTTPS callable) | `OSKGetBuildingActivityByIdRequest`: `buildingId`, `doorId`, `activityId` | Retrieves a single building/door activity record. |
| `getAllBuildingActivities` | callable | n/a (HTTPS callable) | `OSKGetAllBuildingActivitiesRequest`: `buildingId`, `doorId` | Lists all activity records for a building's door. |
| `deleteBuildingActivityById` | callable | n/a (HTTPS callable) | `OSKDeleteBuildingActivityByIdRequest`: `buildingId`, `doorId`, `activityId` | Deletes a single door/building activity record. |
| `deleteAllBuildingActivities` | callable | n/a (HTTPS callable) | `OSKDeleteAllBuildingActivitiesRequest`: `buildingId`, `doorId` | Deletes all activity records for a building's door. |

No response schemas were found for any of the four handlers. No RBAC permission-string evidence was found for any of these operations (all four apply `OSKUserSecurityChecks({ checkUserIdMatch: false })` plus parameter validation only). No `firestore_trigger` facts were present; the ingestion handler `ActivityReceivedForBuilding` is a plain service method, not a confirmed Firestore-native trigger.

---

### building_door

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `organizationUserCreateBuildingDoor` | callable | n/a (HTTPS callable) | `OSKBuildingDoorCreateRequest`: `buildingId`, `name`, `streetAddress`, `isForAllResidents`, `organizationId` | Creates a door under a building. Permission-gated on `v1.org.buildings.edit`. |
| `organizationUserUpdateBuildingDoor` | callable | n/a (HTTPS callable) | `OSKBuildingDoorUpdateRequest`: `buildingId`, `doorId`, `data` (likely `OSKBuildingDoorUpdate`, **inferred**), `organizationId` | Updates a door; cascades door-info changes to user access documents on name/address change. Permission-gated on `v1.org.buildings.edit`. |
| `organizationUserGetAllBuildingDoors` | callable | n/a (HTTPS callable) | **(inferred)** `{ organizationId, buildingId }` — no formal request-model type found | Lists all doors for a building after validating the building exists. |
| `organizationUserGetBuildingDoorById` | callable | n/a (HTTPS callable) | `OSKBuildingDoorGetRequest`: `buildingId`, `doorId`, `adminsOrganizationId` | Retrieves a single door by ID. Permission-gated on `v1.org.buildings.view`. |
| `deleteBuildingDoor` | callable | n/a (HTTPS callable) | `OSKBuildingDoorDeleteRequest`: `buildingId`, `doorId`, `adminsOrganizationId` | Deletes a door if no ACD remains assigned; cascades revocation of user accesses referencing the door. Permission-gated on `v1.org.buildings.createManager` (**RBAC mismatch**: this string does not appear in `rbac-roles.json`). |
| `onDocumentCreated` | firestore trigger | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` (resolved constant `buildingDoorAccessControlDevicePath`) | n/a (trigger, not callable) | On ACD assignment to a door: denormalizes the device onto the sub-collection, marks the ACD as assigned, generates cryptographic keys, creates the building's intercom entry, and writes an initial ACD config document. |
| `onDocumentDeleted` | firestore trigger | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` (resolved constant `buildingDoorAccessControlDevicePath`) | n/a (trigger, not callable) | On ACD unassignment from a door: deletes the door-scoped public key document, unassigns the device, and deletes its ACD config documents. |

No response schemas were found for any of the five callables in this capability.

---

### building_intercom

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `onUpdateBuildingIntercomsTransferList` | callable | n/a (HTTPS callable) | `OSKIntercomCallTransferListRequest`: `userId`, `unitId`, `buildingId`, `callTransferList` | Replaces/reorders a unit's call-transfer-list; validates all listed users are current unit inhabitants. |
| `updateIntercomDisplayName` | callable | n/a (HTTPS callable) | `OSKBuildingIntercomDisplayNameRequest`: `buildingId`, `unitId`, `newDisplayName` | Manually overrides a unit's auto-generated intercom display name, setting `manuallyChanged`. |
| `deleteIntercomDisplayName` | callable | n/a (HTTPS callable) | `OSKBuildingIntercomEntryDeleteRequest`: `organizationId`, `buildingId`, `entryId` | Deletes a manually-set intercom display name override. Permission-gated on `v1.admin.accessControlDevice.edit` (flagged in the profile as a possible semantic-domain mismatch, though the literal string resolves in RBAC). |

No response schemas were found for any of the three callables. No `firestore_trigger` facts were present as owned directly by this capability in this evidence pack.

---

### building_pincode

No `api_contract` or `firestore_trigger` facts were present for this capability. It exposes only internal controller/service exports (`OSKBuildingPincodeController`, `OSKBuildingPincodeService`) consumed by other capabilities.

---

### building_pincode_trash

No `api_contract` or `firestore_trigger` facts were present for this capability. It exposes only internal controller/service/model exports (`OSKBuildingPincodeTrashController`, an empty `OSKBuildingPincodeTrashService`) consumed elsewhere.

---

### building_settings

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `createBuildingSettings` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingSettingsCreateRequest`: `buildingId`, `buildingSettingsInputParams` | Creates the master settings document for a building, merging caller input with field metadata. Permission-gated on `v1.org.settings.create`. |
| `getResidentSettings` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingGetSettingsRequest`: `buildingId`, `settingsId` | Retrieves a building's settings document. Permission-gated on `v1.org.settings.view`. |
| `updateBuildingSettings` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingUpdateSettingsRequest`: `buildingId`, `update` | Updates the master settings document and fans out the same update to every user's denormalized per-building settings copy. Permission-gated on `v1.org.settings.edit`. |
| `deleteBuildingSettings` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingDeleteOrResetSettingsRequest`: `buildingId`, `settingsId` | Deletes the master settings document and cascades deletion to all users' denormalized copies. Permission-gated on `v1.org.settings.delete`. |
| `resetBuildingSettings` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingDeleteOrResetSettingsRequest`: `buildingId`, `settingsId` | Overwrites the settings document with computed defaults by internally invoking `updateBuildingSettings`. Permission-gated on `v1.org.settings.delete` (noted in profile as using the delete-scoped permission for a reset operation). |

No `requestType`/`responseType` fields were present on the underlying `api_contract` facts for this capability; request mappings above are inferred from `checkParameters` argument names matched against `model_property` facts. No response schemas were found for any of the five callables. No `firestore_trigger` facts were present for this capability.

---

### building_unit

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `organizationUserCreateBuildingUnit` | callable | n/a (HTTPS callable) | `OSKBuildingUnitCreateRequest`: `buildingId`, `name`, `floor`, `unitNumber`, `streetAddress`, `organizationId`, `capacity` | Creates a unit within a building. Permission-gated on `v1.org.buildings.edit`. |
| `organizationUserUpdateBuildingUnit` | callable | n/a (HTTPS callable) | `OSKBuildingUnitUpdateRequest`: `buildingId`, `unitId`, `data`, `organizationId` | Updates a unit's fields. Permission-gated on `v1.org.buildings.edit`. |
| `organizationUserGetAllBuildingUnits` | callable | n/a (HTTPS callable) | **(inferred)** no dedicated request-model type found in evidence | Lists all units for a building. No distinct `v1.org.buildings.list` permission check evidenced despite that role existing in RBAC (flagged as a possible gap). |
| `organizationUserGetBuildingUnitById` | callable | n/a (HTTPS callable) | `OSKBuildingUnitGetRequest`: `buildingId`, `unitId`, `adminsOrganizationId` | Retrieves a single unit by ID. Permission-gated on `v1.org.buildings.view`. |
| `deleteBuildingUnit` | callable | n/a (HTTPS callable) | `OSKBuildingUnitDeleteRequest`: `buildingId`, `unitId`, `adminsOrganizationId` | Deletes a unit after checking its inhabitants (email-notification intent is logged but no send call is evidenced). Permission-gated on `v1.org.buildings.create`. |

No response schemas were found for any of the five callables. `OSKBuildingUnitDoorService.createBuildingUnitDoor` (unit-scoped door creation, with its own full App-Check/auth/RBAC pattern) has no corresponding `api_contract` fact in this evidence pack and is not listed here as a public interface — its exposure mechanism is unconfirmed. No `firestore_trigger` facts were present for this capability.

---

### building_unit_nonAppUser

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `createNonAppUser` | callable | n/a (HTTPS callable) | `OSKAddNonAppUserRequest` — type alias exists; no `model_property` fields evidenced | Creates a non-app-user profile under a unit after validating parent building/unit existence. |
| `getNonAppUser` | callable | n/a (HTTPS callable) | `OSKGetNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId` | Retrieves a single non-app-user profile. |
| `getAllNonAppUsers` | callable | n/a (HTTPS callable) | `OSKGetAllNonAppUsersRequest`: `buildingId`, `unitId` | Lists all non-app-user profiles for a unit. |
| `updateNonAppUser` | callable | n/a (HTTPS callable) | `OSKUpdateNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId`, `dataToUpdate` | Updates fields on a non-app-user document. |
| `deleteNonAppUser` | callable | n/a (HTTPS callable) | `OSKDeleteNonAppUserRequest`: `buildingId`, `unitId`, `nonAppUserId` | Deletes a non-app-user, cascading revocation of all their access grants (and associated pincodes/hardware sync). |
| `createNonAppUserAccess` | callable | n/a (HTTPS callable) | `OSKCreateNonAppUserAccessRequest`: `buildingId`, `unitId`, `nonAppUserId`, `doorIds`, `startDate`, `endDate` | Provisions a new permanent access grant for an existing non-app-user for specified (or all) building doors. |
| `createNonAppUserWithAccess` | callable | n/a (HTTPS callable) | `OSKCreateNonAppUserWithAccessRequest` — only `doorIds` confirmed via `model_property`; other fields (`fullName`, `buildingId`, `unitId`, `inviterId`) observed only as call arguments | One-shot workflow creating a non-app-user, provisioning access, and returning the issued pincode. Response: `OSKCreateNonAppUserwithAccessResponse`: `nonAppUserId`, `accessId`, `pincode`, `fullName`. |
| `updateNonAppUserAccessDoors` | callable | n/a (HTTPS callable) | `OSKUpdateNonAppUserAccessDoorsRequest`: `buildingId`, `unitId`, `nonAppUserId`, `accessId`, `doorIds` | Updates the authorized doors on a specific access grant and syncs the change to the building-level access ledger and physical ACDs. |

No RBAC permission-string evidence was found for any of these eight operations (all apply `OSKUserSecurityChecks({ checkUserIdMatch: false })` plus parameter validation only; authorization appears to rely on an inhabitant-hierarchy check inside `deleteNonAppUser` rather than a `v1.*` permission string). The service method `deleteNonAppUserAccess` (with request model `OSKDeleteNonAppUserAccessRequest`: `buildingId`, `unitId`, `nonAppUserId`, `accessId`) is fully implemented but has **no evidenced callable registration** — not listed as a public interface here. No `firestore_trigger` facts were present for this capability.

---

### building_user

| Name | Type | Path / Binding | Request Schema | Description |
|---|---|---|---|---|
| `createBuildingUser` | callable | n/a (HTTPS callable) | **(inferred)** `OSKBuildingUserCreateRequest`: `organizationId`, `buildingId`, `userId`, `firstName`, `lastName`, `accessRights`, `doors`, `userType` | Creates a building-user association document, provisioning access rights for the target user within the building. Permission-gated on `v1.admin.building.register` and/or `v1.org.buildings.create` (exact boolean relationship between the two not resolved in evidence). |
| `onDocumentDeleted` | firestore trigger | **(inferred)** `/buildings/{buildingId}/users/{userId}` — exact trigger path binding not explicitly confirmed as a literal string in evidence | n/a (trigger, not callable) | On deletion of a building-user document: cascades deletion of the corresponding building-level access ledger entry and all of the user's access-ledger entries. |

No response schema was found for `createBuildingUser`. `OSKBuildingUserUpdateRequest`, `OSKBuildingUserGetRequest`, and `OSKBuildingUserDeleteRequest` models exist in evidence but have no corresponding service methods or `api_contract` facts (no `updateBuildingUser`, `getBuildingUser`, or `deleteBuildingUser` handlers evidenced) — not listed as public interfaces here.