# API Reference: admin

## 0. Generation Metadata

- **Run ID**: 20260724_101041-1aa319b1
- **Generated At**: 2026-07-24T10:10:48.099Z

---

## 1. Callable Functions

### Interpretation

The `admin` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `getAllBuildingsWithUnits` | `OSKWithAdminOrganizationId` | ```json
{
  "adminOrganizationId": "string"
}
``` |
| `onMaintenanceDeleteUsersIntercoms` | `{ userIds?: string[] }` | ```json
{
  "userIds": "string[] | undefined"
}
``` |
| `onMaintenanceDeleteBuildingsIntercoms` | `{ buildingIds?: string[] }` | ```json
{
  "buildingIds": "string[] | undefined"
}
``` |
| `onMaintenanceDeleteCallTransferLists` | `{
            callTransferListIdsByBuildings?: callTransferListIdsByBuilding[];
        }` | ```json
{
  "callTransferListIdsByBuildings": "callTransferListIdsByBuilding[] | undefined"
}
``` |
| `onMaintenanceCreateBuildingsIntercomBases` | `{ buildingIds?: string[] }` | ```json
{
  "buildingIds": "string[] | undefined"
}
``` |
| `onMaintenanceUpdateAccessControlDeviceModel` | `object` | ```json
{}
``` |
| `onMaintenanceCreateIntercomsByUsers` | `{ buildingIds?: string[] }` | ```json
{
  "buildingIds": "string[] | undefined"
}
``` |
| `onMaintenanceCreateResidents` | `{ organizationIds?: string[] }` | ```json
{
  "organizationIds": "string[] | undefined"
}
``` |
| `onMaintenanceUpdateResidentsWithUnitInfo` | `object` | ```json
{}
``` |
| `onMaintenanceCreateResidentSettingsForBuilding` | `object` | ```json
{}
``` |
| `onMaintenanceCreateUnitSettings` | `object` | ```json
{}
``` |
| `onMaintenanceAddIntercomDisplayNameField` | `object` | ```json
{}
``` |
| `onMaintenanceAddUnitNumberField` | `object` | ```json
{}
``` |
| `onMaintenanceCreateUserSettings` | `object` | ```json
{}
``` |
| `onMaintenanceLinkBuildingsToProperties` | `void` | ```json
{}
``` |
| `onMaintenanceSyncAuthDisplayNames` | `object` | ```json
{}
``` |
| `onMaintenanceDeleteIntercomDisplayNameField` | `object` | ```json
{}
``` |
| `onMaintenanceRecreateAccess` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onRemoveNonExistingUserAccessInBuildingALL` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onSyncBuildingAccessesWithUserAccessesAll` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onFixMissingMainAccessFieldsAll` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onRecreateTokensForBuildingUsersAll` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onRecreateAccessDocumentInMongoDbByBuildingAll` | `OSKDbRecreateAccess` | ```json
{
  "buildingIds": "string[]"
}
``` |
| `onMaintenanceRefreshPincodes` | `OSKDbRefreshPincodes` | ```json
{
  "buildingId": "string"
}
``` |
| `onMaintenanceIntercomAddUnitNumberFields` | `{ buildingId: string }` | ```json
{
  "buildingId": "string"
}
``` |
| `onMaintenanceCreateOrganizationsPrompt` | `{ organizationId: string }` | ```json
{
  "organizationId": "string"
}
``` |
| `executePincodeRefreshCallable` | `OSKPincodeRefreshTaskPayload` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "userId": "string",
  "accessId": "string",
  "oldPincode": "string",
  "isAppUser": "boolean"
}
``` |
| `getAllOrganizations` | `OSKGetAllOrganizationsListRequestDocument` | ```json
{
  "adminsOskeyId": "string"
}
``` |
| `getOrganizationDetailsById` | `OSKGetOrganizationsDetailsByIdRequestDocument` | ```json
{
  "adminsOskeyId": "string",
  "OrganizationId": "string"
}
``` |
| `getAllUsers` | `OSKGetAllUsersRequestData` | ```json
{
  "adminOrganizationId": "string"
}
``` |
| `getUserById` | `OSKGetUserByIdRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `deleteUserData` | `OSKDeleteUserDataRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "invitations": "boolean",
  "devices": "boolean",
  "accesses": "boolean"
}
``` |
| `giveInhabitantAccessToUnitInhabitant` | `OSKGiveInhabitantAccessRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "doorIds": "string[] | undefined"
}
``` |
| `getInhabitantUserUnits` | `OSKGetInhabitantUserUnitsRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `removeInhabitantFromUnit` | `OSKRemoveInhabitantFromUnitRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `addInhabitantToUnit` | `OSKAddInhabitantFromUnitRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantType": "OSKBuildingUnitInhabitantType | undefined",
  "doorIds": "string[] | undefined"
}
``` |
| `getAllUserDevices` | `OSKGetUserDevicesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `removeUserDevices` | `OSKRemoveUserDevicesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "deviceIds": "string[]"
}
``` |
| `removeAllUserDevices` | `OSKRemoveAllUSerDevicesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `getAllUserInvitations` | `OSKGetAllUserInvitationsRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `removeAllUserInvitations` | `OSKRemoveAllUserInvitationsRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `removeUserInvitations` | `OSKRemoveUserInvitationsRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "invitations": "OSKUserInvitationToRemove[]"
}
``` |
| `createUserInvitationAccess` | `OSKCreateInvitationAccessRequestData` | ```json
{
  "adminOrganizationId": "string",
  "userId": "string",
  "buildingId": "any",
  "unitId": "any",
  "invitationId": "any"
}
``` |
| `getAllUserAccesses` | `OSKGetAllUserAccessesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `getUserAccessById` | `OSKGetUserAccessByIdRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "userAccessId": "string"
}
``` |
| `removeUserAccesses` | `OSKRemoveUserAccessesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "userAccesses": "OSKUserAccesses[]"
}
``` |
| `removeAllUserAccesses` | `OSKRemoveAllUserAccessesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string"
}
``` |
| `removeUserAccessAccesses` | `OSKRemoveUserAccessAccessesRequestData` | ```json
{
  "userId": "string",
  "adminOrganizationId": "string",
  "userAccess": "OSKUserAccesses",
  "accessIds": "string[]"
}
``` |

### Evidence Used

- API Contract: The `admin-evidence-graph.json` file contains 48 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/admin/index.ts` registers these handlers.

### Confidence

High.

---

## 2. Domain Types & Enums

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
