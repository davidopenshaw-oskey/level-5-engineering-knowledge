# API Reference: building

## 0. Generation Metadata

- **Run ID**: 20260724_091153-1aa319b1
- **Generated At**: 2026-07-24T10:08:08.798Z

---

## 1. Callable Functions

### Interpretation

The `building` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `getAllBuildings` | `OSKBuildingGetAllRequestData` | ```json
{
  "organizationId": "string"
}
``` |
| `getBuildingById` | `OSKBuildingGetRequest` | ```json
{
  "buildingId": "string",
  "organizationId": "string"
}
``` |
| `createOrganizationBuilding` | `OSKBuildingCreateRequest` | ```json
{
  "organizationId": "string",
  "propertyId": "string",
  "name": "string | undefined",
  "imageFilename": "string | undefined",
  "streetAddress": "OSKStreetAddress"
}
``` |
| `updateBuilding` | `OSKBuildingUpdateRequest` | ```json
{
  "buildingId": "string",
  "data": "Partial<OSKBuilding>",
  "organizationId": "string"
}
``` |
| `deleteBuildingImage` | `deleteBuildingImageRequest` | ```json
{
  "buildingId": "string",
  "filename": "string"
}
``` |
| `assigningBuildingToProperty` | `OSKPropertyAssigningBuildingRequestData` | ```json
{
  "organizationId": "string",
  "oldPropertyId": "string | undefined",
  "newPropertyId": "string",
  "buildingId": "string",
  "buildingData": "Partial<OSKBuilding>"
}
``` |
| `getBuildingsByPropertyId` | `OSKBuildingGetAllByPropertyRequest` | ```json
{
  "propertyId": "string",
  "organizationId": "string",
  "accessControlDeviceType": "OSKAccessControlDeviceType | undefined"
}
``` |
| `getActivityById` | `OSKGetBuildingActivityByIdRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string",
  "activityId": "string"
}
``` |
| `getAllBuildingActivities` | `OSKGetAllBuildingActivitiesRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string"
}
``` |
| `deleteBuildingActivityById` | `OSKDeleteBuildingActivityByIdRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string",
  "activityId": "string"
}
``` |
| `deleteAllBuildingActivities` | `OSKDeleteAllBuildingActivitiesRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string"
}
``` |
| `organizationUserCreateBuildingDoor` | `OSKBuildingDoorCreateRequest` | ```json
{
  "buildingId": "string",
  "name": "string",
  "streetAddress": "OSKStreetAddress",
  "isForAllResidents": "boolean",
  "organizationId": "string"
}
``` |
| `organizationUserUpdateBuildingDoor` | `OSKBuildingDoorUpdateRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string",
  "data": "Partial<Pick<OSKBuildingDoor, \"name\" | \"streetAddress\">>",
  "organizationId": "string"
}
``` |
| `organizationUserGetAllBuildingDoors` | `OSKWithOrganizationId & { buildingId: string }` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `organizationUserGetBuildingDoorById` | `OSKWithOrganizationId & { buildingId: string; doorId: string }` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "doorId": "string"
}
``` |
| `deleteBuildingDoor` | `OSKBuildingDoorDeleteRequest` | ```json
{
  "buildingId": "string",
  "doorId": "string",
  "adminsOrganizationId": "string | undefined"
}
``` |
| `onUpdateBuildingIntercomsTransferList` | `OSKIntercomCallTransferListRequest` | ```json
{
  "userId": "string",
  "unitId": "string",
  "buildingId": "string",
  "callTransferList": "OSKUserIntercomCallTransferListItem[]"
}
``` |
| `updateIntercomDisplayName` | `OSKBuildingIntercomDisplayNameRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "newDisplayName": "string"
}
``` |
| `deleteIntercomDisplayName` | `OSKBuildingIntercomEntryDeleteRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "entryId": "string"
}
``` |
| `createBuildingSettings` | `OSKBuildingSettingsCreateRequest` | ```json
{
  "buildingId": "string",
  "buildingSettingsInputParams": "OSKBuildingSettingsInputParams"
}
``` |
| `getResidentSettings` | `OSKBuildingGetSettingsRequest` | ```json
{
  "buildingId": "string",
  "settingsId": "string"
}
``` |
| `updateBuildingSettings` | `OSKBuildingUpdateSettingsRequest` | ```json
{
  "buildingId": "string",
  "update": "Partial<OSKBuildingSettingsInputParams>"
}
``` |
| `deleteBuildingSettings` | `OSKBuildingDeleteOrResetSettingsRequest` | ```json
{
  "buildingId": "string",
  "settingsId": "string"
}
``` |
| `resetBuildingSettings` | `OSKBuildingDeleteOrResetSettingsRequest` | ```json
{
  "buildingId": "string",
  "settingsId": "string"
}
``` |
| `organizationUserCreateBuildingUnit` | `OSKBuildingUnitCreateRequest` | ```json
{
  "buildingId": "string",
  "name": "string",
  "floor": "string",
  "unitNumber": "string",
  "streetAddress": "OSKStreetAddress",
  "organizationId": "string",
  "capacity": "string"
}
``` |
| `organizationUserUpdateBuildingUnit` | `OSKBuildingUnitUpdateRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "data": "{ name: string; floor: string; unitNumber: string; streetAddress?: OSKStreetAddress | undefined; }",
  "organizationId": "string"
}
``` |
| `organizationUserGetAllBuildingUnits` | `OSKWithOrganizationId & { buildingId: string }` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `organizationUserGetBuildingUnitById` | `OSKWithOrganizationId & { buildingId: string; unitId: string }` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `deleteBuildingUnit` | `OSKBuildingUnitDeleteRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "adminsOrganizationId": "string | undefined"
}
``` |
| `createNonAppUser` | `OSKAddNonAppUserRequest` | ```json
{
  "buildingId": "any",
  "unitId": "any",
  "fullName": "any",
  "email": "any",
  "phone": "any",
  "inviterId": "any"
}
``` |
| `getNonAppUser` | `OSKGetNonAppUserRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string"
}
``` |
| `getAllNonAppUsers` | `OSKGetAllNonAppUsersRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `updateNonAppUser` | `OSKUpdateNonAppUserRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string",
  "dataToUpdate": "UpdateData<OSKDocument<T>>"
}
``` |
| `deleteNonAppUser` | `OSKDeleteNonAppUserRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string"
}
``` |
| `createNonAppUserAccess` | `OSKCreateNonAppUserAccessRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string",
  "doorIds": "string[] | undefined",
  "startDate": "Date",
  "endDate": "Date"
}
``` |
| `createNonAppUserWithAccess` | `OSKCreateNonAppUserWithAccessRequest` | ```json
{
  "buildingId": "any",
  "unitId": "any",
  "fullName": "any",
  "email": "any",
  "phone": "any",
  "inviterId": "any",
  "doorIds": "string[] | undefined"
}
``` |
| `updateNonAppUserAccessDoors` | `OSKUpdateNonAppUserAccessDoorsRequest` | ```json
{
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string",
  "accessId": "string",
  "doorIds": "string[] | undefined"
}
``` |
| `createBuildingUser` | `OSKBuildingUserCreateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "accessRights": "OSKAccessRightWithTimestamp[]",
  "doors": "OSKDoorInfo[]",
  "userType": "OSKUserAccessType.OrganizationUser | OSKUserAccessType.OrganizationGuestUser"
}
``` |

### Evidence Used

- API Contract: The `building-evidence-graph.json` file contains 38 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/building/index.ts` registers these handlers.

### Confidence

High.
