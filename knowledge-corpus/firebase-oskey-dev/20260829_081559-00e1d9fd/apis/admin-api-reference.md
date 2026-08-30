### 0. Generation Metadata

- runId: 20260829_081559-00e1d9fd
- generatedAt: 2026-08-29T13:32:37.757Z
- repoName: firebase-oskey-dev
- targetModule: admin
- llmConfigKey: gemini-default
- llmProvider: gemini
- llmModel: gemini-3.5-flash
- note: this document required no LLM call -- assembled entirely from capability outputs already on disk.

### 1. API Contracts

#### _module_root

No direct API contracts or Firestore triggers are defined in this root capability [Confirmed]. It delegates trigger definition to its submodules.

---

#### admin_buildings

#### Callable Functions
- **`getAllBuildingsWithUnits`**: Retrieves a nested list of all buildings and their units for a specific organization [Confirmed: `api_contract|admin|functions/src/modules/admin/modules/admin_buildings/index.ts|getAllBuildingsWithUnits|#1`].
  - **Request Type**: `OSKGetAllBuildingsWithUnitsRequestData` (implied by service imports) [Inferred: `functions/src/modules/admin/modules/admin_buildings/services/admin_building.service.ts` (line 16)].
  - **Response Type**: `OSKGetAllBuildingsWithUnitsResponseData` [Confirmed: `type_alias|admin|functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts|OSKGetAllBuildingsWithUnitsResponseData|#1`].

#### Resolved API Request/Response Schemas
```typescript
interface OSKGetAllBuildingsWithUnitsResponseData {
  units: OSKBuildingUnit[];
}

type OSKBuildingUnit = {
  unitId: string;
  unitNumber: string;
  name: string;
};
```

---

#### admin_maintenance

### Callable Cloud Functions
The following callable functions are registered by this capability:

- **onFixMissingMainAccessFieldsAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onFixMissingMainAccessFieldsAll|#1` ``]

- **onMaintenanceRecreateAccess**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceRecreateAccess|#1` ``]

- **onMaintenanceRefreshPincodes**
  - **Request Type**: `OSKDbRefreshPincodes`
    - `buildingId`: `string`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceRefreshPincodes|#1` ``]

- **onRecreateAccessDocumentInMongoDbByBuildingAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRecreateAccessDocumentInMongoDbByBuildingAll|#1` ``]

- **onRecreateTokensForBuildingUsersAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRecreateTokensForBuildingUsersAll|#1` ``]

- **onRemoveNonExistingUserAccessInBuildingALL**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onRemoveNonExistingUserAccessInBuildingALL|#1` ``]

