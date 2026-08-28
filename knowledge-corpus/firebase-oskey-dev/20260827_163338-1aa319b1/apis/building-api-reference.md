### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-28T07:48:09.669Z
- repoName: firebase-oskey-dev
- targetModule: building
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

### API Contracts
The following HTTPS callable functions are exposed by this capability:

#### `assigningBuildingToProperty`
- **Request Schema**: `OSKPropertyAssigningBuildingRequestData`
  - `buildingData`: `Partial<OSKBuilding>`
  - `buildingId`: `string`
  - `newPropertyId`: `string`
  - `oldPropertyId`: `string | undefined` (optional)
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `createOrganizationBuilding`
- **Request Schema**: `OSKBuildingCreateRequest`
  - `imageFilename`: `string | undefined` (optional)
  - `name`: `string | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
  - `streetAddress`: `OSKStreetAddress`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `deleteBuildingImage`
- **Request Schema**: `deleteBuildingImageRequest`
  - `buildingId`: `string`
  - `filename`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `getAllBuildings`
- **Request Schema**: `OSKBuildingGetAllRequestData`
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `getBuildingById`
- **Request Schema**: `OSKBuildingGetRequest`
  - `buildingId`: `string`
  - `organizationId`: `string`
- **Response Schema**: `OSKBuildingDetailsResponseData`
  - `building`: `OSKBuildingDocument`
  - `doorsCount`: `number`
  - `unitsCount`: `number`

#### `getBuildingsByPropertyId`
- **Request Schema**: `OSKBuildingGetAllByPropertyRequest`
  - `accessControlDeviceType`: `OSKAccessControlDeviceType | undefined` (optional)
  - `organizationId`: `string`
  - `propertyId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

#### `updateBuilding`
- **Request Schema**: `OSKBuildingUpdateRequest`
  - `buildingId`: `string`
  - `data`: `Partial<OSKBuilding>`
  - `organizationId`: `string`
- **Response Schema**: Not explicitly defined in matching model properties (bare response).

### Firestore Triggers
- **getFirestoreTriggers**: Registers Firestore triggers for building doors. (**Confirmed** - `` `call_expression|building|functions/src/modules/building/index.ts|buildingDoorTriggers.getFirestoreTriggers|getFirestoreTriggers|functionBuilder|#1` ``)

#### building_accesses

- **API Contracts**: No `api_contract` facts are present in this capability's pack.
- **Firestore Triggers**: No Firestore triggers are defined in this capability's pack.

**Confidence: Confirmed**

---

#### building_activity

### API Contracts (Callable Functions)

#### `getActivityById`
- **Request Type**: `OSKGetBuildingActivityByIdRequest`
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getActivityById|#1` ``

#### `getAllBuildingActivities`
- **Request Type**: `OSKGetAllBuildingActivitiesRequest`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `OSKBuildingActivityDocument[]` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|getAllBuildingActivities|#1` ``

#### `deleteBuildingActivityById`
- **Request Type**: `OSKDeleteBuildingActivityByIdRequest`
  - `activityId`: `string`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `void` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteBuildingActivityById|#1` ``

#### `deleteAllBuildingActivities`
- **Request Type**: `OSKDeleteAllBuildingActivitiesRequest`
  - `buildingId`: `string`
  - `doorId`: `string`
- **Response Type**: `void` (Inferred)
- **Citations**: `` `api_contract|building|functions/src/modules/building/modules/building_activity/index.ts|deleteAllBuildingActivities|#1` ``

### Firestore Triggers
- None evidenced in this capability's pack.

---

#### building_door

### API Request/Response Schemas
- **deleteBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|deleteBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorDeleteRequest`
    - `adminsOrganizationId`: `string | undefined` (optional)
    - `buildingId`: `string`
    - `doorId`: `string`
- **organizationUserCreateBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserCreateBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorCreateRequest`
    - `buildingId`: `string`
    - `isForAllResidents`: `boolean`
    - `name`: `string`
    - `organizationId`: `string`
    - `streetAddress`: `OSKStreetAddress`
