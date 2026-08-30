### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:34:01.170Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### Callable API Contracts
The following callable API contracts are exposed by this capability:

#### `assigningBuildingToProperty`
- **Request Type**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`

#### `createOrganizationBuilding`
- **Request Type**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`

#### `getAllBuildings`
- **Request Type**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`

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

#### `updateBuilding`
- **Request Type**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`

#### `deleteBuildingImage`
- **Request Type**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`

### Firestore Triggers
The root capability does not define direct Firestore triggers on the `/buildings` collection itself, but it orchestrates and registers triggers owned by its submodules (such as `building_door` and `building_activity`) during initialization `` `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1` ``.

#### building_accesses

- **API Contracts**: No explicit `api_contract` facts are present in this capability's evidence scope.
- **Firestore Triggers**: No Firestore triggers are defined within this capability's evidence scope.

---

#### building_activity

### API Contracts (Callable Functions)

#### `deleteAllBuildingActivities`
- **Request Type**: `OSKDeleteAllBuildingActivitiesRequest` [Confirmed]
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Standard HTTPS response [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 103-114)

#### `deleteBuildingActivityById`
- **Request Type**: `OSKDeleteBuildingActivityByIdRequest` [Confirmed]
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Standard HTTPS response [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 90-102)

#### `getActivityById`
- **Request Type**: `OSKGetBuildingActivityByIdRequest` [Confirmed]
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument` [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 59-76)

#### `getAllBuildingActivities`
- **Request Type**: `OSKGetAllBuildingActivitiesRequest` [Confirmed]
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Array of `OSKBuildingActivityDocument` [Inferred] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 77-89)

### Firestore Triggers
- No Firestore triggers are owned or declared by this capability [Confirmed] (`functions/src/modules/building/modules/building_activity/index.ts`, lines 38-46).

---

#### building_door

### Callable API Contracts

#### `deleteBuildingDoor`
- **Request Type**: `OSKBuildingDoorDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: Not explicitly defined in resolved schemas (returns void or status).
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 199-255)

#### `organizationUserCreateBuildingDoor`
- **Request Type**: `OSKBuildingDoorCreateRequest`
  - `buildingId`: `string`
  - `isForAllResidents`: `boolean`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Type**: Not explicitly defined in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 94-145)

#### `organizationUserUpdateBuildingDoor`
- **Request Type**: `OSKBuildingDoorUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<Pick<OSKBuildingDoor, "name" | "streetAddress">>`
  - `doorId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not explicitly defined in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 147-197)

#### `organizationUserGetAllBuildingDoors`
- **Request Type**: Not listed in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 35-54)

#### `organizationUserGetBuildingDoorById`
- **Request Type**: Not listed in resolved schemas.
- **Handler Location**: `functions/src/modules/building/modules/building_door/index.ts` (lines 56-93)

---

### Firestore Triggers

- **`onDocumentCreated`**: Triggered when a document is created at `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``.
- **`onDocumentDeleted`**: Triggered when a document is deleted at `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}` `` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``.

---

#### building_intercom

### Callable Functions
- **deleteIntercomDisplayName** (Request: `OSKBuildingIntercomEntryDeleteRequest`)
  - `buildingId`: `string`
  - `entryId`: `string`
  - `organizationId`: `string`
- **onUpdateBuildingIntercomsTransferList** (Request: `OSKIntercomCallTransferListRequest`)
  - `buildingId`: `string`
  - `callTransferList`: `OSKUserIntercomCallTransferListItem[]`
  - `unitId`: `string`
  - `userId`: `string`
- **updateIntercomDisplayName** (Request: `OSKBuildingIntercomDisplayNameRequest`)
  - `buildingId`: `string`
  - `newDisplayName`: `string`
  - `unitId`: `string`

### Firestore Triggers
- None evidenced in this capability pack. [Confirmed]

#### building_pincode

No API contracts (`api_contract` facts) or Firestore triggers are evidenced within this capability's pack [Confirmed].

---

#### building_pincode_trash

- No external HTTP API contracts (`api_contract` facts) or Firestore triggers are directly evidenced as owned by this capability's pack (**Confirmed**).

---

#### building_settings

#### Callable APIs
- **createBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingSettingsCreateRequest`
    - `buildingId`: `string`
    - `buildingSettingsInputParams`: `import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams`
- **deleteBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **getResidentSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``
  - **Request Type**: `OSKBuildingGetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **resetBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingDeleteOrResetSettingsRequest`
    - `buildingId`: `string`
    - `settingsId`: `string`
- **updateBuildingSettings** `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``
  - **Request Type**: `OSKBuildingUpdateSettingsRequest`
    - `buildingId`: `string`
    - `update`: `Partial<import("functions/src/modules/building/modules/building_settings/models/documents/building_settings.model").OSKBuildingSettingsInputParams>`

No Firestore triggers are evidenced in this capability's pack. [Confirmed]

---

#### building_unit

### API Contracts (Callable Functions)

#### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|deleteBuildingUnit|#1` ``.

#### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress`
  - `unitNumber`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserCreateBuildingUnit|#1` ``.

#### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserUpdateBuildingUnit|#1` ``.

#### `organizationUserGetAllBuildingUnits`
- **Request Type**: Not listed in resolved schemas. [Unknown]
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserGetAllBuildingUnits|#1` ``.

#### `organizationUserGetBuildingUnitById`
- **Request Type**: Not listed in resolved schemas. [Unknown]
- *Citations*: `` `api_contract|building|functions/src/modules/building/modules/building_unit/index.ts|organizationUserGetBuildingUnitById|#1` ``.

### Firestore Triggers
- **`nonAppUserTriggers.getCallableFunctionTriggers`**: Registers callable triggers for non-app users. [Confirmed]
- *Citations*: `` `functions/src/modules/building/modules/building_unit/index.ts` (line 70) ``.

#### building_unit_nonAppUser

- **Request Schema**: `OSKDeleteNonAppUserRequest`
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **Response Schema**: `void` (Inferred).

#### building_user

### Callable API Contracts

#### `createBuildingUser`
- **Request Type**: `OSKBuildingUserCreateRequest` [Confirmed, `` `api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1` ``]
- **Request Schema**:
  ```typescript
  {
    accessRights: import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[];
    buildingId: string;
    doors: import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[];
    firstName: string;
    lastName: string;
    organizationId: string;
    userId: string;
    userType: import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser;
  }
  ```
- **Response Type**: No response schema matched within this pack [Confirmed].

### Firestore Triggers

#### `onDocumentDeleted`
- **Trigger Source**: Deletion of a document in `/buildings/{buildingId}/users/{userId}` [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 290-301) ``].
- **Action**: Calls `OSKBuildingAccessesController.deletePerUser` and `OSKUserAccessesController.deleteAllUserAccesses` to clean up access records [Confirmed, `` `functions/src/modules/building/modules/building_user/services/building_user.service.ts` (lines 297-300) ``].

---