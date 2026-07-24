# API Reference: building

## 0. Generation Metadata

- **Run ID**: 20260724_145948-1aa319b1
- **Generated At**: 2026-07-24T14:59:50.608Z

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

---

## 2. Domain Types & Enums

### Enums

| Enum Name | Members | File |
| :--- | :--- | :--- |
| `OSKAccessControlDeviceActivityType` | `PINCODE = pincode`, `BLE = ble`, `SESAME = sesame`, `CALL = call` | `functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts` |
| `OSKOperationType` | `Create = create`, `Update = update`, `Delete = delete` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |

### Type Aliases

| Type Name | Definition / Union Values | File |
| :--- | :--- | :--- |
| `OSKBuilding` | `{     buildingId: string;     name?: string;     imageFilename?: string;     organizationId: string;     propertyId: ...` | `functions/src/modules/building/models/documents/building_document.model.ts` |
| `OSKBuildingWithDoors` | `OSKBuilding & {     doors: OSKBuildingDoorDocument[]; }` | `functions/src/modules/building/models/documents/building_document.model.ts` |
| `OSKBuildingWithDoorsDocument` | `OSKDocument<OSKBuildingWithDoors>` | `functions/src/modules/building/models/documents/building_document.model.ts` |
| `OSKBuildingDocument` | `OSKDocument<OSKBuilding>` | `functions/src/modules/building/models/documents/building_document.model.ts` |
| `OSKBuildingUpdate` | `{     name?: string;     imageFilename?: string;     streetAddress?: OSKStreetAddress; }` | `functions/src/modules/building/models/documents/building_document.model.ts` |
| `OSKBuildingGetAllByPropertyRequest` | `{     propertyId: string;     organizationId: string;     accessControlDeviceType?: OSKAccessControlDeviceType; }` | `functions/src/modules/building/models/functions/building_request.model.ts` |
| `OSKPropertyAssigningBuildingRequestData` | `{     organizationId: string;     oldPropertyId?: string;     newPropertyId: string;     buildingId: string;     buil...` | `functions/src/modules/building/models/functions/building_request.model.ts` |
| `deleteBuildingImageRequest` | `{     buildingId: string;     filename: string; }` | `functions/src/modules/building/models/functions/building_request.model.ts` |
| `OSKBuildingAccess` | `{     accesses: OSKAccess[];     userId: string;     userFirstName?: string;     userLastName?: string;     buildingI...` | `functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts` |
| `OSKBuildingAccessDocument` | `OSKDocument<OSKBuildingAccess>` | `functions/src/modules/building/modules/building_accesses/models/documents/building_access_document.model.ts` |
| `OSKBuildingActivity` | `{     activityId: string;     accessControlDeviceId: string;     acdType: string; // This maps to source (e.g., "inte...` | `functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts` |
| `OSKBuildingActivityDocument` | `OSKDocument<OSKBuildingActivity>` | `functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts` |
| `RawIotActivityPayload` | `{     type: 'state' \| 'systemLog' \| 'accessCommand' \| 'activities'; // e.g., "activities"     entity: OSKBuildingA...` | `functions/src/modules/building/modules/building_activity/models/documents/building_activity_document.model.ts` |
| `OSKGetBuildingActivityByIdRequest` | `{     buildingId: string;     doorId: string;     activityId: string; }` | `functions/src/modules/building/modules/building_activity/models/functions/building_activities.model_request.ts` |
| `OSKGetAllBuildingActivitiesRequest` | `{     buildingId: string;     doorId: string; }` | `functions/src/modules/building/modules/building_activity/models/functions/building_activities.model_request.ts` |
| `OSKDeleteBuildingActivityByIdRequest` | `{     buildingId: string;     doorId: string;     activityId: string; }` | `functions/src/modules/building/modules/building_activity/models/functions/building_activities.model_request.ts` |
| `OSKDeleteAllBuildingActivitiesRequest` | `{     buildingId: string;     doorId: string; }` | `functions/src/modules/building/modules/building_activity/models/functions/building_activities.model_request.ts` |
| `OSKBuildingDoorAccessControlDevice` | `OSKAccessControlDevice` | `functions/src/modules/building/modules/building_door/models/documents/building_door_access_control_device_document.model.ts` |
| `OSKBuildingDoorAccessControlDeviceDocument` | `OSKDocument<OSKBuildingDoorAccessControlDevice>` | `functions/src/modules/building/modules/building_door/models/documents/building_door_access_control_device_document.model.ts` |
| `OSKBuildingDoorAccessControlDevicePublicKeyDocument` | `{     publicKey: string;     publicKeyDecompressed: string;     creationDate: Timestamp;     buildingId: string;     ...` | `functions/src/modules/building/modules/building_door/models/documents/building_door_access_control_device_public_key_document.model.ts` |
| `OSKBuildingDoor` | `OSKBuildingDoorInfo & {     isForAllResidents: boolean; }` | `functions/src/modules/building/modules/building_door/models/documents/building_door_document.model.ts` |
| `OSKBuildingDoorDocument` | `OSKDocument<OSKBuildingDoor>` | `functions/src/modules/building/modules/building_door/models/documents/building_door_document.model.ts` |
| `OSKBuildingDoorUpdate` | `{     name?: string;     isForAllResidents?: boolean;     streetAddress?: OSKStreetAddress; }` | `functions/src/modules/building/modules/building_door/models/documents/building_door_document.model.ts` |
| `OSKUserDoor` | `{     doorId: string;     name: string; }` | `functions/src/modules/building/modules/building_door/models/documents/building_door_document.model.ts` |
| `OSKIntercomCallRecipient` | `{     callerId: string; // TODO: change "callerId" for more explicit "userId" (CLD1-853)     geoloc?: string; }` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_callTransferList_document.model.ts` |
| `OSKIntercomCallTransferListItem` | `{     callRecipients: OSKIntercomCallRecipient[];     sequenceNumber: number;     timeOut?: number; }` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_callTransferList_document.model.ts` |
| `OSKIntercomCallTransferList` | `{     buildingId: string;     intercomId: string;     unitId: string;     callTransferList: OSKIntercomCallTransferLi...` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_callTransferList_document.model.ts` |
| `OSKIntercomCallTransferListDocument` | `OSKDocument<OSKIntercomCallTransferList>` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_callTransferList_document.model.ts` |
| `OSKIntercomCallTimeSlot` | `{     startTime: string;     endTime: string; }` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKIntercomUnitInhabitant` | `{     userId: string;     firstName: string;     lastName: string;     inhabitantType: OSKBuildingUnitInhabitantType; }` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKCallSettingsMode` | `'sequential' \| 'dynamic' \| 'simultaneous'` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKIntercomInhabitantType` | `'residential' \| 'commercial' \| 'quickaccess'` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKBuildingIntercomEntry` | `{     entryId: string; // usually same as unitId, might differ, ex: a doctor entry in the same unitId he/her is livin...` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKBuildingIntercom` | `{     accessControlDeviceId: string;     buildingId: string;     doorId: string;     ACDName: string;     doorName: s...` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKBuildingIntercomDocument` | `OSKDocument<OSKBuildingIntercom>` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKBuildingIntercomDocumentWithModificationDate` | `OSKDocument<OSKBuildingIntercom> & {     modificationDate: Timestamp; }` | `functions/src/modules/building/modules/building_intercom/models/documents/building_intercom_document.model.ts` |
| `OSKIntercomCallTransferListRequest` | `{     userId: string;     unitId: string;     buildingId: string;     callTransferList: OSKUserIntercomCallTransferLi...` | `functions/src/modules/building/modules/building_intercom/models/functions/building_intercom_request.model.ts` |
| `OSKBuildingIntercomDisplayNameRequest` | `{     buildingId: string;     unitId: string;     newDisplayName: string; }` | `functions/src/modules/building/modules/building_intercom/models/functions/building_intercom_request.model.ts` |
| `OSKBuildingIntercomEntryDeleteRequest` | `{     organizationId: string;     buildingId: string;     entryId: string; }` | `functions/src/modules/building/modules/building_intercom/models/functions/building_intercom_request.model.ts` |
| `OSKBuildingIntercomEntryPubsubMessage` | `{     contactId: string;     displayName: string;     unitDisplayName: string; // TODO: to remove when intercom not u...` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKBuildingIntercomPubsubMessageBase` | `{     accessControlDeviceId: string;     operation: OSKOperationType;     allowUnitNumber: boolean;     creationDate:...` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKBuildingIntercomPubsubMessageCreate` | `OSKBuildingIntercomPubsubMessageBase & {     operation: OSKOperationType.Create; }` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKBuildingIntercomPubsubMessageUpdate` | `OSKBuildingIntercomPubsubMessageBase & {     entries: OSKBuildingIntercomEntryPubsubMessage[];     operation: OSKOper...` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKBuildingIntercomPubsubMessageDelete` | `Pick<OSKBuildingIntercomPubsubMessageBase, 'accessControlDeviceId'> & {     operation: OSKOperationType.Delete; }` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKBuildingIntercomPubsubMessage` | `\| OSKBuildingIntercomPubsubMessageCreate     \| OSKBuildingIntercomPubsubMessageUpdate     \| OSKBuildingIntercomPub...` | `functions/src/modules/building/modules/building_intercom/models/messages/building_intercom_messages.model.ts` |
| `OSKPincodeTrashStatus` | `'active' \| 'expired' \| 'deleted'` | `functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts` |
| `OSKBuildingPincodeTrashDocument` | `OSKBuildingPincodeDocument & {     status: OSKPincodeTrashStatus;     lastStatusUpdate: Timestamp;     // The date af...` | `functions/src/modules/building/modules/building_pincode_trash/models/documents/building_pincode_trash_document.model.ts` |
| `OSKBuildingPincodeBaseDocument` | `{     pincode: string;     userId: string;     buildingId: string;     doors: OSKUserDoor[];     accessId: string;   ...` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodeInhabitantDocument` | `OSKBuildingPincodeBaseDocument & {     type: OSKPincodeType.Inhabitant;     unitId: string; }` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodeGuestDocument` | `OSKBuildingPincodeBaseDocument & {     type: OSKPincodeType.Guest;     unitId: string;     inviterId: string;     inv...` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodePermanentGuestDocument` | `OSKBuildingPincodeBaseDocument & {     type: OSKPincodeType.PermanentGuest;     unitId: string;     inviterId: string...` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodeAnonymousDocument` | `OSKBuildingPincodeBaseDocument & {     type: OSKPincodeType.Anonymous;     unitId: string; }` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodeSupplierDocument` | `OSKBuildingPincodeBaseDocument & {     type: OSKPincodeType.Supplier; }` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKBuildingPincodeDocument` | `\| OSKBuildingPincodeInhabitantDocument     \| OSKBuildingPincodeGuestDocument     \| OSKBuildingPincodeAnonymousDocu...` | `functions/src/modules/building/modules/building_pincode/models/documents/building_pincode_document.model.ts` |
| `OSKAccessMethods` | `{     bluetooth: boolean;     pinCode: boolean;     faceRec: boolean;     NFC: boolean;     sesame: boolean; }` | `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` |
| `OSKSettingsPincodeType` | `'inhabitant' \| 'anonymous' \| 'guest' \| 'supplier'` | `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` |
| `OSKBuildingSettingsDocument` | `OSKDocument<OSKBuildingSettings>` | `functions/src/modules/building/modules/building_settings/models/documents/building_settings.model.ts` |
| `OSKBuildingSettingsCreateRequest` | `{     buildingId: string;     buildingSettingsInputParams: OSKBuildingSettingsInputParams; }` | `functions/src/modules/building/modules/building_settings/models/functions/building_settings_request.model.ts` |
| `OSKBuildingGetAllSettingsRequest` | `{     buildingId: string; }` | `functions/src/modules/building/modules/building_settings/models/functions/building_settings_request.model.ts` |
| `OSKBuildingGetSettingsRequest` | `{     buildingId: string;     settingsId: string; }` | `functions/src/modules/building/modules/building_settings/models/functions/building_settings_request.model.ts` |
| `OSKBuildingDeleteOrResetSettingsRequest` | `{     buildingId: string;     settingsId: string; }` | `functions/src/modules/building/modules/building_settings/models/functions/building_settings_request.model.ts` |
| `OSKBuildingUpdateSettingsRequest` | `{     buildingId: string;     update: Partial<OSKBuildingSettingsInputParams>; }` | `functions/src/modules/building/modules/building_settings/models/functions/building_settings_request.model.ts` |
| `OSKBuildingUnit` | `{     buildingId: string;     unitId: string;     buildingName?: string;     buildingImageFilename?: string;     name...` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts` |
| `OSKBuildingUnitDocument` | `OSKDocument<OSKBuildingUnit>` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model.ts` |
| `OSKBuildingUnitDoor` | `OSKBuildingDoorInfo & {     unitId: string;     isForAllResidents: boolean; }` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_door_document.model.ts` |
| `OSKBuildingUnitDoorDocument` | `OSKDocument<OSKBuildingUnitDoor>` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_door_document.model.ts` |
| `OSKBuildingUnitDoorUpdate` | `{     name?: string;     isForAllResidents?: boolean;     streetAddress?: OSKStreetAddress; }` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_door_document.model.ts` |
| `OSKResidentRights` | `{     sendInvitations: 'none' \| 'all' \| 'public';     othersInvitations: {         visible: boolean; // if the resi...` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts` |
| `OSKBuildingUnitInhabitant` | `{     buildingId: string;     unitId: string;     userId: string;     firstName: string;     lastName: string;     st...` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts` |
| `OSKBuildingUnitInhabitantDocument` | `OSKDocument<OSKBuildingUnitInhabitant>` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model.ts` |
| `OSKBuildingUnitInhabitantInvitationDocument` | `OSKDocument<OSKBuildingUnitInhabitantInvitation>` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_invitation_document.model.ts` |
| `OSKBuildingUnitInhabitantType` | `'owner' \| 'tenant' \| 'resident'` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model.ts` |
| `OSKBuildingUnitPermanentGuest` | `{     buildingId: string;     unitId: string;     userId: string;     firstName: string;     lastName: string;     st...` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_permanent_guest_document.model.ts` |
| `OSKBuildingUnitPermanentGuestDocument` | `OSKDocument<OSKBuildingUnitPermanentGuest>` | `functions/src/modules/building/modules/building_unit/models/documents/building_unit_permanent_guest_document.model.ts` |
| `OSKNonAppUserAccess` | `OSKAccessBase & {     type: OSKUserAccessType.NonAppUser;     unitId: string;     inviterId: string;     inviterName:...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_access.model.ts` |
| `OSKNonAppUserAccessesDocument` | `OSKDocument<{     nonAppUserId: string;     buildingId: string;     accesses: OSKNonAppUserAccess[];     creationDate...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_accesses_document.model.ts` |
| `OSKNonAppUserActivity` | `{     activityId: string;     accessControlDeviceId: string;     acdType: string; // This maps to source (e.g., "inte...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_activity_document.model.ts` |
| `OSKNonAppUserActivityAggregate` | `{     activities: OSKNonAppUserActivity[]; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_activity_document.model.ts` |
| `OSKNonAppUserActivityDocument` | `OSKDocument<OSKNonAppUserActivity>` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_activity_document.model.ts` |
| `OSKNonAppUserActivityAggregateDocument` | `OSKDocument<OSKNonAppUserActivityAggregate>` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_activity_document.model.ts` |
| `OSKBuildingUnitNonAppUser` | `{     nonAppUserId?: string;     buildingId: string;     unitId: string;     fullName: string;     email?: string;   ...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts` |
| `OSKBuildingUnitNonAppUserDocument` | `OSKDocument<OSKBuildingUnitNonAppUser>` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_document.model.ts` |
| `OSKNonAppUserPincode` | `{     pincode: string;     buildingId: string;     accessId: string;     type: OSKPincodeType;     creationDate: Time...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_pincode.model.ts` |
| `OSKNonAppUserPincodeDocument` | `OSKDocument<OSKNonAppUserPincode>` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/documents/building_unit_nonAppUser_pincode.model.ts` |
| `OSKCreateNonAppUserWithAccessRequest` | `Omit<OSKBuildingUnitNonAppUser, 'nonAppUserId'> & {     doorIds?: string[]; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKAddNonAppUserRequest` | `Omit<OSKBuildingUnitNonAppUser, 'nonAppUserId'>` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKUpdateNonAppUserRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string;     dataToUpdate: OSKDocumentUpdate<OSKBuildi...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKGetNonAppUserRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKGetAllNonAppUsersRequest` | `{ buildingId: string; unitId: string }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKDeleteNonAppUserRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKCreateNonAppUserAccessRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string;     doorIds?: string[];     startDate: Date; ...` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKCreateNonAppUserwithAccessResponse` | `{     nonAppUserId: string;     accessId: string;     pincode: string;     fullName: string; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKDeleteNonAppUserAccessRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string;     accessId: string; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKUpdateNonAppUserAccessDoorsRequest` | `{     buildingId: string;     unitId: string;     nonAppUserId: string;     accessId: string;     doorIds?: string[]; }` | `functions/src/modules/building/modules/building_unit/modules/building_unit_nonAppUser/models/functions/building_unit_nonAppUser_request.model.ts` |
| `OSKBuildingUser` | `{     userId: string;     buildingId: string;     firstName: string;     lastName: string;     profileImageFilename?:...` | `functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts` |
| `OSKBuildingUserDocument` | `OSKDocument<OSKBuildingUser>` | `functions/src/modules/building/modules/building_user/models/documents/building_user_document.model.ts` |
