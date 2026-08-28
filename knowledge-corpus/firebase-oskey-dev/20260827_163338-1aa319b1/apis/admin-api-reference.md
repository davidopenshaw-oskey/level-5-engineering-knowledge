### 0. Generation Metadata

- runId: 20260827_163338-1aa319b1
- generatedAt: 2026-08-27T16:49:36.167Z
- repoName: firebase-oskey-dev
- targetModule: admin
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

No direct API contracts (`api_contract` facts) or Firestore triggers are owned or declared within this root capability's evidence scope [Confirmed].

#### admin_buildings

This capability exposes one HTTPS callable API contract:

### `getAllBuildingsWithUnits`
- **Type**: Callable Function [Confirmed: `` `api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1` ``]
- **Request Schema**: `OSKGetAllBuildingsWithUnitsRequestData` (imported from `./models/functions/get_all_buildings_with_units_request.type`) [Confirmed: `functions/src/modules/admin/modules/admin_buildings/index.ts` (line 12)]
- **Response Schema**: `OSKGetAllBuildingsWithUnitsResponseData`
  - **Properties**:
    - `units`: `OSKBuildingUnit[]` [Confirmed: Resolved API Request/Response Schemas]

---

#### admin_maintenance

### API Contracts (Callable Functions)

The following callable functions are registered by this capability. Request schemas are defined below where matching `model_property` facts exist.

| Endpoint Name | Request Type | Response Type |
| :--- | :--- | :--- |
| `executePincodeRefreshCallable` | *Not specified in schemas* | *Not specified in schemas* |
| `onFixMissingMainAccessFieldsAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onMaintenanceAddIntercomDisplayNameField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceAddUnitNumberField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateBuildingsIntercomBases` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateIntercomsByUsers` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateOrganizationsPrompt` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateResidents` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateResidentSettingsForBuilding` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateUnitSettings` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceCreateUserSettings` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteBuildingsIntercoms` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteCallTransferLists` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteIntercomDisplayNameField` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceDeleteUsersIntercoms` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceIntercomAddUnitNumberFields` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceLinkBuildingsToProperties` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceRecreateAccess` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onMaintenanceRefreshPincodes` | `OSKDbRefreshPincodes` | *Not specified in schemas* |
| `onMaintenanceSyncAuthDisplayNames` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceUpdateAccessControlDeviceModel` | *Not specified in schemas* | *Not specified in schemas* |
| `onMaintenanceUpdateResidentsWithUnitInfo` | *Not specified in schemas* | *Not specified in schemas* |
| `onRecreateAccessDocumentInMongoDbByBuildingAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onRecreateTokensForBuildingUsersAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onRemoveNonExistingUserAccessInBuildingALL` | `OSKDbRecreateAccess` | *Not specified in schemas* |
| `onSyncBuildingAccessesWithUserAccessesAll` | `OSKDbRecreateAccess` | *Not specified in schemas* |

### Resolved API Request/Response Schemas

#### `OSKDbRecreateAccess`
- **`buildingIds`**: `string[]`

#### `OSKDbRefreshPincodes`
- **`buildingId`**: `string`

---

#### admin_organization

### API Contracts (Callable Functions)

#### `getAllOrganizations`
- **Request Type**: `OSKGetAllOrganizationsListRequestDocument`
  - `adminsOskeyId`: `string`
- **Response Type**: `any` (Returns an array of organization documents)

#### `getOrganizationDetailsById`
- **Request Type**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - `adminsOskeyId`: `string`
  - `OrganizationId`: `string`
- **Response Type**: `OSKOrganizationList`
  - `name`: `string`
  - `organizationId`: `string`
  - `streetAddress`: `OSKStreetAddress` (imported from `@oskey/core`)
  - `taxNumber`: `string`
  - `userId`: `string`

### Firestore Triggers
No Firestore triggers are defined or owned by this capability.

---

#### admin_users

The following are the callable API contracts exposed by the `admin_users` capability, along with their request and response schemas:

### `addInhabitantToUnit` [Confirmed]
- **Request Type**: `OSKAddInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `OSKAddInhabitantFromUnitResponseData`
  - `accessId`: `string | undefined` (optional)
  - `inhabitantId`: `string`

### `createUserInvitationAccess` [Confirmed]
- **Request Type**: `OSKCreateInvitationAccessRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `deleteUserData` [Confirmed]
- **Request Type**: `OSKDeleteUserDataRequestData`
  - `accesses`: `boolean`
  - `devices`: `boolean`
  - `invitations`: `boolean`
- **Response Type**: *None*

### `getAllUserAccesses` [Confirmed]
- **Request Type**: `OSKGetAllUserAccessesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUserDevices` [Confirmed]
- **Request Type**: `OSKGetUserDevicesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUserInvitations` [Confirmed]
- **Request Type**: `OSKGetAllUserInvitationsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getAllUsers` [Confirmed]
- **Request Type**: `OSKGetAllUsersRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getInhabitantUserUnits` [Confirmed]
- **Request Type**: `OSKGetInhabitantUserUnitsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `getUserAccessById` [Confirmed]
- **Request Type**: `OSKGetUserAccessByIdRequestData`
  - `userAccessId`: `string`
- **Response Type**: *None*

### `getUserById` [Confirmed]
- **Request Type**: `OSKGetUserByIdRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: `OSKGetUserByIdResponseData`
  - `devicesCount`: `number`
  - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
  - `invitationsCount`: `number`
  - `userAccessesCount`: `number`

### `giveInhabitantAccessToUnitInhabitant` [Confirmed]
- **Request Type**: `OSKGiveInhabitantAccessRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: *None*

### `removeAllUserAccesses` [Confirmed]
- **Request Type**: `OSKRemoveAllUserAccessesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeAllUserDevices` [Confirmed]
- **Request Type**: `OSKRemoveAllUSerDevicesRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeAllUserInvitations` [Confirmed]
- **Request Type**: `OSKRemoveAllUserInvitationsRequestData`
  - *Note: No model properties matched within this pack.*
- **Response Type**: *None*

### `removeInhabitantFromUnit` [Confirmed]
- **Request Type**: `OSKRemoveInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: *None*

### `removeUserAccessAccesses` [Confirmed]
- **Request Type**: `OSKRemoveUserAccessAccessesRequestData`
  - `accessIds`: `string[]`
  - `userAccess`: `OSKUserAccesses`
- **Response Type**: *None*

### `removeUserAccesses` [Confirmed]
- **Request Type**: `OSKRemoveUserAccessesRequestData`
  - `userAccesses`: `OSKUserAccesses[]`
- **Response Type**: *None*

### `removeUserDevices` [Confirmed]
- **Request Type**: `OSKRemoveUserDevicesRequestData`
  - `deviceIds`: `string[]`
- **Response Type**: *None*

### `removeUserInvitations` [Confirmed]
- **Request Type**: `OSKRemoveUserInvitationsRequestData`
  - `invitations`: `OSKUserInvitationToRemove[]`
- **Response Type**: *None*