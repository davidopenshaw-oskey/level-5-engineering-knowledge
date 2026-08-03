# API Reference: building

## 0. Generation Metadata
- runId: `20260802_131856-1aa319b1`
- generatedAt: `2026-08-02T14:02:53.228Z`
- repoName: `firebase-oskey-dev`
- targetModule: `building`
- llmConfigKey: `claude-default`
- llmProvider: `anthropic`
- llmModel: `claude-sonnet-5`

---

## 1. API Contracts

*Lookup reference only. Request/response schemas are drawn from the Resolved API Request/Response Schemas join provided at reduce time; where a schema was not present in that join, this is stated explicitly rather than presenting the bare type expression as a schema. Firestore path scope/confidence labels are preserved from the capability outputs where present.*

### Submodule: `_module_root`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `getAllBuildings` | callable | — | `OSKBuildingGetAllRequestData`: `{ organizationId: string }` | Not resolved in evidence — no `model_property` facts matched. | Lists all buildings for an organization (permission-checked). |
| `getBuildingById` | callable | — | `OSKBuildingGetRequest`: `{ buildingId: string; organizationId: string }` | `OSKBuildingDetailsResponseData`: `{ building: OSKBuildingDocument; unitsCount: number; doorsCount: number }` | Fetches a single building with joined unit/door counts. |
| `createOrganizationBuilding` | callable | — | `OSKBuildingCreateRequest`: `{ organizationId: string; propertyId: string; name?: string; imageFilename?: string; streetAddress: OSKStreetAddress }` | Not resolved in evidence. | Creates a building under a property, dual-writing the org-scoped building record and seeding default settings. |
| `updateBuilding` | callable | — | `OSKBuildingUpdateRequest`: `{ buildingId: string; data: Partial<OSKBuilding>; organizationId: string }` | Not resolved in evidence. | Updates a building's mutable fields (name, street address) and propagates changes to units and user accesses. |
| `deleteBuildingImage` | callable | — | `deleteBuildingImageRequest` type exists (`{ buildingId, filename }` per `model_property` facts) but is not present in the Resolved Schemas join for this endpoint — schema not confirmed. | Not resolved in evidence. | Deletes a building's stored image and clears the image field. |
| `assigningBuildingToProperty` | callable | — | `OSKPropertyAssigningBuildingRequestData`: `{ organizationId: string; oldPropertyId?: string; newPropertyId: string; buildingId: string; buildingData: Partial<OSKBuilding> }` | Not resolved in evidence. | Moves a building from one property to another. |
| `getBuildingsByPropertyId` | callable | — | `OSKBuildingGetAllByPropertyRequest`: `{ propertyId: string; organizationId: string; accessControlDeviceType?: OSKAccessControlDeviceType }` | Not resolved in evidence. | Fetches buildings for a property, each assembled with its doors and doors' access control devices. |

*Note: `deleteBuilding` exists as an `OSKBuildingService` method with full precondition/logging logic but has no corresponding `api_contract` fact — not listed here as a callable; see Module Engineering Profile Section 13 for this open question.*

### Submodule: `building_accesses`

No `api_contract` facts present. This capability exposes no HTTP/callable-triggered endpoint in the evidence gathered — its surface (`OSKBuildingAccessesController`, `OSKBuildingAccessService`) is consumed programmatically by other capabilities/modules, not directly by client requests.

### Submodule: `building_activity`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `getActivityById` | callable | — | `OSKGetBuildingActivityByIdRequest`: `{ buildingId: string; doorId: string; activityId: string }` | Not resolved in evidence. | Retrieves a single door-activity record. |
| `getAllBuildingActivities` | callable | — | `OSKGetAllBuildingActivitiesRequest`: `{ buildingId: string; doorId: string }` | Not resolved in evidence. | Lists all activity records for a building's door. |
| `deleteBuildingActivityById` | callable | — | `OSKDeleteBuildingActivityByIdRequest`: `{ buildingId: string; doorId: string; activityId: string }` | Not resolved in evidence. | Deletes a single door-activity record. |
| `deleteAllBuildingActivities` | callable | — | `OSKDeleteAllBuildingActivitiesRequest`: `{ buildingId: string; doorId: string }` | Not resolved in evidence. | Deletes all activity records for a building's door. |

*Note: `ActivityReceivedForBuilding` (service method that persists an enriched activity event) is not itself registered as a callable or trigger in this evidence — not listed as a contract.*

