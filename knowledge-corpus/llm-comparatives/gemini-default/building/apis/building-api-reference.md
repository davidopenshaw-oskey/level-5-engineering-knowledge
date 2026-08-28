### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T16:39:24.007Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### API Contracts

#### `assigningBuildingToProperty`
- **Request Type**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `createOrganizationBuilding`
- **Request Type**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Type**: `void` (Inferred from handler signature)

#### `deleteBuildingImage`
- **Request Type**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `getAllBuildings`
- **Request Type**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `getBuildingById`
- **Request Type**: `OSKBuildingGetRequest`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Type**: `OSKBuildingDetailsResponseData`
  - `building`: `OSKBuildingDocument`
  - `doorsCount`: `number`
  - `unitsCount`: `number`

#### `getBuildingsByPropertyId`
- **Request Type**: `OSKBuildingGetAllByPropertyRequest`
  - `accessControlDeviceType`: `OSKAccessControlDeviceType | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

#### `updateBuilding`
- **Request Type**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`
- **Response Type**: `void` (Inferred from handler signature)

### Firestore Triggers
- No direct Firestore triggers are declared in this root capability itself; it delegates trigger registration to the `building_door` submodule [Confirmed] (Citation: `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1`).

---

#### building_accesses

- No direct HTTP API contracts (`api_contract` facts) or Firestore triggers are defined in this capability's evidence pack [Confirmed].
- The controller methods (`get`, `getAll`, `save`, `create`, `update`, `deletePerUser`, `deleteAll`, `listDocuments`) are internal/module-level entry points extending `OSKDocumentController` [Inferred] (evidenced by `functions/src/modules/building/modules/building_accesses/controllers/building_accesses.controller.ts` (lines 14-77)).

---

#### building_activity

The capability exposes the following HTTPS callable functions:
- **`deleteAllBuildingActivities`**:
  - Request Type: `OSKDeleteAllBuildingActivitiesRequest`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.deleteAllBuildingActivities` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1` ``
- **`deleteBuildingActivityById`**:
  - Request Type: `OSKDeleteBuildingActivityByIdRequest`
    - `activityId`: `string`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.deleteBuildingActivityById` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1` ``
- **`getActivityById`**:
  - Request Type: `OSKGetBuildingActivityByIdRequest`
    - `activityId`: `string`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.getActivityById` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1` ``
- **`getAllBuildingActivities`**:
  - Request Type: `OSKGetAllBuildingActivitiesRequest`
    - `buildingId`: `string`
    - `doorId`: `string`
  - Handler: `OSKBuildingActivitiesService.getAllBuildingActivities` `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1` ``

*Note: No Firestore triggers are registered or owned by this capability's pack.* [Confirmed]

#### building_door

### Callable Functions
The capability exposes five callable Cloud Functions:

#### `organizationUserGetAllBuildingDoors`
- **Request Type**: `{ organizationId: string, buildingId: string }` [Confirmed; `` `functions/src/modules/building/modules/building_door/services/building_door.service.ts` (lines 35-40) ``]
- **Response Type**: `OSKBuildingDoor[]` [Inferred]

#### `organizationUserGetBuildingDoorById`
- **Request Type**: `OSKBuildingDoorGetRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserCreateBuildingDoor`
- **Request Type**: `OSKBuildingDoorCreateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `organizationUserUpdateBuildingDoor`
- **Request Type**: `OSKBuildingDoorUpdateRequest` [Confirmed]
- **Response Type**: `OSKBuildingDoor` [Inferred]

#### `deleteBuildingDoor`
- **Request Type**: `OSKBuildingDoorDeleteRequest` [Confirmed]
- **Response Type**: `void` [Inferred]

### Firestore Triggers
The capability registers two Firestore triggers on the `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` path:

#### `onDocumentCreated`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 44) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentCreated` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onCreate|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentCreated|#1` ``]

#### `onDocumentDeleted`
- **Trigger Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` [Confirmed; `` `functions/src/modules/building/modules/building_door/index.ts` (line 47) ``]
- **Handler**: `OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted` [Confirmed; `` `call_expression|building|functions/src/modules/building/modules/building_door/index.ts|db             .document(buildingDoorAccessControlDevicePath)             .onDelete|getFirestoreTriggers|OSKBuildingDoorAccessControlDeviceService.onDocumentDeleted|#1` ``]

---

#### building_intercom

This capability exposes the following Callable API contracts:

### Callable Functions