- **organizationUserUpdateBuildingDoor** (Callable) [Confirmed] (`` `api_contract|building|functions/src/modules/building/modules/building_door/index.ts|organizationUserUpdateBuildingDoor|#1` ``)
  - **Request Type**: `OSKBuildingDoorUpdateRequest`
    - `buildingId`: `string`
    - `data`: `Partial<Pick<OSKBuildingDoor, "name" | "streetAddress">>`
    - `doorId`: `string`
    - `organizationId`: `string`

### Firestore Triggers
- **onDocumentCreated** [Confirmed] (`` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentCreated|#1` ``)
  - **Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`
- **onDocumentDeleted** [Confirmed] (`` `firestore_trigger|building|functions/src/modules/building/modules/building_door/index.ts|unknown|onDocumentDeleted|#1` ``)
  - **Path**: `/buildings/{buildingId}/doors/{doorId}/accessControlDevices/{deviceId}`

#### building_intercom

### Callable Functions

#### `deleteIntercomDisplayName`
- **Request Type**: `OSKBuildingIntercomEntryDeleteRequest` [Confirmed]
  - `buildingId`: `string`
  - `entryId`: `string`
  - `organizationId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|deleteIntercomDisplayName|#1` ``).

#### `onUpdateBuildingIntercomsTransferList`
- **Request Type**: `OSKIntercomCallTransferListRequest` [Confirmed]
  - `buildingId`: `string`
  - `callTransferList`: `OSKUserIntercomCallTransferListItem[]` (imported from `user_intercoms`)
  - `unitId`: `string`
  - `userId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|onUpdateBuildingIntercomsTransferList|#1` ``).

#### `updateIntercomDisplayName`
- **Request Type**: `OSKBuildingIntercomDisplayNameRequest` [Confirmed]
  - `buildingId`: `string`
  - `newDisplayName`: `string`
  - `unitId`: `string`
- **Response Type**: Not listed in resolved schemas [Unknown].
- **Citations**: (`` `api_contract|building|functions/src/modules/building/modules/building_intercom/index.ts|updateIntercomDisplayName|#1` ``).

### Firestore Triggers
- None evidenced in this capability pack [Confirmed].

---

#### building_pincode

No API contracts or Firestore triggers are evidenced within this capability's pack.

---

#### building_pincode_trash

No API contracts (`api_contract` facts) or Firestore triggers are directly evidenced in this capability's pack [Confirmed].

---

#### building_settings

### API Contracts

The capability exposes five HTTPS callable Cloud Functions:

#### `createBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|createBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingSettingsCreateRequest`
  - `buildingId`: `string`
  - `buildingSettingsInputParams`: `OSKBuildingSettingsInputParams`
- **Response Schema**: `Promise<void>` (Inferred)

#### `deleteBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|deleteBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<void>` (Inferred)

#### `getResidentSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|getResidentSettings|#1` ``
- **Request Schema**: `OSKBuildingGetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<OSKBuildingSettingsDocument>` (Inferred)

#### `resetBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|resetBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingDeleteOrResetSettingsRequest`
  - `buildingId`: `string`
  - `settingsId`: `string`
- **Response Schema**: `Promise<void>` (Inferred)

#### `updateBuildingSettings`
- **Type**: Callable `` `api_contract|building|functions/src/modules/building/modules/building_settings/index.ts|updateBuildingSettings|#1` ``
- **Request Schema**: `OSKBuildingUpdateSettingsRequest`
  - `buildingId`: `string`
  - `update`: `Partial<OSKBuildingSettingsInputParams>`
- **Response Schema**: `Promise<void>` (Inferred)

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]

#### building_unit

### API Contracts (Callable Functions)
The following callable functions are registered as entry points for this capability `` `functions/src/modules/building/modules/building_unit/index.ts` (lines 67-77) ``:

#### `deleteBuildingUnit`
- **Request Type**: `OSKBuildingUnitDeleteRequest`
  - `adminsOrganizationId`: `string | undefined` (optional)
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserCreateBuildingUnit`
- **Request Type**: `OSKBuildingUnitCreateRequest`
  - `buildingId`: `string`
  - `capacity`: `string`
  - `floor`: `string`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `core` module)
  - `unitNumber`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserUpdateBuildingUnit`