### Submodule: `building_door`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `organizationUserCreateBuildingDoor` | callable | — | `OSKBuildingDoorCreateRequest`: `{ buildingId: string; name: string; streetAddress: OSKStreetAddress; isForAllResidents: boolean; organizationId: string }` | Not resolved in evidence. | Creates a door record for a building. |
| `organizationUserUpdateBuildingDoor` | callable | — | `OSKBuildingDoorUpdateRequest`: `{ buildingId: string; doorId: string; data: Partial<Pick<OSKBuildingDoor, "name" \| "streetAddress">>; organizationId: string }` | Not resolved in evidence. | Updates a door's name/street address and propagates to user access records. |
| `organizationUserGetAllBuildingDoors` | callable | — | Not present in the Resolved Schemas section — schema unknown. | Not resolved in evidence. | Lists all doors for a building. |
| `organizationUserGetBuildingDoorById` | callable | — | Not present in the Resolved Schemas section — schema unknown. | Not resolved in evidence. | Fetches a single door by ID. |
| `deleteBuildingDoor` | callable | — | `OSKBuildingDoorDeleteRequest`: `{ buildingId: string; doorId: string; adminsOrganizationId?: string }` | Not resolved in evidence. | Deletes a door (blocked if ACDs are still assigned), removing it from user accesses. |
| `onDocumentCreated` (ACD assignment) | firestore_trigger (onCreate) | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | n/a (document-write trigger) | n/a | On ACD-to-door assignment: persists ACD config, creates intercom directory entry, marks device assigned, generates ACD key pair. |
| `onDocumentDeleted` (ACD assignment) | firestore_trigger (onDelete) | `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` | n/a (document-write trigger) | n/a | On ACD unassignment: deletes public keys, unassigns device, deletes ACD configs. |

### Submodule: `building_intercom`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `onUpdateBuildingIntercomsTransferList` | callable | — | `OSKIntercomCallTransferListRequest`: `{ userId: string; unitId: string; buildingId: string; callTransferList: OSKUserIntercomCallTransferListItem[] }` | Not resolved in evidence. | Applies an ordered call-transfer-list across all intercoms in a building for a unit. |
| `updateIntercomDisplayName` | callable | — | `OSKBuildingIntercomDisplayNameRequest`: `{ buildingId: string; unitId: string; newDisplayName: string }` | Not resolved in evidence. | Manually overrides an intercom unit-entry's display name. |
| `deleteIntercomDisplayName` | callable | — | `OSKBuildingIntercomEntryDeleteRequest`: `{ organizationId: string; buildingId: string; entryId: string }` | Not resolved in evidence. | Removes an intercom entry entirely (permission-checked). |

### Submodule: `building_pincode`

