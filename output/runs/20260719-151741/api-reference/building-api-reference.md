# API Reference: building

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.340Z

---

## 1. Callable Functions

### Interpretation

The `building` module exposes a large number of HTTPS callable functions, which serve as the primary backend API for the Property Manager Portal (PGO). These endpoints cover the full spectrum of administrative actions, from creating and managing the core entities (buildings, doors, units) to handling the complex workflows of inhabitant management, intercom configuration, and settings management. Access to these functions is secured by App Check and role-based permissions, ensuring that only authenticated administrators with the correct roles can perform these sensitive operations.

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
  "streetAddress": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/models/shared/street_address.model\").OSKStreetAddress"
}
``` |
| `updateBuilding` | `OSKBuildingUpdateRequest` | ```json
{
  "buildingId": "string",
  "data": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/models/documents/building_document.model\").OSKBuilding>",
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
  "buildingData": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/models/documents/building_document.model\").OSKBuilding>"
}
``` |
| `getBuildingsByPropertyId` | `OSKBuildingGetAllByPropertyRequest` | ```json
{
  "propertyId": "string",
  "organizationId": "string",
  "accessControlDeviceType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/access_control_device/models/documents/access_control_device_document.model\").OSKAccessControlDeviceType | undefined"
}
``` |
| `organizationUserCreateBuildingDoor` | `OSKBuildingDoorCreateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "name": "string",
  "isForAllResidents": "boolean"
}
``` |
| `organizationUserUpdateBuildingDoor` | `OSKBuildingDoorUpdateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "doorId": "string",
  "data": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_door/models/documents/building_door_document.model\").OSKBuildingDoor>"
}
``` |
| `organizationUserGetAllBuildingDoors` | `OSKBuildingDoorGetAllRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `organizationUserGetBuildingDoorById` | `OSKBuildingDoorGetRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "doorId": "string"
}
``` |
| `deleteBuildingDoor` | `OSKBuildingDoorDeleteRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "doorId": "string"
}
``` |
| `organizationUserCreateBuildingUnit` | `OSKBuildingUnitCreateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "name": "string",
  "floor": "string",
  "unitNumber": "string"
}
``` |
| `organizationUserUpdateBuildingUnit` | `OSKBuildingUnitUpdateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "data": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_document.model\").OSKBuildingUnit>"
}
``` |
| `organizationUserGetAllBuildingUnits` | `OSKBuildingUnitGetAllRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `organizationUserGetBuildingUnitById` | `OSKBuildingUnitGetRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `deleteBuildingUnit` | `OSKBuildingUnitDeleteRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getAllBuildingUsers` | `OSKBuildingUserGetAllRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `onUpdateBuildingIntercomsTransferList` | `OSKBuildingIntercomsUpdateTransferListRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "intercomId": "string",
  "unitId": "string",
  "contactId": "string",
  "callTransferList": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_intercoms/models/documents/building_intercom_calltransferlist_document.model\").OSKCallTransfer[]"
}
``` |
| `getBuildingSettings` | `OSKBuildingSettingsGetRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `updateBuildingSettings` | `OSKBuildingSettingsUpdateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "data": "Partial<import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_settings/models/documents/building_settings_document.model\").OSKBuildingSettings>"
}
``` |
| `resetBuildingSettings` | `OSKBuildingSettingsResetRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string"
}
``` |
| `getResidentSettings` | `OSKBuildingSettingsGetResidentSettingsRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "userId": "string"
}
``` |
| `getAllUnitInhabitantsAndGuests` | `OSKUnitManagementGetAllUnitInhabitantsAndGuestsRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getSingleUnitInhabitant` | `OSKUnitManagementGetSingleUnitInhabitantRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantId": "string"
}
``` |
| `removeInhabitantFromUnit` | `OSKUnitManagementRemoveInhabitantFromUnitRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantId": "string"
}
``` |
| `updateInhabitant` | `OSKUnitManagementUpdateInhabitantRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantId": "string",
  "inhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/models/documents/user_document.model\").OSKInhabitantType | undefined",
  "residentRights": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/unit_management/models/documents/inhabitant_document.model\").OSKResidentRights | undefined"
}
``` |
| `getPermanentGuest` | `OSKUnitManagementGetPermanentGuestRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestId": "string"
}
``` |
| `removePermanentGuest` | `OSKUnitManagementRemovePermanentGuestRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestId": "string"
}
``` |
| `updatePermanentGuest` | `OSKUnitManagementUpdatePermanentGuestRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestId": "string",
  "fromDate": "string",
  "toDate": "string"
}
``` |
| `getUnitInvitationsByUserId` | `OSKUnitManagementGetUnitInvitationsByUserIdRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `createUnitInvitation` | `OSKUnitManagementCreateUnitInvitationRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "invitees": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/unit_management/models/documents/pending_invitation_document.model\").OSKInvitee[]",
  "inhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/user/models/documents/user_document.model\").OSKInhabitantType"
}
``` |
| `consumeUnitInvitation` | `OSKUnitManagementConsumeUnitInvitationRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inviterId": "string",
  "invitee": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/unit_management/models/documents/pending_invitation_document.model\").OSKInvitee"
}
``` |
| `removePendingInvitation` | `OSKUnitManagementRemovePendingInvitationRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inviterId": "string",
  "invitee": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/unit_management/models/documents/pending_invitation_document.model\").OSKInvitee"
}
``` |
| `createNonAppUser` | `OSKBuildingUnitNonAppUserCreateRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "data": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/modules/non_app_user/models/documents/non_app_user_document.model\").OSKBuildingUnitNonAppUser"
}
``` |
| `createNonAppUserWithAccess` | `OSKBuildingUnitNonAppUserCreateWithAccessRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "data": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/modules/non_app_user/models/documents/non_app_user_document.model\").OSKBuildingUnitNonAppUser",
  "access": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/access/models/access_request.model\").OSKCreateAccess"
}
``` |
| `deleteNonAppUser` | `OSKBuildingUnitNonAppUserDeleteRequest` | ```json
{
  "organizationId": "string",
  "buildingId": "string",
  "unitId": "string",
  "nonAppUserId": "string"
}
``` |

### Evidence Used
-   API Contract: The `building-evidence-graph.json` file contains 38 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
-   Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/building/index.ts` uses `https.onCall` to register these handlers.

### Confidence

High.