#### `deleteIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomEntryDeleteRequest`
    *   `buildingId`: `string`
    *   `entryId`: `string`
    *   `organizationId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``

#### `onUpdateBuildingIntercomsTransferList`
*   **Request Type**: `OSKIntercomCallTransferListRequest`
    *   `buildingId`: `string`
    *   `callTransferList`: `OSKUserIntercomCallTransferListItem[]`
    *   `unitId`: `string`
    *   `userId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` ``

#### `updateIntercomDisplayName`
*   **Request Type**: `OSKBuildingIntercomDisplayNameRequest`
    *   `buildingId`: `string`
    *   `newDisplayName`: `string`
    *   `unitId`: `string`
*   **Response Type**: `Promise<void>` (Inferred)
*   **Citation**: `` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``

### Firestore Triggers
*   None evidenced in this capability's pack.

---

#### building_pincode

No API contracts (`api_contract` facts) or Firestore triggers are defined within this capability's evidence pack.

**Confidence Tag**: Confirmed

#### building_pincode_trash

No explicit `api_contract` facts or Firestore triggers are evidenced within this capability's pack.

---

#### building_settings

### API Contracts
The following callable functions are exposed by this capability:

- **createBuildingSettings**
  - **Request Schema**: `OSKBuildingSettingsCreateRequest`
    - `buildingId`: `string`
    - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``.

- **deleteBuildingSettings**
  - **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``.

- **getResidentSettings**
  - **Request Schema**: `OSKBuildingGetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<OSKBuildingSettingsDocument>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``.

- **resetBuildingSettings**
  - **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``.

- **updateBuildingSettings**
  - **Request Schema**: `OSKBuildingUpdateSettingsRequest`
    - `buildingId`: `string`
    - `update`: `Partial<OSKBuildingSettingsInputParams>`
  - **Response Schema**: `Promise<void>` (Inferred from handler resolution) **Confirmed** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``.

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. **Confirmed** `` `functions/src/modules/building/modules/building_settings/index.ts` (lines 50-59) ``.

#### building_unit

#### Callable Cloud Functions
The following callable functions are registered as public entry points `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``:
- **`deleteBuildingUnit`**
- **`organizationUserCreateBuildingUnit`**
- **`organizationUserGetAllBuildingUnits`**
- **`organizationUserGetBuildingUnitById`**
- **`organizationUserUpdateBuildingUnit`**

#### Resolved API Request/Response Schemas

##### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`

##### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `@oskey/core`)
  - `unitNumber`: `string`

##### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`

*Note: For `organizationUserGetAllBuildingUnits` and `organizationUserGetBuildingUnitById`, no matching `model_property` facts were resolved in this pack, so their schemas are not detailed here.*

#### Firestore Triggers
No Firestore triggers are defined or owned by this capability; all operations are driven via callable HTTPS functions `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``.

*Confidence Tag: Confirmed*

---

#### building_unit_nonAppUser

This capability exposes several Firebase HTTPS Callable functions:

### Callable Functions
- **`createNonAppUser`**: Creates a new non-app user profile.
  - *Request Schema*: No `model_property` facts matched within this pack to resolve the request schema [Unknown].
- **`createNonAppUserAccess`**: Provisions access rights for an existing non-app user.
  - *Request Schema* (`OSKCreateNonAppUserAccessRequest`):
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `endDate`: `Date`
    - `nonAppUserId`: `string`
    - `startDate`: `Date`
    - `unitId`: `string`
- **`createNonAppUserWithAccess`**: Creates a non-app user and provisions their default access rights and PIN code in a single transaction.
  - *Request Schema* (`OSKCreateNonAppUserWithAccessRequest`):
    - `doorIds`: `string[] | undefined` (optional)
  - *Response Schema* (`OSKCreateNonAppUserwithAccessResponse`):
    - `accessId`: `string`
    - `fullName`: `string`
    - `nonAppUserId`: `string`
    - `pincode`: `string`
- **`deleteNonAppUser`**: Deletes a non-app user profile and revokes all associated access rights and PIN codes.
  - *Request Schema* (`OSKDeleteNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`getAllNonAppUsers`**: Retrieves all non-app users registered in a specific unit.
  - *Request Schema* (`OSKGetAllNonAppUsersRequest`):
    - `buildingId`: `string`
    - `unitId`: `string`
- **`getNonAppUser`**: Retrieves a specific non-app user profile.
  - *Request Schema* (`OSKGetNonAppUserRequest`):
    - `buildingId`: `string`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUser`**: Updates a non-app user's profile details.
  - *Request Schema* (`OSKUpdateNonAppUserRequest`):
    - `buildingId`: `string`
    - `dataToUpdate`: `UpdateData<OSKDocument<T>>`
    - `nonAppUserId`: `string`
    - `unitId`: `string`
- **`updateNonAppUserAccessDoors`**: Updates the authorized doors for a non-app user's access rights.
  - *Request Schema* (`OSKUpdateNonAppUserAccessDoorsRequest`):
    - `accessId`: `string`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `nonAppUserId`: `string`
    - `unitId`: `string`

#### building_user

#### Callable API Contracts
*   **`createBuildingUser`** [Confirmed] (`api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1`)
    *   **Request Schema**: `OSKBuildingUserCreateRequest`
        *   `accessRights`: `import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[]`
        *   `buildingId`: `string`
        *   `doors`: `import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[]`
        *   `firstName`: `string`
        *   `lastName`: `string`
        *   `organizationId`: `string`
        *   `userId`: `string`
        *   `userType`: `import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser`
    *   **Response Schema**: No matching `model_property` facts were found in this pack for the response type of this endpoint [Unknown].

#### Firestore Triggers
*   **`onDocumentDeleted`**: Triggered when a document in the `/buildings/{buildingId}/users/{userId}` collection is deleted [Confirmed] (`functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301)).

---