No `api_contract` facts present. Surface (`OSKBuildingPincodeController`, `OSKBuildingPincodeService`) is consumed programmatically by other capabilities (e.g. `core`'s access-pincode services).

### Submodule: `building_pincode_trash`

No `api_contract` facts present. Surface (`OSKBuildingPincodeTrashController`, `OSKBuildingPincodeTrashService`) is consumed programmatically by other capabilities (e.g. `core`'s access-pincode services).

### Submodule: `building_settings`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `createBuildingSettings` | callable | — | `OSKBuildingSettingsCreateRequest`: `{ buildingId: string; buildingSettingsInputParams: OSKBuildingSettingsInputParams }` | Not resolved in evidence. | Creates a building's settings document (access methods, invitation rules, PIN/quickcode policy). |
| `getResidentSettings` | callable | — | `OSKBuildingGetSettingsRequest`: `{ buildingId: string; settingsId: string }` | Not resolved in evidence. | Retrieves a building's settings document. |
| `updateBuildingSettings` | callable | — | `OSKBuildingUpdateSettingsRequest`: `{ buildingId: string; update: Partial<OSKBuildingSettingsInputParams> }` | Not resolved in evidence. | Updates the settings document and syncs the per-user building-settings projection for every org user. |
| `deleteBuildingSettings` | callable | — | `OSKBuildingDeleteOrResetSettingsRequest`: `{ buildingId: string; settingsId: string }` | Not resolved in evidence. | Deletes the settings document and the per-user building-settings projection. |
| `resetBuildingSettings` | callable | — | `OSKBuildingDeleteOrResetSettingsRequest`: `{ buildingId: string; settingsId: string }` | Not resolved in evidence. | Regenerates default settings and re-runs the update flow (gated by the delete permission). |

*Note: `OSKBuildingGetAllSettingsRequest` (`{ buildingId: string }`) is declared as a type but is not tied to any registered `api_contract` endpoint in evidence — not listed as a live contract.*

### Submodule: `building_unit`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `organizationUserCreateBuildingUnit` | callable | — | `OSKBuildingUnitCreateRequest`: `{ name: string; floor: string; unitNumber: string; streetAddress: OSKStreetAddress; organizationId: string; capacity: string; buildingId: string }` | Not resolved in evidence. | Creates a unit within a building. |
| `organizationUserUpdateBuildingUnit` | callable | — | `OSKBuildingUnitUpdateRequest`: `{ buildingId: string; unitId: string; data: { name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress }; organizationId: string }` | Not resolved in evidence. | Updates a unit's fields. |
| `organizationUserGetAllBuildingUnits` | callable | — | Not present in the Resolved Schemas section — schema unknown. | Not resolved in evidence. | Lists all units for a building. |
| `organizationUserGetBuildingUnitById` | callable | — | Not present in the Resolved Schemas section — schema unknown. | Not resolved in evidence. | Fetches a single unit by ID. |
| `deleteBuildingUnit` | callable | — | `OSKBuildingUnitDeleteRequest`: `{ buildingId: string; unitId: string; adminsOrganizationId?: string }` | Not resolved in evidence. | Deletes a unit after notifying affected inhabitants (log-evidenced intent only). |

*Note: unit-door creation (`OSKBuildingUnitDoorService.createBuildingUnitDoor`) and the unit-inhabitant/unit-invitation/unit-permanent-guest controllers show no distinct `api_contract` facts of their own in this evidence pack beyond the five endpoints above — not listed as separate contracts here.*

### Submodule: `building_unit_nonAppUser`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `createNonAppUser` | callable | — | Not resolved — no `model_property` facts matched a request type in this pack. | Not resolved in evidence. | Creates a Non-App User profile scoped to a unit. |
| `getNonAppUser` | callable | — | `OSKGetNonAppUserRequest`: `{ buildingId: string; unitId: string; nonAppUserId: string }` | Not resolved in evidence. | Fetches a Non-App User profile. |
| `getAllNonAppUsers` | callable | — | `OSKGetAllNonAppUsersRequest`: `{ buildingId: string; unitId: string }` | Not resolved in evidence. | Lists all Non-App Users for a unit. |
| `updateNonAppUser` | callable | — | `OSKUpdateNonAppUserRequest`: `{ buildingId: string; unitId: string; nonAppUserId: string; dataToUpdate: UpdateData<OSKDocument<T>> }` | Not resolved in evidence. | Updates a Non-App User profile. |
| `deleteNonAppUser` | callable | — | `OSKDeleteNonAppUserRequest`: `{ buildingId: string; unitId: string; nonAppUserId: string }` | Not resolved in evidence. | Deletes a Non-App User profile (with access-side-effect cleanup). |
| `createNonAppUserAccess` | callable | — | `OSKCreateNonAppUserAccessRequest`: `{ buildingId: string; unitId: string; nonAppUserId: string; doorIds?: string[]; startDate: Date; endDate: Date }` | Not resolved in evidence. | Adds a permanent door access grant to an existing Non-App User. |
| `createNonAppUserWithAccess` | callable | — | `OSKCreateNonAppUserWithAccessRequest`: only `doorIds?: string[]` resolved via `model_property`; other referenced fields (`buildingId`, `unitId`, `fullName`, `inviterId`) did not resolve in this pack. | `OSKCreateNonAppUserwithAccessResponse`: `{ nonAppUserId: string; accessId: string; pincode: string; fullName: string }` | Creates a Non-App User, an access grant, and a PIN code in one call. |
| `updateNonAppUserAccessDoors` | callable | — | `OSKUpdateNonAppUserAccessDoorsRequest`: `{ buildingId: string; unitId: string; nonAppUserId: string; accessId: string; doorIds?: string[] }` | Not resolved in evidence. | Updates the doors authorized on a Non-App User's access, publishing an ACD update. |

*Note: `deleteNonAppUserAccess` (service method with full security-check wiring) has no corresponding `api_contract`/callable registration in this evidence pack — not listed as a live contract; see Open Questions in the Module Engineering Profile.*

### Submodule: `building_user`

| Name | Type | Binding | Request Schema | Response Schema | Description |
|---|---|---|---|---|---|
| `createBuildingUser` | callable | — | `OSKBuildingUserCreateRequest`: `{ organizationId: string; buildingId: string; userId: string; firstName: string; lastName: string; accessRights: OSKAccessRightWithTimestamp[]; doors: OSKDoorInfo[]; userType: OSKUserAccessType.OrganizationUser \| OSKUserAccessType.OrganizationGuestUser }` | Not resolved in evidence. | Creates a building-scoped user record and provisions access via the central access-provisioning layer. |
| `onDocumentDeleted` (building user) | firestore_trigger (onDelete, inferred) | `/buildings/{buildingId}/users/{userId}` (inferred; trigger registration/wiring code not present in evidence) | n/a (document-delete trigger) | n/a | Cascades cleanup on building-user deletion: removes the building-side access record and all of the user's accesses. |