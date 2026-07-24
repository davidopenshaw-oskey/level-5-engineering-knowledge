<!-- © Oskey SAS. All rights reserved. -->

# Module API Reference: admin

*© Oskey SAS. All rights reserved.*

---

## Metadata

| Property | Value |
| :--- | :--- |
| **Module** | `admin` |
| **Repository** | `firebase-oskey-dev` |
| **Run ID** | `20260724_152118-1aa319b1` |
| **Exported Callables** | 48 |
| **Type Aliases / Enums** | 43 |
| **Generated Date** | 2026-07-24 |
| **Classification** | Level 5 Engineering Knowledge Corpus Artefact |
| **Status** | Completed & Grounded |

---

## 1. Executive API Summary

This document contains the verified API contracts, exported Cloud Function callables, request/response models, and data types for the `admin` module.

---

## 2. HTTPS Callable Functions (48 Endpoints)

### `getAllBuildingsWithUnits`

- **Request Type**: `OSKWithAdminOrganizationId`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_buildings/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminOrganizationId` | `string` | No |

### `onMaintenanceDeleteUsersIntercoms`

- **Request Type**: `{ userIds?: string[] }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userIds` | `string[] | undefined` | No |

### `onMaintenanceDeleteBuildingsIntercoms`

- **Request Type**: `{ buildingIds?: string[] }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[] | undefined` | No |

### `onMaintenanceDeleteCallTransferLists`

- **Request Type**: `{
            callTransferListIdsByBuildings?: callTransferListIdsByBuilding[];
        }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `callTransferListIdsByBuildings` | `callTransferListIdsByBuilding[] | undefined` | No |

### `onMaintenanceCreateBuildingsIntercomBases`

- **Request Type**: `{ buildingIds?: string[] }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[] | undefined` | No |

### `onMaintenanceUpdateAccessControlDeviceModel`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceCreateIntercomsByUsers`

- **Request Type**: `{ buildingIds?: string[] }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[] | undefined` | No |

### `onMaintenanceCreateResidents`

- **Request Type**: `{ organizationIds?: string[] }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationIds` | `string[] | undefined` | No |

### `onMaintenanceUpdateResidentsWithUnitInfo`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceCreateResidentSettingsForBuilding`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceCreateUnitSettings`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceAddIntercomDisplayNameField`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceAddUnitNumberField`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceCreateUserSettings`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceLinkBuildingsToProperties`

- **Request Type**: `void`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceSyncAuthDisplayNames`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceDeleteIntercomDisplayNameField`

- **Request Type**: `object`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

### `onMaintenanceRecreateAccess`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onRemoveNonExistingUserAccessInBuildingALL`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onSyncBuildingAccessesWithUserAccessesAll`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onFixMissingMainAccessFieldsAll`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onRecreateTokensForBuildingUsersAll`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onRecreateAccessDocumentInMongoDbByBuildingAll`

- **Request Type**: `OSKDbRecreateAccess`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingIds` | `string[]` | No |

### `onMaintenanceRefreshPincodes`

- **Request Type**: `OSKDbRefreshPincodes`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingId` | `string` | No |

### `onMaintenanceIntercomAddUnitNumberFields`

- **Request Type**: `{ buildingId: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingId` | `string` | No |

### `onMaintenanceCreateOrganizationsPrompt`

- **Request Type**: `{ organizationId: string }`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `organizationId` | `string` | No |

### `executePincodeRefreshCallable`

- **Request Type**: `OSKPincodeRefreshTaskPayload`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_maintenance/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `userId` | `string` | No |
| `accessId` | `string` | No |
| `oldPincode` | `string` | No |
| `isAppUser` | `boolean` | No |

### `getAllOrganizations`

- **Request Type**: `OSKGetAllOrganizationsListRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOskeyId` | `string` | No |

### `getOrganizationDetailsById`

- **Request Type**: `OSKGetOrganizationsDetailsByIdRequestDocument`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_organization/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminsOskeyId` | `string` | No |
| `OrganizationId` | `string` | No |

### `getAllUsers`

- **Request Type**: `OSKGetAllUsersRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminOrganizationId` | `string` | No |

### `getUserById`

- **Request Type**: `OSKGetUserByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `deleteUserData`

- **Request Type**: `OSKDeleteUserDataRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `invitations` | `boolean` | No |
| `devices` | `boolean` | No |
| `accesses` | `boolean` | No |

### `giveInhabitantAccessToUnitInhabitant`

- **Request Type**: `OSKGiveInhabitantAccessRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `doorIds` | `string[] | undefined` | No |

### `getInhabitantUserUnits`