- **onSyncBuildingAccessesWithUserAccessesAll**
  - **Request Type**: `OSKDbRecreateAccess`
    - `buildingIds`: `string[]`
  - **Response Type**: `Promise<any>` (No explicit response schema matched) [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onSyncBuildingAccessesWithUserAccessesAll|#1` ``]

- **executePincodeRefreshCallable**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|executePincodeRefreshCallable|#1` ``]

- **onMaintenanceAddIntercomDisplayNameField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceAddIntercomDisplayNameField|#1` ``]

- **onMaintenanceAddUnitNumberField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceAddUnitNumberField|#1` ``]

- **onMaintenanceCreateBuildingsIntercomBases**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateBuildingsIntercomBases|#1` ``]

- **onMaintenanceCreateIntercomsByUsers**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateIntercomsByUsers|#1` ``]

- **onMaintenanceCreateOrganizationsPrompt**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateOrganizationsPrompt|#1` ``]

- **onMaintenanceCreateResidents**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateResidents|#1` ``]

- **onMaintenanceCreateResidentSettingsForBuilding**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateResidentSettingsForBuilding|#1` ``]

- **onMaintenanceCreateUnitSettings**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateUnitSettings|#1` ``]

- **onMaintenanceCreateUserSettings**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceCreateUserSettings|#1` ``]

- **onMaintenanceDeleteBuildingsIntercoms**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteBuildingsIntercoms|#1` ``]

- **onMaintenanceDeleteCallTransferLists**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteCallTransferLists|#1` ``]

- **onMaintenanceDeleteIntercomDisplayNameField**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteIntercomDisplayNameField|#1` ``]

- **onMaintenanceDeleteUsersIntercoms**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceDeleteUsersIntercoms|#1` ``]

- **onMaintenanceIntercomAddUnitNumberFields**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceIntercomAddUnitNumberFields|#1` ``]

- **onMaintenanceLinkBuildingsToProperties**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceLinkBuildingsToProperties|#1` ``]

- **onMaintenanceSyncAuthDisplayNames**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceSyncAuthDisplayNames|#1` ``]

- **onMaintenanceUpdateAccessControlDeviceModel**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceUpdateAccessControlDeviceModel|#1` ``]

- **onMaintenanceUpdateResidentsWithUnitInfo**
  - **Request Type**: No `model_property` facts matched within this pack.
  - **Response Type**: No `model_property` facts matched within this pack. [Confirmed; `` `api_contract|admin|functions/src/modules/admin/modules/admin_maintenance/index.ts|onMaintenanceUpdateResidentsWithUnitInfo|#1` ``]

---

#### admin_organization

### Callable Functions
- **`getAllOrganizations`** [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getAllOrganizations|#1` ``)
  - **Request Type**: `OSKGetAllOrganizationsListRequestDocument`
  - **Request Schema**:
    ```typescript
    adminsOskeyId: string
    ```
  - **Response Type**: `any` (No explicit response schema matched in this pack)

- **`getOrganizationDetailsById`** [Confirmed] (`` `api_contract|admin|functions/src/modules/admin/modules/admin_organization/index.ts|getOrganizationDetailsById|#1` ``)
  - **Request Type**: `OSKGetOrganizationsDetailsByIdRequestDocument`
  - **Request Schema**:
    ```typescript
    adminsOskeyId: string
    OrganizationId: string
    ```
  - **Response Type**: `OSKOrganizationList`
  - **Response Schema**:
    ```typescript
    name: string
    organizationId: string
    streetAddress: OSKStreetAddress // import("functions/src/modules/core/models/shared/street_address.model").OSKStreetAddress
    taxNumber: string
    userId: string
    ```

### Firestore Triggers
- None evidenced in this capability pack.

#### admin_users

### API Contracts (Callable Functions)

#### `addInhabitantToUnit`
- **Request Type**: `OSKAddInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `inhabitantType`: `OSKBuildingUnitInhabitantType | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `OSKAddInhabitantFromUnitResponseData`
  - `accessId`: `string | undefined` (optional)
  - `inhabitantId`: `string`

#### `deleteUserData`
- **Request Type**: `OSKDeleteUserDataRequestData`
  - `accesses`: `boolean`
  - `devices`: `boolean`
  - `invitations`: `boolean`
- **Response Type**: `void`

#### `getUserAccessById`
- **Request Type**: `OSKGetUserAccessByIdRequestData`
  - `userAccessId`: `string`
- **Response Type**: `void`

#### `getUserById`
- **Request Type**: `void`
- **Response Type**: `OSKGetUserByIdResponseData`
  - `devicesCount`: `number`
  - `inhabitantIn`: `{ buildingsCount: number; unitsCount: number; }`
  - `invitationsCount`: `number`
  - `userAccessesCount`: `number`

#### `giveInhabitantAccessToUnitInhabitant`
- **Request Type**: `OSKGiveInhabitantAccessRequestData`
  - `buildingId`: `string`
  - `doorIds`: `string[] | undefined` (optional)
  - `unitId`: `string`
- **Response Type**: `void`

#### `removeInhabitantFromUnit`
- **Request Type**: `OSKRemoveInhabitantFromUnitRequestData`
  - `buildingId`: `string`
  - `unitId`: `string`
- **Response Type**: `void`

#### `removeUserAccessAccesses`
- **Request Type**: `OSKRemoveUserAccessAccessesRequestData`
  - `accessIds`: `string[]`
  - `userAccess`: `OSKUserAccesses`
- **Response Type**: `void`

#### `removeUserAccesses`
- **Request Type**: `OSKRemoveUserAccessesRequestData`
  - `userAccesses`: `OSKUserAccesses[]`
- **Response Type**: `void`

#### `removeUserDevices`
- **Request Type**: `OSKRemoveUserDevicesRequestData`
  - `deviceIds`: `string[]`
- **Response Type**: `void`

#### `removeUserInvitations`
- **Request Type**: `OSKRemoveUserInvitationsRequestData`
  - `invitations`: `OSKUserInvitationToRemove[]`
- **Response Type**: `void`

*Note: No `model_property` facts matched within this pack for the remaining endpoints (`createUserInvitationAccess`, `getAllUserAccesses`, `getAllUserDevices`, `getAllUserInvitations`, `getAllUsers`, `getInhabitantUserUnits`, `removeAllUserAccesses`, `removeAllUserDevices`, `removeAllUserInvitations`), so request/response schemas are not expanded.*

### Firestore Triggers
No Firestore triggers are defined or owned by this capability. [Confirmed]