- **Request Type**: `OSKBuildingUnitUpdateRequest`
  - `buildingId`: `string`
  - `data`: `{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress; }`
  - `organizationId`: `string`
  - `unitId`: `string`
- **Response Type**: `void` (evidenced by handler resolution)

#### `organizationUserGetAllBuildingUnits`
- **Request Type**: `OSKBuildingUnitGetRequest` (Inferred from service method signature)
- **Response Type**: `OSKBuildingUnit[]` (Inferred from service method signature)

#### `organizationUserGetBuildingUnitById`
- **Request Type**: `OSKBuildingUnitGetRequest` (Inferred from service method signature)
- **Response Type**: `OSKBuildingUnit` (Inferred from service method signature)

### Firestore Triggers
No Firestore triggers are registered directly within this capability's entry point `` `functions/src/modules/building/modules/building_unit/index.ts` ``. [Confirmed]

#### building_unit_nonAppUser

The following callable API contracts are exposed by this capability `` `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/index.ts` (lines 48-60) ``:
- `createNonAppUser`
- `createNonAppUserAccess`
- `createNonAppUserWithAccess`
- `deleteNonAppUser`
- `getAllNonAppUsers`
- `getNonAppUser`
- `updateNonAppUser`
- `updateNonAppUserAccessDoors`

### Resolved API Request/Response Schemas
- **createNonAppUserAccess** (Request: `OSKCreateNonAppUserAccessRequest`)
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `endDate`: `Date`
  - `nonAppUserId`: `string`
  - `startDate`: `Date`
  - `unitId`: `string`
- **createNonAppUserWithAccess** (Request: `OSKCreateNonAppUserWithAccessRequest`, Response: `OSKCreateNonAppUserwithAccessResponse`)
  - Request:
    - `doorIds`: `string[] | undefined` (optional)
  - Response:
    - `accessId`: `string`
    - `fullName`: `string`
    - `nonAppUserId`: `string`
    - `pincode`: `string`
- **deleteNonAppUser** (Request: `OSKDeleteNonAppUserRequest`)
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **getAllNonAppUsers** (Request: `OSKGetAllNonAppUsersRequest`)
  - `buildingId`: `string`
  - `unitId`: `string`
- **getNonAppUser** (Request: `OSKGetNonAppUserRequest`)
  - `buildingId`: `string`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **updateNonAppUser** (Request: `OSKUpdateNonAppUserRequest`)
  - `buildingId`: `string`
  - `dataToUpdate`: `UpdateData<OSKDocument<T>>`
  - `nonAppUserId`: `string`
  - `unitId`: `string`
- **updateNonAppUserAccessDoors** (Request: `OSKUpdateNonAppUserAccessDoorsRequest`)
  - `accessId`: `string`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `nonAppUserId`: `string`
  - `unitId`: `string`

---

#### building_user

### API Contracts
- **`createBuildingUser` (Callable Function)**: (Confirmed, `` `api_contract|building|functions/src/modules/building/modules/building_user/index.ts|createBuildingUser|#1` ``)
  - **Request Type**: `OSKBuildingUserCreateRequest`
  - **Response Type**: Unknown (Not explicitly detailed in the schema map)

```typescript
functions/src/modules/building/modules/building_user/index.ts :: createBuildingUser :: requestType :: OSKBuildingUserCreateRequest
	accessRights	import("functions/src/modules/core/modules/access/models/access_right.model").OSKAccessRightWithTimestamp[]
	buildingId	string
	doors	import("functions/src/modules/core/models/shared/door_info.model").OSKDoorInfo[]
	firstName	string
	lastName	string
	organizationId	string
	userId	string
	userType	import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationUser | import("functions/src/modules/user/modules/user_access/models/documents/user_accesses_document.model").OSKUserAccessType.OrganizationGuestUser
```

### Firestore Triggers
- **`onDocumentDeleted`**: Triggered on document deletion of a building user. (Inferred, `` `service_method|building|functions/src/modules/building/modules/building_user/services/building_user.service.ts|OSKBuildingUserService|onDocumentDeleted|#1` ``)