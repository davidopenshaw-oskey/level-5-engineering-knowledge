### 0. Generation Metadata

- runId: 20260803_143350-1aa319b1
- generatedAt: 2026-08-11T16:46:11.865Z
- repoName: firebase-oskey-dev
- targetModule: admin
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

No direct API contracts or Firestore triggers are defined in this root capability itself; it delegates trigger definitions to its submodules. (**Confirmed**; `` `functions/src/modules/admin/index.ts` (lines 20-27) ``).

---

#### admin_buildings

### Callable Functions
- **`getAllBuildingsWithUnits`** [Confirmed] (`api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`)
  - **Request Type**: `OSKGetAllBuildingsWithUnitsRequestData` (No matching `model_property` facts are present in this pack to detail the request fields, but it is imported as the request payload type) [Inferred] (`functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts`, line 16).
  - **Response Type**: `OSKGetAllBuildingsWithUnitsResponseData` [Confirmed]
    - **`units`**: `OSKBuildingUnit[]` [Confirmed] (`functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts`, line 7).

### Firestore Triggers
- None evidenced in this capability pack [Confirmed].

---

#### admin_maintenance

### API Contracts (Callable Functions)
All entry points are Firebase Callable Functions [Confirmed, `functions/src/modules/admin/modules/admin_maintenance/index.ts` (lines 33-84)].

| Function Name | Request Type | Response Type |
| :--- | :--- | :--- |
| `executePincodeRefreshCallable` | `any` | `any` |
| `onFixMissingMainAccessFieldsAll` | `OSKDbRecreateAccess` | `any` |
| `onMaintenanceAddIntercomDisplayNameField` | `any` | `any` |
| `onMaintenanceAddUnitNumberField` | `any` | `any` |
| `onMaintenanceCreateBuildingsIntercomBases` | `any` | `any` |
| `onMaintenanceCreateIntercomsByUsers` | `any` | `any` |
| `onMaintenanceCreateOrganizationsPrompt` | `any` | `any` |
| `onMaintenanceCreateResidents` | `any` | `any` |
| `onMaintenanceCreateResidentSettingsForBuilding` | `any` | `any` |
| `onMaintenanceCreateUnitSettings` | `any` | `any` |
| `onMaintenanceCreateUserSettings` | `any` | `any` |
| `onMaintenanceDeleteBuildingsIntercoms` | `any` | `any` |
| `onMaintenanceDeleteCallTransferLists` | `any` | `any` |
| `onMaintenanceDeleteIntercomDisplayNameField` | `any` | `any` |
| `onMaintenanceDeleteUsersIntercoms` | `any` | `any` |
| `onMaintenanceIntercomAddUnitNumberFields` | `any` | `any` |
| `onMaintenanceLinkBuildingsToProperties` | `any` | `any` |
| `onMaintenanceRecreateAccess` | `OSKDbRecreateAccess` | `any` |
| `onMaintenanceRefreshPincodes` | `OSKDbRefreshPincodes` | `any` |
| `onMaintenanceSyncAuthDisplayNames` | `any` | `any` |
| `onMaintenanceUpdateAccessControlDeviceModel` | `any` | `any` |
| `onMaintenanceUpdateResidentsWithUnitInfo` | `any` | `any` |
| `onRecreateAccessDocumentInMongoDbByBuildingAll` | `OSKDbRecreateAccess` | `any` |
| `onRecreateTokensForBuildingUsersAll` | `OSKDbRecreateAccess` | `any` |
| `onRemoveNonExistingUserAccessInBuildingALL` | `OSKDbRecreateAccess` | `any` |
| `onSyncBuildingAccessesWithUserAccessesAll` | `OSKDbRecreateAccess` | `any` |

### Resolved API Request/Response Schemas
- **`OSKDbRecreateAccess`**
  - `buildingIds`: `string[]`
- **`OSKDbRefreshPincodes`**
  - `buildingId`: `string`

### Firestore Triggers
No Firestore triggers are owned by this capability. [Confirmed]

#### admin_organization

### API Contracts
The capability exposes two HTTPS callable functions:

#### `getAllOrganizations`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``)
- **Request Schema**: `OSKGetAllOrganizationsListRequestDocument`
  - `adminsOskeyId`: `string`
- **Response Schema**: `OSKOrganizationList[]` (Inferred based on service orchestration returning a list of organizations).

#### `getOrganizationDetailsById`
- **Type**: Callable Function [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``)
- **Request Schema**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - `adminsOskeyId`: `string`
  - `OrganizationId`: `string`
- **Response Schema**: `OSKOrganizationList`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from core)
  - `taxNumber`: `string`
  - `userId`: `string`

---

#### admin_users

### Callable Functions
- **`addInhabitantToUnit`**
  - Request Type: `OSKAddInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
    - `unitId`: `string`
  - Response Type: `OSKAddInhabitantFromUnitResponseData`
    - `accessId`: `string | undefined` (optional)
    - `inhabitantId`: `string`
- **`createUserInvitationAccess`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`deleteUserData`**
  - Request Type: `OSKDeleteUserDataRequestData`
    - `accesses`: `boolean`
    - `devices`: `boolean`
    - `invitations`: `boolean`
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getAllUsers`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getInhabitantUserUnits`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserAccessById`**
  - Request Type: `OSKGetUserAccessByIdRequestData`
    - `userAccessId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`getUserById`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: `OSKGetUserByIdResponseData`
    - `devicesCount`: `number`
    - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
    - `invitationsCount`: `number`
    - `userAccessesCount`: `number`
- **`giveInhabitantAccessToUnitInhabitant`**
  - Request Type: `OSKGiveInhabitantAccessRequestData`
    - `buildingId`: `string`
    - `doorIds`: `string[] | undefined` (optional)
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserAccesses`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserDevices`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeAllUserInvitations`**
  - Request Type: No `model_property` facts matched within this pack.
  - Response Type: No `model_property` facts matched within this pack.
- **`removeInhabitantFromUnit`**
  - Request Type: `OSKRemoveInhabitantFromUnitRequestData`
    - `buildingId`: `string`
    - `unitId`: `string`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccessAccesses`**
  - Request Type: `OSKRemoveUserAccessAccessesRequestData`
    - `accessIds`: `string[]`
    - `userAccess`: `OSKUserAccesses`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserAccesses`**
  - Request Type: `OSKRemoveUserAccessesRequestData`
    - `userAccesses`: `OSKUserAccesses[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserDevices`**
  - Request Type: `OSKRemoveUserDevicesRequestData`
    - `deviceIds`: `string[]`
  - Response Type: No `model_property` facts matched within this pack.
- **`removeUserInvitations`**
  - Request Type: `OSKRemoveUserInvitationsRequestData`
    - `invitations`: `OSKUserInvitationToRemove[]`
  - Response Type: No `model_property` facts matched within this pack.

### Firestore Triggers
No Firestore triggers are evidenced within this capability's pack. [Confirmed]