- **Request Type**: `OSKGetInhabitantUserUnitsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `removeInhabitantFromUnit`

- **Request Type**: `OSKRemoveInhabitantFromUnitRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |

### `addInhabitantToUnit`

- **Request Type**: `OSKAddInhabitantFromUnitRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `buildingId` | `string` | No |
| `unitId` | `string` | No |
| `inhabitantType` | `OSKBuildingUnitInhabitantType | undefined` | No |
| `doorIds` | `string[] | undefined` | No |

### `getAllUserDevices`

- **Request Type**: `OSKGetUserDevicesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `removeUserDevices`

- **Request Type**: `OSKRemoveUserDevicesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `deviceIds` | `string[]` | No |

### `removeAllUserDevices`

- **Request Type**: `OSKRemoveAllUSerDevicesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `getAllUserInvitations`

- **Request Type**: `OSKGetAllUserInvitationsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `removeAllUserInvitations`

- **Request Type**: `OSKRemoveAllUserInvitationsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `removeUserInvitations`

- **Request Type**: `OSKRemoveUserInvitationsRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `invitations` | `OSKUserInvitationToRemove[]` | No |

### `createUserInvitationAccess`

- **Request Type**: `OSKCreateInvitationAccessRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `adminOrganizationId` | `string` | No |
| `userId` | `string` | No |
| `buildingId` | `any` | No |
| `unitId` | `any` | No |
| `invitationId` | `any` | No |

### `getAllUserAccesses`

- **Request Type**: `OSKGetAllUserAccessesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `getUserAccessById`

- **Request Type**: `OSKGetUserAccessByIdRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `userAccessId` | `string` | No |

### `removeUserAccesses`

- **Request Type**: `OSKRemoveUserAccessesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `userAccesses` | `OSKUserAccesses[]` | No |

### `removeAllUserAccesses`

- **Request Type**: `OSKRemoveAllUserAccessesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |

### `removeUserAccessAccesses`

- **Request Type**: `OSKRemoveUserAccessAccessesRequestData`
- **Response Type**: `Promise<void>` / `Promise<any>`
- **Source File**: `functions/src/modules/admin/modules/admin_users/index.ts` (Line undefined)

#### Request Payload Schema
| Property Name | Property Type | Optional |
| :--- | :--- | :--- |
| `userId` | `string` | No |
| `adminOrganizationId` | `string` | No |
| `userAccess` | `OSKUserAccesses` | No |
| `accessIds` | `string[]` | No |

---

