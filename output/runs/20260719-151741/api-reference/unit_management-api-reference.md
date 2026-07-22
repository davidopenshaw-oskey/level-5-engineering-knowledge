# API Reference: unit_management

## 0. Generation Metadata

- **Run ID**: 20260719-151741
- **Generated At**: 2026-07-19T15:17:47.457Z

---

## 1. Callable Functions

### Interpretation

The `unit_management` module exposes HTTPS callable functions that serve as public entry points for backend operations.

### Callable Functions

| Handler Name | Request Type | Request Schema |
| :--- | :--- | :--- |
| `createUnitInvitation` | `OSKUnitInvitation` | ```json
{
  "inviterId": "string",
  "firstName": "string",
  "lastName": "string",
  "buildingId": "string",
  "unitId": "string",
  "doors": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_door/models/documents/building_door_document.model\").OSKUserDoor[]",
  "accessMethods": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/core/modules/access/models/access_method.model\").OSKAccessMethod | undefined",
  "invitees": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/unit_management/models/documents/unit_management_invitation_document\").OSKUnitInvitationInvitees[]",
  "confidentiality": "string | undefined",
  "callForwarding": "string | undefined",
  "modificationDate": "FirebaseFirestore.Timestamp | undefined"
}
``` |
| `removeInhabitantFromUnit` | `OSKUnitManagementRemoveInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantToRemoveId": "string"
}
``` |
| `removePendingInvitation` | `OSKUnitManagementRemovePendingInvitationRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inviterId": "string",
  "emailOrPhone": "\"email\" | \"phone\"",
  "value": "string"
}
``` |
| `updateInhabitant` | `OSKUnitManagementChangeInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantToChangeUserId": "string",
  "newInhabitantType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_type_document.model\").OSKBuildingUnitInhabitantType | undefined",
  "residentRights": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/building/modules/building_unit/models/documents/building_unit_inhabitant_document.model\").OSKResidentRights | undefined"
}
``` |
| `removePermanentGuest` | `OSKUnitManagementRemovePermanentGuestRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestUserId": "string"
}
``` |
| `getPermanentGuest` | `OSKUnitManagementGetPermanentGuestRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "permanentGuestUserId": "string"
}
``` |
| `getAllUnitInhabitantsAndGuests` | `OSKUnitManagementGetUnitInhabitantsRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getSingleUnitInhabitant` | `OSKUnitManagementGetSingleUnitInhabitantRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "inhabitantUserId": "string"
}
``` |
| `getUnitInvitationsByUserId` | `OSKUnitInvitationsGetByUserIdRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string"
}
``` |
| `getUnitPerson` | `OSKUnitManagementPeopleRequest` | ```json
{
  "userId": "string",
  "buildingId": "string",
  "unitId": "string",
  "targetUserId": "string | undefined",
  "callType": "import(\"/Users/davidopenshaw/Documents/clients/oskey/development/working/firebase-oskey-dev/functions/src/modules/unit_management/models/functions/unit_management_inhabitant_response_document\").OSKUnitRequestType",
  "emailOrPhone": "string | undefined",
  "value": "string | undefined"
}
``` |

### Evidence Used

- API Contract: The `unit_management-evidence-graph.json` file contains 10 distinct `api_contract` facts, each defining a callable function, its handler, and its request schema.
- Call Expression: The `getCallableFunctionTriggers` function in `functions/src/modules/unit_management/index.ts` registers these handlers.

### Confidence

High.
