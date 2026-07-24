# API Reference: admin

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.777Z

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