## 3. Data Models & Type Definitions (43 Types)

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKWithAdminOrganizationId` | `{     adminOrganizationId: string; }` | `functions/src/modules/admin/models/with_admin_organization_id.model.ts` |
| `OSKBuildingUnit` | `Pick<OSKBuildingUnitDocument, 'name' \| 'unitId' \| 'unitNumber'>` | `functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts` |
| `OSKGetAllBuildingsWithUnitsResponseData` | `Pick<OSKBuildingDocument, 'buildingId' \| 'name'> & {     units: OSKBuildingUnit[]; }` | `functions/src/modules/admin/modules/admin_buildings/models/functions/get_all_buildings_with_units_request.type.ts` |
| `OSKDbRecreateAccess` | `{     buildingIds: string[]; }` | `functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts` |
| `OSKDbBuildingAccessDocumentBadAccesses` | `Omit<OSKBuildingAccessDocument, 'accesses'> & {     accesses?: OSKAccess[]; }` | `functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts` |
| `OSKDbUserAccessDocumentBadAccesses` | `Omit<OSKUserAccessesDocument, 'accesses'> & {     accesses?: OSKAccess[]; }` | `functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts` |
| `OSKDbAccessArraysForMaintenance` | `{     buildingIds: string[]; }` | `functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts` |
| `OSKDbAccessWithUserId` | `OSKAccess & {     userId: string; }` | `functions/src/modules/admin/modules/admin_maintenance/db_accesses/models/recreate_accesses.model.ts` |
| `callTransferListIdsByBuilding` | `{     buildingId: string;     callTransferListIds?: string[]; }` | `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` |
| `flatCallTransferListIdsWithBuilding` | `{     callTransferListId: string;     buildingId: string; }` | `functions/src/modules/admin/modules/admin_maintenance/db_intercoms/services/db_intercoms.service.ts` |
| `OSKDbRefreshPincodes` | `{     buildingId: string; }` | `functions/src/modules/admin/modules/admin_maintenance/db_pincodes/models/refresh_pincodes.model.ts` |
| `OSKDbPincodeInhabitantNewDocument` | `OSKBuildingPincodeInhabitantDocument & {     newPincode: string; }` | `functions/src/modules/admin/modules/admin_maintenance/db_pincodes/models/refresh_pincodes.model.ts` |
| `OSKOrganizationList` | `{     userId: string;     organizationId: string;     name: string;     taxNumber: string;     streetAddress: OSKStre...` | `functions/src/modules/admin/modules/admin_organization/models/documents/organization_listdocument.model.ts` |
| `OSKOrganizationListDocument` | `OSKDocument<OSKOrganizationList>` | `functions/src/modules/admin/modules/admin_organization/models/documents/organization_listdocument.model.ts` |
| `OSKGetAllOrganizationsListRequestDocument` | `{     adminsOskeyId: string; }` | `functions/src/modules/admin/modules/admin_organization/models/functions/get_organizations_list_request_document.model.ts` |
| `OSKGetOrganizationsDetailsByIdRequestDocument` | `{     adminsOskeyId: string;     OrganizationId: string; }` | `functions/src/modules/admin/modules/admin_organization/models/functions/organizations_details_by_id_request_document.ts` |
| `OSKGetOrganizationsDetailsByIdResponseDocument` | `OSKOrganizationList & {    // user: OSKUserDocument \| undefined; }` | `functions/src/modules/admin/modules/admin_organization/models/functions/organizations_details_by_id_request_document.ts` |
| `OSKGiveInhabitantAccessRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         buildingId: string;         unitId: string;         doorId...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKGetInhabitantUserUnitsRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKInhabitantUnitData` | `OSKBuildingUnitInhabitant & { buildingName: string }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKGetInhabitantUserUnitsResponseData` | `{     [key: string]: OSKInhabitantUnitData[]; }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKRemoveInhabitantFromUnitRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         buildingId: string;         unitId: string;     }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKAddInhabitantFromUnitRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         buildingId: string;         unitId: string;         inhabi...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKAddInhabitantFromUnitResponseData` | `{     inhabitantId: string;     accessId?: string; }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_inhabitant_user.requests.model.ts` |
| `OSKGetAllUserAccessesRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_accesses_requests.model.ts` |
| `OSKGetUserAccessByIdRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         userAccessId: string;     }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_accesses_requests.model.ts` |
| `OSKRemoveAllUserAccessesRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_accesses_requests.model.ts` |
| `OSKRemoveUserAccessesRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         userAccesses: OSKUserAccesses[];     }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_accesses_requests.model.ts` |
| `OSKRemoveUserAccessAccessesRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         userAccess: OSKUserAccesses;         accessIds: string[]; ...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_accesses_requests.model.ts` |
| `OSKGetUserDevicesRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_devices_requests.model.ts` |
| `OSKGetUserDevicesResponseData` | `Pick<OSKUserDevice, 'deviceId' \| 'name' \| 'type' \| 'isLocked' \| 'isStolen'>` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_devices_requests.model.ts` |
| `OSKRemoveAllUSerDevicesRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_devices_requests.model.ts` |
| `OSKRemoveUserDevicesRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         deviceIds: string[];     }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_devices_requests.model.ts` |
| `OSKGetAllUserInvitationsRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_invitations_requests.model.ts` |
| `OSKRemoveAllUserInvitationsRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_invitations_requests.model.ts` |
| `OSKRemoveUserInvitationsRequestData` | `OSKRemoveAllUserInvitationsRequestData & {     invitations: OSKUserInvitationToRemove[]; }` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_invitations_requests.model.ts` |
| `OSKUserInvitationToRemove` | `Pick<OSKUserInvitationReceived, 'unitId' \| 'buildingId' \| 'invitationId'> &     Partial<OSKUserInvitationReceived>` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_invitations_requests.model.ts` |
| `OSKCreateInvitationAccessRequestData` | `OSKWithAdminOrganizationId &     OSKWithUserId &     Pick<OSKUserInvitationReceived, 'buildingId' \| 'unitId' \| 'inv...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_invitations_requests.model.ts` |
| `OSKGetAllUsersRequestData` | `OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_requests.model.ts` |
| `OSKGetUserByIdRequestData` | `OSKWithUserId & OSKWithAdminOrganizationId` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_requests.model.ts` |
| `OSKGetUserByIdResponseData` | `OSKUserDocument & {     invitationsCount: number;     devicesCount: number;     userAccessesCount: number;     inhabi...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_requests.model.ts` |
| `OSKDeleteUserDataRequestData` | `OSKWithUserId &     OSKWithAdminOrganizationId & {         invitations: boolean;         devices: boolean;         ac...` | `functions/src/modules/admin/modules/admin_users/models/functions/admin_user_requests.model.ts` |
| `OSKWithUserId` | `{     userId: string; }` | `functions/src/modules/admin/modules/admin_users/models/shared/with_user_id.model.ts` |
